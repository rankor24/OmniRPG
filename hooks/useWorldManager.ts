
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { listWorlds, createWorld, updateWorld, deleteWorld } from '../services/worldManager';
import type { World, Conversation, Scenario, Character, RpgItem } from '../types';
import { DEFAULT_RPG_GAME_STATE } from '../constants';
import { useLocalStorage } from './useLocalStorage';
import { findItemTemplate } from '../data/items';

export const useWorldManager = (omniAiId: string, libraryItems: RpgItem[]) => {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // We need access to conversations to find saves.
  // Assuming conversations are stored in localStorage under 'conversations_{omniAiId}'
  const [conversations, setConversations] = useLocalStorage<Conversation[]>(`conversations_${omniAiId}`, []);

  const refreshWorlds = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedWorlds = await listWorlds();
      setWorlds(fetchedWorlds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load worlds');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWorlds();
  }, [refreshWorlds]);

  const handleCreateWorld = async (worldData: World) => {
    try {
      await createWorld(worldData);
      await refreshWorlds();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleUpdateWorld = async (worldId: string, changes: Partial<World>) => {
    try {
      await updateWorld(worldId, changes);
      await refreshWorlds();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleDeleteWorld = async (worldId: string) => {
    try {
      await deleteWorld(worldId);
      await refreshWorlds();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const getAvailableSaves = useCallback((worldId: string): Conversation[] => {
    return conversations.filter(c => c.worldId === worldId);
  }, [conversations]);

  const createNewCampaign = useCallback(async (world: World, scenario: Scenario, character?: Character): Promise<Conversation> => {
    // Determine initial prompt based on scenario
    // Note: The actual prompt building happens in useChat, but we set up the conversation structure here.
    
    // Convert simple string inventory from scenario to RpgItem[] using the dynamic libraryItems
    const inventory: RpgItem[] = (scenario.requiredInventory || []).map(itemName => {
        // Use the passed library items to find templates
        const template = findItemTemplate(itemName, libraryItems);
        
        let type: RpgItem['type'] = template?.type || 'misc';
        let stats = template?.stats;
        let icon = template?.icon;

        // Fallback logic if template not found in library
        if (!template) {
            const nameLower = itemName.toLowerCase();
            if (nameLower.includes('sword') || nameLower.includes('dagger') || nameLower.includes('knife')) type = 'weapon';
            else if (nameLower.includes('armor') || nameLower.includes('shield') || nameLower.includes('robe')) type = 'armor';
            else if (nameLower.includes('potion') || nameLower.includes('food')) type = 'consumable';
            else if (nameLower.includes('key')) type = 'key';
            
            if (type === 'weapon') stats = { attack: 2 };
            if (type === 'armor') stats = { defense: 1 };
        }

        return {
            id: uuidv4(),
            name: itemName, // Keep the scenario's specific name (e.g., "Rusty Key") even if template is generic ("Key")
            type: type,
            quantity: 1,
            description: template?.description || 'Item provided by scenario.',
            stats: stats,
            icon: icon
        };
    });

    // Create new conversation object
    const newConversation: Conversation = {
      id: uuidv4(),
      worldId: world.id,
      characterId: omniAiId, // The "Bot" ID is always OmniAI (The GM)
      preview: `${world.name}: ${scenario.title}`,
      lastMessageAt: new Date().toISOString(),
      
      // RPG Specifics
      isRpgMode: true,
      rpgGameState: {
        ...DEFAULT_RPG_GAME_STATE,
        inventory: inventory,
      },
      
      // Session Context
      sessionCharacterId: omniAiId, // GM
      sessionLorebookIds: world.lorebookIds || [],
      
      // Stats (unused in pure RPG mode but kept for compatibility)
      relationshipScore: 0,
      dominanceScore: 0,
      lustScore: 0,
      
      hasCustomTitle: false,
      isIntelligenceInjected: true // GM should be smart
    };

    // Save to local storage
    setConversations(prev => [newConversation, ...prev]);
    
    return newConversation;
  }, [omniAiId, setConversations, libraryItems]);

  return {
    worlds,
    loading,
    error,
    refreshWorlds,
    createWorld: handleCreateWorld,
    updateWorld: handleUpdateWorld,
    deleteWorld: handleDeleteWorld,
    getAvailableSaves,
    createNewCampaign
  };
};
