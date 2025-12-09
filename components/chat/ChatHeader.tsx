
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Character, ChatSceneState, Conversation, AvatarEmotionState } from '../../types';
import { ChevronLeftIcon, CogIcon, EyeIcon, UserCircleIcon, FemaleHeadIcon, BotIcon } from '../icons';

const ExpandableStatusLine: React.FC<{ label: string; text: string; isTransparentMode: boolean }> = ({ label, text, isTransparentMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const safeText = text || '';

  useEffect(() => {
    if (textRef.current) {
      setIsOverflowing(textRef.current.scrollHeight > textRef.current.clientHeight);
    }
  }, [safeText]);

  const gradientClass = isTransparentMode 
    ? "from-transparent" 
    : "from-secondary via-secondary";

  return (
    <div 
      onClick={() => isOverflowing && setIsExpanded(!isExpanded)}
      className={`group relative ${isOverflowing ? 'cursor-pointer' : ''} flex gap-1`}
      title={isOverflowing ? (isExpanded ? "Click to collapse" : "Click to expand") : ""}
    >
      <strong className="text-text-secondary/80 whitespace-nowrap">{label}:</strong>
      <div 
        ref={textRef}
        className={`${isExpanded ? '' : 'line-clamp-3'} transition-all duration-200 whitespace-pre-wrap break-words text-text-primary/90 flex-1`}
      >
        {safeText}
      </div>
      
      {!isExpanded && isOverflowing && (
         <div className={`absolute bottom-0 right-0 pl-4 bg-gradient-to-l ${gradientClass} to-transparent text-accent text-[10px] font-bold leading-none`}>
             ...
         </div>
      )}
    </div>
  );
};

interface StatusPanelProps {
  sceneState: ChatSceneState | null;
  showCharacterStatus: boolean;
  showUserStatus: boolean;
  isRoleplaying: boolean;
  isTransparentMode: boolean;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ sceneState, showCharacterStatus, showUserStatus, isRoleplaying, isTransparentMode }) => {
  if (!sceneState || (!showCharacterStatus && !showUserStatus)) return null;

  const bgClass = isTransparentMode ? 'bg-transparent' : 'bg-secondary/95 backdrop-blur-md';
  const borderClass = isTransparentMode ? 'border-transparent' : 'border-tertiary';

  return (
    <div className={`${bgClass} px-3 py-2 border-t ${borderClass} grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-[10px] leading-tight animate-fade-in shadow-inner transition-colors duration-300`}>
        {showCharacterStatus && (
            <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-text-primary/90 border-b border-tertiary/30 pb-0.5 mb-0.5">
                    <span className="font-bold flex items-center gap-1 text-accent">
                        {isRoleplaying ? <FemaleHeadIcon className="w-3 h-3"/> : <BotIcon className="w-3 h-3" />} 
                        {isRoleplaying ? 'NPC' : 'Game Master'}
                    </span>
                    <span className="text-text-tertiary">|</span>
                    <span className="text-text-secondary truncate flex-1"><strong className="text-text-secondary/70">Loc:</strong> {sceneState.characterStatus.location}</span>
                </div>
                <ExpandableStatusLine label="Appr" text={sceneState.characterStatus.appearance} isTransparentMode={isTransparentMode} />
                <ExpandableStatusLine label="Pos" text={sceneState.characterStatus.position} isTransparentMode={isTransparentMode} />
            </div>
        )}
        {showUserStatus && (
            <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-text-primary/90 border-b border-tertiary/30 pb-0.5 mb-0.5">
                    <span className="font-bold flex items-center gap-1 text-blue-400">
                        <UserCircleIcon className="w-3 h-3"/> Player
                    </span>
                    <span className="text-text-tertiary">|</span>
                    <span className="text-text-secondary truncate flex-1"><strong className="text-text-secondary/70">Loc:</strong> {sceneState.userStatus.location}</span>
                </div>
                <ExpandableStatusLine label="Appr" text={sceneState.userStatus.appearance} isTransparentMode={isTransparentMode} />
                <ExpandableStatusLine label="Pos" text={sceneState.userStatus.position} isTransparentMode={isTransparentMode} />
            </div>
        )}
    </div>
  );
};

// --- Avatar Component ---
interface AvatarProps {
    avatarUrl: string;
    sfwMode: boolean;
    characterName: string;
    className?: string;
}
  
