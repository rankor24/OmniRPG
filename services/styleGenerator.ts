import { GoogleGenAI, Type } from "@google/genai";
import type { AppSettings, StylePreference } from '../types';
import { generateWithProvider } from './memory';

const getPositiveStylePrompt = (messageContent: string, appSettings: AppSettings, reasons?: string[], comment?: string): string => {
    const promptTemplate = appSettings.instructionalPrompts.find(p => p.id === 'positive-style-prompt')?.prompt || '';
    let feedbackContext = '';
    if (reasons && reasons.length > 0) {
        feedbackContext += `\nUser's reasons for high rating: ${reasons.join(', ')}.`;
    }
    if (comment) {
        feedbackContext += `\nUser's comment: "${comment}"`;
    }

    return `${promptTemplate}${feedbackContext}

Text to analyze:
"""
${messageContent}
"""`;
};

const getNegativeStylePrompt = (messageContent: string, appSettings: AppSettings, reasons?: string[], comment?: string): string => {
    const promptTemplate = appSettings.instructionalPrompts.find(p => p.id === 'negative-style-prompt')?.prompt || '';
    let feedbackContext = '';
    if (reasons && reasons.length > 0) {
        feedbackContext += `\nUser's reasons for low rating: ${reasons.join(', ')}.`;
    }
    if (comment) {
        feedbackContext += `\nUser's comment: "${comment}"`;
    }

    return `${promptTemplate}${feedbackContext}

Text to analyze:
"""
${messageContent}
"""`;
};

export const generateStylePreference = async (
    messageContent: string,
    rating: number,
    appSettings: AppSettings,
    reasons?: string[],
    comment?: string
): Promise<string | null> => {
    // We only generate for very high or very low ratings
    if (rating === 1) { // low rating (1 star)
        const prompt = getNegativeStylePrompt(messageContent, appSettings, reasons, comment);
        const schema = {
            type: Type.OBJECT,
            properties: {
                style_preference: {
                    type: Type.STRING,
                    description: "A single, concise style preference to AVOID, based on the poorly rated text."
                }
            },
            required: ["style_preference"],
        };

        const result = await generateWithProvider(prompt, schema, appSettings, 0.2);
        return result?.style_preference || null;

    } else if (rating >= 4) { // high rating (4 or 5 stars)
        const prompt = getPositiveStylePrompt(messageContent, appSettings, reasons, comment);
        const schema = {
            type: Type.OBJECT,
            properties: {
                style_preference: {
                    type: Type.STRING,
                    description: "A single, concise style preference to FOLLOW, based on the highly rated text."
                }
            },
            required: ["style_preference"],
        };

        const result = await generateWithProvider(prompt, schema, appSettings, 0.2);
        return result?.style_preference || null;
    }
    
    return null; // No generation for neutral ratings
};