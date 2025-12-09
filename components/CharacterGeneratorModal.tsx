import React, { useState } from 'react';
import type { Character, AppSettings } from '../types';
import { generateCharacterFromText } from '../services/characterGenerator';
import { LightBulbIcon, XIcon } from './icons';

interface CharacterGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (characterData: Partial<Character>) => void;
  appSettings: AppSettings;
}

const CharacterGeneratorModal: React.FC<CharacterGeneratorModalProps> = ({ isOpen, onClose, onGenerate, appSettings }) => {
  const [rawText, setRawText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasApiKey = () => {
    switch (appSettings.aiProvider) {
      case 'gemini':
        return true; 
      case 'deepseek':
        return !!appSettings.deepseekApiKey;
      case 'groq':
        return !!appSettings.groqApiKey;
      case 'xai':
        return !!appSettings.xaiApiKey;
      default:
        return false;
    }
  };

  const handleGenerateClick = async () => {
    if (!rawText.trim()) {
      setError("Please paste some character details first.");
      return;
    }
    if (!hasApiKey()) {
      setError(`This feature requires a valid API key for the selected provider (${appSettings.aiProvider}). Please set it in the main settings.`);
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const characterData = await generateCharacterFromText(rawText, appSettings);
      onGenerate(characterData);
      onClose();
      setRawText(''); // Clear text on success
    } catch (e) {
      console.error("Failed to generate character:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-secondary rounded-lg shadow-xl p-6 w-full max-w-3xl m-4 border border-accent flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-accent flex items-center gap-2">
                <LightBulbIcon />
                Create Character from Text
            </h2>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary btn-boop">
                <XIcon />
            </button>
        </div>
        <p className="text-sm text-text-secondary mb-4">
            Paste your character's description, personality, scenario, first message, etc., into the box below. The AI will attempt to parse it and fill out the character sheet for you.
        </p>
        
        <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste character details here..."
            className="w-full h-64 bg-tertiary border border-tertiary rounded-md p-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-y"
            disabled={isGenerating}
        />

        {error && <p className="text-danger text-sm mt-2">{error}</p>}
        
        <div className="mt-6 flex justify-end">
            <button
                onClick={handleGenerateClick}
                disabled={isGenerating || !rawText.trim()}
                className="py-2 px-6 border border-transparent rounded-md text-sm font-medium text-primary bg-accent hover:bg-accent-hover disabled:bg-tertiary disabled:cursor-not-allowed btn-boop"
            >
                {isGenerating ? 'Generating...' : 'Generate'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterGeneratorModal;