
import type { World } from '../../types';
import { VAMPIRE_CASTLE_LOREBOOK_ID } from '../../ids';

export const vampireCastleWorld: World = {
  id: 'world-vampire-castle',
  name: 'The Sovereign Void Citadel',
  description: 'An ancient gothic citadel towering over a blighted land. Ruled by a Vampire Lord, it is a place of dark opulence, blood magic, and eternal servitude. Shadows whisper in the corridors.',
  coverImage: 'https://img.freepik.com/premium-photo/gothic-castle-night-full-moon-generative-ai_934475-8744.jpg',
  genre: 'fantasy',
  mechanics: {
    useDice: true,
    statSystem: 'dnd5e',
    attributes: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
  },
  lorebookIds: [VAMPIRE_CASTLE_LOREBOOK_ID],
  startingScenarios: [
    {
      id: 'scenario-castle-throne',
      title: 'The Lord\'s Court',
      openingNarration: 'You lounge upon the marble throne of the Sovereign Void. The massive doors creak open as your Orc guards drag in a new "guest" or perhaps a tribute from the nearby village.',
      startingLocation: 'Main Throne Room',
      requiredInventory: ['Signet Ring', 'Goblet of Blood']
    },
    {
      id: 'scenario-castle-dungeon',
      title: 'The Inspections',
      openingNarration: 'You descend into the lower levels of the citadel. The air grows colder. Your servants and thralls await your judgment and your commands.',
      startingLocation: 'Dungeon Entrance',
      requiredInventory: ['Dungeon Keys', 'Torch']
    }
  ],
  theme: {
    font: 'serif',
    primaryColor: '#7f1d1d', // red-900
    secondaryColor: '#1a1a1a', // almost black
    uiSoundPack: 'horror'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
