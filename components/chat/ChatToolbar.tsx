
import React, { useMemo, useState } from 'react';
import type { AppSettings, Character, Persona, PromptTemplate } from '../../types';
import { BrainIcon, LightBulbIcon, PaperclipIcon, ChevronDownIcon, FemaleHeadIcon, UserCircleIcon, EyeIcon, GiftIcon, BotIcon, FileTextIcon } from '../icons';

interface ChatToolbarProps {
  appSettings: AppSettings;
  character: Character | null;
  
  // Toggles
  showCharacterStatus: boolean;
  setShowCharacterStatus: (value: React.SetStateAction<boolean>) => void;
  showUserStatus: boolean;
  setShowUserStatus: (value: React.SetStateAction<boolean>) => void;

  isTransparentMode: boolean;
  setTransparentMode: (value: boolean) => void;
  reflectionStatus: 'idle' | 'reflecting' | 'success' | 'error';
  onMemoryModalOpen: () => void;
  // New props
  activePrompt: PromptTemplate | null;
  onPromptModalOpen: () => void;
  showScrollButton: boolean;
  onScrollToBottom: () => void;
  showAttachmentBar: boolean;
  setShowAttachmentBar: (value: React.SetStateAction<boolean>) => void;
  setUrlInputType: (value: 'image' | 'video' | null) => void;
  onTip: (amount: number) => void;
  onToggleReflections: () => void;
}

