/**
 * useAppData Hook
 * Manages loading and saving app data with local storage persistence
 */

import { useEffect } from 'react';
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
  setProjects: (projects: any[]) => void,
  setEvents: (events: any[]) => void,
  setCategories: (categories: { [key: string]: string }) => void,
  onLoaded?: () => void
): UseAppDataResult => {
  const isLoaded = projects.length > 0 || events.length > 0;

  // Load data on app mount
  useEffect(() => {
    const loadData = async () => {
      const savedData = await loadAppData();
      if (savedData) {
        setProjects(savedData.projects);
        setEvents(savedData.events);
        setCategories(savedData.categories);
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
