
import type { Character, ChatMessage, AppSettings, ChatSceneState, AiResponse, Lorebook, Status, Persona, Memory, Reflection, PromptTemplate, RpgGameState, GroundingChunk } from '../types';
import { streamOpenAIResponse } from './openai';
import { buildSystemInstruction } from './prompt-builder';

// --- xAI Specific Interfaces for v1/responses (Agentic Search) ---

interface XaiInputMessage {
    role: string;
    content: string | any[];
}

interface XaiTool {
    type: 'web_search' | 'x_search';
    web_search?: {
        filters?: {
            allowed_domains?: string[];
            excluded_domains?: string[];
        };
    };
    x_search?: {
        allowed_x_handles?: string[];
        excluded_x_handles?: string[];
    };
    enable_image_understanding?: boolean;
    enable_video_understanding?: boolean;
}

interface XaiResponseRequest {
    model: string;
    input: XaiInputMessage[]; // Documentation uses "input" for v1/responses
    tools?: XaiTool[];
    temperature?: number;
    stream?: boolean;
}

interface XaiAnnotation {
    type: string;
    url?: string;
}

interface XaiContentItem {
    type: string; // e.g. "output_text"
    text?: string;
    annotations?: XaiAnnotation[];
}

interface XaiOutputItem {
    type: string; // e.g. "message", "custom_tool_call"
    role?: string;
    content?: XaiContentItem[];
    status?: string;
}

interface XaiAgenticResponse {
    id: string;
    // v1/responses structure variants:
    // 1. Direct text in 'response'
    response?: string; 
    // 2. Standard OpenAI 'choices'
    choices?: {
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }[];
    // 3. Complex reasoning/tool output in 'output'
    output?: XaiOutputItem[];
    // Root level citations (sometimes present)
    citations?: string[]; 
}

/**
 * Specialized fetch for xAI Agentic Search using the v1/responses endpoint.
 * This is ONLY used when search is enabled.
 */
async function generateXaiAgenticResponse(
    apiKey: string,
    model: string,
    messages: XaiInputMessage[],
    temperature: number,
    appSettings: AppSettings
): Promise<{ content: string; citations: string[] }> {
    
    const tools: XaiTool[] = [];

    // 1. Configure Web Search Tool (Proprietary format)
    // Note: xAI puts enable_image_understanding INSIDE the tool object, not as a global param
    const webSearchTool: XaiTool = { 
        type: 'web_search',
        enable_image_understanding: appSettings.enableXaiImageUnderstanding
    };
    tools.push(webSearchTool);

    // 2. Configure X (Twitter) Search Tool
    const xSearchTool: XaiTool = { 
        type: 'x_search',
        enable_image_understanding: appSettings.enableXaiImageUnderstanding,
        enable_video_understanding: appSettings.enableXaiVideoUnderstanding
    };
    tools.push(xSearchTool);

    // 3. Construct Payload conforming to v1/responses
    const payload: XaiResponseRequest = {
        model,
        input: messages, // Mapping messages to "input" field
        tools: tools, 
        temperature,
        stream: false // We force non-streaming to reliably capture the root-level citations array
    };

    const response = await fetch('https://api.x.ai/v1/responses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`xAI Agentic Search API Error (v1/responses): ${errorText}`);
    }

    const data = await response.json() as XaiAgenticResponse;
    
    let content = '';
    const extractedCitations: string[] = [];

    // Strategy 1: Check for 'output' array (Reasoning/Tool models)
    if (data.output && Array.isArray(data.output)) {
        for (const item of data.output) {
            // We only care about assistant messages with content
            if (item.type === 'message' && item.role === 'assistant' && Array.isArray(item.content)) {
                for (const contentItem of item.content) {
                    if (contentItem.type === 'output_text' && contentItem.text) {
                        content += contentItem.text;
                        
                        // Extract citations nested in annotations
                        if (contentItem.annotations && Array.isArray(contentItem.annotations)) {
                            contentItem.annotations.forEach(annotation => {
                                if (annotation.url) {
                                    extractedCitations.push(annotation.url);
                                }
                            });
                        }
                    }
                }
            }
        }
    }
    
    // Strategy 2: Check for direct 'response' field (Simpler models)
    if (!content && data.response) {
        content = data.response;
    } 
    
    // Strategy 3: Fallback to OpenAI 'choices' format
    if (!content && data.choices && data.choices.length > 0) {
        content = data.choices[0].message?.content || '';
    }

    // If still no content, log the full response for debugging
    if (!content) {
        console.warn('Unexpected xAI response structure:', JSON.stringify(data, null, 2));
    }

    // Merge root-level citations if present
    if (Array.isArray(data.citations)) {
        extractedCitations.push(...data.citations);
    }

    // Deduplicate citations
    const uniqueCitations = Array.from(new Set(extractedCitations));

    return { content, citations: uniqueCitations };
}

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
  
  // Build System Instruction
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
    userPersona,
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

  // Map messages to API format
  // Note: v1/responses uses "input" with the same structure as messages
  const messages: any[] = historyToProcess.map(msg => {
    // Handle image attachments for xAI (standard image_url content type works for both endpoints)
    if (msg.role === 'user' && msg.images && msg.images.length > 0) {
        const content: any[] = [];
        
        const textContent = msg.versions[msg.activeVersionIndex].content;
        if (textContent.trim()) {
            content.push({ type: 'text', text: textContent });
        } else {
            // xAI generally expects some text with images
            content.push({ type: 'text', text: 'Analyze this image.' });
        }

        msg.images.forEach(image => {
            content.push({
                type: 'image_url',
                image_url: {
                    url: image.url,
                    detail: image.detail || 'auto'
                }
            });
        });

        return { role: 'user', content };
    }

    return {
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.versions[msg.activeVersionIndex].content
    };
  });
  
  // Handle Reroll injection
  if (isReroll && historyToProcess.length === 0) {
    const rerollPrompt = appSettings.instructionalPrompts.find(p => p.id === 'reroll-prompt')?.prompt || "Please provide an alternative opening message for the character, following all persona and scenario guidelines.";
    messages.push({
        role: 'user',
        content: rerollPrompt
    });
  }
  
  // Final array of messages/input
  const apiMessages = [
    { role: 'system', content: systemInstruction },
    ...messages,
  ];

  if (apiMessages.length <= 1) {
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
  temperature = Math.max(0, Math.min(temperature, 2.0));

  const modelToUse = appSettings.aiProvider === 'xai' ? appSettings.aiModel : 'grok-4-fast-non-reasoning';

  // --- BRANCH: AGENTIC SEARCH (Using v1/responses) ---
  // Only enabled if explicitly toggled and NOT in RPG/Game mode (to avoid interference with game state)
  if (appSettings.enableXaiAgenticSearch && !isRpgMode) {
      try {
          // Use grok-4-fast for search tasks if not already selected
          // (Agentic Search works best with grok-4-fast or beta models)
          const searchModel = modelToUse.includes('grok') ? 'grok-4-fast' : modelToUse;

          const { content, citations } = await generateXaiAgenticResponse(
              appSettings.xaiApiKey,
              searchModel,
              apiMessages, // Passes as 'input'
              temperature,
              appSettings
          );
          
          // Map xAI citations strings (URLs) to the app's GroundingChunk format
          const groundingChunks: GroundingChunk[] = citations.map(url => ({
              web: { uri: url, title: url }
          }));

          // Since v1/responses with search doesn't stream reliably for metadata, we push full text
          onStream(content);

          return { content, groundingChunks };
      } catch (error) {
          console.error('xAI Agentic Search failed, falling back to standard chat:', error);
          onStream("\n[Search failed. Continuing with standard response...]\n");
          // Fallthrough to standard streamOpenAIResponse below if specific search fails
      }
  }

  // --- BRANCH: STANDARD CHAT (Standard OpenAI Format via v1/chat/completions) ---
  try {
    const fullText = await streamOpenAIResponse(
        'https://api.x.ai/v1/chat/completions',
        appSettings.xaiApiKey,
        modelToUse,
        apiMessages,
        temperature,
        appSettings.maxTokens,
        onStream,
        undefined // No tools passed here for standard chat
    );
    
    // --- Post-Processing for Roleplay Status Blocks ---
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
    console.error('Failed to fetch from xAI API:', error);
    let errorMessage = "An error occurred while connecting to the AI.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    onStream(errorMessage);
    return { content: errorMessage };
  }
};

