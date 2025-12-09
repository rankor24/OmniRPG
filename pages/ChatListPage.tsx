
import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { Conversation, Character, AppSettings, ChatMessage } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { TrashIcon, ChatCollectionIcon, EditIcon, SaveIcon, CancelIcon, EyeIcon } from '../components/icons';
import SearchSortBar from '../components/SearchSortBar';
import { del, get } from 'idb-keyval';
import { DEFAULT_RPG_GAME_STATE } from '../constants';

interface ChatListPageProps {
  omniAiId: string;
  characters: Character[];
  appSettings: AppSettings;
}

const ChatListPage: React.FC<ChatListPageProps> = ({ omniAiId, characters, appSettings }) => {
    const navigate = useNavigate();
    const [conversations, setConversations] = useLocalStorage<Conversation[]>(`conversations_${omniAiId}`, []);
    const sfwMode = appSettings.sfwMode;
    
    const [editingConvoId, setEditingConvoId] = useState<string | null>(null);
    const [editedPreview, setEditedPreview] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('newest');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Conversation[] | null>(null);

    const characterMap = useMemo(() => new Map(characters.map(c => [c.id, c])), [characters]);
    
    useEffect(() => {
        const handler = setTimeout(async () => {
            if (searchTerm.trim() === '') {
                setSearchResults(null);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            const lowerCaseTerm = searchTerm.toLowerCase();
            const matchingConversations: Conversation[] = [];
            const checkedIds = new Set<string>();

            // 1. Check previews first (fast)
            for (const convo of conversations) {
                if (convo.preview.toLowerCase().includes(lowerCaseTerm)) {
                    if (!checkedIds.has(convo.id)) {
                        matchingConversations.push(convo);
                        checkedIds.add(convo.id);
                    }
                }
            }
            
            // 2. Search message content for remaining conversations (slow)
            const convosToCheckHistory = conversations.filter(c => !checkedIds.has(c.id));
            
            for (const convo of convosToCheckHistory) {
                try {
                    const history = await get<ChatMessage[]>(`chatHistory_${convo.id}`);
                    if (history) {
                        const found = history.some(msg => 
                            msg.versions[msg.activeVersionIndex].content.toLowerCase().includes(lowerCaseTerm)
                        );
                        if (found) {
                            matchingConversations.push(convo);
                        }
                    }
                } catch (error) {
                    console.error(`Could not fetch history for conversation ${convo.id}`, error);
                }
            }
            
            setSearchResults(matchingConversations);
            setIsSearching(false);

        }, 500); // 500ms debounce

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, conversations]);


    const handleNewChat = () => {
        const omniAiChatCount = conversations.filter(c => !c.sessionCharacterId || c.sessionCharacterId === omniAiId).length;
        
        const omniChar = characters.find(c => c.id === omniAiId);

        const newConversation: Conversation = {
            id: uuidv4(),
            characterId: omniAiId,
            preview: `Adventure ${omniAiChatCount + 1}`,
            lastMessageAt: new Date().toISOString(),
            relationshipScore: 0,
            dominanceScore: 0,
            lustScore: 0,
            sessionCharacterId: omniAiId, // Always default to GM
            sessionLorebookIds: omniChar?.activeLorebookIds || [],
            chatBackground: omniChar?.chatBackground,
            isIntelligenceInjected: false,
            hasCustomTitle: false,
            isRpgMode: true, // Always default to RPG mode
            rpgGameState: DEFAULT_RPG_GAME_STATE // Initialize state
        };
        setConversations(prev => [newConversation, ...prev]);
        navigate(`/chat/${newConversation.id}`, { state: { newConversation } });
    };

    const handleDeleteConversation = useCallback((conversationId: string) => {
        if (window.confirm('Are you sure you want to delete this campaign? This cannot be undone.')) {
            del(`chatHistory_${conversationId}`);
            del(`chatScene_${conversationId}`);
            // Global memory is not deleted, only chat-specific data
            setConversations(prev => prev.filter(c => c.id !== conversationId));
        }
    }, [setConversations]);

    const handleStartEdit = (convo: Conversation) => {
        setEditingConvoId(convo.id);
        setEditedPreview(convo.preview);
    };

    const handleCancelEdit = () => {
        setEditingConvoId(null);
        setEditedPreview('');
    };
    
    const handleSaveEdit = () => {
        if (!editingConvoId) return;
        setConversations(prev => 
            prev.map(c => 
                c.id === editingConvoId ? { ...c, preview: editedPreview.trim() || 'Campaign', hasCustomTitle: true } : c
            )
        );
        handleCancelEdit();
    };
    
    const getSortedConversations = (convos: Conversation[]) => {
        return [...convos].sort((a, b) => {
            switch (sortOption) {
                case 'newest':
                    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
                case 'oldest':
                    return new Date(a.lastMessageAt).getTime() - new Date(b.lastMessageAt).getTime();
                case 'a-z':
                    return a.preview.localeCompare(b.preview);
                case 'z-a':
                    return b.preview.localeCompare(a.preview);
                default:
                    return 0;
            }
        });
    };

    const convosToDisplay = getSortedConversations(searchResults !== null ? searchResults : conversations);

    return (
        <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="bg-secondary p-6 md:p-8 rounded-lg shadow-2xl border border-tertiary max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 text-center sm:text-left">
                    <div className="p-4 bg-tertiary rounded-full">
                         <ChatCollectionIcon className="w-16 h-16 text-accent" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-accent">Your Campaigns</h1>
                        <p className="text-text-secondary mt-2">Continue a previous adventure or start a new quest with the Game Master.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
                    <button 
                        onClick={handleNewChat}
                        className="bg-accent text-primary font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-accent-hover transition-transform transform hover:scale-105 btn-boop"
                    >
                        + Start New Campaign
                    </button>
                </div>
                
                <SearchSortBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    sortOption={sortOption}
                    onSortChange={setSortOption}
                    sortOptions={[
                        { value: 'newest', label: 'Newest First' },
                        { value: 'oldest', label: 'Oldest First' },
                        { value: 'a-z', label: 'Name (A-Z)' },
                        { value: 'z-a', label: 'Name (Z-A)' },
                    ]}
                    placeholder="Search campaigns..."
                />

                <div>
                    <h2 className="text-2xl font-semibold text-text-primary mb-4 border-b border-tertiary pb-2">Campaign History</h2>
                    {isSearching ? (
                        <div className="text-center py-8">
                            <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-accent mx-auto"></div>
                            <p className="mt-4 text-text-secondary">Searching archives...</p>
                        </div>
                    ) : convosToDisplay.length > 0 ? (
                        <ul className="space-y-3">
                            {convosToDisplay.map(convo => {
                                const character = characterMap.get(convo.sessionCharacterId || omniAiId);
                                const avatar = character?.avatar;
                                const isEditing = editingConvoId === convo.id;

                                return (
                                    <li key={convo.id} className={`bg-tertiary rounded-lg hover:bg-tertiary/70 border-2 transition-all group ${isEditing ? 'border-accent' : 'border-transparent hover:border-accent/50'}`}>
                                        <div className="flex items-start gap-4 p-4">
                                            {avatar && (
                                                sfwMode ? (
                                                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                                        <EyeIcon className="w-8 h-8 text-text-secondary" />
                                                    </div>
                                                ) : (
                                                    <img src={avatar} alt="character avatar" className="w-16 h-16 rounded-full object-cover flex-shrink-0 bg-secondary" />
                                                )
                                            )}
                                            <div className="flex-grow overflow-hidden">
                                                {isEditing ? (
                                                    <>
                                                        <input 
                                                            type="text"
                                                            value={editedPreview}
                                                            onChange={(e) => setEditedPreview(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSaveEdit();
                                                                if (e.key === 'Escape') handleCancelEdit();
                                                            }}
                                                            className="w-full bg-secondary border border-accent rounded-md py-1 px-2 text-text-primary focus:outline-none"
                                                            autoFocus
                                                        />
                                                        <div className="flex justify-between items-center mt-1">
                                                            <p className="text-xs text-text-secondary truncate">
                                                                Last: {new Date(convo.lastMessageAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                            </p>
                                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                                <button onClick={handleSaveEdit} className="p-1.5 text-text-secondary hover:text-accent transition-colors btn-boop" aria-label="Save changes"><SaveIcon className="w-4 h-4"/></button>
                                                                <button onClick={handleCancelEdit} className="p-1.5 text-text-secondary hover:text-text-primary transition-colors btn-boop" aria-label="Cancel edit"><CancelIcon className="w-4 h-4"/></button>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link to={`/chat/${convo.id}`} className="block w-full">
                                                            <p className="text-text-primary font-medium group-hover:text-accent transition-colors truncate">{convo.preview}</p>
                                                        </Link>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <p className="text-xs text-text-secondary truncate">
                                                                Last: {new Date(convo.lastMessageAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                            </p>
                                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                                <button onClick={() => handleStartEdit(convo)} className="p-1.5 text-text-secondary hover:text-accent transition-colors btn-boop" aria-label="Edit chat name">
                                                                    <EditIcon className="w-4 h-4"/>
                                                                </button>
                                                                <button onClick={() => handleDeleteConversation(convo.id)} className="p-1.5 text-text-secondary hover:text-danger transition-colors btn-boop" aria-label="Delete chat">
                                                                    <TrashIcon className="w-4 h-4"/>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="text-center py-8 px-4 border-2 border-dashed border-tertiary rounded-lg">
                            <p className="text-text-secondary">
                                {searchResults !== null ? `No campaigns found matching "${searchTerm}".` : "No campaigns yet."}
                            </p>
                            {searchResults === null && (
                               <p className="text-sm text-text-secondary opacity-70 mt-1">Click 'Start New Campaign' to begin!</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatListPage;
