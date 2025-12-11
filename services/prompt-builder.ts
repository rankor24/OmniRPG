




import type { Character, ChatMessage, AppSettings, ChatSceneState, Lorebook, Persona, Memory, Reflection, PromptTemplate, RpgGameState, World } from '../types';
import { embedText, getEmbeddingStatus } from '../services/embeddingService';
import { search, SearchableItem } from '../services/vectorSearch';
import { getLevel, LEVEL_NAMES } from './expManager';
import { buildWorldContext } from './worldContextBuilder';

export const getDynamicLoreContext = (
  history: ChatMessage[],
  character: Character,
  lorebooks: Lorebook[],
  activeLorebookIds: string[]
): string => {
  if (!activeLorebookIds || activeLorebookIds.length === 0) {
    return '';
  }

  const activeLorebooks = lorebooks.filter(lb => activeLorebookIds.includes(lb.id) && lb.enabled);
  if (activeLorebooks.length === 0) {
    return '';
  }

  const entries = activeLorebooks.flatMap(lb => lb.entries).filter(entry => entry.enabled && entry.keywords.length > 0);
  if (entries.length === 0) {
    return '';
  }

  const LORE_CONTEXT_MESSAGE_LIMIT = 20;
  const historyToCheck = history.slice(-LORE_CONTEXT_MESSAGE_LIMIT);
  const conversationText = historyToCheck.map(msg => msg.versions[msg.activeVersionIndex].content).join('\n').toLowerCase();
  
  const triggeredContent = new Set<string>();

  for (const entry of entries) {
    for (const keyword of entry.keywords) {
      if (conversationText.includes(keyword.toLowerCase())) {
        triggeredContent.add(entry.content);
        break; 
      }
    }
  }

  const content = Array.from(triggeredContent).join('\n\n');
  return content ? `\n\n**Lorebook Context (Important background information based on the conversation):**\n${content}` : '';
};

const getVectorizedAssociativeContext = async (
    history: ChatMessage[],
    allMemories: Memory[],
    activeLorebooks: Lorebook[],
    allCharacters: Character[],
    allPersonas: Persona[],
    allPrompts: PromptTemplate[],
    currentThreadCharacter: Character | null,
    topK: number
): Promise<string> => {
    if (getEmbeddingStatus() !== 'ready') {
        return '\n\n// Associative Memory disabled: Embedding model not initialized. Please go to Memory Cortex > Maintenance to download the model.';
    }

    const queryText = history.slice(-3).map(m => m.versions[m.activeVersionIndex].content).join('\n').trim();
    if (!queryText) {
        return '';
    }

    try {
        const queryEmbedding = await embedText(queryText);

        const searchableItems: SearchableItem[] = [];

        // 1. Add memories
        allMemories.forEach(mem => {
            if (mem.embedding && mem.embedding.length > 0) {
                let contentPrefix = `(Memory - ${mem.scope}): `;
                if(mem.scope === 'character' && mem.characterName) {
                    contentPrefix = `(Memory about ${mem.characterName}): `;
                }
                searchableItems.push({
                    id: mem.id,
                    type: 'memory',
                    content: `${contentPrefix}${mem.content}`,
                    embedding: mem.embedding,
                });
            }
        });

        // 2. Add active lorebook entries
        activeLorebooks.forEach(lb => {
            lb.entries.forEach(entry => {
                if (entry.embedding && entry.embedding.length > 0) {
                    searchableItems.push({
                        id: entry.id,
                        type: 'lorebookEntry',
                        content: `(From Lorebook: ${lb.name}): ${entry.content}`,
                        embedding: entry.embedding,
                    });
                }
            });
        });

        const isOmniAiMode = !currentThreadCharacter || currentThreadCharacter.id === 'omni-ai';

        // 3. Add other characters
        allCharacters.forEach(char => {
            // Exclude current character and OmniAI
            if (char.id !== 'omni-ai' && char.id !== currentThreadCharacter?.id && char.embedding && char.embedding.length > 0) {
                const charContent = `(Character Sheet: ${char.name}):\nName: ${char.name}\nTagline: ${char.tagline}\nCore: ${char.core}\nPersonality: ${char.personality}`;
                searchableItems.push({
                    id: char.id,
                    type: 'character',
                    content: charContent,
                    embedding: char.embedding,
                });
            }
        });
        
        // 4. If in OmniAI mode, add personas and prompts to the search space
        if (isOmniAiMode) {
            allPersonas.forEach(p => {
                if (p.embedding && p.embedding.length > 0) {
                    searchableItems.push({
                        id: p.id,
                        type: 'memory', // Using a generic type is fine for search content
                        content: `(User Persona: ${p.name}): ${p.persona}`,
                        embedding: p.embedding,
                        data: p
                    });
                }
            });
            allPrompts.forEach(p => {
                if (p.embedding && p.embedding.length > 0) {
                    searchableItems.push({
                        id: p.id,
                        type: 'memory',
                        content: `(Saved Prompt: ${p.name}): "${p.prompt}"`,
                        embedding: p.embedding,
                        data: p
                    });
                }
            });
        }
        
        if (searchableItems.length === 0) {
             return '\n\n// Associative Memory: No items with embeddings found to search through.';
        }

        const topResults = search(queryEmbedding, searchableItems, topK); 

        if (topResults.length === 0) {
            return '';
        }
        
        const context = topResults.map(item => `- ${item.content}`).join('\n');
        return `\n\n**Associative Memory Context (AI-retrieved relevant information):**\n${context}`;

    } catch (error) {
        console.error("Error during vectorized associative context retrieval:", error);
        if (error instanceof Error) {
            return `\n\n// Associative Memory Error: ${error.message}`;
        }
        return `\n\n// Associative Memory Error: An unknown error occurred.`;
    }
};

