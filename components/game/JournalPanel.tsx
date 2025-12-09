
import React from 'react';
import type { RpgQuest } from '../../types';
import { CheckIcon } from '../icons';

interface JournalPanelProps {
    quests: RpgQuest[];
}

const JournalPanel: React.FC<JournalPanelProps> = ({ quests }) => {
    const activeQuests = quests.filter(q => q.status === 'active');
    const completedQuests = quests.filter(q => q.status === 'completed');

    return (
        <div className="h-full overflow-y-auto p-4 space-y-6">
            <section>
                <h3 className="text-sm font-bold text-accent uppercase tracking-wider mb-3">Active Quests</h3>
                {activeQuests.length === 0 ? (
                    <p className="text-text-secondary text-sm italic">No active quests.</p>
                ) : (
                    <div className="space-y-3">
                        {activeQuests.map(quest => (
                            <div key={quest.id} className="bg-tertiary/50 p-3 rounded-lg border-l-2 border-accent">
                                <h4 className="font-bold text-text-primary">{quest.title}</h4>
                                <p className="text-xs text-text-secondary mt-1">{quest.description}</p>
                                {quest.objectives.length > 0 && (
                                    <ul className="mt-2 space-y-1">
                                        {quest.objectives.map((obj, i) => (
                                            <li key={i} className="text-xs flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-text-secondary mt-1.5 flex-shrink-0" />
                                                <span className="text-text-primary">{obj}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {completedQuests.length > 0 && (
                <section>
                    <h3 className="text-sm font-bold text-green-500 uppercase tracking-wider mb-3">Completed</h3>
                    <div className="space-y-2 opacity-70">
                        {completedQuests.map(quest => (
                            <div key={quest.id} className="flex items-center gap-2 text-sm text-text-secondary">
                                <CheckIcon className="w-4 h-4 text-green-500" />
                                <span className="line-through">{quest.title}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default JournalPanel;
