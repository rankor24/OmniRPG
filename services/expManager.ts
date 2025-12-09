import type { AppSettings, Character, Lorebook, Persona, PromptTemplate, Memory, Reflection, ReflectionProposal, ChatMessage, Conversation, ManualExpLogEntry, RatingExpLogEntry } from '../types';

export const EXP_VALUES = {
  NEW_PERSONA: 50,
  NEW_CHARACTER: 50,
  NEW_PROMPT: 25,
  NEW_LOREBOOK: 40,
  NEW_LOREBOOK_ENTRY: 15,
  NEW_MEMORY: 20,
  MESSAGE: 1,
  PROPOSAL_APPROVED_MINOR: 10,       // e.g., conversation rename
  PROPOSAL_APPROVED_ADD: 75,         // e.g., new memory, new lore entry
  PROPOSAL_APPROVED_EDIT: 125,       // e.g., character field, memory correction
  PROPOSAL_APPROVED_DELETE: 25,
  PROPOSAL_APPROVED_SYSTEM: 200,     // e.g., core system prompt
  // New Rating EXP
  RATING_1_STAR: -5,
  RATING_2_STAR: -2,
  RATING_3_STAR: 1,
  RATING_4_STAR: 3,
  RATING_5_STAR: 5,
};

export interface ExpBreakdown {
  creation: {
    title: string;
    value: number;
    details: { name: string, count: number, points: number }[];
  };
  interaction: {
    title: string;
    value: number;
    details: { name: string, count: number, points: number }[];
  };
  learning: {
    title: string;
    value: number;
    details: { name: string, count: number, points: number }[];
  };
  total: number;
}

export const LEVEL_NAMES = [
    "Glimmer of Emotion", "Ray of Empathy", "Beam of Compassion", "Glow of Insight",
    "Shine of Awareness", "Radiance of Wisdom", "Luster of Connection",
    "Brilliance of Understanding", "Prism of Consciousness", "Omni Light"
];

export const getLevel = (exp: number) => {
    if (exp < 4000) return { level: 1, progress: exp / 4000, needed: 4000, current: exp };
    const level = Math.floor(Math.log(exp / 4000) / Math.log(1.85)) + 1;
    const expForCurrentLevel = 4000 * Math.pow(1.85, level - 1);
    const expForNextLevel = 4000 * Math.pow(1.85, level);
    const progress = (exp - expForCurrentLevel) / (expForNextLevel - expForCurrentLevel);
    return { level, progress, needed: expForNextLevel, current: exp };
};


const getProposalExp = (proposal: ReflectionProposal): number => {
  if (proposal.status !== 'approved') return 0;
  if (proposal.type === 'conversation' && proposal.action === 'edit' && proposal.updatedFields?.preview) {
      return EXP_VALUES.PROPOSAL_APPROVED_MINOR;
  }
  if (proposal.type === 'instructionalPrompt' && proposal.action === 'edit') {
      return EXP_VALUES.PROPOSAL_APPROVED_SYSTEM;
  }
  switch (proposal.action) {
      case 'add': return EXP_VALUES.PROPOSAL_APPROVED_ADD;
      case 'edit': return EXP_VALUES.PROPOSAL_APPROVED_EDIT;
      case 'delete': return EXP_VALUES.PROPOSAL_APPROVED_DELETE;
      default: return 0;
  }
};

export const calculateExp = async (
  personas: Persona[],
  characters: Character[],
  prompts: PromptTemplate[],
  lorebooks: Lorebook[],
  allReflections: Reflection[],
  totalMessages: number,
  manualExpLog: ManualExpLogEntry[],
  ratingExpLog: RatingExpLogEntry[],
  allMemories: Memory[]
): Promise<ExpBreakdown> => {
  // Creation EXP (Subtract default items to only count user-created content)
  const personaExp = Math.max(0, (personas.length - 3) * EXP_VALUES.NEW_PERSONA);
  const charExp = Math.max(0, (characters.length - 22) * EXP_VALUES.NEW_CHARACTER);
  const promptExp = Math.max(0, (prompts.length - 9) * EXP_VALUES.NEW_PROMPT);
  const lorebookExp = Math.max(0, (lorebooks.length - 14) * EXP_VALUES.NEW_LOREBOOK);
  const lorebookEntryCount = lorebooks.reduce((sum, lb) => sum + lb.entries.length, 0);
  const lorebookEntryExp = Math.max(0, (lorebookEntryCount - 185) * EXP_VALUES.NEW_LOREBOOK_ENTRY);

  // Calculate EXP for manually created memories, excluding those from approved reflections to avoid double-counting.
  const reflectionAddedMemories = allReflections
    .flatMap(r => r.proposals)
    .filter(p => p.type === 'memory' && p.action === 'add' && p.status === 'approved')
    .length;
  const manualMemoryCount = Math.max(0, allMemories.length - reflectionAddedMemories);
  const memoryExp = manualMemoryCount * EXP_VALUES.NEW_MEMORY;

  const creationDetails = [
    { name: 'Personas', count: Math.max(0, personas.length - 3), points: personaExp },
    { name: 'Characters', count: Math.max(0, characters.length - 22), points: charExp },
    { name: 'Prompts', count: Math.max(0, prompts.length - 9), points: promptExp },
    { name: 'Lorebooks', count: Math.max(0, lorebooks.length - 14), points: lorebookExp },
    { name: 'Lore Entries', count: Math.max(0, lorebookEntryCount - 185), points: lorebookEntryExp },
    { name: 'Memories', count: manualMemoryCount, points: memoryExp },
  ].filter(d => d.count > 0);

  const totalCreationExp = creationDetails.reduce((sum, d) => sum + d.points, 0);

  // Interaction EXP
  const messageExp = totalMessages * EXP_VALUES.MESSAGE;
  const manualTipExp = manualExpLog.reduce((sum, entry) => sum + entry.amount, 0);
  const ratingExp = ratingExpLog.reduce((sum, entry) => sum + entry.expChange, 0);
  
  const interactionDetails = [
    { name: 'Messages', count: totalMessages, points: messageExp },
  ];
  if (manualTipExp !== 0) {
    interactionDetails.push({ name: 'Manual Tips', count: manualExpLog.length, points: manualTipExp });
  }
   if (ratingExp !== 0) {
      interactionDetails.push({ name: 'Message Ratings', count: ratingExpLog.length, points: ratingExp });
  }
  
  const totalInteractionExp = messageExp + manualTipExp + ratingExp;
  
  // Learning EXP
  const allProposals = allReflections.flatMap(r => r.proposals);
  const approvedProposals = allProposals.filter(p => p.status === 'approved');
  const learningDetailsMap = new Map<string, { count: number, points: number }>();

  approvedProposals.forEach(p => {
      const points = getProposalExp(p);
      const key = `${p.action} ${p.type}`;
      const existing = learningDetailsMap.get(key) || { count: 0, points: 0 };
      learningDetailsMap.set(key, { count: existing.count + 1, points: existing.points + points });
  });

  const learningDetails = Array.from(learningDetailsMap.entries()).map(([name, data]) => ({ name, ...data }));
  const totalLearningExp = learningDetails.reduce((sum, d) => sum + d.points, 0);

  const total = totalCreationExp + totalInteractionExp + totalLearningExp;

  return {
    creation: { title: 'Creation', value: totalCreationExp, details: creationDetails },
    interaction: { title: 'Interaction', value: totalInteractionExp, details: interactionDetails },
    learning: { title: 'Learning', value: totalLearningExp, details: learningDetails },
    total
  };
};