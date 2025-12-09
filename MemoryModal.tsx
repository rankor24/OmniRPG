import React, { useState, useEffect, useRef } from 'react';
import { TrashIcon, EditIcon, SaveIcon, CancelIcon, BrainIcon, GlobeIcon, UserCircleIcon, ChatCollectionIcon, BookOpenIcon, IntersectingRingsIcon } from './icons';
import type { Memory, AppSettings, Character, Lorebook, Conversation, StylePreference } from '../types';
import { v4 as uuidv4 } from 'uuid';
import DiffView from './DiffView';

type CortexScope = 'conversation' | 'character' | 'global' | 'lore' | 'context' | 'style';
type MemoryScope = 'conversation' | 'character' | 'global';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  
  conversationMemories: Memory[];
  onUpdateConversationMemories: React.Dispatch<React.SetStateAction<Memory[]>>;
  
  characterMemories: Memory[];
  onUpdateCharacterMemories: React.Dispatch<React.SetStateAction<Memory[]>>;
  
  globalMemories: Memory[];
  onUpdateGlobalMemories: React.Dispatch<React.SetStateAction<Memory[]>>;

  stylePreferences: StylePreference[];
  onUpdateStylePreferences: React.Dispatch<React.SetStateAction<StylePreference[]>>;
  
  onExtractFacts: (scope: MemoryScope) => void;
  onSummarizeHistory: (scope: MemoryScope) => void;
  isGenerating: boolean;
  canGenerate: boolean;
  appSettings: AppSettings;
  onCheckMemoryCorrection: (scope: MemoryScope) => void;
  isLoading: boolean;
  
  character: Character | null;
  conversationId?: string;
  conversationPreview?: string;

  // New props for Lore & Context
  lorebooks: Lorebook[];
  activeLorebookIds: string[];
  onLorebookToggle: (id: string) => void;
  onProposeLoreEdits: () => void;
  onExtractNewLore: () => void;
  allConversationsForContext: (Conversation & { characterName: string })[];
  activeContextualChatIds: string[];
  onToggleContextChat: (id: string) => void;
  currentConversationId?: string;
}

