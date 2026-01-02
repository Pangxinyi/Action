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
    if (!data) return null;
    return JSON.parse(data) as AppData;
  } catch (error) {
    console.error('✗ Failed to load app data:', error);
    throw error;
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
 * Export data as JSON
 */
export const exportDataAsJSON = (data: AppData): string => {
  return JSON.stringify(data, null, 2);
};