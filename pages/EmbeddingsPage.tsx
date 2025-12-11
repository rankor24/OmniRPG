
import React, { useState, useEffect, useMemo } from 'react';
import * as embeddingService from '../services/embeddingService';
import type { Memory, Character, Lorebook, StylePreference } from '../types';
import { WrenchScrewdriverIcon, NetworkIcon } from '../components/icons';
import MemoryGraph from '../components/MemoryGraph';
import { set } from 'idb-keyval';

// Helper Components
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

// Maintenance View Component
const MaintenanceView: React.FC<any> = (props) => {
    const {
        summaryStats, embeddingStatus, embeddingError, handleInitializeEmbedding,
        handleGenerateAll, isGeneratingAll, generateAllMessage, 
        handleGenerateMemoryEmbeddings, isMemEmbedding, memEmbeddingProgress, memEmbeddingMessage,
        handleGenerateCharacterEmbeddings, isCharEmbedding, charEmbeddingProgress, charEmbeddingMessage,
        handleGenerateLorebookEmbeddings, isLoreEmbedding, loreEmbeddingProgress, loreEmbeddingMessage,
        handleGenerateStyleEmbeddings, isStyleEmbedding, styleEmbeddingProgress, styleEmbeddingMessage,
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
                        disabled={embeddingStatus !== 'ready'}
                        className="mt-2 py-2 px-4 rounded-md text-sm font-medium text-primary bg-accent hover:bg-accent-hover disabled:bg-secondary disabled:text-text-secondary disabled:cursor-not-allowed btn-boop"
                    >
                        Generate All Embeddings
                    </button>
                )}
            </CollapsibleSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EmbeddingSection 
                    title="Memories" 
                    onGenerate={handleGenerateMemoryEmbeddings} 
                    isEmbedding={isMemEmbedding} 
                    progress={memEmbeddingProgress} 
                    message={memEmbeddingMessage} 
                    modelReady={embeddingStatus === 'ready'}
                />
                <EmbeddingSection 
                    title="Characters" 
                    onGenerate={handleGenerateCharacterEmbeddings} 
                    isEmbedding={isCharEmbedding} 
                    progress={charEmbeddingProgress} 
                    message={charEmbeddingMessage} 
                    modelReady={embeddingStatus === 'ready'}
                />
                <EmbeddingSection 
                    title="Lorebook Entries" 
                    onGenerate={handleGenerateLorebookEmbeddings} 
                    isEmbedding={isLoreEmbedding} 
                    progress={loreEmbeddingProgress} 
                    message={loreEmbeddingMessage} 
                    modelReady={embeddingStatus === 'ready'}
                />
                <EmbeddingSection 
                    title="Style Preferences" 
                    onGenerate={handleGenerateStyleEmbeddings} 
                    isEmbedding={isStyleEmbedding} 
                    progress={styleEmbeddingProgress} 
                    message={styleEmbeddingMessage} 
                    modelReady={embeddingStatus === 'ready'}
                />
            </div>
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

