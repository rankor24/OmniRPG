import React from 'react';
import type { Character } from '../types';
import { EyeIcon, EditIcon } from './icons';

interface CharacterCardProps {
  character: Character;
  lastChat: string | null;
  sfwMode: boolean;
  onNewChat: (character: Character) => void;
  onEdit: (characterId: string) => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character, lastChat, sfwMode, onNewChat, onEdit }) => {
  const formattedDate = lastChat 
    ? `Last chatted: ${new Date(lastChat).toLocaleDateString()}`
    : 'No chats yet';

  const handleActionClick = (e: React.MouseEvent<HTMLButtonElement>, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  const ActionButton: React.FC<{
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    icon: React.ReactNode;
    label: string;
    className: string;
    ariaLabel: string;
  }> = ({ onClick, icon, label, className, ariaLabel }) => (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 btn-boop ${className}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div 
      onClick={() => onNewChat(character)}
      className="relative group bg-secondary rounded-lg overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-accent/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 border border-tertiary hover:border-accent cursor-pointer"
    >
      <div className="relative w-full aspect-[3/4]">
        {sfwMode ? (
          <div className="w-full h-full bg-tertiary flex flex-col items-center justify-center p-4">
            <EyeIcon className="w-12 h-12 text-text-secondary mb-4" />
            <p className="text-text-secondary text-center text-sm">Image hidden in SFW mode</p>
          </div>
        ) : (
          <img 
            src={character.avatar} 
            alt={character.name} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        
        {/* Actions Overlay */}
        <div className="absolute inset-0 p-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col gap-3 w-4/5">
             <ActionButton
              onClick={(e) => handleActionClick(e, () => onEdit(character.id))}
              icon={<EditIcon className="w-5 h-5"/>}
              label="Edit Character"
              className="bg-tertiary text-text-primary hover:bg-tertiary/70"
              ariaLabel={`Edit ${character.name}`}
            />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 p-4 w-full">
          <h3 className="text-xl font-bold text-text-primary group-hover:text-accent transition-colors truncate">{character.name}</h3>
        </div>
      </div>
      <div className="p-4">
        <p 
          className="text-sm text-text-secondary h-10 overflow-hidden" 
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
          title={character.tagline}
        >
          {character.tagline}
        </p>
        <p className="text-xs text-text-secondary text-right mt-2 opacity-70">
          {formattedDate}
        </p>
      </div>
    </div>
  );
};

export default CharacterCard;