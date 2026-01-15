import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform } from 'react-native';

import { exportDataAsJSON, loadAppData } from 'src/utils/storage';
import type { CategoryMap, EventItem, Project } from '../../../types';

type UseDataManagementParams = {
  projects: Project[];
  categories: CategoryMap;
  setProjects: Dispatch<SetStateAction<Project[]>>;
  setCategories: Dispatch<SetStateAction<CategoryMap>>;
  setEvents: Dispatch<SetStateAction<EventItem[]>>;
  getCurrentThemeColors: () => readonly string[];
  setShowSettings: Dispatch<SetStateAction<boolean>>;
};

const parseTimeRangeWithStart = (timeStr: string): { start: number; duration: number } => {
  try {
    const match = timeStr.match(/(\d+)(?:\.(\d+))?(am|pm)-(\d+)(?:\.(\d+))?(am|pm)/i);
    if (!match) return { start: 9 * 60, duration: 60 };

    let startHour = parseInt(match[1], 10);
    const startMin = match[2] ? parseInt(match[2], 10) : 0;
    let endHour = parseInt(match[4], 10);
    const endMin = match[5] ? parseInt(match[5], 10) : 0;
    const startPeriod = match[3].toLowerCase();
    const endPeriod = match[6].toLowerCase();

    if (startPeriod === 'pm' && startHour !== 12) startHour += 12;
    if (startPeriod === 'am' && startHour === 12) startHour = 0;
    if (endPeriod === 'pm' && endHour !== 12) endHour += 12;
    if (endPeriod === 'am' && endHour === 12) endHour = 0;

    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }

    return { start: startMinutes, duration: endMinutes - startMinutes };
  } catch {
    return { start: 9 * 60, duration: 60 };
  }
};

