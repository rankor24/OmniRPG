
import React from 'react';
import { useNavigate } from 'react-router-dom';
import OmniAiLogo from '../components/OmniAiLogo';
import type { AppSettings } from '../types';
import ToggleSwitch from '../components/ToggleSwitch';
import { initialize as initializeEmbeddingService } from '../services/embeddingService';

interface WelcomePageProps {
  appSettings: AppSettings;
  onSaveAppSettings: (settings: AppSettings) => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ appSettings, onSaveAppSettings }) => {
  const navigate = useNavigate();

  const handleEnter = () => {
    initializeEmbeddingService(); // Start pre-loading the on-device embedding model
    navigate('/campaigns');
  };

  const handleSfwToggle = (enabled: boolean) => {
    onSaveAppSettings({ ...appSettings, sfwMode: enabled });
  };
  
  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center text-center p-4">
      <div className="max-w-2xl w-full">
        <OmniAiLogo className="w-48 h-48 mx-auto mb-6" />
        <h1 className="text-5xl md:text-6xl font-bold text-text-primary tracking-tight mb-4">
          Welcome to <span className="text-accent">OmniRPG</span>
        </h1>
        <p className="text-lg text-text-secondary mb-12">
          An immersive AI Game Master for tabletop adventures.
        </p>
        
        <button 
          onClick={handleEnter} 
          className="group inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-accent hover:bg-accent-hover text-primary font-bold py-4 px-10 rounded-lg shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 transform hover:-translate-y-1 transition-all duration-300 btn-boop"
        >
          <span className="text-xl">Start Campaign</span>
        </button>
        
        <div className="mt-8 flex justify-center">
          <ToggleSwitch
            label="SFW Mode (Hides all images)"
            enabled={appSettings.sfwMode}
            onChange={handleSfwToggle}
            compact={true}
          />
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
