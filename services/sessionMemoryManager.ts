
import { get, set, keys } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import type { SessionMemory } from '../types';

const SESSION_MEM_PREFIX = 'sess_mem_';

export const recordSessionMemory = async (
    gameId: string,
    worldId: string,
    content: string,
    type: SessionMemory['type'],
    metadata: {
        relevantQuests?: string[],
        npcsMentioned?: string[],
        locationTags?: string[]
    } = {}
): Promise<SessionMemory> => {
    const memory: SessionMemory = {
        id: uuidv4(),
        gameId,
        worldId,
        content,
        timestamp: new Date().toISOString(),
        type,
        relevantQuests: metadata.relevantQuests || [],
        npcsMentioned: metadata.npcsMentioned || [],
        locationTags: metadata.locationTags || []
    };

    // Store in IDB
    // We store arrays of memories per gameId to avoid key explosion
    const key = `${SESSION_MEM_PREFIX}${gameId}`;
    const existing = await get<SessionMemory[]>(key) || [];
    await set(key, [...existing, memory]);

    return memory;
};

export const getSessionMemories = async (gameId: string, limit?: number): Promise<SessionMemory[]> => {
    const key = `${SESSION_MEM_PREFIX}${gameId}`;
    const memories = await get<SessionMemory[]>(key) || [];
    
    const sorted = memories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (limit) {
        return sorted.slice(0, limit);
    }
    return sorted;
};

export const searchSessionMemories = async (gameId: string, query: string): Promise<SessionMemory[]> => {
    const all = await getSessionMemories(gameId);
    const lowerQuery = query.toLowerCase();
    
    return all.filter(m => 
        m.content.toLowerCase().includes(lowerQuery) ||
        m.npcsMentioned.some(n => n.toLowerCase().includes(lowerQuery)) ||
        m.locationTags.some(l => l.toLowerCase().includes(lowerQuery))
    );
};
