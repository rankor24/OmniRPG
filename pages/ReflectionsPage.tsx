




import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { get, set, keys as idbKeys } from 'idb-keyval';
import type { Reflection, Character, Lorebook, AppSettings, Persona, PromptTemplate, ReflectionProposal, Conversation, Memory, StylePreference, LorebookEntry, RpgItem, World } from '../types';
import { FileTextIcon, InboxIcon, LayoutDashboardIcon, ChatCollectionIcon } from '../components/icons';
import ReflectionReviewModal from '../components/ReflectionReviewModal';
import { v4 as uuidv4 } from 'uuid';
import InboxView from '../components/reflections/InboxView';
import DashboardView from '../components/reflections/DashboardView';
import CognitiveLogView from '../components/reflections/CognitiveLogView';
import { useWorldManager } from '../hooks/useWorldManager';

interface ReflectionsPageProps {
  characters: Character[];
  lorebooks: Lorebook[];
  appSettings: AppSettings;
  omniAiId: string;
  personas: Persona[];
  prompts: PromptTemplate[];
  allMemories: Memory[];
  stylePreferences: StylePreference[];
  libraryItems: RpgItem[];
  
  onUpdateCharacter: (character: Character) => void;
  onDeleteCharacter: (charId: string) => void;
  onUpdateLorebook: (lorebook: Lorebook) => void;
  onDeleteLorebook: (lorebookId: string) => void;
  onUpdateAppSettings: (settings: AppSettings) => void;
  onUpdatePersona: (persona: Persona) => void;
  onDeletePersona: (personaId: string) => void;
  onUpdatePrompt: (prompt: PromptTemplate) => void;
  onDeletePrompt: (promptId: string) => void;
  onCreateMemory: (content: string, scope: Memory['scope'], entityId?: string) => Promise<string>;
  onUpdateMemory: (id: string, content: string) => Promise<string>;
  onDeleteMemory: (id: string) => Promise<string>;
  onSaveStylePreference: (pref: StylePreference) => void;
  onDeleteStylePreference: (prefId: string) => void;
  onSaveItem: (item: RpgItem) => void;
  onDeleteItem: (itemId: string) => void;
}


type ReflectionTab = 'dashboard' | 'inbox' | 'log';

const applyArrayUpdates = async <T extends { id: string }>(
  originalArray: T[],
  updatedArray: T[],
  updateFn: (item: T) => void,
) => {
  const originalMap = new Map(originalArray.map(item => [item.id, JSON.stringify(item)]));
  const updatedMap = new Map(updatedArray.map(item => [item.id, item]));

  for (const [id, item] of updatedMap.entries()) {
    if (!originalMap.has(id) || originalMap.get(id) !== JSON.stringify(item)) {
      updateFn(item);
    }
  }
};


