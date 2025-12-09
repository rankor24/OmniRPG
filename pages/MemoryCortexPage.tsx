
import React, { useState, useMemo, useEffect } from 'react';
import type { Memory, Character, StylePreference, GameSave } from '../types';
import { BrainIcon, GlobeIcon, UserCircleIcon, ChatCollectionIcon, PlusIcon, XIcon, EditIcon, TrashIcon, ListTimelineIcon, DatabaseIcon } from '../components/icons';
import SearchSortBar from '../components/SearchSortBar';
import { useSaveManager } from '../hooks/useSaveManager';

// ... (Existing Imports) ...

// Re-using simplified existing components for brevity, but updating the structure
// Assume TabButton, ItemCard, MemoryEditModal exist or are imported from previous implementations.

// --- New Imports / Types for Campaign Journal ---
// We need to inject `worldId` to fetch saves.
interface CampaignJournalPageProps {
  characters: Character[];
  allMemories: Memory[];
  onCreateMemory: (content: string, scope: Memory['scope'], entityId?: string) => Promise<string>;
  onUpdateMemory: (id: string, content: string) => Promise<string>;
  onDeleteMemory: (id: string) => Promise<string>;
  stylePreferences: StylePreference[];
  onSaveStylePreference: (pref: StylePreference) => void;
  onDeleteStylePreference: (prefId: string) => void;
  currentWorldId?: string; // Passed from App to list saves
}

const CampaignJournalPage: React.FC<CampaignJournalPageProps> = (props) => {
    const { currentWorldId, allMemories, characters, stylePreferences } = props;
    const [activeTab, setActiveTab] = useState<'memories' | 'saves' | 'styles'>('memories');
    const { saves, refreshSaves, deleteSave } = useSaveManager(currentWorldId || 'unknown');

    useEffect(() => {
        if(activeTab === 'saves' && currentWorldId) {
            refreshSaves();
        }
    }, [activeTab, currentWorldId, refreshSaves]);

    const handleDeleteSave = async (id: string) => {
        if(confirm("Delete this save file?")) {
            await deleteSave(id);
        }
    };

    return (
        <div className="h-full flex flex-col p-4 md:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-4xl font-bold text-text-primary">Campaign Journal</h1>
                <p className="text-text-secondary">Track your narrative history, manage saved games, and review learned knowledge.</p>
            </header>

            <div className="flex border-b border-tertiary mb-6">
                <button 
                    onClick={() => setActiveTab('memories')}
                    className={`px-4 py-2 font-bold ${activeTab === 'memories' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary'}`}
                >
                    Memory Timeline
                </button>
                <button 
                    onClick={() => setActiveTab('saves')}
                    className={`px-4 py-2 font-bold ${activeTab === 'saves' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary'}`}
                >
                    Saved Games
                </button>
                <button 
                    onClick={() => setActiveTab('styles')}
                    className={`px-4 py-2 font-bold ${activeTab === 'styles' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary'}`}
                >
                    Style Preferences
                </button>
            </div>

            <div className="flex-grow overflow-y-auto">
                {activeTab === 'memories' && (
                    <div className="space-y-4">
                        {/* Reuse existing memory list logic here, or simplified list */}
                        {allMemories.length === 0 ? <p className="text-text-secondary">No memories recorded yet.</p> : 
                            allMemories.map(mem => (
                                <div key={mem.id} className="bg-secondary p-4 rounded-lg border border-tertiary">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs uppercase font-bold px-2 py-1 rounded ${mem.scope === 'global' ? 'bg-green-900 text-green-200' : 'bg-blue-900 text-blue-200'}`}>
                                            {mem.scope}
                                        </span>
                                        <span className="text-xs text-text-secondary">{new Date(mem.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-text-primary">{mem.content}</p>
                                </div>
                            ))
                        }
                    </div>
                )}

                {activeTab === 'saves' && (
                    <div className="space-y-4">
                        {!currentWorldId ? (
                            <p className="text-text-secondary italic">Select a world/campaign to view save files.</p>
                        ) : saves.length === 0 ? (
                            <p className="text-text-secondary italic">No save files found for this world.</p>
                        ) : (
                            saves.map(save => (
                                <div key={save.id} className="bg-secondary p-4 rounded-lg border border-tertiary flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-lg text-text-primary">{save.name}</h3>
                                        <p className="text-sm text-text-secondary">{save.description}</p>
                                        <p className="text-xs text-text-secondary mt-1">Level {save.gameState.player.level} • {new Date(save.lastPlayedAt).toLocaleString()}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteSave(save.id)}
                                        className="p-2 text-text-secondary hover:text-danger transition-colors"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'styles' && (
                     <div className="space-y-4">
                        {stylePreferences.length === 0 ? <p className="text-text-secondary">No style preferences learned.</p> :
                            stylePreferences.map(style => (
                                <div key={style.id} className="bg-secondary p-4 rounded-lg border border-tertiary">
                                    <p className="text-text-primary">"{style.content}"</p>
                                    <p className="text-xs text-text-secondary mt-2">Derived from interactions with {style.characterName}</p>
                                </div>
                            ))
                        }
                     </div>
                )}
            </div>
        </div>
    );
};

export default CampaignJournalPage;
