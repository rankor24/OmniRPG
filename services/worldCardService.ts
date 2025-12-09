
import type { World } from '../types';

export const getGenreGradient = (genre: World['genre']): string => {
  switch (genre) {
    case 'fantasy':
      return 'bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900';
    case 'scifi':
      return 'bg-gradient-to-br from-cyan-900 via-blue-900 to-slate-900';
    case 'horror':
      return 'bg-gradient-to-br from-red-950 via-gray-900 to-black';
    case 'modern':
      return 'bg-gradient-to-br from-emerald-900 via-gray-800 to-slate-900';
    case 'custom':
    default:
      return 'bg-gradient-to-br from-gray-800 via-slate-800 to-black';
  }
};

export const getGenreIconName = (genre: World['genre']): string => {
  switch (genre) {
    case 'fantasy': return 'sword';
    case 'scifi': return 'rocket';
    case 'horror': return 'skull';
    case 'modern': return 'building';
    default: return 'globe';
  }
};

export const formatWorldDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const validateWorldForPlay = (world: World): { valid: boolean; error?: string } => {
  if (!world.id) return { valid: false, error: 'World ID is missing.' };
  if (!world.name) return { valid: false, error: 'World Name is missing.' };
  if (!world.startingScenarios || world.startingScenarios.length === 0) {
    return { valid: false, error: 'World has no defined scenarios.' };
  }
  return { valid: true };
};
