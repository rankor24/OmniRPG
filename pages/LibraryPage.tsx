
import React, { useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Character, Conversation, AppSettings } from '../types';
import CharacterCard from '../components/CharacterCard';
import SearchSortBar from '../components/SearchSortBar';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { v4 as uuidv4 } from 'uuid';

interface LibraryPageProps {
  characters: Character[];
  omniAiId: string;
  appSettings: AppSettings;
}

const LibraryPage: React.FC<LibraryPageProps> = ({ characters, omniAiId, appSettings }) => {
  const sfwMode = appSettings.sfwMode;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name-asc');
  const navigate = useNavigate();
  const [conversations, setConversations] = useLocalStorage<Conversation[]>(`conversations_${omniAiId}`, []);

  const handleNewChat = (character: Character) => {
    const characterChatCount = conversations.filter(c => c.sessionCharacterId === character.id).length;
    
    const newConversation: Conversation = {
      id: uuidv4(),
      characterId: omniAiId,
      preview: `${character.name} ${characterChatCount + 1}`,
      lastMessageAt: new Date().toISOString(),
      relationshipScore: character.initialRelationshipScore,
      dominanceScore: character.initialDominanceScore,
      lustScore: 0,
      sessionCharacterId: character.id,
      sessionLorebookIds: character.activeLorebookIds,
      isIntelligenceInjected: false,
      hasCustomTitle: false,
    };
    setConversations(prev => [newConversation, ...prev]);
    navigate(`/chat/${newConversation.id}`, { state: { newConversation } });
  };

  const handleEdit = useCallback((characterId: string) => {
    navigate(`/library/character/${characterId}/edit`);
  }, [navigate]);

  const processedCharacters = useMemo(() => {
    const allConversations: Conversation[] = conversations;

    const characterChatStats = new Map<string, { lastChat: string; chatCount: number }>();

    allConversations.forEach(convo => {
        if (convo.sessionCharacterId) {
            const stats = characterChatStats.get(convo.sessionCharacterId) || { lastChat: '', chatCount: 0 };
            stats.chatCount += 1;
            if (!stats.lastChat || new Date(convo.lastMessageAt) > new Date(stats.lastChat)) {
                stats.lastChat = convo.lastMessageAt;
            }
            characterChatStats.set(convo.sessionCharacterId, stats);
        }
    });
    
    const charactersWithStats = characters
        .filter(c => c.id !== omniAiId)
        .map((char, index) => ({
            ...char,
            lastChat: characterChatStats.get(char.id)?.lastChat || null,
            chatCount: characterChatStats.get(char.id)?.chatCount || 0,
            originalIndex: index,
        }));

    const filteredChars = charactersWithStats.filter(char => {
        const term = searchTerm.toLowerCase();
        return (
            char.name.toLowerCase().includes(term) ||
            char.tagline.toLowerCase().includes(term)
        );
    });

    const sortedChars = [...filteredChars].sort((a, b) => {
        switch (sortOption) {
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'recently-opened':
                if (!a.lastChat) return 1;
                if (!b.lastChat) return -1;
                return new Date(b.lastChat).getTime() - new Date(a.lastChat).getTime();
            case 'most-popular':
                return b.chatCount - a.chatCount;
            case 'newest':
                return b.originalIndex - a.originalIndex;
            default:
                return 0;
        }
    });

    return sortedChars;
  }, [characters, omniAiId, searchTerm, sortOption, conversations]);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">Character Library</h1>
          <p className="text-text-secondary">Create, manage, and start new roleplaying sessions with your characters.</p>
        </div>
      </header>

      <SearchSortBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortOption={sortOption}
        onSortChange={setSortOption}
        sortOptions={[
          { value: 'name-asc', label: 'Name (A-Z)' },
          { value: 'name-desc', label: 'Name (Z-A)' },
          { value: 'recently-opened', label: 'Recently Opened' },
          { value: 'newest', label: 'Newest Added' },
          { value: 'most-popular', label: 'Most Popular' },
        ]}
        placeholder="Search by name or tagline..."
      />

      {/* Characters Section */}
      <section className="mb-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {processedCharacters.map(char => (
            <CharacterCard
                key={char.id}
                character={char}
                lastChat={char.lastChat}
                sfwMode={sfwMode}
                onNewChat={handleNewChat}
                onEdit={handleEdit}
            />
          ))}
          {searchTerm.length > 0 && processedCharacters.length === 0 && (
             <div className="col-span-full text-center py-12 px-4 border-2 border-dashed border-tertiary rounded-lg">
                <p className="text-lg text-text-secondary">No characters found matching "{searchTerm}".</p>
            </div>
          )}
          <div 
            onClick={() => navigate('/library/character/new/edit')}
            className="block group cursor-pointer"
          >
            <div className="h-full min-h-[300px] bg-secondary rounded-lg flex items-center justify-center border-2 border-dashed border-tertiary hover:border-accent hover:text-accent transition-all duration-300 text-text-secondary">
              <div className="text-center">
                <span className="text-6xl font-thin">+</span>
                <p className="mt-2">Create New Character</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LibraryPage;
