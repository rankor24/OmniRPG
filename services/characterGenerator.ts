import { GoogleGenAI, Type } from "@google/genai";
import type { Character, AppSettings } from '../types';
import { generateOpenAIResponse } from './openai';
import { generateWithProvider } from './memory';

const getSystemInstruction = (appSettings: AppSettings): string => {
    const promptTemplate = appSettings.instructionalPrompts.find(p => p.id === 'character-generator-prompt')?.prompt;
    if (!promptTemplate) {
        return `You are an expert assistant. Your task is to take unstructured text and convert it into a structured JSON object. Your entire output must be a single, valid JSON object.`;
    }
    return promptTemplate;
};

export const generateCharacterFromText = async (
  rawText: string,
  appSettings: AppSettings,
): Promise<Partial<Character>> => {
  const prompt = `Here is the user's character description:\n\n---\n\n${rawText}`;
  
  const schema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        tagline: { type: Type.STRING, description: "A short, one-line description for a character card." },
        core: { type: Type.STRING, description: "Core identity details like age, race, height, weight, occupation." },
        personality: { type: Type.STRING, description: "The character's personality traits." },
        background: { type: Type.STRING, description: "The character's backstory." },
        kinks: { type: Type.STRING, description: "Specific kinks or fetishes. If none, leave empty." },
        scenario: { type: Type.STRING, description: "The immediate setting and context for the start of the roleplay." },
        firstMessage: { type: Type.STRING, description: "The character's greeting or first message to the user. This should be a direct quote or a detailed narrative block." },
        exampleMessage: { type: Type.STRING, description: "An example of how the character speaks. If not provided, create a short one based on their personality or leave empty." },
        location: { type: Type.STRING, description: "The character's default starting location based on the scenario." },
        appearance: { type: Type.STRING, description: "A detailed description of the character's appearance." },
        position: { type: Type.STRING, description: "The character's default starting position or action." },
        avatar: { type: Type.STRING, description: "A descriptive prompt for an image generation AI to create a character portrait." },
        chatBackground: { type: Type.STRING, description: "A descriptive prompt for an image generation AI for a background image." },
    }
  };

  try {
    const parsedData = await generateWithProvider(prompt, schema, appSettings);

    if (!parsedData) {
      throw new Error("The AI returned an empty response.");
    }
    
    // Replace descriptive prompts with placeholder images for now
    if (parsedData.avatar) {
        parsedData.avatar = 'https://picsum.photos/seed/ai_avatar/256/256';
    }
    if (parsedData.chatBackground) {
        parsedData.chatBackground = 'https://picsum.photos/seed/ai_bg/1920/1080';
    }

    return parsedData as Partial<Character>;

  } catch (error) {
    console.error('Failed to generate character from text with AI:', error);
    throw error;
  }
};