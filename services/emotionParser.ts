


import { GoogleGenAI, Type } from "@google/genai";
import type { AppSettings, AvatarEmotionState } from '../types';
import { generateOpenAIResponse } from './openai';

const defaultState: Partial<AvatarEmotionState> = {
  expression: 'neutral',
  effect: 'none',
  breathing: 'subtle',
  scale: 1,
};

const emotionSchema = {
    type: Type.OBJECT,
    properties: {
        expression: { type: Type.STRING, enum: ['neutral', 'happy', 'sad', 'angry', 'surprised', 'blushing', 'winking', 'ahegao', 'lust', 'crying', 'laughing', 'nervous', 'sick', 'love', 'confused'] },
        effect: { type: Type.STRING, enum: ['none', 'glow', 'shake'] },
        breathing: { type: Type.STRING, enum: ['subtle', 'heavy', 'panting'] },
        scale: { type: Type.NUMBER, description: "A scale multiplier for zoom/pulse effects, from 1.0 to 1.2" }
    },
    required: ["expression", "effect", "breathing", "scale"]
};

export const parseEmotionKeywords = (text: string): Partial<AvatarEmotionState> | null => {
  const tags = text.split(/[, ]+/).map(t => t.trim().toLowerCase());
  const state: Partial<AvatarEmotionState> = {};

  for (const tag of tags) {
    if (['neutral', 'happy', 'sad', 'angry', 'surprised', 'blushing', 'winking', 'ahegao', 'lust', 'crying', 'laughing', 'nervous', 'sick', 'love', 'confused'].includes(tag)) {
      state.expression = tag as AvatarEmotionState['expression'];
    }
    if (['glow', 'shake'].includes(tag)) {
      state.effect = tag as AvatarEmotionState['effect'];
    }
    if (['subtle', 'heavy', 'panting'].includes(tag)) {
      state.breathing = tag as AvatarEmotionState['breathing'];
    }
  }
  return Object.keys(state).length > 0 ? state : null;
};

export const parseEmotionFromText = async (text: string, appSettings: AppSettings, explicitEmotion?: string): Promise<Partial<AvatarEmotionState>> => {
    // 1. Priority: Explicit status block emotion
    if (explicitEmotion) {
        const fromStatus = parseEmotionKeywords(explicitEmotion);
        if (fromStatus) return { ...defaultState, ...fromStatus };
    }

    // 2. Legacy: [EMOTION: ...] tag (Keeping as fallback if models still output it)
    const match = text.match(/\[EMOTION:\s*([^\]]+)\]/i);
    if (match && match[1]) {
         const fromTag = parseEmotionKeywords(match[1]);
         if (fromTag) return { ...defaultState, ...fromTag };
    }

    // Fallback to Gemini call for more nuanced analysis
    const promptTemplate = appSettings.instructionalPrompts.find(p => p.id === 'emotion-parser-prompt')?.prompt;
    if (!promptTemplate) {
        console.error("Emotion parser prompt not found.");
        return defaultState;
    }

    const prompt = `${promptTemplate}
    
    Text to analyze:
    """
    ${text.replace(/\[.*?\]/g, '').trim()}
    """`;

    try {
        let jsonText: string | null = null;
        if (appSettings.aiProvider === 'gemini') {
            const geminiAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await geminiAi.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: emotionSchema,
                    temperature: 0.2,
                }
            });
            jsonText = response.text;
        } else {
             let url = ''; let apiKey = '';
             if (appSettings.aiProvider === 'deepseek') { url = 'https://api.deepseek.com/chat/completions'; apiKey = appSettings.deepseekApiKey; }
             else if (appSettings.aiProvider === 'groq') { url = 'https://api.groq.com/openai/v1/chat/completions'; apiKey = appSettings.groqApiKey; }
             else if (appSettings.aiProvider === 'xai') { url = 'https://api.x.ai/v1/chat/completions'; apiKey = appSettings.xaiApiKey; }
             const useJsonMode = appSettings.aiProvider !== 'xai';
             const systemInstruction = `You are an expert emotion analysis AI. Your entire output must be a single, valid JSON object that conforms to the provided schema. Do not include any other text or explanations outside of the JSON object. The JSON schema is:\n${JSON.stringify(emotionSchema, null, 2)}`;
             jsonText = await generateOpenAIResponse(url, apiKey, appSettings.aiModel, prompt, systemInstruction, 0.2, useJsonMode);
        }

        if (!jsonText) return defaultState;
        const parsed = JSON.parse(jsonText);
        return { ...defaultState, ...parsed };
    } catch (error) {
        console.error("Failed to parse emotion from text with AI:", error);
        return defaultState;
    }
};