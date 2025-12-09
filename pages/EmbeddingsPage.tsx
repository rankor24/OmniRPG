
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as embeddingService from '../services/embeddingService';
import type { Memory, Character, Lorebook, StylePreference, LorebookEntry } from '../types';
import { WrenchScrewdriverIcon, NetworkIcon } from '../components/icons';
import MemoryGraph from '../components/MemoryGraph';
import { get, set } from 'idb-keyval';


const TabButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ isActive, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold transition-colors ${
        isActive
            ? 'border-b-2 border-accent text-accent'
            : 'text-text-secondary hover:text-text-primary'
        }`}
    >
        {children}
    </button>
);


const DataSummary: React.FC<{ title: string; total: number; embedded: number }> = ({ title, total, embedded }) => {
    const percentage = total > 0 ? (embedded / total) * 100 : 0;
    return (
        <div className="bg-tertiary p-4 rounded-lg">
            <h3 className="font-semibold text-text-primary">{title}</h3>
            <p className="text-sm text-text-secondary mt-1">{embedded} of {total} items embedded</p>
            <div className="w-full bg-primary rounded-full h-2.5 mt-2">
                <div 
                    className="bg-accent h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const EmbeddingSection: React.FC<{ title: string, onGenerate: () => void, isEmbedding: boolean, progress: {current: number, total: number}, message: string | null, modelReady: boolean }> = ({ title, onGenerate, isEmbedding, progress, message, modelReady }) => (
    <CollapsibleSection title={title} open={true}>
        <p className="text-sm text-text-secondary">Generate vector embeddings for all items of this type. This allows for semantic search and better contextual retrieval by the AI.</p>
        {isEmbedding ? (
            <div className="mt-2">
                <p className="text-sm text-text-secondary mb-1">Processing: {progress.current} / {progress.total}</p>
                <div className="w-full bg-tertiary rounded-full h-2.5">
                    <div 
                        className="bg-accent h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${(progress.total > 0 ? (progress.current / progress.total) * 100 : 0)}%` }}
                    ></div>
                </div>
            </div>
        ) : (
            <button 
                onClick={onGenerate}
                disabled={!modelReady || isEmbedding}
                className="mt-2 py-2 px-4 rounded-md text-sm font-medium text-primary bg-accent hover:bg-accent-hover disabled:bg-secondary disabled:text-text-secondary disabled:cursor-not-allowed btn-boop"
            >
                Generate Embeddings
            </button>
        )}
        {message && (
            <p className={`text-sm mt-2 ${message.startsWith('Error:') ? 'text-danger' : 'text-green-400'}`}>
                {message}
            </p>
        )}
    </CollapsibleSection>
);

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode, open?: boolean }> = ({ title, children, open }) => (
    <details className='bg-secondary rounded-lg border border-tertiary open:border-accent' open={open}>
      <summary className="p-3 cursor-pointer font-semibold text-text-primary list-none flex justify-between items-center hover:bg-tertiary/50">
        {title}
        <span className="text-accent transform transition-transform duration-200 detail-arrow">▼</span>
      </summary>
      <div className="p-3 border-t border-tertiary space-y-2">
        {children}
      </div>
    </details>
);

