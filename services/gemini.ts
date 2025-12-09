import { GoogleGenAI, Modality, Type, FunctionDeclaration } from "@google/genai";
import type { Character, ChatMessage, AppSettings, ChatSceneState, AiResponse, Lorebook, Status, Persona, GroundingChunk, Memory, Reflection, PromptTemplate, RpgGameState } from '../types';
import { buildSystemInstruction } from './prompt-builder';
import { DEFAULT_RPG_GAME_STATE } from '../constants';

const rpgNpcSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        role: { type: Type.STRING },
        level: { type: Type.INTEGER },
        maxHp: { type: Type.INTEGER },
        currentHp: { type: Type.INTEGER },
        maxMp: { type: Type.INTEGER },
        currentMp: { type: Type.INTEGER },
        attackPower: { type: Type.INTEGER },
        defensePower: { type: Type.INTEGER },
        xp: { type: Type.INTEGER },
        equipment: { type: Type.ARRAY, items: { type: Type.STRING } },
        inventory: { type: Type.ARRAY, items: { type: Type.STRING } },
        skills: { type: Type.ARRAY, items: { type: Type.STRING } },
        powers: { type: Type.ARRAY, items: { type: Type.STRING } },
        gold: { type: Type.INTEGER },
        relationshipScore: { type: Type.INTEGER },
        dominanceScore: { type: Type.INTEGER },
        lustScore: { type: Type.INTEGER },
    },
    required: ["name", "level", "maxHp", "currentHp", "attackPower", "defensePower"],
};

const rpgStateFunctionDeclaration: FunctionDeclaration = {
  name: 'updateRpgState',
  description: 'Updates the entire game state for the RPG mode. This function must be called at the end of every turn with the new state.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      player: {
        type: Type.OBJECT,
        properties: {
          level: { type: Type.INTEGER },
          xp: { type: Type.INTEGER },
          power: { type: Type.INTEGER },
          maxHp: { type: Type.INTEGER },
          currentHp: { type: Type.INTEGER },
          maxMp: { type: Type.INTEGER },
          currentMp: { type: Type.INTEGER },
          attackPower: { type: Type.INTEGER },
          defensePower: { type: Type.INTEGER },
        },
        required: ["level", "xp", "power", "maxHp", "currentHp", "maxMp", "currentMp", "attackPower", "defensePower"],
      },
      gold: { type: Type.INTEGER },
      equipment: { type: Type.ARRAY, items: { type: Type.STRING } },
      inventory: { type: Type.ARRAY, items: { type: Type.STRING } },
      skills: { type: Type.ARRAY, items: { type: Type.STRING } },
      powers: { type: Type.ARRAY, items: { type: Type.STRING } },
      party: { type: Type.ARRAY, items: rpgNpcSchema },
      enemies: { type: Type.ARRAY, items: rpgNpcSchema },
      currentNpc: { ...rpgNpcSchema, type: Type.OBJECT, properties: rpgNpcSchema.properties }, // Allow null by not requiring it
    },
    required: ["player", "gold", "equipment", "inventory", "skills", "powers", "party", "enemies"],
  },
};

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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

  const contents: any[] = historyToProcess.map(msg => {
    return {
        role: msg.role === 'user' ? msg.role : 'model',
        parts: [{ text: msg.versions[msg.activeVersionIndex].content }]
    };
  });
  
  if (isReroll && contents.length === 0) {
    const rerollPrompt = appSettings.instructionalPrompts.find(p => p.id === 'reroll-prompt')?.prompt || "Please provide an alternative opening message for the character, following all persona and scenario guidelines.";
    contents.push({
        role: 'user',
        parts: [{ text: rerollPrompt }]
    });
  }

  if (contents.length === 0) {
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
  
  const config: any = {
      systemInstruction,
      temperature,
  };
  
  if (appSettings.maxTokens > 0) {
    config.maxOutputTokens = appSettings.maxTokens;
    if (appSettings.aiModel.includes('flash')) {
      config.thinkingConfig = { thinkingBudget: Math.max(1, Math.floor(appSettings.maxTokens * 0.5)) };
    }
  }

  if (enableGoogleSearch) {
      config.tools = [{googleSearch: {}}];
  }

  if (isRpgMode) {
      config.tools = [{functionDeclarations: [rpgStateFunctionDeclaration]}];
  }

  const modelToUse = appSettings.aiProvider === 'gemini' ? appSettings.aiModel : 'gemini-2.5-flash';

  try {
    const streamingResult = await ai.models.generateContentStream({
        model: modelToUse,
        contents,
        config
    });

    let fullText = '';
    const allGroundingChunks: GroundingChunk[] = [];
    let aggregatedFunctionCalls: any[] = [];

    for await (const chunk of streamingResult) {
        const textChunk = chunk.text;
        if (textChunk) {
            fullText += textChunk;
            onStream(textChunk);
        }
        if (chunk.functionCalls) {
            aggregatedFunctionCalls.push(...chunk.functionCalls);
        }
        const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
        if (groundingMetadata?.groundingChunks) {
            allGroundingChunks.push(...groundingMetadata.groundingChunks);
        }
    }
    
    const uniqueGroundingChunks = allGroundingChunks.filter((v, i, a) => a.findIndex(t => t.web?.uri === v.web?.uri) === i);
    
    if (isRoleplaying) {
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
            groundingChunks: uniqueGroundingChunks,
        };
    }
    
    return { content: fullText, groundingChunks: uniqueGroundingChunks };
   
  } catch (error) {
    console.error('Failed to fetch from Gemini API:', error);
    let errorMessage = "An error occurred while connecting to the AI.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    onStream(errorMessage);
    return { content: errorMessage };
  }
};

export const generateImagen4Image = async (
  prompt: string,
  appSettings: AppSettings
): Promise<{ b64_json: string; revised_prompt: string }[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const censorshipPrompt = appSettings.instructionalPrompts.find(p => p.id === 'image-censorship-prompt')?.prompt || '';
  const finalPrompt = appSettings.enableImageCensorship ? `${prompt}${censorshipPrompt}` : prompt;

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: finalPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages.map(img => ({
        b64_json: img.image.imageBytes,
        revised_prompt: finalPrompt, // Imagen 4 API doesn't seem to return a revised prompt
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to generate image with Imagen 4:', error);
    throw error;
  }
};

export const generateNanoBananaImage = async (
  prompt: string,
  appSettings: AppSettings
): Promise<{ b64_json: string; revised_prompt: string }[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const censorshipPrompt = appSettings.instructionalPrompts.find(p => p.id === 'image-censorship-prompt')?.prompt || '';
  const finalPrompt = appSettings.enableImageCensorship ? `${prompt}${censorshipPrompt}` : prompt;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: finalPrompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const generatedImages: { b64_json: string; revised_prompt: string }[] = [];
    let responseText = '';

    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedImages.push({
            b64_json: part.inlineData.data,
            revised_prompt: '' // Will be filled later with text part
          });
        } else if (part.text) {
          responseText += part.text;
        }
      }
    }
    
    // Assign the text part as the revised prompt for all generated images
    if(generatedImages.length > 0) {
        return generatedImages.map(img => ({...img, revised_prompt: responseText || finalPrompt }));
    }

    return [];
  } catch (error) {
    console.error('Failed to generate image with Nano Banana:', error);
    throw error;
  }
};