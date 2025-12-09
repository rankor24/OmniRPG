


import { GoogleGenAI, Type } from "@google/genai";
import type { ChatMessage, AppSettings, Memory, Lorebook, LorebookEntry } from '../types';
import { generateOpenAIResponse } from './openai';
import * as embeddingService from './embeddingService';
import { search, type SearchableItem } from './vectorSearch';

const limitHistoryByContext = (
    basePrompt: string,
    history: ChatMessage[],
    appSettings: AppSettings
): ChatMessage[] => {
    // Per user request, with large context models, we no longer need to limit history.
    // This allows the AI to use the full conversation as an "instant knowledge base".
    return history;
};


const getFactExtractionPrompt = (conversationHistory: string, existingMemories: string[], appSettings: AppSettings): string => {
    const promptTemplate = appSettings.instructionalPrompts.find(p => p.id === 'fact-extraction-prompt')?.prompt || '';

    return `${promptTemplate}

**Existing Memories (Do not repeat these):**
${existingMemories.length > 0 ? existingMemories.join('\n') : 'None'}

**Conversation History to Analyze:**
${conversationHistory}
`;
};

const getHistorySummarizationPrompt = (conversationHistory: string, appSettings: AppSettings): string => {
    const promptTemplate = appSettings.instructionalPrompts.find(p => p.id === 'history-summarization-prompt')?.prompt || '';
    return `${promptTemplate}

**Full Conversation History:**
${conversationHistory}
`;
};

export const generateWithProvider = async (prompt: string, schema: any, appSettings: AppSettings, temperature: number = 0.1): Promise<any> => {
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
             const useJsonMode = appSettings.aiProvider !== 'xai';
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
            console.error("Failed to parse JSON response from AI:", jsonText);
            throw new Error("AI returned malformed JSON that could not be cleaned.");
        }

    } catch (error) {
        console.error("Failed to generate with provider:", error);
        throw error;
    }
};

export const generateSummary = async (
    content: string,
    appSettings: AppSettings
): Promise<string | null> => {
    const promptTemplate = appSettings.instructionalPrompts.find(p => p.id === 'dense-summary-generator')?.prompt;
    if (!promptTemplate) {
        console.error("Dense summary generator prompt not found.");
        return null;
    }

    const prompt = promptTemplate.replace('__TEXT_TO_SUMMARIZE__', content);
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: {
                type: Type.STRING,
                description: "A single, dense sentence summarizing the input text."
            }
        },
        required: ["summary"],
    };
    
    const result = await generateWithProvider(prompt, schema, appSettings, 0.1); // low temp for factual summary
    
    return result?.summary || null;
};


export const extractNewFacts = async (
    history: ChatMessage[],
    existingMemories: string[],
    appSettings: AppSettings
): Promise<string[]> => {
    const historyText = history.map(m => `${m.authorName}: ${m.versions[m.activeVersionIndex].content}`).join('\n');
    
    const prompt = getFactExtractionPrompt(historyText, existingMemories, appSettings);
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            new_facts: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    };
    
    const result = await generateWithProvider(prompt, schema, appSettings);
    
    if (result && Array.isArray(result.new_facts)) {
        return result.new_facts;
    }
    return [];
};


export const summarizeHistory = async (
    history: ChatMessage[],
    appSettings: AppSettings
): Promise<string | null> => {
    if (history.length === 0) return null;

    const basePrompt = getHistorySummarizationPrompt('', appSettings);
    const historyToProcess = limitHistoryByContext(basePrompt, history, appSettings);
    const historyText = historyToProcess.map(m => `${m.authorName}: ${m.versions[m.activeVersionIndex].content}`).join('\n');

    const prompt = getHistorySummarizationPrompt(historyText, appSettings);

    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING }
        }
    };

    const result = await generateWithProvider(prompt, schema, appSettings);

    if (result && typeof result.summary === 'string') {
        return `[SUMMARY] ${result.summary}`;
    }
    return null;
};

