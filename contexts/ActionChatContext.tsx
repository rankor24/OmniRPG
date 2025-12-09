import React, { createContext, useContext } from 'react';
import type { Character, Lorebook, Persona, PromptTemplate, AppSettings, ActionChatPageContext, Memory } from '../types';

export interface ActionChatContextType {
  isOpen: boolean;
  pageContext: { page: ActionChatPageContext | null; data: any };
  openChat: (page: ActionChatPageContext) => void;
  closeChat: () => void;
  allData: {
    characters: Character[];
    lorebooks: Lorebook[];
    personas: Persona[];
    promptTemplates: PromptTemplate[];
    appSettings: AppSettings;
    allMemories: Memory[];
  };
  dataModifiers: {
    handleSaveCharacter: (char: Character) => void;
    handleDeleteCharacter: (charId: string) => void;
    handleSaveLorebook: (lb: Lorebook) => void;
    handleDeleteLorebook: (lbId: string) => void;
    handleSavePersona: (p: Persona) => void;
    handleDeletePersona: (pId: string) => void;
    handleSavePromptTemplate: (p: PromptTemplate) => void;
    handleDeletePromptTemplate: (pId: string) => void;
    handleCreateMemory: (content: string, scope: Memory['scope'], entityId?: string) => Promise<string>;
    handleUpdateMemory: (id: string, content: string) => Promise<string>;
    handleDeleteMemory: (id: string) => Promise<string>;
  };
}

export const ActionChatContext = createContext<ActionChatContextType | undefined>(undefined);

export const useActionChat = () => {
  const context = useContext(ActionChatContext);
  if (!context) {
    throw new Error('useActionChat must be used within a ActionChatProvider');
  }
  return context;
};