




import { GoogleGenAI, Type } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, AppSettings, Reflection, ReflectionProposal, Character, Memory, Lorebook, PromptTemplate, Persona, StylePreference } from '../types';
import { generateOpenAIResponse } from './openai';
import * as embeddingService from './embeddingService';
import { search, type SearchableItem } from './vectorSearch';


// This is a simplified version of the generateWithProvider from memory.ts,
// as the reflection service might have slightly different needs (e.g., higher temperature for creativity).
const generateReflectionPayload = async (prompt: string, schema: any, appSettings: AppSettings): Promise<any> => {
    try {
        let jsonText: string | null = null;
        if (appSettings.aiProvider === 'gemini') {
            const geminiAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await geminiAi.models.generateContent({
                model: appSettings.aiModel,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                    temperature: 0.3,
                }
            });
            jsonText = response.text;
        } else {
             let url = '';
             let apiKey = '';
             if (appSettings.aiProvider === 'deepseek') {
                url = 'https://corsproxy.io/?https://api.deepseek.com/chat/completions';
                apiKey = appSettings.deepseekApiKey;
             } else if (appSettings.aiProvider === 'groq') {
                url = 'https://api.groq.com/openai/v1/chat/completions';
                apiKey = appSettings.groqApiKey;
             } else if (appSettings.aiProvider === 'xai') {
                url = 'https://api.x.ai/v1/chat/completions';
                apiKey = appSettings.xaiApiKey;
             }
             const useJsonMode = appSettings.aiProvider !== 'xai';
             const promptTemplate = appSettings.instructionalPrompts.find(p => p.id === 'meta-cognitive-ai-prompt')?.prompt;
             if (!promptTemplate) {
                 console.error("Critical instructional prompt 'meta-cognitive-ai-prompt' not found.");
                 return null;
             }
             const systemInstruction = promptTemplate.replace('{{schema}}', JSON.stringify(schema, null, 2));
             jsonText = await generateOpenAIResponse(url, apiKey, appSettings.aiModel, prompt, systemInstruction, 0.3, useJsonMode);
        }
        
        if (!jsonText) return null;

        // Using the more robust JSON parsing logic
        try {
            let cleanedJsonText = jsonText.trim();
            const markdownMatch = cleanedJsonText.match(/```json\n([\s\S]*?)\n```/);
            if (markdownMatch && markdownMatch[1]) {
                cleanedJsonText = markdownMatch[1];
            }

            const firstBrace = cleanedJsonText.indexOf('{');
            const firstBracket = cleanedJsonText.indexOf('[');
            let start = -1;

            if (firstBrace === -1) {
                start = firstBracket;
            } else if (firstBracket === -1) {
                start = firstBrace;
            } else {
                start = Math.min(firstBrace, firstBracket);
            }
            
            if (start === -1) {
                throw new Error("No JSON object or array found in the response.");
            }
            
            const lastBrace = cleanedJsonText.lastIndexOf('}');
            const lastBracket = cleanedJsonText.lastIndexOf(']');
            const end = Math.max(lastBrace, lastBracket);

            if (end === -1) {
                throw new Error("Incomplete JSON object or array in the response.");
            }

            const jsonString = cleanedJsonText.substring(start, end + 1);
            return JSON.parse(jsonString);
        } catch (parseError) {
            console.error("Failed to parse JSON response from AI:", jsonText);
            throw new Error("AI returned malformed JSON that could not be cleaned.");
        }

    } catch (error) {
        console.error("Failed to generate reflection payload:", error);
        throw error;
    }
};