export const useDataManagement = ({
  projects,
  categories,
  setProjects,
  setCategories,
  setEvents,
  getCurrentThemeColors,
  setShowSettings,
}: UseDataManagementParams) => {
  const { t } = useTranslation();

  const handleImportData = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const files = result.assets || [result];
      let totalImported = 0;
      let totalProjectsCreated = 0;
      const newCategories: CategoryMap = { ...categories };
      let colorIndex = Object.keys(categories).filter(name => name !== 'uncategorized').length;
      const allNewEvents: EventItem[] = [];
      const newProjects: Project[] = [...projects];
      const themeColors = getCurrentThemeColors();

      for (const file of files) {
        try {
          const response = await fetch(file.uri);
          const jsonText = await response.text();
          const data = JSON.parse(jsonText);

          if (!Array.isArray(data)) {
            Alert.alert(t('common.error'), t('projects.importFileArrayRequired', { file: file.name }));
            continue;
          }

          data.forEach((item: any, index: number) => {
            const date = item.date || new Date().toISOString().split('T')[0];
            const tag = item.tag || undefined;
            const type = item.type || null;
            const project = item.project || null;
            const time = item.time || null;

            const timeData = time ? parseTimeRangeWithStart(time) : { start: 9 * 60, duration: 60 };
            const start = timeData.start;
            const duration = timeData.duration;

            const category = type;
            if (category && !newCategories[category]) {
              const color = themeColors[colorIndex % themeColors.length];
              newCategories[category] = color;
              colorIndex++;
            }

            let projectId: number | undefined;
            if (project && project.length > 0) {
              const projectName = Array.isArray(project) ? project[0] : project;

              let existingProject = newProjects.find(p => p.name === projectName);
              if (!existingProject) {
                existingProject = {
                  id: Date.now() + newProjects.length + index * 1000 + Math.random() * 100,
                  name: projectName,
                  time: '0h 0m',
                  percent: 0,
                  hexColor: category && newCategories[category] ? newCategories[category] : '#9CA3AF',
                  category: category,
                  x: 180 + (Math.random() - 0.5) * 100,
                  y: 250 + (Math.random() - 0.5) * 100,
                  vx: 0,
                  vy: 0,
                };
                newProjects.push(existingProject);
                totalProjectsCreated++;
              }
              projectId = existingProject.id;
            }

            const color = category && newCategories[category] ? newCategories[category] : '#9CA3AF';

            const event: EventItem = {
              id: Date.now() + totalImported * 100 + Math.random() * 50,
              title: projectId ? newProjects.find(p => p.id === projectId)?.name || 'Event' : 'Event',
              start,
              duration,
              hexColor: color,
              details: tag,
              category: category,
              date: date,
              projectId,
            };

            allNewEvents.push(event);
            totalImported++;
          });
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          Alert.alert(t('common.error'), t('projects.importProcessFailed', { file: file.name, error: String(fileError) }));
        }
      }

      if (allNewEvents.length > 0) {
        setEvents(prev => [...prev, ...allNewEvents]);
        setCategories(newCategories);
        setProjects(newProjects);
        setShowSettings(false);
        Alert.alert(t('common.confirm'), t('projects.importSuccess', { total: totalImported, files: files.length, projects: totalProjectsCreated }));
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert(t('common.error'), t('projects.importFailed', { error: String(error) }));
    }
  }, [categories, getCurrentThemeColors, projects, setCategories, setEvents, setProjects, setShowSettings, t]);

  const handleExportData = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert(t('projects.exportNotAvailable'));
        return;
      }

      const data = await loadAppData();
      if (!data) {
        Alert.alert(t('projects.noDataToExport'));
        return;
      }

      const jsonString = exportDataAsJSON(data);

      let legacy: any = null;
      try {
        // @ts-ignore
        legacy = await import('expo-file-system/legacy');
      } catch {
      }

      let dir = legacy ? (legacy.cacheDirectory || legacy.documentDirectory) : undefined;

      if (!dir) {
        try {
          const fsModule: any = await import('expo-file-system');
          dir = fsModule && (fsModule.cacheDirectory || fsModule.documentDirectory);
        } catch (errFs) {
          console.warn('[Export] modern FileSystem import failed', errFs);
        }
      }

      if (!dir) {
        Alert.alert(t('projects.exportNotAvailable'));
        return;
      }

      const now = new Date();
      const fileName = `action_export_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.json`;
      const fileUri = `${dir}${fileName}`;

      if (legacy && typeof legacy.writeAsStringAsync === 'function') {
        try {
          await legacy.writeAsStringAsync(fileUri, jsonString);
          const canShare = await Sharing.isAvailableAsync();
          if (!canShare) {
            Alert.alert(t('projects.exportNotAvailable'));
            return;
          }
          await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Export Data', UTI: 'public.json' });
          try {
            if (legacy.cacheDirectory && fileUri.startsWith(legacy.cacheDirectory)) {
              await legacy.deleteAsync(fileUri, { idempotent: true });
            }
          } catch {}
          return;
        } catch (legacyWriteErr) {
          console.warn('[Export] legacy write failed, will try modern FS as fallback', legacyWriteErr);
        }
      }

      try {
        const fsModule: any = await import('expo-file-system');
        await fsModule.writeAsStringAsync(fileUri, jsonString);
      } catch (err) {
        console.warn('[Export] modern write failed', err);
        try {
          // @ts-ignore
          const legacy2: any = await import('expo-file-system/legacy');
          const legacyDir2 = legacy2.documentDirectory || legacy2.cacheDirectory;
          if (!legacyDir2) throw new Error('No writable directory');
          const legacyUri2 = `${legacyDir2}${fileName}`;
          await legacy2.writeAsStringAsync(legacyUri2, jsonString);
          const canShare2 = await Sharing.isAvailableAsync();
          if (!canShare2) {
            Alert.alert(t('projects.exportNotAvailable'));
            return;
          }
          await Sharing.shareAsync(legacyUri2, { mimeType: 'application/json', dialogTitle: 'Export Data', UTI: 'public.json' });
          try {
            if (legacy2.cacheDirectory && legacyUri2.startsWith(legacy2.cacheDirectory)) {
              await legacy2.deleteAsync(legacyUri2, { idempotent: true });
            }
          } catch {}
          return;
        } catch (err2) {
          console.error('[Export] Write failed (legacy fallback)', err2);
          Alert.alert(t('projects.exportFailed'), String(err2));
          return;
        }
      }

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert(t('projects.exportNotAvailable'));
        return;
      }

      await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Export Data', UTI: 'public.json' });

      try {
        if (dir === (FileSystem as any).cacheDirectory) {
          await (FileSystem as any).deleteAsync(fileUri, { idempotent: true });
        }
      } catch {
      }
    } catch (error) {
      console.error('Export failed', error);
      Alert.alert(t('projects.exportFailed'), String(error));
    }
  }, [t]);

  return {
    handleImportData,
    handleExportData,
  };
};