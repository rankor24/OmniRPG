
import React, { useState, useEffect } from 'react';
import type { GameSave, RpgGameState, World } from '../types';
import { useSaveManager } from '../hooks/useSaveManager';
import { XIcon, TrashIcon, CheckIcon, RefreshIcon, PlusIcon } from './icons';

interface SaveLoadModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'save' | 'load';
    world: World;
    currentGameState?: RpgGameState;
    currentLocation?: string;
    onLoadGame: (save: GameSave) => void;
    currentScenarioId?: string;
}

const SaveLoadModal: React.FC<SaveLoadModalProps> = ({ 
    isOpen, onClose, mode, world, currentGameState, currentLocation, onLoadGame, currentScenarioId
}) => {
    const { saves, refreshSaves, createSave, overwriteSave, deleteSave } = useSaveManager(world.id);
    const [activeTab, setActiveTab] = useState<'save' | 'load'>(mode);
    const [newSaveName, setNewSaveName] = useState('');
    const [selectedSaveId, setSelectedSaveId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(mode);
            refreshSaves();
            setNewSaveName(`Adventure in ${world.name}`);
        }
    }, [isOpen, mode, world.id, refreshSaves]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!currentGameState || !currentLocation) return;
        
        // If overwriting
        if (selectedSaveId) {
            const saveToOverwrite = saves.find(s => s.id === selectedSaveId);
            if (saveToOverwrite) {
                if (confirm(`Overwrite "${saveToOverwrite.name}"?`)) {
                    await overwriteSave({
                        ...saveToOverwrite,
                        gameState: currentGameState,
                        name: newSaveName || saveToOverwrite.name,
                        updatedAt: new Date().toISOString(),
                        lastPlayedAt: new Date().toISOString(),
                        description: `Location: ${currentLocation}`,
                        campaignProgress: {
                            ...saveToOverwrite.campaignProgress,
                            currentLocation
                        }
                    });
                    onClose();
                }
                return;
            }
        }

        // New Save
        await createSave(currentGameState, newSaveName, `Location: ${currentLocation}`, currentLocation, currentScenarioId);
        onClose();
    };

    const handleLoad = () => {
        const save = saves.find(s => s.id === selectedSaveId);
        if (save) {
            onLoadGame(save);
            onClose();
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Permanently delete this save file?")) {
            await deleteSave(id);
            if (selectedSaveId === id) setSelectedSaveId(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-secondary w-full max-w-2xl h-[600px] rounded-xl border border-tertiary flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-tertiary flex justify-between items-center bg-tertiary/20">
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setActiveTab('save')} 
                            disabled={!currentGameState}
                            className={`text-lg font-bold px-3 py-1 rounded ${activeTab === 'save' ? 'bg-accent text-primary' : 'text-text-secondary hover:text-text-primary disabled:opacity-50'}`}
                        >
                            Save Game
                        </button>
                        <button 
                            onClick={() => setActiveTab('load')} 
                            className={`text-lg font-bold px-3 py-1 rounded ${activeTab === 'load' ? 'bg-accent text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            Load Game
                        </button>
                    </div>
                    <button onClick={onClose}><XIcon className="w-6 h-6 text-text-secondary hover:text-text-primary" /></button>
                </div>

                <div className="flex-grow p-6 overflow-y-auto">
                    {activeTab === 'save' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">New Save Name</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newSaveName} 
                                        onChange={e => setNewSaveName(e.target.value)} 
                                        className="flex-grow bg-tertiary border border-tertiary rounded-lg p-3 text-text-primary focus:border-accent outline-none"
                                        placeholder="Enter save name..."
                                    />
                                    <button 
                                        onClick={handleSave} 
                                        disabled={!newSaveName.trim()}
                                        className="bg-green-600 hover:bg-green-500 text-white px-6 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Save New
                                    </button>
                                </div>
                            </div>
                            
                            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mt-8 mb-4">Overwrite Existing Save</h3>
                        </div>
                    )}

                    <div className="space-y-3">
                        {saves.map(save => (
                            <div 
                                key={save.id}
                                onClick={() => {
                                    setSelectedSaveId(save.id);
                                    if(activeTab === 'save') setNewSaveName(save.name);
                                }}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex justify-between items-center ${selectedSaveId === save.id ? 'border-accent bg-accent/10' : 'border-tertiary bg-tertiary/30 hover:border-tertiary/80'}`}
                            >
                                <div>
                                    <h4 className="font-bold text-text-primary">{save.name}</h4>
                                    <p className="text-sm text-text-secondary">{save.description}</p>
                                    <div className="text-xs text-text-secondary mt-1 opacity-70">
                                        Level {save.gameState.player.level} • {new Date(save.lastPlayedAt).toLocaleString()}
                                    </div>
                                </div>
                                {activeTab === 'save' && selectedSaveId === save.id ? (
                                    <button 
                                        onClick={handleSave} 
                                        className="bg-accent text-primary px-4 py-2 rounded font-bold hover:bg-accent-hover"
                                    >
                                        Overwrite
                                    </button>
                                ) : (
                                    <button 
                                        onClick={(e) => handleDelete(save.id, e)} 
                                        className="p-2 text-text-secondary hover:text-danger transition-colors"
                                        title="Delete Save"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {saves.length === 0 && (
                            <p className="text-center text-text-secondary italic py-8">No save files found for this world.</p>
                        )}
                    </div>
                </div>

                {activeTab === 'load' && (
                    <div className="p-4 border-t border-tertiary bg-tertiary/20 flex justify-end">
                        <button 
                            onClick={handleLoad}
                            disabled={!selectedSaveId}
                            className="bg-accent text-primary px-8 py-3 rounded-lg font-bold hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                        >
                            Load Selected Save
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SaveLoadModal;
