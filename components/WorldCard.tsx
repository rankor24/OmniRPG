
import React from 'react';
import type { World } from '../types';
import { getGenreGradient, getGenreIconName, formatWorldDate } from '../services/worldCardService';
import { SwordIcon, SparklesIcon, GlobeIcon, TavernIcon, TrashIcon, EditIcon } from './icons';

interface WorldCardProps {
  world: World;
  onClick: (world: World) => void;
  onEdit?: (world: World) => void;
  onDelete?: (worldId: string) => void;
  saveCount?: number;
}

const GenreIcon = ({ genre, className }: { genre: string, className?: string }) => {
  const iconName = getGenreIconName(genre as any);
  switch (iconName) {
    case 'sword': return <SwordIcon className={className} />;
    case 'rocket': return <SparklesIcon className={className} />; // Using Sparkles as generic sci-fi/magic
    case 'skull': return <TavernIcon className={className} />; // Using Tavern as generic place
    case 'building': return <GlobeIcon className={className} />;
    default: return <GlobeIcon className={className} />;
  }
};

const WorldCard: React.FC<WorldCardProps> = ({ world, onClick, onEdit, onDelete, saveCount = 0 }) => {
  const gradientClass = getGenreGradient(world.genre);

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div 
      onClick={() => onClick(world)}
      className={`relative group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-white/10 h-64 flex flex-col`}
    >
      {/* Background Layer */}
      <div className={`absolute inset-0 ${gradientClass} opacity-80 group-hover:opacity-100 transition-opacity`}></div>
      {world.coverImage && (
        <div 
            className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-60 group-hover:opacity-80 transition-opacity"
            style={{ backgroundImage: `url(${world.coverImage})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

      {/* Content Layer */}
      <div className="relative z-10 p-5 flex flex-col h-full justify-between">
        
        {/* Top: Badges */}
        <div className="flex justify-between items-start">
            <span className="px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] uppercase font-bold tracking-wider text-white border border-white/20 flex items-center gap-1">
                <GenreIcon genre={world.genre} className="w-3 h-3" />
                {world.genre}
            </span>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                    <button 
                        onClick={(e) => handleAction(e, () => onEdit(world))}
                        className="p-1.5 bg-black/50 hover:bg-white/20 rounded-full text-white transition-colors"
                        title="Edit World"
                    >
                        <EditIcon className="w-4 h-4" />
                    </button>
                )}
                {onDelete && (
                    <button 
                        onClick={(e) => handleAction(e, () => onDelete(world.id))}
                        className="p-1.5 bg-black/50 hover:bg-red-500/50 rounded-full text-white transition-colors"
                        title="Delete World"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>

        {/* Bottom: Info */}
        <div>
            <h3 className="text-2xl font-bold text-white mb-1 leading-tight drop-shadow-md">{world.name}</h3>
            <p className="text-gray-300 text-xs line-clamp-2 mb-3 h-8">{world.description}</p>
            
            <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-white/10 pt-2">
                <span>{world.startingScenarios.length} Scenarios</span>
                <span>{saveCount > 0 ? `${saveCount} Saves` : 'New'}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default WorldCard;
