
import { useState, useCallback } from 'react';
import { saveGame, createNewSave, listSavesByWorld, loadSave, deleteSave } from '../services/saveManager';
import type { GameSave, RpgGameState } from '../types';

export const useSaveManager = (worldId: string) => {
    const [saves, setSaves] = useState<GameSave[]>([]);
    const [loading, setLoading] = useState(false);

    const refreshSaves = useCallback(async () => {
        if (!worldId) return;
        setLoading(true);
        try {
            const fetchedSaves = await listSavesByWorld(worldId);
            setSaves(fetchedSaves);
        } catch (e) {
            console.error("Failed to load saves:", e);
        } finally {
            setLoading(false);
        }
    }, [worldId]);

    const handleCreateSave = useCallback(async (
        gameState: RpgGameState,
        name: string,
        description: string,
        currentLocation: string,
        scenarioId?: string
    ) => {
        try {
            const newSave = await createNewSave(worldId, gameState, name, description, currentLocation, scenarioId);
            await refreshSaves();
            return newSave;
        } catch (e) {
            console.error("Failed to create save:", e);
            throw e;
        }
    }, [worldId, refreshSaves]);

    const handleOverwriteSave = useCallback(async (save: GameSave) => {
        try {
            const updated = await saveGame(save);
            await refreshSaves();
            return updated;
        } catch (e) {
            console.error("Failed to overwrite save:", e);
            throw e;
        }
    }, [refreshSaves]);

    const handleDeleteSave = useCallback(async (saveId: string) => {
        try {
            await deleteSave(saveId);
            await refreshSaves();
        } catch (e) {
            console.error("Failed to delete save:", e);
            throw e;
        }
    }, [refreshSaves]);

    const handleQuickSave = useCallback(async (
        gameState: RpgGameState, 
        currentLocation: string,
        scenarioId?: string
    ) => {
        const dateStr = new Date().toLocaleString();
        return await handleCreateSave(gameState, `Quick Save - ${dateStr}`, `Auto-generated at ${currentLocation}`, currentLocation, scenarioId);
    }, [handleCreateSave]);

    return {
        saves,
        loading,
        refreshSaves,
        createSave: handleCreateSave,
        overwriteSave: handleOverwriteSave,
        deleteSave: handleDeleteSave,
        quickSave: handleQuickSave,
        loadSave
    };
};
