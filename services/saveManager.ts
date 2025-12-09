
import { get, set, keys, del } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import type { GameSave, RpgGameState, QuestEntry } from '../types';

const SAVE_KEY_PREFIX = 'save_';

export const saveGame = async (
    save: GameSave
): Promise<GameSave> => {
    // If it's an existing save (overwrite), update timestamp
    const updatedSave = {
        ...save,
        updatedAt: new Date().toISOString(),
        lastPlayedAt: new Date().toISOString()
    };
    await set(`${SAVE_KEY_PREFIX}${updatedSave.id}`, updatedSave);
    return updatedSave;
};

export const createNewSave = async (
    worldId: string,
    gameState: RpgGameState,
    name: string,
    description: string,
    currentLocation: string,
    scenarioId?: string,
): Promise<GameSave> => {
    const newSave: GameSave = {
        id: uuidv4(),
        worldId,
        scenarioId,
        name,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastPlayedAt: new Date().toISOString(),
        campaignProgress: {
            chaptersCompleted: 0,
            currentLocation,
            playedHours: 0
        },
        gameState,
        inventory: gameState.inventory,
        questLog: gameState.quests.map(q => ({
            id: q.id,
            title: q.title,
            description: q.description,
            status: q.status,
            progress: 0,
            objectives: q.objectives.map((obj, i) => ({ id: `${q.id}-obj-${i}`, description: obj, completed: false })),
            rewards: [],
            startedAt: new Date().toISOString()
        })),
        preview: description,
        characterId: 'omni-ai' // Default GM
    };

    await set(`${SAVE_KEY_PREFIX}${newSave.id}`, newSave);
    return newSave;
};

export const loadSave = async (saveId: string): Promise<GameSave | undefined> => {
    return await get<GameSave>(`${SAVE_KEY_PREFIX}${saveId}`);
};

export const deleteSave = async (saveId: string): Promise<void> => {
    await del(`${SAVE_KEY_PREFIX}${saveId}`);
};

export const listSavesByWorld = async (worldId: string): Promise<GameSave[]> => {
    const allKeys = await keys();
    const saveKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(SAVE_KEY_PREFIX));
    const saves = await Promise.all(saveKeys.map(k => get<GameSave>(k)));
    
    return saves
        .filter((s): s is GameSave => s !== undefined && s.worldId === worldId)
        .sort((a, b) => new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime());
};

export const exportSave = async (saveId: string): Promise<string> => {
    const save = await loadSave(saveId);
    if (!save) throw new Error("Save not found");
    return JSON.stringify(save, null, 2);
};

export const importSave = async (jsonString: string): Promise<GameSave> => {
    try {
        const saveData = JSON.parse(jsonString) as GameSave;
        // Basic validation
        if (!saveData.id || !saveData.worldId || !saveData.gameState) {
            throw new Error("Invalid save file structure");
        }
        // Generate new ID to avoid conflicts on import
        saveData.id = uuidv4();
        saveData.name = `${saveData.name} (Imported)`;
        await saveGame(saveData);
        return saveData;
    } catch (e) {
        throw new Error(`Failed to import save: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
};
