
export interface Status {
  location: string;
  appearance: string;
  position: string;
  emotion?: string;
}

export interface ChatSceneState {
  userStatus: Status;
  characterStatus: Status;
}

export interface LorebookEntry {
  id: string;
  keywords: string[];
  content: string;
  summary?: string;
  embedding?: number[];

  enabled: boolean;
  timestamp: string; // ISO string
}

export interface Lorebook {
  id: string;
  name: string;
  description: string;
  entries: LorebookEntry[];
  enabled: boolean;
  timestamp:string; // ISO string
}

export interface Persona {
  id: string;
  name: string;
  avatar: string; // base64 string
  persona: string; // The detailed persona description
  embedding?: number[];
  timestamp?: string; // ISO string
}

export type AiProvider = 'deepseek' | 'gemini' | 'groq' | 'xai';

export interface InstructionalPrompt {
  id: string;
  name: string;
  description: string;
  prompt: string;
  timestamp?: string; // ISO string
  usageContext?: string;
}

// AppSettings now holds global settings, including the system prompt
export interface AppSettings {
  activePersonaId: string | null;
  temperature: number;
  maxTokens: number;
  minTokens: number;
  contextSize: number;
  // Vector Search Settings
  vectorTopK: number; // Number of items to retrieve via RAG

  instructionalPrompts: InstructionalPrompt[];
  enableRelationshipProgression: boolean;
  enableDominanceProgression: boolean;
  enableLustProgression: boolean;
  
  // Memory Cortex Settings
  enableGlobalMemories?: boolean;
  enableAutomaticMemoryGeneration?: boolean;
  enableLearnedStyle?: boolean;
  enableAssociativeMemory?: boolean;
  enableShortTermMemory: boolean;
  enableReflection?: boolean;


  aiProvider: AiProvider;
  aiModel: string;
  deepseekApiKey: string;
  groqApiKey: string;
  googleCloudApiKey: string;
  xaiApiKey: string;
  enableBackgroundKeepAlive?: boolean;
  enableDynamicFirstMessages?: boolean;
  enableXaiAgenticSearch?: boolean;
  enableXaiImageUnderstanding?: boolean;
  enableXaiVideoUnderstanding?: boolean;

  // Image Generation Settings
  imageProvider: 'pollinations' | 'xai' | 'imagen-4' | 'nano-banana';
  enableImageCensorship: boolean;
  sfwMode: boolean;

  // Text-to-Speech Settings
  enableTts: boolean;
  ttsProvider: 'groq' | 'google';
  ttsVoice: string;

  // Cloud Sync Settings
  enableImageSync?: boolean; // New setting for optional image upload
  dropboxAppKey: string;
  dropboxAppSecret: string;
  dropboxRefreshToken: string;
  lastSuccessfulSync: string | null; // ISO string
}

export interface Character {
  id: string;
  name: string;
  avatar: string; // base64 string
  chatBackground: string; // base64 string
  
  // Replaces the big 'persona' block
  tagline: string; // A short, one-line description for character cards.
  core: string; // Core identity: age, race, height, weight, occupation.
  personality: string;
  background: string; // Backstory
  kinks: string;
  summary?: string;
  embedding?: number[];
  timestamp?: string; // ISO string

  scenario: string; // The immediate setting and context of the roleplay
  firstMessage: string;
  exampleMessage: string;
  
  // Default status for scene state
  location: string;
  appearance: string;
  position: string;

  // Link to active lorebooks
  activeLorebookIds: string[];

  // Initial scores for new conversations
  initialRelationshipScore: number;
  initialDominanceScore: number;
}

