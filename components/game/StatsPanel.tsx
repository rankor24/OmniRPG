
import React from 'react';
import type { RpgGameState, World } from '../../types';
import { ShieldIcon, SwordIcon, HeartIcon, SparklesIcon, GemIcon } from '../icons';

interface StatsPanelProps {
    gameState: RpgGameState;
    world: World;
}

const StatBar: React.FC<{ label: string; current: number; max: number; color: string; icon: React.ReactNode }> = ({ label, current, max, color, icon }) => (
    <div className="mb-3">
        <div className="flex justify-between text-xs font-bold text-text-secondary mb-1">
            <div className="flex items-center gap-1.5">{icon} {label}</div>
            <span>{current} / {max}</span>
        </div>
        <div className="h-2 bg-black/50 rounded-full overflow-hidden">
            <div className="h-full transition-all duration-500" style={{ width: `${Math.min((current / max) * 100, 100)}%`, backgroundColor: color }} />
        </div>
    </div>
);

const StatsPanel: React.FC<StatsPanelProps> = ({ gameState, world }) => {
    const { player } = gameState;
    const primaryColor = world.theme.primaryColor;

    return (
        <div className="h-full overflow-y-auto p-4">
            {/* Vitals */}
            <div className="bg-tertiary/30 p-4 rounded-xl border border-white/5 mb-4">
                <StatBar label="Health" current={player.currentHp} max={player.maxHp} color="#ef4444" icon={<HeartIcon className="w-3 h-3"/>} />
                <StatBar label={world.genre === 'scifi' ? 'Energy' : 'Mana'} current={player.currentMp} max={player.maxMp} color="#3b82f6" icon={<SparklesIcon className="w-3 h-3"/>} />
                <StatBar label="Experience" current={player.xp} max={50} color="#eab308" icon={<GemIcon className="w-3 h-3"/>} />
            </div>

            {/* Attributes Grid */}
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Attributes</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-tertiary p-2 rounded text-center border border-white/5">
                    <div className="text-xs text-text-secondary">Level</div>
                    <div className="text-xl font-bold text-text-primary">{player.level}</div>
                </div>
                <div className="bg-tertiary p-2 rounded text-center border border-white/5">
                    <div className="text-xs text-text-secondary">Gold</div>
                    <div className="text-xl font-bold text-yellow-400">{gameState.gold}</div>
                </div>
                <div className="bg-tertiary p-2 rounded text-center border border-white/5">
                    <div className="text-xs text-text-secondary flex items-center justify-center gap-1"><SwordIcon className="w-3 h-3"/> ATK</div>
                    <div className="text-xl font-bold text-text-primary">{player.attackPower}</div>
                </div>
                <div className="bg-tertiary p-2 rounded text-center border border-white/5">
                    <div className="text-xs text-text-secondary flex items-center justify-center gap-1"><ShieldIcon className="w-3 h-3"/> DEF</div>
                    <div className="text-xl font-bold text-text-primary">{player.defensePower}</div>
                </div>
            </div>

            {/* Custom Attributes from World */}
            <div className="space-y-1">
                {world.mechanics.attributes.map(attr => (
                    <div key={attr} className="flex justify-between items-center text-sm p-2 bg-tertiary/20 rounded">
                        <span className="text-text-secondary">{attr}</span>
                        <span className="font-bold text-text-primary">{player.power}</span> {/* Placeholder mapping, real logic needs attr mapping */}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatsPanel;
