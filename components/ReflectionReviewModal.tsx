


import React, { useState, useEffect, useMemo } from 'react';
import type { Reflection, ReflectionProposal, Character, AppSettings, Lorebook, Persona, PromptTemplate, Memory, StylePreference, RpgItem, World } from '../types';
import { XIcon, FileTextIcon, SaveIcon, TrashIcon, UndoIcon } from './icons';
import DiffView from './DiffView';

interface ReflectionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reflection: Reflection;
  onApply: (reflection: Reflection, allProposalsFromModal: ReflectionProposal[]) => void;
  lorebooks: Lorebook[];
  characters: Character[];
  personas: Persona[];
  prompts: PromptTemplate[];
  allMemories: Memory[];
  appSettings: AppSettings;
  stylePreferences: StylePreference[];
  libraryItems: RpgItem[];
  worlds: World[];
}

interface GetOriginalValueProps {
  characters: Character[];
  personas: Persona[];
  prompts: PromptTemplate[];
  lorebooks: Lorebook[];
  allMemories: Memory[];
  appSettings: AppSettings;
  stylePreferences: StylePreference[];
  libraryItems: RpgItem[];
  worlds: World[];
}

const getOriginalValue = (proposal: ReflectionProposal, props: GetOriginalValueProps) => {
    if (!proposal.targetId) return null;
    let item, entry, lorebook;
    switch (proposal.type) {
        case 'character': return props.characters.find(c => c.id === (proposal.targetId || proposal.characterId));
        case 'persona': return props.personas.find(p => p.id === proposal.targetId);
        case 'prompt': return props.prompts.find(p => p.id === proposal.targetId);
        case 'instructionalPrompt': return props.appSettings.instructionalPrompts.find(p => p.id === proposal.targetId);
        case 'lorebook': return props.lorebooks.find(l => l.id === proposal.targetId);
        case 'memory': return props.allMemories.find(m => m.id === proposal.targetId);
        case 'stylePreference': return props.stylePreferences.find(p => p.id === proposal.targetId);
        case 'item': return props.libraryItems.find(i => i.id === proposal.targetId);
        case 'world': return props.worlds.find(w => w.id === proposal.targetId);
        case 'lorebookEntry':
            lorebook = props.lorebooks.find(lb => lb.entries.some(e => e.id === proposal.targetId));
            entry = lorebook?.entries.find(e => e.id === proposal.targetId);
            return entry ? { ...entry, _lorebookName: lorebook?.name } : null;
        // Memory, appSetting, and conversation don't have simple original objects to fetch this way
        default: return null;
    }
};


