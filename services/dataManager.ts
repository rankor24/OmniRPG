
import { get as idbGet, set as idbSet, keys as idbKeys } from 'idb-keyval';
import type { Lorebook, Conversation, ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';

const IMAGE_REF_PREFIX = "IMAGE_REF::";

export interface BackupDataParts {
  chats: string;
  characters: string;
  memories: string;
  lorebooks: string;
  worlds: string;
  system: string;
  images: string | null;
}

// Helper function to recursively traverse data and extract/reconstruct images
// Now async to allow yielding to event loop
const traverseAndProcessImages = async (
    data: any,
    imageDataMap: Map<string, string>,
    base64Cache: Map<string, string>, // [base64, imageId]
    mode: 'extract' | 'reconstruct',
    includeImages: boolean = true
) => {
    if (!data || typeof data !== 'object') return;

    // Use a stack to avoid deep recursion issues
    const stack: { obj: any; key: string | number }[] = Object.keys(data).map(key => ({ obj: data, key }));
    let operationsCount = 0;

    while (stack.length > 0) {
        const { obj, key } = stack.pop()!;
        const value = obj[key];

        if (typeof value === 'string') {
            if (mode === 'extract' && value.startsWith('data:image')) {
                if (!includeImages) {
                    // Optimization: If skipping images, replace with a placeholder ref immediately
                    // and DO NOT store the heavy string in the maps.
                    // This releases the memory occupied by the base64 string.
                    obj[key] = `${IMAGE_REF_PREFIX}SKIPPED_${uuidv4()}`;
                } else {
                    if (base64Cache.has(value)) {
                        // This image has been seen before, just replace with existing ID
                        obj[key] = base64Cache.get(value);
                    } else {
                        // New image, create ID, store it, and cache it
                        const imageId = `${IMAGE_REF_PREFIX}${uuidv4()}`;
                        imageDataMap.set(imageId, value);
                        base64Cache.set(value, imageId);
                        obj[key] = imageId;
                    }
                }
            } else if (mode === 'reconstruct' && value.startsWith(IMAGE_REF_PREFIX)) {
                // Replace image reference with the actual base64 data if available
                if (imageDataMap.has(value)) {
                    obj[key] = imageDataMap.get(value);
                }
                // If not in map (e.g. was skipped), leave the ref as is.
            }
        } else if (value && typeof value === 'object') {
            // Add nested object/array keys to the stack
            Object.keys(value).forEach(nestedKey => stack.push({ obj: value, key: nestedKey }));
        }

        // Yield to event loop every 2000 operations to prevent UI freeze
        operationsCount++;
        if (operationsCount % 2000 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
};


export const prepareBackupData = async (includeImages: boolean = true, onProgress?: (status: string) => void): Promise<BackupDataParts> => {
    const categoryMap: Record<string, { localStorage: Record<string, any>, indexedDB: Record<string, any> }> = {
        chats: { localStorage: {}, indexedDB: {} },
        characters: { localStorage: {}, indexedDB: {} },
        memories: { localStorage: {}, indexedDB: {} },
        lorebooks: { localStorage: {}, indexedDB: {} },
        worlds: { localStorage: {}, indexedDB: {} },
        system: { localStorage: {}, indexedDB: {} },
    };

    const imageDataMap = new Map<string, string>(); // [imageId, base64]
    const base64Cache = new Map<string, string>(); // [base64, imageId]

    const assignToCategory = (source: 'localStorage' | 'indexedDB', key: string, value: any) => {
        let cat = 'system';
        if (key === 'characters') cat = 'characters';
        else if (key === 'lorebooks') cat = 'lorebooks';
        else if (key.startsWith('conversations_') || key.startsWith('chatHistory_') || key.startsWith('chatScene_')) cat = 'chats';
        else if (key.startsWith('global_memories') || key.startsWith('memories_') || key === 'style_preferences') cat = 'memories';
        else if (key.startsWith('world_') || key.startsWith('save_') || key === 'library_items') cat = 'worlds';
        // Everything else (personas, prompts, logs, appSettings) stays in 'system'
        
        categoryMap[cat][source][key] = value;
    };

    // Helper to process an item immediately upon reading.
    // This extracts images out of the object structure BEFORE it is stored in categoryMap.
    // This keeps categoryMap lightweight (text-only) preventing memory spikes.
    const processAndAssign = async (source: 'localStorage' | 'indexedDB', key: string, value: any) => {
        await traverseAndProcessImages(value, imageDataMap, base64Cache, 'extract', includeImages);
        assignToCategory(source, key, value);
    };

    if (onProgress) onProgress('Processing Local Storage...');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
            const rawValue = localStorage.getItem(key);
            if (rawValue !== null) {
                try {
                    const value = JSON.parse(rawValue);
                    await processAndAssign('localStorage', key, value);
                } catch {
                    // If not JSON, store as is (likely simple string)
                    await processAndAssign('localStorage', key, rawValue);
                }
            }
        }
    }

    if (onProgress) onProgress('Processing Database...');
    const idbAllKeys = await idbKeys();
    let processedCount = 0;
    for (const key of idbAllKeys) {
        if (typeof key === 'string') {
            try {
                const value = await idbGet(key);
                await processAndAssign('indexedDB', key, value);
            } catch (e) {
                console.warn(`Skipping unreadable key: ${key}`, e);
            }
            
            processedCount++;
            if (processedCount % 20 === 0) {
                 if (onProgress) onProgress(`Processing Database (${Math.round(processedCount / idbAllKeys.length * 100)}%)...`);
                 // Explicit yield to keep UI responsive
                 await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
    }
    
    if (onProgress) onProgress('Finalizing data packages...');

    // Optimization: If we aren't uploading images, don't burn memory creating the huge string
    let imageData: string | null = null;
    if (includeImages) {
        if (onProgress) onProgress('Compressing image data...');
        imageData = JSON.stringify(Object.fromEntries(imageDataMap), null, 2);
    }
    
    return {
        chats: JSON.stringify(categoryMap.chats, null, 2),
        characters: JSON.stringify(categoryMap.characters, null, 2),
        memories: JSON.stringify(categoryMap.memories, null, 2),
        lorebooks: JSON.stringify(categoryMap.lorebooks, null, 2),
        worlds: JSON.stringify(categoryMap.worlds, null, 2),
        system: JSON.stringify(categoryMap.system, null, 2),
        images: imageData
    };
};


const mergeConversations = (local: Conversation[], imported: Conversation[]): Conversation[] => {
    if (!Array.isArray(local) || !Array.isArray(imported)) return local;

    const localMap = new Map(local.map(item => [item.id, item]));

    for (const importedConvo of imported) {
        if (!importedConvo.id) continue;
        const localConvo = localMap.get(importedConvo.id);

        if (localConvo) {
            // Conversation exists, check which is newer
            const localDate = new Date(localConvo.lastMessageAt).getTime();
            const importedDate = new Date(importedConvo.lastMessageAt).getTime();
            if (importedDate > localDate) {
                // Imported is newer, update local with imported metadata but keep local scores etc.
                localMap.set(importedConvo.id, {
                    ...localConvo,
                    preview: importedConvo.preview,
                    lastMessageAt: importedConvo.lastMessageAt,
                    hasCustomTitle: importedConvo.hasCustomTitle,
                });
            }
        } else {
            // New conversation from import, add it.
            localMap.set(importedConvo.id, importedConvo);
        }
    }

    return Array.from(localMap.values());
};

const mergeChatHistory = (local: ChatMessage[], imported: ChatMessage[]): ChatMessage[] => {
    if (!Array.isArray(local) || !Array.isArray(imported)) return local;

    const messageMap = new Map<string, ChatMessage>();

    // Add all local messages first
    for (const msg of local) {
        if (msg.id) messageMap.set(msg.id, msg);
    }

    // Add/overwrite with imported messages. Overwriting is fine for duplicates.
    for (const msg of imported) {
        if (msg.id) messageMap.set(msg.id, msg);
    }

    const merged = Array.from(messageMap.values());

    // Sort by timestamp to ensure correct chronological order
    merged.sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateA - dateB;
    });

    return merged;
};

// Helper function for merging lorebooks with entry-level granularity
const mergeLorebooks = (local: Lorebook[], imported: Lorebook[]): Lorebook[] => {
    if (!Array.isArray(local) || !Array.isArray(imported)) return local || [];
    const importedLorebookMap = new Map(imported.map(lb => [lb.id, lb]));
    
    const updatedLocalLorebooks = local.map(localLb => {
        const matchingImportedLb = importedLorebookMap.get(localLb.id);
        if (matchingImportedLb) {
            const localEntryIds = new Set(localLb.entries.map(e => e.id));
            const newEntries = matchingImportedLb.entries.filter(e => e.id && !localEntryIds.has(e.id));
            importedLorebookMap.delete(localLb.id); // Remove it so it's not added as a new lorebook
            if (newEntries.length > 0) {
                return { ...localLb, entries: [...localLb.entries, ...newEntries] };
            }
        }
        return localLb;
    });
    
    // Add any completely new lorebooks from the import
    const newLorebooks = Array.from(importedLorebookMap.values());
    return [...updatedLocalLorebooks, ...newLorebooks];
};

export const importBackupData = async (textData: string, imageData: string): Promise<void> => {
    const data = JSON.parse(textData);
    
    // If imageData is empty (e.g. from a text-only backup), handle gracefully
    const images = imageData ? JSON.parse(imageData) : {};
    
    // Explicitly type the Map to ensure it's <string, string> as expected by traverseAndProcessImages.
    const imageDataMap = new Map<string, string>(Object.entries(images) as [string, string][]);

    // Reconstruct full data object with base64 images
    // We pass true for includeImages because we want to reconstruct if data is available
    await traverseAndProcessImages(data, imageDataMap, new Map(), 'reconstruct', true);
    
    const mergeById = (local: any[], imported: any[]) => {
        if (!Array.isArray(local) || !Array.isArray(imported)) return local;
        if ((local.length > 0 && (typeof local[0] !== 'object' || !('id' in local[0]))) ||
            (imported.length > 0 && (typeof imported[0] !== 'object' || !('id' in imported[0])))) {
          return local;
        }
    
        const localIds = new Set(local.map(item => item.id));
        const newItems = imported.filter(item => item.id && !localIds.has(item.id));
        
        return [...local, ...newItems];
      };

    const processData = async (reconstructedData: any) => {
        if (reconstructedData.localStorage && typeof reconstructedData.localStorage === 'object') {
          for (const key in reconstructedData.localStorage) {
            if (Object.prototype.hasOwnProperty.call(reconstructedData.localStorage, key)) {
              const importedValue = reconstructedData.localStorage[key];

              if (key === 'characters' || key === 'lorebooks') {
                const localIdbValue = await idbGet(key);
                let finalValue;
                if (Array.isArray(localIdbValue)) {
                    finalValue = (key === 'lorebooks') ? mergeLorebooks(localIdbValue, importedValue) : mergeById(localIdbValue, importedValue);
                } else {
                    finalValue = importedValue;
                }
                await idbSet(key, finalValue);
                continue;
              }
              
              const localValueStr = localStorage.getItem(key);
              if (localValueStr === null) {
                localStorage.setItem(key, JSON.stringify(importedValue));
              } else {
                try {
                  const localValue = JSON.parse(localValueStr);
                  if (key.startsWith('conversations_')) {
                      const mergedValue = mergeConversations(localValue, importedValue);
                      localStorage.setItem(key, JSON.stringify(mergedValue));
                  } else if (Array.isArray(localValue) && Array.isArray(importedValue)) {
                    const mergedValue = mergeById(localValue, importedValue);
                    localStorage.setItem(key, JSON.stringify(mergedValue));
                  }
                } catch (err) {
                  console.warn(`Could not merge localStorage key "${key}", preserving local value.`);
                }
              }
            }
          }
        }

        if (reconstructedData.indexedDB && typeof reconstructedData.indexedDB === 'object') {
          for (const key in reconstructedData.indexedDB) {
            if (Object.prototype.hasOwnProperty.call(reconstructedData.indexedDB, key)) {
              const importedValue = reconstructedData.indexedDB[key];
              const localValue = await idbGet(key);
              
              if (localValue === undefined) {
                await idbSet(key, importedValue);
              } else {
                if (Array.isArray(localValue) && Array.isArray(importedValue)) {
                    let mergedValue;
                    if (typeof key === 'string' && key.startsWith('chatHistory_')) {
                        mergedValue = mergeChatHistory(localValue, importedValue);
                    } else if (key === 'lorebooks') {
                        mergedValue = mergeLorebooks(localValue, importedValue);
                    } else {
                        mergedValue = mergeById(localValue, importedValue);
                    }
                    await idbSet(key, mergedValue);
                }
              }
            }
          }
        }
    };
    
    await processData(data);
};
