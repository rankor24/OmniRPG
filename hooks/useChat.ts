
import React, { useState, useEffect } from 'react';

import type { AppSettings, Character, Lorebook, Persona, PromptTemplate, AvatarEmotionState, Memory, StylePreference } from '../types';
import { useChatStateAndEffects } from './useChatStateAndEffects';
import { useChatMessageActions } from './useChatMessageActions';
import { useChatMemoryActions } from './useChatMemoryActions';
import { useChatLoreActions } from './useChatLoreActions';
import { useChatSessionActions } from './useChatSessionActions';
import { ActionChatContextType } from '../contexts/ActionChatContext';

interface UseChatProps {
  characters: Character[];
  appSettings: AppSettings;
  lorebooks: Lorebook[];
  personas: Persona[];
  promptTemplates: PromptTemplate[];
  omniAiId: string;
  onUpdateLorebooks: (updater: (prev: Lorebook[]) => Lorebook[]) => void;
  allData: ActionChatContextType['allData'];
  dataModifiers: ActionChatContextType['dataModifiers'];
  allMemories: Memory[];
  onCreateMemory: (content: string, scope: Memory['scope'], entityId?: string) => Promise<string>;
  onUpdateMemory: (id: string, content: string) => Promise<string>;
  onDeleteMemory: (id: string) => Promise<string>;
  stylePreferences: StylePreference[];
}


export const useChat = (props: UseChatProps) => {
  const [avatarEmotionState, setAvatarEmotionState] = useState<AvatarEmotionState>({
    expression: 'neutral',
    effect: 'none',
    breathing: 'subtle',
    scale: 1,
  });

  const stateAndEffects = useChatStateAndEffects(props);

  useEffect(() => {
    // Reset avatar emotion when navigating to a new chat or character changes.
    setAvatarEmotionState(prev => ({ 
        ...prev, 
        expression: 'neutral', 
        effect: 'none', 
        breathing: 'subtle', 
        scale: 1,
    }));
  }, [stateAndEffects.conversationId, stateAndEffects.chatPartner?.id]);

  // Pass contextualChatContent to message actions
  const messageActions = useChatMessageActions({ 
      ...props, 
      ...stateAndEffects,
      contextualChatContent: stateAndEffects.contextualChatContent,
      setAvatarEmotionState 
  });
  const memoryActions = useChatMemoryActions({ ...props, ...stateAndEffects });
  const loreActions = useChatLoreActions({ ...props, ...stateAndEffects, isGeneratingMemories: memoryActions.isGeneratingMemories });
  const sessionActions = useChatSessionActions({ ...props, ...stateAndEffects });

  return {
    ...stateAndEffects,
    ...messageActions,
    ...memoryActions,
    ...loreActions,
    ...sessionActions,
    avatarEmotionState,
    setAvatarEmotionState,
  };
};
