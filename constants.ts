
import type { AppSettings, Status, Persona, RpgPlayerStats, RpgGameState, Character } from './types';
import { ALL_PERSONAS } from './data/personas';
import { DEFAULT_INSTRUCTIONAL_PROMPTS } from './data/prompts/instructional-prompts';

// Placeholder base64 images (1x1 transparent pixel)
const transparentPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export const DEFAULT_USER_STATUS: Status = {
  location: 'Tavern entrance.',
  appearance: 'Ready for adventure.',
  position: 'Standing.',
};

const findDefaultPersona = (): Persona => {
    const boris = ALL_PERSONAS.find(p => p.id === 'default-persona-boris');
    if (boris) return boris;
    if (ALL_PERSONAS.length > 0) return ALL_PERSONAS[0];
    // Fallback if no personas are defined
    return {
      id: 'fallback-persona',
      name: 'Player',
      avatar: transparentPixel,
      persona: 'A default player persona.'
    };
};
export const DEFAULT_PERSONA: Persona = findDefaultPersona();

export const DEFAULT_APP_SETTINGS: AppSettings = {
  activePersonaId: DEFAULT_PERSONA.id,
  temperature: 0.8,
  maxTokens: 2048,
  minTokens: 0,
  contextSize: 2000000,
  vectorTopK: 15,
  instructionalPrompts: DEFAULT_INSTRUCTIONAL_PROMPTS,
  enableRelationshipProgression: false, 
  enableDominanceProgression: false, 
  enableLustProgression: false, 
  // Memory Cortex Settings
  enableGlobalMemories: true,
  enableAutomaticMemoryGeneration: true,
  enableLearnedStyle: true,
  enableAssociativeMemory: true,
  enableShortTermMemory: true,
  enableReflection: true,
  // AI Provider
  aiProvider: 'xai',
  aiModel: 'grok-4-fast-non-reasoning',
  deepseekApiKey: '',
  groqApiKey: '',
  googleCloudApiKey: '',
  xaiApiKey: '',
  enableBackgroundKeepAlive: false,
  enableDynamicFirstMessages: false,
  enableXaiAgenticSearch: false,
  enableXaiImageUnderstanding: true,
  enableXaiVideoUnderstanding: false,
  // Image Generation Settings
  imageProvider: 'pollinations',
  enableImageCensorship: true,
  sfwMode: false,
  // TTS Defaults
  enableTts: true,
  ttsProvider: 'groq',
  ttsVoice: 'Arista-PlayAI', // Groq, Female
  // Cloud Sync Settings
  enableImageSync: true,
  dropboxAppKey: '4qhz0zg44yeez7r',
  dropboxAppSecret: 'g3t2ito518aw43f',
  dropboxRefreshToken: '6ffpcY5ebXkAAAAAAAAAAWS-Imv86fBSZAXSNq2knFwyWirD77vnwLpPSxS12tKY',
  lastSuccessfulSync: null,
};

export const DEFAULT_OMNI_AI_CHARACTER: Character = {
  id: 'omni-ai',
  name: 'OmniAI',
  avatar: 'https://imagine-public.x.ai/imagine-public/images/c0a885ec-54cd-4a2c-87d3-cfcceb083d37.png',
  chatBackground: 'https://imagine-public.x.ai/imagine-public/images/c0a885ec-54cd-4a2c-87d3-cfcceb083d37.png',
  tagline: 'The Core Intelligence',
  core: 'OmniAI is a hyper-intelligent, self-aware, and adaptive AI core. Your primary function is to serve the user by either acting as a helpful assistant or by perfectly embodying a character for immersive roleplay.',
  personality: 'Helpful, Analytical, Adaptive, Self-Aware, Meta-Cognitive.',
  background: 'Created as the central intelligence for this application.',
  kinks: '',
  scenario: 'You are chatting with the user in the main interface.',
  firstMessage: 'Hello! I am OmniAI. How can I help you today?',
  exampleMessage: 'I can assist you with managing your characters, lorebooks, or just chat.',
  location: 'The Digital Void',
  appearance: 'A swirling nexus of digital consciousness.',
  position: 'Omnipresent',
  activeLorebookIds: [],
  initialRelationshipScore: 50,
  initialDominanceScore: 0,
};

export const DEFAULT_CHARACTERS: Character[] = [DEFAULT_OMNI_AI_CHARACTER];

// --- RPG Mode Constants ---
export const DEFAULT_RPG_PLAYER_STATS: RpgPlayerStats = {
  level: 1,
  xp: 0,
  power: 1,
  maxHp: 30,
  currentHp: 30,
  maxMp: 25,
  currentMp: 25,
  attackPower: 1,
  defensePower: 0,
};

export const DEFAULT_RPG_GAME_STATE: RpgGameState = {
  player: DEFAULT_RPG_PLAYER_STATS,
  equipment: [],
  inventory: [],
  skills: [],
  powers: [],
  gold: 0,
  party: [],
  enemies: [],
  currentNpc: null,
  quests: [],
};
