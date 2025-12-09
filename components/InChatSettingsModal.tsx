
import React, { useState, useEffect, useMemo } from 'react';
import type { Character, Lorebook, Conversation, ChatMessage, LoreEditProposal, LoreNewProposal, Persona, AppSettings } from '../types';
import { XIcon, BrainIcon, SaveIcon, TrashIcon, EyeIcon } from './icons';
import FileUpload from './FileUpload';
import { v4 as uuidv4 } from 'uuid';
import { useLocalStorage } from '../hooks/useLocalStorage';
import DiffView from './DiffView';
import { ChatSettings } from '../hooks/useChatSessionActions';

interface InChatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  personas: Persona[];
  appSettings: AppSettings;
  currentConversation: any; // Using `any` to avoid circular dependency issues if Conversation is imported
  onSave: (settings: ChatSettings) => void;
  currentBackground: string;
  isLoading: boolean;
  messages: ChatMessage[];
}

const ToggleSwitch: React.FC<{
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}> = ({ label, description, enabled, onChange, disabled = false }) => {
  const formLabelClass = "block text-sm font-medium text-text-primary";
  return (
    <div className={`flex justify-between items-center bg-tertiary p-3 rounded-md ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex-1 pr-4">
        <label className={formLabelClass}>{label}</label>
        <p className="text-xs text-text-secondary opacity-70">{description}</p>
      </div>
      <button
        onClick={() => !disabled && onChange(!enabled)}
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        className={`${
          enabled ? 'bg-accent' : 'bg-secondary'
        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-tertiary disabled:cursor-not-allowed`}
      >
        <span
          className={`${
            enabled ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
        />
      </button>
    </div>
  );
};


const InChatSettingsModal: React.FC<InChatSettingsModalProps> = ({
  isOpen,
  onClose,
  characters,
  personas,
  appSettings,
  currentConversation,
  onSave,
  currentBackground,
  isLoading,
  messages,
}) => {
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [background, setBackground] = useState('');
  const [isVisualizedMode, setIsVisualizedMode] = useState(false);
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [editorModeContextScope, setEditorModeContextScope] = useState<'full' | 'last_20' | 'last_10' | 'last_5' | 'last_3' | 'last_1'>('full');
  const [isIntelligenceInjected, setIsIntelligenceInjected] = useState(false);
  const { sfwMode } = appSettings;
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [isRpgMode, setIsRpgMode] = useState(false);
  
  const isRoleplaying = !!currentConversation?.sessionCharacterId;
  
  const attachments = useMemo(() => {
    if (!isOpen) return [];
    const allAttachments: string[] = [];
    messages.forEach(message => {
        if (message.images) {
            allAttachments.push(...message.images.map(img => img.url));
        }
        if (message.generatedImages) {
            allAttachments.push(...message.generatedImages.map(img => `data:image/jpeg;base64,${img.b64_json}`));
        }
    });
    return allAttachments;
  }, [isOpen, messages]);


  useEffect(() => {
    if (isOpen) {
      setSelectedCharId(currentConversation.sessionCharacterId ?? null);
      setBackground(currentBackground);
      setIsVisualizedMode(currentConversation.isVisualizedMode ?? false);
      setIsEditorMode(currentConversation.isEditorMode ?? false);
      setEditorModeContextScope(currentConversation.editorModeContextScope ?? 'full');
      setIsIntelligenceInjected(currentConversation.isIntelligenceInjected ?? false);
      setSelectedPersonaId(currentConversation.personaId ?? appSettings.activePersonaId);
      setIsRpgMode(currentConversation.isRpgMode ?? false);
    }
  }, [isOpen, currentConversation, currentBackground, appSettings.activePersonaId]);

  if (!isOpen) return null;

  const handleCharChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCharId = e.target.value || null;
    setSelectedCharId(newCharId);
    const newChar = characters.find(c => c.id === newCharId);
    setBackground(newChar?.chatBackground ?? '');
  };
  
  const handleSave = () => {
    onSave({
        characterId: selectedCharId,
        background,
        isVisualizedMode,
        isEditorMode,
        editorModeContextScope,
        isIntelligenceInjected,
        personaId: selectedPersonaId,
        isRpgMode,
    });
    onClose();
  };

  const formInputClass = "mt-1 block w-full bg-tertiary border border-tertiary rounded-md shadow-sm py-2 px-3 text-text-primary focus:outline-none focus:ring-accent focus:border-accent";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-secondary rounded-lg shadow-xl p-6 w-full max-w-lg m-4 border border-accent" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-accent">In-Chat Settings</h2>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary"><XIcon /></button>
        </div>
        
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-3">
            <section>
                 <h3 className="text-lg font-semibold text-text-primary mb-2">Chat Mode</h3>
                 <div className="space-y-2">
                    <ToggleSwitch
                        label="RPG Mode"
                        description="Turns this chat into a role-playing game session, with stats, combat, and progression."
                        enabled={isRpgMode}
                        onChange={setIsRpgMode}
                    />
                    <ToggleSwitch
                        label="Editor Mode"
                        description="Allows OmniAI to directly create, update, or delete app data (Prompts, Characters, etc.). Only available when not roleplaying."
                        enabled={isEditorMode}
                        onChange={setIsEditorMode}
                        disabled={isRoleplaying || isRpgMode}
                    />
                    <ToggleSwitch
                        label="Visualized Mode"
                        description="AI will generate an image for each of its responses to visualize the scene."
                        enabled={isVisualizedMode}
                        onChange={setIsVisualizedMode}
                        disabled={isRpgMode}
                    />
                 </div>
            </section>

            <section>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Context Management</h3>
                <div className="pl-4 mt-2 space-y-2 border-l-2 border-accent/50">
                    <label htmlFor="context-scope" className="text-sm font-medium text-text-secondary">Context Scope (Message Limit)</label>
                    <p className="text-xs text-text-secondary opacity-70">Limit the conversation history sent to the AI for this chat. Useful for long chats or focusing the AI on recent events.</p>
                    <select
                        id="context-scope"
                        value={editorModeContextScope}
                        onChange={e => setEditorModeContextScope(e.target.value as any)}
                        className={formInputClass}
                    >
                        <option value="full">Full Conversation</option>
                        <option value="last_20">Last 20 Messages</option>
                        <option value="last_10">Last 10 Messages</option>
                        <option value="last_5">Last 5 Messages</option>
                        <option value="last_3">Last 3 Messages</option>
                        <option value="last_1">Last 1 Message</option>
                    </select>
                </div>
            </section>

             <section>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Cognitive Override</h3>
                <div className="space-y-2">
                    <ToggleSwitch
                        label="Inject OmniAI Intelligence"
                        description="Enhances the character's responses with OmniAI's analytical and proactive thought processes. The character remains in-character but will demonstrate greater insight and intelligence."
                        enabled={isIntelligenceInjected}
                        onChange={setIsIntelligenceInjected}
                        disabled={!isRoleplaying || isRpgMode}
                    />
                </div>
            </section>
            
            <section>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Character Persona</h3>
                <p className="text-xs text-text-secondary opacity-70 mb-2">Choose a character for OmniAI to roleplay as in this chat.</p>
                <select 
                    value={selectedCharId ?? ''} 
                    onChange={handleCharChange}
                    className={formInputClass}
                    disabled={isRpgMode}
                >
                    <option value="">OmniAI (Default)</option>
                    {characters.filter(c => c.id !== 'omni-ai').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                 {isRpgMode && <p className="text-xs text-amber-400 mt-2">Character selection is disabled in RPG mode.</p>}
            </section>

            <section>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Your Persona</h3>
                <p className="text-xs text-text-secondary opacity-70 mb-2">Choose which identity you will use for this chat.</p>
                <select 
                    value={selectedPersonaId ?? ''} 
                    onChange={(e) => setSelectedPersonaId(e.target.value || null)}
                    className={formInputClass}
                >
                    {personas.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </section>
            
            <section>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Chat Background</h3>
                {isRoleplaying ? (
                    <>
                        <p className="text-xs text-text-secondary opacity-70 mb-4">The chat background is determined by the selected character's sheet. You can edit it on the character's edit page.</p>
                        <div className="w-20 h-20 rounded-md bg-secondary overflow-hidden">
                           {sfwMode ? (
                                <div className="w-full h-full bg-secondary flex items-center justify-center">
                                    <EyeIcon className="w-10 h-10 text-text-secondary" />
                                </div>
                           ) : (
                                <img src={background} alt="Character background" className="w-full h-full object-cover" />
                           )}
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-xs text-text-secondary opacity-70 mb-4">Set a custom background for this chat session.</p>
                        <FileUpload
                            label=""
                            currentImage={background}
                            onFileUpload={(base64) => setBackground(base64)}
                            sfwMode={sfwMode}
                        />
                    </>
                )}
            </section>

            <section>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Attachments</h3>
              {attachments.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                      {attachments.map((imgSrc, index) => (
                          <a key={index} href={imgSrc} target="_blank" rel="noopener noreferrer" className="aspect-square bg-tertiary rounded-md overflow-hidden group">
                              <img src={imgSrc} alt={`Attachment ${index + 1}`} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" loading="lazy" />
                          </a>
                      ))}
                  </div>
              ) : (
                  <p className="text-sm text-text-secondary italic text-center py-4 bg-tertiary/50 rounded-md">
                      No images have been shared in this chat yet.
                  </p>
              )}
            </section>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary bg-accent hover:bg-accent-hover"
          >
            Save Changes for this Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default InChatSettingsModal;

// --- Lore Review Modal ---

interface LoreReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposals: { edits: LoreEditProposal[], new_entries: LoreNewProposal[] } | null;
  onApply: (updates: { edits: LoreEditProposal[], new_entries: LoreNewProposal[] }) => void;
  activeLorebooks: Lorebook[];
}

export const LoreReviewModal: React.FC<LoreReviewModalProps> = ({ isOpen, onClose, proposals, onApply, activeLorebooks }) => {
    const [localEdits, setLocalEdits] = useState<LoreEditProposal[]>([]);
    const [localNewEntries, setLocalNewEntries] = useState<LoreNewProposal[]>([]);

    useEffect(() => {
        if (isOpen && proposals) {
            const allEntries = activeLorebooks.flatMap(lb => lb.entries);
            const editsWithOriginal = proposals.edits.map(edit => ({
                ...edit,
                original_content: allEntries.find(e => e.id === edit.entry_id)?.content || 'Original content not found.'
            }));
            setLocalEdits(editsWithOriginal);
            setLocalNewEntries(JSON.parse(JSON.stringify(proposals.new_entries)));
        }
    }, [isOpen, proposals, activeLorebooks]);

    if (!isOpen || !proposals) return null;

    const handleApply = () => {
        onApply({ edits: localEdits, new_entries: localNewEntries });
        onClose();
    };

    const handleEditChange = (id: string, newContent: string) => {
        setLocalEdits(prev => prev.map(e => e.entry_id === id ? { ...e, new_content: newContent } : e));
    };
    
    const handleDeleteNewEntry = (id: string) => {
        setLocalNewEntries(prev => prev.filter(e => e.id !== id));
    };

    const handleNewLorebookChange = (id: string, lorebookId: string) => {
        setLocalNewEntries(prev => prev.map(e => e.id === id ? { ...e, lorebook_id: lorebookId } : e));
    };

    const handleNewContentChange = (id: string, newContent: string) => {
        setLocalNewEntries(prev => prev.map(e => e.id === id ? { ...e, content: newContent } : e));
    };
    
    const handleNewKeywordsChange = (id: string, keywordsStr: string) => {
        const keywords = keywordsStr.split(',').map(k => k.trim()).filter(Boolean);
        setLocalNewEntries(prev => prev.map(e => e.id === id ? { ...e, keywords } : e));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-secondary rounded-lg shadow-xl p-6 w-full max-w-4xl m-4 border border-accent flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0">
                    <h2 className="text-2xl font-bold text-accent mb-2 flex items-center gap-3"><BrainIcon /> Lorebook Fact-Check Review</h2>
                    <p className="text-sm text-text-secondary mb-6">The AI has proposed the following updates to active lorebooks based on the chat. Review, edit, or delete them before saving.</p>
                </div>
                
                <div className="flex-grow max-h-[60vh] overflow-y-auto pr-3 space-y-6">
                    {localEdits.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">Proposed Edits</h3>
                            <div className="space-y-4">
                                {localEdits.map(edit => (
                                    <div key={edit.entry_id} className="bg-tertiary p-4 rounded-lg">
                                        <p className="text-xs text-text-secondary mb-2">Editing entry ID: {edit.entry_id}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-semibold text-text-secondary mb-1">Difference View</p>
                                                <div className="p-2 bg-black/20 rounded-md text-sm text-text-secondary max-h-40 overflow-y-auto border border-tertiary">
                                                    <DiffView oldStr={edit.original_content || ''} newStr={edit.new_content} />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-text-secondary mb-1">Proposed (Editable)</p>
                                                <div className="flex items-start gap-2">
                                                    <textarea
                                                        value={edit.new_content}
                                                        onChange={(e) => handleEditChange(edit.entry_id, e.target.value)}
                                                        className="w-full bg-secondary border border-accent rounded-md p-2 text-text-primary focus:outline-none resize-y"
                                                        rows={6}
                                                        placeholder="Leave empty to delete this entry"
                                                    />
                                                    <button 
                                                        onClick={() => handleEditChange(edit.entry_id, '')}
                                                        className="p-2 text-text-secondary hover:text-danger transition-colors flex-shrink-0"
                                                        aria-label="Propose deletion of this entry"
                                                        title="Propose Deletion"
                                                    >
                                                        <TrashIcon className="w-5 h-5"/>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                    {localNewEntries.length > 0 && (
                         <section>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">Proposed New Entries</h3>
                            <div className="space-y-4">
                                {localNewEntries.map(entry => (
                                    <div key={entry.id} className="bg-tertiary p-4 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="text-xs text-text-secondary">
                                                Add to Lorebook:
                                                <select 
                                                    value={entry.lorebook_id}
                                                    onChange={(e) => handleNewLorebookChange(entry.id!, e.target.value)}
                                                    className="ml-2 bg-secondary border border-accent rounded-md p-1 text-text-primary focus:outline-none text-xs"
                                                >
                                                    {activeLorebooks.map(lb => <option key={lb.id} value={lb.id}>{lb.name}</option>)}
                                                </select>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteNewEntry(entry.id!)}
                                                className="p-2 text-text-secondary hover:text-danger transition-colors flex-shrink-0"
                                                aria-label="Delete this new entry proposal"
                                                title="Delete Proposal"
                                            >
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                        
                                        <div>
                                            <strong className="text-sm text-text-secondary">Keywords (comma-separated):</strong>
                                            <input
                                                type="text"
                                                value={entry.keywords.join(', ')}
                                                onChange={(e) => handleNewKeywordsChange(entry.id!, e.target.value)}
                                                className="w-full bg-secondary border border-accent rounded-md p-2 mt-1 text-text-primary focus:outline-none"
                                            />
                                        </div>
                                        <div className="mt-2">
                                            <strong className="text-sm text-text-secondary">Content:</strong>
                                            <textarea
                                                value={entry.content}
                                                onChange={(e) => handleNewContentChange(entry.id!, e.target.value)}
                                                className="w-full bg-secondary border border-accent rounded-md p-2 mt-1 text-text-primary focus:outline-none resize-y"
                                                rows={3}
                                                placeholder="Enter content for new lore entry"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                     {(localEdits.length === 0 && localNewEntries.length === 0) && (
                        <p className="text-text-secondary text-center py-8">The AI didn't propose any lore changes for this chat.</p>
                     )}
                </div>
                
                <div className="flex-shrink-0 mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="py-2 px-4 border border-text-secondary rounded-md text-sm font-medium text-text-primary hover:bg-tertiary">Cancel</button>
                    <button 
                        onClick={handleApply} 
                        className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-primary bg-accent hover:bg-accent-hover disabled:opacity-50"
                        disabled={localEdits.length === 0 && localNewEntries.length === 0}
                    >
                        <SaveIcon className="inline w-4 h-4 mr-2" />
                        Save Lorebook Changes
                    </button>
                </div>
            </div>
        </div>
    );
};