const ChatToolbar: React.FC<ChatToolbarProps> = (props) => {
  const {
    appSettings,
    character,
    showCharacterStatus, setShowCharacterStatus,
    showUserStatus, setShowUserStatus,
    isTransparentMode, setTransparentMode,
    reflectionStatus,
    onMemoryModalOpen,
    activePrompt, onPromptModalOpen,
    showScrollButton, onScrollToBottom,
    showAttachmentBar, setShowAttachmentBar, setUrlInputType,
    onTip,
    onToggleReflections,
  } = props;

  const [isTipping, setIsTipping] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const isRoleplaying = !!character;


  const handleConfirmTip = () => {
    const amount = parseInt(tipAmount, 10);
    if (!isNaN(amount)) {
      onTip(amount);
    }
    setTipAmount('');
    setIsTipping(false);
  };

  const memoryButtonClasses = useMemo(() => {
    let base = "p-2 rounded-full transition-all transform hover:scale-105 active:scale-95 btn-boop ";
    switch (reflectionStatus) {
        case 'reflecting':
            return base + 'bg-tertiary text-text-secondary';
        case 'success':
            return base + 'bg-green-500/30 text-green-300';
        case 'error':
            return base + 'bg-red-500/30 text-red-300';
        case 'idle':
        default:
            return base + 'bg-tertiary text-text-secondary hover:bg-tertiary/80 hover:text-text-primary';
    }
  }, [reflectionStatus]);

  const memoryButtonIcon = useMemo(() => {
      if (reflectionStatus === 'reflecting') {
          return <BrainIcon className="w-4 h-4 animate-pulse text-accent" />;
      }
      return <BrainIcon className="w-4 h-4" />;
  }, [reflectionStatus]);

  return (
    <>
      {showAttachmentBar && (
        <div className="bg-primary/50 rounded-lg p-2 mb-2 flex items-center justify-around gap-2 text-sm text-text-primary animate-fade-in-slide">
            <label htmlFor="image-file-input" className="flex-1 text-center p-2 rounded-md hover:bg-secondary cursor-pointer btn-boop">Image File</label>
            <div className="h-4 w-px bg-tertiary"></div>
            <button onClick={() => setUrlInputType('image')} className="flex-1 text-center p-2 rounded-md hover:bg-secondary btn-boop">Image URL</button>
            <div className="h-4 w-px bg-tertiary"></div>
            <label htmlFor="text-file-input" className="flex-1 text-center p-2 rounded-md hover:bg-secondary cursor-pointer btn-boop">Text File</label>
        </div>
      )}
       {isTipping && (
        <div className="bg-primary/50 rounded-lg p-2 mb-2 flex items-center gap-2 animate-fade-in-slide">
            <input
                type="number"
                value={tipAmount}
                onChange={e => setTipAmount(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmTip(); }}
                placeholder="Enter EXP amount..."
                autoFocus
                className="flex-grow bg-secondary border border-tertiary rounded-md p-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button onClick={handleConfirmTip} className="py-2 px-3 text-xs rounded-md bg-accent text-primary hover:bg-accent-hover btn-boop">Confirm</button>
            <button onClick={() => setIsTipping(false)} className="py-2 px-3 text-xs rounded-md text-text-primary hover:bg-secondary btn-boop">Cancel</button>
        </div>
      )}
      <div className="flex items-center justify-center flex-wrap gap-2 mb-3">
        <button
            onClick={onToggleReflections}
            className={`p-2 rounded-full transition-colors btn-boop ${appSettings.enableReflection ? 'bg-accent text-primary' : 'bg-tertiary text-text-secondary hover:text-text-primary'}`}
            title={`Reflections: ${appSettings.enableReflection ? 'ON' : 'OFF'}`}
        >
            <FileTextIcon className="w-4 h-4" />
        </button>
        <button
            onClick={onMemoryModalOpen}
            aria-label="View Conversation Memories"
            title={
                reflectionStatus === 'reflecting' ? "OmniAI is reflecting..." :
                reflectionStatus === 'success' ? "Reflection successful" :
                reflectionStatus === 'error' ? "Reflection failed" : "Memory Cortex"
            }
            className={memoryButtonClasses}
        >
            {memoryButtonIcon}
        </button>
        <div className="relative">
          <button
              onClick={onPromptModalOpen}
              className={`p-2 rounded-full transition-colors btn-boop ${activePrompt ? 'bg-accent text-primary' : 'bg-tertiary text-text-secondary hover:text-text-primary'}`}
              title="Select a one-time prompt"
          >
              <LightBulbIcon className="w-4 h-4" />
          </button>
           {activePrompt && (<span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-accent ring-2 ring-secondary" />)}
        </div>
        <button
            onClick={() => { setShowAttachmentBar(prev => !prev); setUrlInputType(null); }}
            className={`p-2 rounded-full transition-colors btn-boop ${showAttachmentBar ? 'bg-accent text-primary' : 'bg-tertiary text-text-secondary hover:text-text-primary'}`}
            title="Attach file"
        >
            <PaperclipIcon className="w-4 h-4" />
        </button>
        <button
            onClick={() => setIsTipping(prev => !prev)}
            className={`p-2 rounded-full transition-colors btn-boop ${isTipping ? 'bg-accent text-primary' : 'bg-tertiary text-text-secondary hover:text-text-primary'}`}
            title="Tip EXP"
        >
            <GiftIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowCharacterStatus(prev => !prev)}
          aria-label={isRoleplaying ? "Toggle Character Status Visibility" : "Toggle OmniAI Status Visibility"}
          aria-pressed={showCharacterStatus}
          title={isRoleplaying ? "Character Status" : "OmniAI Status"}
          className={`p-2 rounded-full transition-all transform hover:scale-105 active:scale-95 btn-boop ${
            showCharacterStatus ? 'bg-accent text-primary' : 'bg-tertiary text-text-secondary hover:bg-tertiary/80 hover:text-text-primary'
          }`}
        >
          {isRoleplaying ? <FemaleHeadIcon className="w-5 h-5" /> : <BotIcon className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setShowUserStatus(prev => !prev)}
          aria-label="Toggle User Status Visibility"
          aria-pressed={showUserStatus}
          title="User Status"
          className={`p-2 rounded-full transition-all transform hover:scale-105 active:scale-95 btn-boop ${
            showUserStatus ? 'bg-accent text-primary' : 'bg-tertiary text-text-secondary hover:bg-tertiary/80 hover:text-text-primary'
          }`}
        >
          <UserCircleIcon className="w-4 h-4" />
        </button>
      <button
        onClick={() => setTransparentMode(!isTransparentMode)}
        className={`p-2 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 btn-boop ${isTransparentMode ? 'bg-accent text-primary' : 'bg-tertiary text-text-secondary hover:bg-tertiary/80 hover:text-text-primary'}`}
        aria-label="Toggle chat bubble transparency"
        title="Toggle chat bubble transparency"
      >
        <EyeIcon className="w-4 h-4" />
      </button>
      {showScrollButton && (
        <button
            onClick={onScrollToBottom}
            className="p-2 rounded-full bg-tertiary text-text-secondary hover:bg-accent hover:text-primary transition-all duration-300 transform hover:scale-105 active:scale-95 btn-boop"
            aria-label="Scroll to bottom"
        >
            <ChevronDownIcon className="w-4 h-4" />
        </button>
      )}
    </div>
    </>
  );
};

export default ChatToolbar;