const getCorrectionPrompt = (userMessageContent: string, conversationHistory: string, existingMemories: {id: string, content: string}[], appSettings: AppSettings): string => {
    const promptTemplate = appSettings.instructionalPrompts.find(p => p.id === 'memory-correction-prompt')?.prompt || '';

    return `${promptTemplate}

**Your output format:**
{
  "corrections": [
    { "old_memory_id": "the-id-of-the-old-memory", "new_content": "The updated content for the memory." }
  ]
}

**Existing Memories (with IDs):**
${existingMemories.map(m => `- [id: ${m.id}] ${m.content}`).join('\n')}

**Conversation History (for context):**
${conversationHistory}

**User's Latest Message (Analyze this for corrections):**
"${userMessageContent}"
`;
};

export const proposeMemoryCorrection = async (
    lastUserMessage: ChatMessage,
    history: ChatMessage[],
    existingMemories: Memory[],
    appSettings: AppSettings
): Promise<{oldMemoryId: string, newContent: string}[] | null> => {
    let memoriesToScan = existingMemories;

    if (embeddingService.getEmbeddingStatus() === 'ready') {
        try {
            const queryEmbedding = await embeddingService.embedText(lastUserMessage.versions[0].content);
            const corpus: SearchableItem[] = existingMemories
                .filter(m => m.embedding)
                .map(m => ({ id: m.id, type: 'memory', content: m.content, embedding: m.embedding!, data: m }));

            if (corpus.length > 0) {
                const searchResults = search(queryEmbedding, corpus, appSettings.vectorTopK || 10);
                const relevantIds = new Set(searchResults.map(r => r.id));
                memoriesToScan = existingMemories.filter(m => relevantIds.has(m.id));
            }
        } catch (e) {
            console.error("Vector search for memory correction failed, using all memories.", e);
        }
    }

    const basePrompt = getCorrectionPrompt(lastUserMessage.versions[0].content, '', memoriesToScan, appSettings);
    const historyToProcess = limitHistoryByContext(basePrompt, history, appSettings);
    const historyText = historyToProcess.map(m => `${m.authorName}: ${m.versions[m.activeVersionIndex].content}`).join('\n');
    
    const prompt = getCorrectionPrompt(lastUserMessage.versions[0].content, historyText, memoriesToScan, appSettings);
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            corrections: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        old_memory_id: { type: Type.STRING },
                        new_content: { type: Type.STRING }
                    },
                    required: ["old_memory_id", "new_content"]
                }
            }
        },
        required: ["corrections"]
    };
    
    const result = await generateWithProvider(prompt, schema, appSettings);
    
    if (result && Array.isArray(result.corrections)) {
        return result.corrections.map((c: any) => ({
            oldMemoryId: c.old_memory_id,
            newContent: c.new_content
        }));
    }
    return null;
};

const getLoreEditsPrompt = (conversationHistory: string, activeLorebooks: Lorebook[], appSettings: AppSettings): string => {
    const promptTemplate = appSettings.instructionalPrompts.find(p => p.id === 'lore-edits-prompt')?.prompt || '';
    const allEntries = activeLorebooks.flatMap(lb => lb.entries.map(e => ({ ...e, lorebook_id: lb.id })));
    const allEntriesText = allEntries.map(e => `- [entry_id: ${e.id}] ${e.content}`).join('\n');

    return `${promptTemplate}

**Output JSON Schema:**
{
  "edits": [
    { "entry_id": "id-of-entry-to-edit", "new_content": "The updated content for the entry. Empty string to delete." }
  ]
}

**Existing Lorebook Entries (with IDs):**
${allEntriesText.length > 0 ? allEntriesText : 'None'}

**Full Conversation History:**
${conversationHistory}
`;
};

const getNewLoreExtractionPrompt = (conversationHistory: string, activeLorebooks: Lorebook[], appSettings: AppSettings): string => {
    const promptTemplate = appSettings.instructionalPrompts.find(p => p.id === 'new-lore-extraction-prompt')?.prompt || '';
    const allEntriesText = activeLorebooks.flatMap(lb => lb.entries.map(e => `- ${e.content}`)).join('\n');
    const activeLorebookIds = activeLorebooks.map(lb => lb.id);

    return `${promptTemplate}

**Output JSON Schema:**
{
  "new_entries": [
    { "keywords": ["keyword1", "keyword2"], "content": "The new lore content.", "lorebook_id": "id-of-the-target-lorebook" }
  ]
}

**Active Lorebook IDs:**
${activeLorebookIds.join('\n')}

**Existing Lorebook Entries (for context, do not repeat):**
${allEntriesText.length > 0 ? allEntriesText : 'None'}

**Full Conversation History:**
${conversationHistory}
`;
};

