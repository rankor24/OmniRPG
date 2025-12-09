
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorldManager } from '../hooks/useWorldManager';
import WorldCard from '../components/WorldCard';
import ScenarioSelectorModal from '../components/ScenarioSelectorModal';
import WorldEditorModal from '../components/WorldEditorModal';
import SearchSortBar from '../components/SearchSortBar';
import { PlusIcon } from '../components/icons';
import type { World, Scenario, RpgItem } from '../types';

interface CampaignSelectPageProps {
  omniAiId: string;
  libraryItems: RpgItem[];
}

const CampaignSelectPage: React.FC<CampaignSelectPageProps> = ({ omniAiId, libraryItems }) => {
  const navigate = useNavigate();
  const { worlds, getAvailableSaves, createNewCampaign, createWorld, updateWorld, deleteWorld } = useWorldManager(omniAiId, libraryItems);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  
  const [selectedWorld, setSelectedWorld] = useState<World | null>(null);
  const [isScenarioModalOpen, setScenarioModalOpen] = useState(false);
  
  const [editingWorld, setEditingWorld] = useState<World | null>(null); // For editor
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const filteredWorlds = useMemo(() => {
    return worlds.filter(w => {
      const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = selectedGenre === 'all' || w.genre === selectedGenre;
      return matchesSearch && matchesGenre;
    });
  }, [worlds, searchTerm, selectedGenre]);

  const handleWorldClick = (world: World) => {
    setSelectedWorld(world);
    setScenarioModalOpen(true);
  };

  const handleStartNewCampaign = async (scenario: Scenario) => {
    if (!selectedWorld) return;
    try {
        const newConversation = await createNewCampaign(selectedWorld, scenario);
        navigate(`/chat/${newConversation.id}`, { state: { newConversation } });
    } catch (e) {
        console.error("Failed to start campaign:", e);
        alert("Failed to start campaign.");
    }
  };

  const handleLoadSave = (saveId: string) => {
      navigate(`/chat/${saveId}`);
  };

  const handleCreateNewWorld = () => {
      setEditingWorld(null); // Clear for new
      setIsEditorOpen(true);
  };

  const handleEditWorld = (world: World) => {
      setEditingWorld(world);
      setIsEditorOpen(true);
  };

  const handleSaveWorld = async (worldData: World) => {
      if (editingWorld) {
          await updateWorld(worldData.id, worldData);
      } else {
          await createWorld(worldData);
      }
      setIsEditorOpen(false);
  };

  const handleDeleteWorld = async (worldId: string) => {
      if (window.confirm("Are you sure you want to delete this world? All associated campaigns will eventually lose context.")) {
          await deleteWorld(worldId);
      }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 bg-primary">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-4xl font-bold text-text-primary tracking-tight">Select a World</h1>
            <p className="text-text-secondary mt-1">Choose a setting for your next adventure.</p>
        </div>
        <button 
            onClick={handleCreateNewWorld}
            className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-primary font-bold rounded-lg transition-colors shadow-lg shadow-accent/20 btn-boop"
        >
            <PlusIcon className="w-5 h-5" />
            Create Custom World
        </button>
      </header>

      <SearchSortBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search worlds..."
        className="mb-8"
      >
          <div className="relative min-w-[160px]">
            <select
                value={selectedGenre}
                onChange={e => setSelectedGenre(e.target.value)}
                className="block w-full pl-3 pr-8 py-2 text-base border border-tertiary rounded-lg bg-tertiary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent sm:text-sm appearance-none transition-all duration-200 cursor-pointer shadow-sm"
            >
                <option value="all">All Genres</option>
                <option value="fantasy">Fantasy</option>
                <option value="scifi">Sci-Fi</option>
                <option value="horror">Horror</option>
                <option value="modern">Modern</option>
                <option value="custom">Custom</option>
            </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
      </SearchSortBar>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        {filteredWorlds.map(world => (
            <WorldCard 
                key={world.id} 
                world={world} 
                onClick={handleWorldClick}
                onEdit={handleEditWorld}
                onDelete={handleDeleteWorld}
                saveCount={getAvailableSaves(world.id).length}
            />
        ))}
      </div>

      {/* Modals */}
      {selectedWorld && (
          <ScenarioSelectorModal
            world={selectedWorld}
            saves={getAvailableSaves(selectedWorld.id)}
            isOpen={isScenarioModalOpen}
            onClose={() => setScenarioModalOpen(false)}
            onStartNew={handleStartNewCampaign}
            onLoadSave={handleLoadSave}
          />
      )}

      <WorldEditorModal 
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveWorld}
        initialWorld={editingWorld || undefined}
      />
    </div>
  );
};

export default CampaignSelectPage;