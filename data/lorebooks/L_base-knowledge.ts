
import type { Lorebook } from '../../types';
import { SEXUAL_REPRESENTATION_LOREBOOK_ID } from '../../ids';

export const baseKnowledgeLorebook: Lorebook = {
    id: SEXUAL_REPRESENTATION_LOREBOOK_ID, // Keeping ID to maintain links
    name: "Core RPG Rules",
    description: "Standard mechanics for d20-based adventures.",
    enabled: true,
    timestamp: "2024-01-01T00:00:00.000Z",
    entries: [
    {
        "id": "1",
        "enabled": true,
        "keywords": ["check", "roll", "d20", "skill check"],
        "content": "Skill Check: Determining the outcome of an action. Roll a d20 and add relevant modifiers. 1 is a Critical Failure, 20 is a Critical Success.",
        "timestamp": "2024-01-01T00:00:00.000Z"
    },
    {
        "id": "2",
        "enabled": true,
        "keywords": ["initiative", "combat", "turn"],
        "content": "Initiative: Determines the order of turns in combat. Dexterity is usually the modifier.",
        "timestamp": "2024-01-01T00:00:00.000Z"
    },
    {
        "id": "3",
        "enabled": true,
        "keywords": ["ac", "armor class", "defense"],
        "content": "Armor Class (AC): The difficulty to hit a target. An attack roll must equal or exceed the target's AC to deal damage.",
        "timestamp": "2024-01-01T00:00:00.000Z"
    },
    {
        "id": "4",
        "enabled": true,
        "keywords": ["hp", "hit points", "health"],
        "content": "Hit Points (HP): A measure of vitality. When HP reaches 0, the creature is unconscious or dead.",
        "timestamp": "2024-01-01T00:00:00.000Z"
    },
    {
        id: "5",
        enabled: true,
        keywords: ["short rest", "long rest", "healing"],
        "content": "Resting: A Short Rest (1 hour) allows spending Hit Dice to heal. A Long Rest (8 hours) restores full HP and spell slots.",
        "timestamp": "2024-01-01T00:00:00.000Z"
    }
    ]
};
