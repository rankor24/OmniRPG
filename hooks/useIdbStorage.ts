import React, { useState, useEffect, useRef } from 'react';
import { get, set } from 'idb-keyval';

export function useIdbStorage<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);

  useEffect(() => {
    let isMounted = true;
    
    get<T>(key).then(val => {
      if (isMounted) {
        if (val === undefined || val === null) {
          set(key, initialValue);
          setStoredValue(initialValue);
        } else {
          setStoredValue(val);
        }
      }
    }).catch(err => {
        console.warn(`Error reading IndexedDB key "${key}":`, err);
    }).finally(() => {
        if (isMounted) {
            isInitialized.current = true;
            setIsLoading(false);
        }
    });

    return () => { isMounted = false; };
  }, [key]);

  useEffect(() => {
    if (isInitialized.current) {
        set(key, storedValue).catch(err => console.error(`Error writing to IndexedDB key "${key}":`, err));
    }
  }, [key, storedValue]);

  const setValue: React.Dispatch<React.SetStateAction<T>> = setStoredValue;

  return [storedValue, setValue, isLoading];
}