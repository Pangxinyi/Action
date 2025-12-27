/**
 * useAppData Hook
 * Manages loading and saving app data with local storage persistence
 */

import { Dispatch, SetStateAction, useEffect } from 'react';
import { AppData, loadAppData, saveAppData } from '../utils/storage';

type UseAppDataResult = {
  isLoaded: boolean;
};

/**
 * Hook to load and save app data
 * Call this once when the app initializes
 */
export const useAppData = (
  projects: any[],
  events: any[],
  categories: { [key: string]: string },
  setProjects: Dispatch<SetStateAction<any[]>>,
  setEvents: Dispatch<SetStateAction<any[]>>,
  setCategories: Dispatch<SetStateAction<{ [key: string]: string }>>,
  onLoaded?: () => void
): UseAppDataResult => {
  const isLoaded = projects.length > 0 || events.length > 0;

  // Load data on app mount
  useEffect(() => {
    const loadData = async () => {
      const savedData = await loadAppData();
      if (savedData) {
        // Only apply saved data if the current in-memory state is still empty.
        // Use functional updaters to inspect latest state and avoid overwriting
        // user-created data that may have been added before async load finished.
        setProjects((prev) => (prev && prev.length > 0 ? prev : savedData.projects || []));
        setEvents((prev) => (prev && prev.length > 0 ? prev : savedData.events || []));
        setCategories((prev) => (prev && Object.keys(prev).length > 0 ? prev : savedData.categories || {}));
      }
      onLoaded?.();
    };
    loadData();
  }, []);

  // Auto-save data when it changes
  useEffect(() => {
    if (isLoaded) {
      const data: AppData = {
        projects,
        events,
        categories,
        version: '1.0.0',
      };
      saveAppData(data).catch(console.error);
    }
  }, [projects, events, categories]);

  return { isLoaded };
};
