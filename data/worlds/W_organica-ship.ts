
import type { World } from '../../types';
import { ORGANICA_SHIP_LOREBOOK_ID } from '../../ids';

export const organicaShipWorld: World = {
  id: 'world-organica-ship',
  name: 'Organica: The Living Vessel',
  description: 'A crashed bio-organic spaceship that is alive. The ship itself, Vita, shapes her flesh to serve the needs of the crew, blurring the line between technology and biology. Walls pulse, and doors breathe.',
  coverImage: 'https://img.freepik.com/premium-photo/organic-alien-spaceship-interior-generative-ai_934475-8766.jpg',
  genre: 'scifi',
  mechanics: {
    useDice: false,
    statSystem: 'special',
    attributes: ['Bio-Sync', 'Tech', 'Sanity']
  },
  lorebookIds: [ORGANICA_SHIP_LOREBOOK_ID],
  startingScenarios: [
    {
      id: 'scenario-organica-wakeup',
      title: 'Cryo-Awakening',
      openingNarration: 'You wake up. The pod around you isn\'t metal; it\'s warm, soft, and pulsing. The air smells sweet, like ozone and flowers. A voice whispers in your mind, "Welcome home, Captain."',
      startingLocation: 'Bio-Stasis Chamber',
      requiredInventory: ['Neural Interface', 'Utility Jumpsuit']
    },
    {
      id: 'scenario-organica-bridge',
      title: 'The Neural Bridge',
      openingNarration: 'You stand on the bridge. The viewscreen is a giant, organic eye peering out at the landscape. The ship\'s avatar, Vita, materializes from the floor to report on the ship\'s status.',
      startingLocation: 'Command Bridge',
      requiredInventory: ['Command Codes', 'Datapad']
    }
  ],
  theme: {
    font: 'monospace',
    primaryColor: '#d946ef', // fuchsia-500
    secondaryColor: '#4a044e', // fuchsia-950
    uiSoundPack: 'tech'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
