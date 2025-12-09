import type { World } from '../../types';

export const horrorAsylumWorld: World = {
  id: 'world-horror-asylum',
  name: 'Blackwood Asylum',
  description: 'A psychological horror setting set in a decrepit insane asylum in 1920s New England. Ancient entities whisper from the walls.',
  coverImage: 'https://img.freepik.com/premium-photo/haunted-house-night-fog-generative-ai_934475-8798.jpg',
  genre: 'horror',
  mechanics: {
    useDice: false,
    statSystem: 'lite',
    attributes: ['Sanity', 'Stamina', 'Observation']
  },
  lorebookIds: [],
  startingScenarios: [
    {
      id: 'scenario-awakening',
      title: 'The Cell',
      openingNarration: 'You awaken in a padded room. The door is slightly ajar. Distant screaming echoes through the hallway. You have no memory of how you arrived here.',
      startingLocation: 'Cell 404',
      requiredInventory: ['Hospital Gown']
    }
  ],
  theme: {
    font: 'serif',
    primaryColor: '#7f1d1d', // red-900
    secondaryColor: '#000000', // black
    uiSoundPack: 'horror'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};