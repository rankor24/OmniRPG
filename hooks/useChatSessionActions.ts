

import React, { useCallback } from 'react';
import type { Character, Conversation } from '../types';
import { useChatStateAndEffects } from './useChatStateAndEffects';
import { get as idbGet } from 'idb-keyval';
import { DEFAULT_RPG_GAME_STATE } from '../constants';

type UseChatStateAndEffectsReturn = ReturnType<typeof useChatStateAndEffects>;

interface UseChatSessionActionsProps extends UseChatStateAndEffectsReturn {
}

export interface ChatSettings {
    characterId: string | null;
    background: string;
    isVisualizedMode: boolean;
    isEditorMode: boolean;
    isIntelligenceInjected: boolean;
    editorModeContextScope?: 'full' | 'last_20' | 'last_10' | 'last_5' | 'last_3' | 'last_1';
    personaId?: string | null;
    isRpgMode: boolean;
}


export const useChatSessionActions = (props: UseChatSessionActionsProps) => {
  const {
    conversationId,
    currentConversation,
    updateConversation,
    setCharacter,
    setRpgGameState,
  } = props;

  const handleSaveChatSettings = useCallback((settings: ChatSettings) => {
    // Yield to the event loop to ensure the modal closes and UI updates 
    // BEFORE starting the heavy DB/State update process.
    setTimeout(async () => {
        if (!conversationId || !currentConversation) return;
        const { characterId, background, isVisualizedMode, isEditorMode, editorModeContextScope, isIntelligenceInjected, personaId, isRpgMode } = settings;
        
        const allChars = await idbGet<Character[]>('characters') || [];
        const char = allChars.find(c => c.id === characterId) || null;
        
        const updates: Partial<Conversation> = {
          sessionCharacterId: characterId,
          chatBackground: characterId ? undefined : background,
          isVisualizedMode,
          isEditorMode,
          editorModeContextScope,
          isIntelligenceInjected,
          personaId,
          isRpgMode,
          ...(char && { 
            relationshipScore: char.initialRelationshipScore,
            dominanceScore: char.initialDominanceScore,
            lustScore: 0,
            sessionLorebookIds: char.activeLorebookIds,
          }),
          ...(!char && {
            relationshipScore: 0,
            dominanceScore: 0,
            lustScore: 0,
            sessionLorebookIds: [],
          })
        };

        // Initialize RPG state if it's being turned on for the first time
        if (isRpgMode && !currentConversation.rpgGameState) {
          updates.rpgGameState = DEFAULT_RPG_GAME_STATE;
          setRpgGameState(DEFAULT_RPG_GAME_STATE);
        } else if (isRpgMode) {
          setRpgGameState(currentConversation.rpgGameState || DEFAULT_RPG_GAME_STATE);
        } else {
          updates.rpgGameState = undefined;
          setRpgGameState(null);
        }
        
        updateConversation(conversationId, updates);
        setCharacter(char); 
    }, 50); // Small delay to unblock main thread

  }, [conversationId, setCharacter, updateConversation, currentConversation, setRpgGameState]);

  const handleLorebookToggle = useCallback((lorebookId: string) => {
    if (!currentConversation) return;

    const currentLorebookIds = currentConversation.sessionLorebookIds || [];
    const newLorebookIds = currentLorebookIds.includes(lorebookId)
        ? currentLorebookIds.filter(id => id !== lorebookId)
        : [...currentLorebookIds, lorebookId];
    
    updateConversation(currentConversation.id, { sessionLorebookIds: newLorebookIds });
  }, [currentConversation, updateConversation]);

  const handleToggleContextChat = useCallback((contextChatId: string) => {
    if (!currentConversation) return;
    
    const currentContextualIds = currentConversation.contextualConversationIds || [];
    const newContextualIds = currentContextualIds.includes(contextChatId)
        ? currentContextualIds.filter(id => id !== contextChatId)
        : [...currentContextualIds, contextChatId];
        
    updateConversation(currentConversation.id, { contextualConversationIds: newContextualIds });
  }, [currentConversation, updateConversation]);

  return {
    handleSaveChatSettings,
    handleLorebookToggle,
    handleToggleContextChat,
  };
};