export interface MessageVersion {
  content: string;
  rating: number; // 0 for unrated, 1-5
  ratingReasons?: string[];
  ratingComment?: string;
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface GeneratedImage {
  b64_json: string;
  revised_prompt: string;
}

export interface ToolCallProposal {
  tool_calls: any[];
  status: 'pending' | 'approved' | 'rejected';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  authorName: string;
  authorAvatar: string;
  versions: MessageVersion[];
  activeVersionIndex: number;
  timestamp?: string; // ISO string
  groundingChunks?: GroundingChunk[];
  images?: { url: string; mimeType?: string; detail: 'auto' | 'low' | 'high' }[]; // User uploaded
  generatedImages?: GeneratedImage[]; // AI generated
  tool_calls?: any[];
  tool_call_id?: string;
  proposals?: ReflectionProposal[];
  toolCallProposals?: ToolCallProposal;
  diceRoll?: { result: number; total: number; label: string }; // Optional dice roll result associated with message
}

export interface Memory {
  id: string;
  content: string;
  timestamp: string; // ISO string
  scope: 'global' | 'character' | 'conversation';
  characterId?: string; // For character-scoped memories
  conversationId?: string;
  conversationPreview?: string;
  characterName?: string;
  embedding?: number[];
  summary?: string;
}

export interface StylePreference {
  id: string;
  content: string;
  timestamp: string; // ISO string
  characterName: string;
  embedding?: number[];
}

export interface Conversation {
  id: string;
  characterId: string; // Now represents the OmniAI entity ID
  personaId?: string;
  preview: string;
  lastMessageAt: string; // ISO string
  relationshipScore: number;
  dominanceScore: number;
  lustScore: number;
  // New properties for per-session roleplaying
  sessionCharacterId?: string | null;
  sessionLorebookIds?: string[];
  contextualConversationIds?: string[];
  chatBackground?: string;
  isVisualizedMode?: boolean;
  isEditorMode?: boolean;
  isIntelligenceInjected?: boolean;
  editorModeContextScope?: 'full' | 'last_20' | 'last_10' | 'last_5' | 'last_3' | 'last_1';
  hasCustomTitle?: boolean;
  // RPG Mode
  isRpgMode?: boolean;
  rpgGameState?: RpgGameState;
  // Multi-World Reference
  worldId?: string;
  lastSaveId?: string; // ID of the last save loaded or created
}

export interface AiResponse {
  content: string;
  newCharacterStatus?: Status;
  newUserStatus?: Status;
  newRelationshipScore?: number;
  newDominanceScore?: number;
  newLustScore?: number;
  groundingChunks?: GroundingChunk[];
}

export interface PromptTemplate {
  id: string;
  name: string;
  prompt: string;
  timestamp?: string; // ISO string
  embedding?: number[];
}

export interface ReflectionProposal {
  id: string; // Unique ID for this specific proposal instance
  type: 'memory' | 'lorebookEntry' | 'lorebook' | 'character' | 'persona' | 'prompt' | 'appSetting' | 'conversation' | 'instructionalPrompt' | 'stylePreference' | 'item' | 'world';
  action: 'add' | 'edit' | 'delete';
  rationale: string;
  // Generic ID for the item being targeted by 'edit' or 'delete'
  targetId?: string; 

  // --- Fields for 'add' or 'edit' actions ---

  // For 'memory', 'lorebookEntry', 'stylePreference'
  content?: string; 
  
  // For 'lorebookEntry'
  keywords?: string[];
  lorebookId?: string; // Parent lorebook ID

  // For 'memory'
  scope?: 'global' | 'character' | 'conversation';
  
  // For 'character', 'lorebook', 'persona', 'prompt', 'conversation', 'item', 'world'
  updatedFields?: any; 
  
  // For 'appSetting'
  key?: keyof AppSettings;
  value?: any;

  // This might be generated by AI, can be used as a fallback for targetId for character type
  characterId?: string;
  
  // Fields for review process
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}


export interface Reflection {
  id: string;
  conversationId: string;
  conversationPreview: string;
  characterId: string;
  characterName: string;
  thoughts: string;
  proposals: ReflectionProposal[];
  timestamp: string;
}

export interface LoreEditProposal {
  entry_id: string;
  new_content: string;
  original_content?: string; // For UI diffing
}

export interface LoreNewProposal {
  id: string; // Temporary client-side ID for UI
  keywords: string[];
  content: string;
  lorebook_id: string;
}

// --- New Action Chat Interfaces ---

export type ActionChatPageContext = 
  | 'prompts'
  | 'personas'
  | 'characters'
  | 'lorebooks'
  | 'memories'
  | 'all';

export interface ActionChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
  toolCallProposals?: ToolCallProposal;
}

export interface ManualExpLogEntry {
  id: string;
  amount: number;
  reason: string; // e.g., the original tip message
  conversationId: string;
  timestamp: string; // ISO string
}

export interface RatingExpLogEntry {
  id: string;
  messageId: string;
  conversationId: string;
  rating: number; // 1-5
  expChange: number;
  timestamp: string; // ISO string
  messagePreview: string;
}

