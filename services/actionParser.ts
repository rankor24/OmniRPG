
import type { World } from '../types';

export interface Suggestion {
    label: string;
    actionText: string;
    type: 'move' | 'interact' | 'combat' | 'dialogue';
}

export const extractSuggestedActions = (narrative: string, world: World): Suggestion[] => {
    const suggestions: Suggestion[] = [];
    const lowerNarrative = narrative.toLowerCase();

    // Basic heuristic-based parsing
    if (lowerNarrative.includes("door") && (lowerNarrative.includes("locked") || lowerNarrative.includes("closed"))) {
        suggestions.push({ label: "Open Door", actionText: "I attempt to open the door.", type: "interact" });
        if (world.mechanics.useDice) {
            suggestions.push({ label: "Kick Door", actionText: "I try to kick the door down!", type: "combat" });
        }
    }

    if (lowerNarrative.includes("chest") || lowerNarrative.includes("crate")) {
        suggestions.push({ label: "Loot", actionText: "I search the container for loot.", type: "interact" });
    }

    if (lowerNarrative.includes("attack") || lowerNarrative.includes("enemy") || lowerNarrative.includes("goblin") || lowerNarrative.includes("bandit")) {
        suggestions.push({ label: "Attack", actionText: "I attack the enemy with my weapon!", type: "combat" });
        suggestions.push({ label: "Defend", actionText: "I take a defensive stance.", type: "combat" });
    }

    if (lowerNarrative.includes("ask") || lowerNarrative.includes("says") || lowerNarrative.includes("whispers")) {
        suggestions.push({ label: "Talk", actionText: "I speak to them.", type: "dialogue" });
    }
    
    // Always add a generic "Look Around" if nothing specific found
    if (suggestions.length === 0) {
        suggestions.push({ label: "Look Around", actionText: "I look around the area carefully.", type: "interact" });
    }

    return suggestions;
};

export const parseNarrative = (text: string): { type: 'dialogue' | 'narration' | 'action', content: string }[] => {
    // This is a simple parser. In a real app, this would be more robust.
    const chunks: { type: 'dialogue' | 'narration' | 'action', content: string }[] = [];
    
    // Split by newlines first
    const lines = text.split('\n');
    
    for (const line of lines) {
        if (!line.trim()) continue;
        
        // Check for dialogue (quotes)
        // This regex splits by quotes, keeping the delimiters
        const parts = line.split(/(".*?")/g);
        
        for (const part of parts) {
            if (!part.trim()) continue;
            
            if (part.startsWith('"') && part.endsWith('"')) {
                chunks.push({ type: 'dialogue', content: part });
            } else if (part.startsWith('*') && part.endsWith('*')) {
                 chunks.push({ type: 'action', content: part.replace(/\*/g, '') });
            } else {
                chunks.push({ type: 'narration', content: part });
            }
        }
    }
    
    return chunks;
};
