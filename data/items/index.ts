
import { v4 as uuidv4 } from 'uuid';
import type { RpgItem } from '../../types';
import { FANTASY_ITEMS } from './I_fantasy';
import { SCIFI_ITEMS } from './I_scifi';
import { MODERN_ITEMS } from './I_modern';
import { MAGIC_SPELLS } from './I_magic';
import { COMBAT_SKILLS } from './I_skills';

export const createItem = (
    name: string, 
    type: RpgItem['type'], 
    description: string, 
    quantity: number = 1,
    stats?: RpgItem['stats'],
    icon?: string
): RpgItem => ({
    id: uuidv4(),
    name,
    type,
    description,
    quantity,
    stats,
    icon
});

const ALL_ITEMS_RECORD: Record<string, Partial<RpgItem>> = {
    ...FANTASY_ITEMS,
    ...SCIFI_ITEMS,
    ...MODERN_ITEMS,
    ...MAGIC_SPELLS,
    ...COMBAT_SKILLS
};

// Convert static record to array for state initialization
export const DEFAULT_LIBRARY_ITEMS: RpgItem[] = Object.entries(ALL_ITEMS_RECORD).map(([name, partial]) => ({
    id: uuidv4(),
    name: name,
    type: partial.type || 'misc',
    quantity: 1,
    description: partial.description || '',
    stats: partial.stats,
    icon: partial.icon,
    rarity: partial.rarity || 'common',
    genre: partial.genre || 'universal'
}));

// Helper to look up an item in a dynamic list
export const findItemTemplate = (name: string, library: RpgItem[]): RpgItem | null => {
    if (!library || library.length === 0) return null;

    // Direct match
    const direct = library.find(i => i.name.toLowerCase() === name.toLowerCase());
    if (direct) return direct;

    // Partial match fallback (e.g. "Rusty Dagger" matches "Dagger")
    // We prioritize longer matches to avoid false positives
    const lowerName = name.toLowerCase();
    const partial = library.find(i => lowerName.includes(i.name.toLowerCase()));
    
    return partial || null;
};
