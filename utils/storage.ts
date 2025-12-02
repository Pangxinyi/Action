/**
 * Local Storage Utilities for Action App
 * Handles saving and loading app data (projects, events, links, categories)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppData = {
  projects: any[];
  events: any[];
  categories: { [key: string]: string };
  version: string;
};

const STORAGE_KEY = 'action_app_data';
const APP_VERSION = '1.0.0';

/**
 * Save app data to local storage
 */
export const saveAppData = async (data: AppData): Promise<void> => {
  try {
    const dataToSave: AppData = {
      ...data,
      version: APP_VERSION,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    console.log('✓ App data saved successfully');
  } catch (error) {
    console.error('✗ Failed to save app data:', error);
    throw error;
  }
};

/**
 * Load app data from local storage
 */
export const loadAppData = async (): Promise<AppData | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) {
      console.log('No saved app data found');
      return null;
    }
    const parsed = JSON.parse(data) as AppData;
    console.log('✓ App data loaded successfully');
    return parsed;
  } catch (error) {
    console.error('✗ Failed to load app data:', error);
    return null;
  }
};

/**
 * Clear all app data from local storage
 */
export const clearAppData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('✓ App data cleared');
  } catch (error) {
    console.error('✗ Failed to clear app data:', error);
    throw error;
  }
};

/**
 * Import data from JSON
 */
export const importDataFromJSON = (jsonString: string): AppData => {
  const data = JSON.parse(jsonString);
  
  // Validate required fields
  if (!data.projects || !Array.isArray(data.projects)) {
    throw new Error('Invalid format: missing projects array');
  }
  if (!data.events || !Array.isArray(data.events)) {
    throw new Error('Invalid format: missing events array');
  }
  
  return {
    projects: data.projects,
    events: data.events,
    categories: data.categories || {},
    version: APP_VERSION,
  };
};

/**
 * Export data as JSON string
 */
export const exportDataAsJSON = (data: AppData): string => {
  return JSON.stringify(data, null, 2);
};

/**
 * Merge imported data with existing data
 * Strategy: imported data overwrites existing data
 */
export const mergeAppData = (
  existingData: AppData,
  importedData: AppData,
  mergeStrategy: 'overwrite' | 'merge' = 'overwrite'
): AppData => {
  if (mergeStrategy === 'overwrite') {
    return importedData;
  }

  // 'merge' strategy: combine arrays with deduplication
  const projectIds = new Set(existingData.projects.map((p) => p.id));
  const eventIds = new Set(existingData.events.map((e) => e.id));

  const mergedProjects = [
    ...existingData.projects,
    ...importedData.projects.filter((p) => !projectIds.has(p.id)),
  ];

  const mergedEvents = [
    ...existingData.events,
    ...importedData.events.filter((e) => !eventIds.has(e.id)),
  ];

  return {
    projects: mergedProjects,
    events: mergedEvents,
    categories: { ...existingData.categories, ...importedData.categories },
    version: APP_VERSION,
  };
};

/**
 * Transform custom JSON format to app format
 * Supports format: { date, time, tag, type, project, ... }
 */
export const transformCustomFormat = (customData: any[]): AppData => {
  const APP_COLORS = ['#BFA2DB', '#D1D9F2', '#A8E6CF', '#E6B8B7', '#E6C8DC', '#EFD9CE'];
  
  const projects: any[] = [];
  const events: any[] = [];
  const categories: { [key: string]: string } = {};
  const projectMap = new Map<string, number>(); // name -> id
  const projectCategoryMap = new Map<string, string>(); // project name -> category
  
  // First pass: collect unique projects and categories
  const uniqueProjects = new Set<string>();
  const uniqueCategories = new Set<string>();
  
  customData.forEach((item) => {
    if (item.project && Array.isArray(item.project)) {
      item.project.forEach((p: string) => {
        uniqueProjects.add(p);
        // Store the first category encountered for each project
        if (item.type && !projectCategoryMap.has(p)) {
          projectCategoryMap.set(p, item.type);
        }
      });
    }
    if (item.type) {
      uniqueCategories.add(item.type);
    }
  });

  // Create categories with colors FIRST
  let colorIndex = 0;
  uniqueCategories.forEach((catName) => {
    categories[catName] = APP_COLORS[colorIndex % APP_COLORS.length];
    colorIndex++;
  });

  // Create projects with their associated categories and colors from categories
  let projectIndex = 0;
  uniqueProjects.forEach((projectName) => {
    const id = Date.now() + Math.random();
    projectMap.set(projectName, id);
    const category = projectCategoryMap.get(projectName) || null;
    const hexColor = category ? categories[category] : APP_COLORS[projectIndex % APP_COLORS.length];
    projects.push({
      id,
      name: projectName,
      time: '0h 0m',
      percent: 0,
      hexColor,
      category,
      x: 150 + (projectIndex % 3) * 100,
      y: 150 + Math.floor(projectIndex / 3) * 100,
    });
    projectIndex++;
  });

  // Create events
  customData.forEach((item) => {
    const date = item.date ? new Date(item.date) : new Date();
    const timeStr = item.time || '12pm-1pm';
    
    // Parse time (e.g., "1pm-2pm" -> start: 13*60, duration: 60)
    const timeMatch = timeStr.match(/(\d+)(am|pm)?-(\d+)(am|pm)?/i);
    let startHour = 12;
    let endHour = 13;
    
    if (timeMatch) {
      let start = parseInt(timeMatch[1], 10);
      const startPeriod = timeMatch[2]?.toLowerCase();
      let end = parseInt(timeMatch[3], 10);
      const endPeriod = timeMatch[4]?.toLowerCase();
      
      // Convert to 24-hour format
      if (startPeriod === 'pm' && start !== 12) start += 12;
      if (startPeriod === 'am' && start === 12) start = 0;
      if (endPeriod === 'pm' && end !== 12) end += 12;
      if (endPeriod === 'am' && end === 12) end = 0;
      
      startHour = start;
      endHour = end;
    }
    
    const start = startHour * 60;
    const duration = (endHour - startHour) * 60;
    
    // Determine project and color
    const projectNames = item.project && Array.isArray(item.project) ? item.project : [];
    const projectId = projectNames.length > 0 ? projectMap.get(projectNames[0]) : null;
    const categoryName = item.type || 'Other';
    const hexColor = categories[categoryName] || APP_COLORS[0];
    
    // Format date as YYYY-MM-DD
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate(),
    ).padStart(2, '0')}`;
    
    events.push({
      id: Date.now() + Math.random(),
      title: item.tag || '(No title)',
      start,
      duration: Math.max(duration, 30), // Minimum 30 mins
      hexColor,
      details: item.tag,
      category: item.type,
      date: dateStr,
      projectId: projectId || undefined,
    });
  });

  return {
    projects,
    events,
    categories,
    version: '1.0.0',
  };
};
