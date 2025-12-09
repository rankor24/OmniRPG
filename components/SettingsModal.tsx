





import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { AppSettings, AiProvider, Lorebook } from '../types';
import ToggleSwitch from './ToggleSwitch';
import { prepareBackupData, importBackupData, BackupDataParts } from '../services/dataManager';
import { uploadBackupToDropbox, downloadBackupFromDropbox } from '../services/dropbox';
import { 
    CogIcon, 
    BrainIcon, 
    SparklesIcon, 
    DatabaseIcon, 
    FileTextIcon, 
    WrenchScrewdriverIcon 
} from './icons';

interface SettingsModalProps {
  appSettings: AppSettings;
  onSaveAppSettings: (settings: AppSettings) => void;
  onClose: () => void;
  onLogout: () => void;
  onRunMigrations: () => void;
}

const AI_PROVIDERS: Record<AiProvider, { name: string; models: string[]; keyField: ('deepseekApiKey' | 'groqApiKey' | 'xaiApiKey' | 'googleCloudApiKey') | null; keyName: string | null; keyPlaceholder?: string }> = {
  xai: {
    name: 'xAI (Grok)',
    models: ['grok-4-fast', 'grok-4-fast-non-reasoning', 'grok-4-1-fast-non-reasoning', 'grok-4-1-fast-reasoning'],
    keyField: 'xaiApiKey',
    keyName: 'xAI API Key',
    keyPlaceholder: 'Enter your xAI API key',
  },
  deepseek: {
    name: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    keyField: 'deepseekApiKey',
    keyName: 'DeepSeek API Key',
    keyPlaceholder: 'Enter your DeepSeek API key',
  },
  gemini: {
    name: 'Google Gemini',
    models: ['gemini-2.5-flash'],
    keyField: null,
    keyName: null,
  },
  groq: {
    name: 'Groq',
    models: [
        'llama-3.1-8b-instant',
        'llama-3.3-70b-versatile',
        'meta-llama/llama-guard-4-12b',
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'groq/compound',
        'groq/compound-mini',
        'meta-llama/llama-4-maverick-17b-128e-instruct',
        'meta-llama/llama-4-scout-17b-16e-instruct',
        'meta-llama/llama-prompt-guard-2-22m',
        'meta-llama/llama-prompt-guard-2-86m',
        'moonshotai/kimi-k2-instruct-0905',
        'qwen/qwen3-32b'
    ],
    keyField: 'groqApiKey',
    keyName: 'Groq API Key',
    keyPlaceholder: 'Enter your Groq API key',
  },
};

const GROQ_VOICES = [
  { id: 'Arista-PlayAI', name: 'Arista (Female)' },
  { id: 'Celeste-PlayAI', name: 'Celeste (Female)' },
  { id: 'Cheyenne-PlayAI', name: 'Cheyenne (Female)' },
  { id: 'Deedee-PlayAI', name: 'Deedee (Female)' },
  { id: 'Gail-PlayAI', name: 'Gail (Female)' },
  { id: 'Indigo-PlayAI', name: 'Indigo (Female)' },
  { id: 'Mamaw-PlayAI', name: 'Mamaw (Female)' },
  { id: 'Quinn-PlayAI', name: 'Quinn (Female)' },
];

const GOOGLE_VOICES = [
  { id: 'en-GB-Neural2-A', name: 'GB-Neural2-A (Female)' },
  { id: 'en-GB-Neural2-C', name: 'GB-Neural2-C (Female)' },
  { id: 'en-GB-Neural2-F', name: 'GB-Neural2-F (Female)' },
  { id: 'en-GB-Standard-A', name: 'GB-Standard-A (Female)' },
  { id: 'en-GB-Standard-C', name: 'GB-Standard-C (Female)' },
  { id: 'en-GB-Standard-F', name: 'GB-Standard-F (Female)' },
  { id: 'en-GB-Wavenet-A', name: 'GB-Wavenet-A (Female)' },
  { id: 'en-GB-Wavenet-C', name: 'GB-Wavenet-C (Female)' },
  { id: 'en-GB-Wavenet-F', name: 'GB-Wavenet-F (Female)' },
  { id: 'en-GB-News-G', name: 'GB-News-G (Female)' },
  { id: 'en-GB-Studio-C', name: 'GB-Studio-C (Female)' },
  { id: 'en-US-Neural2-C', name: 'US-Neural2-C (Female)' },
  { id: 'en-US-Neural2-E', name: 'US-Neural2-E (Female)' },
  { id: 'en-US-Neural2-F', name: 'US-Neural2-F (Female)' },
  { id: 'en-US-Neural2-G', name: 'US-Neural2-G (Female)' },
  { id: 'en-US-Neural2-H', name: 'US-Neural2-H (Female)' },
  { id: 'en-US-Standard-C', name: 'US-Standard-C (Female)' },
  { id: 'en-US-Standard-E', name: 'US-Standard-E (Female)' },
  { id: 'en-US-Standard-F', name: 'US-Standard-F (Female)' },
  { id: 'en-US-Standard-G', name: 'US-Standard-G (Female)' },
  { id: 'en-US-Standard-H', name: 'US-Standard-H (Female)' },
  { id: 'en-US-Wavenet-C', name: 'US-Wavenet-C (Female)' },
  { id: 'en-US-Wavenet-E', name: 'US-Wavenet-E (Female)' },
  { id: 'en-US-Wavenet-F', name: 'US-Wavenet-F (Female)' },
  { id: 'en-US-Wavenet-G', name: 'US-Wavenet-G (Female)' },
  { id: 'en-US-Wavenet-H', name: 'US-Wavenet-H (Female)' },
  { id: 'en-US-News-K', name: 'US-News-K (Female)' },
  { id: 'en-US-Studio-O', name: 'US-Studio-O (Female)' },
];


