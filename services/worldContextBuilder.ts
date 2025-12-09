import type { World, AppSettings } from '../types';

export const buildWorldContext = (world: World): string => {
    let context = `\n\n**WORLD SETTING: ${world.name.toUpperCase()}**\n`;
    context += `**Genre:** ${world.genre.toUpperCase()}\n`;
    context += `**Description:** ${world.description}\n`;
    
    context += `\n**GAME MECHANICS:**\n`;
    if (world.mechanics.useDice) {
        context += `- **Dice System:** The game uses a ${world.mechanics.statSystem === 'dnd5e' ? 'd20 system (D&D 5e style)' : 'standard dice pool'} for resolution.\n`;
    } else {
        context += `- **Dice System:** Diceless/Narrative based resolution.\n`;
    }
    
    context += `- **Key Attributes:** ${world.mechanics.attributes.join(', ')}.\n`;
    
    if (world.gameMasterNotes) {
        context += `\n**GM NOTES:**\n${world.gameMasterNotes}\n`;
    }

    return context;
};

export const getAttributeModifiers = (world: World, attributeValue: number): number => {
    if (world.mechanics.statSystem === 'dnd5e') {
        return Math.floor((attributeValue - 10) / 2);
    }
    return attributeValue; // Default 1:1 for other systems
};

export const shouldParseMagic = (world: World): boolean => {
    // Only parse magic points/slots if the genre supports it
    return ['fantasy', 'custom', 'horror'].includes(world.genre);
};
