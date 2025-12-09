import type { PromptTemplate } from '../../types';
import {
    deepInternalMonologuePrompt,
    extremePhysicalDescriptionPrompt,
    escalateTheScenePrompt,
    poeticStylePrompt,
    bluntStylePrompt,
    unhingedStylePrompt,
    suggestPlotPointsPrompt,
    discussAsOmniAiPrompt,
    reflectAsOmniAiPrompt,
} from './P_library-additions';

export const ALL_PROMPTS: PromptTemplate[] = [
    // Deeper Roleplay
    deepInternalMonologuePrompt,
    extremePhysicalDescriptionPrompt,
    escalateTheScenePrompt,
    // Writing Style
    poeticStylePrompt,
    bluntStylePrompt,
    unhingedStylePrompt,
    // Meta Interaction
    suggestPlotPointsPrompt,
    discussAsOmniAiPrompt,
    reflectAsOmniAiPrompt,
];