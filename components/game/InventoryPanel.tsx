
import React from 'react';
import { BackpackIcon } from '../icons';
import type { RpgItem } from '../../types';

interface InventoryPanelProps {
    items: RpgItem[];
}

const InventoryPanel: React.FC<InventoryPanelProps> = ({ items }) => {
    return (
        <div className="h-full overflow-y-auto p-4">
            {!items || items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-text-secondary opacity-50">
                    <BackpackIcon className="w-12 h-12 mb-2" />
                    <p>Empty Backpack</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {items.map((item, idx) => (
                        <div key={idx} className="bg-tertiary p-3 rounded-lg border border-white/5 hover:border-accent/50 transition-colors group relative flex flex-col h-full">
                            <div className="flex justify-between items-start">
                                <span className="text-2xl">{item.icon || (item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : item.type === 'consumable' ? '🧪' : '📦')}</span>
                                {item.quantity > 1 && (
                                    <span className="text-xs bg-black/40 px-1.5 py-0.5 rounded text-text-secondary">x{item.quantity}</span>
                                )}
                            </div>
                            <div className="text-sm font-bold text-text-primary mt-2 truncate" title={item.name}>{item.name}</div>
                            <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">{item.type}</div>
                            
                            {item.stats && (
                                <div className="text-[10px] text-accent/80 flex gap-2 mt-auto">
                                    {item.stats.attack && <span>ATK: {item.stats.attack}</span>}
                                    {item.stats.defense && <span>DEF: {item.stats.defense}</span>}
                                </div>
                            )}

                            {/* Hover Details */}
                            {item.description && (
                                <div className="absolute inset-0 bg-secondary/95 p-3 text-xs text-text-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-lg overflow-y-auto pointer-events-none border border-accent flex flex-col justify-center text-center shadow-lg z-10">
                                    <p className="font-bold mb-1">{item.name}</p>
                                    <p className="italic text-text-secondary">{item.description}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InventoryPanel;
