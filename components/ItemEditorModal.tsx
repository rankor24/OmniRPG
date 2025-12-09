
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { RpgItem } from '../types';
import { XIcon, SaveIcon } from './icons';

interface ItemEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: RpgItem) => void;
  initialItem?: RpgItem;
}

const emptyItem: RpgItem = {
    id: '',
    name: '',
    type: 'misc',
    quantity: 1,
    description: '',
    icon: '📦',
    stats: {}
};

const ItemEditorModal: React.FC<ItemEditorModalProps> = ({ isOpen, onClose, onSave, initialItem }) => {
  const [item, setItem] = useState<RpgItem>(emptyItem);

  useEffect(() => {
    if (isOpen) {
        if (initialItem) {
            setItem(JSON.parse(JSON.stringify(initialItem)));
        } else {
            setItem({ ...emptyItem, id: uuidv4() });
        }
    }
  }, [isOpen, initialItem]);

  if (!isOpen) return null;

  const handleChange = (field: keyof RpgItem, value: any) => {
      setItem(prev => ({ ...prev, [field]: value }));
  };

  const handleStatChange = (stat: 'attack' | 'defense' | 'value', value: string) => {
      const numValue = parseInt(value) || 0;
      setItem(prev => ({
          ...prev,
          stats: {
              ...prev.stats,
              [stat]: numValue
          }
      }));
  };

  const handleSave = () => {
      if (!item.name) {
          alert('Item Name is required');
          return;
      }
      onSave(item);
      onClose();
  };

  const formInputClass = "mt-1 block w-full bg-tertiary border border-tertiary rounded-md shadow-sm py-2 px-3 text-text-primary focus:outline-none focus:ring-accent focus:border-accent";
  const formLabelClass = "block text-sm font-medium text-text-secondary";

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-secondary w-full max-w-lg rounded-xl border border-tertiary shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-tertiary flex justify-between items-center">
                <h2 className="text-xl font-bold text-accent">{initialItem ? 'Edit Item' : 'Create New Item'}</h2>
                <button onClick={onClose}><XIcon className="w-6 h-6 text-text-secondary hover:text-text-primary" /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-3">
                        <label className={formLabelClass}>Name</label>
                        <input 
                            type="text" 
                            value={item.name} 
                            onChange={e => handleChange('name', e.target.value)} 
                            className={formInputClass}
                            placeholder="e.g. Iron Sword"
                        />
                    </div>
                    <div>
                        <label className={formLabelClass}>Icon</label>
                        <input 
                            type="text" 
                            value={item.icon || ''} 
                            onChange={e => handleChange('icon', e.target.value)} 
                            className={`${formInputClass} text-center`}
                            placeholder="🗡️"
                        />
                    </div>
                </div>

                <div>
                    <label className={formLabelClass}>Type</label>
                    <select 
                        value={item.type} 
                        onChange={e => handleChange('type', e.target.value)} 
                        className={formInputClass}
                    >
                        <option value="weapon">Weapon</option>
                        <option value="armor">Armor</option>
                        <option value="consumable">Consumable</option>
                        <option value="key">Key Item</option>
                        <option value="misc">Misc</option>
                    </select>
                </div>

                <div>
                    <label className={formLabelClass}>Description</label>
                    <textarea 
                        value={item.description || ''} 
                        onChange={e => handleChange('description', e.target.value)} 
                        className={`${formInputClass} min-h-[80px] resize-y`}
                        placeholder="Item details..."
                    />
                </div>

                <div className="bg-tertiary/30 p-3 rounded-lg border border-tertiary">
                    <h3 className="text-xs font-bold text-text-secondary uppercase mb-2">Stats</h3>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs text-text-secondary">Attack</label>
                            <input 
                                type="number" 
                                value={item.stats?.attack || ''} 
                                onChange={e => handleStatChange('attack', e.target.value)} 
                                className={formInputClass}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-text-secondary">Defense</label>
                            <input 
                                type="number" 
                                value={item.stats?.defense || ''} 
                                onChange={e => handleStatChange('defense', e.target.value)} 
                                className={formInputClass}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-text-secondary">Value (Gold)</label>
                            <input 
                                type="number" 
                                value={item.stats?.value || ''} 
                                onChange={e => handleStatChange('value', e.target.value)} 
                                className={formInputClass}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-tertiary flex justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 rounded-md text-text-primary hover:bg-tertiary transition-colors">Cancel</button>
                <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 rounded-md bg-accent text-primary font-bold hover:bg-accent-hover transition-colors">
                    <SaveIcon className="w-4 h-4" /> Save
                </button>
            </div>
        </div>
    </div>
  );
};

export default ItemEditorModal;
