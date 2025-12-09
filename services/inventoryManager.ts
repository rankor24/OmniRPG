
export interface ConsolidatedItem {
    name: string;
    count: number;
    rawNames: string[]; // Keep original strings for consistency with simple string[] state
}

export const consolidateInventory = (items: string[]): ConsolidatedItem[] => {
    const map = new Map<string, ConsolidatedItem>();
    
    for (const item of items) {
        // Strip stats for grouping e.g., "Sword (+1)" -> "Sword"
        const cleanName = item.replace(/\s*\(.*?\)\s*/g, '').trim();
        
        if (!map.has(cleanName)) {
            map.set(cleanName, { name: cleanName, count: 0, rawNames: [] });
        }
        
        const entry = map.get(cleanName)!;
        entry.count++;
        entry.rawNames.push(item);
    }
    
    return Array.from(map.values());
};

export const addItem = (currentInventory: string[], itemToAdd: string): string[] => {
    return [...currentInventory, itemToAdd];
};

export const removeItem = (currentInventory: string[], itemToRemove: string): string[] => {
    // Finds index of first match and removes it
    const index = currentInventory.indexOf(itemToRemove);
    if (index > -1) {
        const newInv = [...currentInventory];
        newInv.splice(index, 1);
        return newInv;
    }
    return currentInventory;
};