const SliderInput: React.FC<{
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}> = ({ label, description, value, onChange, min, max, step }) => {
  const formLabelClass = "block text-sm font-medium text-text-secondary";

  return (
    <div>
        <label className={formLabelClass}>{label}</label>
        <p className="text-xs text-text-secondary opacity-70 mb-2">{description}</p>
        <div className="flex items-center gap-4">
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <input
                type="number"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value) || 0)}
                className="w-28 bg-tertiary border border-tertiary text-text-primary rounded-md p-1 text-center"
            />
        </div>
    </div>
  );
};

type SettingsTab = 'general' | 'gameplay' | 'generation' | 'data' | 'prompts';

const SettingsModal: React.FC<SettingsModalProps> = ({ appSettings, onSaveAppSettings, onClose, onLogout, onRunMigrations }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Split state into smaller chunks to prevent re-cloning large objects on minor changes
  const [providerConfig, setProviderConfig] = useState({
    aiProvider: appSettings.aiProvider,
    aiModel: appSettings.aiModel,
    deepseekApiKey: appSettings.deepseekApiKey,
    groqApiKey: appSettings.groqApiKey,
    xaiApiKey: appSettings.xaiApiKey,
  });
  
  const [generationParams, setGenerationParams] = useState({
    temperature: appSettings.temperature,
    maxTokens: appSettings.maxTokens,
    contextSize: appSettings.contextSize,
    vectorTopK: appSettings.vectorTopK || 15,
  });

  const [imageProvider, setImageProvider] = useState(appSettings.imageProvider);

  const [ttsConfig, setTtsConfig] = useState({
    enableTts: appSettings.enableTts,
    ttsProvider: appSettings.ttsProvider,
    ttsVoice: appSettings.ttsVoice,
    googleCloudApiKey: appSettings.googleCloudApiKey,
  });

  const [featureToggles, setFeatureToggles] = useState({
    enableRelationshipProgression: appSettings.enableRelationshipProgression,
    enableDominanceProgression: appSettings.enableDominanceProgression,
    enableLustProgression: appSettings.enableLustProgression,
    enableGlobalMemories: appSettings.enableGlobalMemories ?? true,
    enableAutomaticMemoryGeneration: appSettings.enableAutomaticMemoryGeneration ?? true,
    enableLearnedStyle: appSettings.enableLearnedStyle ?? false,
    enableAssociativeMemory: appSettings.enableAssociativeMemory ?? true,
    enableShortTermMemory: appSettings.enableShortTermMemory,
    enableReflection: appSettings.enableReflection ?? true,
    enableBackgroundKeepAlive: appSettings.enableBackgroundKeepAlive ?? false,
    enableDynamicFirstMessages: appSettings.enableDynamicFirstMessages ?? false,
    enableXaiAgenticSearch: appSettings.enableXaiAgenticSearch ?? false,
    enableXaiImageUnderstanding: appSettings.enableXaiImageUnderstanding ?? true,
    enableXaiVideoUnderstanding: appSettings.enableXaiVideoUnderstanding ?? false,
    sfwMode: appSettings.sfwMode ?? false,
    enableImageCensorship: appSettings.enableImageCensorship ?? true,
  });

  const [instructionalPrompts, setInstructionalPrompts] = useState(appSettings.instructionalPrompts);
  
  const [cloudSyncConfig, setCloudSyncConfig] = useState({
    enableImageSync: appSettings.enableImageSync ?? true,
    dropboxAppKey: appSettings.dropboxAppKey || '',
    dropboxAppSecret: appSettings.dropboxAppSecret || '',
    dropboxRefreshToken: appSettings.dropboxRefreshToken || '',
  });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const MODEL_DEFAULT_CONTEXT: Record<string, number> = {
    'deepseek-chat': 128000,
    'deepseek-reasoner': 128000,
    'gemini-2.5-flash': 1000000,
    'openai/gpt-oss-120b': 131000,
    'openai/gpt-oss-20b': 131000,
    'moonshotai/kimi-k2-instruct-0905': 256000,
    'grok-4': 128000,
    'grok-4-fast': 2000000,
    'grok-4-fast-non-reasoning': 2000000,
    'grok-4-fast-non-reasoning-latest': 2000000,
    'grok-4-fast-reasoning': 2000000,
    'grok-4-fast-reasoning-latest': 2000000,
    'grok-4-1-fast-non-reasoning': 2000000,
    'grok-4-1-fast-reasoning': 2000000,
  };
  const DEFAULT_CONTEXT_SIZE = 4096;

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newProvider = e.target.value as AiProvider;
      const providerInfo = AI_PROVIDERS[newProvider];
      const newModel = providerInfo.models.length > 0 ? providerInfo.models[0] : '';
      const newContextSize = MODEL_DEFAULT_CONTEXT[newModel] || DEFAULT_CONTEXT_SIZE;
      
      let newTemp;
      if (newProvider === 'groq') {
          newTemp = 1.15;
      } else if (newProvider === 'deepseek') {
          newTemp = 0.65;
      } else if (newProvider === 'xai') {
          newTemp = 0.8;
      } else { // gemini
          newTemp = 0.9;
      }
      
      setProviderConfig(prev => ({ ...prev, aiProvider: newProvider, aiModel: newModel }));
      setGenerationParams(prev => ({ ...prev, contextSize: newContextSize, temperature: newTemp }));
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newModel = e.target.value;
      const newContextSize = MODEL_DEFAULT_CONTEXT[newModel] || DEFAULT_CONTEXT_SIZE;
      
      setProviderConfig(prev => ({ ...prev, aiModel: newModel }));
      setGenerationParams(prev => ({ ...prev, contextSize: newContextSize }));
  };

  const handleTtsProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newProvider = e.target.value as 'groq' | 'google';
      let newVoice = '';
      if (newProvider === 'groq') {
          newVoice = GROQ_VOICES[0].id;
      } else if (newProvider === 'google') {
          newVoice = GOOGLE_VOICES[0].id;
      }
      setTtsConfig(prev => ({ ...prev, ttsProvider: newProvider, ttsVoice: newVoice }));
  };
  
  const handleSave = () => {
    const finalSettings: AppSettings = {
      ...appSettings, // Base to ensure no properties are lost
      ...providerConfig,
      ...generationParams,
      ...ttsConfig,
      ...featureToggles,
      ...cloudSyncConfig,
      imageProvider,
      instructionalPrompts,
    };
    onSaveAppSettings(finalSettings);
    onClose();
  };
  
  const handleImportAllData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (files.length !== 2) {
      alert("Please select both the Data and Images backup files to import.");
      event.target.value = '';
      return;
    }

    const fileArray = [...files];
    const dataFile = fileArray.find(f => f.name.includes('_Data.json'));
    const imageFile = fileArray.find(f => f.name.includes('_Images.json'));

    if (!dataFile || !imageFile) {
      alert("Could not find both `_Data.json` and `_Images.json` files. Please make sure you select both backup files.");
      event.target.value = '';
      return;
    }
    
    if (!window.confirm('This will merge data from the backup files. Existing data with the same name/ID will NOT be overwritten. This is useful for combining data from two devices. Continue?')) {
        event.target.value = '';
        return;
    }

    const reader1 = new FileReader();
    const reader2 = new FileReader();
    
    let textData: string, imageData: string;

    const processFiles = async () => {
        if (textData && imageData) {
            try {
                await importBackupData(textData, imageData);
                alert("Data merged successfully! The application will now reload to apply the changes.");
                window.location.reload();
            } catch (error) {
                alert(error instanceof Error ? error.message : "Failed to import data. Please ensure you've selected valid OmniAI backup files.");
                console.error("Import error:", error);
            } finally {
                 event.target.value = '';
            }
        }
    };
    
    reader1.onload = (e) => { textData = e.target?.result as string; processFiles(); };
    reader2.onload = (e) => { imageData = e.target?.result as string; processFiles(); };

    reader1.readAsText(dataFile);
    reader2.readAsText(imageFile);
  };

  const downloadFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportAllData = useCallback(async () => {
    try {
        const parts = await prepareBackupData(true); 
        
        const combined = { localStorage: {}, indexedDB: {} };
        (['chats', 'characters', 'memories', 'lorebooks', 'system'] as const).forEach(key => {
             const part = JSON.parse(parts[key] as string);
             if (part.localStorage) Object.assign((combined as any).localStorage, part.localStorage);
             if (part.indexedDB) Object.assign((combined as any).indexedDB, part.indexedDB);
        });

        const timestamp = new Date().toISOString().split('T')[0];
        downloadFile(JSON.stringify(combined, null, 2), `omni-ai-backup_${timestamp}_Data.json`);
        downloadFile(parts.images || '{}', `omni-ai-backup_${timestamp}_Images.json`);
    } catch (e) {
        console.error("Failed to export data:", e);
        alert("An error occurred during data export. Check the console for details.");
    }
  }, []);

  const handleUpload = async () => {
    setSyncStatus('syncing');
    setUploadProgress(0);
    setSyncMessage('Starting backup process...');
    
    const creds = {
        appKey: cloudSyncConfig.dropboxAppKey,
        appSecret: cloudSyncConfig.dropboxAppSecret,
        refreshToken: cloudSyncConfig.dropboxRefreshToken
    };

    try {
        const dataParts = await prepareBackupData(
            cloudSyncConfig.enableImageSync, 
            (msg) => setSyncMessage(msg)
        );
        
        setSyncMessage('Uploading categorized files to Dropbox...');
        
        await uploadBackupToDropbox(dataParts, creds, (msg, progress) => {
            setSyncMessage(msg);
            setUploadProgress(progress);
        });
        
        const newTimestamp = new Date().toISOString();
        const updatedSettings = { 
            ...appSettings, 
            ...cloudSyncConfig, 
            lastSuccessfulSync: newTimestamp 
        };
        onSaveAppSettings(updatedSettings);
        
        setSyncStatus('success');
        setSyncMessage(`Successfully uploaded on ${new Date(newTimestamp).toLocaleString()}`);
    } catch (error) {
        setSyncStatus('error');
        setSyncMessage(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
        setTimeout(() => {
            if (syncStatus !== 'error') setSyncStatus('idle');
        }, 5000);
    }
  };

  const handleDownload = async () => {
    if (!window.confirm("This will merge data from Dropbox with your local data. New data will be added, but existing items will NOT be overwritten. Continue?")) {
        return;
    }
    setSyncStatus('syncing');
    setSyncMessage('Downloading from Dropbox...');
    
    const creds = {
        appKey: cloudSyncConfig.dropboxAppKey,
        appSecret: cloudSyncConfig.dropboxAppSecret,
        refreshToken: cloudSyncConfig.dropboxRefreshToken
    };

    try {
        const { textData, imageData } = await downloadBackupFromDropbox(creds);
        setSyncMessage('Merging data...');
        await importBackupData(textData, imageData);
        
        const updatedSettings = { 
            ...appSettings, 
            ...cloudSyncConfig, 
            lastSuccessfulSync: new Date().toISOString()
        };
        onSaveAppSettings(updatedSettings);
        
        setSyncStatus('success');
        setSyncMessage('Merge complete! Reloading...');
        setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
        setSyncStatus('error');
        setSyncMessage(error instanceof Error ? error.message : 'An unknown error occurred.');
        setTimeout(() => setSyncStatus('idle'), 5000);
    }
  };

  const selectedProviderInfo = useMemo(() => AI_PROVIDERS[providerConfig.aiProvider], [providerConfig.aiProvider]);
  const ttsVoiceOptions = useMemo(() => {
    if (ttsConfig.ttsProvider === 'groq') {
      return GROQ_VOICES;
    }
    if (ttsConfig.ttsProvider === 'google') {
      return GOOGLE_VOICES;
    }
    return [];
  }, [ttsConfig.ttsProvider]);


  const formInputClass = "mt-1 block w-full bg-tertiary border border-tertiary rounded-md shadow-sm py-2 px-3 text-text-primary focus:outline-none focus:ring-accent focus:border-accent";
  const formLabelClass = "block text-sm font-medium text-text-secondary";
  
  const roleplaySystemPrompt = instructionalPrompts.find(p => p.id === 'roleplay-instructions');

  const TabButton = ({ tab, label, icon }: { tab: SettingsTab, label: string, icon: React.ReactNode }) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === tab 
            ? 'bg-secondary text-accent border-b-2 border-accent' 
            : 'text-text-secondary hover:text-text-primary hover:bg-tertiary/50'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-secondary rounded-lg shadow-xl p-6 w-full max-w-3xl m-4 border border-accent flex flex-col h-[85vh] md:h-auto md:max-h-[85vh]" onClick={e => e.stopPropagation()}>
        
        <div className="flex-shrink-0 border-b border-tertiary pb-2 mb-4">
          <h2 className="text-2xl font-bold text-accent mb-4">Settings</h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <TabButton tab="general" label="General" icon={<CogIcon className="w-4 h-4" />} />
            <TabButton tab="gameplay" label="Gameplay" icon={<BrainIcon className="w-4 h-4" />} />
            <TabButton tab="generation" label="Generation" icon={<SparklesIcon className="w-4 h-4" />} />
            <TabButton tab="data" label="Data" icon={<DatabaseIcon className="w-4 h-4" />} />
            <TabButton tab="prompts" label="Prompts" icon={<FileTextIcon className="w-4 h-4" />} />
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto pr-2 space-y-6">
          
          {activeTab === 'general' && (
            <section className="animate-fade-in">
              <h3 className="text-lg font-semibold text-text-primary mb-4">AI Core Configuration</h3>
               <div className="space-y-4">
                  <div>
                      <label htmlFor="aiProvider" className={formLabelClass}>AI Provider</label>
                      <select
                          id="aiProvider"
                          value={providerConfig.aiProvider}
                          onChange={handleProviderChange}
                          className={formInputClass}
                      >
                          {Object.entries(AI_PROVIDERS).map(([key, value]) => (
                              <option key={key} value={key}>{value.name}</option>
                          ))}
                      </select>
                  </div>
                  {selectedProviderInfo.keyField && (
                      <div>
                          <label htmlFor={selectedProviderInfo.keyField} className={formLabelClass}>{selectedProviderInfo.keyName}</label>
                          <input
                              type="password"
                              id={selectedProviderInfo.keyField}
                              placeholder={selectedProviderInfo.keyPlaceholder}
                              value={providerConfig[selectedProviderInfo.keyField] || ''}
                              onChange={(e) => setProviderConfig(prev => ({...prev, [selectedProviderInfo.keyField!]: e.target.value}))}
                              className={formInputClass}
                          />
                      </div>
                  )}
                   <div>
                      <label htmlFor="aiModel" className={formLabelClass}>AI Model</label>
                      <select
                          id="aiModel"
                          value={providerConfig.aiModel}
                          onChange={handleModelChange}
                          className={formInputClass}
                          disabled={selectedProviderInfo.models.length === 0}
                      >
                          {selectedProviderInfo.models.length > 0 ? (
                              selectedProviderInfo.models.map(model => (
                                  <option key={model} value={model}>{model}</option>
                              ))
                          ) : (
                              <option>No models available</option>
                          )}
                      </select>
                  </div>
                  
                  {providerConfig.aiProvider === 'xai' && (
                    <div className="pl-3 py-3 bg-tertiary/30 rounded-md border-l-2 border-accent space-y-3">
                      <h4 className="text-sm font-semibold text-text-primary">xAI Agentic Search</h4>
                      <ToggleSwitch
                        label="Enable Agentic Search"
                        description="Allows the AI to search the web or X (Twitter) for up-to-date information."
                        enabled={featureToggles.enableXaiAgenticSearch}
                        onChange={v => setFeatureToggles(prev => ({...prev, enableXaiAgenticSearch: v}))}
                        compact
                      />
                      {featureToggles.enableXaiAgenticSearch && (
                        <>
                          <ToggleSwitch
                            label="Image Understanding"
                            description="Analyze images found during search (uses more tokens)."
                            enabled={featureToggles.enableXaiImageUnderstanding}
                            onChange={v => setFeatureToggles(prev => ({...prev, enableXaiImageUnderstanding: v}))}
                            compact
                          />
                          <ToggleSwitch
                            label="Video Understanding"
                            description="Analyze videos found in X posts (uses more tokens)."
                            enabled={featureToggles.enableXaiVideoUnderstanding}
                            onChange={v => setFeatureToggles(prev => ({...prev, enableXaiVideoUnderstanding: v}))}
                            compact
                          />
                        </>
                      )}
                    </div>
                  )}
               </div>
            </section>
          )}

          {activeTab === 'gameplay' && (
            <section className="animate-fade-in space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Progression Systems</h3>
                    <div className="space-y-3 bg-tertiary/20 p-3 rounded-lg border border-tertiary">
                        <ToggleSwitch
                            label="Relationship Progression"
                            description="Enable/disable the relationship scoring system."
                            enabled={featureToggles.enableRelationshipProgression}
                            onChange={v => setFeatureToggles(prev => ({...prev, enableRelationshipProgression: v}))}
                            compact
                        />
                        <ToggleSwitch
                            label="Dominance Progression"
                            description="Enable/disable the dominance scoring system."
                            enabled={featureToggles.enableDominanceProgression}
                            onChange={v => setFeatureToggles(prev => ({...prev, enableDominanceProgression: v}))}
                            compact
                        />
                        <ToggleSwitch
                            label="Lust Progression"
                            description="Enable/disable the lust scoring system."
                            enabled={featureToggles.enableLustProgression}
                            onChange={v => setFeatureToggles(prev => ({...prev, enableLustProgression: v}))}
                            compact
                        />
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Advanced Memory Systems</h3>
                    <div className="space-y-3 bg-tertiary/20 p-3 rounded-lg border border-tertiary">
                        <ToggleSwitch
                            label="Global Memories (The Fact Base)"
                            description="Injects permanent, objective facts into the AI's prompt for every turn."
                            enabled={featureToggles.enableGlobalMemories}
                            onChange={v => setFeatureToggles(prev => ({...prev, enableGlobalMemories: v}))}
                            compact
                        />
                        <ToggleSwitch
                            label="Automatic Memory Generation (The Scribe)"
                            description="Enables the 'Generate from Last Exchange' button in chat to extract new facts."
                            enabled={featureToggles.enableAutomaticMemoryGeneration}
                            onChange={v => setFeatureToggles(prev => ({...prev, enableAutomaticMemoryGeneration: v}))}
                            compact
                        />
                        <ToggleSwitch
                            label="Learned Style Preferences (The Stylist)"
                            description="AI learns and adapts to your preferred writing style based on your message ratings."
                            enabled={featureToggles.enableLearnedStyle}
                            onChange={v => setFeatureToggles(prev => ({...prev, enableLearnedStyle: v}))}
                            compact
                        />
                        <ToggleSwitch
                            label="Associative Memory (The Contextualizer)"
                            description="AI-driven retrieval of the most relevant facts from lorebooks, characters, and memories for each turn."
                            enabled={featureToggles.enableAssociativeMemory}
                            onChange={v => setFeatureToggles(prev => ({...prev, enableAssociativeMemory: v}))}
                            compact
                        />
                        <ToggleSwitch
                            label="Short-Term Memory (The Attentive Listener)"
                            description="The AI will try to remember and address points from the user's last message."
                            enabled={featureToggles.enableShortTermMemory}
                            onChange={v => setFeatureToggles(prev => ({...prev, enableShortTermMemory: v}))}
                            compact
                        />
                        <ToggleSwitch
                            label="Reflection System (The Meta-Cognitive Core)"
                            description="Allows the AI to analyze conversations and propose self-improvements. Disabling improves performance."
                            enabled={featureToggles.enableReflection}
                            onChange={v => setFeatureToggles(prev => ({...prev, enableReflection: v}))}
                            compact
                        />
                    </div>
                </div>
                
                <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">App Behavior</h3>
                    <div className="space-y-3 bg-tertiary/20 p-3 rounded-lg border border-tertiary">
                        <ToggleSwitch
                            label="Background Keep-Alive"
                            description="Prevents browser suspension on mobile during long AI tasks. May increase battery usage."
                            enabled={featureToggles.enableBackgroundKeepAlive}
                            onChange={v => setFeatureToggles(prev => ({...prev, enableBackgroundKeepAlive: v}))}
                            compact
                        />
                        <ToggleSwitch
                            label="SFW Mode"
                            description="Hides all explicit images and avatars throughout the application."
                            enabled={featureToggles.sfwMode}
                            onChange={v => setFeatureToggles(prev => ({...prev, sfwMode: v }))}
                            compact
                        />
                        <ToggleSwitch
                            label="Dynamic First Messages"
                            description="AI generates unique first messages for characters instead of using pre-defined ones."
                            enabled={featureToggles.enableDynamicFirstMessages}
                            onChange={v => setFeatureToggles(prev => ({...prev, enableDynamicFirstMessages: v }))}
                            compact
                        />
                    </div>
                </div>
            </section>
          )}

          {activeTab === 'generation' && (
            <section className="animate-fade-in space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Parameters</h3>
                    <div className="space-y-4">
                        <SliderInput 
                                label="Temperature"
                                description="Controls randomness. Higher values are more creative, lower values are more deterministic."
                                value={generationParams.temperature}
                                onChange={v => setGenerationParams(prev => ({...prev, temperature: v}))}
                                min={0}
                                max={2.0}
                                step={0.05}
                        />
                        <SliderInput 
                                label="Max Tokens"
                                description="The maximum number of tokens to generate in a response. 0 means no limit."
                                value={generationParams.maxTokens}
                                onChange={v => setGenerationParams(prev => ({...prev, maxTokens: v}))}
                                min={0}
                                max={8192}
                                step={128}
                        />
                        <SliderInput 
                                label="Context Size (Tokens)"
                                description="Max tokens for context. More context improves coherence but costs more. Approx. 4 chars/token."
                                value={generationParams.contextSize}
                                onChange={v => setGenerationParams(prev => ({...prev, contextSize: v}))}
                                min={1024}
                                max={2000000}
                                step={1024}
                        />
                        <SliderInput
                                label="RAG Top K"
                                description="Number of most relevant items (memories, lore, characters) to retrieve via vector search for context."
                                value={generationParams.vectorTopK}
                                onChange={v => setGenerationParams(prev => ({...prev, vectorTopK: v}))}
                                min={1}
                                max={50}
                                step={1}
                        />
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Image Generation</h3>
                    <div className="space-y-4">
                    <div>
                        <label htmlFor="imageProvider" className={formLabelClass}>Provider</label>
                        <select
                            id="imageProvider"
                            value={imageProvider || 'pollinations'}
                            onChange={(e) => setImageProvider(e.target.value as 'pollinations' | 'xai' | 'imagen-4' | 'nano-banana')}
                            className={formInputClass}
                        >
                            <option value="pollinations">Pollinations.ai (Free)</option>
                            <option value="imagen-4">Google - Imagen 4 (Paid, Gemini API)</option>
                            <option value="nano-banana">Google - Nano Banana (Paid, Gemini API)</option>
                            <option value="xai">xAI - Grok (Paid, xAI API Key)</option>
                        </select>
                        <p className="text-xs text-text-secondary opacity-70 mt-2">
                            {imageProvider === 'xai' ? "Uses Grok-2-image via your xAI API key." :
                            imageProvider === 'imagen-4' ? "Uses Google's Imagen 4 model via Gemini API." :
                            imageProvider === 'nano-banana' ? "Uses Google's Nano Banana model via Gemini API." :
                            "Uses the free tier of Pollinations.ai."}
                        </p>
                    </div>
                    <ToggleSwitch
                        label="Enable Image Censorship"
                        description="Artistically covers nudity. Disabling may produce explicit content."
                        enabled={featureToggles.enableImageCensorship}
                        onChange={v => setFeatureToggles(prev => ({...prev, enableImageCensorship: v }))}
                        compact
                    />
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Text-to-Speech (TTS)</h3>
                    <div className="space-y-4">
                    <ToggleSwitch
                        label="Enable TTS"
                        description="Adds a button to AI messages to hear them read aloud."
                        enabled={ttsConfig.enableTts}
                        onChange={v => setTtsConfig(prev => ({...prev, enableTts: v}))}
                        compact
                    />
                    {ttsConfig.enableTts && (
                        <div className="pl-3 border-l-2 border-accent/30 space-y-3">
                        <div>
                            <label htmlFor="ttsProvider" className={formLabelClass}>TTS Provider</label>
                            <select
                                id="ttsProvider"
                                value={ttsConfig.ttsProvider}
                                onChange={handleTtsProviderChange}
                                className={formInputClass}
                            >
                                <option value="groq">Groq (PlayAI)</option>
                                <option value="google">Google Cloud TTS</option>
                            </select>
                        </div>
                        {ttsConfig.ttsProvider === 'google' && (
                            <div>
                            <label htmlFor="googleCloudApiKey" className={formLabelClass}>Google Cloud API Key (for TTS)</label>
                            <input
                                type="password"
                                id="googleCloudApiKey"
                                placeholder="Enter your Google Cloud API key"
                                value={ttsConfig.googleCloudApiKey || ''}
                                onChange={(e) => setTtsConfig(prev => ({...prev, googleCloudApiKey: e.target.value}))}
                                className={formInputClass}
                            />
                            </div>
                        )}
                        <div>
                            <label htmlFor="ttsVoice" className={formLabelClass}>TTS Voice</label>
                            <select
                                id="ttsVoice"
                                value={ttsConfig.ttsVoice}
                                onChange={(e) => setTtsConfig(prev => ({...prev, ttsVoice: e.target.value}))}
                                className={formInputClass}
                            >
                                {ttsVoiceOptions.length > 0 ? (
                                    ttsVoiceOptions.map(voice => (
                                        <option key={voice.id} value={voice.id}>{voice.name}</option>
                                    ))
                                ) : (
                                    <option>No voices available</option>
                                )}
                            </select>
                        </div>
                        </div>
                    )}
                    </div>
                </div>
            </section>
          )}

          {activeTab === 'data' && (
            <section className="animate-fade-in space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Cloud Sync (Dropbox)</h3>
                    <div className="space-y-4 bg-tertiary/20 p-4 rounded-lg border border-tertiary">
                        <p className="text-xs text-text-secondary opacity-70">
                            Sync your application data with your Dropbox account. Uses split files for reliability.
                        </p>
                        <div className="space-y-2 mb-4">
                            <div>
                                <label className={formLabelClass}>App Key</label>
                                <input 
                                    type="password"
                                    value={cloudSyncConfig.dropboxAppKey}
                                    onChange={e => setCloudSyncConfig(prev => ({ ...prev, dropboxAppKey: e.target.value }))}
                                    className={formInputClass}
                                    placeholder="Enter Dropbox App Key"
                                />
                            </div>
                            <div>
                                <label className={formLabelClass}>App Secret</label>
                                <input 
                                    type="password"
                                    value={cloudSyncConfig.dropboxAppSecret}
                                    onChange={e => setCloudSyncConfig(prev => ({ ...prev, dropboxAppSecret: e.target.value }))}
                                    className={formInputClass}
                                    placeholder="Enter Dropbox App Secret"
                                />
                            </div>
                            <div>
                                <label className={formLabelClass}>Refresh Token</label>
                                <input 
                                    type="password"
                                    value={cloudSyncConfig.dropboxRefreshToken}
                                    onChange={e => setCloudSyncConfig(prev => ({ ...prev, dropboxRefreshToken: e.target.value }))}
                                    className={formInputClass}
                                    placeholder="Enter Dropbox Refresh Token"
                                />
                            </div>
                        </div>
                        <ToggleSwitch
                            label="Sync Images"
                            description="Include images in the upload. Disabling saves bandwidth."
                            enabled={cloudSyncConfig.enableImageSync}
                            onChange={v => setCloudSyncConfig(prev => ({...prev, enableImageSync: v }))}
                            compact
                        />
                        <div className="flex flex-wrap gap-2">
                            <button onClick={handleUpload} disabled={syncStatus === 'syncing'} className="py-2 px-4 border border-accent text-accent rounded-md text-sm font-medium hover:bg-accent hover:text-primary transition-colors disabled:opacity-50 btn-boop">
                                {syncStatus === 'syncing' && syncMessage?.includes('Uploading') ? 'Uploading...' : 'Upload Now'}
                            </button>
                            <button onClick={handleDownload} disabled={syncStatus === 'syncing'} className="py-2 px-4 border border-accent text-accent rounded-md text-sm font-medium hover:bg-accent hover:text-primary transition-colors disabled:opacity-50 btn-boop">
                                {syncStatus === 'syncing' && syncMessage?.includes('Downloading') ? 'Downloading...' : 'Download & Merge Now'}
                            </button>
                        </div>
                        <div>
                            {syncStatus === 'syncing' && (
                                <div className="w-full bg-tertiary rounded-full h-4 mt-2 overflow-hidden">
                                    <div 
                                        className="bg-accent h-full transition-all duration-300 ease-in-out" 
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            )}
                            {syncMessage && (
                                <p className={`text-xs mt-1 ${syncStatus === 'error' ? 'text-danger' : 'text-text-secondary'}`}>
                                    {syncMessage}
                                </p>
                            )}
                            {appSettings.lastSuccessfulSync && !syncMessage && (
                                <p className="text-xs text-text-secondary mt-1">Last successful sync: {new Date(appSettings.lastSuccessfulSync).toLocaleString()}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Local Data Management</h3>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-text-secondary">Manual Backup & Restore</label>
                            <div className="flex gap-2">
                                <button onClick={handleExportAllData} className="py-2 px-4 border border-text-secondary text-text-primary rounded-md text-sm font-medium hover:bg-tertiary transition-colors btn-boop">Export All Data</button>
                                <label className="py-2 px-4 border border-text-secondary text-text-primary rounded-md text-sm font-medium hover:bg-tertiary transition-colors cursor-pointer btn-boop">
                                    Import All Data
                                    <input type="file" className="hidden" accept=".json" onChange={handleImportAllData} multiple />
                                </label>
                            </div>
                            <p className="text-xs text-text-secondary opacity-70">Exports two files (_Data.json, _Images.json). You must select both to import.</p>
                        </div>
                        
                        <div className="pt-4 border-t border-tertiary/50">
                            <label className="text-sm font-medium text-text-secondary block mb-2">Maintenance</label>
                            <button 
                                onClick={onRunMigrations} 
                                className="py-2 px-4 border border-accent text-accent rounded-md text-sm font-medium hover:bg-accent hover:text-primary transition-colors btn-boop"
                            >
                                Run Pending Data Updates
                            </button>
                            <p className="text-xs text-text-secondary opacity-70 mt-1">Safe operation to apply latest app structure changes to your data.</p>
                        </div>
                    </div>
                </div>
            </section>
          )}

          {activeTab === 'prompts' && (
            <section className="animate-fade-in h-full flex flex-col">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Roleplay System Prompt</h3>
              <p className="text-xs text-text-secondary opacity-70 mb-2">Core instructions sent to the AI when roleplaying. Use {'{{user}}'} and {'{{char}}'} as placeholders.</p>
              <textarea
                id="roleplaySystemPrompt"
                value={roleplaySystemPrompt?.prompt ?? ''}
                onChange={(e) => {
                  const newPrompts = instructionalPrompts.map(p =>
                    p.id === 'roleplay-instructions' ? { ...p, prompt: e.target.value } : p
                  );
                  setInstructionalPrompts(newPrompts);
                }}
                className={`${formInputClass} flex-grow min-h-[300px] resize-y font-mono text-sm`}
              />
            </section>
          )}
        </div>
        
        <div className="flex-shrink-0 mt-6 pt-4 border-t border-tertiary flex justify-between items-center gap-4">
            <button onClick={onLogout} className="py-2 px-4 border border-danger text-danger rounded-md text-sm font-medium hover:bg-danger hover:text-white transition-colors btn-boop">
                Log Out
            </button>
            <div className="flex gap-3">
                <button onClick={onClose} className="py-2 px-4 border border-text-secondary rounded-md text-sm font-medium text-text-primary hover:bg-tertiary btn-boop">
                    Cancel
                </button>
                <button onClick={handleSave} className="py-2 px-6 border border-transparent rounded-md text-sm font-medium text-primary bg-accent hover:bg-accent-hover btn-boop shadow-lg shadow-accent/20">
                    Save Changes
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;