
import React, { useState } from 'react';
import type { RpgGameState, World, ChatSceneState } from '../../types';
import StatsPanel from './StatsPanel';
import InventoryPanel from './InventoryPanel';
import JournalPanel from './JournalPanel';
import WorldInfoPanel from './WorldInfoPanel';
import { PersonStandingIcon, BackpackIcon, BookOpenIcon, GlobeIcon } from '../icons';

interface GameDashboardProps {
    world: World;
    gameState: RpgGameState;
    sceneState: ChatSceneState | null;
}

type Tab = 'stats' | 'inventory' | 'journal' | 'world';

const GameDashboard: React.FC<GameDashboardProps> = ({ world, gameState, sceneState }) => {
    const [activeTab, setActiveTab] = useState<Tab>('stats');

    const TabButton = ({ id, icon, label }: { id: Tab, icon: React.ReactNode, label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-bold uppercase tracking-wider transition-colors
                ${activeTab === id ? 'text-accent bg-accent/10 border-b-2 border-accent' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary border-b-2 border-transparent'}
            `}
        >
            {icon}
            {label}
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-secondary/95 border-l border-white/10 backdrop-blur-md">
            {/* Tabs */}
            <div className="flex border-b border-white/10 flex-shrink-0">
                <TabButton id="stats" icon={<PersonStandingIcon className="w-5 h-5" />} label="Stats" />
                <TabButton id="inventory" icon={<BackpackIcon className="w-5 h-5" />} label="Items" />
                <TabButton id="journal" icon={<BookOpenIcon className="w-5 h-5" />} label="Quest" />
                <TabButton id="world" icon={<GlobeIcon className="w-5 h-5" />} label="World" />
            </div>

            {/* Content */}
            <div className="flex-grow overflow-hidden relative">
                {activeTab === 'stats' && <StatsPanel gameState={gameState} world={world} />}
                {activeTab === 'inventory' && <InventoryPanel items={gameState.inventory} />}
                {activeTab === 'journal' && <JournalPanel quests={gameState.quests} />}
                {activeTab === 'world' && <WorldInfoPanel sceneState={sceneState} world={world} />}
            </div>
        </div>
    );
};

export default GameDashboard;
