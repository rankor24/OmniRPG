import { useState, useEffect } from 'react';
import { get, keys as idbKeys } from 'idb-keyval';
import type { Memory } from '../types';

export const useAllMemories = () => {
    const [allMemories, setAllMemories] = useState<Memory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const allKeys = await idbKeys() as any[];
                
                const globalMems = await get<Memory[]>('global_memories') || [];
                
                const charMemoryKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith('memories_character_'));
                const charMemoryPromises = charMemoryKeys.map(key => get<Memory[]>(key));
                const charMemoriesData = (await Promise.all(charMemoryPromises)).flat().filter(Boolean) as Memory[];

                const convoMemoryKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith('memories_conversation_'));
                const convoMemoryPromises = convoMemoryKeys.map(key => get<Memory[]>(key));
                const convoMemoriesData = (await Promise.all(convoMemoryPromises)).flat().filter(Boolean) as Memory[];

                setAllMemories([...globalMems, ...charMemoriesData, ...convoMemoriesData]);
            } catch (error) {
                console.error("Failed to fetch all memories:", error);
                setAllMemories([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    return { allMemories, setAllMemories, loading };
};