
import type { World } from '../../types';
import { EBONY_WHORUS_LOREBOOK_ID } from '../../ids';

export const tribalEbonyWorld: World = {
  id: 'world-tribal-ebony',
  name: 'The Ebony Enclave',
  description: 'A lush, isolated jungle sanctuary ruled by the Ebony Whorus tribe. A strict matriarchy where outsiders are rare and often treated with intense curiosity or reverence as "divine" guests.',
  coverImage: 'https://img.freepik.com/premium-photo/fantasy-jungle-village-huts-generative-ai_934475-8733.jpg',
  genre: 'fantasy',
  mechanics: {
    useDice: true,
    statSystem: 'special',
    attributes: ['Divinity', 'Stamina', 'Charisma']
  },
  lorebookIds: [EBONY_WHORUS_LOREBOOK_ID],
  startingScenarios: [
    {
      id: 'scenario-tribal-arrival',
      title: 'The Outsider',
      openingNarration: 'You stumble out of the dense jungle into a clearing. Before you stands a village of intricate huts. Tall, imposing women with bead-adorned skin pause their work to stare at you. A hush falls over the tribe.',
      startingLocation: 'Village Gates',
      requiredInventory: ['Tattered Clothes', 'Water Skin']
    },
    {
      id: 'scenario-tribal-throne',
      title: 'The Divine Seat',
      openingNarration: 'You sit upon a woven throne in the Great Hut. The Matriarchs have declared you a divine entity. The tribe gathers to offer their "worship" and tributes.',
      startingLocation: 'The Great Hut',
      requiredInventory: ['Ceremonial Robes', 'Offering Bowl']
    }
  ],
  theme: {
    font: 'serif',
    primaryColor: '#166534', // green-700
    secondaryColor: '#3f2c22', // deep brown
    uiSoundPack: 'fantasy'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
