
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { VirtuosoHandle } from 'react-virtuoso';

// Hooks
import { useChat } from '../hooks/useChat';
import { useWorldManager } from '../hooks/useWorldManager';
import { useTts } from '../hooks/useTts';
import { useActionChat } from '../contexts/ActionChatContext';
import { useSaveManager } from '../hooks/useSaveManager';

// Components
import ChatHeader from '../components/chat/ChatHeader';
import MessageList from '../components/chat/MessageList';
import ChatToolbar from '../components/chat/ChatToolbar';
import ChatInput from '../components/chat/ChatInput';
import MemoryModal from '../components/MemoryModal';
import PromptSelectionModal from '../components/PromptSelectionModal';
import InChatSettingsModal from '../components/InChatSettingsModal';
import NarrativeFeed from '../components/game/NarrativeFeed';
import GameDashboard from '../components/game/GameDashboard';
import ActionBar from '../components/game/ActionBar';
import SaveLoadModal from '../components/SaveLoadModal';

// Types & Constants
import type { AppSettings, Character, Lorebook, Persona, PromptTemplate, Memory, StylePreference, GameSave, World, RpgItem } from '../types';
import { DEFAULT_RPG_GAME_STATE } from '../constants';

// --- Sub-components for cleaner separation ---

const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
    <div className="flex flex-col items-center justify-center h-full bg-primary gap-4">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-accent"></div>
        <p className="text-text-secondary animate-pulse">{message}</p>
    </div>
);

const ErrorScreen: React.FC<{ message: string, onRetry?: () => void }> = ({ message, onRetry }) => (
    <div className="flex flex-col items-center justify-center h-full bg-primary gap-4 p-8 text-center">
        <div className="text-danger text-5xl">⚠️</div>
        <h2 className="text-2xl font-bold text-text-primary">Something went wrong</h2>
        <p className="text-text-secondary">{message}</p>
        {onRetry && (
            <button onClick={onRetry} className="px-4 py-2 bg-accent text-primary rounded-lg hover:bg-accent-hover font-bold mt-4 transition-colors">
                Retry
            </button>
        )}
    </div>
);

interface ChatPageProps {
  characters: Character[];
  appSettings: AppSettings;
  lorebooks: Lorebook[];
  personas: Persona[];
  promptTemplates: PromptTemplate[];
  omniAiId: string;
  onUpdateLorebooks: (updater: (prev: Lorebook[]) => Lorebook[]) => void;
  onUpdateAppSettings: (settings: AppSettings) => void;
  allMemories: Memory[];
  onCreateMemory: (content: string, scope: Memory['scope'], entityId?: string) => Promise<string>;
  onUpdateMemory: (id: string, content: string) => Promise<string>;
  onDeleteMemory: (id: string) => Promise<string>;
  stylePreferences: StylePreference[];
  setStylePreferences: React.Dispatch<React.SetStateAction<StylePreference[]>>;
  libraryItems: RpgItem[];
}

