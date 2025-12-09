import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { Character, AppSettings, ChatMessage, ChatSceneState, Conversation, Lorebook, Persona, Memory, StylePreference, Reflection, RpgGameState } from '../types';
import { DEFAULT_USER_STATUS } from '../constants';
import { useIdbStorage } from './useIdbStorage';
import { get, set, keys as idbKeys } from 'idb-keyval';

interface UseChatStateAndEffectsProps {
  characters: Character[];
  appSettings: AppSettings;
  personas: Persona[];
  omniAiId: string;
  allMemories: Memory[];
  stylePreferences: StylePreference[];
}

export const useChatStateAndEffects = ({ characters, appSettings, personas, omniAiId, allMemories, stylePreferences }: UseChatStateAndEffectsProps) => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sceneState, setSceneState] = useState<ChatSceneState | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [isTransparentMode, setTransparentMode] = useState(false);
  
  const [showCharacterStatus, setShowCharacterStatus] = useState(true);
  const [showUserStatus, setShowUserStatus] = useState(true);

  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isGeneratingFirstMessage, setIsGeneratingFirstMessage] = useState(false);
  const hasInitiatedFirstMessage = useRef(false);
  
  // Track loaded conversation ID to prevent re-fetching history on settings updates
  const historyLoadedRef = useRef<string | null>(null);
  
  const [rpgGameState, setRpgGameState] = useState<RpgGameState | null>(null);

  // --- Derived Memories from Single Source of Truth (SSOT) ---
  const globalMemories = useMemo(() => allMemories.filter(m => m.scope === 'global'), [allMemories]);
  
  const characterMemories = useMemo(() => {
      const charId = currentConversation?.sessionCharacterId || (conversationId ? omniAiId : null);
      if (!charId) return [];
      return allMemories.filter(m => m.scope === 'character' && m.characterId === charId);
  }, [allMemories, currentConversation?.sessionCharacterId, conversationId, omniAiId]);

  const conversationMemories = useMemo(() => {
      if (!conversationId) return [];
      return allMemories.filter(m => m.scope === 'conversation' && m.conversationId === conversationId);
  }, [allMemories, conversationId]);

  // Setters for compatibility - these now just log warnings or do nothing as mutations should go via onCreateMemory
  const setGlobalMemories = () => console.warn("Direct setter for globalMemories used in Chat. Use onCreateMemory instead.");
  const setCharacterMemories = () => console.warn("Direct setter for characterMemories used in Chat. Use onCreateMemory instead.");
  const setConversationMemories = () => console.warn("Direct setter for conversationMemories used in Chat. Use onCreateMemory instead.");
  // For stylePreferences, we use the prop directly. The setter is passed separately to MemoryModal if needed.
  const setStylePreferences = () => console.warn("Direct setter for stylePreferences used in Chat hook. Use the prop setter passed to components.");

  const [reflections, setReflections] = useIdbStorage<Reflection[]>(conversationId ? `reflections_${conversationId}` : 'reflections_null', []);
  
  const [allContextualMemories, setAllContextualMemories] = useState<Memory[]>([]);
  const [allConversationsForContext, setAllConversationsForContext] = useState<(Conversation & { characterName: string })[]>([]);
  const [contextualChatContent, setContextualChatContent] = useState<string>('');

  const omniAiCharacter = useMemo(() => characters.find(c => c.id === omniAiId), [characters, omniAiId]);

  const activePersona = useMemo(() => {
    const personaId = currentConversation?.personaId || appSettings.activePersonaId;
    return personas.find(p => p.id === personaId) || personas[0];
  }, [currentConversation, appSettings.activePersonaId, personas]);
  
  const chatPartner = useMemo(() => {
    return character || omniAiCharacter;
  }, [character, omniAiCharacter]);

  const allMemoriesForPrompt = useMemo(() => {
    if (!character) {
        // In OmniAI mode, include contextual memories from other chats if available
        return [...globalMemories, ...characterMemories, ...allContextualMemories];
    }
    return [...globalMemories, ...characterMemories, ...conversationMemories];
  }, [character, globalMemories, characterMemories, conversationMemories, allContextualMemories]);

  const canGenerateMemories = useMemo(() => messages.length >= 2, [messages]);

  useEffect(() => {
    const characterMap = new Map(characters.map(c => [c.id, c]));
    const allConvos: (Conversation & { characterName: string })[] = [];
    const lsKeys = Object.keys(localStorage);
    const conversationLsKeys = lsKeys.filter(key => key.startsWith('conversations_'));
    for (const key of conversationLsKeys) {
        const storedConvos = localStorage.getItem(key);
        if (storedConvos) {
            const convos: Conversation[] = JSON.parse(storedConvos);
            convos.forEach(convo => {
                const character = characterMap.get(convo.sessionCharacterId || convo.characterId);
                allConvos.push({ ...convo, characterName: character?.name || 'OmniAI' });
            });
        }
    }
    setAllConversationsForContext(allConvos.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()));
  }, [characters]);
  
  // Calculate contextual memories using the passed allMemories prop, avoiding extra IDB reads
  useEffect(() => {
    if (!character && conversationId) {
        const characterMap = new Map(characters.map(c => [c.id, c]));
        
        // Build a map of conversation metadata
        const allLsConvos: { [id: string]: { preview: string, characterName: string } } = {};
        const lsKeys = Object.keys(localStorage);
        const conversationLsKeys = lsKeys.filter(key => key.startsWith('conversations_'));
        for (const key of conversationLsKeys) {
            const storedConvos = localStorage.getItem(key);
            if (storedConvos) {
                const convos: Conversation[] = JSON.parse(storedConvos);
                convos.forEach(convo => {
                    const char = characterMap.get(convo.sessionCharacterId || convo.characterId);
                    allLsConvos[convo.id] = { preview: convo.preview, characterName: char?.name || 'OmniAI' };
                });
            }
        }

        const relevantMemories = allMemories.filter(m => 
            (m.scope === 'character' && m.characterId !== omniAiId) || 
            (m.scope === 'conversation' && m.conversationId !== conversationId)
        );

        const memoriesWithContext = relevantMemories.map(mem => {
             let contextPrefix = '';
             if (mem.scope === 'character' && mem.characterId) {
                 const charName = characterMap.get(mem.characterId)?.name;
                 if (charName) contextPrefix = `(Memory about ${charName}): `;
             } else if (mem.scope === 'conversation' && mem.conversationId) {
                const convoMeta = allLsConvos[mem.conversationId];
                if (convoMeta) contextPrefix = `(Memory from chat with ${convoMeta.characterName} - "${convoMeta.preview.substring(0, 30)}..."): `;
             }
             return { ...mem, content: `${contextPrefix}${mem.content}` };
        });

        setAllContextualMemories(memoriesWithContext);
    } else {
        setAllContextualMemories([]);
    }
  }, [character, conversationId, characters, omniAiId, allMemories]);

  // New Effect: Fetch content for Contextual Chats
  useEffect(() => {
    const loadContextualChats = async () => {
        if (!currentConversation?.contextualConversationIds || currentConversation.contextualConversationIds.length === 0) {
            setContextualChatContent('');
            return;
        }

        const parts: string[] = [];
        for (const id of currentConversation.contextualConversationIds) {
            const convoMeta = allConversationsForContext.find(c => c.id === id);
            const title = convoMeta?.preview || 'Unknown Chat';
            const charName = convoMeta?.characterName || 'Unknown';
            
            const history = await get<ChatMessage[]>(`chatHistory_${id}`);
            if (history && history.length > 0) {
                // Use full history, no truncation per message to ensure full context
                const formattedHistory = history.map(m => {
                    const content = m.versions[m.activeVersionIndex].content;
                    return `${m.role === 'user' ? 'User' : m.authorName}: ${content}`;
                }).join('\n');
                
                parts.push(`\n**[Context from Chat "${title}" with ${charName}]**\n${formattedHistory}`);
            }
        }
        
        if (parts.length > 0) {
            setContextualChatContent(`\n\n**Additional Context from Selected Conversations:**\n${parts.join('\n')}`);
        } else {
            setContextualChatContent('');
        }
    };
    
    loadContextualChats();
  }, [currentConversation?.contextualConversationIds, allConversationsForContext]);
  
  const updateConversation = useCallback((conversationIdToUpdate: string, updatedConvoData: Partial<Conversation>) => {
    if (!omniAiId) return;

    const conversationsKey = `conversations_${omniAiId}`;
    const storedConvosRaw = localStorage.getItem(conversationsKey);
    const conversations: Conversation[] = storedConvosRaw ? JSON.parse(storedConvosRaw) : [];
    
    let finalUpdatedConvo: Conversation | undefined;

    const updatedConversations = conversations.map(c => {
        if (c.id === conversationIdToUpdate) {
            finalUpdatedConvo = { ...c, ...updatedConvoData };
            return finalUpdatedConvo;
        }
        return c;
    });

    localStorage.setItem(conversationsKey, JSON.stringify(updatedConversations));
    
    if (conversationId === conversationIdToUpdate && finalUpdatedConvo) {
      setCurrentConversation(finalUpdatedConvo);
    }
  }, [omniAiId, conversationId, setCurrentConversation]);

  const persistAndUpdateConversation = useCallback((newMessages: ChatMessage[], newRelScore?: number, newDomScore?: number, newLustScore?: number, newRpgState?: RpgGameState | null) => {
    if (!omniAiId || !conversationId) return;
    set(`chatHistory_${conversationId}`, newMessages);

    const conversationsKey = `conversations_${omniAiId}`;
    const storedConvosRaw = localStorage.getItem(conversationsKey);
    const conversations: Conversation[] = storedConvosRaw ? JSON.parse(storedConvosRaw) : [];
    const currentConvoFromStorage = conversations.find(c => c.id === conversationId);

    const updates: Partial<Conversation> = {};
    const lastMessage = newMessages[newMessages.length - 1];
    
    if (lastMessage && !currentConvoFromStorage?.hasCustomTitle) {
        const previewContent = lastMessage.versions[lastMessage.activeVersionIndex].content;
        const preview = lastMessage.role === 'user' ? `You: ${previewContent}` : `${lastMessage.authorName}: ${previewContent}`;
        updates.preview = preview.substring(0, 100);
    }

    if (lastMessage) updates.lastMessageAt = new Date().toISOString();
    if (newRelScore !== undefined) updates.relationshipScore = newRelScore;
    if (newDomScore !== undefined) updates.dominanceScore = newDomScore;
    if (newLustScore !== undefined) updates.lustScore = newLustScore;
    if (newRpgState !== undefined) updates.rpgGameState = newRpgState || undefined;

    if (Object.keys(updates).length > 0) {
      updateConversation(conversationId, updates);
    }
  }, [omniAiId, conversationId, updateConversation]);

  // Effect 1: Load the core conversation object.
  useEffect(() => {
    if (!omniAiId || !conversationId) {
      navigate('/');
      return;
    }

    // Reset history loaded ref if ID changes
    if (historyLoadedRef.current !== conversationId) {
      historyLoadedRef.current = null;
      hasInitiatedFirstMessage.current = false;
    }

    const newConversationFromState = location.state?.newConversation;
    const conversationsKey = `conversations_${omniAiId}`;
    const storedConversations = localStorage.getItem(conversationsKey);
    const conversations: Conversation[] = storedConversations ? JSON.parse(storedConversations) : [];
    
    let convo = conversations.find(c => c.id === conversationId);

    if (!convo && newConversationFromState && newConversationFromState.id === conversationId) {
      convo = newConversationFromState;
    }

    if (!convo) {
      return; // Wait for re-render if convo isn't found yet
    }
    
    if (convo.relationshipScore === undefined) convo.relationshipScore = 0;
    if (convo.dominanceScore === undefined) convo.dominanceScore = 0;
    if (convo.lustScore === undefined) convo.lustScore = 0;
    
    setCurrentConversation(convo);
    setRpgGameState(convo.rpgGameState || null);

  }, [conversationId, omniAiId, navigate, location.state]);

  // Effect 2: Determine the character based on the loaded conversation.
  useEffect(() => {
    if (!currentConversation || characters.length === 0) return;

    const isRoleplaySession = !!currentConversation.sessionCharacterId;
    let charToUse: Character | null = null;
    if (isRoleplaySession) {
      charToUse = characters.find(c => c.id === currentConversation.sessionCharacterId) || null;
    }
    setCharacter(charToUse);
  }, [currentConversation, characters, omniAiId]);

  // Effect 3: Load messages/scene and handle first message generation.
  useEffect(() => {
    if (!currentConversation || !conversationId) return;
    
    if (historyLoadedRef.current === conversationId) {
        return; 
    }

    const aiChar = currentConversation.sessionCharacterId
      ? characters.find(c => c.id === currentConversation.sessionCharacterId)
      : omniAiCharacter;

    if (!aiChar) return; // Wait for character data

    const loadSecondaryData = async () => {
      const historyKey = `chatHistory_${conversationId}`;
      const storedHistory = await get<ChatMessage[]>(historyKey);

      if (!storedHistory || storedHistory.length === 0) {
        const isRoleplay = !!currentConversation.sessionCharacterId;
        if (appSettings.enableDynamicFirstMessages && (isRoleplay || aiChar.id === omniAiId) && !hasInitiatedFirstMessage.current) {
          hasInitiatedFirstMessage.current = true;
          setMessages([]);
          setIsGeneratingFirstMessage(true);
        } else if (aiChar.firstMessage) {
          const firstMessage: ChatMessage = {
            id: 'initial-message', role: 'assistant', authorName: aiChar.name, authorAvatar: aiChar.avatar,
            versions: [{ content: aiChar.firstMessage, rating: 0 }], activeVersionIndex: 0, timestamp: new Date().toISOString()
          };
          setMessages([firstMessage]);
          await set(historyKey, [firstMessage]);
        }
      } else {
        setMessages(storedHistory);
      }

      const sceneKey = `chatScene_${conversationId}`;
      const storedState = await get<ChatSceneState>(sceneKey);
      if (storedState) {
        setSceneState(storedState);
      } else {
        let initLocation = aiChar.location || '';
        let initAppearance = aiChar.appearance || '';
        let initPosition = aiChar.position || '';

        if (aiChar.firstMessage && aiChar.firstMessage.includes('[CHARACTER STATUS]')) {
             const blockContent = aiChar.firstMessage.match(/\[CHARACTER STATUS\]([\s\S]*?)(?=\n\n|\[USER STATUS\]|$)/s)?.[1] || '';
             if (blockContent) {
                initLocation = blockContent.match(/Location: (.*)/)?.[1].trim() || initLocation;
                initAppearance = blockContent.match(/Appearance: (.*)/)?.[1].trim() || initAppearance;
                initPosition = blockContent.match(/Position: (.*)/)?.[1].trim() || initPosition;
             }
        } else {
             const lines = initAppearance.split('\n');
             if (lines.length > 3) {
                 initAppearance = lines.slice(0, 3).join('\n') + '...';
             }
        }

        const initialState: ChatSceneState = {
          characterStatus: { location: initLocation, appearance: initAppearance, position: initPosition },
          userStatus: DEFAULT_USER_STATUS,
        };
        setSceneState(initialState);
        await set(sceneKey, initialState);
      }
      
      // Mark as loaded
      historyLoadedRef.current = conversationId;
    };

    loadSecondaryData();
  }, [currentConversation, conversationId, characters, omniAiCharacter, appSettings.enableDynamicFirstMessages]);
  
  return {
    conversationId,
    navigate,
    messages, setMessages,
    character, setCharacter,
    currentConversation, setCurrentConversation,
    sceneState, setSceneState,
    userInput, setUserInput,
    isLoading, setIsLoading,
    editingMessageId, setEditingMessageId,
    isTransparentMode, setTransparentMode,
    showCharacterStatus, setShowCharacterStatus,
    showUserStatus, setShowUserStatus,
    omniAiCharacter,
    chatPartner,
    activePersona,
    allMemoriesForPrompt,
    stylePreferences, setStylePreferences,
    globalMemories, setGlobalMemories, // NOTE: setters now warn only
    characterMemories, setCharacterMemories,
    conversationMemories, setConversationMemories,
    reflections, setReflections,
    allConversationsForContext,
    contextualChatContent, // New return value
    isGeneratingFirstMessage, setIsGeneratingFirstMessage,
    updateConversation,
    persistAndUpdateConversation,
    canGenerateMemories,
    rpgGameState, setRpgGameState,
  };
};
