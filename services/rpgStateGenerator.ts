
import { GoogleGenAI, Type } from "@google/genai";
import type { AppSettings, RpgGameState } from '../types';
import { generateOpenAIResponse } from './openai';

// This is a simplified, low-temperature version of generateWithProvider from memory.ts
async function generateJsonPayload(prompt: string, schema: any, appSettings: AppSettings): Promise<any> {
    const temperature = 0.1; // Force low temperature for reliable data generation
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
                    temperature: temperature,
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
             const useJsonMode = true; // STRICT override for xAI/DeepSeek
             const promptTemplate = appSettings.instructionalPrompts.find(p => p.id === 'json-expert-prompt')?.prompt;
             if (!promptTemplate) {
                 console.error("Critical instructional prompt 'json-expert-prompt' not found.");
                 return null;
             }
             const systemInstruction = promptTemplate.replace('{{schema}}', JSON.stringify(schema, null, 2));
             jsonText = await generateOpenAIResponse(url, apiKey, appSettings.aiModel, prompt, systemInstruction, temperature, useJsonMode);
        }
        
        if (!jsonText) return null;

        try {
            // More robust cleanup: find the first '{' or '[' and the last '}' or ']'
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
            console.error("Failed to parse JSON response from state generator:", jsonText);
            throw new Error("AI returned malformed JSON that could not be cleaned.");
        }
    } catch (error) {
        console.error("Failed to generate RPG state payload:", error);
        throw error;
    }
}


export async function generateRpgStateUpdate(
    previousState: RpgGameState,
    userAction: string,
    gmNarrative: string,
    appSettings: AppSettings
): Promise<RpgGameState | null> {
    const promptTemplate = appSettings.instructionalPrompts.find(p => p.id === 'rpg-state-update-prompt')?.prompt;
    if (!promptTemplate) {
        console.error("RPG state update prompt template not found.");
        return null;
    }
    
    // Remove any [Sys | ...] blocks from narrative to avoid confusing the state generator
    const cleanNarrative = gmNarrative.replace(/(\[Sys\s*\|[\s\S]*?\])/, '').trim();

    const prompt = promptTemplate
        .replace('{{previousRpgState}}', JSON.stringify(previousState, null, 2))
        .replace('{{userAction}}', userAction)
        .replace('{{gmNarrative}}', cleanNarrative);
    
    const rpgItemSchema = {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['weapon', 'armor', 'consumable', 'key', 'misc'] },
            quantity: { type: Type.INTEGER },
            description: { type: Type.STRING },
            icon: { type: Type.STRING, description: "A single emoji representing the item" },
            equipped: { type: Type.BOOLEAN },
            stats: {
                type: Type.OBJECT,
                properties: {
                    attack: { type: Type.INTEGER },
                    defense: { type: Type.INTEGER },
                    value: { type: Type.INTEGER }
                }
            }
        },
        required: ["name", "type", "quantity"]
    };

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
            equipment: { type: Type.ARRAY, items: rpgItemSchema },
            inventory: { type: Type.ARRAY, items: rpgItemSchema },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            powers: { type: Type.ARRAY, items: { type: Type.STRING } },
            gold: { type: Type.INTEGER },
            relationshipScore: { type: Type.INTEGER },
            dominanceScore: { type: Type.INTEGER },
            lustScore: { type: Type.INTEGER },
        },
        required: ["name", "level", "maxHp", "currentHp", "attackPower", "defensePower"],
    };

    const schema = {
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
            equipment: { type: Type.ARRAY, items: rpgItemSchema },
            inventory: { type: Type.ARRAY, items: rpgItemSchema },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            powers: { type: Type.ARRAY, items: { type: Type.STRING } },
            party: { type: Type.ARRAY, items: rpgNpcSchema },
            enemies: { type: Type.ARRAY, items: rpgNpcSchema },
            currentNpc: { ...rpgNpcSchema, type: Type.OBJECT, properties: rpgNpcSchema.properties }, // Allow null by not requiring it
        },
        required: ["player", "gold", "equipment", "inventory", "skills", "powers", "party", "enemies"],
    };
    
    const result = await generateJsonPayload(prompt, schema, appSettings);
    
    if (result && result.player) {
        // Ensure currentNpc can be null
        if (!result.currentNpc) {
            result.currentNpc = null;
        }
        return result as RpgGameState;
    }
    
    return null;
}