const ChatPage: React.FC<ChatPageProps> = (props) => {
    const { appSettings, omniAiId, promptTemplates, lorebooks, characters, personas, libraryItems } = props;
    
    // Global Contexts & Hooks
    const { allData, dataModifiers } = useActionChat();
    const chat = useChat({ ...props, allData, dataModifiers });
    const { audioRef, ttsState, playAudio } = useTts(appSettings);
    const { worlds, loading: worldsLoading, refreshWorlds } = useWorldManager(omniAiId, libraryItems);

    // Local UI State
    const [isMemoryModalOpen, setMemoryModalOpen] = useState(false);
    const [isPromptModalOpen, setPromptModalOpen] = useState(false);
    const [isChatSettingsOpen, setChatSettingsOpen] = useState(false);
    const [isSaveLoadModalOpen, setSaveLoadModalOpen] = useState(false);
    const [saveLoadMode, setSaveLoadMode] = useState<'save' | 'load'>('save');
    
    // Attachments State
    const [images, setImages] = useState<{ url: string; mimeType: string; detail: 'auto' | 'low' | 'high' }[]>([]);
    const [imageDetail, setImageDetail] = useState<'auto' | 'low' | 'high'>('auto');
    const [showAttachmentBar, setShowAttachmentBar] = useState(false);
    const [urlInputType, setUrlInputType] = useState<'image' | 'video' | null>(null);

    // References
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const [atBottom, setAtBottom] = useState(true);

    // Derived State
    const currentWorld = useMemo(() => {
        if (!chat.currentConversation?.worldId) return undefined;
        return worlds.find(w => w.id === chat.currentConversation?.worldId);
    }, [worlds, chat.currentConversation?.worldId]);

    const { quickSave } = useSaveManager(currentWorld?.id || 'unknown');

    // Handlers
    const scrollToBottom = useCallback(() => {
        virtuosoRef.current?.scrollToIndex({ index: chat.messages.length - 1, align: 'end', behavior: 'smooth' });
    }, [chat.messages.length]);

    const handleSend = () => {
        const imagesToSend = images.map(img => ({ ...img, detail: imageDetail }));
        chat.handleSendMessage(imagesToSend);
        setImages([]);
        setShowAttachmentBar(false);
        setUrlInputType(null);
    };

    const handleActionClick = (actionText: string) => {
        chat.setUserInput(actionText);
        // Defer send to allow state update
        setTimeout(() => chat.handleSendMessage([]), 0);
    };

    const handleLoadGame = (save: GameSave) => {
        if (chat.currentConversation && save.gameState) {
            chat.setRpgGameState(save.gameState);
            chat.updateConversation(chat.currentConversation.id, { 
                rpgGameState: save.gameState,
                preview: `Loaded: ${save.name}`,
                lastSaveId: save.id
            });
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (chat.currentConversation?.isRpgMode && chat.rpgGameState) {
                    quickSave(chat.rpgGameState, chat.sceneState?.characterStatus.location || 'Unknown')
                        .then(() => alert("Quick Save Successful!"));
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                e.preventDefault();
                setSaveLoadMode('load');
                setSaveLoadModalOpen(true);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
                e.preventDefault();
                setMemoryModalOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [chat.currentConversation, chat.rpgGameState, chat.sceneState, quickSave]);

    // --- Loading Checks ---
    
    // 1. Check if chat is initialized
    if (!chat.chatPartner || !chat.currentConversation) {
        return <LoadingScreen message="Initializing Neural Link..." />;
    }

    // 2. RPG Mode Specific Checks
    if (chat.currentConversation.isRpgMode) {
        if (worldsLoading) return <LoadingScreen message="Loading World Data..." />;
        if (!currentWorld) return <ErrorScreen message="World data not found for this campaign." onRetry={refreshWorlds} />;
    }

    // --- Views ---

    const renderRpgView = () => {
        // Safe to assert currentWorld is defined here due to check above
        const world = currentWorld!; 
        const gameState = chat.rpgGameState || DEFAULT_RPG_GAME_STATE;
        const lastAssistantMessage = [...chat.messages].reverse().find(m => m.role === 'assistant');
        const narrativeText = lastAssistantMessage?.versions[lastAssistantMessage.activeVersionIndex].content || '';

        return (
            <div className="flex flex-col md:flex-row h-full bg-primary overflow-hidden relative">
                <audio ref={audioRef} />
                
                {/* Left Column: Narrative & Input */}
                <div className="flex-1 md:w-[60%] flex flex-col h-full relative z-10">
                    <div className="flex-grow overflow-hidden relative">
                        {chat.currentConversation?.chatBackground && !appSettings.sfwMode && (
                            <div 
                                className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none transition-opacity duration-1000"
                                style={{ backgroundImage: `url(${chat.currentConversation.chatBackground})` }}
                            />
                        )}
                        <NarrativeFeed 
                            messages={chat.messages} 
                            isTyping={chat.isLoading}
                            font={world.theme.font || 'serif'}
                        />
                    </div>

                    <div className="p-4 bg-primary/95 border-t border-white/10 backdrop-blur-md">
                        <ActionBar 
                            narrative={narrativeText} 
                            world={world} 
                            onAction={handleActionClick} 
                            disabled={chat.isLoading}
                        />
                        <div className="mt-4">
                            <ChatInput
                                userInput={chat.userInput}
                                setUserInput={chat.setUserInput}
                                onSend={handleSend}
                                isLoading={chat.isLoading}
                                chatPartnerName="Game Master"
                                isEditorMode={false}
                                appSettings={appSettings}
                                images={images}
                                onRemoveImage={(idx) => setImages(prev => prev.filter((_, i) => i !== idx))}
                                imageDetail={imageDetail}
                                onImageDetailChange={setImageDetail}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: HUD */}
                <div className="hidden md:flex md:w-[40%] flex-col h-full z-20 border-l border-white/10 bg-secondary shadow-2xl">
                    <GameDashboard 
                        world={world} 
                        gameState={gameState} 
                        sceneState={chat.sceneState}
                    />
                    <div className="p-4 border-t border-white/10 flex justify-between bg-tertiary/20">
                        <button 
                            onClick={() => { setSaveLoadMode('save'); setSaveLoadModalOpen(true); }}
                            className="px-4 py-2 bg-accent/20 text-accent rounded hover:bg-accent/30 text-sm font-bold transition-colors btn-boop"
                        >
                            Save Game
                        </button>
                        <button 
                            onClick={() => { setSaveLoadMode('load'); setSaveLoadModalOpen(true); }}
                            className="px-4 py-2 bg-tertiary text-text-primary rounded hover:bg-tertiary/80 text-sm font-bold transition-colors btn-boop"
                        >
                            Load Game
                        </button>
                    </div>
                </div>

                {/* Modals for RPG */}
                <SaveLoadModal 
                    isOpen={isSaveLoadModalOpen}
                    onClose={() => setSaveLoadModalOpen(false)}
                    mode={saveLoadMode}
                    world={world}
                    currentGameState={chat.rpgGameState || undefined}
                    currentLocation={chat.sceneState?.characterStatus.location}
                    onLoadGame={handleLoadGame}
                />
            </div>
        );
    };

    const renderStandardView = () => (
        <div className="flex flex-col h-full bg-primary relative overflow-hidden">
            <audio ref={audioRef} />
            <ChatHeader
                chatPartner={chat.chatPartner!}
                character={chat.character}
                conversation={chat.currentConversation}
                sceneState={chat.sceneState}
                sfwMode={appSettings.sfwMode}
                showCharacterStatus={chat.showCharacterStatus}
                showUserStatus={chat.showUserStatus}
                onOpenSettings={() => setChatSettingsOpen(true)}
                isTransparentMode={chat.isTransparentMode}
                avatarEmotionState={chat.avatarEmotionState}
            />
            <div className="flex-grow overflow-hidden relative z-10">
                <MessageList
                    messages={chat.messages}
                    chatPartnerName={chat.chatPartner!.name}
                    chatPartnerAvatar={chat.chatPartner!.avatar}
                    isLoading={chat.isLoading}
                    virtuosoRef={virtuosoRef}
                    onAtBottomStateChange={setAtBottom}
                    editingMessageId={chat.editingMessageId}
                    sfwMode={appSettings.sfwMode}
                    isTransparentMode={chat.isTransparentMode}
                    onStartEdit={chat.handleStartEdit}
                    onSaveEdit={chat.handleSaveEdit}
                    onCancelEdit={chat.handleCancelEdit}
                    onReroll={chat.handleReroll}
                    onVersionChange={chat.handleVersionChange}
                    onRatingChange={chat.handleRatingChange}
                    onDelete={chat.handleDeleteMessage}
                    onProposalAction={chat.handleProposalAction}
                    onToolProposalApprove={chat.handleToolProposalApprove}
                    onToolProposalReject={chat.handleToolProposalReject}
                    appSettings={appSettings}
                    onPlayAudio={playAudio}
                    isTtsLoading={ttsState.isLoading}
                    isPlayingAudio={(messageId) => ttsState.playingMessageId === messageId}
                />
            </div>
            <div className={`relative z-10 p-2 md:p-4 flex-shrink-0 ${chat.isTransparentMode ? 'bg-transparent' : 'bg-primary/95 transition-colors'}`}>
                <ChatToolbar
                    appSettings={appSettings}
                    character={chat.character}
                    showCharacterStatus={chat.showCharacterStatus}
                    setShowCharacterStatus={chat.setShowCharacterStatus}
                    showUserStatus={chat.showUserStatus}
                    setShowUserStatus={chat.setShowUserStatus}
                    isTransparentMode={chat.isTransparentMode}
                    setTransparentMode={chat.setTransparentMode}
                    reflectionStatus={chat.reflectionStatus}
                    onMemoryModalOpen={() => setMemoryModalOpen(true)}
                    activePrompt={chat.activePrompt}
                    onPromptModalOpen={() => setPromptModalOpen(true)}
                    showScrollButton={!atBottom}
                    onScrollToBottom={scrollToBottom}
                    showAttachmentBar={showAttachmentBar}
                    setShowAttachmentBar={setShowAttachmentBar}
                    setUrlInputType={setUrlInputType}
                    onTip={chat.handleTip}
                    onToggleReflections={() => props.onUpdateAppSettings({ ...appSettings, enableReflection: !appSettings.enableReflection })}
                />
                <ChatInput
                    userInput={chat.userInput}
                    setUserInput={chat.setUserInput}
                    onSend={handleSend}
                    isLoading={chat.isLoading}
                    chatPartnerName={chat.chatPartner!.name}
                    isEditorMode={chat.currentConversation?.isEditorMode}
                    appSettings={appSettings}
                    images={images}
                    onRemoveImage={(idx) => setImages(prev => prev.filter((_, i) => i !== idx))}
                    imageDetail={imageDetail}
                    onImageDetailChange={setImageDetail}
                />
            </div>

            {/* Modals for Standard View */}
            <InChatSettingsModal
                isOpen={isChatSettingsOpen}
                onClose={() => setChatSettingsOpen(false)}
                characters={characters}
                personas={personas}
                appSettings={appSettings}
                currentConversation={chat.currentConversation}
                onSave={chat.handleSaveChatSettings}
                currentBackground={chat.currentConversation?.chatBackground || ''}
                isLoading={chat.isLoading}
                messages={chat.messages}
            />
            <PromptSelectionModal
                isOpen={isPromptModalOpen}
                onClose={() => setPromptModalOpen(false)}
                prompts={promptTemplates}
                onSelect={(p) => { chat.setActivePrompt(p); setPromptModalOpen(false); }}
                activePrompt={chat.activePrompt}
                onClear={() => { chat.setActivePrompt(null); setPromptModalOpen(false); }}
            />
        </div>
    );

    return (
        <>
            {chat.currentConversation.isRpgMode ? renderRpgView() : renderStandardView()}
            
            {/* Shared Memory Modal */}
            <MemoryModal
                isOpen={isMemoryModalOpen}
                onClose={() => setMemoryModalOpen(false)}
                conversationMemories={chat.conversationMemories}
                characterMemories={chat.characterMemories}
                globalMemories={chat.globalMemories}
                onCreateMemory={props.onCreateMemory}
                onUpdateMemory={props.onUpdateMemory}
                onDeleteMemory={props.onDeleteMemory}
                stylePreferences={chat.stylePreferences}
                onUpdateStylePreferences={props.setStylePreferences}
                onExtractFacts={chat.handleExtractFacts}
                onSummarizeHistory={chat.handleSummarizeHistory}
                isGenerating={chat.isGeneratingMemories}
                canGenerate={chat.canGenerateMemories}
                appSettings={appSettings}
                onCheckMemoryCorrection={chat.handleCheckMemoryCorrection}
                isLoading={chat.isLoading}
                character={chat.character}
                conversationId={chat.conversationId}
                conversationPreview={chat.currentConversation?.preview}
                lorebooks={lorebooks}
                activeLorebookIds={chat.currentConversation?.sessionLorebookIds || []}
                onLorebookToggle={chat.handleLorebookToggle}
                onProposeLoreEdits={chat.handleProposeLoreEdits}
                onExtractNewLore={chat.handleExtractNewLore}
                allConversationsForContext={chat.allConversationsForContext}
                activeContextualChatIds={chat.currentConversation?.contextualConversationIds || []}
                onToggleContextChat={chat.handleToggleContextChat}
                currentConversationId={chat.conversationId}
            />
        </>
    );
};

export default ChatPage;