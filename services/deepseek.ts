
import type { Character, ChatMessage, AppSettings, ChatSceneState, AiResponse, Lorebook, Status, Persona, GroundingChunk, Memory, Reflection, PromptTemplate, RpgGameState } from '../types';
import { streamOpenAIResponse } from './openai';
import { buildSystemInstruction } from './prompt-builder';

export const getAiResponse = async (
  character: Character,
  isRoleplaying: boolean,
  history: ChatMessage[],
  isReroll: boolean = false,
  appSettings: AppSettings,
  sceneState: ChatSceneState | null,
  memories: Memory[],
  stylePreferences: string[],
  lorebooks: Lorebook[],
  allCharacters: Character[],
  allPersonas: Persona[],
  sessionLorebookIds: string[],
  userPersona: string,
  userName: string,
  relationshipScore: number,
  dominanceScore: number,
  lustScore: number,
  lastMessageAt: string,
  enableGoogleSearch: boolean,
  onStream: (chunk: string) => void,
  prompts: PromptTemplate[],
  oneTimePrompt?: string | null,
  additionalContext?: string,
  isVisualizedMode?: boolean,
  isIntelligenceInjected?: boolean,
  reflections?: Reflection[],
  isRpgMode?: boolean,
  rpgGameState?: RpgGameState,
): Promise<AiResponse> => {
  const systemInstruction = await buildSystemInstruction({
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
    userPersona, // Passing userPersona description
    relationshipScore,
    dominanceScore,
    lustScore,
    lastMessageAt,
    oneTimePrompt,
    additionalContext,
    isVisualizedMode,
    isIntelligenceInjected,
    reflections,
    prompts,
    isRpgMode,
    rpgGameState,
  });

  const historyToProcess = history;


  const messages = [
    { role: 'system', content: systemInstruction },
    ...historyToProcess.map(msg => {
        return {
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.versions[msg.activeVersionIndex].content
        };
    })
  ];
  
  if (isReroll && historyToProcess.length === 0) {
    const rerollPrompt = appSettings.instructionalPrompts.find(p => p.id === 'reroll-prompt')?.prompt || "Please provide an alternative opening message for the character, following all persona and scenario guidelines.";
    messages.push({
        role: 'user',
        content: rerollPrompt
    });
  }

  if (messages.length <= 1) { // Only system prompt exists
    const errorMsg = "Cannot generate a response without any message history to use as a prompt.";
    onStream(errorMsg);
    return { content: errorMsg };
  }

  let temperature = appSettings.temperature;

  // Lust progression bonus
  if (isRoleplaying && appSettings.enableLustProgression && lustScore && lustScore > 0) {
      const lustBonus = (lustScore / 100) * 0.15;
      temperature += lustBonus;
  }

  // Reroll bonus
  if (isReroll) {
    temperature += 0.1;
  }

  // Clamp to new range
  temperature = Math.max(0, Math.min(temperature, 2.0));

  const modelToUse = appSettings.aiProvider === 'deepseek' ? appSettings.aiModel : 'deepseek-chat';

  try {
    const fullText = await streamOpenAIResponse(
        'https://corsproxy.io/?https://api.deepseek.com/chat/completions', // Public CORS Proxy
        appSettings.deepseekApiKey,
        modelToUse,
        messages,
        temperature,
        appSettings.maxTokens,
        onStream
    );
    
    if (isRoleplaying && !isRpgMode) {
        const newCharacterStatus: Status = { location: '', appearance: '', position: '' };
        const newUserStatus: Status = { location: '', appearance: '', position: '' };
        let finalRelationshipScore: number | undefined = undefined;
        let finalDominanceScore: number | undefined = undefined;
        let finalLustScore: number | undefined = undefined;
        let characterStatusFound = false;

        const charStatusBlockRegex = /\[CHARACTER STATUS\]([\s\S]*?)(?=\n\n|\[USER STATUS\]|$)/s;
        const charBlockMatch = fullText.match(charStatusBlockRegex);

        if (charBlockMatch) {
            characterStatusFound = true;
            const blockContent = charBlockMatch[1];
            
            newCharacterStatus.location = blockContent.match(/Location: (.*)/)?.[1].trim() || '';
            newCharacterStatus.appearance = blockContent.match(/Appearance: (.*)/)?.[1].trim() || '';
            newCharacterStatus.position = blockContent.match(/Position: (.*)/)?.[1].trim() || '';

            const relMatch = blockContent.match(/Relationship: (.*)/);
            if (relMatch) {
                const relScoreMatch = relMatch[1].match(/(-?\d+)/);
                if (relScoreMatch) finalRelationshipScore = parseInt(relScoreMatch[1], 10);
            }

            const domMatch = blockContent.match(/Dominance: (.*)/);
            if (domMatch) {
                const domScoreMatch = domMatch[1].match(/(-?\d+)/);
                if (domScoreMatch) finalDominanceScore = parseInt(domScoreMatch[1], 10);
            }
            
            const lustMatch = blockContent.match(/Lust: (.*)/);
            if (lustMatch) {
                const lustScoreMatch = lustMatch[1].match(/(\d+)/);
                if (lustScoreMatch) finalLustScore = parseInt(lustScoreMatch[1], 10);
            }
        }

        const userStatusRegex = /\[USER STATUS\]\s*Location: (.*?)\nAppearance: (.*?)\nPosition: (.*?)(?=\n\n|$)/s;
        const userMatch = fullText.match(userStatusRegex);
        if (userMatch) {
            newUserStatus.location = userMatch[1].trim();
            newUserStatus.appearance = userMatch[2].trim();
            newUserStatus.position = userMatch[3].trim();
        }

        return {
            content: fullText,
            newCharacterStatus: characterStatusFound ? newCharacterStatus : undefined,
            newUserStatus: userMatch ? newUserStatus : undefined,
            newRelationshipScore: isReroll ? undefined : finalRelationshipScore,
            newDominanceScore: isReroll ? undefined : finalDominanceScore,
            newLustScore: isReroll ? undefined : finalLustScore,
        };
    }
    
    return { content: fullText };
   
  } catch (error) {
    console.error('Failed to fetch from DeepSeek API:', error);
    let errorMessage = "An error occurred while connecting to the AI.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    onStream(errorMessage);
    return { content: errorMessage };
  }
};