const EmbeddingsPage: React.FC<EmbeddingsPageProps> = (props) => {
    const { 
        characters, setCharacters, 
        lorebooks, setLorebooks, 
        stylePreferences, setStylePreferences, 
        allMemories, setAllMemories 
    } = props;

    const [activeTab, setActiveTab] = useState<'maintenance' | 'graph'>('maintenance');
    const [embeddingStatus, setEmbeddingStatus] = useState<embeddingService.Status>(embeddingService.getEmbeddingStatus());
    const [embeddingError, setEmbeddingError] = useState<string | null>(embeddingService.getEmbeddingError());

    // Embedding Progress States
    const [isMemEmbedding, setIsMemEmbedding] = useState(false);
    const [memEmbeddingProgress, setMemEmbeddingProgress] = useState({ current: 0, total: 0 });
    const [memEmbeddingMessage, setMemEmbeddingMessage] = useState<string | null>(null);

    const [isCharEmbedding, setIsCharEmbedding] = useState(false);
    const [charEmbeddingProgress, setCharEmbeddingProgress] = useState({ current: 0, total: 0 });
    const [charEmbeddingMessage, setCharEmbeddingMessage] = useState<string | null>(null);

    const [isLoreEmbedding, setIsLoreEmbedding] = useState(false);
    const [loreEmbeddingProgress, setLoreEmbeddingProgress] = useState({ current: 0, total: 0 });
    const [loreEmbeddingMessage, setLoreEmbeddingMessage] = useState<string | null>(null);

    const [isStyleEmbedding, setIsStyleEmbedding] = useState(false);
    const [styleEmbeddingProgress, setStyleEmbeddingProgress] = useState({ current: 0, total: 0 });
    const [styleEmbeddingMessage, setStyleEmbeddingMessage] = useState<string | null>(null);

    const [isGeneratingAll, setIsGeneratingAll] = useState(false);
    const [generateAllMessage, setGenerateAllMessage] = useState<string | null>(null);

    // Initialize/Check Model
    useEffect(() => {
        const interval = setInterval(() => {
            setEmbeddingStatus(embeddingService.getEmbeddingStatus());
            setEmbeddingError(embeddingService.getEmbeddingError());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleInitializeEmbedding = async () => {
        try {
            await embeddingService.initialize();
        } catch (e) {
            console.error("Initialization failed", e);
        }
    };

    // --- Stats Calculation ---
    const summaryStats = useMemo(() => {
        const loreEntries = lorebooks.flatMap(lb => lb.entries);
        return {
            memories: { total: allMemories.length, embedded: allMemories.filter(m => m.embedding && m.embedding.length > 0).length },
            characters: { total: characters.length, embedded: characters.filter(c => c.embedding && c.embedding.length > 0).length },
            lorebooks: { total: loreEntries.length, embedded: loreEntries.filter(e => e.embedding && e.embedding.length > 0).length },
            styles: { total: stylePreferences.length, embedded: stylePreferences.filter(s => s.embedding && s.embedding.length > 0).length },
        };
    }, [allMemories, characters, lorebooks, stylePreferences]);

    // --- Generators ---

    const generateForItems = async <T extends { id: string, content?: string, embedding?: number[] }>(
        items: T[],
        updateFn: (items: T[]) => void,
        contentFn: (item: T) => string,
        progressFn: (current: number, total: number) => void,
        idbKey?: string
    ) => {
        const total = items.length;
        let current = 0;
        const newItems = [...items];
        
        for (let i = 0; i < total; i++) {
            const item = newItems[i];
            const text = contentFn(item);
            if (text && (!item.embedding || item.embedding.length === 0)) {
                try {
                    const embedding = await embeddingService.embedText(text);
                    newItems[i] = { ...item, embedding };
                } catch (e) {
                    console.error("Embedding generation error for item", item.id, e);
                }
            }
            current++;
            progressFn(current, total);
            // Batch update every 10 items or at the end
            if (current % 10 === 0 || current === total) {
                updateFn([...newItems]);
                await new Promise(resolve => setTimeout(resolve, 0)); // Yield to UI
            }
        }
        return newItems;
    };

    const handleGenerateMemoryEmbeddings = async () => {
        setIsMemEmbedding(true);
        setMemEmbeddingMessage("Generating memory embeddings...");
        try {
            await generateForItems(
                allMemories,
                setAllMemories,
                (m) => m.content,
                (c, t) => setMemEmbeddingProgress({ current: c, total: t })
            );
            // Save globals as a best effort
            const globalMems = allMemories.filter(m => m.scope === 'global');
            await set('global_memories', globalMems);
            setMemEmbeddingMessage("Completed!");
        } catch (e) {
            setMemEmbeddingMessage("Error generating embeddings.");
        } finally {
            setIsMemEmbedding(false);
        }
    };

    const handleGenerateCharacterEmbeddings = async () => {
        setIsCharEmbedding(true);
        setCharEmbeddingMessage("Generating character embeddings...");
        try {
            const updatedChars = await generateForItems(
                characters,
                setCharacters,
                (c) => `${c.name} ${c.tagline} ${c.core} ${c.personality}`,
                (c, t) => setCharEmbeddingProgress({ current: c, total: t })
            );
            await set('characters', updatedChars);
            setCharEmbeddingMessage("Completed!");
        } catch (e) {
            setCharEmbeddingMessage("Error generating embeddings.");
        } finally {
            setIsCharEmbedding(false);
        }
    };

    const handleGenerateLorebookEmbeddings = async () => {
        setIsLoreEmbedding(true);
        setLoreEmbeddingMessage("Generating lorebook embeddings...");
        try {
            const newLorebooks = [...lorebooks];
            let totalEntries = 0;
            newLorebooks.forEach(lb => totalEntries += lb.entries.length);
            let processed = 0;

            for (let i = 0; i < newLorebooks.length; i++) {
                const lb = newLorebooks[i];
                const newEntries = [...lb.entries];
                for (let j = 0; j < newEntries.length; j++) {
                    const entry = newEntries[j];
                    if (!entry.embedding || entry.embedding.length === 0) {
                        try {
                            const embedding = await embeddingService.embedText(`${entry.keywords.join(', ')} ${entry.content}`);
                            newEntries[j] = { ...entry, embedding };
                        } catch (e) { console.error(e); }
                    }
                    processed++;
                    setLoreEmbeddingProgress({ current: processed, total: totalEntries });
                    if (processed % 5 === 0) await new Promise(r => setTimeout(r, 0));
                }
                newLorebooks[i] = { ...lb, entries: newEntries };
                setLorebooks([...newLorebooks]); // Update state incrementally
            }
            await set('lorebooks', newLorebooks);
            setLoreEmbeddingMessage("Completed!");
        } catch (e) {
            setLoreEmbeddingMessage("Error generating embeddings.");
        } finally {
            setIsLoreEmbedding(false);
        }
    };

    const handleGenerateStyleEmbeddings = async () => {
        setIsStyleEmbedding(true);
        setStyleEmbeddingMessage("Generating style embeddings...");
        try {
            const updatedStyles = await generateForItems(
                stylePreferences,
                setStylePreferences,
                (s) => s.content,
                (c, t) => setStyleEmbeddingProgress({ current: c, total: t })
            );
            await set('style_preferences', updatedStyles);
            setStyleEmbeddingMessage("Completed!");
        } catch (e) {
            setStyleEmbeddingMessage("Error generating embeddings.");
        } finally {
            setIsStyleEmbedding(false);
        }
    };

    const handleGenerateAll = async () => {
        setIsGeneratingAll(true);
        setGenerateAllMessage("Starting batch generation...");
        try {
            await handleGenerateCharacterEmbeddings();
            await handleGenerateLorebookEmbeddings();
            await handleGenerateStyleEmbeddings();
            await handleGenerateMemoryEmbeddings();
            setGenerateAllMessage("Batch generation complete!");
        } catch (e) {
            setGenerateAllMessage("Batch generation finished with errors.");
        } finally {
            setIsGeneratingAll(false);
        }
    };

    return (
        <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-text-primary mb-2">Embeddings & Maintenance</h1>
                <p className="text-text-secondary">Manage vector embeddings for semantic search and visualize the knowledge graph.</p>
            </header>

            <div className="mb-6 border-b border-tertiary flex">
                <TabButton isActive={activeTab === 'maintenance'} onClick={() => setActiveTab('maintenance')}>
                    <WrenchScrewdriverIcon className="w-5 h-5" /> Maintenance
                </TabButton>
                <TabButton isActive={activeTab === 'graph'} onClick={() => setActiveTab('graph')}>
                    <NetworkIcon className="w-5 h-5" /> Knowledge Graph
                </TabButton>
            </div>

            {activeTab === 'maintenance' && (
                <MaintenanceView 
                    summaryStats={summaryStats}
                    embeddingStatus={embeddingStatus}
                    embeddingError={embeddingError}
                    handleInitializeEmbedding={handleInitializeEmbedding}
                    handleGenerateAll={handleGenerateAll}
                    isGeneratingAll={isGeneratingAll}
                    generateAllMessage={generateAllMessage}
                    isAnyEmbedding={isMemEmbedding || isCharEmbedding || isLoreEmbedding || isStyleEmbedding}
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

            {activeTab === 'graph' && (
                <div className="animate-fade-in">
                    <div className="mb-4 bg-secondary p-4 rounded-lg border border-tertiary">
                        <h3 className="text-lg font-semibold text-text-primary mb-2">Knowledge Graph Visualization</h3>
                        <p className="text-sm text-text-secondary">
                            Visualizing connections between memories, characters, and lore based on semantic similarity. 
                            Nodes closer together are more conceptually related.
                        </p>
                    </div>
                    <MemoryGraph 
                        memories={allMemories} 
                        lorebooks={lorebooks} 
                        characters={characters} 
                        stylePreferences={stylePreferences}
                        similarityThreshold={0.5}
                        repelForce={-100}
                        linkDistance={50}
                    />
                </div>
            )}
        </div>
    );
};

export default EmbeddingsPage;
