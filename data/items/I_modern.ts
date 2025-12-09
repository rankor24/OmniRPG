
import type { RpgItem } from '../../types';

export const MODERN_ITEMS: Record<string, Partial<RpgItem>> = {
    // === STREET SURVIVOR SET ===
    'Baseball Bat': { type: 'weapon', rarity: 'common', genre: 'modern', description: 'Wooden bat, good for blunt force.', stats: { attack: 4, value: 20 }, icon: '🏏' },
    'Pocket Knife': { type: 'weapon', rarity: 'common', genre: 'modern', description: 'Small folding blade.', stats: { attack: 2, value: 10 }, icon: '🔪' },
    'Hoodie': { type: 'armor', rarity: 'common', genre: 'modern', description: 'Comfortable and obscure.', stats: { defense: 1, value: 30 }, icon: '🧥' },
    'Backpack': { type: 'misc', rarity: 'common', genre: 'modern', description: 'Carries your life.', stats: { value: 40 }, icon: '🎒' },
    'Canned Beans': { type: 'consumable', rarity: 'common', genre: 'modern', description: 'Cold but filling.', stats: { value: 5 }, icon: '🥫' },

    // === LAW ENFORCEMENT SET ===
    'Service Pistol (Glock)': { type: 'weapon', rarity: 'uncommon', genre: 'modern', description: 'Standard issue 9mm.', stats: { attack: 8, value: 400 }, icon: '🔫' },
    'Police Baton': { type: 'weapon', rarity: 'common', genre: 'modern', description: 'For non-lethal takedowns.', stats: { attack: 4, value: 50 }, icon: '🥖' },
    'Kevlar Vest': { type: 'armor', rarity: 'uncommon', genre: 'modern', description: 'Stops small arms fire.', stats: { defense: 6, value: 300 }, icon: '🦺' },
    'Taser': { type: 'weapon', rarity: 'uncommon', genre: 'modern', description: 'Stuns targets.', stats: { attack: 2, value: 150 }, icon: '⚡' },
    'Handcuffs': { type: 'misc', rarity: 'common', genre: 'modern', description: 'Restrains wrists.', stats: { value: 25 }, icon: '🔗' },

    // === MILITARY TACTICAL SET ===
    'Assault Rifle (M4A1)': { type: 'weapon', rarity: 'rare', genre: 'modern', description: 'Versatile automatic rifle.', stats: { attack: 14, value: 1200 }, icon: '🔫' },
    'Combat Knife': { type: 'weapon', rarity: 'uncommon', genre: 'modern', description: 'Fixed blade serrated steel.', stats: { attack: 6, value: 80 }, icon: '🗡️' },
    'Plate Carrier': { type: 'armor', rarity: 'rare', genre: 'modern', description: 'Heavy ballistic protection.', stats: { defense: 10, value: 800 }, icon: '🛡️' },
    'Frag Grenade': { type: 'consumable', rarity: 'uncommon', genre: 'modern', description: 'Pull pin and throw.', stats: { attack: 20, value: 50 }, icon: '💣' },
    'Night Vision Goggles': { type: 'misc', rarity: 'rare', genre: 'modern', description: 'See in the dark.', stats: { value: 1500 }, icon: '🥽' },

    // === THE HITMAN SET ===
    'Silenced Pistol': { type: 'weapon', rarity: 'rare', genre: 'modern', description: 'Whisper quiet death.', stats: { attack: 10, value: 1000 }, icon: '🔇' },
    'Fiber Wire': { type: 'weapon', rarity: 'rare', genre: 'modern', description: 'For silent strangulation.', stats: { attack: 15, value: 200 }, icon: '🧶' },
    'Tailored Suit': { type: 'armor', rarity: 'epic', genre: 'modern', description: 'Bullet-resistant lining, looks sharp.', stats: { defense: 5, value: 2000 }, icon: '🤵' },
    'Sniper Rifle (Barrett)': { type: 'weapon', rarity: 'epic', genre: 'modern', description: '.50 cal anti-materiel rifle.', stats: { attack: 25, value: 3000 }, icon: '🔭' },
    'Burner Phone': { type: 'misc', rarity: 'common', genre: 'modern', description: 'Untraceable communication.', stats: { value: 20 }, icon: '📱' },

    // === CRIMINAL UNDERWORLD SET ===
    'Sawed-Off Shotgun': { type: 'weapon', rarity: 'uncommon', genre: 'modern', description: 'Devastating at close range.', stats: { attack: 12, value: 300 }, icon: '💥' },
    'Brass Knuckles': { type: 'weapon', rarity: 'common', genre: 'modern', description: 'Adds punch to your punch.', stats: { attack: 5, value: 40 }, icon: '👊' },
    'Leather Jacket': { type: 'armor', rarity: 'common', genre: 'modern', description: 'Tough cowhide.', stats: { defense: 3, value: 150 }, icon: '🧥' },
    'Lockpicks': { type: 'key', rarity: 'uncommon', genre: 'modern', description: 'Opens doors quietly.', stats: { value: 60 }, icon: '🔧' },
    'Duffel Bag': { type: 'misc', rarity: 'common', genre: 'modern', description: 'For the loot.', stats: { value: 30 }, icon: '💰' },

    // === MEDICAL RESPONSE SET ===
    'Scalpel': { type: 'weapon', rarity: 'common', genre: 'modern', description: 'Extremely sharp precision tool.', stats: { attack: 4, value: 20 }, icon: '🔪' },
    'First Aid Kit': { type: 'consumable', rarity: 'uncommon', genre: 'modern', description: 'Stops bleeding and heals.', stats: { value: 50 }, icon: '⛑️' },
    'Defibrillator': { type: 'misc', rarity: 'rare', genre: 'modern', description: 'Clear!', stats: { value: 1000 }, icon: '⚡' },
    'Adrenaline Shot': { type: 'consumable', rarity: 'rare', genre: 'modern', description: 'Temporary stat boost.', stats: { value: 100 }, icon: '💉' },
    'Lab Coat': { type: 'armor', rarity: 'common', genre: 'modern', description: 'Professional look, stains easily.', stats: { defense: 0, value: 50 }, icon: '🥼' },

    // === CONSTRUCTION/BRUTE SET ===
    'Sledgehammer': { type: 'weapon', rarity: 'uncommon', genre: 'modern', description: 'Heavy impact.', stats: { attack: 10, value: 60 }, icon: '🔨' },
    'Nail Gun': { type: 'weapon', rarity: 'uncommon', genre: 'modern', description: 'Pneumatic projectile launcher.', stats: { attack: 8, value: 200 }, icon: '🔫' },
    'Chainsaw': { type: 'weapon', rarity: 'rare', genre: 'modern', description: 'Messy but effective.', stats: { attack: 18, value: 400 }, icon: '⚙️' },
    'Hard Hat': { type: 'armor', rarity: 'common', genre: 'modern', description: 'Protects the noggin.', stats: { defense: 2, value: 20 }, icon: '👷' },
    'Crowbar': { type: 'weapon', rarity: 'common', genre: 'modern', description: 'Open crates or skulls.', stats: { attack: 5, value: 30 }, icon: '🔧' },

    // === RIOT CONTROL SET ===
    'Riot Shield': { type: 'armor', rarity: 'rare', genre: 'modern', description: 'Clear polycarbonate protection.', stats: { defense: 8, value: 300 }, icon: '🛡️' },
    'Tear Gas Grenade': { type: 'weapon', rarity: 'uncommon', genre: 'modern', description: 'Area denial.', stats: { attack: 5, value: 80 }, icon: '💨' },
    'Rubber Bullet Shotgun': { type: 'weapon', rarity: 'uncommon', genre: 'modern', description: 'Less lethal, hurts like hell.', stats: { attack: 6, value: 500 }, icon: '🔫' },
    'Riot Helmet': { type: 'armor', rarity: 'uncommon', genre: 'modern', description: 'With face visor.', stats: { defense: 4, value: 120 }, icon: '🪖' },

    // === CORPORATE EXECUTIVE SET ===
    'Fountain Pen': { type: 'weapon', rarity: 'common', genre: 'modern', description: 'The pen is mightier...', stats: { attack: 1, value: 500 }, icon: '🖊️' },
    'Armored Briefcase': { type: 'armor', rarity: 'rare', genre: 'modern', description: 'Stops SMG rounds.', stats: { defense: 5, value: 1500 }, icon: '💼' },
    'Black Amex': { type: 'misc', rarity: 'epic', genre: 'modern', description: 'Unlimited purchasing power.', stats: { value: 10000 }, icon: '💳' },
    'Designer Suit': { type: 'armor', rarity: 'rare', genre: 'modern', description: 'Italian silk. +10 Charisma.', stats: { defense: 0, value: 5000 }, icon: '🕴️' },
    'Rolex': { type: 'misc', rarity: 'rare', genre: 'modern', description: 'A status symbol.', stats: { value: 8000 }, icon: '⌚' },

    // === POST-APOCALYPSE SCAVENGER ===
    'Crossbow': { type: 'weapon', rarity: 'uncommon', genre: 'modern', description: 'Silent hunting weapon.', stats: { attack: 8, value: 150 }, icon: '🏹' },
    'Machete': { type: 'weapon', rarity: 'common', genre: 'modern', description: 'Hacking through brush and bodies.', stats: { attack: 7, value: 40 }, icon: '🗡️' },
    'Gas Mask': { type: 'armor', rarity: 'uncommon', genre: 'modern', description: 'Filter out toxins.', stats: { defense: 1, value: 80 }, icon: '😷' },
    'Geiger Counter': { type: 'misc', rarity: 'rare', genre: 'modern', description: 'Detects radiation.', stats: { value: 200 }, icon: '📟' },
    'Water Purification Tablets': { type: 'consumable', rarity: 'common', genre: 'modern', description: 'Safe drinking water.', stats: { value: 10 }, icon: '💊' },

    // === FIRE & RESCUE ===
    'Fire Axe': { type: 'weapon', rarity: 'uncommon', genre: 'modern', description: 'Breaches doors easily.', stats: { attack: 9, value: 100 }, icon: '🪓' },
    'Turnout Coat': { type: 'armor', rarity: 'rare', genre: 'modern', description: 'Fire and heat resistant.', stats: { defense: 5, value: 800 }, icon: '🧥' },
    'Flare Gun': { type: 'weapon', rarity: 'common', genre: 'modern', description: 'Signal or burn.', stats: { attack: 6, value: 120 }, icon: '🧨' },
    'Oxygen Tank': { type: 'misc', rarity: 'uncommon', genre: 'modern', description: 'Breathe anywhere.', stats: { value: 300 }, icon: '🫧' },

    // === THE PSYCHO SET ===
    'Hockey Mask': { type: 'armor', rarity: 'common', genre: 'modern', description: 'Terrifying visage.', stats: { defense: 2, value: 15 }, icon: '😷' },
    'Rusty Machete': { type: 'weapon', rarity: 'common', genre: 'modern', description: 'Tetanus included.', stats: { attack: 6, value: 10 }, icon: '🔪' },
    'Meat Hook': { type: 'weapon', rarity: 'uncommon', genre: 'modern', description: 'Grim utility.', stats: { attack: 7, value: 30 }, icon: '🪝' },
    
    // === UNIQUE / LEGENDARY MODERN ===
    'The Golden Gun': { type: 'weapon', rarity: 'legendary', genre: 'modern', description: 'One shot kill. Gold plated.', stats: { attack: 100, value: 50000 }, icon: '🔫' },
    'John\'s Pencil': { type: 'weapon', rarity: 'legendary', genre: 'modern', description: 'A f*cking pencil.', stats: { attack: 50, value: 1 }, icon: '✏️' },
    'Neural Link (Prototype)': { type: 'misc', rarity: 'legendary', genre: 'modern', description: 'Direct brain-computer interface.', stats: { value: 100000 }, icon: '🧠' },
    
    // === CONSUMABLES & MISC ===
    'Energy Drink': { type: 'consumable', rarity: 'common', genre: 'modern', description: 'Caffeine boost.', stats: { value: 3 }, icon: '🥤' },
    'Painkillers': { type: 'consumable', rarity: 'common', genre: 'modern', description: 'Numb the pain.', stats: { value: 15 }, icon: '💊' },
    'Whiskey Bottle': { type: 'consumable', rarity: 'common', genre: 'modern', description: 'Courage in a bottle.', stats: { value: 25 }, icon: '🥃' },
    'Smartphone': { type: 'misc', rarity: 'common', genre: 'modern', description: 'Knowledge of the world.', stats: { value: 800 }, icon: '📱' },
    'Flashlight': { type: 'misc', rarity: 'common', genre: 'modern', description: 'Battery powered sun.', stats: { value: 20 }, icon: '🔦' },
    'Lighter': { type: 'misc', rarity: 'common', genre: 'modern', description: 'Fire on demand.', stats: { value: 2 }, icon: '🔥' },
};
