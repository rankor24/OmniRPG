
import React from 'react';
import type { ChatSceneState, World } from '../../types';
import { GlobeIcon, UsersIcon } from '../icons';

interface WorldInfoPanelProps {
    sceneState: ChatSceneState | null;
    world: World;
}

const WorldInfoPanel: React.FC<WorldInfoPanelProps> = ({ sceneState, world }) => {
    if (!sceneState) return <div className="p-4 text-text-secondary">No scene data available.</div>;

    return (
        <div className="h-full overflow-y-auto p-4 space-y-6">
            <section>
                <h3 className="flex items-center gap-2 text-sm font-bold text-accent uppercase tracking-wider mb-3">
                    <GlobeIcon className="w-4 h-4" /> Current Location
                </h3>
                <div className="bg-tertiary/50 p-4 rounded-lg border border-tertiary">
                    <p className="text-lg font-serif font-bold text-text-primary mb-2">{sceneState.characterStatus.location}</p>
                    <p className="text-sm text-text-secondary italic">"{world.description}"</p>
                </div>
            </section>

            <section>
                <h3 className="flex items-center gap-2 text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">
                    <UsersIcon className="w-4 h-4" /> Scene Context
                </h3>
                <div className="space-y-3">
                    <div className="bg-tertiary/30 p-3 rounded">
                        <span className="block text-xs font-bold text-text-secondary mb-1">YOUR APPEARANCE</span>
                        <p className="text-sm text-text-primary">{sceneState.userStatus.appearance}</p>
                    </div>
                    <div className="bg-tertiary/30 p-3 rounded">
                        <span className="block text-xs font-bold text-text-secondary mb-1">CURRENT ACTION</span>
                        <p className="text-sm text-text-primary">{sceneState.userStatus.position}</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default WorldInfoPanel;
