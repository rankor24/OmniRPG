import type { RpgGameState } from '../types';
import { DEFAULT_RPG_GAME_STATE } from '../constants';

/**
 * Parses a JSON string from the AI's [Sys | {...}] block into an RpgGameState object.
 * This function is designed to be robust against malformed AI output.
 * @param rpgString The full system summary string from the AI, e.g., "[Sys | {...}]"
 * @returns A complete RpgGameState object, or null if parsing fails completely.
 */
export function parseRpgStateFromJsonString(rpgString: string): RpgGameState | null {
    try {
        // Use a regex to extract only the JSON object, ignoring the [Sys |] wrapper and any trailing characters.
        const jsonMatch = rpgString.match(/({[\s\S]*?})/);
        if (!jsonMatch || !jsonMatch[1]) {
            console.warn("RPG Parser: Could not find a JSON object in the system summary.", rpgString);
            return null;
        }

        const jsonString = jsonMatch[1];
        const parsedData = JSON.parse(jsonString);

        // Merge the parsed data with the default state to ensure all fields are present.
        // This prevents the app from crashing if the AI omits a field.
        const newState: RpgGameState = {
            ...DEFAULT_RPG_GAME_STATE,
            ...parsedData,
            player: {
                ...DEFAULT_RPG_GAME_STATE.player,
                ...parsedData.player,
            },
        };

        return newState;

    } catch (error) {
        console.error("RPG Parser: Failed to parse JSON from system summary.", {
            error,
            rawString: rpgString
        });
        return null; // Return null to indicate failure
    }
}