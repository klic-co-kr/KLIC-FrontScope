/// <reference types="chrome" />
import { useState, useEffect } from 'react';

export function useStorage<T>(key: string, initialValue: T) {
    const [value, setValue] = useState<T>(initialValue);

    useEffect(() => {
        // Initial fetch
        chrome.storage.local.get([key], (result) => {
            if (result[key] !== undefined) {
                setValue(result[key] as T);
            }
        });

        // Listen for changes
        const handleChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
            if (areaName === 'local' && changes[key]) {
                setValue(changes[key].newValue as T);
            }
        };

        chrome.storage.onChanged.addListener(handleChange);

        return () => {
            chrome.storage.onChanged.removeListener(handleChange);
        };
    }, [key]);

    const setStorageValue = (newValue: T) => {
        setValue(newValue);
        chrome.storage.local.set({ [key]: newValue });
    };

    return [value, setStorageValue] as const;
}
