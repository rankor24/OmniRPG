import { useState, useCallback } from 'react';
import type { AppSettings, Character, ChatMessage, Memory } from '../types';
import { extractNewFacts, summarizeHistory, proposeMemoryCorrection } from '../services/memory';
import type { useChatStateAndEffects } from './useChatStateAndEffects';
import { startKeepAlive, stopKeepAlive } from '../services/backgroundKeepAlive';


type UseChatStateAndEffectsReturn = ReturnType<typeof useChatStateAndEffects>;

interface UseChatMemoryActionsProps extends UseChatStateAndEffectsReturn {
  appSettings: AppSettings;
  onCreateMemory: (content: string, scope: Memory['scope'], entityId?: string) => Promise<string>;
  onUpdateMemory: (id: string, content: string) => Promise<string>;
  onDeleteMemory: (id: string) => Promise<string>;
}

export const useChatMemoryActions = (props: UseChatMemoryActionsProps) => {
  const {
    appSettings,
    messages,
    character,
    conversationId,
    conversationMemories,
    characterMemories,
    globalMemories,
    canGenerateMemories,
    onCreateMemory,
    onUpdateMemory,
    onDeleteMemory
  } = props;

  const [isGeneratingMemories, setIsGeneratingMemories] = useState(false);
  const [isMemoryReviewModalOpen, setMemoryReviewModalOpen] = useState(false);
  const [memoryCorrectionProposals, setMemoryCorrectionProposals] = useState<{ oldMemoryId: string; originalMemoryContent: string; newContent: string; scope: Memory['scope'] }[] | null>(null);
  
  const handleMemoryGeneration = useCallback(async (
    scope: Memory['scope'], 
    generatorFn: (history: ChatMessage[], appSettings: AppSettings) => Promise<string | string[] | null>
  ) => {
    if (!canGenerateMemories) return;
    setIsGeneratingMemories(true);
    startKeepAlive(appSettings);
    
    try {
      const results = await generatorFn(messages, appSettings);
      if (results) {
        const newMemoryContents = (Array.isArray(results) ? results : [results])
          .filter(content => content && content.trim().length > 0);

        for (const content of newMemoryContents) {
            let entityId: string | undefined;
            if (scope === 'character') entityId = character?.id;
            else if (scope === 'conversation') entityId = conversationId;
            
            // This now calls the central handler in App.tsx, updating the Single Source of Truth
            await onCreateMemory(content!, scope, entityId);
        }
      }
    } catch (e) {
      console.error("Memory generation failed:", e);
      alert(`Memory generation failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingMemories(false);
      stopKeepAlive();
    }
  }, [canGenerateMemories, appSettings, messages, character, conversationId, onCreateMemory]);

  const handleExtractFacts = useCallback((scope: Memory['scope']) => {
    const existingMemories = [...globalMemories, ...characterMemories, ...conversationMemories].map(m => m.content);
    handleMemoryGeneration(scope, (history, settings) => extractNewFacts(history, existingMemories, settings));
  }, [globalMemories, characterMemories, conversationMemories, handleMemoryGeneration]);
  
  const handleSummarizeHistory = useCallback((scope: Memory['scope']) => {
    handleMemoryGeneration(scope, (history, settings) => summarizeHistory(history, settings));
  }, [handleMemoryGeneration]);

  const handleCheckMemoryCorrection = useCallback(async (scope: Memory['scope']) => {
    if (!canGenerateMemories) return;
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) return;

    setIsGeneratingMemories(true);
    startKeepAlive(appSettings);
    
    const memoriesForScope = {
      global: globalMemories,
      character: characterMemories,
      conversation: conversationMemories
    }[scope];

    try {
        const corrections = await proposeMemoryCorrection(lastUserMessage, messages, memoriesForScope, appSettings);
        if (corrections && corrections.length > 0) {
            const proposals = corrections.map(corr => {
                const originalMemory = memoriesForScope.find(m => m.id === corr.oldMemoryId);
                return { ...corr, originalMemoryContent: originalMemory?.content || '', scope };
            });
            setMemoryCorrectionProposals(proposals);
            setMemoryReviewModalOpen(true);
        } else {
            alert("The AI didn't find any facts to correct in this memory scope.");
        }
    } catch (e) {
        console.error("Memory correction check failed:", e);
        alert(`Memory correction check failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
        setIsGeneratingMemories(false);
        stopKeepAlive();
    }
  }, [canGenerateMemories, messages, appSettings, globalMemories, characterMemories, conversationMemories, setMemoryReviewModalOpen]);
  
  const handleApplyMemoryCorrections = useCallback(async (corrections: { oldMemoryId: string; newContent: string; scope: Memory['scope'] }[]) => {
    for (const corr of corrections) {
        if (corr.newContent.trim()) {
            await onUpdateMemory(corr.oldMemoryId, corr.newContent.trim());
        } else {
            await onDeleteMemory(corr.oldMemoryId);
        }
    }
    setMemoryReviewModalOpen(false);
  }, [onUpdateMemory, onDeleteMemory]);


  return {
    isGeneratingMemories,
    isMemoryReviewModalOpen, setMemoryReviewModalOpen,
    memoryCorrectionProposals,
    handleExtractFacts,
    handleSummarizeHistory,
    handleCheckMemoryCorrection,
    handleApplyMemoryCorrections,
  };
};