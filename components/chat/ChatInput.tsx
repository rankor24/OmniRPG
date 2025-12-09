import React from 'react';
import type { AppSettings } from '../types';
import { SendIcon, XIcon } from '../icons';

interface ChatInputProps {
  userInput: string;
  setUserInput: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  chatPartnerName: string;
  isEditorMode?: boolean;
  appSettings: AppSettings;
  // New props for image previews
  images: { url: string }[];
  onRemoveImage: (index: number) => void;
  imageDetail: 'auto' | 'low' | 'high';
  onImageDetailChange: (value: 'auto' | 'low' | 'high') => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  userInput,
  setUserInput,
  onSend,
  isLoading,
  chatPartnerName,
  isEditorMode,
  appSettings,
  images,
  onRemoveImage,
  imageDetail,
  onImageDetailChange,
}) => {
  const canSend = !isLoading && (userInput.trim() || images.length > 0);
  
  const getPlaceholderText = () => {
      if (isEditorMode) return "Ask OmniAI to edit app data...";
      return `Message ${chatPartnerName}...`;
  };

  return (
    <div className="bg-tertiary rounded-lg p-1.5 space-y-2">
      {images.length > 0 && (
        <div className="p-2 border-b border-secondary flex flex-wrap items-center gap-2">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img src={image.url} alt={`upload preview ${index+1}`} className="w-16 h-16 rounded object-cover" />
              <button
                onClick={() => onRemoveImage(index)}
                className="absolute -top-1 -right-1 bg-danger text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity btn-boop"
                aria-label="Remove image"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
           <div className="ml-auto flex items-center gap-2 pr-2">
                <label htmlFor="img-detail" className="text-xs text-text-secondary">Detail:</label>
                <select 
                    id="img-detail"
                    value={imageDetail} 
                    onChange={e => onImageDetailChange(e.target.value as 'auto' | 'low' | 'high')}
                    className="bg-secondary border border-tertiary text-text-primary text-xs rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-accent"
                >
                    <option value="high">High</option>
                    <option value="auto">Auto</option>
                    <option value="low">Low</option>
                </select>
            </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={getPlaceholderText()}
          className="flex-grow bg-tertiary border-none rounded-lg py-3 px-4 text-text-primary focus:outline-none focus:ring-0 resize-none"
          disabled={isLoading}
          rows={1}
        />
        <button
          onClick={onSend}
          disabled={!canSend}
          className="bg-accent text-primary p-3 rounded-full hover:bg-accent-hover disabled:bg-secondary disabled:text-text-secondary transition-colors btn-boop"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
