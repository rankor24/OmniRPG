
import React from 'react';
import type { World } from '../../types';
import { extractSuggestedActions } from '../../services/actionParser';
import { SwordIcon, SparklesIcon, SendIcon } from '../icons';

interface ActionBarProps {
    narrative: string;
    world: World;
    onAction: (actionText: string) => void;
    disabled: boolean;
}

const ActionBar: React.FC<ActionBarProps> = ({ narrative, world, onAction, disabled }) => {
    const suggestions = extractSuggestedActions(narrative, world);

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {suggestions.map((suggestion, idx) => (
                <button
                    key={idx}
                    onClick={() => onAction(suggestion.actionText)}
                    disabled={disabled}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all transform hover:scale-105 active:scale-95
                        ${suggestion.type === 'combat' ? 'bg-red-900/80 text-red-100 hover:bg-red-800 border border-red-700' : 
                          suggestion.type === 'interact' ? 'bg-blue-900/80 text-blue-100 hover:bg-blue-800 border border-blue-700' :
                          'bg-tertiary text-text-primary hover:bg-secondary border border-white/10'}
                    `}
                >
                    {suggestion.type === 'combat' && <SwordIcon className="w-3 h-3" />}
                    {suggestion.type === 'interact' && <SparklesIcon className="w-3 h-3" />}
                    {suggestion.label}
                </button>
            ))}
        </div>
    );
};

export default ActionBar;