export const proposeLoreEdits = async (
    history: ChatMessage[],
    activeLorebooks: Lorebook[],
    appSettings: AppSettings
): Promise<{ edits: { entry_id: string; new_content: string }[] }> => {
    const basePrompt = getLoreEditsPrompt('', activeLorebooks, appSettings);
    const historyToProcess = limitHistoryByContext(basePrompt, history, appSettings);
    const historyText = historyToProcess.map(m => `${m.authorName}: ${m.versions[m.activeVersionIndex].content}`).join('\n');
    
    let lorebooksToScan = activeLorebooks;
    if (embeddingService.getEmbeddingStatus() === 'ready') {
        try {
            const queryEmbedding = await embeddingService.embedText(historyText);
            const allEntries: (LorebookEntry & {lorebookId: string})[] = activeLorebooks.flatMap(lb => lb.entries.map(e => ({...e, lorebookId: lb.id})));
            const corpus: SearchableItem[] = allEntries.filter(e => e.embedding).map(e => ({ id: e.id, type: 'lorebookEntry', content: e.content, embedding: e.embedding! }));

            if (corpus.length > 0) {
                const searchResults = search(queryEmbedding, corpus, appSettings.vectorTopK || 20);
                const relevantEntryIds = new Set(searchResults.map(r => r.id));
                lorebooksToScan = activeLorebooks.map(lb => ({ ...lb, entries: lb.entries.filter(e => relevantEntryIds.has(e.id)) })).filter(lb => lb.entries.length > 0);
            }
        } catch (e) {
            console.error("Vector search for lore edits failed, using all active lorebooks.", e);
        }
    }

    const prompt = getLoreEditsPrompt(historyText, lorebooksToScan, appSettings);
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            edits: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        entry_id: { type: Type.STRING },
                        new_content: { type: Type.STRING },
                    }
                }
            }
        }
    };
    
    const result = await generateWithProvider(prompt, schema, appSettings);
    
    if (result && Array.isArray(result.edits)) {
        return { edits: result.edits };
    }
    return { edits: [] };
};

export const extractNewLoreEntries = async (
    history: ChatMessage[],
    activeLorebooks: Lorebook[],
    appSettings: AppSettings
): Promise<{ new_entries: { keywords: string[]; content: string; lorebook_id: string }[] }> => {
    const basePrompt = getNewLoreExtractionPrompt('', activeLorebooks, appSettings);
    const historyToProcess = limitHistoryByContext(basePrompt, history, appSettings);
    const historyText = historyToProcess.map(m => `${m.authorName}: ${m.versions[m.activeVersionIndex].content}`).join('\n');

    let lorebooksForContext = activeLorebooks;
    if (embeddingService.getEmbeddingStatus() === 'ready') {
        try {
            const queryEmbedding = await embeddingService.embedText(historyText);
            const allEntries: (LorebookEntry & {lorebookId: string})[] = activeLorebooks.flatMap(lb => lb.entries.map(e => ({...e, lorebookId: lb.id})));
            const corpus: SearchableItem[] = allEntries.filter(e => e.embedding).map(e => ({ id: e.id, type: 'lorebookEntry', content: e.content, embedding: e.embedding! }));

            if (corpus.length > 0) {
                const searchResults = search(queryEmbedding, corpus, appSettings.vectorTopK || 20);
                const relevantEntryIds = new Set(searchResults.map(r => r.id));
                lorebooksForContext = activeLorebooks.map(lb => ({ ...lb, entries: lb.entries.filter(e => relevantEntryIds.has(e.id)) })).filter(lb => lb.entries.length > 0);
            }
        } catch (e) {
            console.error("Vector search for new lore extraction failed, using all active lorebooks for context.", e);
        }
    }

    const prompt = getNewLoreExtractionPrompt(historyText, lorebooksForContext, appSettings);
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            new_entries: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                        content: { type: Type.STRING },
                        lorebook_id: { type: Type.STRING },
                    }
                }
            }
        }
    };
    
    const result = await generateWithProvider(prompt, schema, appSettings);
    
    if (result && Array.isArray(result.new_entries)) {
        return { new_entries: result.new_entries };
    }
    return { new_entries: [] };
};