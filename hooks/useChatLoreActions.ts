import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AppSettings, ChatMessage, Lorebook, LoreEditProposal, LoreNewProposal } from '../types';
import { proposeLoreEdits, extractNewLoreEntries } from '../services/memory';
import type { useChatStateAndEffects } from './useChatStateAndEffects';
import { startKeepAlive, stopKeepAlive } from '../services/backgroundKeepAlive';


type UseChatStateAndEffectsReturn = ReturnType<typeof useChatStateAndEffects>;

interface UseChatLoreActionsProps extends UseChatStateAndEffectsReturn {
  appSettings: AppSettings;
  lorebooks: Lorebook[];
  onUpdateLorebooks: (updater: (prev: Lorebook[]) => Lorebook[]) => void;
  isGeneratingMemories: boolean; // From memory hook
}

export const useChatLoreActions = (props: UseChatLoreActionsProps) => {
  const {
    appSettings, messages, currentConversation, lorebooks, onUpdateLorebooks, isGeneratingMemories
  } = props;
  
  const [isLoreReviewModalOpen, setLoreReviewModalOpen] = useState(false);
  const [loreProposals, setLoreProposals] = useState<{ edits: LoreEditProposal[], new_entries: LoreNewProposal[] } | null>(null);

  const getActiveLorebooks = useCallback(() => {
    const activeIds = currentConversation?.sessionLorebookIds || [];
    return lorebooks.filter(lb => activeIds.includes(lb.id));
  }, [currentConversation, lorebooks]);

  const handleProposeLoreEdits = useCallback(async () => {
    const activeLorebooks = getActiveLorebooks();
    if (messages.length === 0 || activeLorebooks.length === 0) return;
    
    startKeepAlive(appSettings);
    try {
      const result = await proposeLoreEdits(messages, activeLorebooks, appSettings);
      setLoreProposals(prev => ({ ...(prev || { edits: [], new_entries: [] }), edits: result.edits }));
      if (result.edits.length > 0) {
        setLoreReviewModalOpen(true);
      } else {
        alert("The AI didn't find any existing lore to correct.");
      }
    } catch (e) {
      console.error("Lore edit proposal failed:", e);
      alert(`Lore edit proposal failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      stopKeepAlive();
    }
  }, [messages, getActiveLorebooks, appSettings]);
  
  const handleExtractNewLore = useCallback(async () => {
    const activeLorebooks = getActiveLorebooks();
    if (messages.length === 0 || activeLorebooks.length === 0) return;
    
    startKeepAlive(appSettings);
    try {
      const result = await extractNewLoreEntries(messages, activeLorebooks, appSettings);
      const newEntriesWithIds = result.new_entries.map(e => ({ ...e, id: uuidv4() }));
      setLoreProposals(prev => ({ ...(prev || { edits: [], new_entries: [] }), new_entries: newEntriesWithIds }));
       if (result.new_entries.length > 0) {
        setLoreReviewModalOpen(true);
      } else {
        alert("The AI didn't find any new lore to extract from this chat.");
      }
    } catch (e) {
      console.error("New lore extraction failed:", e);
      alert(`New lore extraction failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      stopKeepAlive();
    }
  }, [messages, getActiveLorebooks, appSettings]);
  
  const handleApplyLoreUpdates = useCallback((updates: { edits: LoreEditProposal[], new_entries: LoreNewProposal[] }) => {
    onUpdateLorebooks(prevLorebooks => {
      let newLorebooks = [...prevLorebooks];
      
      // Apply edits
      updates.edits.forEach(edit => {
        newLorebooks = newLorebooks.map(lb => ({
          ...lb,
          entries: edit.new_content.trim() === ''
            ? lb.entries.filter(e => e.id !== edit.entry_id)
            : lb.entries.map(e => e.id === edit.entry_id ? { ...e, content: edit.new_content, timestamp: new Date().toISOString() } : e)
        }));
      });

      // Apply additions
      updates.new_entries.forEach(newEntry => {
        newLorebooks = newLorebooks.map(lb => {
          if (lb.id === newEntry.lorebook_id) {
            return {
              ...lb,
              entries: [...lb.entries, {
                id: uuidv4(), // Generate a new, permanent ID on save
                content: newEntry.content,
                keywords: newEntry.keywords,
                enabled: true,
                timestamp: new Date().toISOString()
              }]
            };
          }
          return lb;
        });
      });
      
      return newLorebooks;
    });
    setLoreReviewModalOpen(false);
  }, [onUpdateLorebooks]);

  return {
    isLoreReviewModalOpen, setLoreReviewModalOpen,
    loreProposals,
    handleProposeLoreEdits,
    handleExtractNewLore,
    handleApplyLoreUpdates,
  };
};
