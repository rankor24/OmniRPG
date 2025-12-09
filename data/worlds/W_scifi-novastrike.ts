import type { World } from '../../types';

export const scifiNovaStrikeWorld: World = {
  id: 'world-scifi-novastrike',
  name: 'NovaStrike: 2199',
  description: 'A cyberpunk dystopia ruled by megacorporations. Neon lights hide the grime of the lower levels where hackers and mercenaries fight for survival.',
  coverImage: 'https://img.freepik.com/premium-photo/cyberpunk-city-street-night-generative-ai_934475-8755.jpg',
  genre: 'scifi',
  mechanics: {
    useDice: true,
    statSystem: 'special',
    attributes: ['Cybernetics', 'Hacking', 'Combat', 'Social', 'Tech']
  },
  lorebookIds: [],
  startingScenarios: [
    {
      id: 'scenario-corp-heist',
      title: 'The Data Heist',
      openingNarration: 'The rain sizzles against the neon sign of "Club V0iD". Your contact is late. You check the data shard in your pocket—it\'s hot, stolen from Arasaka Corp just an hour ago.',
      startingLocation: 'Club V0iD, Sector 4',
      requiredInventory: ['Smart Pistol', 'Data Deck', 'Encrypted Shard']
    },
    {
      id: 'scenario-street-doc',
      title: 'Backalley Surgery',
      openingNarration: 'You wake up on a metal slab. The smell of antiseptic and ozone is overwhelming. A "Ripperdoc" with a robotic eye is looming over you. "Payment first," he grunts.',
      startingLocation: 'Dr. Stitch\'s Clinic',
      requiredInventory: ['Credstick (Empty)', 'Combat Knife']
    }
  ],
  theme: {
    font: 'monospace',
    primaryColor: '#06b6d4', // cyan-500
    secondaryColor: '#1e1b4b', // indigo-950
    uiSoundPack: 'tech'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};