const ReflectionsPage: React.FC<ReflectionsPageProps> = (props) => {
  const {
    characters, lorebooks, appSettings, onUpdateCharacter, onUpdateLorebook,
    onUpdateAppSettings, omniAiId, personas, prompts, onUpdatePersona,
    onUpdatePrompt, allMemories, onCreateMemory, onUpdateMemory, onDeleteMemory,
    stylePreferences, onSaveStylePreference, onDeleteStylePreference,
    onDeleteCharacter, onDeleteLorebook, onDeletePersona, onDeletePrompt,
    libraryItems, onSaveItem, onDeleteItem
  } = props;

  // Use World Manager hook to access world operations
  const { worlds, createWorld, updateWorld, deleteWorld } = useWorldManager(omniAiId, libraryItems);

  const [allReflections, setAllReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReflectionTab>('inbox');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reflectionToReview, setReflectionToReview] = useState<Reflection | null>(null);

  useEffect(() => {
    const fetchReflections = async () => {
      setLoading(true);
      try {
        const allKeys = await idbKeys();
        const reflectionKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith('reflections_'));
        
        const reflectionsData: Reflection[] = [];
        for (const key of reflectionKeys) {
          const data = await get<Reflection[]>(key);
          if (data) reflectionsData.push(...data);
        }
        setAllReflections(reflectionsData);
      } catch (error) {
        console.error("Failed to fetch reflections:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReflections();
  }, []);

  const handleReviewClick = (reflection: Reflection) => {
    setReflectionToReview(reflection);
    setIsModalOpen(true);
  };
  
  const handleApplyProposals = async (reflection: Reflection, allProposalsFromModal: ReflectionProposal[]) => {
      // Filter out invalid proposals (e.g., adding/deleting system prompts) before processing.
      const validProposalsFromModal = allProposalsFromModal.filter(p => {
        if (p.type === 'instructionalPrompt' && p.action !== 'edit') {
            console.warn(`[Reflection System] Ignoring invalid proposal: Cannot '${p.action}' an instructionalPrompt.`);
            return false;
        }
        return true;
      });

      const proposalsToProcess = validProposalsFromModal.filter(p => p.status !== 'rejected');
      const finalProposalState = validProposalsFromModal.map(p => p.status === 'pending' ? { ...p, status: 'approved' as const } : p);

      // Create copies to apply changes to, for diffing later
      let charactersCopy = JSON.parse(JSON.stringify(characters));
      let lorebooksCopy = JSON.parse(JSON.stringify(lorebooks));
      let personasCopy = JSON.parse(JSON.stringify(personas));
      let promptsCopy = JSON.parse(JSON.stringify(prompts));
      let stylePreferencesCopy = JSON.parse(JSON.stringify(stylePreferences));
      // For items and worlds, we handle them via direct API calls as they are less frequent and have dedicated managers

      try {
        for (const proposal of proposalsToProcess) {
            const { type, action, content, updatedFields, targetId, characterId, scope, lorebookId, keywords, key, value, rationale } = proposal;

            if (type === 'memory') {
                if (action === 'add' && content && scope) {
                    let entityId: string | undefined;
                    if (scope === 'character') {
                        // Prioritize characterId from the proposal, fallback to the reflection's context.
                        entityId = proposal.characterId || reflection.characterId;
                    } else if (scope === 'conversation') {
                        entityId = reflection.conversationId;
                    }
                    await onCreateMemory(content, scope, entityId);
                } else if (action === 'edit' && targetId && content) {
                    await onUpdateMemory(targetId, content);
                } else if (action === 'delete' && targetId) {
                    await onDeleteMemory(targetId);
                }
                continue; // Memories are handled directly, not via diffing.
            }

            switch (type) {
                case 'character': {
                    const targetCharId = targetId || characterId;
                    if (action === 'add' && updatedFields) {
                        const newChar: Character = { id: uuidv4(), name: 'New Character', ...updatedFields, timestamp: new Date().toISOString() } as Character;
                        charactersCopy.push(newChar);
                    } else if (action === 'edit' && targetCharId && updatedFields) {
                        charactersCopy = charactersCopy.map((c: Character) => c.id === targetCharId ? { ...c, ...updatedFields, timestamp: new Date().toISOString() } : c);
                    } else if (action === 'delete' && targetCharId) {
                        onDeleteCharacter(targetCharId);
                        charactersCopy = charactersCopy.filter((c: Character) => c.id !== targetCharId);
                    }
                    break;
                }
                case 'lorebook': {
                    if (action === 'add' && updatedFields) {
                        const newLorebook: Lorebook = { id: uuidv4(), name: 'New Lorebook', description: '', entries: [], enabled: true, timestamp: new Date().toISOString(), ...updatedFields };
                        lorebooksCopy.push(newLorebook);
                    } else if (action === 'edit' && targetId && updatedFields) {
                        lorebooksCopy = lorebooksCopy.map((l: Lorebook) => l.id === targetId ? { ...l, ...updatedFields, timestamp: new Date().toISOString() } : l);
                    } else if (action === 'delete' && targetId) {
                        onDeleteLorebook(targetId);
                        lorebooksCopy = lorebooksCopy.filter((l: Lorebook) => l.id !== targetId);
                    }
                    break;
                }
                case 'lorebookEntry': {
                    const parentLorebook = lorebooksCopy.find((lb: Lorebook) => (action === 'add' && lb.id === lorebookId) || (action !== 'add' && lb.entries.some(e => e.id === targetId)));
                    if (parentLorebook) {
                        let updatedEntries = [...parentLorebook.entries];
                        let changed = false;
                        if (action === 'add' && content && keywords) {
                            updatedEntries.push({ id: uuidv4(), content, keywords, enabled: true, timestamp: new Date().toISOString() });
                            changed = true;
                        } else if (action === 'edit' && targetId) {
                            let entryChanged = false;
                            updatedEntries = updatedEntries.map(e => {
                                if (e.id === targetId) {
                                    entryChanged = true;
                                    return { ...e, content: content || e.content, keywords: keywords || e.keywords, timestamp: new Date().toISOString() };
                                }
                                return e;
                            });
                            if(entryChanged) changed = true;
                        } else if (action === 'delete' && targetId) {
                            const originalLength = updatedEntries.length;
                            updatedEntries = updatedEntries.filter(e => e.id !== targetId);
                            if(originalLength > updatedEntries.length) changed = true;
                        }
                        
                        if (changed) {
                            parentLorebook.entries = updatedEntries;
                            parentLorebook.timestamp = new Date().toISOString();
                        }
                    }
                    break;
                }
                 case 'persona': {
                    if (action === 'add' && updatedFields) {
                        const newPersona: Persona = { id: uuidv4(), name: 'New Persona', avatar: '', persona: '', ...updatedFields, timestamp: new Date().toISOString() };
                        personasCopy.push(newPersona);
                    } else if (action === 'edit' && targetId && updatedFields) {
                        personasCopy = personasCopy.map((p: Persona) => p.id === targetId ? { ...p, ...updatedFields, timestamp: new Date().toISOString() } : p);
                    } else if (action === 'delete' && targetId) {
                        onDeletePersona(targetId);
                        personasCopy = personasCopy.filter((p: Persona) => p.id !== targetId);
                    }
                    break;
                 }
                case 'prompt':
                    if (action === 'add' && updatedFields) {
                        promptsCopy.push({ id: uuidv4(), name: 'New Prompt', prompt: '', timestamp: new Date().toISOString(), ...updatedFields });
                    } else if (action === 'edit' && targetId && updatedFields) {
                        promptsCopy = promptsCopy.map((p: PromptTemplate) => p.id === targetId ? { ...p, ...updatedFields, timestamp: new Date().toISOString() } : p);
                    } else if (action === 'delete' && targetId) {
                        onDeletePrompt(targetId);
                        promptsCopy = promptsCopy.filter((p: PromptTemplate) => p.id !== targetId);
                    }
                    break;
                case 'stylePreference':
                     if (action === 'add' && content) {
                        stylePreferencesCopy.push({ id: uuidv4(), content, timestamp: new Date().toISOString(), characterName: reflection.characterName });
                    } else if (action === 'edit' && targetId && content) {
                        stylePreferencesCopy = stylePreferencesCopy.map((p: StylePreference) => p.id === targetId ? { ...p, content, timestamp: new Date().toISOString() } : p);
                    } else if (action === 'delete' && targetId) {
                        onDeleteStylePreference(targetId);
                        stylePreferencesCopy = stylePreferencesCopy.filter((p: StylePreference) => p.id !== targetId);
                    }
                    break;
                case 'instructionalPrompt':
                    if (action === 'edit' && targetId && updatedFields) {
                        const updatedSystemPrompts = appSettings.instructionalPrompts.map(p => 
                            p.id === targetId ? { ...p, ...updatedFields, timestamp: new Date().toISOString() } : p
                        );
                        onUpdateAppSettings({ ...appSettings, instructionalPrompts: updatedSystemPrompts });
                    }
                    break;
                case 'appSetting':
                    if (key && value !== undefined) {
                        let finalValue: any = value; try { finalValue = JSON.parse(value as string); } catch {}
                        onUpdateAppSettings({ ...appSettings, [key]: finalValue });
                    }
                    break;
                case 'conversation':
                    if (action === 'edit' && targetId) {
                        // Fallback logic for titles: check updatedFields.preview OR try to parse from rationale
                        let newTitle = (updatedFields as any)?.preview;
                        
                        if (!newTitle && rationale) {
                             const match = rationale.match(/changing it to '([^']+)'/i) || 
                                          rationale.match(/changing it to "([^"]+)"/i) ||
                                          rationale.match(/propose a new title: '([^']+)'/i) ||
                                          rationale.match(/propose a new title: "([^"]+)"/i) ||
                                          rationale.match(/title to '([^']+)'/i) ||
                                          rationale.match(/title to "([^"]+)"/i);
                             if (match && match[1]) {
                                 newTitle = match[1];
                             }
                        }

                        if (newTitle) {
                            const lsKey = `conversations_${omniAiId}`;
                            const storedConvosRaw = localStorage.getItem(lsKey);
                            if (storedConvosRaw) {
                                const convos: Conversation[] = JSON.parse(storedConvosRaw);
                                const updatedConvos = convos.map(c => c.id === targetId ? { ...c, preview: newTitle, hasCustomTitle: true } : c);
                                localStorage.setItem(lsKey, JSON.stringify(updatedConvos));
                            }
                        }
                    }
                    break;
                case 'item':
                    if (action === 'add' && updatedFields) {
                        onSaveItem({ id: uuidv4(), type: 'misc', quantity: 1, ...updatedFields });
                    } else if (action === 'edit' && targetId && updatedFields) {
                        const existingItem = libraryItems.find(i => i.id === targetId);
                        if (existingItem) {
                            onSaveItem({ ...existingItem, ...updatedFields });
                        }
                    } else if (action === 'delete' && targetId) {
                        onDeleteItem(targetId);
                    }
                    break;
                case 'world':
                    if (action === 'add' && updatedFields) {
                        await createWorld({ 
                            id: uuidv4(), 
                            createdAt: new Date().toISOString(), 
                            updatedAt: new Date().toISOString(),
                            mechanics: { useDice: true, statSystem: 'dnd5e', attributes: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] }, // defaults
                            theme: { font: 'serif', primaryColor: '#d97706', secondaryColor: '#78350f', uiSoundPack: 'fantasy' }, // defaults
                            lorebookIds: [],
                            startingScenarios: [],
                            ...updatedFields 
                        });
                    } else if (action === 'edit' && targetId && updatedFields) {
                        await updateWorld(targetId, updatedFields);
                    } else if (action === 'delete' && targetId) {
                        await deleteWorld(targetId);
                    }
                    break;
            }
        }

        // --- Apply changes by comparing original arrays with copies ---
        await applyArrayUpdates(characters, charactersCopy, onUpdateCharacter);
        await applyArrayUpdates(lorebooks, lorebooksCopy, onUpdateLorebook);
        await applyArrayUpdates(personas, personasCopy, onUpdatePersona);
        await applyArrayUpdates(prompts, promptsCopy, onUpdatePrompt);
        await applyArrayUpdates(stylePreferences, stylePreferencesCopy, onSaveStylePreference);
        
        const reflectionKey = `reflections_${reflection.conversationId}`;
        const conversationReflections = await get<Reflection[]>(reflectionKey) || [];
        const updatedReflections = conversationReflections.map(r => r.id === reflection.id ? { ...r, proposals: finalProposalState } : r);
        await set(reflectionKey, updatedReflections);

        setAllReflections(prev => prev.map(r => r.id === reflection.id ? { ...r, proposals: finalProposalState } : r));
         
        alert("Proposals applied successfully!");

      } catch (error) {
        console.error("Failed to apply reflection proposals:", error);
        alert(`An error occurred while applying the proposals: ${error instanceof Error ? error.message : String(error)}`);
      }
  };
  
    const handleBatchUpdateProposalsStatus = useCallback(async (
        proposalIdsToUpdate: Set<string>,
        status: 'approved' | 'rejected',
        rejectionReason?: string
    ) => {
        if (proposalIdsToUpdate.size === 0) return;
        try {
            let updatedCount = 0;
            const allKeys = await idbKeys();
            const reflectionKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith('reflections_'));

            const updatedAllReflectionsMap = new Map(allReflections.map(r => [r.id, JSON.parse(JSON.stringify(r))]));

            for (const key of reflectionKeys) {
                const reflectionsInKey = await get<Reflection[]>(key);
                if (!reflectionsInKey) continue;

                let keyWasModified = false;
                const updatedReflectionsInKey = reflectionsInKey.map(reflection => {
                    let reflectionWasModified = false;
                    const updatedProposals = reflection.proposals.map(p => {
                        if (proposalIdsToUpdate.has(p.id) && p.status === 'pending') {
                            reflectionWasModified = true;
                            updatedCount++;
                            return { ...p, status, rejectionReason: status === 'rejected' ? rejectionReason : undefined };
                        }
                        return p;
                    });

                    if (reflectionWasModified) {
                        keyWasModified = true;
                        const updatedReflection = { ...reflection, proposals: updatedProposals };
                        updatedAllReflectionsMap.set(reflection.id, updatedReflection);
                        return updatedReflection;
                    }
                    return reflection;
                });

                if (keyWasModified) {
                    await set(key, updatedReflectionsInKey);
                }
            }

            setAllReflections(Array.from(updatedAllReflectionsMap.values()));
            alert(`${updatedCount} proposal(s) have been ${status}.`);

        } catch (error) {
            console.error(`Failed to batch update proposals to ${status}:`, error);
            alert(`An error occurred during the batch update.`);
        }
    }, [allReflections]);

  const TABS: { id: ReflectionTab, name: string, icon: React.ReactNode }[] = [
    { id: 'inbox', name: 'Inbox', icon: <InboxIcon className="w-5 h-5"/> },
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboardIcon className="w-5 h-5"/> },
    { id: 'log', name: 'Log', icon: <ChatCollectionIcon className="w-5 h-5"/> },
  ];

  if (loading) {
    return (
        <div className="text-center py-10">
            <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-accent mx-auto"></div>
            <p className="mt-4 text-text-secondary">Loading reflections...</p>
        </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        <header className="mb-8 text-center flex-shrink-0">
          <h1 className="text-4xl font-bold text-text-primary mb-2">Reflections</h1>
          <p className="text-text-secondary">
            This is OmniRPG's cognitive log, where it records its thoughts and proposes self-improvements based on your conversations.
          </p>
        </header>

        <div className="mb-8 border-b border-tertiary flex justify-center flex-shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                ? 'border-b-2 border-accent text-accent'
                : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>
        
        {allReflections.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-tertiary rounded-lg">
                <p className="text-lg text-text-secondary">No reflections have been generated yet.</p>
                <p className="text-sm text-text-secondary opacity-70 mt-2">
                    Start a conversation, and OmniRPG will begin analyzing interactions here.
                </p>
            </div>
        ) : (
          <div className="animate-fade-in flex-grow min-h-0">
            {activeTab === 'inbox' && <InboxView allReflections={allReflections} onReviewClick={handleReviewClick} onBatchUpdate={handleBatchUpdateProposalsStatus} characters={props.characters} appSettings={props.appSettings} />}
            {activeTab === 'dashboard' && <DashboardView allReflections={allReflections} />}
            {activeTab === 'log' && <CognitiveLogView allReflections={allReflections} />}
          </div>
        )}
      </div>

      {isModalOpen && reflectionToReview && (
        <ReflectionReviewModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          reflection={reflectionToReview}
          onApply={handleApplyProposals}
          lorebooks={props.lorebooks}
          characters={props.characters}
          personas={props.personas}
          prompts={props.prompts}
          allMemories={allMemories}
          appSettings={props.appSettings}
          stylePreferences={stylePreferences}
          libraryItems={libraryItems}
          worlds={worlds}
        />
      )}
    </div>
  );
};

export default ReflectionsPage;