const MaintenanceView: React.FC<{
    summaryStats: any;
    embeddingStatus: embeddingService.Status;
    embeddingError: string | null;
    handleInitializeEmbedding: () => void;
    handleGenerateAll: () => void;
    isGeneratingAll: boolean;
    generateAllMessage: string | null;
    isAnyEmbedding: boolean;
    handleGenerateMemoryEmbeddings: () => void;
    isMemEmbedding: boolean;
    memEmbeddingProgress: { current: number; total: number };
    memEmbeddingMessage: string | null;
    handleGenerateCharacterEmbeddings: () => void;
    isCharEmbedding: boolean;
    charEmbeddingProgress: { current: number; total: number };
    charEmbeddingMessage: string | null;
    handleGenerateLorebookEmbeddings: () => void;
    isLoreEmbedding: boolean;
    loreEmbeddingProgress: { current: number; total: number };
    loreEmbeddingMessage: string | null;
    handleGenerateStyleEmbeddings: () => void;
    isStyleEmbedding: boolean;
    styleEmbeddingProgress: { current: number; total: number };
    styleEmbeddingMessage: string | null;
}> = (props) => {
    const {
        summaryStats, embeddingStatus, embeddingError, handleInitializeEmbedding,
        handleGenerateAll, isGeneratingAll, generateAllMessage, isAnyEmbedding,
        handleGenerateMemoryEmbeddings,
        isMemEmbedding,
        memEmbeddingProgress,
        memEmbeddingMessage,
        handleGenerateCharacterEmbeddings,
        isCharEmbedding,
        charEmbeddingProgress,
        charEmbeddingMessage,
        handleGenerateLorebookEmbeddings,
        isLoreEmbedding,
        loreEmbeddingProgress,
        loreEmbeddingMessage,
        handleGenerateStyleEmbeddings,
        isStyleEmbedding,
        styleEmbeddingProgress,
        styleEmbeddingMessage,
    } = props;

    return (
        <div className="space-y-6">
            <CollapsibleSection title="Model Management" open={true}>
                <div className="p-2 bg-tertiary rounded-md">
                    <p className="text-sm font-semibold text-text-primary">On-Device Embedding Model</p>
                    <p className="text-xs text-text-secondary mt-1">
                        Status: <span className={`font-bold ${
                            embeddingStatus === 'ready' ? 'text-green-400' :
                            embeddingStatus === 'loading' ? 'text-yellow-400' :
                            embeddingStatus === 'error' ? 'text-danger' :
                            'text-text-secondary'
                        }`}>{embeddingStatus}</span>
                    </p>
                    {embeddingStatus === 'uninitialized' && (
                        <button onClick={handleInitializeEmbedding} className="mt-2 py-2 px-4 rounded-md text-sm font-medium text-primary bg-accent hover:bg-accent-hover btn-boop">
                            Download & Initialize (~20MB)
                        </button>
                    )}
                    {embeddingStatus === 'loading' && <p className="text-xs text-yellow-400 mt-1">Model is loading...</p>}
                    {embeddingError && <p className="text-xs text-danger mt-1">Error: {embeddingError}</p>}
                </div>
            </CollapsibleSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DataSummary title="Memories" total={summaryStats.memories.total} embedded={summaryStats.memories.embedded} />
                <DataSummary title="Characters" total={summaryStats.characters.total} embedded={summaryStats.characters.embedded} />
                <DataSummary title="Lorebook Entries" total={summaryStats.lorebooks.total} embedded={summaryStats.lorebooks.embedded} />
                <DataSummary title="Style Preferences" total={summaryStats.styles.total} embedded={summaryStats.styles.embedded} />
            </div>

            <CollapsibleSection title="Batch Operations" open={true}>
                <p className="text-sm text-text-secondary">Run embedding generation for all data types in sequence.</p>
                {isGeneratingAll ? (
                    <div className="mt-2">
                        <p className="text-sm text-text-secondary mb-1">{generateAllMessage || 'Processing...'}</p>
                        <div className="w-full bg-tertiary rounded-full h-2.5 mt-2 overflow-hidden relative">
                            <div className="absolute inset-0 bg-accent animate-pulse"></div>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={handleGenerateAll}
                        disabled={embeddingStatus !== 'ready' || isAnyEmbedding}
                        className="mt-2 py-2 px-4 rounded-md text-sm font-medium text-primary bg-accent hover:bg-accent-hover disabled:bg-secondary disabled:text-text-secondary disabled:cursor-not-allowed btn-boop"
                    >
                        Generate All Embeddings
                    </button>
                )}
                {generateAllMessage && !isGeneratingAll && (
                    <p className={`text-sm mt-2 ${generateAllMessage.startsWith('Error:') ? 'text-danger' : 'text-green-400'}`}>
                        {generateAllMessage}
                    </p>
                )}
            </CollapsibleSection>

            <EmbeddingSection 
                title="Memory Embeddings"
                onGenerate={handleGenerateMemoryEmbeddings}
                isEmbedding={isMemEmbedding}
                progress={memEmbeddingProgress}
                message={memEmbeddingMessage}
                modelReady={embeddingStatus === 'ready'}
            />
            <EmbeddingSection 
                title="Character Embeddings"
                onGenerate={handleGenerateCharacterEmbeddings}
                isEmbedding={isCharEmbedding}
                progress={charEmbeddingProgress}
                message={charEmbeddingMessage}
                modelReady={embeddingStatus === 'ready'}
            />
            <EmbeddingSection 
                title="Lorebook Entry Embeddings"
                onGenerate={handleGenerateLorebookEmbeddings}
                isEmbedding={isLoreEmbedding}
                progress={loreEmbeddingProgress}
                message={loreEmbeddingMessage}
                modelReady={embeddingStatus === 'ready'}
            />
             <EmbeddingSection 
                title="Style Preference Embeddings"
                onGenerate={handleGenerateStyleEmbeddings}
                isEmbedding={isStyleEmbedding}
                progress={styleEmbeddingProgress}
                message={styleEmbeddingMessage}
                modelReady={embeddingStatus === 'ready'}
            />
        </div>
    );
};

