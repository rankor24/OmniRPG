
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Lorebook, LorebookEntry, Character, AppSettings, RpgItem } from '../types';
import { BookOpenIcon, ListTimelineIcon, UsersIcon, BackpackIcon, PlusIcon, TrashIcon, SearchIcon, FilterIcon } from '../components/icons';
import SearchSortBar from '../components/SearchSortBar';
import CharacterCard from '../components/CharacterCard';
import ItemEditorModal from '../components/ItemEditorModal';

// New type for flattened entries
type FlatLorebookEntry = LorebookEntry & { lorebookId: string; lorebookName: string };

const TabButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
  }> = ({ label, icon, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
        isActive
          ? 'border-accent text-accent'
          : 'border-transparent text-text-secondary hover:text-text-primary'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

interface LorebookListPageProps {
    lorebooks: Lorebook[];
    characters: Character[];
    appSettings: AppSettings;
    libraryItems: RpgItem[];
    onSaveItem: (item: RpgItem) => void;
    onDeleteItem: (itemId: string) => void;
}

const LorebookListPage: React.FC<LorebookListPageProps> = ({ 
    lorebooks, characters, appSettings, libraryItems, onSaveItem, onDeleteItem 
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'lorebooks' | 'entries' | 'npcs' | 'items'>('lorebooks');

  // State for Lorebooks tab
  const [lorebookSearchTerm, setLorebookSearchTerm] = useState('');
  const [lorebookSortOption, setLorebookSortOption] = useState('name-asc');

  // State for Entries tab
  const [entrySearchTerm, setEntrySearchTerm] = useState('');
  const [entrySortOption, setEntrySortOption] = useState('date-desc');

  // State for Items tab
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [itemSortOption, setItemSortOption] = useState('name-asc');
  const [isItemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RpgItem | undefined>(undefined);
  
  // Item Filters
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');

  // Processing for Lorebooks tab
  const processedLorebooks = useMemo(() => {
    const filtered = lorebooks.filter(lb => {
        const term = lorebookSearchTerm.toLowerCase();
        return (
            lb.name.toLowerCase().includes(term) ||
            lb.description.toLowerCase().includes(term)
        );
    });

    return filtered.sort((a, b) => {
        switch (lorebookSortOption) {
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            case 'entries-desc': return b.entries.length - a.entries.length;
            case 'entries-asc': return a.entries.length - b.entries.length;
            default: return 0;
        }
    });
  }, [lorebooks, lorebookSearchTerm, lorebookSortOption]);

  // Processing for Entries tab
  const allEntries = useMemo<FlatLorebookEntry[]>(() => {
    return lorebooks.flatMap(lb =>
        lb.entries.map(entry => ({
            ...entry,
            lorebookId: lb.id,
            lorebookName: lb.name,
        }))
    );
  }, [lorebooks]);

  const processedEntries = useMemo(() => {
    const filtered = allEntries.filter(entry => {
        const term = entrySearchTerm.toLowerCase();
        return (
            entry.content.toLowerCase().includes(term) ||
            entry.keywords.some(k => k.toLowerCase().includes(term)) ||
            entry.lorebookName.toLowerCase().includes(term)
        );
    });

    return filtered.sort((a, b) => {
        switch (entrySortOption) {
            case 'date-desc': return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            case 'date-asc': return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            case 'lorebook-asc': return a.lorebookName.localeCompare(b.lorebookName);
            case 'content-asc': return a.content.localeCompare(b.content);
            default: return 0;
        }
    });
  }, [allEntries, entrySearchTerm, entrySortOption]);

  // Processing for Items tab
  const processedItems = useMemo(() => {
      let filtered = libraryItems.filter(item => {
          const term = itemSearchTerm.toLowerCase();
          const matchesSearch = item.name.toLowerCase().includes(term) || item.type.toLowerCase().includes(term);
          const matchesGenre = selectedGenre === 'all' || item.genre === selectedGenre;
          const matchesType = selectedType === 'all' || item.type === selectedType;
          const matchesRarity = selectedRarity === 'all' || item.rarity === selectedRarity;
          
          return matchesSearch && matchesGenre && matchesType && matchesRarity;
      });
      
      return filtered.sort((a, b) => {
          switch (itemSortOption) {
              case 'name-asc': return a.name.localeCompare(b.name);
              case 'name-desc': return b.name.localeCompare(a.name);
              case 'type': return a.type.localeCompare(b.type);
              case 'rarity': {
                  const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
                  const rA = rarityOrder[a.rarity || 'common'] || 0;
                  const rB = rarityOrder[b.rarity || 'common'] || 0;
                  return rB - rA; // High rarity first
              }
              case 'value': return (b.stats?.value || 0) - (a.stats?.value || 0);
              default: return 0;
          }
      });
  }, [libraryItems, itemSearchTerm, itemSortOption, selectedGenre, selectedType, selectedRarity]);

  const handleEntryClick = (entry: FlatLorebookEntry) => {
    navigate(`/library/lorebook/${entry.lorebookId}/edit`, {
      state: { scrollToEntryId: entry.id }
    });
  };

  const handleCreateItem = () => {
      setEditingItem(undefined);
      setItemModalOpen(true);
  };

  const handleEditItem = (item: RpgItem) => {
      setEditingItem(item);
      setItemModalOpen(true);
  };

  const handleDeleteItemClick = (e: React.MouseEvent, itemId: string) => {
      e.stopPropagation();
      if(window.confirm("Delete this item template?")) {
          onDeleteItem(itemId);
      }
  };

  const getRarityColor = (rarity?: string) => {
      switch (rarity) {
          case 'common': return 'border-tertiary';
          case 'uncommon': return 'border-green-600/50';
          case 'rare': return 'border-blue-500/50';
          case 'epic': return 'border-purple-500/50';
          case 'legendary': return 'border-yellow-500/50';
          default: return 'border-tertiary';
      }
  };
  
  const getRarityText = (rarity?: string) => {
      switch (rarity) {
          case 'common': return 'text-text-secondary';
          case 'uncommon': return 'text-green-400';
          case 'rare': return 'text-blue-400';
          case 'epic': return 'text-purple-400';
          case 'legendary': return 'text-yellow-400';
          default: return 'text-text-secondary';
      }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2">Lorebook & Library</h1>
        <p className="text-text-secondary">Manage world lore, entries, NPCs, and item templates.</p>
      </header>

      <div className="mb-6 border-b border-tertiary flex overflow-x-auto no-scrollbar">
          <TabButton label="Lorebooks" icon={<BookOpenIcon className="w-5 h-5" />} isActive={activeTab === 'lorebooks'} onClick={() => setActiveTab('lorebooks')} />
          <TabButton label="Entries" icon={<ListTimelineIcon className="w-5 h-5" />} isActive={activeTab === 'entries'} onClick={() => setActiveTab('entries')} />
          <TabButton label="NPCs" icon={<UsersIcon className="w-5 h-5" />} isActive={activeTab === 'npcs'} onClick={() => setActiveTab('npcs')} />
          <TabButton label="Items" icon={<BackpackIcon className="w-5 h-5" />} isActive={activeTab === 'items'} onClick={() => setActiveTab('items')} />
      </div>

      {/* --- ITEMS TAB OVERHAUL --- */}
      {activeTab === 'items' && (
          <div className="animate-fade-in flex flex-col md:flex-row gap-6">
              {/* Sidebar Filter */}
              <div className="w-full md:w-64 flex-shrink-0 space-y-4">
                  <button onClick={handleCreateItem} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent text-primary rounded-lg font-bold hover:bg-accent-hover transition-colors btn-boop shadow-lg shadow-accent/20">
                      <PlusIcon className="w-5 h-5"/> New Item
                  </button>
                  
                  <div className="bg-secondary p-4 rounded-lg border border-tertiary">
                      <div className="flex items-center gap-2 mb-3 text-sm font-bold text-text-secondary uppercase tracking-wider">
                          <FilterIcon className="w-4 h-4"/> Filters
                      </div>
                      
                      <div className="space-y-4">
                          <div>
                              <label className="text-xs text-text-secondary block mb-1">Search</label>
                              <div className="relative">
                                  <input 
                                    type="text" 
                                    value={itemSearchTerm} 
                                    onChange={e => setItemSearchTerm(e.target.value)} 
                                    placeholder="Search..."
                                    className="w-full bg-tertiary border border-tertiary rounded-md py-1.5 pl-8 pr-2 text-sm text-text-primary focus:border-accent outline-none"
                                  />
                                  <SearchIcon className="w-4 h-4 text-text-secondary absolute left-2 top-2"/>
                              </div>
                          </div>

                          <div>
                              <label className="text-xs text-text-secondary block mb-1">Sort By</label>
                              <select 
                                value={itemSortOption}
                                onChange={e => setItemSortOption(e.target.value)}
                                className="w-full bg-tertiary border border-tertiary rounded-md py-1.5 px-2 text-sm text-text-primary focus:border-accent outline-none"
                              >
                                  <option value="name-asc">Name (A-Z)</option>
                                  <option value="type">Type</option>
                                  <option value="rarity">Rarity (High-Low)</option>
                                  <option value="value">Value (High-Low)</option>
                              </select>
                          </div>

                          <div>
                              <label className="text-xs text-text-secondary block mb-1">Genre</label>
                              <select 
                                value={selectedGenre}
                                onChange={e => setSelectedGenre(e.target.value)}
                                className="w-full bg-tertiary border border-tertiary rounded-md py-1.5 px-2 text-sm text-text-primary focus:border-accent outline-none"
                              >
                                  <option value="all">All Genres</option>
                                  <option value="fantasy">Fantasy</option>
                                  <option value="scifi">Sci-Fi</option>
                                  <option value="modern">Modern</option>
                                  <option value="universal">Universal</option>
                              </select>
                          </div>

                          <div>
                              <label className="text-xs text-text-secondary block mb-1">Type</label>
                              <select 
                                value={selectedType}
                                onChange={e => setSelectedType(e.target.value)}
                                className="w-full bg-tertiary border border-tertiary rounded-md py-1.5 px-2 text-sm text-text-primary focus:border-accent outline-none"
                              >
                                  <option value="all">All Types</option>
                                  <option value="weapon">Weapon</option>
                                  <option value="armor">Armor</option>
                                  <option value="spell">Spell</option>
                                  <option value="skill">Skill</option>
                                  <option value="consumable">Consumable</option>
                                  <option value="misc">Misc</option>
                              </select>
                          </div>

                          <div>
                              <label className="text-xs text-text-secondary block mb-1">Rarity</label>
                              <select 
                                value={selectedRarity}
                                onChange={e => setSelectedRarity(e.target.value)}
                                className="w-full bg-tertiary border border-tertiary rounded-md py-1.5 px-2 text-sm text-text-primary focus:border-accent outline-none"
                              >
                                  <option value="all">All Rarities</option>
                                  <option value="common">Common</option>
                                  <option value="uncommon">Uncommon</option>
                                  <option value="rare">Rare</option>
                                  <option value="epic">Epic</option>
                                  <option value="legendary">Legendary</option>
                              </select>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Item Grid */}
              <div className="flex-grow">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                      {processedItems.map(item => (
                          <div 
                            key={item.id} 
                            onClick={() => handleEditItem(item)} 
                            className={`bg-secondary p-4 rounded-lg border-l-4 hover:bg-tertiary/20 cursor-pointer group transition-all relative flex flex-col h-full shadow-sm ${getRarityColor(item.rarity)}`}
                          >
                              <div className="flex justify-between items-start mb-2">
                                  <span className="text-3xl">{item.icon || '📦'}</span>
                                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-black/30 ${getRarityText(item.rarity)}`}>
                                      {item.rarity || 'common'}
                                  </span>
                              </div>
                              
                              <h3 className="font-bold text-text-primary text-base line-clamp-1">{item.name}</h3>
                              <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs text-text-secondary uppercase tracking-wider">{item.type}</span>
                                  <span className="text-text-tertiary">•</span>
                                  <span className="text-xs text-text-secondary capitalize">{item.genre}</span>
                              </div>
                              
                              <p className="text-xs text-text-secondary line-clamp-2 italic mb-3 flex-grow">{item.description}</p>
                              
                              <div className="mt-auto pt-3 border-t border-white/5 flex flex-wrap gap-2 text-xs">
                                  {item.stats?.attack && <span className="text-red-400 font-bold">ATK: {item.stats.attack}</span>}
                                  {item.stats?.defense && <span className="text-blue-400 font-bold">DEF: {item.stats.defense}</span>}
                                  {item.stats?.manaCost && <span className="text-blue-300">MP: {item.stats.manaCost}</span>}
                                  {item.stats?.value && <span className="text-yellow-400 ml-auto">💰 {item.stats.value}</span>}
                              </div>

                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={(e) => handleDeleteItemClick(e, item.id)} className="p-1.5 bg-black/40 hover:bg-red-500/80 rounded text-text-secondary hover:text-white transition-colors">
                                      <TrashIcon className="w-4 h-4" />
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
                  {processedItems.length === 0 && (
                      <div className="text-center py-20 bg-secondary rounded-lg border border-dashed border-tertiary">
                          <p className="text-text-secondary text-lg">No items match your filters.</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* --- EXISTING TABS (Unchanged Logic, just simpler markup for brevity in this snippet) --- */}
      {activeTab === 'lorebooks' && (
          <div className="animate-fade-in">
              <SearchSortBar
                searchTerm={lorebookSearchTerm}
                onSearchChange={setLorebookSearchTerm}
                sortOption={lorebookSortOption}
                onSortChange={setLorebookSortOption}
                sortOptions={[
                    { value: 'name-asc', label: 'Name (A-Z)' },
                    { value: 'name-desc', label: 'Name (Z-A)' },
                    { value: 'entries-desc', label: 'Entries (Most First)' },
                    { value: 'entries-asc', label: 'Entries (Fewest First)' },
                ]}
                placeholder="Search lorebooks..."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {processedLorebooks.map(lb => (
                      <div onClick={() => navigate(`/library/lorebook/${lb.id}/edit`)} key={lb.id} className="block group cursor-pointer">
                      <div className="h-full bg-secondary rounded-lg shadow-lg overflow-hidden transform group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-accent/20 transition-all duration-300 ease-in-out border border-tertiary hover:border-accent flex flex-col p-6 text-left justify-between">
                          <div>
                              <h3 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors mb-2 break-words">{lb.name}</h3>
                              <p className="text-sm text-text-secondary mt-2 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }} title={lb.description}>{lb.description || <em>No description.</em>}</p>
                          </div>
                          <div className="mt-4 flex justify-between items-center text-xs text-text-secondary opacity-70">
                              <span>{lb.entries.length} {lb.entries.length === 1 ? 'entry' : 'entries'}</span>
                              <div className="flex items-center gap-2">
                                  <span>{lb.enabled ? 'Enabled' : 'Disabled'}</span>
                                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${lb.enabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              </div>
                          </div>
                      </div>
                      </div>
                  ))}
                  <div onClick={() => navigate('/library/lorebook/new/edit')} className="block group cursor-pointer">
                      <div className="h-full min-h-[180px] bg-secondary rounded-lg shadow-lg flex items-center justify-center border-2 border-dashed border-tertiary hover:border-accent hover:text-accent transition-all duration-300 text-text-secondary">
                      <div className="text-center"><span className="text-5xl font-thin">+</span><p className="mt-2">Create New Lorebook</p></div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'entries' && (
          <div className="animate-fade-in">
               <SearchSortBar
                searchTerm={entrySearchTerm}
                onSearchChange={setEntrySearchTerm}
                sortOption={entrySortOption}
                onSortChange={setEntrySortOption}
                sortOptions={[
                    { value: 'date-desc', label: 'Newest First' },
                    { value: 'date-asc', label: 'Oldest First' },
                    { value: 'lorebook-asc', label: 'Lorebook (A-Z)' },
                    { value: 'content-asc', label: 'Content (A-Z)' },
                ]}
                placeholder="Search entries by content or keyword..."
              />
              <section className="space-y-3">
                  {processedEntries.map(entry => (
                      <div
                          key={entry.id}
                          onClick={() => handleEntryClick(entry)}
                          className="bg-secondary p-4 rounded-lg border border-tertiary hover:border-accent cursor-pointer group transition-colors"
                      >
                          <p className="text-sm text-text-primary mb-2 line-clamp-2" title={entry.content}>{entry.content}</p>
                          <div className="flex flex-wrap items-center gap-1 mb-2">
                              {entry.keywords.map(kw => <span key={kw} className="text-xs bg-tertiary text-accent px-1.5 py-0.5 rounded">{kw}</span>)}
                          </div>
                          <div className="text-xs text-text-secondary flex justify-between items-center">
                              <span>From: <span className="font-semibold text-text-primary/80 group-hover:text-accent">{entry.lorebookName}</span></span>
                              <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                          </div>
                      </div>
                  ))}
              </section>
          </div>
      )}

      {activeTab === 'npcs' && (
          <div className="animate-fade-in">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {characters.filter(c => c.id !== 'omni-ai').map(char => (
                      <CharacterCard
                          key={char.id}
                          character={char}
                          lastChat={null}
                          sfwMode={appSettings.sfwMode}
                          onNewChat={() => navigate(`/library/character/${char.id}/edit`)}
                          onEdit={() => navigate(`/library/character/${char.id}/edit`)}
                      />
                  ))}
                   <div onClick={() => navigate('/library/character/new/edit')} className="block group cursor-pointer">
                    <div className="h-full min-h-[300px] bg-secondary rounded-lg flex items-center justify-center border-2 border-dashed border-tertiary hover:border-accent hover:text-accent transition-all duration-300 text-text-secondary">
                      <div className="text-center"><span className="text-6xl font-thin">+</span><p className="mt-2">Create New NPC</p></div>
                    </div>
                  </div>
              </div>
          </div>
      )}

      <ItemEditorModal 
        isOpen={isItemModalOpen}
        onClose={() => setItemModalOpen(false)}
        onSave={onSaveItem}
        initialItem={editingItem}
      />
    </div>
  );
};

export default LorebookListPage;
