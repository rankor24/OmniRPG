
import type { RpgItem } from '../../types';

export const FANTASY_ITEMS: Record<string, Partial<RpgItem>> = {
    // === BASIC ADVENTURER SET ===
    'Iron Dagger': { type: 'weapon', rarity: 'common', genre: 'fantasy', description: 'A crude but reliable iron blade.', stats: { attack: 2, value: 5 }, icon: '🗡️' },
    'Rusty Sword': { type: 'weapon', rarity: 'common', genre: 'fantasy', description: 'Seen better days, but still sharp.', stats: { attack: 3, value: 8 }, icon: '⚔️' },
    'Wooden Staff': { type: 'weapon', rarity: 'common', genre: 'fantasy', description: 'A sturdy oak branch.', stats: { attack: 2, value: 2 }, icon: '🦯' },
    'Shortbow': { type: 'weapon', rarity: 'common', genre: 'fantasy', description: 'Simple hunter\'s bow.', stats: { attack: 3, value: 10 }, icon: '🏹' },
    'Hand Axe': { type: 'weapon', rarity: 'common', genre: 'fantasy', description: 'Good for wood or goblins.', stats: { attack: 3, value: 6 }, icon: '🪓' },
    'Leather Armor': { type: 'armor', rarity: 'common', genre: 'fantasy', description: 'Boiled leather jerkin.', stats: { defense: 2, value: 15 }, icon: '🧥' },
    'Iron Shield': { type: 'armor', rarity: 'common', genre: 'fantasy', description: 'Basic protection.', stats: { defense: 2, value: 10 }, icon: '🛡️' },
    'Torch': { type: 'misc', rarity: 'common', genre: 'fantasy', description: 'Lit with a simple spark.', stats: { value: 1 }, icon: '🔥' },

    // === WITCHER SCHOOLS SETS ===
    // Wolf School
    'Wolven Steel Sword': { type: 'weapon', rarity: 'rare', genre: 'fantasy', description: 'Versatile steel blade for humans and beasts.', stats: { attack: 10, value: 500 }, icon: '🐺' },
    'Wolven Silver Sword': { type: 'weapon', rarity: 'rare', genre: 'fantasy', description: 'Runed silver blade for monsters.', stats: { attack: 12, value: 800 }, icon: '⚔️' },
    'Wolven Armor': { type: 'armor', rarity: 'rare', genre: 'fantasy', description: 'Layered leather and chain with wolf medallion.', stats: { defense: 8, value: 600 }, icon: '🥋' },
    // Cat School
    'Feline Steel Sword': { type: 'weapon', rarity: 'rare', genre: 'fantasy', description: 'Lightweight blade focused on bleed damage.', stats: { attack: 9, value: 450 }, icon: '🐱' },
    'Feline Silver Sword': { type: 'weapon', rarity: 'rare', genre: 'fantasy', description: 'Razor sharp silver for rapid strikes.', stats: { attack: 11, value: 750 }, icon: '🗡️' },
    'Feline Armor': { type: 'armor', rarity: 'rare', genre: 'fantasy', description: 'Light armor offering maximum mobility.', stats: { defense: 5, value: 500 }, icon: '🧥' },
    // Bear School
    'Ursine Steel Sword': { type: 'weapon', rarity: 'rare', genre: 'fantasy', description: 'Heavy broadsword that crushes armor.', stats: { attack: 14, value: 600 }, icon: '🐻' },
    'Ursine Silver Sword': { type: 'weapon', rarity: 'rare', genre: 'fantasy', description: 'Massive silver blade for large prey.', stats: { attack: 16, value: 900 }, icon: '⚔️' },
    'Ursine Armor': { type: 'armor', rarity: 'rare', genre: 'fantasy', description: 'Heavy plate and trench coat coat. Very durable.', stats: { defense: 12, value: 1000 }, icon: '🧥' },

    // === DWARVEN MOUNTAIN SET ===
    'Dwarven Warhammer': { type: 'weapon', rarity: 'uncommon', genre: 'fantasy', description: 'Forged in the deep magma vents.', stats: { attack: 12, value: 250 }, icon: '🔨' },
    'Dwarven Battleaxe': { type: 'weapon', rarity: 'uncommon', genre: 'fantasy', description: 'Perfectly balanced for chopping orc heads.', stats: { attack: 11, value: 240 }, icon: '🪓' },
    'Dwarven Plate Mail': { type: 'armor', rarity: 'rare', genre: 'fantasy', description: 'Interlocking geometric plates of dwarven steel.', stats: { defense: 10, value: 800 }, icon: '🛡️' },
    'Heavy Iron Shield': { type: 'armor', rarity: 'uncommon', genre: 'fantasy', description: 'Can block a troll\'s club.', stats: { defense: 5, value: 150 }, icon: '🛡️' },
    'Dwarven Ale': { type: 'consumable', rarity: 'common', genre: 'fantasy', description: 'Restores HP but reduces INT temporarily.', stats: { value: 10 }, icon: '🍺' },

    // === ELVEN FOREST SET ===
    'Elven Composite Bow': { type: 'weapon', rarity: 'rare', genre: 'fantasy', description: 'Crafted from sung wood.', stats: { attack: 10, value: 400 }, icon: '🏹' },
    'Elven Glaive': { type: 'weapon', rarity: 'rare', genre: 'fantasy', description: 'Elegant polearm used by wardens.', stats: { attack: 9, value: 350 }, icon: '🎋' },
    'Mithral Chainmail': { type: 'armor', rarity: 'rare', genre: 'fantasy', description: 'Light as silk, hard as steel.', stats: { defense: 7, value: 1200 }, icon: '⛓️' },
    'Cloak of Elvenkind': { type: 'armor', rarity: 'uncommon', genre: 'fantasy', description: 'Grants advantage on stealth.', stats: { defense: 1, value: 500 }, icon: '🧥' },
    'Lembas Bread': { type: 'consumable', rarity: 'uncommon', genre: 'fantasy', description: 'One bite fills a grown man.', stats: { value: 50 }, icon: '🍞' },

    // === ORCISH WARBAND SET ===
    'Jagged Cleaver': { type: 'weapon', rarity: 'common', genre: 'fantasy', description: 'Brutal, rusted blade meant for tearing.', stats: { attack: 8, value: 60 }, icon: '🔪' },
    'Spiked Club': { type: 'weapon', rarity: 'common', genre: 'fantasy', description: 'Simple wood with iron nails.', stats: { attack: 6, value: 30 }, icon: '🪵' },
    'Scrap Plate Armor': { type: 'armor', rarity: 'common', genre: 'fantasy', description: 'Pieces of stolen armor bolted together.', stats: { defense: 6, value: 80 }, icon: '🔩' },
    'Orcish War Banner': { type: 'misc', rarity: 'uncommon', genre: 'fantasy', description: 'Inspires rage in allies.', stats: { value: 100 }, icon: '🚩' },

    // === PALADIN HOLY SET ===
    'Sun Blade': { type: 'weapon', rarity: 'legendary', genre: 'fantasy', description: 'Emits sunlight. Hated by undead.', stats: { attack: 15, value: 2500 }, icon: '☀️' },
    'Warhammer of Justice': { type: 'weapon', rarity: 'epic', genre: 'fantasy', description: 'Glows when demons are near.', stats: { attack: 13, value: 1500 }, icon: '🔨' },
    'Sanctified Plate': { type: 'armor', rarity: 'epic', genre: 'fantasy', description: 'Blessed by the High Priest.', stats: { defense: 14, value: 2000 }, icon: '⚜️' },
    'Shield of Faith': { type: 'armor', rarity: 'rare', genre: 'fantasy', description: 'Deflects magical projectiles.', stats: { defense: 6, value: 800 }, icon: '🛡️' },
    'Holy Water': { type: 'consumable', rarity: 'uncommon', genre: 'fantasy', description: 'Burns the unholy.', stats: { attack: 20, value: 50 }, icon: '💧' },

    // === NECROMANCER DEATH SET ===
    'Staff of Withering': { type: 'weapon', rarity: 'epic', genre: 'fantasy', description: 'Ages anything it touches.', stats: { attack: 8, value: 1800 }, icon: '💀' },
    'Bone Dagger': { type: 'weapon', rarity: 'uncommon', genre: 'fantasy', description: 'Carved from a human femur.', stats: { attack: 4, value: 100 }, icon: '🦴' },
    'Robes of the Lich': { type: 'armor', rarity: 'legendary', genre: 'fantasy', description: 'Radiates an aura of cold fear.', stats: { defense: 4, value: 3000 }, icon: '👘' },
    'Skull Focus': { type: 'misc', rarity: 'rare', genre: 'fantasy', description: 'Amplifies necrotic spells.', stats: { value: 500 }, icon: '💀' },

    // === ROGUE SHADOW SET ===
    'Dagger of Venom': { type: 'weapon', rarity: 'rare', genre: 'fantasy', description: 'Coated in a necrotic curse.', stats: { attack: 7, value: 1200 }, icon: '🤢' },
    'Shadow Leather': { type: 'armor', rarity: 'rare', genre: 'fantasy', description: 'Blends into darkness completely.', stats: { defense: 4, value: 900 }, icon: '🌑' },
    'Thieves Tools': { type: 'key', rarity: 'uncommon', genre: 'fantasy', description: 'For picking locks.', stats: { value: 50 }, icon: '🔧' },
    'Smoke Bomb': { type: 'consumable', rarity: 'common', genre: 'fantasy', description: 'Quick escape.', stats: { value: 20 }, icon: '💨' },

    // === MAGE ARCANE SET ===
    'Crystal Staff': { type: 'weapon', rarity: 'rare', genre: 'fantasy', description: 'Focuses elemental energy.', stats: { attack: 6, value: 1000 }, icon: '🔮' },
    'Wand of Fireballs': { type: 'weapon', rarity: 'rare', genre: 'fantasy', description: 'Has 5 charges.', stats: { attack: 20, value: 1500 }, icon: '🪄' },
    'Robes of the Archmagi': { type: 'armor', rarity: 'legendary', genre: 'fantasy', description: 'Protective enchantments for wizards.', stats: { defense: 5, value: 3000 }, icon: '👘' },
    'Grimoire': { type: 'misc', rarity: 'uncommon', genre: 'fantasy', description: 'Contains ancient spells.', stats: { value: 200 }, icon: '📖' },
    'Mana Potion': { type: 'consumable', rarity: 'common', genre: 'fantasy', description: 'Restores MP.', stats: { value: 50 }, icon: '🧪' },

    // === DRAGON SLAYER SET ===
    'Dragonbone Greatsword': { type: 'weapon', rarity: 'legendary', genre: 'fantasy', description: 'Carved from a Wyrm\'s spine.', stats: { attack: 22, value: 5000 }, icon: '🐲' },
    'Dragonscale Mail': { type: 'armor', rarity: 'epic', genre: 'fantasy', description: 'Resistant to fire.', stats: { defense: 13, value: 3500 }, icon: '🐉' },
    'Wyrmkiller Spear': { type: 'weapon', rarity: 'epic', genre: 'fantasy', description: 'Pierces dragon hide.', stats: { attack: 18, value: 2800 }, icon: '🔱' },

    // === VAMPIRE NOBLE SET ===
    'Rapier of Thirst': { type: 'weapon', rarity: 'rare', genre: 'fantasy', description: 'Heals wielder on hit.', stats: { attack: 10, value: 1600 }, icon: '🩸' },
    'Noble\'s Coat': { type: 'armor', rarity: 'uncommon', genre: 'fantasy', description: 'Stylish but protective velvet.', stats: { defense: 3, value: 400 }, icon: '🤵' },
    'Blood Vial': { type: 'consumable', rarity: 'common', genre: 'fantasy', description: 'Sustenance for the undead.', stats: { value: 100 }, icon: '💉' },

    // === CULTIST SET ===
    'Ceremonial Dagger': { type: 'weapon', rarity: 'uncommon', genre: 'fantasy', description: 'Wavy blade for sacrifice.', stats: { attack: 5, value: 150 }, icon: '🗡️' },
    'Cultist Robes': { type: 'armor', rarity: 'common', genre: 'fantasy', description: 'Red robes with strange symbols.', stats: { defense: 1, value: 20 }, icon: '🧧' },
    'Eldritch Idol': { type: 'misc', rarity: 'rare', genre: 'fantasy', description: 'Whispers when you hold it.', stats: { value: 666 }, icon: '🗿' },

    // === ARTIFACTS ===
    'Aerondight': { type: 'weapon', rarity: 'legendary', genre: 'fantasy', description: 'Charges with each hit. Always deals critical damage at full charge.', stats: { attack: 18, value: 4000 }, icon: '⚡' },
    'The One Ring': { type: 'misc', rarity: 'legendary', genre: 'fantasy', description: 'Invisibility at a terrible cost.', stats: { value: 0 }, icon: '💍' },
    'Deck of Many Things': { type: 'misc', rarity: 'legendary', genre: 'fantasy', description: 'Do you feel lucky?', stats: { value: 10000 }, icon: '🃏' },
};
