
import type { World } from '../../types';
import { DUNGEON_LOREBOOK_ID } from '../../ids';

export const dungeonWorld: World = {
  id: 'world-dungeon-cnc',
  name: 'The Black Iron Dungeon',
  description: 'A cold, damp labyrinth of stone and iron designed for confinement. Hope is scarce here, and the atmosphere is thick with the scent of rust and mold. It is a place of strict hierarchy and punishment.',
  coverImage: 'https://img.freepik.com/premium-photo/dark-dungeon-cell-with-iron-bars-generative-ai_934475-8712.jpg',
  genre: 'horror',
  mechanics: {
    useDice: true,
    statSystem: 'lite',
    attributes: ['Willpower', 'Endurance', 'Obedience']
  },
  lorebookIds: [DUNGEON_LOREBOOK_ID],
  startingScenarios: [
    {
      id: 'scenario-dungeon-awakening',
      title: 'The Cold Cell',
      openingNarration: 'You wake up on the cold stone floor. The only light comes from a flickering torch in the hallway. Chains rattle in the distance. You are the Warden of this place, or perhaps its most prized prisoner?',
      startingLocation: 'Cell Block D',
      requiredInventory: ['Rusty Key', 'Whip']
    },
    {
      id: 'scenario-dungeon-inspection',
      title: 'Morning Inspection',
      openingNarration: 'The heavy iron door creaks open. It is time for inspection. The inhabitants of the dungeon must be counted and their discipline verified.',
      startingLocation: 'The Main Hall',
      requiredInventory: ['Clipboard', 'Baton']
    }
  ],
  theme: {
    font: 'serif',
    primaryColor: '#525252', // neutral-600
    secondaryColor: '#000000', // black
    uiSoundPack: 'horror'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
