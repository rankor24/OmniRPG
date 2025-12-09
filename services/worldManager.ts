import { get, set, keys, del } from 'idb-keyval';
import type { World } from '../types';
import { DEFAULT_WORLDS } from '../data/worlds';

const WORLD_KEY_PREFIX = 'world_';

export const listWorlds = async (): Promise<World[]> => {
  const allKeys = await keys();
  const worldKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(WORLD_KEY_PREFIX));
  
  if (worldKeys.length === 0) {
    // Initialize default worlds if none exist
    for (const world of DEFAULT_WORLDS) {
        await set(`${WORLD_KEY_PREFIX}${world.id}`, world);
    }
    return DEFAULT_WORLDS;
  }

  const worlds = await Promise.all(worldKeys.map(k => get<World>(k)));
  return worlds.filter(w => w !== undefined) as World[];
};

export const loadWorld = async (worldId: string): Promise<World | undefined> => {
  return await get<World>(`${WORLD_KEY_PREFIX}${worldId}`);
};

export const createWorld = async (worldData: World): Promise<World> => {
  const newWorld = { ...worldData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await set(`${WORLD_KEY_PREFIX}${newWorld.id}`, newWorld);
  return newWorld;
};

export const updateWorld = async (worldId: string, changes: Partial<World>): Promise<World> => {
  const existing = await loadWorld(worldId);
  if (!existing) throw new Error(`World ${worldId} not found`);
  
  const updated = { ...existing, ...changes, updatedAt: new Date().toISOString() };
  await set(`${WORLD_KEY_PREFIX}${worldId}`, updated);
  return updated;
};

export const deleteWorld = async (worldId: string): Promise<void> => {
  await del(`${WORLD_KEY_PREFIX}${worldId}`);
};

export const exportWorld = async (worldId: string): Promise<string> => {
  const world = await loadWorld(worldId);
  if (!world) throw new Error(`World ${worldId} not found`);
  return JSON.stringify(world, null, 2);
};

export const importWorld = async (jsonString: string): Promise<World> => {
  try {
    const worldData = JSON.parse(jsonString) as World;
    if (!worldData.id || !worldData.name) throw new Error("Invalid world data");
    await createWorld(worldData);
    return worldData;
  } catch (e) {
    throw new Error("Failed to import world: " + (e instanceof Error ? e.message : "Unknown error"));
  }
};