export interface ExpBreakdown {
  creation: {
    title: string;
    value: number;
    details: { name: string; count: number; points: number }[];
  };
  interaction: {
    title: string;
    value: number;
    details: { name: string; count: number; points: number }[];
  };
  learning: {
    title: string;
    value: number;
    details: { name: string; count: number; points: number }[];
  };
  total: number;
}

// --- New RPG Mode Interfaces ---

export interface RpgPlayerStats {
  level: number;
  xp: number;
  power: number;
  maxHp: number;
  currentHp: number;
  maxMp: number;
  currentMp: number;
  attackPower: number;
  defensePower: number;
}

export interface RpgItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'key' | 'misc' | 'spell' | 'skill';
  description?: string;
  quantity: number;
  icon?: string; // Emoji or short string
  equipped?: boolean;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  stats?: {
    attack?: number;
    defense?: number;
    value?: number; // Gold value
    manaCost?: number;
    cooldown?: number;
  };
  genre?: 'fantasy' | 'scifi' | 'modern' | 'universal';
}

export interface RpgNpc {
  name: string;
  role?: string;
  level: number;
  maxHp: number;
  currentHp: number;
  maxMp?: number;
  currentMp?: number;
  attackPower: number;
  defensePower: number;
  xp?: number;
  equipment?: RpgItem[];
  inventory?: RpgItem[];
  skills?: string[];
  powers?: string[];
  gold?: number;
  relationshipScore?: number;
  dominanceScore?: number;
  lustScore?: number;
}

export interface RpgQuest {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  objectives: string[];
}

export interface RpgGameState {
  player: RpgPlayerStats;
  equipment: RpgItem[];
  inventory: RpgItem[];
  skills: string[];
  powers: string[];
  gold: number;
  party: RpgNpc[];
  enemies: RpgNpc[];
  currentNpc: RpgNpc | null;
  quests: RpgQuest[];
}

export interface AvatarEmotionState {
  expression: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'blushing' | 'winking' | 'ahegao' | 'lust' | 'crying' | 'laughing' | 'nervous' | 'sick' | 'love' | 'confused' | 'kissing' | 'hit';
  effect: 'none' | 'glow' | 'shake';
  breathing: 'subtle' | 'heavy' | 'panting';
  scale: number;
}

// --- Multi-World RPG Interfaces ---

export interface Scenario {
  id: string;
  title: string;
  openingNarration: string;
  startingLocation: string;
  requiredInventory?: string[]; // Kept as string[] for simplicity in definitions, converted at runtime
  suggestedAttributes?: Record<string, number>;
}

export interface World {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  genre: 'fantasy' | 'scifi' | 'horror' | 'modern' | 'custom';
  mechanics: {
    useDice: boolean;
    statSystem: 'dnd5e' | 'special' | 'lite' | 'diceless';
    attributes: string[]; // ["STR", "DEX"] or ["Lasers", "Feelings"]
  };
  lorebookIds: string[];
  startingScenarios: Scenario[];
  theme: {
    font: string;
    primaryColor: string;
    secondaryColor: string;
    uiSoundPack?: 'fantasy' | 'tech' | 'horror' | 'none';
  };
  gameMasterNotes?: string;
  createdAt: string; // JSON date
  updatedAt: string; // JSON date
}

// --- Persistence & Save System ---

export interface QuestEntry {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'failed';
  progress: number; // 0-100
  objectives: {
    id: string;
    description: string;
    completed: boolean;
  }[];
  rewards: string[];
  startedAt: string; // ISO Date
  completedAt?: string; // ISO Date
  giverNpcId?: string;
}

export interface SessionMemory {
  id: string;
  gameId: string; // Links to Conversation.id (which acts as the Game ID)
  worldId: string;
  content: string;
  timestamp: string; // ISO Date
  type: 'exploration' | 'combat' | 'dialogue' | 'discovery' | 'milestone';
  relevantQuests: string[];
  npcsMentioned: string[];
  locationTags: string[];
}

export interface GameSave {
  id: string;
  worldId: string;
  scenarioId?: string;
  name: string; // User-defined save name
  description: string; // Auto-generated from context
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
  lastPlayedAt: string; // ISO Date
  
  // Snapshot Data
  campaignProgress: {
    chaptersCompleted: number;
    currentLocation: string;
    playedHours: number;
  };
  
  gameState: RpgGameState;
  inventory: RpgItem[]; // Updated to RpgItem[]
  questLog: QuestEntry[];
  
  // Important: We snapshot critical conversation state to resume
  preview: string;
  characterId: string;
}