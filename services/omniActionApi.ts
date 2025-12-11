





import { v4 as uuidv4 } from 'uuid';
import { get, set, keys as idbKeys } from 'idb-keyval';
import type { ActionChatMessage, PromptTemplate, Persona, Character, Lorebook, LorebookEntry, Reflection, ReflectionProposal, Conversation, Memory } from '../types';
import type { ActionChatContextType } from '../contexts/ActionChatContext';
import { generateOpenAIToolResponse, generateOpenAIResponse } from './openai';
import { SEXUAL_REPRESENTATION_LOREBOOK_ID } from '../ids';
import * as embeddingService from './embeddingService';
import { search, type SearchableItem } from './vectorSearch';

const ACTION_CHAT_CONVO_ID = 'action-chat-log-conversation';

// --- Tool Definitions ---

const getToolsForContext = (context: ActionChatContextType['pageContext']) => {
    const allTools: any[] = [];
    const page = context.page;

    if (page === 'all' || page === 'prompts') {
        allTools.push(
            {
                type: 'function',
                function: {
                    name: 'createPrompt',
                    description: 'Create a new prompt template.',
                    parameters: { type: 'object', properties: { name: { type: 'string', description: 'The name of the new prompt.' }, prompt: { type: 'string', description: 'The content of the new prompt.' } }, required: ['name', 'prompt'] }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'updatePrompt',
                    description: 'Update an existing prompt template. Use the prompt ID for targeting.',
                    parameters: { type: 'object', properties: { id: { type: 'string', description: 'The ID of the prompt to update.' }, name: { type: 'string', description: 'The new name for the prompt.' }, prompt: { type: 'string', description: 'The new content for the prompt.' } }, required: ['id'] }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'deletePrompt',
                    description: 'Delete an existing prompt template by its ID.',
                    parameters: { type: 'object', properties: { id: { type: 'string', description: 'The ID of the prompt to delete.' } }, required: ['id'] }
                }
            }
        );
    }
    if (page === 'all' || page === 'personas') {
        allTools.push(
            {
                type: 'function',
                function: {
                    name: 'createPersona',
                    description: 'Create a new user persona.',
                    parameters: { 
                        type: 'object', 
                        properties: { 
                            name: { type: 'string', description: 'The name of the new persona.' }, 
                            persona: { type: 'string', description: 'A detailed description of the persona (biography, personality, appearance).' }, 
                            avatar: { type: 'string', description: 'A URL or base64 data URI for the avatar image. If not provided, a default will be used.' } 
                        }, 
                        required: ['name', 'persona'] 
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'updatePersona',
                    description: 'Update an existing user persona.',
                    parameters: { type: 'object', properties: { id: { type: 'string', description: 'The ID of the persona to update.' }, name: { type: 'string' }, persona: { type: 'string' }, avatar: { type: 'string' } }, required: ['id'] }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'deletePersona',
                    description: 'Delete an existing persona by its ID.',
                    parameters: { type: 'object', properties: { id: { type: 'string', description: 'The ID of the persona to delete.' } }, required: ['id'] }
                }
            }
        );
    }
    if (page === 'all' || page === 'characters') {
        allTools.push(
            {
                type: 'function',
                function: {
                    name: 'createCharacter',
                    description: 'Create a new character for roleplaying.',
                    parameters: {
                        type: 'object', properties: {
                            name: { type: 'string', description: 'The name of the new character.' },
                            tagline: { type: 'string', description: "A short, one-line description for the character card." },
                            core: { type: 'string', description: "Core identity: age, race, height, weight, occupation." },
                            personality: { type: 'string' }, background: { type: 'string' }, scenario: { type: 'string' }, firstMessage: { type: 'string' },
                        }, required: ['name']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'updateCharacter',
                    description: 'Update an existing character.',
                    parameters: {
                        type: 'object', properties: {
                            id: { type: 'string', description: 'The ID of the character to update.' },
                            name: { type: 'string' }, tagline: { type: 'string' }, core: { type: 'string' }, personality: { type: 'string' }, background: { type: 'string' }, kinks: { type: 'string' }, scenario: { type: 'string' }, firstMessage: { type: 'string' }, appearance: { type: 'string' }
                        }, required: ['id']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'deleteCharacter',
                    description: 'Delete a character by its ID.',
                    parameters: { type: 'object', properties: { id: { type: 'string', description: 'The ID of the character to delete.' } }, required: ['id'] }
                }
            }
        );
    }
    if (page === 'all' || page === 'lorebooks') {
        allTools.push(
            {
                type: 'function',
                function: {
                    name: 'createLorebook',
                    description: 'Create a new lorebook.',
                    parameters: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } }, required: ['name'] }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'updateLorebook',
                    description: 'Update a lorebook\'s details.',
                    parameters: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' } }, required: ['id'] }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'deleteLorebook',
                    description: 'Delete a lorebook by its ID.',
                    parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'addLorebookEntry',
                    description: 'Add a new entry to an existing lorebook.',
                    parameters: { type: 'object', properties: { lorebookId: { type: 'string', description: 'The ID or exact name of the parent lorebook.' }, keywords: { type: 'array', items: { type: 'string' } }, content: { type: 'string' } }, required: ['lorebookId', 'keywords', 'content'] }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'updateLorebookEntry',
                    description: 'Update an entry within a lorebook.',
                    parameters: { type: 'object', properties: { entryId: { type: 'string' }, keywords: { type: 'array', items: { type: 'string' } }, content: { type: 'string' } }, required: ['entryId'] }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'deleteLorebookEntry',
                    description: 'Delete an entry from a lorebook by its ID.',
                    parameters: { type: 'object', properties: { entryId: { type: 'string' } }, required: ['entryId'] }
                }
            }
        );
    }
    if (page === 'all' || page === 'memories') {
        allTools.push(
            {
                type: 'function',
                function: {
                    name: 'createMemory',
                    description: 'Create a new memory. The scope determines where it is stored.',
                    parameters: { 
                        type: 'object', 
                        properties: { 
                            content: { type: 'string', description: 'The content of the memory.' },
                            scope: { type: 'string', enum: ['global', 'character'], description: 'The scope of the memory. "conversation" scope memories can only be created from within a chat.' },
                            entityId: { type: 'string', description: 'The character ID if scope is "character".' }
                        }, 
                        required: ['content', 'scope'] 
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'updateMemory',
                    description: 'Update an existing memory by its ID.',
                    parameters: { type: 'object', properties: { id: { type: 'string', description: 'The ID of the memory to update.' }, content: { type: 'string', description: 'The new content for the memory.' } }, required: ['id', 'content'] }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'deleteMemory',
                    description: 'Delete an existing memory by its ID.',
                    parameters: { type: 'object', properties: { id: { type: 'string', description: 'The ID of the memory to delete.' } }, required: ['id'] }
                }
            }
        );
    }
    
    return allTools;
};

// --- Tool Execution ---

interface ToolResult {
    result: string;
    createdId?: string;
}

const executeToolCall = async (
    tool_call: any,
    context: ActionChatContextType['pageContext'],
    allData: ActionChatContextType['allData'],
    dataModifiers: ActionChatContextType['dataModifiers']
): Promise<ToolResult> => {
    const { name, arguments: argsStr } = tool_call.function;
    const args = JSON.parse(argsStr);

    try {
        switch (name) {
            // --- PROMPT TOOLS ---
            case 'createPrompt': {
                const id = uuidv4();
                dataModifiers.handleSavePromptTemplate({
                    id, name: args.name, prompt: args.prompt,
                });
                return { result: `Successfully created prompt "${args.name}".`, createdId: id };
            }
            case 'updatePrompt': {
                const existing = allData.promptTemplates.find(p => p.id === args.id);
                if (!existing) throw new Error(`Prompt with ID "${args.id}" not found.`);
                dataModifiers.handleSavePromptTemplate({ ...existing, ...args });
                return { result: `Successfully updated prompt with ID "${args.id}".` };
            }
            case 'deletePrompt':
                dataModifiers.handleDeletePromptTemplate(args.id);
                return { result: `Successfully deleted prompt with ID "${args.id}".` };

            // --- PERSONA TOOLS ---
            case 'createPersona': {
                const id = uuidv4();
                // Handle potential aliases or missing fields from the AI
                const personaDescription = args.persona || args.description || args.bio || "A new persona.";
                const personaName = args.name || "New Persona";
                
                dataModifiers.handleSavePersona({
                    id, 
                    name: personaName, 
                    persona: personaDescription,
                    avatar: args.avatar || 'https://photos.fife.usercontent.google.com/pw/AP1GczOOHB5sXxrnV_NMl8xC4iZOguD65lUmZWppm-_89CKz0evr1M25VEM0=w956-h956-s-no-gm?authuser=0'
                });
                return { result: `Successfully created persona "${personaName}".`, createdId: id };
            }
            case 'updatePersona': {
                const existing = allData.personas.find(p => p.id === args.id);
                if (!existing) throw new Error(`Persona with ID "${args.id}" not found.`);
                dataModifiers.handleSavePersona({ ...existing, ...args });
                return { result: `Successfully updated persona with ID "${args.id}".` };
            }
            case 'deletePersona':
                dataModifiers.handleDeletePersona(args.id);
                return { result: `Successfully deleted persona with ID "${args.id}".` };

            // --- CHARACTER TOOLS ---
            case 'createCharacter': {
                const id = uuidv4();
                const newChar: Character = {
                    id,
                    name: args.name || "New Character",
                    tagline: args.tagline || '',
                    core: args.core || '',
                    personality: args.personality || '',
                    background: args.background || '',
                    scenario: args.scenario || '',
                    firstMessage: args.firstMessage || '',
                    // Defaults for non-provided fields
                    avatar: 'https://imagine-public.x.ai/imagine-public/images/c0a885ec-54cd-4a2c-87d3-cfcceb083d37.png',
                    chatBackground: 'https://imagine-public.x.ai/imagine-public/images/c0a885ec-54cd-4a2c-87d3-cfcceb083d37.png',
                    kinks: '',
                    exampleMessage: '',
                    location: '',
                    appearance: '',
                    position: '',
                    activeLorebookIds: [SEXUAL_REPRESENTATION_LOREBOOK_ID],
                    initialRelationshipScore: 0,
                    initialDominanceScore: 0,
                };
                dataModifiers.handleSaveCharacter(newChar);
                return { result: `Successfully created character "${args.name}".`, createdId: id };
            }
            case 'updateCharacter': {
                const existing = allData.characters.find(c => c.id === args.id);
                if (!existing) throw new Error(`Character with ID "${args.id}" not found.`);
                dataModifiers.handleSaveCharacter({ ...existing, ...args });
                return { result: `Successfully updated character with ID "${args.id}".` };
            }
            case 'deleteCharacter':
                dataModifiers.handleDeleteCharacter(args.id);
                return { result: `Successfully deleted character with ID "${args.id}".` };

            // --- LOREBOOK & ENTRY TOOLS ---
            case 'createLorebook': {
                const id = uuidv4();
                dataModifiers.handleSaveLorebook({
                    id, name: args.name, description: args.description || '',
                    enabled: true, entries: [], timestamp: new Date().toISOString()
                });
                return { result: `Successfully created lorebook "${args.name}".`, createdId: id };
            }
            case 'updateLorebook': {
                const existing = allData.lorebooks.find(lb => lb.id === args.id);
                if (!existing) throw new Error(`Lorebook with ID "${args.id}" not found.`);
                dataModifiers.handleSaveLorebook({ ...existing, ...args });
                return { result: `Successfully updated lorebook with ID "${args.id}".` };
            }
            case 'deleteLorebook':
                dataModifiers.handleDeleteLorebook(args.id);
                return { result: `Successfully deleted lorebook with ID "${args.id}".` };
            case 'addLorebookEntry': {
                const parent = allData.lorebooks.find(lb => lb.id === args.lorebookId || lb.name.toLowerCase() === args.lorebookId.toLowerCase());
                if (!parent) throw new Error(`Lorebook with ID or name "${args.lorebookId}" not found.`);
                const id = uuidv4();
                const newEntry: LorebookEntry = {
                    id, content: args.content, keywords: args.keywords,
                    enabled: true, timestamp: new Date().toISOString()
                };
                parent.entries.push(newEntry);
                dataModifiers.handleSaveLorebook({ ...parent });
                return { result: `Successfully added entry to lorebook "${parent.name}".`, createdId: id };
            }
            case 'updateLorebookEntry': {
                let parent: Lorebook | undefined;
                let entryIndex = -1;
                for (const lb of allData.lorebooks) {
                    entryIndex = lb.entries.findIndex(e => e.id === args.entryId);
                    if (entryIndex > -1) { parent = lb; break; }
                }
                if (!parent || entryIndex === -1) throw new Error(`Lorebook entry with ID "${args.entryId}" not found.`);
                const updatedEntry = { ...parent.entries[entryIndex], ...args };
                parent.entries[entryIndex] = updatedEntry;
                dataModifiers.handleSaveLorebook({ ...parent });
                return { result: `Successfully updated entry in lorebook "${parent.name}".` };
            }
            case 'deleteLorebookEntry': {
                let parent: Lorebook | undefined;
                for (const lb of allData.lorebooks) {
                    if (lb.entries.some(e => e.id === args.entryId)) { parent = lb; break; }
                }
                if (!parent) throw new Error(`Lorebook entry with ID "${args.entryId}" not found.`);
                parent.entries = parent.entries.filter(e => e.id !== args.entryId);
                dataModifiers.handleSaveLorebook({ ...parent });
                return { result: `Successfully deleted entry from lorebook "${parent.name}".` };
            }
            
            // --- MEMORY TOOLS ---
            case 'createMemory':
                if (args.scope === 'conversation') throw new Error('Cannot create conversation-scoped memories from Action Chat. This must be done from within a chat.');
                const resultMsg = await dataModifiers.handleCreateMemory(args.content, args.scope, args.entityId);
                return { result: resultMsg };
            case 'updateMemory':
                const updateMsg = await dataModifiers.handleUpdateMemory(args.id, args.content);
                return { result: updateMsg };
            case 'deleteMemory':
                const deleteMsg = await dataModifiers.handleDeleteMemory(args.id);
                return { result: deleteMsg };

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        return { result: error instanceof Error ? `Error: ${error.message}` : 'An unknown error occurred.' };
    }
};

async function generateToolReflectionThoughts(
    toolName: string,
    args: any,
    userPrompt: string,
    appSettings: ActionChatContextType['allData']['appSettings']
): Promise<string> {
    const promptTemplate = appSettings.instructionalPrompts.find(p => p.id === 'action-chat-reflection-prompt')?.prompt || '';
    const systemPrompt = appSettings.instructionalPrompts.find(p => p.id === 'action-chat-reflection-system-prompt')?.prompt || 'You are a reflective, meta-cognitive AI core analyzing your own actions.';
    
    const prompt = promptTemplate
        .replace('{{toolName}}', toolName)
        .replace('{{args}}', JSON.stringify(args))
        .replace('{{userPrompt}}', userPrompt);

    try {
        const responseText = await generateOpenAIResponse(
            'https://api.x.ai/v1/chat/completions',
            appSettings.xaiApiKey,
            appSettings.aiModel,
            prompt,
            systemPrompt,
            0.4,
            false
        );
        return responseText.trim();
    } catch (error) {
        console.error("Failed to generate tool reflection thoughts:", error);
        return `Analyzed user request "${userPrompt}" and executed tool '${toolName}' to fulfill it.`; // Fallback
    }
}

const logActionAsReflection = async (
    tool_call: any,
    resultMessage: string,
    userPrompt: string,
    appSettings: ActionChatContextType['allData']['appSettings'],
    createdId?: string
) => {
    const toolName = tool_call.function.name;
    const args = JSON.parse(tool_call.function.arguments);

    const typeMap: { [key: string]: ReflectionProposal['type'] } = {
        'Prompt': 'prompt', 'Persona': 'persona', 'Character': 'character',
        'Lorebook': 'lorebook', 'LorebookEntry': 'lorebookEntry',
        'Memory': 'memory',
    };
    const nameParts = toolName.replace(/([A-Z])/g, ' $1').split(' ');
    let action = (nameParts[0] || '').toLowerCase();
    if (action === 'create') {
        action = 'add';
    }
    const typeKey = nameParts.slice(1).join('');
    const type = typeMap[typeKey];

    if (!type || !['add', 'edit', 'delete'].includes(action as any)) {
        console.warn(`Could not map tool call "${toolName}" to a reflection proposal.`);
        return;
    }

    const proposal: ReflectionProposal = {
        id: uuidv4(),
        type,
        action: action as ReflectionProposal['action'],
        rationale: `User initiated via Action Chat: "${userPrompt}"`,
        status: 'approved',
        targetId: createdId || args.id || args.entryId,
        updatedFields: (action === 'add' || action === 'edit') ? args : undefined,
    };

    if (type === 'lorebookEntry') {
        proposal.lorebookId = args.lorebookId;
        proposal.content = args.content;
        proposal.keywords = args.keywords;
    } else if (type === 'memory') {
        proposal.content = args.content;
        proposal.scope = args.scope;
    }

    const thoughts = await generateToolReflectionThoughts(toolName, args, userPrompt, appSettings);

    const reflection: Reflection = {
        id: uuidv4(),
        conversationId: ACTION_CHAT_CONVO_ID,
        conversationPreview: "Action Chat Log",
        characterId: 'omni-ai',
        characterName: "OmniRPG",
        thoughts: thoughts,
        proposals: [proposal],
        timestamp: new Date().toISOString()
    };
    
    try {
        const key = `reflections_${ACTION_CHAT_CONVO_ID}`;
        const existingReflections = await get<Reflection[]>(key) || [];
        await set(key, [...existingReflections, reflection]);
    } catch (error) {
        console.error("Failed to log Action Chat action as reflection:", error);
    }
};

// --- Main API Processors ---

export const proposeActionChat = async (
    messages: ActionChatMessage[],
    context: ActionChatContextType['pageContext'],
    allData: ActionChatContextType['allData'],
    currentConversation?: Conversation | null
): Promise<ActionChatMessage> => {
    const { appSettings } = allData;
    const url = 'https://api.x.ai/v1/chat/completions';
    const apiKey = appSettings.xaiApiKey;
    const model = appSettings.aiModel;

    let systemPrompt: string;
    
    if (context.page === 'all') { // Editor Mode
        const promptTemplate = appSettings.instructionalPrompts.find(p => p.id === 'action-chat-editor-mode-prompt')?.prompt || '';
        
        let dataContext: string;
        
        if (embeddingService.getEmbeddingStatus() === 'ready') {
            try {
                const userQuery = messages[messages.length - 1].content;
                if (!userQuery) {
                    dataContext = "No user query provided to search for context.";
                } else {
                    const queryEmbedding = await embeddingService.embedText(userQuery);
                    
                    const corpus: SearchableItem[] = [];
                    const { characters, lorebooks, personas, promptTemplates, allMemories } = allData;

                    characters.forEach(item => { if (item.embedding) corpus.push({ id: item.id, type: 'character', content: `[Character ID: ${item.id}] Name: ${item.name}, Tagline: ${item.tagline}`, embedding: item.embedding }); });
                    lorebooks.forEach(lb => lb.entries.forEach(item => { if(item.embedding) corpus.push({ id: item.id, type: 'lorebookEntry', content: `[Lore Entry ID: ${item.id} in "${lb.name}"] ${item.content}`, embedding: item.embedding }); }));
                    personas.forEach(item => { if (item.embedding) corpus.push({ id: item.id, type: 'character', content: `[Persona ID: ${item.id}] Name: ${item.name}`, embedding: item.embedding }); });
                    promptTemplates.forEach(item => { if (item.embedding) corpus.push({ id: item.id, type: 'memory', content: `[Prompt ID: ${item.id}] Name: ${item.name}`, embedding: item.embedding }); });
                    allMemories.forEach(item => { if (item.embedding) corpus.push({ id: item.id, type: 'memory', content: `[Memory ID: ${item.id}, Scope: ${item.scope}] ${item.content}`, embedding: item.embedding }); });

                    const searchResults = search(queryEmbedding, corpus, appSettings.vectorTopK || 20);
                    
                    if (searchResults.length > 0) {
                        dataContext = "Here is the most relevant data for your request (from a vector search):\n" + searchResults.map(item => `- ${item.content}`).join('\n');
                    } else {
                        dataContext = "No relevant data was found for your request via vector search. Please be more specific or try rephrasing.";
                    }
                }
            } catch (e) {
                console.error("Action Chat vector search failed:", e);
                dataContext = "There was an error while searching for relevant data. Please try again.";
            }
        } else {
            dataContext = "The on-device embedding model is not ready. Please initialize it on the Embeddings > Maintenance page to use Editor Mode effectively.";
        }
        
        systemPrompt = promptTemplate.replace('{{dataContext}}', dataContext);

    } else { // Page-specific context
        const promptTemplate = appSettings.instructionalPrompts.find(p => p.id === 'action-chat-page-context-prompt')?.prompt || '';
        let dataContext = "No relevant data could be found for this request.";

        if (embeddingService.getEmbeddingStatus() === 'ready' && Array.isArray(context.data) && context.data.length > 0) {
            try {
                const userQuery = messages[messages.length - 1].content;
                const queryEmbedding = await embeddingService.embedText(userQuery);
                
                const corpus: SearchableItem[] = [];
                context.data.forEach((item: any) => {
                    if (item.embedding && item.id) {
                        let content = `[ID: ${item.id}] Name: ${item.name || 'Untitled'}`;
                        if (item.tagline) content += `, Tagline: ${item.tagline.substring(0, 100)}...`;
                        else if (item.prompt) content += `, Content: "${item.prompt.substring(0, 100)}..."`;
                        else if (item.content) content += `, Content: "${item.content.substring(0, 100)}..."`;
                        else if (item.persona) content += `, Description: ${item.persona.substring(0, 100)}...`;
                        else if (item.description) content += `, Description: ${item.description.substring(0, 100)}...`;
                        
                        corpus.push({
                            id: item.id,
                            type: 'memory', // generic type is fine
                            content: content,
                            embedding: item.embedding,
                            data: item,
                        });
                    }
                });

                if (corpus.length > 0) {
                    const searchResults = search(queryEmbedding, corpus, appSettings.vectorTopK || 15);
                    if (searchResults.length > 0) {
                        dataContext = "Here is the most relevant data for your request (from a vector search):\n" + searchResults.map(item => `- ${item.content}`).join('\n');
                    }
                }
                
            } catch (e) {
                console.error("Action Chat (page context) vector search failed, falling back to basic list.", e);
                const limitedData = context.data.slice(0, 10).map((item: any) => ({ id: item.id, name: item.name }));
                dataContext = "Vector search failed. Here is a limited list of items:\n" + JSON.stringify(limitedData, null, 2);
            }
        } else if (Array.isArray(context.data)) {
            // Fallback if embedding model not ready
             const limitedData = context.data.slice(0, 10).map((item: any) => ({ id: item.id, name: item.name }));
             dataContext = "Embedding model not ready. Here is a limited list of items:\n" + JSON.stringify(limitedData, null, 2);
        }

        systemPrompt = promptTemplate
            .replace('{{page}}', context.page || 'current')
            .replace('{{data}}', dataContext);
    }
    
    const tools = getToolsForContext(context);
    let historyToProcess = messages.filter(m => m.role !== 'tool');
    const scope = currentConversation?.editorModeContextScope || 'full';
    if (scope !== 'full') {
        const count = parseInt(scope.replace('last_', ''));
        if (!isNaN(count)) {
            historyToProcess = historyToProcess.slice(-count);
        }
    }
    const apiMessages = [{ role: 'system', content: systemPrompt }, ...historyToProcess];

    const responseMessage = await generateOpenAIToolResponse(url, apiKey, model, apiMessages, 0.2, tools);

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        return {
            id: uuidv4(),
            role: 'assistant',
            content: responseMessage.content || `I'm planning to perform ${responseMessage.tool_calls.length} action(s). Please review.`,
            toolCallProposals: {
                tool_calls: responseMessage.tool_calls,
                status: 'pending'
            }
        };
    }

    return {
        id: uuidv4(),
        role: 'assistant',
        content: responseMessage.content || "I'm not sure how to help with that. Please try rephrasing your request.",
    };
};

export const executeActionChatProposals = async (
    history: ActionChatMessage[],
    proposalMessage: ActionChatMessage,
    context: ActionChatContextType['pageContext'],
    allData: ActionChatContextType['allData'],
    dataModifiers: ActionChatContextType['dataModifiers']
): Promise<{ summaryMessage: ActionChatMessage; toolResultMessages: ActionChatMessage[] }> => {
    const { appSettings } = allData;
    const url = 'https://api.x.ai/v1/chat/completions';
    const apiKey = appSettings.xaiApiKey;
    const model = appSettings.aiModel;
    const tools = getToolsForContext(context);
    
    let systemPrompt = appSettings.instructionalPrompts.find(p => p.id === 'action-chat-execution-summary-prompt')?.prompt || `You are OmniRPG. You have just executed a series of tool calls based on user approval. Now, your task is to provide a final, concise, and friendly confirmation message to the user, summarizing what was done.`;

    const tool_calls = proposalMessage.toolCallProposals!.tool_calls;
    
    const toolResultMessages: ActionChatMessage[] = [];
    const userPrompt = [...history].reverse().find(m => m.role === 'user')?.content || 'Unknown user request.';

    for (const tool_call of tool_calls) {
        const { result, createdId } = await executeToolCall(tool_call, context, allData, dataModifiers);
        
        if (!result.startsWith('Error:')) {
            await logActionAsReflection(tool_call, result, userPrompt, allData.appSettings, createdId);
        }

        toolResultMessages.push({
            id: uuidv4(),
            role: 'tool',
            tool_call_id: tool_call.id,
            content: result,
        });
    }

    const finalApiMessages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'assistant', content: null, tool_calls: tool_calls } as any,
        ...toolResultMessages.map(m => ({ role: 'tool', tool_call_id: m.tool_call_id, content: m.content }))
    ];

    const finalApiResponseMessage = await generateOpenAIToolResponse(url, apiKey, model, finalApiMessages, 0.2, []);
    
    const summaryMessage: ActionChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: finalApiResponseMessage.content || "Actions completed successfully.",
    };

    return { summaryMessage, toolResultMessages };
};