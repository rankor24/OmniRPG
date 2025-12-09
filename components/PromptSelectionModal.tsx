import React from 'react';
import type { PromptTemplate } from '../types';
import { XIcon, LightBulbIcon } from './icons';

interface PromptSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: PromptTemplate[];
  onSelect: (prompt: PromptTemplate) => void;
  activePrompt: PromptTemplate | null;
  onClear: () => void;
}

const PromptSelectionModal: React.FC<PromptSelectionModalProps> = ({ isOpen, onClose, prompts, onSelect, activePrompt, onClear }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-secondary rounded-lg shadow-xl p-6 w-full max-w-2xl m-4 border border-accent flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-accent flex items-center gap-2">
                <LightBulbIcon /> Select a Prompt
            </h2>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                <XIcon />
            </button>
        </div>
        <p className="text-sm text-text-secondary mb-6">Choose a prompt to apply special instructions for your next message only. The selection will be cleared after one use.</p>
        
        <div className="flex-grow max-h-[50vh] overflow-y-auto pr-3 space-y-3 mb-6">
          {prompts.length > 0 ? (
            prompts.map((prompt) => (
              <button 
                key={prompt.id} 
                onClick={() => onSelect(prompt)}
                className={`w-full text-left bg-tertiary p-3 rounded-lg flex items-center justify-between gap-4 hover:bg-tertiary/70 border-2 transition-colors ${activePrompt?.id === prompt.id ? 'border-accent' : 'border-transparent'}`}
              >
                <div className="flex-grow overflow-hidden">
                  <p className="text-text-primary font-semibold truncate">{prompt.name}</p>
                  <p className="text-xs text-text-secondary mt-1 truncate">{prompt.prompt}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8 px-4 border-2 border-dashed border-tertiary rounded-lg">
                <p className="text-text-secondary">No prompt templates found.</p>
                <p className="text-sm text-text-secondary opacity-70 mt-1">You can create new ones in the 'Prompts' section from the sidebar.</p>
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 flex justify-between items-center">
             <button
                onClick={onClear}
                disabled={!activePrompt}
                className="py-2 px-4 border border-text-secondary rounded-md shadow-sm text-sm font-medium text-text-primary hover:bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
             >
                Clear Selection
             </button>
             <button
                onClick={onClose}
                className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-primary bg-accent hover:bg-accent-hover"
             >
                Close
             </button>
        </div>
      </div>
    </div>
  );
};

export default PromptSelectionModal;