interface EmbeddingsPageProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  lorebooks: Lorebook[];
  setLorebooks: React.Dispatch<React.SetStateAction<Lorebook[]>>;
  stylePreferences: StylePreference[];
  setStylePreferences: React.Dispatch<React.SetStateAction<StylePreference[]>>;
  allMemories: Memory[];
  setAllMemories: React.Dispatch<React.SetStateAction<Memory[]>>;
}

const EmbeddingsPage: React.FC<EmbeddingsPageProps> = ({
  characters, setCharacters,
  lorebooks, setLorebooks,
  stylePreferences, setStylePreferences,
  allMemories, setAllMemories
}) => {
    const [activeTab, setActiveTab] = useState<'graph' | 'maintenance'>('graph');

    // Embedding model state
    const [embeddingStatus, setEmbeddingStatus] = useState<embeddingService.Status>(embeddingService.getEmbeddingStatus());
    const [embeddingError, setEmbeddingError] = useState<string | null>(embeddingService.getEmbeddingError());
    
    // State for "Generate All"
    const [isGeneratingAll, setIsGeneratingAll] = useState(false);
    const [generateAllMessage, setGenerateAllMessage] = useState<string | null>(null);

    // State for memory embedding
    const [isMemEmbedding, setIsMemEmbedding] = useState(false);
    const [memEmbeddingProgress, setMemEmbeddingProgress] = useState({ current: 0, total: 0 });
    const [memEmbeddingMessage, setMemEmbeddingMessage] = useState<string | null>(null);

    // State for character embedding
    const [isCharEmbedding, setIsCharEmbedding] = useState(false);
    const [charEmbeddingProgress, setCharEmbeddingProgress] = useState({ current: 0, total: 0 });
    const [charEmbeddingMessage, setCharEmbeddingMessage] = useState<string | null>(null);

    // State for lorebook embedding
    const [isLoreEmbedding, setIsLoreEmbedding] = useState(false);
    const [loreEmbeddingProgress, setLoreEmbeddingProgress] = useState({ current: 0, total: 0 });
    const [loreEmbeddingMessage, setLoreEmbeddingMessage] = useState<string | null>(null);

    // State for style embedding
    const [isStyleEmbedding, setIsStyleEmbedding] = useState(false);
    const [styleEmbeddingProgress, setStyleEmbeddingProgress] = useState({ current: 0, total: 0 });
    const [styleEmbeddingMessage, setStyleEmbeddingMessage] = useState<string | null>(null);

    const isAnyEmbedding = isMemEmbedding || isCharEmbedding || isLoreEmbedding || isStyleEmbedding || isGeneratingAll;


    const handleInitializeEmbedding = useCallback(async () => {
        setEmbeddingStatus('loading');
        setEmbeddingError(null);
        try {
            await embeddingService.initialize();
            setEmbeddingStatus('ready');
        } catch (err) {
            setEmbeddingStatus('error');
            setEmbeddingError(err instanceof Error ? err.message : 'Unknown error');
        }
    }, []);

    const generateEmbeddings = useCallback(async <T extends { id: string; summary?: string; embedding?: number[]; [key: string]: any }>(
        items: T[], 
        contentKey: keyof T, 
        updateFunc: (items: T[]) => void,
        setIsEmbedding: (is: boolean) => void,
        setProgress: React.Dispatch<React.SetStateAction<{ current: number; total: number }>>,
        setMessage: (m: string | null) => void,
        itemType: string
    ) => {
        setIsEmbedding(true);
        setMessage(null);
        const itemsToProcess = items.filter(item => !item.embedding || item.embedding.length === 0);
        const totalToProcess = itemsToProcess.length;

        if (totalToProcess === 0) {
            setMessage(`All ${itemType} items are already embedded.`);
            setIsEmbedding(false);
            return;
        }

        setProgress({ current: 0, total: totalToProcess });
    
        const CHUNK_SIZE = 10;
        const newItems = [...items];

        try {
            for (let i = 0; i < totalToProcess; i += CHUNK_SIZE) {
                const chunk = itemsToProcess.slice(i, i + CHUNK_SIZE);
                for (const item of chunk) {
                    const content = String(item[contentKey] || item['content'] || item['name']); // Fallback content keys
                    if (content) {
                        const newEmbedding = await embeddingService.embedText(content);
                        const originalItemIndex = newItems.findIndex(pi => pi.id === item.id);
                        if(originalItemIndex > -1) {
                            newItems[originalItemIndex].embedding = newEmbedding;
                        }
                    }
                    setProgress(prev => ({ ...prev, current: prev.current + 1 }));
                }
            }
            
            updateFunc(newItems);
            setMessage(`Successfully generated embeddings for ${totalToProcess} ${itemType} items.`);
        } catch (err) {
            const errorMsg = `Error embedding ${itemType}: ${err instanceof Error ? err.message : 'Unknown error'}`;
            console.error(errorMsg);
            setMessage(errorMsg);
            throw err; // Re-throw for sequential runner to catch
        } finally {
            setIsEmbedding(false);
        }
    }, []);
    
    // Specific handlers for each data type
    const handleGenerateMemoryEmbeddings = useCallback(async () => {
        setIsMemEmbedding(true);
        setMemEmbeddingMessage(null);
        const itemsToProcess = allMemories.filter(item => !item.embedding || item.embedding.length === 0);
        const totalToProcess = itemsToProcess.length;
    
        if (totalToProcess === 0) {
            setMemEmbeddingMessage(`All memory items are already embedded.`);
            setIsMemEmbedding(false);
            return;
        }
    
        setMemEmbeddingProgress({ current: 0, total: totalToProcess });
    
        const groupedBySource = itemsToProcess.reduce((acc, mem) => {
            let key = '';
            if (mem.scope === 'global') key = 'global_memories';
            else if (mem.scope === 'character' && mem.characterId) key = `memories_character_${mem.characterId}`;
            else if (mem.scope === 'conversation' && mem.conversationId) key = `memories_conversation_${mem.conversationId}`;
            
            if (key) {
                if (!acc[key]) acc[key] = [];
                acc[key].push(mem);
            }
            return acc;
        }, {} as Record<string, Memory[]>);
    
        const newlyEmbeddedMemories: Memory[] = [];
    
        try {
            for (const key of Object.keys(groupedBySource)) {
                const memoriesToEmbed = groupedBySource[key];
                const originalMemories = await get<Memory[]>(key) || [];
                const originalMap = new Map(originalMemories.map(m => [m.id, m]));
    
                for (const mem of memoriesToEmbed) {
                    const content = String(mem.content);
                    if (content) {
                        const newEmbedding = await embeddingService.embedText(content);
                        const updatedMem = { ...mem, embedding: newEmbedding };
                        originalMap.set(mem.id, updatedMem);
                        newlyEmbeddedMemories.push(updatedMem);
                    }
                    setMemEmbeddingProgress(prev => ({ ...prev, current: prev.current + 1 }));
                }
                await set(key, Array.from(originalMap.values()));
            }
    
            setAllMemories(prev => {
                const updatedMap = new Map(prev.map(m => [m.id, m]));
                newlyEmbeddedMemories.forEach(mem => updatedMap.set(mem.id, mem));
                return Array.from(updatedMap.values());
            });
    
            setMemEmbeddingMessage(`Successfully generated embeddings for ${totalToProcess} memory items.`);
        } catch (err) {
            const errorMsg = `Error embedding memories: ${err instanceof Error ? err.message : 'Unknown error'}`;
            console.error(errorMsg);
            setMemEmbeddingMessage(errorMsg);
            throw err;
        } finally {
            setIsMemEmbedding(false);
        }
    }, [allMemories, setAllMemories]);
    
    const handleGenerateCharacterEmbeddings = useCallback(async () => {
        await generateEmbeddings(
            characters.filter(c => c.id !== 'omni-ai'),
            'personality',
            (updatedChars) => setCharacters(prev => [...prev.filter(c => c.id === 'omni-ai'), ...updatedChars]),
            setIsCharEmbedding,
            setCharEmbeddingProgress,
            setCharEmbeddingMessage,
            'character'
        );
    }, [characters, setCharacters, generateEmbeddings]);

    const handleGenerateLorebookEmbeddings = useCallback(async () => {
        const allEntries: (LorebookEntry & { lorebookId: string })[] = lorebooks.flatMap(lb => lb.entries.map(e => ({ ...e, lorebookId: lb.id })));
        
        setIsLoreEmbedding(true);
        setLoreEmbeddingMessage(null);
        let processedCount = 0;
        const itemsToProcess = allEntries.filter(item => !item.embedding || item.embedding.length === 0);
        const totalToProcess = itemsToProcess.length;

        if (totalToProcess === 0) {
            setLoreEmbeddingMessage(`All lorebook entries are already embedded.`);
            setIsLoreEmbedding(false);
            return;
        }

        setLoreEmbeddingProgress({ current: 0, total: totalToProcess });

        try {
            let updatedLorebooks = JSON.parse(JSON.stringify(lorebooks));
            const CHUNK_SIZE = 10;
            for (let i = 0; i < totalToProcess; i += CHUNK_SIZE) {
                const chunk = itemsToProcess.slice(i, i + CHUNK_SIZE);

                for (const entry of chunk) {
                    const content = String(entry.content);
                    if (content) {
                        entry.embedding = await embeddingService.embedText(content);
                    }
                    processedCount++;
                    setLoreEmbeddingProgress({ current: processedCount, total: totalToProcess });
                }

                chunk.forEach(updatedEntry => {
                    const lbIndex = updatedLorebooks.findIndex((lb: Lorebook) => lb.id === updatedEntry.lorebookId);
                    if (lbIndex !== -1) {
                        const entryIndex = updatedLorebooks[lbIndex].entries.findIndex((e: LorebookEntry) => e.id === updatedEntry.id);
                        if (entryIndex !== -1) {
                            updatedLorebooks[lbIndex].entries[entryIndex].embedding = updatedEntry.embedding;
                        }
                    }
                });
            }
            setLorebooks(updatedLorebooks);
            setLoreEmbeddingMessage(`Successfully generated embeddings for ${totalToProcess} lorebook entries.`);
        } catch (err) {
            const errorMsg = `Error embedding lorebook entries: ${err instanceof Error ? err.message : 'Unknown error'}`;
            console.error(errorMsg);
            setLoreEmbeddingMessage(errorMsg);
            throw err;
        } finally {
            setIsLoreEmbedding(false);
        }
    }, [lorebooks, setLorebooks]);

    const handleGenerateStyleEmbeddings = useCallback(async () => {
        await generateEmbeddings(
            stylePreferences,
            'content',
            setStylePreferences,
            setIsStyleEmbedding,
            setStyleEmbeddingProgress,
            setStyleEmbeddingMessage,
            'style preference'
        );
    }, [stylePreferences, setStylePreferences, generateEmbeddings]);

    const handleGenerateAll = useCallback(async () => {
        if (embeddingStatus !== 'ready') {
            alert("Please initialize the embedding model first.");
            return;
        }
        if (isAnyEmbedding) {
            alert("An embedding process is already running.");
            return;
        }
        if (!window.confirm("This will generate embeddings for all data types sequentially. This may take several minutes. Continue?")) {
            return;
        }
    
        setIsGeneratingAll(true);
        setGenerateAllMessage('Starting sequential embedding process...');
    
        try {
            setGenerateAllMessage('Generating memory embeddings...');
            await handleGenerateMemoryEmbeddings();
            
            setGenerateAllMessage('Generating character embeddings...');
            await handleGenerateCharacterEmbeddings();
            
            setGenerateAllMessage('Generating lorebook entry embeddings...');
            await handleGenerateLorebookEmbeddings();
    
            setGenerateAllMessage('Generating style preference embeddings...');
            await handleGenerateStyleEmbeddings();
            
            setGenerateAllMessage('All embeddings generated successfully!');
        } catch (error) {
            const errorMsg = `An error occurred during the 'Generate All' process: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(errorMsg);
            setGenerateAllMessage(errorMsg);
        } finally {
            setTimeout(() => {
                setIsGeneratingAll(false);
                setGenerateAllMessage(null);
            }, 5000);
        }
    }, [embeddingStatus, isAnyEmbedding, handleGenerateMemoryEmbeddings, handleGenerateCharacterEmbeddings, handleGenerateLorebookEmbeddings, handleGenerateStyleEmbeddings]);

    const summaryStats = useMemo(() => {
        const countEmbedded = (items: any[]) => items.filter(item => item.embedding && item.embedding.length > 0).length;
        const countLorebookEntries = (lbs: Lorebook[]) => lbs.reduce((acc, lb) => acc + lb.entries.length, 0);
        const countEmbeddedLorebookEntries = (lbs: Lorebook[]) => lbs.reduce((acc, lb) => acc + lb.entries.filter(e => e.embedding && e.embedding.length > 0).length, 0);

        return {
            memories: { total: allMemories.length, embedded: countEmbedded(allMemories) },
            characters: { total: characters.filter(c => c.id !== 'omni-ai').length, embedded: countEmbedded(characters) },
            lorebooks: { total: countLorebookEntries(lorebooks), embedded: countEmbeddedLorebookEntries(lorebooks) },
            styles: { total: stylePreferences.length, embedded: countEmbedded(stylePreferences) }
        };
    }, [allMemories, characters, lorebooks, stylePreferences]);
    
    const [similarityThreshold, setSimilarityThreshold] = useState(0.75);
    const [repelForce, setRepelForce] = useState(-50);
    const [linkDistance, setLinkDistance] = useState(30);

    return (
        <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-text-primary mb-2">Embedding Space</h1>
                <p className="text-text-secondary">Visualize the semantic relationships between all data points in OmniAI's memory, and manage the embedding generation process.</p>
            </header>

            <div className="mb-8 border-b border-tertiary flex">
                <TabButton isActive={activeTab === 'graph'} onClick={() => setActiveTab('graph')}>
                    <NetworkIcon className="w-5 h-5"/>
                    Graph Visualization
                </TabButton>
                <TabButton isActive={activeTab === 'maintenance'} onClick={() => setActiveTab('maintenance')}>
                    <WrenchScrewdriverIcon className="w-5 h-5"/>
                    Maintenance & Generation
                </TabButton>
            </div>

            <div className="animate-fade-in">
                {activeTab === 'graph' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-secondary rounded-lg border border-tertiary">
                                <label htmlFor="similarity-threshold" className="block text-sm font-medium text-text-secondary mb-2">
                                    Similarity Threshold: <span className="font-bold text-accent">{similarityThreshold.toFixed(2)}</span>
                                </label>
                                <input
                                    id="similarity-threshold"
                                    type="range"
                                    min="0.5"
                                    max="1.0"
                                    step="0.01"
                                    value={similarityThreshold}
                                    onChange={e => setSimilarityThreshold(Number(e.target.value))}
                                    className="w-full h-2 bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent"
                                />
                                <p className="text-xs text-text-secondary opacity-70 mt-1">Minimum similarity to draw a link.</p>
                            </div>
                             <div className="p-4 bg-secondary rounded-lg border border-tertiary">
                                <label htmlFor="repel-force" className="block text-sm font-medium text-text-secondary mb-2">
                                    Repulsion Force: <span className="font-bold text-accent">{repelForce}</span>
                                </label>
                                <input
                                    id="repel-force"
                                    type="range"
                                    min="-200"
                                    max="-1"
                                    step="1"
                                    value={repelForce}
                                    onChange={e => setRepelForce(Number(e.target.value))}
                                    className="w-full h-2 bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent"
                                />
                                <p className="text-xs text-text-secondary opacity-70 mt-1">How much nodes push each other away.</p>
                            </div>
                             <div className="p-4 bg-secondary rounded-lg border border-tertiary">
                                <label htmlFor="link-distance" className="block text-sm font-medium text-text-secondary mb-2">
                                    Link Distance: <span className="font-bold text-accent">{linkDistance}</span>
                                </label>
                                <input
                                    id="link-distance"
                                    type="range"
                                    min="1"
                                    max="100"
                                    step="1"
                                    value={linkDistance}
                                    onChange={e => setLinkDistance(Number(e.target.value))}
                                    className="w-full h-2 bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent"
                                />
                                <p className="text-xs text-text-secondary opacity-70 mt-1">The target distance between linked nodes.</p>
                            </div>
                        </div>
                        <MemoryGraph
                            memories={allMemories}
                            lorebooks={lorebooks}
                            characters={characters}
                            stylePreferences={stylePreferences}
                            similarityThreshold={similarityThreshold}
                            repelForce={repelForce}
                            linkDistance={linkDistance}
                        />
                    </div>
                )}
                {activeTab === 'maintenance' && (
                   <MaintenanceView
                        summaryStats={summaryStats}
                        embeddingStatus={embeddingStatus}
                        embeddingError={embeddingError}
                        handleInitializeEmbedding={handleInitializeEmbedding}
                        handleGenerateAll={handleGenerateAll}
                        isGeneratingAll={isGeneratingAll}
                        generateAllMessage={generateAllMessage}
                        isAnyEmbedding={isAnyEmbedding}
                        handleGenerateMemoryEmbeddings={handleGenerateMemoryEmbeddings}
                        isMemEmbedding={isMemEmbedding}
                        memEmbeddingProgress={memEmbeddingProgress}
                        memEmbeddingMessage={memEmbeddingMessage}

                        handleGenerateCharacterEmbeddings={handleGenerateCharacterEmbeddings}
                        isCharEmbedding={isCharEmbedding}
                        charEmbeddingProgress={charEmbeddingProgress}
                        charEmbeddingMessage={charEmbeddingMessage}

                        handleGenerateLorebookEmbeddings={handleGenerateLorebookEmbeddings}
                        isLoreEmbedding={isLoreEmbedding}
                        loreEmbeddingProgress={loreEmbeddingProgress}
                        loreEmbeddingMessage={loreEmbeddingMessage}

                        handleGenerateStyleEmbeddings={handleGenerateStyleEmbeddings}
                        isStyleEmbedding={isStyleEmbedding}
                        styleEmbeddingProgress={styleEmbeddingProgress}
                        styleEmbeddingMessage={styleEmbeddingMessage}
                   />
                )}
            </div>
        </div>
    );
};

export default EmbeddingsPage;