const TabButton: React.FC<{
  scope: CortexScope;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  activeTab: CortexScope;
  setActiveTab: (scope: CortexScope) => void;
}> = ({ scope, label, icon, disabled = false, activeTab, setActiveTab }) => (
    <button
        onClick={() => !disabled && setActiveTab(scope)}
        disabled={disabled}
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 text-sm font-semibold border-b-2 transition-all duration-200 ${
            activeTab === scope
            ? 'border-accent text-accent'
            : 'border-transparent text-text-secondary hover:border-tertiary hover:text-text-primary'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const MemoryModal: React.FC<MemoryModalProps> = (props) => {
  const { 
    isOpen, onClose, 
    conversationMemories, onUpdateConversationMemories,
    characterMemories, onUpdateCharacterMemories,
    globalMemories, onUpdateGlobalMemories,
    stylePreferences, onUpdateStylePreferences,
    onExtractFacts, onSummarizeHistory,
    isGenerating, canGenerate, appSettings,
    onCheckMemoryCorrection, isLoading,
    character, conversationId, conversationPreview,
    lorebooks, activeLorebookIds, onLorebookToggle,
    onProposeLoreEdits, onExtractNewLore,
    allConversationsForContext, activeContextualChatIds, onToggleContextChat,
    currentConversationId
  } = props;

  const [activeTab, setActiveTab] = useState<CortexScope>('conversation');
  const [newItemContent, setNewItemContent] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingItemId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingItemId]);

  useEffect(() => {
      if(isOpen) {
          setActiveTab('conversation');
      }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartEdit = (item: { id: string, content: string }) => {
    setEditingItemId(item.id);
    setEditedContent(item.content);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditedContent('');
  };

  const handleSaveMemory = () => {
    if (!editedContent.trim() || !editingItemId) return;
    const memory = [...conversationMemories, ...characterMemories, ...globalMemories].find(m => m.id === editingItemId);
    if (!memory) return;

    const setter = {
        conversation: onUpdateConversationMemories,
        character: onUpdateCharacterMemories,
        global: onUpdateGlobalMemories,
    }[memory.scope];

    setter(prev =>
      prev.map(mem =>
        mem.id === editingItemId
          ? { ...mem, content: editedContent.trim(), timestamp: new Date().toISOString() }
          : mem
      )
    );
    handleCancelEdit();
  };
  
  const handleDeleteMemory = (memory: Memory) => {
    const setter = {
        conversation: onUpdateConversationMemories,
        character: onUpdateCharacterMemories,
        global: onUpdateGlobalMemories,
    }[memory.scope];
    setter(prev => prev.filter(m => m.id !== memory.id));
  };
  
  const handleSaveStyle = () => {
    if (!editedContent.trim() || !editingItemId) return;
    onUpdateStylePreferences(prev =>
      prev.map(p =>
        p.id === editingItemId
          ? { ...p, content: editedContent.trim(), timestamp: new Date().toISOString() }
          : p
      )
    );
    handleCancelEdit();
  };

  const handleDeleteStyle = (idToDelete: string) => {
    onUpdateStylePreferences(prev => prev.filter(p => p.id !== idToDelete));
  };

  const handleAdd = () => {
    if (activeTab === 'style') {
      if (newItemContent.trim() && character) {
        const newPref: StylePreference = {
          id: uuidv4(),
          content: newItemContent.trim(),
          timestamp: new Date().toISOString(),
          characterName: character.name,
        };
        onUpdateStylePreferences(prev => [...prev, newPref]);
        setNewItemContent('');
      }
    } else { // It's a memory tab
      if (newItemContent.trim()) {
        const memoryScope = activeTab as MemoryScope;
        const newMemoryObject: Memory = {
          id: uuidv4(),
          content: newItemContent.trim(),
          timestamp: new Date().toISOString(),
          scope: memoryScope,
          ...(memoryScope === 'conversation' && { conversationId, conversationPreview, characterName: character?.name }),
          ...(memoryScope === 'character' && { characterId: character?.id, characterName: character?.name }),
        };

        const setter = {
            conversation: onUpdateConversationMemories,
            character: onUpdateCharacterMemories,
            global: onUpdateGlobalMemories,
        }[memoryScope];
        if (setter) {
            setter(prev => [...prev, newMemoryObject]);
        }
        setNewItemContent('');
      }
    }
  };
  
  const handleAddKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };
  
  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
        e.preventDefault(); 
        if (activeTab === 'style') handleSaveStyle();
        else handleSaveMemory();
    }
    if (e.key === 'Escape') handleCancelEdit();
  };
  
  const descriptions: Record<CortexScope, string> = {
    conversation: "Facts for this chat session only. They will be forgotten when you start a new chat.",
    character: character ? `Facts only ${character.name} remembers, across all chats with them.` : "No character is active in this chat.",
    global: "Permanent facts about you that are active in ALL conversations with any character.",
    style: "Writing style preferences learned from your message ratings. The AI will try to follow these rules.",
    lore: "Select lorebooks to provide extra context for this chat. Changes are saved instantly.",
    context: "Select other conversations to provide as additional context. (Last 10 messages will be used). Changes are saved instantly.",
  };

  const currentMemories = {
      conversation: conversationMemories,
      character: characterMemories,
      global: globalMemories
  }[activeTab as MemoryScope] || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-secondary rounded-lg shadow-xl p-6 w-full max-w-2xl m-4 border border-accent flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0">
            <h2 className="text-2xl font-bold text-accent mb-2">Memory Cortex</h2>
            <div className="flex border-b border-tertiary">
              <TabButton scope="conversation" label="This Chat" icon={<ChatCollectionIcon className="w-5 h-5"/>} activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton scope="character" label={character?.name || 'Character'} icon={<UserCircleIcon className="w-5 h-5"/>} disabled={!character} activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton scope="global" label="Global" icon={<GlobeIcon className="w-5 h-5"/>} activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton scope="style" label="Style" icon={<BrainIcon className="w-5 h-5"/>} activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton scope="lore" label="Lore" icon={<BookOpenIcon className="w-5 h-5"/>} activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton scope="context" label="Context" icon={<IntersectingRingsIcon className="w-5 h-5"/>} activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
            <p className="text-sm text-text-secondary my-4 h-10">{descriptions[activeTab]}</p>
        </div>
        
        <div className="flex-grow max-h-[40vh] overflow-y-auto pr-3 space-y-3 mb-6">
          {['conversation', 'character', 'global'].includes(activeTab) && (
            currentMemories.length > 0 ? (
              currentMemories.map((memory) => (
                <div key={memory.id} className="bg-tertiary p-3 rounded-lg flex items-center justify-between gap-2">
                  {editingItemId === memory.id ? (
                    <>
                      <textarea ref={editInputRef} value={editedContent} onChange={(e) => setEditedContent(e.target.value)} onKeyDown={handleEditKeyDown} className="flex-grow bg-secondary border border-accent rounded-md p-2 text-text-primary focus:outline-none resize-y" rows={2}/>
                      <div className="flex-shrink-0 flex flex-col gap-1 self-start">
                          <button onClick={handleSaveMemory} className="p-2 text-text-secondary hover:text-accent transition-colors"><SaveIcon className="w-5 h-5"/></button>
                          <button onClick={handleCancelEdit} className="p-2 text-text-secondary hover:text-text-primary transition-colors"><CancelIcon className="w-5 h-5"/></button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-grow">
                        <p className="text-text-primary flex-grow break-words">{memory.content}</p>
                        <p className="text-xs text-text-secondary mt-1 opacity-70">{new Date(memory.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                      </div>
                      <div className="flex-shrink-0 flex items-center">
                         <button onClick={() => handleStartEdit(memory)} className="p-2 text-text-secondary hover:text-accent transition-colors" aria-label="Edit memory"><EditIcon className="w-5 h-5"/></button>
                         <button onClick={() => handleDeleteMemory(memory)} className="p-2 text-text-secondary hover:text-danger transition-colors" aria-label="Delete memory"><TrashIcon className="w-5 h-5"/></button>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 px-4 border-2 border-dashed border-tertiary rounded-lg">
                  <p className="text-text-secondary">No memories recorded for this scope.</p>
              </div>
            )
          )}
          {activeTab === 'style' && (
            stylePreferences.length > 0 ? (
                stylePreferences.map((pref) => (
                    <div key={pref.id} className="bg-tertiary p-3 rounded-lg flex items-center justify-between gap-2">
                        {editingItemId === pref.id ? (
                             <>
                              <textarea ref={editInputRef} value={editedContent} onChange={(e) => setEditedContent(e.target.value)} onKeyDown={handleEditKeyDown} className="flex-grow bg-secondary border border-accent rounded-md p-2 text-text-primary focus:outline-none resize-y" rows={2}/>
                              <div className="flex-shrink-0 flex flex-col gap-1 self-start">
                                  <button onClick={handleSaveStyle} className="p-2 text-text-secondary hover:text-accent transition-colors"><SaveIcon className="w-5 h-5"/></button>
                                  <button onClick={handleCancelEdit} className="p-2 text-text-secondary hover:text-text-primary transition-colors"><CancelIcon className="w-5 h-5"/></button>
                              </div>
                            </>
                        ) : (
                            <>
                              <div className="flex-grow">
                                <p className="text-text-primary flex-grow break-words">{pref.content}</p>
                                <p className="text-xs text-text-secondary mt-1 opacity-70">
                                    From chat with: {pref.characterName} on {new Date(pref.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                </p>
                              </div>
                              <div className="flex-shrink-0 flex items-center">
                                 <button onClick={() => handleStartEdit(pref)} className="p-2 text-text-secondary hover:text-accent transition-colors" aria-label="Edit style"><EditIcon className="w-5 h-5"/></button>
                                 <button onClick={() => handleDeleteStyle(pref.id)} className="p-2 text-text-secondary hover:text-danger transition-colors" aria-label="Delete style"><TrashIcon className="w-5 h-5"/></button>
                              </div>
                            </>
                        )}
                    </div>
                ))
            ) : (
                 <div className="text-center py-8 px-4 border-2 border-dashed border-tertiary rounded-lg">
                  <p className="text-text-secondary">No style preferences learned yet.</p>
              </div>
            )
          )}
          {activeTab === 'lore' && (
             <div className="space-y-3">
                {lorebooks.map(lb => (
                    <label key={lb.id} className="flex items-center gap-3 bg-tertiary p-3 rounded-md cursor-pointer hover:bg-tertiary/70">
                        <input
                            type="checkbox"
                            checked={activeLorebookIds.includes(lb.id)}
                            onChange={() => onLorebookToggle(lb.id)}
                            className="h-5 w-5 rounded bg-secondary border-tertiary text-accent focus:ring-accent"
                        />
                        <div>
                            <span className="font-semibold text-text-primary">{lb.name}</span>
                            <p className="text-xs text-text-secondary">{lb.description}</p>
                        </div>
                    </label>
                ))}
            </div>
          )}
          {activeTab === 'context' && (
             <div className="space-y-3">
                {allConversationsForContext.filter(c => c.id !== currentConversationId).map(convo => (
                    <label key={convo.id} className="flex items-center gap-3 bg-tertiary p-3 rounded-md cursor-pointer hover:bg-tertiary/70">
                        <input
                            type="checkbox"
                            checked={activeContextualChatIds.includes(convo.id)}
                            onChange={() => onToggleContextChat(convo.id)}
                            className="h-5 w-5 rounded bg-secondary border-tertiary text-accent focus:ring-accent"
                        />
                        <div>
                            <span className="font-semibold text-text-primary truncate block max-w-xs">{convo.preview}</span>
                            <p className="text-xs text-text-secondary">with {convo.characterName}</p>
                        </div>
                    </label>
                ))}
                {allConversationsForContext.length <= 1 && (
                    <div className="text-center py-8 px-4 border-2 border-dashed border-tertiary rounded-lg">
                        <p className="text-text-secondary">No other conversations to use as context.</p>
                    </div>
                )}
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 space-y-4">
          {['conversation', 'character', 'global', 'style'].includes(activeTab) && (
              <div className="flex gap-2">
                <textarea value={newItemContent} onChange={(e) => setNewItemContent(e.target.value)} onKeyDown={handleAddKeyDown} placeholder={`Add a new ${activeTab} entry...`} className="flex-grow bg-tertiary border border-tertiary rounded-md p-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-y" rows={2} disabled={!character && activeTab !== 'global'}/>
                <button onClick={handleAdd} className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-primary bg-accent hover:bg-accent-hover disabled:bg-tertiary self-end" disabled={!newItemContent.trim() || (!character && activeTab !== 'global')}>
                    Add
                </button>
              </div>
          )}
            
          <div className="flex justify-between items-center">
              <div className="flex flex-wrap gap-2">
                  {appSettings.enableAutomaticMemoryGeneration && ['conversation', 'character', 'global'].includes(activeTab) && (
                      <>
                          <button onClick={() => onSummarizeHistory(activeTab as MemoryScope)} disabled={!canGenerate || isGenerating} className="py-2 px-4 border border-accent text-accent rounded-md text-sm font-medium hover:bg-accent hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              {isGenerating ? 'Processing...' : 'Summarize History'}
                          </button>
                           <button onClick={() => onExtractFacts(activeTab as MemoryScope)} disabled={!canGenerate || isGenerating} className="py-2 px-4 border border-accent text-accent rounded-md text-sm font-medium hover:bg-accent hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              {isGenerating ? 'Processing...' : 'Extract Facts'}
                          </button>
                      </>
                  )}
                   {['conversation', 'character', 'global'].includes(activeTab) && (
                      <button onClick={() => onCheckMemoryCorrection(activeTab as MemoryScope)} disabled={!canGenerate || isGenerating} className="py-2 px-4 border border-accent text-accent rounded-md text-sm font-medium hover:bg-accent hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          {isGenerating ? 'Checking...' : 'Fact-Check'}
                      </button>
                   )}
                   {activeTab === 'lore' && (
                      <>
                        <button onClick={onProposeLoreEdits} disabled={isGenerating || activeLorebookIds.length === 0} className="py-2 px-4 border border-accent text-accent rounded-md text-sm font-medium hover:bg-accent hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
                           <BrainIcon className="w-4 h-4" />
                           {isGenerating ? 'Checking...' : 'Check Existing'}
                        </button>
                        <button onClick={onExtractNewLore} disabled={isGenerating || activeLorebookIds.length === 0} className="py-2 px-4 border border-accent text-accent rounded-md text-sm font-medium hover:bg-accent hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
                           <BrainIcon className="w-4 h-4" />
                           {isGenerating ? 'Extracting...' : 'Extract New'}
                        </button>
                      </>
                   )}
              </div>
              <button onClick={onClose} className="py-2 px-4 border border-text-secondary rounded-md shadow-sm text-sm font-medium text-text-primary hover:bg-tertiary">
                  Close
              </button>
          </div>
          {!canGenerate && ['conversation', 'character', 'global'].includes(activeTab) && (
            <p className="text-xs text-danger text-left -mt-2">Memory actions require at least one user/AI exchange.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryModal;


interface MemoryCorrectionProposal {
    oldMemoryId: string;
    originalMemoryContent: string;
    newContent: string;
    scope: MemoryScope;
}

interface MemoryReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposals: MemoryCorrectionProposal[];
  onApply: (corrections: { oldMemoryId: string; newContent: string; scope: MemoryScope }[]) => void;
}

export const MemoryReviewModal: React.FC<MemoryReviewModalProps> = ({ isOpen, onClose, proposals, onApply }) => {
  const [localProposals, setLocalProposals] = useState<MemoryCorrectionProposal[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLocalProposals(JSON.parse(JSON.stringify(proposals))); // Deep copy
    }
  }, [isOpen, proposals]);

  if (!isOpen) return null;

  const handleContentChange = (index: number, newContent: string) => {
    setLocalProposals(prev => {
        const newProposals = [...prev];
        newProposals[index] = { ...newProposals[index], newContent };
        return newProposals;
    });
  };

  const handleApply = () => {
    onApply(localProposals.map(p => ({ oldMemoryId: p.oldMemoryId, newContent: p.newContent, scope: p.scope })));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-secondary rounded-lg shadow-xl p-6 w-full max-w-3xl m-4 border border-accent flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0">
          <h2 className="text-2xl font-bold text-accent mb-2 flex items-center gap-3"><BrainIcon /> Memory Fact-Check Review</h2>
          <p className="text-sm text-text-secondary mb-6">The AI has proposed the following updates to its memories based on your last message. Review, edit, or delete them before saving.</p>
        </div>
        
        <div className="flex-grow max-h-[60vh] overflow-y-auto pr-3 space-y-4">
          {localProposals.length > 0 ? (
            localProposals.map((proposal, index) => (
              <div key={proposal.oldMemoryId} className="bg-tertiary p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <p className="text-sm font-semibold text-text-secondary mb-1">Difference View</p>
                      <div className="p-2 bg-black/20 rounded-md text-sm text-text-secondary max-h-40 overflow-y-auto border border-tertiary">
                          <DiffView oldStr={proposal.originalMemoryContent} newStr={proposal.newContent} />
                      </div>
                  </div>
                  <div>
                      <p className="text-sm font-semibold text-text-secondary mb-1">Proposed New Fact (Editable)</p>
                      <div className="flex items-start gap-2">
                          <textarea
                              value={proposal.newContent}
                              onChange={(e) => handleContentChange(index, e.target.value)}
                              className="w-full bg-secondary border border-accent rounded-md p-2 text-text-primary focus:outline-none resize-y"
                              rows={6}
                              placeholder="Leave empty to delete this memory"
                          />
                          <button 
                              onClick={() => handleContentChange(index, '')}
                              className="p-2 text-text-secondary hover:text-danger transition-colors flex-shrink-0"
                              aria-label="Propose deletion"
                              title="Propose Deletion"
                          >
                              <TrashIcon className="w-5 h-5"/>
                          </button>
                      </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-text-secondary text-center py-8">The AI didn't propose any memory corrections for this chat.</p>
          )}
        </div>
        
        <div className="flex-shrink-0 mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="py-2 px-4 border border-text-secondary rounded-md text-sm font-medium text-text-primary hover:bg-tertiary">Cancel</button>
          <button 
            onClick={handleApply} 
            className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-primary bg-accent hover:bg-accent-hover disabled:opacity-50"
            disabled={localProposals.length === 0}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
