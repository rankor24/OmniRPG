export interface SearchableItem {
  id: string;
  type: 'memory' | 'lorebookEntry' | 'character';
  content: string;
  embedding: number[];
  [key: string]: any; // for additional metadata
}

export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) {
      return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const search = (
    queryEmbedding: number[], 
    items: SearchableItem[], 
    topK: number
): (SearchableItem & { similarity: number })[] => {
    if (!queryEmbedding || items.length === 0) {
        return [];
    }

    const similarities = items
        .map(item => ({
            ...item,
            similarity: cosineSimilarity(queryEmbedding, item.embedding)
        }))
        .filter(item => item.similarity > 0.5); // Set a base threshold for relevance

    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, topK);
};
