
import { fantasyStarterWorld } from './W_fantasy-starter';
import { scifiNovaStrikeWorld } from './W_scifi-novastrike';
import { horrorAsylumWorld } from './W_horror-asylum';
import { dungeonWorld } from './W_dungeon-cnc';
import { tribalEbonyWorld } from './W_tribal-ebony';
import { vampireCastleWorld } from './W_vampire-castle';
import { organicaShipWorld } from './W_organica-ship';
import type { World } from '../../types';

export const DEFAULT_WORLDS: World[] = [
    fantasyStarterWorld,
    scifiNovaStrikeWorld,
    horrorAsylumWorld,
    dungeonWorld,
    tribalEbonyWorld,
    vampireCastleWorld,
    organicaShipWorld
];