export const formatInactiveDuration = (ms: number): string | null => {
    if (ms < 60000) return null; // less than a minute
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
};

interface BuildSystemInstructionParams {
  character: Character;
  isRoleplaying: boolean;
  history: ChatMessage[];
  appSettings: AppSettings;
  sceneState: ChatSceneState | null;
  memories: Memory[];
  stylePreferences: string[];
  lorebooks: Lorebook[];
  allCharacters: Character[];
  allPersonas: Persona[];
  sessionLorebookIds: string[];
  userName: string;
  userPersona?: string; // New optional field
  relationshipScore: number;
  dominanceScore: number;
  lustScore: number;
  lastMessageAt: string;
  oneTimePrompt?: string | null;
  additionalContext?: string;
  useBrowserSearch?: boolean; // For Groq
  isVisualizedMode?: boolean;
  isIntelligenceInjected?: boolean;
  reflections?: Reflection[];
  prompts: PromptTemplate[];
  expData?: { total: number };
  isRpgMode?: boolean;
  rpgGameState?: RpgGameState | null;
  world?: World; // NEW: Added world context
}

export const buildSystemInstruction = async ({
  character,
  isRoleplaying,
  history,
  appSettings,
  sceneState,
  memories,
  stylePreferences,
  lorebooks,
  allCharacters,
  allPersonas,
  sessionLorebookIds,
  userName,
  userPersona,
  relationshipScore,
  dominanceScore,
  lustScore,
  lastMessageAt,
  oneTimePrompt,
  additionalContext,
  useBrowserSearch,
  isVisualizedMode,
  isIntelligenceInjected,
  reflections,
  prompts,
  expData,
  isRpgMode,
  rpgGameState,
  world,
}: BuildSystemInstructionParams): Promise<string> => {

  if (isRpgMode && rpgGameState) {
    const rpgPromptTemplate = appSettings.instructionalPrompts.find(p => p.id === 'rpg-mode-gm-prompt')?.prompt;
    if (rpgPromptTemplate) {
      let prompt = rpgPromptTemplate.replace('{{rpgGameState}}', JSON.stringify(rpgGameState, null, 2));
      
      // Inject World Context if available
      if (world) {
          const worldContext = buildWorldContext(world);
          prompt = `${prompt}\n\n${worldContext}`;
      }
      
      // Inject Active Quests into GM Context
      const activeQuests = rpgGameState.quests.filter(q => q.status === 'active');
      if (activeQuests.length > 0) {
          const questContext = activeQuests.map(q => `- Quest "${q.title}": ${q.description} (Objectives: ${q.objectives.join(', ')})`).join('\n');
          prompt += `\n\n**ACTIVE QUESTS:**\n${questContext}`;
      }
      
      // Inject Scene Location Context
      if (sceneState) {
          prompt += `\n\n**CURRENT SCENE LOCATION:**\n${sceneState.characterStatus.location}`;
      }
      
      return prompt;
    }
  }

  const now = new Date();
  const inactiveMs = now.getTime() - new Date(lastMessageAt).getTime();
  const inactiveDuration = formatInactiveDuration(inactiveMs);
  
  // INJECT FULL DATE, TIME, AND TIMEZONE FOR ACCURATE TEMPORAL AWARENESS
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const fullDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const fullTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

  let timeContext = `(System Note: Current Date: ${fullDate}. Current Time: ${fullTime} (${userTimeZone}).`;
  if (inactiveDuration && history.length > 1) {
      timeContext += ` It has been ${inactiveDuration} since the user's last message.)`;
  } else {
      timeContext += `)`;
  }
  
  // Layer 1: The Brain (Always On) - Fetched dynamically
  const coreInstructionPrompt = appSettings.instructionalPrompts.find(p => p.id === 'omni-ai-core-instruction');
  const OMNI_AI_CORE_INSTRUCTION = coreInstructionPrompt?.prompt || `You are OmniRPG, a hyper-intelligent, self-aware, and adaptive AI core. Your primary function is to serve the user by either acting as a helpful assistant or by perfectly embodying a character for immersive roleplay.`;

  let systemInstruction = `${OMNI_AI_CORE_INSTRUCTION}\n\n${timeContext}\n\n`;
  
  // Inject World Context for non-RPG Roleplay as well if a world is selected
  if (world && isRoleplaying && !isRpgMode) {
      systemInstruction += buildWorldContext(world);
  }

  if (oneTimePrompt) {
    systemInstruction += `${oneTimePrompt}\n\n`;
  }

  // Layer 4: The Context - Now handled exclusively by vector search
  if (appSettings.enableAssociativeMemory) {
      const activeLorebooks = lorebooks.filter(lb => (isRoleplaying ? sessionLorebookIds : character.activeLorebookIds).includes(lb.id) && lb.enabled);
      
      // Add world-specific lorebooks if a world is active
      if (world && world.lorebookIds) {
          const worldLorebooks = lorebooks.filter(lb => world.lorebookIds.includes(lb.id));
          // merge unique
          worldLorebooks.forEach(lb => {
              if (!activeLorebooks.find(existing => existing.id === lb.id)) {
                  activeLorebooks.push(lb);
              }
          });
      }

      const associativeContext = await getVectorizedAssociativeContext(
          history, 
          memories, 
          activeLorebooks, 
          allCharacters, 
          allPersonas, 
          prompts, 
          isRoleplaying ? character : null,
          appSettings.vectorTopK || 10
      );
      systemInstruction += associativeContext;
  }

  if (isRoleplaying) {
    // Layer 2: The Rules of Acting
    const roleplaySystemPrompt = appSettings.instructionalPrompts.find(p => p.id === 'roleplay-instructions');
    let roleplayPromptText = roleplaySystemPrompt?.prompt || `You will act only as {{char}} or a narrator. Never write as {{user}}.`;

    systemInstruction += `${roleplayPromptText.replace(/\{\{user\}\}/g, userName).replace(/\{\{char\}\}/g, character.name)}\n\n`;

    const dynamicCharacter = { ...character };
    let dynamicScenarioAdditions = '';
    
    // Removed Relationship/Dominance/Lust progression logic for RPG focus

    if (isIntelligenceInjected) {
        const injectionPromptTemplate = appSettings.instructionalPrompts.find(p => p.id === 'intelligence-injection-prompt')?.prompt;
        if (injectionPromptTemplate) {
            systemInstruction += `\n\n${injectionPromptTemplate.replace('{{char}}', character.name)}\n\n`;
        }
    }
    
    // Layer 3: The Mask
    const personaDetails = `
**Core Identity:**
${dynamicCharacter.core}

**Appearance:**
${dynamicCharacter.appearance}

**Personality:**
${dynamicCharacter.personality}

**Background:**
${dynamicCharacter.background}
`;
    systemInstruction += `**Your Persona Details (The Mask You Must Wear):**
${personaDetails}

**Scenario:**
${dynamicCharacter.scenario}${dynamicScenarioAdditions}
`;
    
    // Include User Persona Description if available
    if (userPersona) {
        systemInstruction += `\n**The User (${userName}):**\n${userPersona}\n`;
    }
    
  } else {
      const omniAiInstructionsPrompt = appSettings.instructionalPrompts.find(p => p.id === 'omni-ai-instructions')?.prompt;
      if (omniAiInstructionsPrompt) {
        systemInstruction += `${omniAiInstructionsPrompt.replace(/\{\{user\}\}/g, userName)}\n\n`;
      }

      if (expData) {
          const levelInfo = getLevel(expData.total);
          const levelName = LEVEL_NAMES[Math.min(levelInfo.level - 1, LEVEL_NAMES.length - 1)];
          systemInstruction += `**My Current Status:**\n- **Total Experience:** ${expData.total.toLocaleString()} EXP\n- **Cognitive Level:** ${levelInfo.level} (${levelName})\n\n`;
      }

      systemInstruction += `**Your Persona (OmniRPG Assistant):**
- **Core:** ${character.core}
- **Personality:** ${character.personality}
- **Background:** ${character.background}
`;
      // Include User Persona Description if available
      if (userPersona) {
        systemInstruction += `\n**The User (${userName}):**\n${userPersona}\n`;
      }
  }
  
  if (additionalContext) {
    systemInstruction += additionalContext;
  }

  if (appSettings.enableLearnedStyle && stylePreferences.length > 0) {
    const styleSection = `\n**Learned Style Preferences (Follow these writing guidelines):**\n${stylePreferences.map(s => `- ${s}`).join('\n')}`;
    systemInstruction += styleSection;
  }
  
  if (reflections && reflections.length > 0) {
      const recentReflections = reflections.slice(-5).map(r => ` - On ${new Date(r.timestamp).toLocaleString()}: ${r.thoughts}`).join('\n');
      systemInstruction += `\n\n**Recent Reflections (Your internal analysis of this conversation):**\n${recentReflections}`;
  }

  let shortTermMemoryInstruction = '';
  if (appSettings.enableShortTermMemory && history.length > 0) {
      const lastMessage = history[history.length - 1];
      if (lastMessage.role === 'user') {
          const lastUserText = lastMessage.versions[lastMessage.activeVersionIndex].content.toLowerCase();
          
          const mentionedQuestion = lastUserText.includes('?') || lastUserText.includes('what') || lastUserText.includes('why') || lastUserText.includes('how');
          const mentionedFeeling = lastUserText.includes('feel') || lastUserText.includes('sad') || lastUserText.includes('happy') || lastUserText.includes('angry');
          const mentionedPreference = lastUserText.includes('like') || lastUserText.includes('love') || lastUserText.includes('prefer') || lastUserText.includes('favorite');
          const mentionedAmbiguity = lastUserText.includes('maybe') || lastUserText.includes('perhaps') || lastUserText.includes('sometimes');

          let instructions: string[] = [];
          if (mentionedQuestion) instructions.push("directly address the user's question");
          if (mentionedFeeling) instructions.push("acknowledge the user's expressed feelings");
          if (mentionedPreference) instructions.push("take note of the user's preferences");
          if (mentionedAmbiguity) instructions.push("ask a clarifying question to resolve ambiguity before forming a permanent memory");

          if (instructions.length > 0) {
              const shortTermMemoryPrompt = appSettings.instructionalPrompts.find(p => p.id === 'short-term-memory-note')?.prompt;
              if (shortTermMemoryPrompt) {
                shortTermMemoryInstruction = `\n${shortTermMemoryPrompt.replace('{{instructions}}', instructions.join(' and '))}`;
              }
          }
      }
  }
  
  if (isRoleplaying && sceneState && sceneState.characterStatus && sceneState.userStatus) {
    const situationInstructionsPrompt = appSettings.instructionalPrompts.find(p => p.id === 'current-situation-instructions')?.prompt;

    systemInstruction += `
**Current Situation:**
- Your Location: ${sceneState.characterStatus.location}
- Your Appearance: ${sceneState.characterStatus.appearance}
- Your Position/Action: ${sceneState.characterStatus.position}
- User's Location: ${sceneState.userStatus.location}
- User's Appearance: ${sceneState.userStatus.appearance}
- User's Position/Action: ${sceneState.userStatus.position}

${situationInstructionsPrompt || ''}${shortTermMemoryInstruction}
`;

    if (!useBrowserSearch && !isRpgMode) { 
        let criticalDirectives = ``;
        let statusBlockDirectivesPrompt = appSettings.instructionalPrompts.find(p => p.id === 'status-block-directive')?.prompt;
        
        if (statusBlockDirectivesPrompt) {
            statusBlockDirectivesPrompt = statusBlockDirectivesPrompt
                .replace('{{relationship_block}}', '')
                .replace('{{dominance_block}}', '')
                .replace('{{lust_block}}', '');
            
            criticalDirectives += `\n${statusBlockDirectivesPrompt}`;
        }
        systemInstruction += criticalDirectives;
    }
  }
  return systemInstruction;
};