import { Dispatch, SetStateAction, useEffect, useRef } from 'react';
import { AppData, loadAppData, saveAppData } from '../utils/storage';

import { debounce } from 'lodash';

export const useAppData = (
  projects: any[],
  events: any[],
  categories: { [key: string]: string },
  setProjects: Dispatch<SetStateAction<any[]>>,
  setEvents: Dispatch<SetStateAction<any[]>>,
  setCategories: Dispatch<SetStateAction<{ [key: string]: string }>>,
  onLoaded?: () => void
) => {
  const isLoaded = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      const savedData = await loadAppData();
      if (savedData) {
        setProjects((prev) => (prev.length > 0 ? prev : savedData.projects || []));
        setEvents((prev) => (prev.length > 0 ? prev : savedData.events || []));
        setCategories((prev) => (Object.keys(prev).length > 0 ? prev : savedData.categories || {}));
      }
      isLoaded.current = true;
      onLoaded?.();
    };
    loadData();
  }, []);


  const debouncedSave = useRef(
    debounce((data: AppData) => {
      console.log('Auto-saving data...');
      saveAppData(data).catch(console.error);
    }, 2000) 
  ).current;


  useEffect(() => {
    if (isLoaded.current) {
      const data: AppData = {
        projects,
        events,
        categories,
        version: '1.0.0',
      };
      debouncedSave(data);
    }
  }, [projects, events, categories]);

  return { isLoaded: isLoaded.current };
};