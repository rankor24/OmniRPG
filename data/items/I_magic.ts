
import type { RpgItem } from '../../types';

export const MAGIC_SPELLS: Record<string, Partial<RpgItem>> = {
    // School of Evocation (Destruction)
    'Fireball Scroll': { type: 'spell', rarity: 'rare', genre: 'fantasy', description: 'Explosive ball of fire.', stats: { attack: 20, manaCost: 30, value: 500 }, icon: '🔥' },
    'Magic Missile Tome': { type: 'spell', rarity: 'common', genre: 'fantasy', description: 'Three unerring darts of force.', stats: { attack: 6, manaCost: 10, value: 100 }, icon: '✨' },
    'Lightning Bolt Scroll': { type: 'spell', rarity: 'uncommon', genre: 'fantasy', description: 'Line of lightning.', stats: { attack: 15, manaCost: 25, value: 300 }, icon: '⚡' },
    'Ice Storm Manual': { type: 'spell', rarity: 'rare', genre: 'fantasy', description: 'Hail and freezing rain.', stats: { attack: 12, manaCost: 40, value: 600 }, icon: '🌨️' },
    'Meteor Swarm Scroll': { type: 'spell', rarity: 'legendary', genre: 'fantasy', description: 'Rain fire from the heavens.', stats: { attack: 50, manaCost: 100, value: 5000 }, icon: '☄️' },
    'Acid Splash': { type: 'spell', rarity: 'common', genre: 'fantasy', description: 'Throws a bubble of acid.', stats: { attack: 4, manaCost: 5, value: 50 }, icon: '🧪' },
    'Thunderwave': { type: 'spell', rarity: 'common', genre: 'fantasy', description: 'Pushing wave of force.', stats: { attack: 8, manaCost: 15, value: 150 }, icon: '🔊' },
    'Cone of Cold': { type: 'spell', rarity: 'rare', genre: 'fantasy', description: 'Blast of freezing air.', stats: { attack: 18, manaCost: 35, value: 700 }, icon: '❄️' },
    'Chain Lightning': { type: 'spell', rarity: 'epic', genre: 'fantasy', description: 'Arcs between enemies.', stats: { attack: 25, manaCost: 50, value: 1200 }, icon: '🌩️' },
    'Sunbeam': { type: 'spell', rarity: 'epic', genre: 'fantasy', description: 'Beam of brilliant light.', stats: { attack: 22, manaCost: 45, value: 1100 }, icon: '☀️' },

    // School of Abjuration (Protection)
    'Shield Scroll': { type: 'spell', rarity: 'common', genre: 'fantasy', description: 'Invisible barrier (+5 DEF).', stats: { defense: 5, manaCost: 10, value: 100 }, icon: '🛡️' },
    'Mage Armor Tome': { type: 'spell', rarity: 'common', genre: 'fantasy', description: 'Protective force (+3 DEF).', stats: { defense: 3, manaCost: 15, value: 150 }, icon: '👕' },
    'Counterspell Manual': { type: 'spell', rarity: 'rare', genre: 'fantasy', description: 'Interrupts enemy magic.', stats: { manaCost: 20, value: 400 }, icon: '🚫' },
    'Globe of Invulnerability': { type: 'spell', rarity: 'epic', genre: 'fantasy', description: 'Blocks all low level spells.', stats: { defense: 20, manaCost: 60, value: 2000 }, icon: '🌐' },
    'Banishment': { type: 'spell', rarity: 'rare', genre: 'fantasy', description: 'Sends target to another plane.', stats: { manaCost: 30, value: 500 }, icon: '🌀' },

    // School of Necromancy (Death)
    'Raise Dead Scroll': { type: 'spell', rarity: 'rare', genre: 'fantasy', description: 'Animates a corpse.', stats: { manaCost: 40, value: 600 }, icon: '🧟' },
    'Inflict Wounds': { type: 'spell', rarity: 'common', genre: 'fantasy', description: 'Touch causes necrosis.', stats: { attack: 10, manaCost: 15, value: 120 }, icon: '💀' },
    'Vampiric Touch': { type: 'spell', rarity: 'uncommon', genre: 'fantasy', description: 'Steals life force.', stats: { attack: 8, manaCost: 20, value: 250 }, icon: '🩸' },
    'Finger of Death': { type: 'spell', rarity: 'legendary', genre: 'fantasy', description: 'Instant necrosis.', stats: { attack: 40, manaCost: 80, value: 3000 }, icon: '👉' },
    'Blight': { type: 'spell', rarity: 'uncommon', genre: 'fantasy', description: 'Withers plants and flesh.', stats: { attack: 14, manaCost: 25, value: 300 }, icon: '🍂' },

    // School of Divination (Information)
    'Identify Scroll': { type: 'spell', rarity: 'common', genre: 'fantasy', description: 'Reveals item properties.', stats: { manaCost: 10, value: 80 }, icon: '🔍' },
    'True Seeing': { type: 'spell', rarity: 'epic', genre: 'fantasy', description: 'See through illusions.', stats: { manaCost: 50, value: 1500 }, icon: '👁️' },
    'Detect Magic': { type: 'spell', rarity: 'common', genre: 'fantasy', description: 'Senses magical auras.', stats: { manaCost: 5, value: 50 }, icon: '✨' },
    'Scrying Tome': { type: 'spell', rarity: 'rare', genre: 'fantasy', description: 'Spy on distant targets.', stats: { manaCost: 40, value: 800 }, icon: '🔮' },
    'Foresight': { type: 'spell', rarity: 'legendary', genre: 'fantasy', description: 'See the immediate future.', stats: { defense: 10, manaCost: 90, value: 4000 }, icon: '🧠' },

    // School of Illusion
    'Invisibility': { type: 'spell', rarity: 'uncommon', genre: 'fantasy', description: 'Vanishes from sight.', stats: { defense: 10, manaCost: 20, value: 300 }, icon: '👻' },
    'Mirror Image': { type: 'spell', rarity: 'uncommon', genre: 'fantasy', description: 'Creates illusory duplicates.', stats: { defense: 8, manaCost: 15, value: 250 }, icon: '👥' },
    'Disguise Self': { type: 'spell', rarity: 'common', genre: 'fantasy', description: 'Changes appearance.', stats: { manaCost: 10, value: 100 }, icon: '🎭' },
    'Phantasmal Killer': { type: 'spell', rarity: 'rare', genre: 'fantasy', description: 'Manifests worst nightmare.', stats: { attack: 12, manaCost: 30, value: 500 }, icon: '😱' },
    'Weird': { type: 'spell', rarity: 'legendary', genre: 'fantasy', description: 'Mass hallucination.', stats: { attack: 25, manaCost: 80, value: 3500 }, icon: '😵' },

    // School of Enchantment (Mind)
    'Charm Person': { type: 'spell', rarity: 'common', genre: 'fantasy', description: 'Makes humanoid friendly.', stats: { manaCost: 10, value: 100 }, icon: '😍' },
    'Sleep': { type: 'spell', rarity: 'common', genre: 'fantasy', description: 'Puts creatures to sleep.', stats: { manaCost: 15, value: 150 }, icon: '💤' },
    'Dominate Monster': { type: 'spell', rarity: 'epic', genre: 'fantasy', description: 'Total control.', stats: { manaCost: 70, value: 2000 }, icon: '👑' },
    'Hold Person': { type: 'spell', rarity: 'uncommon', genre: 'fantasy', description: 'Paralyzes humanoid.', stats: { manaCost: 20, value: 200 }, icon: '✋' },
    'Power Word Kill': { type: 'spell', rarity: 'legendary', genre: 'fantasy', description: 'Utter a word to kill.', stats: { attack: 100, manaCost: 100, value: 10000 }, icon: '🗣️' },

    // School of Transmutation (Change)
    'Polymorph': { type: 'spell', rarity: 'rare', genre: 'fantasy', description: 'Transform creature.', stats: { manaCost: 40, value: 600 }, icon: '🐑' },
    'Haste': { type: 'spell', rarity: 'rare', genre: 'fantasy', description: 'Doubles speed.', stats: { attack: 5, defense: 5, manaCost: 30, value: 500 }, icon: '⏩' },
    'Fly': { type: 'spell', rarity: 'uncommon', genre: 'fantasy', description: 'Grants flight.', stats: { manaCost: 25, value: 400 }, icon: '🕊️' },
    'Time Stop': { type: 'spell', rarity: 'legendary', genre: 'fantasy', description: 'Freezes time.', stats: { manaCost: 100, value: 8000 }, icon: '⏳' },
    'Telekinesis': { type: 'spell', rarity: 'rare', genre: 'fantasy', description: 'Move objects with mind.', stats: { manaCost: 35, value: 550 }, icon: '🧠' },

    // School of Conjuration (Summoning)
    'Misty Step': { type: 'spell', rarity: 'uncommon', genre: 'fantasy', description: 'Short teleport.', stats: { defense: 5, manaCost: 15, value: 200 }, icon: '🌫️' },
    'Web': { type: 'spell', rarity: 'uncommon', genre: 'fantasy', description: 'Sticky webbing.', stats: { manaCost: 15, value: 150 }, icon: '🕸️' },
    'Teleport': { type: 'spell', rarity: 'epic', genre: 'fantasy', description: 'Travel instantly.', stats: { manaCost: 60, value: 1500 }, icon: '🌌' },
    'Summon Elemental': { type: 'spell', rarity: 'rare', genre: 'fantasy', description: 'Calls an elemental ally.', stats: { attack: 15, manaCost: 50, value: 800 }, icon: '🧞' },
    'Wish': { type: 'spell', rarity: 'legendary', genre: 'fantasy', description: 'Alter reality.', stats: { manaCost: 150, value: 20000 }, icon: '🧞‍♂️' },

    // Healing (Cleric/Divine)
    'Cure Wounds': { type: 'spell', rarity: 'common', genre: 'fantasy', description: 'Heals touch.', stats: { value: 100, manaCost: 10 }, icon: '🩹' },
    'Healing Word': { type: 'spell', rarity: 'common', genre: 'fantasy', description: 'Ranged heal.', stats: { value: 100, manaCost: 10 }, icon: '🗣️' },
    'Mass Heal': { type: 'spell', rarity: 'legendary', genre: 'fantasy', description: 'Heals everyone.', stats: { value: 5000, manaCost: 90 }, icon: '🏥' },
    'Revivify': { type: 'spell', rarity: 'rare', genre: 'fantasy', description: 'Resurrect recent dead.', stats: { value: 1000, manaCost: 50 }, icon: '💎' },
    'Lesser Restoration': { type: 'spell', rarity: 'uncommon', genre: 'fantasy', description: 'Cures disease/poison.', stats: { value: 200, manaCost: 20 }, icon: '🌿' }
};