const Avatar: React.FC<AvatarProps> = ({ avatarUrl, sfwMode, characterName, className = 'w-[4.5rem] h-[4.5rem]' }) => {
    if (sfwMode) {
        return (
            <div className={`${className} rounded-full bg-tertiary flex items-center justify-center`}>
                <EyeIcon className="w-1/2 h-1/2 text-text-secondary" />
            </div>
        );
    }
    
    return (
        <div className={`relative ${className} rounded-full overflow-hidden`}>
            <img 
                src={avatarUrl} 
                alt={characterName} 
                className={`w-full h-full object-cover`} 
            />
        </div>
    );
};


interface ChatHeaderProps {
  chatPartner: Character;
  character: Character | null; // The session character
  conversation: Conversation | null;
  sceneState: ChatSceneState | null;
  sfwMode: boolean;
  showCharacterStatus: boolean;
  showUserStatus: boolean;
  onOpenSettings: () => void;
  isTransparentMode: boolean;
  avatarEmotionState: AvatarEmotionState;
}

const ChatHeader: React.FC<ChatHeaderProps> = (props) => {
  const { chatPartner, character, sfwMode, showCharacterStatus, showUserStatus, onOpenSettings, conversation, isTransparentMode } = props;
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  
  const isHudOpen = showCharacterStatus || showUserStatus;
  const isRoleplaying = !!character;

  const headerBgClass = isTransparentMode ? 'bg-transparent border-transparent' : 'bg-secondary/95 backdrop-blur-md border-tertiary';

  return (
    <>
      <div className={`relative z-10 flex-shrink-0 ${headerBgClass} border-b shadow-sm transition-colors duration-300`}>
        <div className="px-3 py-2">
          <div className="flex items-center justify-between gap-2">
              {/* LEFT GROUP: Back, Avatar, Name/Edit */}
              <div className="flex items-center gap-3 flex-shrink-1 min-w-0">
                  <Link to="/chats" className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-tertiary rounded-full transition-colors flex-shrink-0">
                      <ChevronLeftIcon />
                  </Link>
                  <button onClick={() => setIsAvatarModalOpen(true)} className={`relative p-0.5 rounded-full border-2 border-tertiary transition-colors flex-shrink-0 btn-boop`} aria-label="Enlarge avatar">
                      <Avatar
                          avatarUrl={chatPartner.avatar}
                          sfwMode={sfwMode}
                          characterName={chatPartner.name}
                      />
                  </button>
                  <div className="flex flex-col justify-center min-w-0 overflow-hidden">
                      <h2 className="text-sm font-bold text-text-primary leading-none truncate">
                        {chatPartner.name}
                      </h2>
                      {character && (
                          <Link to={`/library/character/${character.id}/edit`} className="text-[10px] text-text-secondary hover:text-accent flex items-center gap-1 mt-0.5 w-fit group">
                            <span className="border-b border-transparent group-hover:border-accent transition-colors">Edit NPC</span>
                          </Link>
                      )}
                  </div>
              </div>

              {/* RIGHT GROUP: Cog */}
              <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                  <button onClick={onOpenSettings} className="p-1.5 rounded-full text-text-secondary hover:bg-tertiary hover:text-text-primary transition-colors btn-boop" aria-label="In-Chat Settings">
                      <CogIcon className="w-5 h-5" />
                  </button>
              </div>
          </div>
        </div>
        <div className={`hud-container ${isHudOpen ? 'is-open' : ''}`} style={{ maxHeight: isHudOpen ? '1000px' : '0' }}>
          <StatusPanel 
              sceneState={props.sceneState} 
              showCharacterStatus={showCharacterStatus}
              showUserStatus={showUserStatus}
              isRoleplaying={isRoleplaying}
              isTransparentMode={isTransparentMode}
          />
        </div>
      </div>

      {isAvatarModalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 avatar-modal-backdrop"
          onClick={() => setIsAvatarModalOpen(false)}
        >
          <div 
            className="avatar-modal-image"
            onClick={(e) => e.stopPropagation()} 
          >
            <Avatar
                avatarUrl={chatPartner.avatar}
                sfwMode={sfwMode}
                characterName={chatPartner.name}
                className="w-[90vmin] h-[90vmin] max-w-[512px] max-h-[512px] shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ChatHeader;