const ProposalCard: React.FC<{
  proposal: ReflectionProposal;
  reflection: Reflection;
  onUpdate: (updatedProposal: ReflectionProposal) => void;
  onInitiateReject: () => void;
  originalItem: any | null;
  lorebooks: Lorebook[];
}> = ({ proposal, reflection, onUpdate, onInitiateReject, originalItem, lorebooks }) => {

  const targetName = useMemo(() => {
    if (proposal.action === 'add') return `New ${proposal.type}`;
    if (!proposal.targetId) return 'Unknown Target';
    if (originalItem) {
        if (proposal.type === 'lorebookEntry') return `Entry in "${originalItem._lorebookName}"`;
        return originalItem.name || originalItem.content || `Item ID: ${proposal.targetId.substring(0,8)}...`;
    }
    if (proposal.type === 'conversation') return `Chat: "${reflection.conversationPreview}"`;
    return `ID: ${proposal.targetId.substring(0,8)}...`;
  }, [proposal, originalItem, reflection]);

  const renderContent = () => {
    const commonTextArea = (value: any, onValueChange: (val: string) => void, rows = 3, placeholder = "") => {
      const stringValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value || '');
      return (
        <textarea
          value={stringValue}
          onChange={(e) => onValueChange(e.target.value)}
          className="w-full bg-secondary border border-accent rounded-md p-2 mt-1 text-text-primary focus:outline-none resize-y font-mono text-sm"
          rows={rows}
          placeholder={placeholder}
        />
      );
    };

    switch (proposal.type) {
      case 'memory':
      case 'lorebookEntry':
      case 'stylePreference':
        if (proposal.action === 'edit' && originalItem) {
          const oldContent = originalItem.content || '';
          const newContent = proposal.content || '';
          return (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-text-primary capitalize">Content</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Difference View</p>
                    <div className="p-2 bg-black/20 rounded-md text-sm text-text-secondary max-h-40 overflow-y-auto">
                      <DiffView oldStr={oldContent} newStr={newContent} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Proposed (Editable)</p>
                    {commonTextArea(newContent, (val) => onUpdate({ ...proposal, content: val }), 6)}
                  </div>
                </div>
              </div>
              {proposal.type === 'lorebookEntry' && (
                <div>
                  <label className="text-xs text-text-secondary">Keywords (comma-separated)</label>
                  <input
                    type="text"
                    value={(proposal.keywords || []).join(', ')}
                    onChange={(e) => onUpdate({ ...proposal, keywords: e.target.value.split(',').map(k => k.trim()) })}
                    className="w-full bg-secondary border border-accent rounded-md p-2 mt-1 text-text-primary focus:outline-none"
                  />
                </div>
              )}
            </div>
          );
        }
        
        // Fallback for 'add' or if originalItem is not found for an edit
        return (
          <div className="space-y-3">
            {(proposal.action === 'add' || (proposal.action === 'edit' && !originalItem)) && (
              <div>
                <label className="text-xs text-text-secondary">Content</label>
                {commonTextArea(proposal.content || '', (val) => onUpdate({ ...proposal, content: val }))}
              </div>
            )}
            {proposal.type === 'lorebookEntry' && (proposal.action === 'add' || proposal.action === 'edit') && (
              <div>
                <label className="text-xs text-text-secondary">Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={(proposal.keywords || []).join(', ')}
                  onChange={(e) => onUpdate({ ...proposal, keywords: e.target.value.split(',').map(k => k.trim()) })}
                  className="w-full bg-secondary border border-accent rounded-md p-2 mt-1 text-text-primary focus:outline-none"
                />
              </div>
            )}
            {proposal.type !== 'stylePreference' && proposal.action === 'add' && (
              <div>
                <label className="text-xs text-text-secondary">Target</label>
                <select
                  value={proposal.type === 'memory' ? proposal.scope : proposal.lorebookId}
                  onChange={(e) => onUpdate(proposal.type === 'memory' ? { ...proposal, scope: e.target.value as any } : { ...proposal, lorebookId: e.target.value })}
                  className="w-full bg-secondary border border-accent rounded-md p-1 mt-1 text-text-primary text-sm focus:outline-none"
                >
                  {proposal.type === 'memory' ? (
                    <>
                      <option value="conversation">Conversation</option>
                      <option value="character">Character</option>
                      <option value="global">Global</option>
                    </>
                  ) : (
                    lorebooks.map(lb => <option key={lb.id} value={lb.id}>{lb.name}</option>)
                  )}
                </select>
              </div>
            )}
          </div>
        );
      case 'character':
      case 'persona':
      case 'prompt':
      case 'lorebook':
      case 'conversation':
      case 'instructionalPrompt':
      case 'item':
      case 'world':
        if (proposal.action === 'add') {
             if (!proposal.updatedFields) return null;
             return (
               <div className="space-y-4">
                 {Object.entries(proposal.updatedFields).map(([field, value]) => (
                   <div key={field}>
                     <label className="text-sm font-semibold text-text-primary capitalize">{field}</label>
                     {commonTextArea(
                        value,
                        (val) => {
                            let parsedVal = val;
                            try { parsedVal = JSON.parse(val); } catch {}
                            onUpdate({ ...proposal, updatedFields: { ...proposal.updatedFields, [field]: parsedVal } });
                        },
                        typeof value === 'object' ? 6 : (field === 'description' ? 4 : 2)
                     )}
                   </div>
                 ))}
               </div>
             );
        }
        if (proposal.action !== 'edit' || !proposal.updatedFields) return null;

        if (proposal.type === 'conversation') {
             const oldTitle = reflection.conversationPreview;
             const newTitle = (proposal.updatedFields as any).preview || '';
             
             // If title is empty, try to parse from rationale for display only (real logic is in onApply)
             let displayTitle = newTitle;
             if (!displayTitle && proposal.rationale) {
                 const match = proposal.rationale.match(/changing it to '([^']+)'/i) || 
                               proposal.rationale.match(/changing it to "([^"]+)"/i) ||
                               proposal.rationale.match(/title to '([^']+)'/i);
                 if (match) displayTitle = match[1];
             }

             return (
                 <div className="space-y-4">
                     <div>
                         <label className="text-sm font-semibold text-text-primary capitalize">Title</label>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                             <div>
                                 <p className="text-xs text-text-secondary mb-1">Difference View</p>
                                 <div className="p-2 bg-black/20 rounded-md text-sm text-text-secondary max-h-40 overflow-y-auto">
                                     <DiffView oldStr={oldTitle || ''} newStr={displayTitle} />
                                 </div>
                             </div>
                             <div>
                                 <p className="text-xs text-text-secondary mb-1">Proposed (Editable)</p>
                                 {commonTextArea(
                                     displayTitle,
                                     (val) => onUpdate({ ...proposal, updatedFields: { ...proposal.updatedFields, preview: val } }),
                                     3,
                                     "Enter new title..."
                                 )}
                             </div>
                         </div>
                     </div>
                 </div>
             );
        }

        if (!originalItem) return null; // Guard for other types that require original item
        
        return (
          <div className="space-y-4">
            {Object.entries(proposal.updatedFields).map(([field, value]) => (
              <div key={field}>
                <label className="text-sm font-semibold text-text-primary capitalize">{field}</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Difference View</p>
                    <div className="p-2 bg-black/20 rounded-md text-sm text-text-secondary max-h-40 overflow-y-auto">
                      <DiffView 
                        oldStr={typeof originalItem[field] === 'object' ? JSON.stringify(originalItem[field], null, 2) : String(originalItem[field] || '')} 
                        newStr={typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value || '')} 
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Proposed (Editable)</p>
                    {commonTextArea(
                        value, 
                        (val) => {
                            let parsedVal = val;
                            try { parsedVal = JSON.parse(val); } catch {}
                            onUpdate({ ...proposal, updatedFields: { ...proposal.updatedFields, [field]: parsedVal } });
                        }, 
                        typeof value === 'object' ? 6 : 2
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'appSetting':
        return (
          <div>
            <label className="text-xs text-text-secondary">New Value for "{proposal.key}"</label>
            <input
              type="text"
              value={proposal.value || ''}
              onChange={(e) => onUpdate({ ...proposal, value: e.target.value })}
              className="w-full bg-secondary border border-accent rounded-md p-2 mt-1 text-text-primary focus:outline-none"
            />
          </div>
        );
      default:
        return <p className="text-danger">Unknown proposal type.</p>;
    }
  };

  return (
    <div className="bg-tertiary p-4 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-bold text-accent capitalize">{proposal.type} - {proposal.action}</p>
          <p className="text-xs text-text-secondary">Target: {targetName}</p>
          <p className="text-sm text-text-secondary italic mt-1">Rationale: {proposal.rationale}</p>
        </div>
        <button onClick={onInitiateReject} className="p-1 text-text-secondary hover:text-danger transition-colors">
          <TrashIcon />
        </button>
      </div>
      {renderContent()}
    </div>
  );
};


const RejectionModal: React.FC<{onConfirm: (reason: string) => void, onCancel: () => void}> = ({ onConfirm, onCancel }) => {
    const reasons = ["Inaccurate", "Not Relevant", "Repetitive", "Other"];
    return (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 rounded-lg">
            <div className="bg-secondary p-4 rounded-lg border border-accent shadow-lg text-center">
                <p className="text-text-primary font-semibold mb-3">Why are you rejecting this?</p>
                <div className="flex flex-wrap justify-center gap-2">
                    {reasons.map(reason => (
                        <button key={reason} onClick={() => onConfirm(reason)} className="py-1 px-3 bg-tertiary text-text-primary rounded-md text-sm hover:bg-accent hover:text-primary">
                            {reason}
                        </button>
                    ))}
                </div>
                <button onClick={onCancel} className="text-xs text-text-secondary hover:underline mt-4">Cancel</button>
            </div>
        </div>
    );
};


const ReflectionReviewModal: React.FC<ReflectionReviewModalProps> = ({ isOpen, onClose, reflection, onApply, lorebooks, characters, personas, prompts, allMemories, appSettings, stylePreferences, libraryItems, worlds }) => {
  const [localProposals, setLocalProposals] = useState<ReflectionProposal[]>([]);
  const [rejectionTargetId, setRejectionTargetId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const allProps = { characters, lorebooks, personas, prompts, allMemories, appSettings, stylePreferences, libraryItems, worlds };
      const processedProposals = JSON.parse(JSON.stringify(reflection.proposals)).map((p: ReflectionProposal) => {
        // BUG FIX: If AI proposes a conversation title change but puts the new title in the rationale instead
        // of updatedFields, parse it from the rationale as a fallback.
        if ( p.type === 'conversation' && p.action === 'edit' && p.updatedFields && !p.updatedFields.preview && p.rationale ) {
            const match = p.rationale.match(/changing it to '([^']+)'/i) || 
                          p.rationale.match(/changing it to "([^"]+)"/i) ||
                          p.rationale.match(/propose a new title: '([^']+)'/i) ||
                          p.rationale.match(/propose a new title: "([^"]+)"/i) ||
                          p.rationale.match(/proposing the title '([^']+)'/i) ||
                          p.rationale.match(/proposing the title "([^"]+)"/i) ||
                          p.rationale.match(/title like '([^']+)'/i);
            if (match && match[1]) {
                const newUpdatedFields = { ...p.updatedFields, preview: match[1] };
                return { ...p, updatedFields: newUpdatedFields };
            }
        }
        
        // BUG FIX: If AI proposes a memory/lore edit but leaves content empty, try to parse from rationale.
        if ( (p.type === 'memory' || p.type === 'lorebookEntry') && p.action === 'edit' && (!p.content || p.content.trim() === '') && p.rationale ) {
            const originalItem = getOriginalValue(p, allProps);
            if (originalItem && originalItem.content) {
                const conflictMatch = p.rationale.match(/states (.+?) as '([^']+)'.+?conflicts with .+? '([^']+)'.*/i) || p.rationale.match(/incorrectly states (.+?) as `([^`]+)`.+?confirmed as `([^`]+)`/i);
                if (conflictMatch) {
                    const incorrectPart = conflictMatch[2];
                    const correctPart = conflictMatch[3];
                    if (originalItem.content.includes(incorrectPart)) {
                      p.content = originalItem.content.replace(incorrectPart, correctPart);
                    }
                } else {
                    const correctionMatch = p.rationale.match(/correcting '([^']+)' to '([^']+)'/i) || p.rationale.match(/correcting `([^`]+)` to `([^`]+)`/i);
                     if (correctionMatch) {
                        const incorrectPart = correctionMatch[1];
                        const correctPart = correctionMatch[2];
                        if (originalItem.content.includes(incorrectPart)) {
                            p.content = originalItem.content.replace(incorrectPart, correctPart);
                        }
                    }
                }
            }
        }

        return p;
      });
      setLocalProposals(processedProposals);
      setRejectionTargetId(null);
      setHasChanges(false);
    }
  }, [isOpen, reflection, characters, lorebooks, personas, prompts, allMemories, appSettings, stylePreferences, libraryItems, worlds]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(reflection, localProposals);
    onClose();
  };

  const updateProposal = (id: string, updatedProposal: ReflectionProposal) => {
    setLocalProposals(prev => prev.map(p => p.id === id ? updatedProposal : p));
    setHasChanges(true);
  };
  
  const handleUndoRejection = (proposalId: string) => {
    setLocalProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'pending', rejectionReason: undefined } : p));
    setHasChanges(true);
  };

  const handleConfirmRejection = (reason: string) => {
    if (!rejectionTargetId) return;
    setLocalProposals(prev => prev.map(p => p.id === rejectionTargetId ? { ...p, status: 'rejected', rejectionReason: reason } : p));
    setRejectionTargetId(null);
    setHasChanges(true);
  };

  const pendingProposals = useMemo(() => localProposals.filter(p => p.status === 'pending'), [localProposals]);
  const reviewedProposals = useMemo(() => localProposals.filter(p => p.status !== 'pending'), [localProposals]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-secondary rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-4xl m-4 border border-accent flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 mb-4">
          <h2 className="text-2xl font-bold text-accent flex items-center gap-3"><FileTextIcon /> Reflection Proposals</h2>
        </div>

        <div className="flex-grow overflow-y-auto pr-3 space-y-4">
          {pendingProposals.length > 0 ? (
            pendingProposals.map((proposal) => (
              <div key={proposal.id} className="relative">
                 <ProposalCard
                      proposal={proposal}
                      reflection={reflection}
                      onUpdate={(p) => updateProposal(proposal.id, p)}
                      onInitiateReject={() => setRejectionTargetId(proposal.id)}
                      originalItem={getOriginalValue(proposal, { characters, lorebooks, personas, prompts, allMemories, appSettings, stylePreferences, libraryItems, worlds })}
                      lorebooks={lorebooks}
                />
                {rejectionTargetId === proposal.id && (
                    <RejectionModal 
                        onConfirm={handleConfirmRejection}
                        onCancel={() => setRejectionTargetId(null)}
                    />
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 px-4 border-2 border-dashed border-tertiary rounded-lg">
                <p className="text-text-secondary">No pending proposals to review.</p>
            </div>
          )}

          {reviewedProposals.length > 0 && (
            <details className="mt-4">
                <summary className="cursor-pointer text-sm text-text-secondary hover:text-text-primary">View Reviewed Proposals ({reviewedProposals.length})</summary>
                <div className="mt-2 space-y-2">
                    {reviewedProposals.map(p => (
                         <div key={p.id} className={`p-3 rounded-lg border border-dashed flex justify-between items-center ${
                            p.status === 'rejected' ? 'bg-tertiary/50 border-danger/50' : 'bg-tertiary/50 border-green-500/30'
                         }`}>
                            <div>
                                {p.status === 'rejected' ? (
                                    <p className="text-sm text-danger">Rejected: <span className="text-text-secondary">{p.rejectionReason}</span></p>
                                ) : (
                                    <p className="text-sm text-green-400">Approved</p>
                                )}
                                <p className="text-xs text-text-secondary/70 mt-1">({p.type} - {p.action}) {p.rationale}</p>
                            </div>
                            <button onClick={() => handleUndoRejection(p.id)} className="p-2 text-text-secondary hover:text-accent" title="Move to Pending">
                                <UndoIcon />
                            </button>
                         </div>
                    ))}
                </div>
            </details>
          )}

        </div>

        <div className="flex-shrink-0 mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="py-2 px-4 border border-text-secondary rounded-md text-sm font-medium text-text-primary hover:bg-tertiary">Cancel</button>
          <button
            onClick={handleApply}
            className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-primary bg-accent hover:bg-accent-hover disabled:opacity-50"
            disabled={!hasChanges && pendingProposals.length === 0}
          >
            <SaveIcon className="inline w-4 h-4 mr-2" />
            Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReflectionReviewModal;