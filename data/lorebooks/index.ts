
import type { Lorebook } from '../../types';
import { baseKnowledgeLorebook } from './L_base-knowledge';
import { borisKnowledgeLorebook } from './L_boris-knowledge';
import { dungeonLorebook } from './L_dungeon';
import { ebonyWhorusLorebook } from './L_ebony-whorus';
import { omniAiManualLorebook } from './L_omni-ai-manual';
import { vampireCastleLorebook } from './L_vampire-castle';
import { organicaShipLorebook } from './L_vita-organica-ship';

export const ALL_LOREBOOKS: Lorebook[] = [
    baseKnowledgeLorebook,
    borisKnowledgeLorebook,
    dungeonLorebook,
    ebonyWhorusLorebook,
    omniAiManualLorebook,
    vampireCastleLorebook,
    organicaShipLorebook,
];
