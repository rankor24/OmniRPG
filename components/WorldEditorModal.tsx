
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { World, Scenario } from '../types';
import { XIcon, PlusIcon, TrashIcon } from './icons';

interface WorldEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (world: World) => void;
  initialWorld?: World;
}

const emptyWorld: World = {
    id: '',
    name: '',
    description: '',
    coverImage: '',
    genre: 'fantasy',
    mechanics: { useDice: true, statSystem: 'dnd5e', attributes: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] },
    lorebookIds: [],
    startingScenarios: [],
    theme: { font: 'serif', primaryColor: '#d97706', secondaryColor: '#78350f', uiSoundPack: 'fantasy' },
    createdAt: '',
    updatedAt: ''
};

const WorldEditorModal: React.FC<WorldEditorModalProps> = ({ isOpen, onClose, onSave, initialWorld }) => {
  const [world, setWorld] = useState<World>(emptyWorld);
  const [jsonView, setJsonView] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (initialWorld) {
            setWorld(JSON.parse(JSON.stringify(initialWorld)));
        } else {
            setWorld({ ...emptyWorld, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        }
    }
  }, [isOpen, initialWorld]);

  if (!isOpen) return null;

  const handleChange = (field: keyof World, value: any) => {
      setWorld(prev => ({ ...prev, [field]: value }));
  };

  const handleMechanicsChange = (field: keyof World['mechanics'], value: any) => {
      setWorld(prev => ({ ...prev, mechanics: { ...prev.mechanics, [field]: value } }));
  };

  const handleAddScenario = () => {
      const newScenario: Scenario = {
          id: uuidv4(),
          title: 'New Scenario',
          openingNarration: 'Describe the start...',
          startingLocation: 'Start Point',
          requiredInventory: []
      };
      setWorld(prev => ({ ...prev, startingScenarios: [...prev.startingScenarios, newScenario] }));
  };

  const handleUpdateScenario = (index: number, field: keyof Scenario, value: any) => {
      const updated = [...world.startingScenarios];
      updated[index] = { ...updated[index], [field]: value };
      setWorld(prev => ({ ...prev, startingScenarios: updated }));
  };

  const handleDeleteScenario = (index: number) => {
      const updated = world.startingScenarios.filter((_, i) => i !== index);
      setWorld(prev => ({ ...prev, startingScenarios: updated }));
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-secondary w-full max-w-5xl h-[90vh] rounded-xl flex flex-col border border-tertiary shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 border-b border-tertiary flex justify-between items-center">
                <h2 className="text-2xl font-bold text-accent">{initialWorld ? 'Edit World' : 'Create New World'}</h2>
                <div className="flex gap-2">
                    <button onClick={() => setJsonView(!jsonView)} className="px-3 py-1 text-xs border border-tertiary rounded text-text-secondary hover:text-text-primary">
                        {jsonView ? 'View Form' : 'View JSON'}
                    </button>
                    <button onClick={onClose}><XIcon className="w-6 h-6 text-text-secondary" /></button>
                </div>
            </div>

            {/* Body */}
            <div className="flex-grow overflow-y-auto p-6">
                {jsonView ? (
                    <textarea 
                        className="w-full h-full bg-black/50 text-green-400 font-mono text-sm p-4 rounded border border-tertiary focus:outline-none"
                        value={JSON.stringify(world, null, 2)}
                        readOnly
                    />
                ) : (
                    <div className="space-y-8">
                        {/* Basic Info */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-1">World Name</label>
                                    <input 
                                        type="text" 
                                        value={world.name} 
                                        onChange={e => handleChange('name', e.target.value)} 
                                        className="w-full bg-tertiary border border-tertiary rounded p-2 text-text-primary focus:border-accent outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-1">Genre</label>
                                    <select 
                                        value={world.genre} 
                                        onChange={e => handleChange('genre', e.target.value)} 
                                        className="w-full bg-tertiary border border-tertiary rounded p-2 text-text-primary focus:border-accent outline-none"
                                    >
                                        <option value="fantasy">Fantasy</option>
                                        <option value="scifi">Sci-Fi</option>
                                        <option value="horror">Horror</option>
                                        <option value="modern">Modern</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-1">Cover Image URL</label>
                                    <input 
                                        type="text" 
                                        value={world.coverImage || ''} 
                                        onChange={e => handleChange('coverImage', e.target.value)} 
                                        className="w-full bg-tertiary border border-tertiary rounded p-2 text-text-primary focus:border-accent outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-1">Description</label>
                                <textarea 
                                    value={world.description} 
                                    onChange={e => handleChange('description', e.target.value)} 
                                    className="w-full h-full min-h-[150px] bg-tertiary border border-tertiary rounded p-2 text-text-primary focus:border-accent outline-none resize-none"
                                />
                            </div>
                        </section>

                        {/* Mechanics */}
                        <section className="bg-tertiary/20 p-4 rounded-lg border border-tertiary">
                            <h3 className="text-lg font-bold text-text-primary mb-4 border-b border-tertiary pb-2">Mechanics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer mb-4">
                                        <input 
                                            type="checkbox" 
                                            checked={world.mechanics.useDice} 
                                            onChange={e => handleMechanicsChange('useDice', e.target.checked)} 
                                            className="w-5 h-5 accent-accent"
                                        />
                                        <span className="text-text-primary">Enable Dice Rolling</span>
                                    </label>
                                    <div>
                                        <label className="block text-sm font-bold text-text-secondary mb-1">Stat System</label>
                                        <select 
                                            value={world.mechanics.statSystem} 
                                            onChange={e => handleMechanicsChange('statSystem', e.target.value)} 
                                            className="w-full bg-tertiary border border-tertiary rounded p-2 text-text-primary focus:border-accent outline-none"
                                        >
                                            <option value="dnd5e">D&D 5e (d20)</option>
                                            <option value="special">SPECIAL (Fallout style)</option>
                                            <option value="lite">Lite (Minimal stats)</option>
                                            <option value="diceless">Diceless (Narrative)</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-1">Attributes (comma separated)</label>
                                    <input 
                                        type="text" 
                                        value={world.mechanics.attributes.join(', ')} 
                                        onChange={e => handleMechanicsChange('attributes', e.target.value.split(',').map(s => s.trim()))} 
                                        className="w-full bg-tertiary border border-tertiary rounded p-2 text-text-primary focus:border-accent outline-none"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Scenarios */}
                        <section>
                            <div className="flex justify-between items-center mb-4 border-b border-tertiary pb-2">
                                <h3 className="text-lg font-bold text-text-primary">Starting Scenarios</h3>
                                <button onClick={handleAddScenario} className="flex items-center gap-1 text-sm bg-accent/20 text-accent px-3 py-1 rounded hover:bg-accent/30 transition-colors">
                                    <PlusIcon className="w-4 h-4" /> Add Scenario
                                </button>
                            </div>
                            <div className="space-y-4">
                                {world.startingScenarios.map((scenario, idx) => (
                                    <div key={scenario.id} className="bg-tertiary/10 p-4 rounded border border-tertiary hover:border-accent/50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <input 
                                                type="text" 
                                                value={scenario.title} 
                                                onChange={e => handleUpdateScenario(idx, 'title', e.target.value)}
                                                className="bg-transparent text-lg font-bold text-text-primary focus:border-b border-accent outline-none w-1/2"
                                                placeholder="Scenario Title"
                                            />
                                            <button onClick={() => handleDeleteScenario(idx)} className="text-text-secondary hover:text-danger"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <textarea 
                                                value={scenario.openingNarration}
                                                onChange={e => handleUpdateScenario(idx, 'openingNarration', e.target.value)}
                                                className="w-full h-20 bg-tertiary border border-tertiary rounded p-2 text-sm text-text-secondary focus:text-text-primary outline-none resize-none"
                                                placeholder="Opening narration..."
                                            />
                                            <div className="space-y-2">
                                                <input 
                                                    type="text" 
                                                    value={scenario.startingLocation} 
                                                    onChange={e => handleUpdateScenario(idx, 'startingLocation', e.target.value)}
                                                    className="w-full bg-tertiary border border-tertiary rounded p-2 text-sm text-text-primary focus:border-accent outline-none"
                                                    placeholder="Starting Location"
                                                />
                                                <input 
                                                    type="text" 
                                                    value={(scenario.requiredInventory || []).join(', ')} 
                                                    onChange={e => handleUpdateScenario(idx, 'requiredInventory', e.target.value.split(',').map(s => s.trim()))}
                                                    className="w-full bg-tertiary border border-tertiary rounded p-2 text-sm text-text-primary focus:border-accent outline-none"
                                                    placeholder="Starting Inventory (comma separated)"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-tertiary flex justify-end gap-3">
                <button onClick={onClose} className="px-6 py-2 rounded-lg border border-tertiary text-text-primary hover:bg-tertiary">Cancel</button>
                <button 
                    onClick={() => onSave(world)}
                    className="px-8 py-2 rounded-lg bg-accent text-primary font-bold hover:bg-accent-hover transition-colors"
                >
                    Save World
                </button>
            </div>
        </div>
    </div>
  );
};

export default WorldEditorModal;
