import { Dispatch, SetStateAction, useEffect, useRef } from 'react';
import { AppData, loadAppData, saveAppData } from 'src/utils/storage';

import { debounce } from 'lodash';
import { getDefaultCategories } from '../constants/categories';
import { getSystemLanguage } from '../i18n/i18n';

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
      // Only use saved data if it has categories with content
      // If user deleted all categories, savedData.categories will be {} (empty object)
      // We should respect that and NOT re-add defaults
      const hasStoredData = savedData !== null;
      
      if (savedData) {
        // 强制使用存储的数据，不管当前状态如何
        setProjects(savedData.projects || []);
        setEvents(savedData.events || []);
        setCategories(savedData.categories || {});
      }
      
      // Only add default categories if this is the very first app launch (no saved data at all)
      if (!hasStoredData) {
        setCategories(getDefaultCategories(getSystemLanguage()));
      }
      
      isLoaded.current = true;
      onLoaded?.();
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const debouncedSave = useRef(
    debounce((data: AppData) => {
      saveAppData(data).catch(console.error);
    }, 500) 
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
  }, [projects, events, categories, debouncedSave]);

  return { isLoaded: isLoaded.current };
};