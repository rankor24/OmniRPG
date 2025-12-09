


import React, { useState, useCallback, useEffect, useMemo, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import type { Character, AppSettings, Conversation, Lorebook, Persona, PromptTemplate, ActionChatPageContext, Memory, InstructionalPrompt, StylePreference, RpgItem } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useIdbStorage } from './hooks/useIdbStorage';
import { useAllMemories } from './hooks/useAllMemories';
import { DEFAULT_CHARACTERS, DEFAULT_APP_SETTINGS, DEFAULT_OMNI_AI_CHARACTER } from './constants';
import { ALL_PERSONAS } from './data/personas';
import { ALL_LOREBOOKS } from './data/lorebooks';
import { ALL_PROMPTS } from './data/prompts';
import { DEFAULT_LIBRARY_ITEMS } from './data/items';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import { v4 as uuidv4 } from 'uuid';
import { get, set, keys as idbKeys } from 'idb-keyval';
import { ActionChatContext } from './contexts/ActionChatContext';
import OmniFAB from './components/OmniFAB';
import ActionChatModal from './components/ActionChatModal';
import { listWorlds } from './services/worldManager';

// Lazy load pages
const WelcomePage = lazy(() => import('./pages/WelcomePage'));
const CampaignSelectPage = lazy(() => import('./pages/CampaignSelectPage'));
const ChatListPage = lazy(() => import('./pages/ChatListPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const EditCharacterPage = lazy(() => import('./pages/EditCharacterPage'));
const EditLorebookPage = lazy(() => import('./pages/EditLorebookPage'));
const LorebookListPage = lazy(() => import('./pages/LorebookListPage'));
const MyPersonasPage = lazy(() => import('./pages/MyPersonasPage'));
const EditPersonaPage = lazy(() => import('./pages/EditPersonaPage'));
const CampaignJournalPage = lazy(() => import('./pages/MemoryCortexPage')); 
const QuestLogPage = lazy(() => import('./pages/QuestLogPage')); 
const PromptLibraryPage = lazy(() => import('./pages/PromptLibraryPage'));
const EditPromptTemplatePage = lazy(() => import('./pages/EditPromptTemplatePage'));
const EditInstructionalPromptPage = lazy(() => import('./pages/EditInstructionalPromptPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const ReflectionsPage = lazy(() => import('./pages/ReflectionsPage'));
const EmbeddingsPage = lazy(() => import('./pages/EmbeddingsPage'));
const OmniAiDashboardPage = lazy(() => import('./pages/OmniAiDashboardPage'));


const OMNIAI_ID = 'omni-ai';

function App() {
  const [characters, setCharacters, isCharactersLoading] = useIdbStorage<Character[]>('characters', DEFAULT_CHARACTERS);
  const [lorebooks, setLorebooks, isLorebooksLoading] = useIdbStorage<Lorebook[]>('lorebooks', ALL_LOREBOOKS);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useLocalStorage('sidebarCollapsed', false);
  
  const [personas, setPersonas, isPersonasLoading] = useIdbStorage<Persona[]>('personas', ALL_PERSONAS);
  const [appSettings, setAppSettings] = useLocalStorage<AppSettings>('appSettings', DEFAULT_APP_SETTINGS);
  const [promptTemplates, setPromptTemplates, isPromptsLoading] = useIdbStorage<PromptTemplate[]>('promptTemplates', ALL_PROMPTS);
  const { allMemories, setAllMemories, loading: isMemoriesLoading } = useAllMemories();
  const [stylePreferences, setStylePreferences, isStylesLoading] = useIdbStorage<StylePreference[]>('style_preferences', []);
  
  // Dynamic Item Library
  const [libraryItems, setLibraryItems, isItemsLoading] = useIdbStorage<RpgItem[]>('library_items', DEFAULT_LIBRARY_ITEMS);

  // Initialize Worlds
  useEffect(() => {
      listWorlds().catch(console.error);
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  
  // State for Action Chat
  const [isActionChatOpen, setIsActionChatOpen] = useState(false);
  const [actionChatPageContext, setActionChatPageContext] = useState<ActionChatPageContext | null>(null);

  const isAppLoading = isCharactersLoading || isLorebooksLoading || isMemoriesLoading || isPersonasLoading || isPromptsLoading || isStylesLoading || isItemsLoading;

  const handleSaveAppSettings = useCallback((updatedSettings: AppSettings) => {
    setAppSettings(updatedSettings);
  }, [setAppSettings]);

  const handleRunMigrations = useCallback(() => {
    setAppSettings(prevSettings => {
        const defaultPrompts = DEFAULT_APP_SETTINGS.instructionalPrompts.filter(p => p && typeof p.id === 'string');
        const storedPrompts = prevSettings.instructionalPrompts;
        let mergedPrompts: InstructionalPrompt[] = [...defaultPrompts]; 

        if (Array.isArray(storedPrompts)) {
            const filteredStoredPrompts = storedPrompts.filter(p => p && typeof p.id === 'string');
            const storedPromptsMap = new Map(filteredStoredPrompts.map(p => [p.id, p]));
            mergedPrompts = defaultPrompts.map(defaultPrompt => 
                storedPromptsMap.get(defaultPrompt.id) || defaultPrompt
            );
            filteredStoredPrompts.forEach(storedPrompt => {
                if (!mergedPrompts.some(p => p.id === storedPrompt.id)) {
                    mergedPrompts.push(storedPrompt);
                }
            });
        }
        
        let newSettings = { ...prevSettings, instructionalPrompts: mergedPrompts };
        return newSettings;
    });

    setPromptTemplates(prev => {
        const needsMigration = prev.some(p => !p.timestamp);
        if (needsMigration) {
            return prev.map((p, index) => 
                p.timestamp ? p : { ...p, timestamp: new Date(Date.now() - (index * 60000)).toISOString() }
            );
        }
        return prev; 
    });
    alert("Data migrations and updates applied successfully!");
}, [setAppSettings, setPromptTemplates]);


  const handleLogout = () => {
    navigate('/');
  };
  
  useEffect(() => {
    if (isAppLoading) return; 
    setCharacters(prev => {
      if (!prev.find(c => c.id === OMNIAI_ID)) {
        return [...prev, DEFAULT_OMNI_AI_CHARACTER];
      }
      return prev;
    });
  }, [setCharacters, isAppLoading]);
  
  const isWelcomePage = location.pathname === '/';

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, [setSidebarCollapsed]);

  // --- Data Modification Handlers ---
  const _handleSaveCharacter = useCallback((charToSave: Character) => {
    setCharacters(prev => {
      const existing = prev.find(c => c.id === charToSave.id);
      if (existing) {
        return prev.map(c => c.id === charToSave.id ? charToSave : c);
      }
      return [...prev, charToSave];
    });
  }, [setCharacters]);
  const handleSaveCharacter = useCallback((charToSave: Character) => {
    _handleSaveCharacter(charToSave);
    navigate(`/lorebooks`); // Redirect to new combined location
  }, [_handleSaveCharacter, navigate]);

  const _handleDeleteCharacter = useCallback((charId: string) => {
    if (charId === OMNIAI_ID) {
      alert("The OmniAI persona cannot be deleted.");
      return;
    }
    setCharacters(prev => prev.filter(c => c.id !== charId));
  }, [setCharacters]);
  const handleDeleteCharacter = useCallback((charId: string) => {
    _handleDeleteCharacter(charId);
    navigate('/lorebooks'); // Redirect to new combined location
  }, [_handleDeleteCharacter, navigate]);

  const _handleSaveLorebook = useCallback((lorebookToSave: Lorebook) => {
    setLorebooks(prev => {
      const existing = prev.find(l => l.id === lorebookToSave.id);
      if (existing) {
        return prev.map(l => l.id === lorebookToSave.id ? lorebookToSave : l);
      }
      return [...prev, lorebookToSave];
    });
  }, [setLorebooks]);
  const handleSaveLorebook = useCallback((lorebookToSave: Lorebook) => {
    _handleSaveLorebook(lorebookToSave);
    navigate('/lorebooks');
  }, [_handleSaveLorebook, navigate]);

  const _handleDeleteLorebook = useCallback((lorebookId: string) => {
    setLorebooks(prev => prev.filter(l => l.id !== lorebookId));
    setCharacters(prevChars => prevChars.map(char => ({
      ...char,
      activeLorebookIds: char.activeLorebookIds.filter(id => id !== lorebookId)
    })));
  }, [setLorebooks, setCharacters]);
  const handleDeleteLorebook = useCallback((lorebookId: string) => {
    _handleDeleteLorebook(lorebookId);
    navigate('/lorebooks');
  }, [_handleDeleteLorebook, navigate]);

  const _handleSavePersona = useCallback((personaToSave: Persona) => {
    setPersonas(prev => {
      const existing = prev.find(p => p.id === personaToSave.id);
      if (existing) {
        return prev.map(p => p.id === personaToSave.id ? personaToSave : p);
      }
      return [...prev, personaToSave];
    });
  }, [setPersonas]);
  const handleSavePersona = useCallback((personaToSave: Persona) => {
    _handleSavePersona(personaToSave);
    navigate('/personas');
  }, [_handleSavePersona, navigate]);

  const handleSetActivePersona = (personaId: string) => {
    setAppSettings(prev => ({ ...prev, activePersonaId: personaId }));
  };

  const _handleDeletePersona = useCallback((personaId: string) => {
    if (personas.length <= 1) {
      alert("You cannot delete your only persona.");
      return;
    }
    if (appSettings.activePersonaId === personaId) {
      const newActive = personas.find(p => p.id !== personaId);
      if (newActive) {
        handleSetActivePersona(newActive.id);
      }
    }
    setPersonas(prev => prev.filter(p => p.id !== personaId));
  }, [personas, appSettings.activePersonaId, setPersonas, setAppSettings]);
  const handleDeletePersona = useCallback((personaId: string) => {
    _handleDeletePersona(personaId);
    navigate('/personas');
  }, [_handleDeletePersona, navigate]);
  
  const _handleSavePromptTemplate = useCallback((promptToSave: PromptTemplate) => {
    const promptWithTimestamp = { ...promptToSave, timestamp: new Date().toISOString() };
    setPromptTemplates(prev => {
      const existing = prev.find(p => p.id === promptToSave.id);
      if (existing) {
        return prev.map(p => p.id === promptToSave.id ? promptWithTimestamp : p);
      }
      return [...prev, promptWithTimestamp];
    });
  }, [setPromptTemplates]);
  const handleSavePromptTemplate = useCallback((promptToSave: PromptTemplate) => {
    _handleSavePromptTemplate(promptToSave);
    navigate('/prompts');
  }, [_handleSavePromptTemplate, navigate]);
  
  const _handleDeletePromptTemplate = useCallback((promptId: string) => {
     setPromptTemplates(prev => prev.filter(p => p.id !== promptId));
  }, [setPromptTemplates]);
  const handleDeletePromptTemplate = useCallback((promptId: string) => {
     _handleDeletePromptTemplate(promptId);
     navigate('/prompts');
  }, [_handleDeletePromptTemplate, navigate]);

    // Memory Modifiers
    const _handleCreateMemory = useCallback(async (content: string, scope: Memory['scope'], entityId?: string) => {
      let key = '';
      const newMem: Memory = { id: uuidv4(), content, timestamp: new Date().toISOString(), scope };
      
      if (scope === 'global') {
          key = 'global_memories';
      } else if (scope === 'character' && entityId) {
          key = `memories_character_${entityId}`;
          newMem.characterId = entityId;
          const character = characters.find(c => c.id === entityId);
          newMem.characterName = character?.name;
      } else if (scope === 'conversation' && entityId) {
          key = `memories_conversation_${entityId}`;
          newMem.conversationId = entityId;
      } else {
          throw new Error('Invalid scope or missing entityId for memory creation.');
      }
      
      const currentMems = await get<Memory[]>(key) || [];
      await set(key, [...currentMems, newMem]);
      setAllMemories(prev => [...prev, newMem]);
      return `Created memory: "${content.substring(0, 30)}..."`;
    }, [characters, setAllMemories]);
  
    const _handleUpdateMemory = useCallback(async (id: string, content: string) => {
      const allIdbKeys = await idbKeys();
      const memoryKeys = ['global_memories', ...allIdbKeys.filter(k => typeof k === 'string' && (k.startsWith('memories_character_') || k.startsWith('memories_conversation_')))];
      
      for (const key of memoryKeys) {
          const memories = await get<Memory[]>(key as any);
          if (memories && memories.some(m => m.id === id)) {
              const updatedMemories = memories.map(m => m.id === id ? { ...m, content, timestamp: new Date().toISOString() } : m);
              await set(key as any, updatedMemories);
              setAllMemories(prev => prev.map(m => m.id === id ? { ...m, content, timestamp: new Date().toISOString() } : m));
              return `Updated memory ID ${id}.`;
          }
      }
      throw new Error(`Memory with ID "${id}" not found.`);
    }, [setAllMemories]);
    
    const _handleDeleteMemory = useCallback(async (id: string) => {
      const allIdbKeys = await idbKeys();
      const memoryKeys = ['global_memories', ...allIdbKeys.filter(k => typeof k === 'string' && (k.startsWith('memories_character_') || k.startsWith('memories_conversation_')))];
  
      for (const key of memoryKeys) {
          const memories = await get<Memory[]>(key as any);
          if (memories && memories.some(m => m.id === id)) {
              await set(key as any, memories.filter(m => m.id !== id));
              setAllMemories(prev => prev.filter(m => m.id !== id));
              return `Deleted memory ID ${id}.`;
          }
      }
      throw new Error(`Memory with ID "${id}" not found.`);
    }, [setAllMemories]);
    
    const _handleSaveStylePreference = useCallback((prefToSave: StylePreference) => {
        setStylePreferences(prev => {
            const existing = prev.find(p => p.id === prefToSave.id);
            if (existing) {
                return prev.map(p => p.id === prefToSave.id ? prefToSave : p);
            }
            return [...prev, prefToSave];
        });
    }, [setStylePreferences]);

    const _handleDeleteStylePreference = useCallback((prefId: string) => {
        setStylePreferences(prev => prev.filter(p => p.id !== prefId));
    }, [setStylePreferences]);

    // Item Modifiers
    const _handleSaveItem = useCallback((itemToSave: RpgItem) => {
        setLibraryItems(prev => {
            const existing = prev.find(i => i.id === itemToSave.id);
            if (existing) {
                return prev.map(i => i.id === itemToSave.id ? itemToSave : i);
            }
            return [...prev, itemToSave];
        });
    }, [setLibraryItems]);

    const _handleDeleteItem = useCallback((itemId: string) => {
        setLibraryItems(prev => prev.filter(i => i.id !== itemId));
    }, [setLibraryItems]);
  
  
  // Action Chat Provider Value
  const pageDataMap = useMemo(() => ({
    prompts: promptTemplates,
    personas: personas,
    characters: characters,
    lorebooks: lorebooks,
    memories: allMemories,
  }), [promptTemplates, personas, characters, lorebooks, allMemories]);

  const actionChatProviderValue = useMemo(() => ({
    isOpen: isActionChatOpen,
    pageContext: {
        page: actionChatPageContext,
        data: actionChatPageContext ? pageDataMap[actionChatPageContext] : null
    },
    openChat: (page: ActionChatPageContext) => {
        setActionChatPageContext(page);
        setIsActionChatOpen(true);
    },
    closeChat: () => {
        setIsActionChatOpen(false);
        setActionChatPageContext(null);
    },
    allData: { characters, lorebooks, personas, promptTemplates, appSettings, allMemories },
    dataModifiers: {
        handleSaveCharacter: _handleSaveCharacter,
        handleDeleteCharacter: _handleDeleteCharacter,
        handleSaveLorebook: _handleSaveLorebook,
        handleDeleteLorebook: _handleDeleteLorebook,
        handleSavePersona: _handleSavePersona,
        handleDeletePersona: _handleDeletePersona,
        handleSavePromptTemplate: _handleSavePromptTemplate,
        handleDeletePromptTemplate: _handleDeletePromptTemplate,
        handleCreateMemory: _handleCreateMemory,
        handleUpdateMemory: _handleUpdateMemory,
        handleDeleteMemory: _handleDeleteMemory,
    }
  }), [isActionChatOpen, actionChatPageContext, pageDataMap, characters, lorebooks, personas, promptTemplates, appSettings, allMemories, _handleSaveCharacter, _handleDeleteCharacter, _handleSaveLorebook, _handleDeleteLorebook, _handleSavePersona, _handleDeletePersona, _handleSavePromptTemplate, _handleDeletePromptTemplate, _handleCreateMemory, _handleUpdateMemory, _handleDeleteMemory]);


  return (
    <ActionChatContext.Provider value={actionChatProviderValue}>
      <div className="h-screen bg-primary flex text-text-primary overflow-hidden">
        {!isWelcomePage && (
          <>
            <Sidebar 
              isCollapsed={isSidebarCollapsed}
              onToggle={handleToggleSidebar}
              onSettingsClick={() => setSettingsModalOpen(true)} 
              onLogout={handleLogout}
            />
            {/* Backdrop for mobile when sidebar is expanded */}
            {!isSidebarCollapsed && (
              <div 
                onClick={handleToggleSidebar}
                className="fixed inset-0 bg-black/50 z-20 md:hidden"
                aria-label="Close sidebar"
              />
            )}
          </>
        )}
        <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${!isWelcomePage ? 'pl-16 md:pl-0' : ''}`}>
          {isAppLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-primary">
              <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-accent"></div>
            </div>
          ) : (
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center bg-primary">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-accent"></div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<WelcomePage appSettings={appSettings} onSaveAppSettings={handleSaveAppSettings} />} />
                
                <Route path="/campaigns" element={<CampaignSelectPage omniAiId={OMNIAI_ID} libraryItems={libraryItems} />} />
                <Route path="/chats" element={<Navigate to="/campaigns" replace />} />

                <Route path="/personas" element={<MyPersonasPage personas={personas} activePersonaId={appSettings.activePersonaId} onSetActive={handleSetActivePersona} appSettings={appSettings} />} />
                <Route path="/persona/new/edit" element={<EditPersonaPage onSave={handleSavePersona} onDelete={handleDeletePersona} appSettings={appSettings} />} />
                <Route path="/persona/:id/edit" element={<EditPersonaPage personas={personas} onSave={handleSavePersona} onDelete={handleDeletePersona} appSettings={appSettings} />} />
                
                <Route path="/prompts" element={<PromptLibraryPage prompts={promptTemplates} appSettings={appSettings} onSaveAppSettings={handleSaveAppSettings} />} />
                <Route path="/prompt/new/edit" element={<EditPromptTemplatePage onSave={handleSavePromptTemplate} onDelete={handleDeletePromptTemplate} />} />
                <Route path="/prompt/:id/edit" element={<EditPromptTemplatePage prompts={promptTemplates} onSave={handleSavePromptTemplate} onDelete={handleDeletePromptTemplate} />} />
                <Route path="/instructional-prompt/:id/edit" element={<EditInstructionalPromptPage appSettings={appSettings} onSaveAppSettings={handleSaveAppSettings} />} />

                <Route path="/library" element={<Navigate to="/lorebooks" replace />} />
                <Route path="/lorebooks" element={
                    <LorebookListPage 
                        lorebooks={lorebooks} 
                        characters={characters} 
                        appSettings={appSettings} 
                        libraryItems={libraryItems}
                        onSaveItem={_handleSaveItem}
                        onDeleteItem={_handleDeleteItem}
                    />
                } />
                <Route 
                  path="/embeddings" 
                  element={
                    <EmbeddingsPage 
                      characters={characters} 
                      setCharacters={setCharacters}
                      lorebooks={lorebooks}
                      setLorebooks={setLorebooks}
                      stylePreferences={stylePreferences}
                      setStylePreferences={setStylePreferences}
                      allMemories={allMemories}
                      setAllMemories={setAllMemories}
                    />
                  } 
                />
                 <Route 
                  path="/library/character/omni-ai/edit" 
                  element={
                      <OmniAiDashboardPage 
                          characters={characters}
                          lorebooks={lorebooks}
                          appSettings={appSettings}
                          omniAiId={OMNIAI_ID}
                          personas={personas}
                          prompts={promptTemplates}
                          allMemories={allMemories}
                          onUpdateOmniAICharacter={_handleSaveCharacter}
                      />
                  } 
                />
                <Route 
                  path="/library/character/:id/edit" 
                  element={
                      <EditCharacterPage 
                          characters={characters} 
                          lorebooks={lorebooks}
                          onSave={handleSaveCharacter} 
                          onDelete={handleDeleteCharacter}
                          appSettings={appSettings}
                      />
                  } 
                />
                <Route 
                  path="/library/character/new/edit" 
                  element={
                      <EditCharacterPage 
                          lorebooks={lorebooks}
                          onSave={handleSaveCharacter} 
                          onDelete={handleDeleteCharacter}
                          appSettings={appSettings}
                      />
                  } 
                />
                <Route 
                  path="/library/lorebook/new/edit" 
                  element={
                    <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
                      <EditLorebookPage lorebooks={lorebooks} onSave={_handleSaveLorebook} onDelete={handleDeleteLorebook} />
                    </div>
                  } 
                />
                <Route 
                  path="/library/lorebook/:id/edit" 
                  element={
                    <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
                      <EditLorebookPage lorebooks={lorebooks} onSave={_handleSaveLorebook} onDelete={handleDeleteLorebook} />
                    </div>
                  }
                />
                <Route 
                  path="/journal" 
                  element={
                    <CampaignJournalPage 
                      characters={characters}
                      allMemories={allMemories}
                      onCreateMemory={_handleCreateMemory}
                      onUpdateMemory={_handleUpdateMemory}
                      onDeleteMemory={_handleDeleteMemory}
                      stylePreferences={stylePreferences}
                      onSaveStylePreference={_handleSaveStylePreference}
                      onDeleteStylePreference={_handleDeleteStylePreference}
                      currentWorldId={undefined} // App doesn't track active world globally yet, user must select in page
                    />
                  } 
                />
                <Route path="/quests" element={<QuestLogPage gameState={/* Placeholder, will need context or fetch */ {player: {}, quests: []} as any} />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/reflections" element={
                  <ReflectionsPage
                    characters={characters}
                    lorebooks={lorebooks}
                    appSettings={appSettings}
                    onUpdateCharacter={_handleSaveCharacter}
                    onDeleteCharacter={_handleDeleteCharacter}
                    onUpdateLorebook={_handleSaveLorebook}
                    onDeleteLorebook={_handleDeleteLorebook}
                    onUpdateAppSettings={handleSaveAppSettings}
                    omniAiId={OMNIAI_ID}
                    personas={personas}
                    prompts={promptTemplates}
                    onUpdatePersona={_handleSavePersona}
                    onDeletePersona={_handleDeletePersona}
                    onUpdatePrompt={_handleSavePromptTemplate}
                    onDeletePrompt={_handleDeletePromptTemplate}
                    allMemories={allMemories}
                    onCreateMemory={_handleCreateMemory}
                    onUpdateMemory={_handleUpdateMemory}
                    onDeleteMemory={_handleDeleteMemory}
                    stylePreferences={stylePreferences}
                    onSaveStylePreference={_handleSaveStylePreference}
                    onDeleteStylePreference={_handleDeleteStylePreference}
                    libraryItems={libraryItems}
                    onSaveItem={_handleSaveItem}
                    onDeleteItem={_handleDeleteItem}
                  />} 
                />
                <Route 
                  path="/chat/:conversationId" 
                  element={
                      <ChatPage 
                        characters={characters} 
                        appSettings={appSettings}
                        lorebooks={lorebooks}
                        personas={personas}
                        promptTemplates={promptTemplates}
                        omniAiId={OMNIAI_ID}
                        onUpdateLorebooks={setLorebooks}
                        onUpdateAppSettings={handleSaveAppSettings}
                        allMemories={allMemories}
                        onCreateMemory={_handleCreateMemory}
                        onUpdateMemory={_handleUpdateMemory}
                        onDeleteMemory={_handleDeleteMemory}
                        stylePreferences={stylePreferences}
                        setStylePreferences={setStylePreferences}
                        libraryItems={libraryItems}
                      />
                  } 
                />
              </Routes>
            </Suspense>
          )}
        </main>
        {isSettingsModalOpen && (
          <SettingsModal
            appSettings={appSettings}
            onSaveAppSettings={handleSaveAppSettings}
            onClose={() => setSettingsModalOpen(false)}
            onLogout={handleLogout}
            onRunMigrations={handleRunMigrations}
          />
        )}
        <OmniFAB />
        <ActionChatModal />
      </div>
    </ActionChatContext.Provider>
  );
}

export default App;