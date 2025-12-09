
import type { RpgItem } from '../../types';

export const COMBAT_SKILLS: Record<string, Partial<RpgItem>> = {
    // Basic Combat
    'Power Attack Manual': { type: 'skill', rarity: 'common', genre: 'universal', description: 'Trade accuracy for damage.', stats: { attack: 5, cooldown: 1, value: 50 }, icon: '💪' },
    'Parry Technique': { type: 'skill', rarity: 'common', genre: 'universal', description: 'Deflect incoming blows.', stats: { defense: 5, cooldown: 1, value: 50 }, icon: '🤺' },
    'Dodge Roll': { type: 'skill', rarity: 'common', genre: 'universal', description: 'Evade attacks.', stats: { defense: 10, cooldown: 2, value: 80 }, icon: '🤸' },
    'Double Strike': { type: 'skill', rarity: 'uncommon', genre: 'universal', description: 'Hit twice rapidly.', stats: { attack: 8, cooldown: 2, value: 150 }, icon: '⚔️' },
    'Cleave': { type: 'skill', rarity: 'uncommon', genre: 'fantasy', description: 'Hit multiple adjacent enemies.', stats: { attack: 6, cooldown: 2, value: 150 }, icon: '🪓' },

    // Advanced Melee
    'Whirlwind': { type: 'skill', rarity: 'rare', genre: 'fantasy', description: 'Spinning attack hits all around.', stats: { attack: 15, cooldown: 3, value: 500 }, icon: '🌪️' },
    'Execute': { type: 'skill', rarity: 'rare', genre: 'universal', description: 'Massive damage to low HP targets.', stats: { attack: 20, cooldown: 4, value: 600 }, icon: '☠️' },
    'Shield Bash': { type: 'skill', rarity: 'common', genre: 'fantasy', description: 'Stun enemy with shield.', stats: { attack: 4, cooldown: 2, value: 80 }, icon: '🛡️' },
    'Disarm': { type: 'skill', rarity: 'uncommon', genre: 'universal', description: 'Knock weapon from hand.', stats: { cooldown: 3, value: 200 }, icon: '👋' },
    'Riposte': { type: 'skill', rarity: 'rare', genre: 'fantasy', description: 'Counter-attack after parry.', stats: { attack: 12, defense: 5, cooldown: 2, value: 400 }, icon: '🤺' },

    // Ranged/Tech
    'Snipe': { type: 'skill', rarity: 'uncommon', genre: 'universal', description: 'High accuracy long range shot.', stats: { attack: 15, cooldown: 2, value: 250 }, icon: '🎯' },
    'Suppressive Fire': { type: 'skill', rarity: 'uncommon', genre: 'scifi', description: 'Pins enemies down.', stats: { attack: 5, cooldown: 1, value: 200 }, icon: '🔫' },
    'Overcharge': { type: 'skill', rarity: 'rare', genre: 'scifi', description: 'Boost energy weapon damage.', stats: { attack: 10, cooldown: 3, value: 450 }, icon: '🔋' },
    'Tactical Scan': { type: 'skill', rarity: 'common', genre: 'scifi', description: 'Reveal enemy weaknesses.', stats: { defense: -5, value: 100 }, icon: '📡' },
    'Grenade Throw': { type: 'skill', rarity: 'common', genre: 'universal', description: 'Throw an explosive.', stats: { attack: 12, cooldown: 3, value: 50 }, icon: '💣' },

    // Stealth/Rogue
    'Backstab': { type: 'skill', rarity: 'rare', genre: 'universal', description: 'Critical hit from behind.', stats: { attack: 25, cooldown: 3, value: 500 }, icon: '🔪' },
    'Shadow Step': { type: 'skill', rarity: 'epic', genre: 'fantasy', description: 'Teleport through shadows.', stats: { defense: 10, cooldown: 4, value: 1000 }, icon: '🌑' },
    'Poison Weapon': { type: 'skill', rarity: 'uncommon', genre: 'fantasy', description: 'Coat blade in toxin.', stats: { attack: 5, cooldown: 5, value: 200 }, icon: '🧪' },
    'Smoke Bomb': { type: 'skill', rarity: 'common', genre: 'universal', description: 'Escape combat.', stats: { defense: 20, cooldown: 5, value: 80 }, icon: '💨' },
    'Pickpocket': { type: 'skill', rarity: 'common', genre: 'universal', description: 'Steal from target.', stats: { value: 100 }, icon: '💰' },

    // Legendary Moves
    'Omnislash': { type: 'skill', rarity: 'legendary', genre: 'fantasy', description: 'Limit break rapid strikes.', stats: { attack: 50, cooldown: 10, value: 5000 }, icon: '⚔️' },
    'Limit Breaker': { type: 'skill', rarity: 'legendary', genre: 'universal', description: 'Exceed physical limits.', stats: { attack: 20, defense: 20, cooldown: 10, value: 4000 }, icon: '🔥' },
    'Time Warp': { type: 'skill', rarity: 'legendary', genre: 'scifi', description: 'Slow down time.', stats: { defense: 30, cooldown: 10, value: 6000 }, icon: '⏳' },
    'Orbital Strike': { type: 'skill', rarity: 'legendary', genre: 'scifi', description: 'Call down death from above.', stats: { attack: 100, cooldown: 20, value: 10000 }, icon: '🛰️' },
    'Divine Smite': { type: 'skill', rarity: 'epic', genre: 'fantasy', description: 'Channel holy energy.', stats: { attack: 30, cooldown: 2, value: 1500 }, icon: '✨' },
};
