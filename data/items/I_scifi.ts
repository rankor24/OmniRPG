
import type { RpgItem } from '../../types';

export const SCIFI_ITEMS: Record<string, Partial<RpgItem>> = {
    // === CYBERPUNK STREET SET ===
    'Unity Pistol': { type: 'weapon', rarity: 'common', genre: 'scifi', description: 'Standard issue NCPD sidearm.', stats: { attack: 4, value: 50 }, icon: '🔫' },
    'Lexington Pistol': { type: 'weapon', rarity: 'common', genre: 'scifi', description: 'Full-auto machine pistol.', stats: { attack: 5, value: 80 }, icon: '🔫' },
    'Baseball Bat (Aluminum)': { type: 'weapon', rarity: 'common', genre: 'scifi', description: 'Good for dents.', stats: { attack: 3, value: 30 }, icon: '🏏' },
    'Switchblade': { type: 'weapon', rarity: 'common', genre: 'scifi', description: 'Fast and concealable.', stats: { attack: 3, value: 20 }, icon: '🔪' },
    'Street Jacket': { type: 'armor', rarity: 'common', genre: 'scifi', description: 'Leather with light weaving.', stats: { defense: 2, value: 60 }, icon: '🧥' },
    'Ballistic Vest': { type: 'armor', rarity: 'uncommon', genre: 'scifi', description: 'Stops small caliber rounds.', stats: { defense: 4, value: 150 }, icon: '🦺' },
    'MaxDoc Inhaler': { type: 'consumable', rarity: 'common', genre: 'scifi', description: 'Instant heal.', stats: { value: 20 }, icon: '🌬️' },

    // === CYBERPUNK HIGH-END SET ===
    'Mantis Blades': { type: 'weapon', rarity: 'epic', genre: 'scifi', description: 'Retractable forearm blades.', stats: { attack: 14, value: 2500 }, icon: '⚔️' },
    'Monowire': { type: 'weapon', rarity: 'epic', genre: 'scifi', description: 'Molecule-thin whip.', stats: { attack: 10, value: 2000 }, icon: '🧶' },
    'Gorilla Arms': { type: 'weapon', rarity: 'epic', genre: 'scifi', description: 'Cybernetic muscle enhancement.', stats: { attack: 12, value: 2200 }, icon: '💪' },
    'Projectile Launch System': { type: 'weapon', rarity: 'epic', genre: 'scifi', description: 'Wrist-mounted rocket launcher.', stats: { attack: 20, value: 3000 }, icon: '🚀' },
    'Subdermal Armor': { type: 'armor', rarity: 'rare', genre: 'scifi', description: 'Implanted ballistic plating.', stats: { defense: 6, value: 1000 }, icon: '🦾' },
    'Sandevistan MK.IV': { type: 'misc', rarity: 'legendary', genre: 'scifi', description: 'Slows time for the user.', stats: { value: 5000 }, icon: '⚡' },
    'Arasaka Cyberdeck': { type: 'misc', rarity: 'rare', genre: 'scifi', description: 'Military grade hacking tool.', stats: { value: 1500 }, icon: '💻' },

    // === SPACE MARINE (40K) SET ===
    'Bolter': { type: 'weapon', rarity: 'rare', genre: 'scifi', description: 'Fires explosive .75 caliber rounds.', stats: { attack: 12, value: 400 }, icon: '🔫' },
    'Chainsword': { type: 'weapon', rarity: 'uncommon', genre: 'scifi', description: 'Sword with chainsaw teeth.', stats: { attack: 8, value: 120 }, icon: '⚙️' },
    'Power Sword': { type: 'weapon', rarity: 'epic', genre: 'scifi', description: 'Sheathed in a disruptive energy field.', stats: { attack: 14, value: 800 }, icon: '⚡' },
    'Thunder Hammer': { type: 'weapon', rarity: 'legendary', genre: 'scifi', description: 'Releases a shockwave on impact.', stats: { attack: 18, value: 1500 }, icon: '🔨' },
    'Power Armor': { type: 'armor', rarity: 'epic', genre: 'scifi', description: 'Servo-assisted ceramite plate.', stats: { defense: 12, value: 5000 }, icon: '🤖' },
    'Storm Shield': { type: 'armor', rarity: 'epic', genre: 'scifi', description: 'Generates a force field.', stats: { defense: 8, value: 1200 }, icon: '🛡️' },
    'Purity Seal': { type: 'misc', rarity: 'uncommon', genre: 'scifi', description: 'Proof of devotion.', stats: { value: 50 }, icon: '📜' },

    // === IMPERIAL GUARD SET ===
    'Lasgun': { type: 'weapon', rarity: 'common', genre: 'scifi', description: 'Standard issue energy rifle. Reliable.', stats: { attack: 5, value: 40 }, icon: '🔦' },
    'Las-Pistol': { type: 'weapon', rarity: 'common', genre: 'scifi', description: 'Officer\'s sidearm.', stats: { attack: 4, value: 30 }, icon: '🔫' },
    'Flak Armor': { type: 'armor', rarity: 'common', genre: 'scifi', description: 'Basic guard protection.', stats: { defense: 3, value: 50 }, icon: '🛡️' },
    'Combat Knife': { type: 'weapon', rarity: 'common', genre: 'scifi', description: 'Monotask steel.', stats: { attack: 3, value: 15 }, icon: '🗡️' },
    'Recaf': { type: 'consumable', rarity: 'common', genre: 'scifi', description: 'Synthetic caffeine drink.', stats: { value: 5 }, icon: '☕' },

    // === TECH-PRIEST SET ===
    'Omnissian Axe': { type: 'weapon', rarity: 'rare', genre: 'scifi', description: 'Symbol of the Machine God.', stats: { attack: 10, value: 600 }, icon: '🪓' },
    'Servo-Arm': { type: 'weapon', rarity: 'rare', genre: 'scifi', description: 'Mechanical limb for repair and crushing.', stats: { attack: 8, value: 500 }, icon: '🦾' },
    'Volkite Blaster': { type: 'weapon', rarity: 'legendary', genre: 'scifi', description: 'Ancient thermal ray.', stats: { attack: 16, value: 3000 }, icon: '🔥' },
    'Red Robes': { type: 'armor', rarity: 'uncommon', genre: 'scifi', description: 'Hide cybernetic enhancements.', stats: { defense: 2, value: 100 }, icon: '👘' },
    'Mechadendrite': { type: 'misc', rarity: 'rare', genre: 'scifi', description: 'Utility tentacle.', stats: { value: 400 }, icon: '🐙' },

    // === BOUNTY HUNTER (MANDO) SET ===
    'Beskar Ingot': { type: 'misc', rarity: 'rare', genre: 'scifi', description: 'Impervious metal.', stats: { value: 1000 }, icon: '🧱' },
    'Heavy Blaster Pistol': { type: 'weapon', rarity: 'rare', genre: 'scifi', description: 'High stopping power.', stats: { attack: 9, value: 600 }, icon: '🔫' },
    'Amban Sniper Rifle': { type: 'weapon', rarity: 'epic', genre: 'scifi', description: 'Disintegrates targets.', stats: { attack: 20, value: 2000 }, icon: '🔱' },
    'Beskar Armor': { type: 'armor', rarity: 'legendary', genre: 'scifi', description: 'Lightsaber resistant.', stats: { defense: 15, value: 8000 }, icon: '🛡️' },
    'Jetpack': { type: 'misc', rarity: 'epic', genre: 'scifi', description: 'For vertical mobility.', stats: { value: 1500 }, icon: '🚀' },
    'Wrist Flamethrower': { type: 'weapon', rarity: 'rare', genre: 'scifi', description: 'Short range surprise.', stats: { attack: 8, value: 500 }, icon: '🔥' },

    // === JEDI/SITH SET ===
    'Lightsaber (Blue)': { type: 'weapon', rarity: 'legendary', genre: 'scifi', description: 'Elegant weapon for a civilized age.', stats: { attack: 18, value: 5000 }, icon: '🟦' },
    'Lightsaber (Red)': { type: 'weapon', rarity: 'legendary', genre: 'scifi', description: 'Powered by a bled kyber crystal.', stats: { attack: 18, value: 5000 }, icon: '🟥' },
    'Jedi Robes': { type: 'armor', rarity: 'common', genre: 'scifi', description: 'Offers no physical protection.', stats: { defense: 1, value: 50 }, icon: '👘' },
    'Sith Mask': { type: 'armor', rarity: 'rare', genre: 'scifi', description: 'Inspires fear.', stats: { defense: 3, value: 300 }, icon: '👺' },
    'Holocron': { type: 'misc', rarity: 'epic', genre: 'scifi', description: 'Contains ancient knowledge.', stats: { value: 2000 }, icon: '🔮' },

    // === ALIEN HUNTER (XENOMORPH/PREDATOR) SET ===
    'Pulse Rifle': { type: 'weapon', rarity: 'rare', genre: 'scifi', description: '10mm explosive tip caseless.', stats: { attack: 10, value: 500 }, icon: '🔫' },
    'Motion Tracker': { type: 'misc', rarity: 'uncommon', genre: 'scifi', description: 'Beeps when they get close.', stats: { value: 200 }, icon: '📟' },
    'Smartgun': { type: 'weapon', rarity: 'epic', genre: 'scifi', description: 'Auto-tracking heavy machine gun.', stats: { attack: 15, value: 1200 }, icon: '🦾' },
    'Wrist Blades': { type: 'weapon', rarity: 'rare', genre: 'scifi', description: 'Serrated hunting blades.', stats: { attack: 9, value: 400 }, icon: '⚔️' },
    'Plasma Caster': { type: 'weapon', rarity: 'epic', genre: 'scifi', description: 'Shoulder mounted energy cannon.', stats: { attack: 16, value: 1500 }, icon: '∴' },
    'Cloaking Device': { type: 'misc', rarity: 'legendary', genre: 'scifi', description: 'Bends light around the user.', stats: { value: 3000 }, icon: '👻' },

    // === POST-APOCALYPTIC SET ===
    'Pipe Rifle': { type: 'weapon', rarity: 'common', genre: 'scifi', description: 'Handmade and rusty.', stats: { attack: 4, value: 15 }, icon: '🔫' },
    'Scrap Armor': { type: 'armor', rarity: 'common', genre: 'scifi', description: 'Tires and road signs.', stats: { defense: 3, value: 20 }, icon: '🛡️' },
    'Power Fist': { type: 'weapon', rarity: 'rare', genre: 'scifi', description: 'Pneumatic punch.', stats: { attack: 10, value: 400 }, icon: '🥊' },
    'Rad-Away': { type: 'consumable', rarity: 'uncommon', genre: 'scifi', description: 'Removes radiation.', stats: { value: 50 }, icon: '☢️' },
    'Stimpack': { type: 'consumable', rarity: 'common', genre: 'scifi', description: 'Heals injuries.', stats: { value: 30 }, icon: '💉' },
    'Bottle Caps': { type: 'misc', rarity: 'common', genre: 'scifi', description: 'Currency of the wasteland.', stats: { value: 1 }, icon: '🪙' },

    // === VOID EXPLORER SET ===
    'Mining Laser': { type: 'weapon', rarity: 'common', genre: 'scifi', description: 'Cuts rock and hull.', stats: { attack: 6, value: 150 }, icon: '🔦' },
    'Void Suit': { type: 'armor', rarity: 'uncommon', genre: 'scifi', description: 'Pressurized for EVA.', stats: { defense: 2, value: 300 }, icon: '🧑‍🚀' },
    'Magnetic Boots': { type: 'misc', rarity: 'uncommon', genre: 'scifi', description: 'For zero-g environments.', stats: { value: 100 }, icon: '👢' },
    'Oxygen Tank': { type: 'misc', rarity: 'common', genre: 'scifi', description: 'Don\'t run out.', stats: { value: 50 }, icon: '🫧' },
};