const getReflectionPrompt = (
  userMsg: string, 
  aiResponse: string, 
  history: string,
  conversationId: string,
  conversationPreview: string,
  dataContext: string,
  metaContext: string,
  appSettings: AppSettings,
  oldAiResponse?: string
): string => {
  const promptTemplate = appSettings.instructionalPrompts.find(p => p.id === 'reflection-prompt')?.prompt;
  if (!promptTemplate) {
      console.error("Reflection prompt template not found in appSettings. Using fallback.");
      return "Error: Reflection prompt template is missing.";
  }

  let rerollText = '';
  if (oldAiResponse) {
      rerollText = `\n\n**Reroll Context:**
  The user was not satisfied with a previous response and requested a reroll. You are analyzing the NEW response.
  - **Original (Rejected) Response:** "${oldAiResponse}"
  Your analysis in "thoughts" should focus on why the user might have rerolled and if the new response is an improvement.`;
  }

  return promptTemplate
    .replace('{{history}}', history)
    .replace('{{userMsg}}', userMsg)
    .replace('{{aiResponse}}', aiResponse)
    .replace('{{rerollContext}}', rerollText)
    .replace('{{conversationId}}', conversationId)
    .replace('{{conversationPreview}}', conversationPreview)
    .replace('{{dataContext}}', dataContext)
    .replace('{{metaContext}}', metaContext);
};

const buildMetaContext = (allReflections: Reflection[]) => {
    if (!allReflections || allReflections.length === 0) return "None";
    
    // Sort by timestamp desc to get newest first
    const sorted = [...allReflections].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // 1. Recent Thoughts (Last 3)
    const recentThoughts = sorted.slice(0, 3).map(r => `- "${r.thoughts.substring(0, 200)}..."`).join('\n') || "None";

    // 2. Pending Proposals (Everything currently pending)
    // Limit to top 20 to prevent context window bloat and save tokens
    const pending = sorted.flatMap(r => r.proposals).filter(p => p.status === 'pending').slice(0, 20);
    const pendingText = pending.length > 0 
        ? pending.map(p => `- ${p.action} ${p.type}: ${p.content ? `"${p.content.substring(0, 50)}..."` : (p.updatedFields ? JSON.stringify(p.updatedFields).substring(0,50) : 'ID: ' + (p.targetId || 'Unknown'))}`).join('\n')
        : "None";

    // 3. Recently Rejected (Last 10 rejected items to avoid nagging)
    const rejected = sorted.flatMap(r => r.proposals).filter(p => p.status === 'rejected').slice(0, 10);
    const rejectedText = rejected.length > 0
        ? rejected.map(p => `- ${p.action} ${p.type} (Reason: ${p.rejectionReason || 'Unknown'})`).join('\n')
        : "None";

    return `**Recent Thoughts (Maintain Continuity):**\n${recentThoughts}\n\n**Pending Proposals (DO NOT DUPLICATE):**\n${pendingText}\n\n**Recently Rejected (DO NOT RE-PROPOSE):**\n${rejectedText}`;
};

