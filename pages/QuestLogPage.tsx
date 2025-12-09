
import React, { useState } from 'react';
import type { RpgGameState } from '../types';
import { BookOpenIcon, CheckIcon, XIcon, SearchIcon } from '../components/icons';

interface QuestLogPageProps {
    gameState: RpgGameState;
}

const QuestLogPage: React.FC<QuestLogPageProps> = ({ gameState }) => {
    const [filter, setFilter] = useState<'active' | 'completed' | 'failed'>('active');
    const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);

    const quests = gameState.quests.filter(q => q.status === filter);
    const selectedQuest = gameState.quests.find(q => q.id === selectedQuestId) || quests[0];

    return (
        <div className="h-full flex flex-col md:flex-row bg-primary overflow-hidden">
            {/* Sidebar */}
            <div className="w-full md:w-1/3 border-r border-tertiary flex flex-col">
                <header className="p-6 border-b border-tertiary bg-secondary">
                    <h1 className="text-2xl font-bold text-accent flex items-center gap-2">
                        <BookOpenIcon className="w-6 h-6" /> Quest Log
                    </h1>
                    <div className="flex mt-4 bg-tertiary rounded-lg p-1">
                        {(['active', 'completed', 'failed'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition-colors ${filter === status ? 'bg-accent text-primary shadow' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </header>
                <div className="flex-grow overflow-y-auto p-2 space-y-2">
                    {quests.length === 0 ? (
                        <p className="text-center text-text-secondary py-8 italic">No {filter} quests.</p>
                    ) : (
                        quests.map(quest => (
                            <div 
                                key={quest.id}
                                onClick={() => setSelectedQuestId(quest.id)}
                                className={`p-4 rounded-lg cursor-pointer transition-colors border ${selectedQuest?.id === quest.id ? 'bg-accent/10 border-accent' : 'bg-tertiary/30 border-transparent hover:bg-tertiary/50'}`}
                            >
                                <h3 className="font-bold text-text-primary">{quest.title}</h3>
                                <p className="text-xs text-text-secondary mt-1 line-clamp-2">{quest.description}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-secondary/50 p-6 md:p-10 overflow-y-auto">
                {selectedQuest ? (
                    <div className="max-w-2xl mx-auto animate-fade-in-slide">
                        <div className="mb-6">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase mb-2 ${
                                selectedQuest.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                                selectedQuest.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                'bg-red-500/20 text-red-400'
                            }`}>
                                {selectedQuest.status}
                            </span>
                            <h2 className="text-3xl font-bold text-text-primary mb-4">{selectedQuest.title}</h2>
                            <p className="text-lg text-text-secondary leading-relaxed">{selectedQuest.description}</p>
                        </div>

                        <div className="space-y-6">
                            <section className="bg-tertiary/30 p-6 rounded-xl border border-white/5">
                                <h3 className="text-sm font-bold text-accent uppercase tracking-wider mb-4">Objectives</h3>
                                <ul className="space-y-3">
                                    {selectedQuest.objectives.map((obj, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${obj ? 'bg-green-500 border-green-500' : 'border-text-secondary'}`}>
                                                {/* In a real app, `obj` would be an object with a `completed` flag. 
                                                    Currently strings are used in RpgQuest interface for simplicity in earlier phase.
                                                    Assuming text display for now. */}
                                                <div className="w-2 h-2 bg-transparent" /> 
                                            </div>
                                            <span className="text-text-primary">{obj}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-text-secondary">
                        <p>Select a quest to view details.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestLogPage;
