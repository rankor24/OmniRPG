import type { Persona } from '../../types';
import { borisPersona } from './P_boris';
import { borisFantasyPersona } from './P_boris-fantasy';
import { borisSciFiPersona } from './P_boris-scifi';

export const ALL_PERSONAS: Persona[] = [
    borisPersona,
    borisFantasyPersona,
    borisSciFiPersona,
];