export const generateReflection = async (
  userMessage: ChatMessage,
  aiMessage: ChatMessage,
  history: ChatMessage[],
  appSettings: AppSettings,
  conversationId: string,
  conversationPreview: string,
  characterId: string,
  characterName: string,
  relevantMemories: Memory[],
  allCharacters: Character[],
  activeLorebooks: Lorebook[],
  allPrompts: PromptTemplate[],
  allPersonas: Persona[],
  settings: AppSettings,
  stylePreferences: StylePreference[],
  existingReflections: Reflection[],
  oldAiResponseContent?: string,
): Promise<Reflection | null> => {
  const historyToProcess = history;
  const historyText = historyToProcess.map(m => `${m.authorName}: ${m.versions[m.activeVersionIndex].content}`).join('\n');

  let dataContextForPrompt: string = "Data context could not be generated.";
  
  const buildFallbackContext = () => {
    const memoryList = relevantMemories.length > 0 ? relevantMemories.map(m => `- [ID: ${m.id}, Scope: ${m.scope}] ${m.content}`).join('\n') : 'None';
    const stylePreferenceList = stylePreferences.length > 0 ? stylePreferences.map(s => `- [ID: ${s.id}] ${s.content}`).join('\n') : 'None';
    const characterList = allCharacters.map(c => `- [ID: ${c.id}] ${c.name}: ${c.tagline}\n  Core: ${c.core}\n  Personality: ${c.personality}\n  Appearance: ${c.appearance}`).join('\n');
    const personaList = allPersonas.map(p => `- [ID: ${p.id}] ${p.name}: ${p.persona}`).join('\n');
    const promptList = allPrompts.map(p => `- [ID: ${p.id}] ${p.name}: "${p.prompt}"`).join('\n');
    const lorebookList = activeLorebooks.length > 0 ? activeLorebooks.flatMap(lb => lb.entries.map(e => `- [Lorebook ID: ${lb.id}, Name: "${lb.name}", Entry ID: ${e.id}] Keywords: [${e.keywords.join(', ')}] Content: ${e.content}`)).join('\n') : 'None';
    const instructionalPromptList = appSettings.instructionalPrompts.map(p => `- [ID: ${p.id}] ${p.name} (System): ${p.description}`).join('\n');

    return `
**Current Conversation:**
- [ID: ${conversationId}] Title: "${conversationPreview}"

**EXISTING MEMORIES (These are already known - DO NOT DUPLICATE):**
${memoryList}

**OTHER RELEVANT CONTEXT:**
**Style Preferences:**\n${stylePreferenceList}
**Characters:**\n${characterList}
**Lorebook Entries:**\n${lorebookList}
**Personas:**\n${personaList}
**One-Time Prompts:**\n${promptList}
**Instructional Prompts:**\n${instructionalPromptList}
`;
  };

  if (embeddingService.getEmbeddingStatus() === 'ready') {
      try {
          const queryText = `${userMessage.versions[0].content}\n${aiMessage.versions[0].content}`;
          const queryEmbedding = await embeddingService.embedText(queryText);
          
          // 1. Search for EXISTING MEMORIES (High priority for de-duplication)
          const memoryCorpus: SearchableItem[] = [];
          relevantMemories.forEach(item => { if (item.embedding) memoryCorpus.push({ id: item.id, type: 'memory', content: `[Memory ID: ${item.id}, Scope: ${item.scope}] ${item.content}`, embedding: item.embedding }); });
          const memoryResults = search(queryEmbedding, memoryCorpus, appSettings.vectorTopK || 5);

          // 2. Search for OTHER CONTEXT (Style, Lore, Characters, etc.)
          const otherCorpus: SearchableItem[] = [];
          
          stylePreferences.forEach(item => { if (item.embedding) otherCorpus.push({ id: item.id, type: 'memory', content: `[Style ID: ${item.id}] ${item.content}`, embedding: item.embedding }); });
          
          allCharacters.forEach(item => {
            if (item.embedding) {
                // IMPORTANT: We explicitly exclude the ACTIVE character from vector search here
                // because we will inject their full data separately below to ensure perfect context.
                if (item.id !== characterId) {
                    const fullContent = `[Character ID: ${item.id}] Name: ${item.name}\nTagline: ${item.tagline}\nCore: ${item.core}\nPersonality: ${item.personality}\nBackground: ${item.background}\nAppearance: ${item.appearance}\nScenario: ${item.scenario}`;
                    otherCorpus.push({ id: item.id, type: 'character', content: fullContent, embedding: item.embedding });
                }
            }
          });
          
          allPersonas.forEach(item => {
            if (item.embedding) {
                const fullContent = `[Persona ID: ${item.id}] Name: ${item.name}\nPersona: ${item.persona}`;
                otherCorpus.push({ id: item.id, type: 'character', content: fullContent, embedding: item.embedding });
            }
          });
          
          allPrompts.forEach(item => {
            if (item.embedding) {
                const fullContent = `[Prompt ID: ${item.id}] Name: ${item.name}\nPrompt: "${item.prompt}"`;
                otherCorpus.push({ id: item.id, type: 'memory', content: fullContent, embedding: item.embedding });
            }
          });
          
          activeLorebooks.forEach(lb => lb.entries.forEach(item => { if(item.embedding) otherCorpus.push({ id: item.id, type: 'lorebookEntry', content: `[Lore Entry ID: ${item.id} in "${lb.name}"] ${item.content}`, embedding: item.embedding }); }));
          
          const otherResults = search(queryEmbedding, otherCorpus, appSettings.vectorTopK || 10);
          
          let contextParts = [];

          // *** INJECT ACTIVE CHARACTER FULL DATA ***
          const activeChar = allCharacters.find(c => c.id === characterId);
          if (activeChar) {
              contextParts.push(`**ACTIVE CHARACTER (Full Data for Editing Context):**
[ID: ${activeChar.id}] Name: ${activeChar.name}
Tagline: ${activeChar.tagline}
Core: ${activeChar.core}
Appearance: ${activeChar.appearance}
Personality: ${activeChar.personality}
Background: ${activeChar.background}
Kinks: ${activeChar.kinks}
Scenario: ${activeChar.scenario}
`);
          }

          if (memoryResults.length > 0) {
              contextParts.push(`**EXISTING MEMORIES (These are already known - DO NOT DUPLICATE):**\n${memoryResults.map(item => `- ${item.content} (Similarity: ${item.similarity.toFixed(2)})`).join('\n')}`);
          } else {
              contextParts.push(`**EXISTING MEMORIES (These are already known - DO NOT DUPLICATE):**\nNone found relevant to this exchange.`);
          }

          if (otherResults.length > 0) {
               contextParts.push(`**OTHER RELEVANT CONTEXT:**\n${otherResults.map(item => `- ${item.content} (Similarity: ${item.similarity.toFixed(2)})`).join('\n')}`);
          } else {
               contextParts.push(`**OTHER RELEVANT CONTEXT:**\nNone found relevant to this exchange.`);
          }

          dataContextForPrompt = contextParts.join('\n\n');

      } catch(e) {
          console.error("Vector search for reflection failed, falling back to full context.", e);
          dataContextForPrompt = buildFallbackContext();
      }
  } else {
      dataContextForPrompt = buildFallbackContext();
  }

  const metaContext = buildMetaContext(existingReflections);
  const prompt = getReflectionPrompt(userMessage.versions[0].content, aiMessage.versions[0].content, historyText, conversationId, conversationPreview, dataContextForPrompt, metaContext, settings, oldAiResponseContent);

  const schema = {
    type: Type.OBJECT,
    properties: {
      thoughts: {
        type: Type.STRING,
        description: "Your raw, candid analysis and internal monologue about the last interaction. Identify key learnings or missed opportunities."
      },
      proposals: {
        type: Type.ARRAY,
        description: "A list of concrete, actionable improvement proposals. Leave empty if no high-quality improvements are identified.",
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['memory', 'lorebookEntry', 'lorebook', 'character', 'persona', 'prompt', 'appSetting', 'conversation', 'instructionalPrompt', 'stylePreference', 'item', 'world'] },
            action: { type: Type.STRING, enum: ['add', 'edit', 'delete'] },
            rationale: { type: Type.STRING, description: "A clear, concise reason for this proposal, explaining its benefit." },
            targetId: { type: Type.STRING, description: "Required ID of the item to edit or delete. Find this from the application data lists." },
            content: { type: Type.STRING, description: "The full, substantial text for a 'memory', 'lorebookEntry', or 'stylePreference'. Must be more than a few words." },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of relevant keywords for a 'lorebookEntry'." },
            lorebookId: { type: Type.STRING, description: "Required parent lorebook ID when adding a new 'lorebookEntry'." },
            scope: { type: Type.STRING, enum: ['global', 'character', 'conversation'], description: "Required scope for a 'memory'." },
            updatedFields: { type: Type.OBJECT, description: "A JSON object containing the specific fields and their new values for an 'edit' or 'add' proposal. For 'item' and 'world', this contains the full object structure." },
            key: { type: Type.STRING, description: "The specific AppSettings key to change for an 'appSetting' proposal." },
            value: { type: Type.STRING, description: "The proposed new value for the AppSettings key (represented as a string)." },
          }
        }
      }
    },
    required: ["thoughts", "proposals"]
  };

  try {
    const result = await generateReflectionPayload(prompt, schema, appSettings);
    if (result && result.thoughts) {
      // Ensure proposals are always an array and add default status + ID
      const proposals = (Array.isArray(result.proposals) ? result.proposals : []).map((p: Omit<ReflectionProposal, 'id' | 'status'>) => ({
          ...p,
          id: uuidv4(),
          status: 'pending' as const
      }));
      
      return {
        id: uuidv4(),
        conversationId,
        conversationPreview,
        characterId,
        characterName,
        thoughts: result.thoughts,
        proposals: proposals,
        timestamp: new Date().toISOString()
      };
    }
  } catch(e) {
      console.error("Error during reflection generation:", e);
      throw e;
  }

  return null;
};