export const generateXaiImages = async (
  prompt: string,
  numImages: number,
  appSettings: AppSettings,
): Promise<{ b64_json: string; revised_prompt: string }[]> => {
  const apiKey = appSettings.xaiApiKey;
  if (!apiKey) {
    throw new Error("xAI API key is missing. Please add it in the settings.");
  }

  const censorshipPrompt = appSettings.instructionalPrompts.find(p => p.id === 'image-censorship-prompt')?.prompt || '';
  
  const XAI_PROMPT_LIMIT = 1024;
  let finalPrompt: string;

  if (appSettings.enableImageCensorship) {
    const availableLength = XAI_PROMPT_LIMIT - censorshipPrompt.length - 1; // -1 for safety
    const truncatedPrompt = prompt.length > availableLength ? prompt.substring(0, availableLength) : prompt;
    finalPrompt = `${truncatedPrompt}${censorshipPrompt}`;
  } else {
    finalPrompt = prompt.length > XAI_PROMPT_LIMIT ? prompt.substring(0, XAI_PROMPT_LIMIT) : prompt;
  }

  const response = await fetch('https://api.x.ai/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-2-image',
      prompt: finalPrompt,
      n: numImages,
      response_format: 'b64_json',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorBody = JSON.parse(errorText);
      const errorMessage = errorBody?.error?.message || JSON.stringify(errorBody);
      throw new Error(`xAI Image API Error: ${errorMessage}`);
    } catch (e) {
      throw new Error(`xAI Image API request failed with status ${response.status}: ${errorText}`);
    }
  }

  const result = await response.json();
  if (!result.data) {
    throw new Error("Invalid response from xAI Image API: 'data' field is missing.");
  }

  // Update the revised_prompt to what was actually sent, if the API doesn't provide it.
  const processedData = result.data.map((item: any) => ({
    b64_json: item.b64_json,
    revised_prompt: item.revised_prompt || finalPrompt
  }));

  return processedData;
};
