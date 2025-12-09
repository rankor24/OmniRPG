
import React, { useState } from 'react';
import type { World, Scenario, Conversation } from '../types';
import { XIcon, PlusIcon, SwordIcon, RefreshIcon } from './icons';

interface ScenarioSelectorModalProps {
  world: World;
  saves: Conversation[];
  isOpen: boolean;
  onClose: () => void;
  onStartNew: (scenario: Scenario) => void;
  onLoadSave: (saveId: string) => void;
}

const ScenarioSelectorModal: React.FC<ScenarioSelectorModalProps> = ({ 
    world, saves, isOpen, onClose, onStartNew, onLoadSave 
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'load'>(saves.length > 0 ? 'load' : 'new');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStart = () => {
      if (activeTab === 'new' && selectedScenarioId) {
          const scenario = world.startingScenarios.find(s => s.id === selectedScenarioId);
          if (scenario) onStartNew(scenario);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-secondary w-full max-w-4xl h-[80vh] rounded-xl border border-tertiary shadow-2xl flex flex-col overflow-hidden animate-fade-in-slide"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-tertiary flex justify-between items-center bg-tertiary/20">
            <div>
                <h2 className="text-3xl font-bold text-accent">{world.name}</h2>
                <p className="text-text-secondary text-sm mt-1">{world.description}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-tertiary rounded-full text-text-secondary hover:text-text-primary transition-colors">
                <XIcon className="w-6 h-6" />
            </button>
        </div>

        {/* Content */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="w-full md:w-64 bg-tertiary/10 border-r border-tertiary p-4 flex flex-col gap-2">
                <button 
                    onClick={() => setActiveTab('new')}
                    className={`p-3 rounded-lg text-left flex items-center gap-3 transition-colors ${activeTab === 'new' ? 'bg-accent text-primary font-bold' : 'hover:bg-tertiary text-text-secondary'}`}
                >
                    <PlusIcon className="w-5 h-5" />
                    New Campaign
                </button>
                <button 
                    onClick={() => setActiveTab('load')}
                    disabled={saves.length === 0}
                    className={`p-3 rounded-lg text-left flex items-center gap-3 transition-colors ${activeTab === 'load' ? 'bg-accent text-primary font-bold' : 'hover:bg-tertiary text-text-secondary'} ${saves.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <RefreshIcon className="w-5 h-5" />
                    Load Save ({saves.length})
                </button>
            </div>

            {/* Main Area */}
            <div className="flex-grow p-6 overflow-y-auto">
                {activeTab === 'new' && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-text-primary mb-4">Select Starting Scenario</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {world.startingScenarios.map(scenario => (
                                <div 
                                    key={scenario.id}
                                    onClick={() => setSelectedScenarioId(scenario.id)}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedScenarioId === scenario.id ? 'border-accent bg-accent/10' : 'border-tertiary hover:border-text-secondary bg-secondary'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-lg text-text-primary">{scenario.title}</h4>
                                        {selectedScenarioId === scenario.id && <SwordIcon className="w-5 h-5 text-accent" />}
                                    </div>
                                    <p className="text-sm text-text-secondary mt-2 italic">"{scenario.openingNarration}"</p>
                                    <div className="mt-3 flex gap-2 text-xs text-text-secondary">
                                        <span className="bg-tertiary px-2 py-1 rounded">Loc: {scenario.startingLocation}</span>
                                        {scenario.requiredInventory && (
                                            <span className="bg-tertiary px-2 py-1 rounded">Items: {scenario.requiredInventory.length}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'load' && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-text-primary mb-4">Continue Adventure</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {saves.sort((a,b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()).map(save => (
                                <div 
                                    key={save.id}
                                    onClick={() => onLoadSave(save.id)}
                                    className="p-4 rounded-lg border border-tertiary hover:border-accent bg-secondary cursor-pointer group transition-all"
                                >
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-lg text-text-primary group-hover:text-accent">{save.preview}</h4>
                                        <span className="text-xs text-text-secondary">{new Date(save.lastMessageAt).toLocaleString()}</span>
                                    </div>
                                    <div className="mt-2 text-sm text-text-secondary">
                                        {save.rpgGameState ? `Level ${save.rpgGameState.player.level} • ${save.rpgGameState.gold} Gold` : 'No Stats'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-tertiary bg-tertiary/10 flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-2 rounded-lg border border-tertiary text-text-primary hover:bg-tertiary">Cancel</button>
            {activeTab === 'new' && (
                <button 
                    onClick={handleStart}
                    disabled={!selectedScenarioId}
                    className="px-8 py-2 rounded-lg bg-accent text-primary font-bold hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Begin Adventure
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ScenarioSelectorModal;
