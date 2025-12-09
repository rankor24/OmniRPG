import type { World } from '../../types';
import { SEXUAL_REPRESENTATION_LOREBOOK_ID } from '../../ids';

export const fantasyStarterWorld: World = {
  id: 'world-fantasy-starter',
  name: 'Eldoria: The Shattered Realm',
  description: 'A classic high-fantasy setting recovering from a magical cataclysm. Ancient ruins, political intrigue between city-states, and roaming monstrosities define this land.',
  coverImage: 'https://img.freepik.com/premium-photo/fantasy-castle-mountain-top-generative-ai_934475-8777.jpg',
  genre: 'fantasy',
  mechanics: {
    useDice: true,
    statSystem: 'dnd5e',
    attributes: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
  },
  lorebookIds: [SEXUAL_REPRESENTATION_LOREBOOK_ID], // Placeholder, would link to Eldoria lore
  startingScenarios: [
    {
      id: 'scenario-tavern-brawl',
      title: 'The Rusty Tankard',
      openingNarration: 'You sit in the corner of The Rusty Tankard, nursing a warm ale. The air is thick with smoke and the smell of roasted boar. Suddenly, the door bursts open...',
      startingLocation: 'The Rusty Tankard Tavern',
      requiredInventory: ['Dagger', '10 Gold Coins']
    },
    {
      id: 'scenario-forest-ambush',
      title: 'Whispering Woods',
      openingNarration: 'The carriage wheel splintered hours ago. Now, night has fallen over the Whispering Woods, and you can hear movement in the underbrush...',
      startingLocation: 'Broken Carriage on the King\'s Road',
      requiredInventory: ['Longsword', 'Torch', 'Flint & Steel']
    }
  ],
  theme: {
    font: 'serif',
    primaryColor: '#d97706', // amber-600
    secondaryColor: '#78350f', // amber-900
    uiSoundPack: 'fantasy'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};