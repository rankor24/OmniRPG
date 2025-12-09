import React, { useState, useEffect } from 'react';

export function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const readValue = () => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (!item) {
        return initialValue;
      }
      const parsedItem = JSON.parse(item);
      
      // If initialValue is an object (but not an array), merge it with the parsed item.
      if (typeof initialValue === 'object' && initialValue !== null && !Array.isArray(initialValue) &&
          typeof parsedItem === 'object' && parsedItem !== null && !Array.isArray(parsedItem)) {
        
        const merged = { ...initialValue, ...parsedItem };
        return merged as T;
      }
      
      return parsedItem;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };
  
  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      // Wrap the entire logic in the useState setter to ensure we have the latest state.
      // This prevents race conditions where rapid updates overwrite each other.
      setStoredValue(currentStoredValue => {
        // Resolve the new value, whether it's a direct value or a function.
        const valueToStore = value instanceof Function ? value(currentStoredValue) : value;
        
        // Persist to localStorage.
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        
        // Return the new state for React to render.
        return valueToStore;
      });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    setStoredValue(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [storedValue, setValue];
}
