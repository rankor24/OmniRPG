
import React, { useState, useEffect, useRef } from 'react';
import type { RpgGameState, RpgNpc } from '../../types';
import { PersonStandingIcon, UsersIcon, SwordsIcon, BackpackIcon, ShirtIcon, SparklesIcon, GemIcon, SwordIcon, ShieldIcon, RefreshIcon } from '../icons';
import { triggerHaptic } from '../../services/haptics';

type HudTab = 'player' | 'party' | 'enemies';

interface RpgHudProps {
  gameState: RpgGameState | null;
  isGenerating?: boolean;
}

const CompactProgressRing: React.FC<{
  label: string;
  score: number;
  color: string;
  isLust?: boolean;
}> = ({ label, score, color, isLust }) => {
  const radius = 12; // smaller
  const stroke = 2;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const percentage = isLust ? score : (score + 100) / 2;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-start text-center w-8">
      <div className="relative">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle stroke="#21262D" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-out' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[9px] font-bold">{score}</span>
        </div>
      </div>
      <span className="text-[7px] uppercase font-semibold text-text-secondary mt-0.5">{label}</span>
    </div>
  );
};


const RpgHud: React.FC<RpgHudProps> = ({ gameState, isGenerating }) => {
  const [activeTab, setActiveTab] = useState<HudTab>('player');
  const prevStateRef = useRef<RpgGameState | null>(null);

  // Animation states
  const [levelUpAnim, setLevelUpAnim] = useState(false);
  const [damageAnim, setDamageAnim] = useState(false);
  const [deathAnim, setDeathAnim] = useState(false);
  const [statChanges, setStatChanges] = useState<{ hp: 'gain' | 'loss' | 'none', mp: 'gain' | 'loss' | 'none', xp: 'gain' | 'loss' | 'none' }>({ hp: 'none', mp: 'none', xp: 'none' });
  const [newItems, setNewItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (gameState && prevStateRef.current) {
      const prev = prevStateRef.current;
      const current = gameState;

      if (current.player.level > prev.player.level) {
        setLevelUpAnim(true);
        triggerHaptic('success');
        setTimeout(() => setLevelUpAnim(false), 1500);
      }
      if (current.player.currentHp < prev.player.currentHp) {
        setDamageAnim(true);
        triggerHaptic('heavy');
        setTimeout(() => setDamageAnim(false), 500);
      }
      if (current.player.currentHp <= 0 && prev.player.currentHp > 0) {
        setDeathAnim(true);
        triggerHaptic('failure');
      }

      const changes: { hp: 'gain' | 'loss' | 'none', mp: 'gain' | 'loss' | 'none', xp: 'gain' | 'loss' | 'none' } = {
        hp: current.player.currentHp > prev.player.currentHp ? 'gain' : current.player.currentHp < prev.player.currentHp ? 'loss' : 'none',
        mp: current.player.currentMp > prev.player.currentMp ? 'gain' : current.player.currentMp < prev.player.currentMp ? 'loss' : 'none',
        xp: (current.player.xp > prev.player.xp) || (current.player.level > prev.player.level) ? 'gain' : 'none',
      };
      setStatChanges(changes);
      setTimeout(() => setStatChanges({ hp: 'none', mp: 'none', xp: 'none' }), 800);

      const findNew = (currentList: any[] = [], prevList: any[] = []) => {
          const prevIds = new Set(prevList.map(i => i.id || i)); // handle string or obj
          return currentList.filter(item => !prevIds.has(item.id || item)).map(i => i.name || i);
      };
      const newlyFound = [
        ...findNew(current.equipment, prev.equipment),
        ...findNew(current.inventory, prev.inventory)
      ];
      if (newlyFound.length > 0) {
        setNewItems(new Set(newlyFound));
        setTimeout(() => setNewItems(new Set()), 1000);
      }
    }

    prevStateRef.current = gameState;
  }, [gameState]);


  if (!gameState) return null;
  
  const { player, party, enemies, equipment, inventory, skills, powers, gold } = gameState;

  const TabButton: React.FC<{ tab: HudTab; label: string; icon: React.ReactNode; count?: number }> = ({ tab, label, icon, count }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold transition-colors ${activeTab === tab ? 'bg-accent/20 text-accent' : 'text-text-secondary hover:bg-tertiary/50'}`}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && <span className="text-accent font-mono">{count}</span>}
    </button>
  );

  const StatBar: React.FC<{ current: number; max: number; color: string; label: string; anim: 'gain' | 'loss' | 'none' }> = ({ current, max, color, label, anim }) => {
    const percentage = max > 0 ? (current / max) * 100 : 0;
    const animClass = anim === 'gain' 
      ? (color === '#34d399' ? 'animate-glow-up-green' : color === '#60a5fa' ? 'animate-glow-up-blue' : 'animate-glow-up-yellow')
      : anim === 'loss' ? 'animate-shake-off' : '';

    return (
      <div className={`mt-1 ${animClass}`}>
        <div className="flex justify-between text-xs font-bold text-text-secondary">
          <span>{label}</span>
          <span>{current} / {max}</span>
        </div>
        <div className="w-full bg-primary rounded-full h-2 mt-0.5 border border-tertiary">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
        </div>
      </div>
    );
  };

  const ListDisplay: React.FC<{ items: any[] | undefined, newItemsSet: Set<string> }> = ({ items, newItemsSet }) => (
    (items && items.length > 0) ? (
        <ul className="text-xs list-disc list-inside pl-1 text-text-primary space-y-1">
            {items.map((item, index) => {
                const name = typeof item === 'string' ? item : item.name;
                return <li key={`${name}-${index}`} className={newItemsSet.has(name) ? 'animate-puff-out rounded' : ''}>{name}</li>
            })}
        </ul>
    ) : (
        <p className="text-xs text-text-secondary italic">None</p>
    )
  );

  const CollapsibleHudSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; }> = ({ title, icon, children }) => (
      <details className="bg-primary/50 rounded">
        <summary className="p-1.5 cursor-pointer text-xs font-semibold text-text-secondary list-none flex items-center gap-2">
            {icon} {title}
        </summary>
        <div className="p-1.5 border-t border-tertiary/50">
            {children}
        </div>
      </details>
  );

  const NpcCard: React.FC<{ npc: RpgNpc, isEnemy?: boolean }> = ({ npc, isEnemy = false }) => (
    <div className="bg-tertiary/50 p-2 rounded">
        <p className={`font-semibold text-sm ${isEnemy ? 'text-danger' : 'text-text-primary'}`}>{npc.name} <span className="text-xs text-text-secondary"> (Lvl {npc.level})</span></p>
        <StatBar current={npc.currentHp} max={npc.maxHp} color={isEnemy ? "#ef4444" : "#34d399"} label="HP" anim={'none'} />
        {npc.maxMp !== undefined && npc.currentMp !== undefined && (
            <StatBar current={npc.currentMp} max={npc.maxMp} color="#60a5fa" label="MP" anim={'none'} />
        )}
        {!isEnemy && npc.xp !== undefined && (
             <StatBar current={npc.xp} max={50} color="#facc15" label="XP" anim={'none'}/>
        )}
        <div className="flex justify-around pt-2 text-xs">
            <div className="flex items-center gap-1.5"><SwordIcon className="w-4 h-4 text-red-400"/> ATK: <span className="font-bold text-text-primary">{npc.attackPower}</span></div>
            <div className="flex items-center gap-1.5"><ShieldIcon className="w-4 h-4 text-blue-400"/> DEF: <span className="font-bold text-text-primary">{npc.defensePower}</span></div>
        </div>
        {!isEnemy && (npc.relationshipScore !== undefined || npc.dominanceScore !== undefined || npc.lustScore !== undefined) && (
            <div className="mt-2 pt-2 border-t border-tertiary/50 flex justify-around">
                {npc.relationshipScore !== undefined && (
                    <CompactProgressRing label="REL" score={npc.relationshipScore} color="#34d399" />
                )}
                {npc.dominanceScore !== undefined && (
                    <CompactProgressRing label="DOM" score={npc.dominanceScore} color="#f87171" />
                )}
                {npc.lustScore !== undefined && (
                    <CompactProgressRing label="LUST" score={npc.lustScore} color="#ec4899" isLust />
                )}
            </div>
        )}
         <div className="space-y-1 mt-2">
            <CollapsibleHudSection title="Equipment" icon={<ShirtIcon className="w-4 h-4"/>}><ListDisplay items={npc.equipment} newItemsSet={new Set()} /></CollapsibleHudSection>
            <CollapsibleHudSection title="Inventory" icon={<BackpackIcon className="w-4 h-4"/>}>
                <>
                    <ListDisplay items={npc.inventory} newItemsSet={new Set()} />
                    {npc.gold !== undefined && npc.gold > 0 && (
                        <div className="text-xs flex items-center gap-1 mt-1">
                            <GemIcon className="w-3 h-3 text-yellow-400" /> {npc.gold} Gold
                        </div>
                    )}
                </>
            </CollapsibleHudSection>
            <CollapsibleHudSection title="Skills" icon={<SwordIcon className="w-4 h-4"/>}><ListDisplay items={npc.skills} newItemsSet={new Set()} /></CollapsibleHudSection>
            <CollapsibleHudSection title="Powers" icon={<SparklesIcon className="w-4 h-4"/>}><ListDisplay items={npc.powers} newItemsSet={new Set()} /></CollapsibleHudSection>
        </div>
    </div>
  );
  
  return (
    <>
      {/* Fullscreen Effects */}
      <div className={`fixed inset-0 z-50 pointer-events-none transition-opacity duration-500 ${levelUpAnim ? 'opacity-100 animate-screen-flash-gold' : 'opacity-0'}`}></div>
      <div className={`fixed inset-0 z-50 pointer-events-none transition-opacity duration-300 ${damageAnim ? 'opacity-100 animate-screen-flash-red animate-screen-shake' : 'opacity-0'}`}></div>
      <div className={`fixed inset-0 z-50 pointer-events-none flex items-center justify-center transition-opacity ${deathAnim ? 'opacity-100 animate-fade-to-black' : 'opacity-0'}`}>
        <h2 className="text-6xl font-bold text-danger animate-breathing" style={{ animationDuration: '4s' }}>GAME OVER</h2>
      </div>

      <div className="absolute top-0 right-0 p-2 md:p-4 w-full max-w-xs z-20 animate-fade-in-slide">
        <details open className="bg-secondary/80 backdrop-blur-sm rounded-lg border border-accent/50 shadow-lg">
          <summary className="p-2 cursor-pointer font-bold text-accent list-none flex justify-between items-center">
            RPG Dashboard
            <span className="detail-arrow transform transition-transform text-xs">▼</span>
          </summary>
          <div className="border-t border-accent/50 relative">
            {isGenerating && (
              <div className="absolute inset-0 bg-secondary/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-b-lg z-10">
                <RefreshIcon className="w-8 h-8 text-accent animate-spin" />
                <p className="mt-2 text-sm text-text-secondary">Updating Stats...</p>
              </div>
            )}
            <div className="flex border-b border-tertiary">
              <TabButton tab="player" label="Player" icon={<PersonStandingIcon className="w-4 h-4" />} />
              <TabButton tab="party" label="Party" icon={<UsersIcon className="w-4 h-4" />} count={party.length} />
              {enemies.length > 0 && <TabButton tab="enemies" label="Enemies" icon={<SwordsIcon className="w-4 h-4" />} count={enemies.length} />}
            </div>
            
            <div className="p-2 text-sm max-h-[70vh] overflow-y-auto">
              {activeTab === 'player' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-center">
                      <div className="font-bold">LVL: <span className="text-accent">{player.level}</span></div>
                      <div className="font-bold">POW: <span className="text-accent">{player.power}</span></div>
                      <div></div>
                      <div className="flex items-center justify-center gap-1">
                          <GemIcon className="w-3 h-3 text-yellow-400" /> {gold}
                      </div>
                  </div>
                  <StatBar current={player.xp} max={50} color="#facc15" label="XP" anim={statChanges.xp} />
                  <StatBar current={player.currentHp} max={player.maxHp} color="#34d399" label="HP" anim={statChanges.hp} />
                  <StatBar current={player.currentMp} max={player.maxMp} color="#60a5fa" label="MP" anim={statChanges.mp} />
                  <div className="flex justify-around pt-2 text-xs">
                      <div className="flex items-center gap-1.5"><SwordIcon className="w-4 h-4 text-red-400"/> ATK: <span className="font-bold text-text-primary">{player.attackPower}</span></div>
                      <div className="flex items-center gap-1.5"><ShieldIcon className="w-4 h-4 text-blue-400"/> DEF: <span className="font-bold text-text-primary">{player.defensePower}</span></div>
                  </div>

                  <CollapsibleHudSection title="Equipment" icon={<ShirtIcon className="w-4 h-4"/>}>
                      <ListDisplay items={equipment} newItemsSet={newItems} />
                  </CollapsibleHudSection>
                  <CollapsibleHudSection title="Inventory" icon={<BackpackIcon className="w-4 h-4"/>}>
                      <ListDisplay items={inventory} newItemsSet={newItems} />
                  </CollapsibleHudSection>
                  <CollapsibleHudSection title="Skills" icon={<SwordIcon className="w-4 h-4"/>}>
                      <ListDisplay items={skills} newItemsSet={newItems} />
                  </CollapsibleHudSection>
                  <CollapsibleHudSection title="Powers" icon={<SparklesIcon className="w-4 h-4"/>}>
                      <ListDisplay items={powers} newItemsSet={newItems} />
                  </CollapsibleHudSection>
                </div>
              )}
              {activeTab === 'party' && (
                  party.length > 0 ? (
                      <div className="space-y-3">
                          {party.map((member) => (
                              <NpcCard key={member.name} npc={member} />
                          ))}
                      </div>
                  ) : <p className="text-center text-xs text-text-secondary italic py-4">No one is in your party.</p>
              )}
              {activeTab === 'enemies' && (
                  enemies.length > 0 ? (
                      <div className="space-y-3">
                          {enemies.map((enemy) => (
                            <NpcCard key={enemy.name} npc={enemy} isEnemy={true} />
                          ))}
                      </div>
                  ) : <p className="text-center text-xs text-text-secondary italic py-4">No enemies nearby.</p>
              )}
            </div>
          </div>
        </details>
      </div>
    </>
  );
};

export default RpgHud;
