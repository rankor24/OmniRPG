import { useState, useEffect, useCallback } from 'react';
import { createRxDatabase, addRxPlugin, RxDatabase, RxCollection } from 'rxdb';
import { getRxStorageDexie } from '@rxdb/storage-dexie';
import { RxDBQueryBuilderPlugin } from '@rxdb/plugin-query-builder';
import { RxDBUpdatePlugin } from '@rxdb/plugin-update';
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBUpdatePlugin);

import { embedText, getEmbeddingStatus } from '../services/embeddingService';
import type { Memory } from '../types';

export type MemoryVectorDocType = Memory & {
    embedding: number[];
};

type MemoryCollection = RxCollection<MemoryVectorDocType>;
type VectorDatabase = RxDatabase<{ memories: MemoryCollection }>;

let dbPromise: Promise<VectorDatabase> | null = null;

const memorySchema = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        content: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        scope: { type: 'string', enum: ['global', 'character', 'conversation'] },
        characterId: { type: 'string' },
        conversationId: { type: 'string' },
        characterName: { type: 'string' },
        conversationPreview: { type: 'string' },
        embedding: { type: 'array', items: { type: 'number' } }
    },
    required: ['id', 'content', 'timestamp', 'scope', 'embedding'],
    indexes: ['timestamp', 'scope', 'characterId', 'conversationId']
};

const createDb = async (): Promise<VectorDatabase> => {
    if (dbPromise) return dbPromise;
    
    console.log('Creating vector database...');
    dbPromise = (async () => {
        const db = await createRxDatabase<VectorDatabase>({
            name: 'vectordb',
            storage: getRxStorageDexie(),
        });

        await db.addCollections({
            memories: {
                schema: memorySchema,
            },
        });
        
        console.log('Vector database created.');
        return db;
    })();
    
    return dbPromise;
};

const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const useVectorStore = () => {
    const [db, setDb] = useState<VectorDatabase | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const initDb = async () => {
            const database = await createDb();
            setDb(database);
            setIsReady(true);
        };
        initDb();
    }, []);

    const checkEmbeddingModel = () => {
        if (getEmbeddingStatus() !== 'ready') {
            throw new Error('Embedding model not initialized. Please go to Memory Cortex > Maintenance to download the model.');
        }
    };

    const addMemory = useCallback(async (memory: Memory) => {
        if (!db || !memory.content) return;
        
        checkEmbeddingModel();
        
        const embedding = await embedText(memory.content);
        const memoryWithVector: MemoryVectorDocType = { ...memory, embedding };
        
        await db.memories.upsert(memoryWithVector);
    }, [db]);
    
    const removeMemory = useCallback(async (memoryId: string) => {
        if (!db) return;
        const doc = await db.memories.findOne(memoryId).exec();
        if (doc) {
            await doc.remove();
        }
    }, [db]);

    const searchSimilarMemories = useCallback(async (queryText: string, k: number = 5, scope?: Memory['scope']): Promise<Memory[]> => {
        if (!db || !queryText) return [];
        
        checkEmbeddingModel();

        const queryEmbedding = await embedText(queryText);
        
        let queryBuilder = db.memories.find();
        if (scope) {
            queryBuilder = queryBuilder.where('scope').eq(scope);
        }
        
        const allDocs = await queryBuilder.exec();
        
        const similarities = allDocs.map(doc => ({
            doc,
            similarity: cosineSimilarity(queryEmbedding, doc.embedding)
        }));
        
        similarities.sort((a, b) => b.similarity - a.similarity);
        
        return similarities.slice(0, k).map(item => item.doc.toJSON() as Memory);
    }, [db]);

    return {
        isReady,
        addMemory,
        removeMemory,
        searchSimilarMemories,
    };
};