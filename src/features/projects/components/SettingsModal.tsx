import type { Dispatch, SetStateAction } from 'react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { AppThemeColors } from '@hooks/useThemeColors';
import { ModalHeader } from '../../../components/ModalHeader';
import type { CategoryMap, EventItem, Project } from '../../../types';
import { useDataManagement } from '../hooks/useDataManagement';
import { CategorySection } from './settings/CategorySection';
import { DataSection } from './settings/DataSection';
import { ProjectSection } from './settings/ProjectSection';
import { ThemeSection } from './settings/ThemeSection';

type Props = {
  visible: boolean;
  onClose: () => void;
  setShowSettings: Dispatch<SetStateAction<boolean>>;
  projects: Project[];
  categories: CategoryMap;
  setProjects: Dispatch<SetStateAction<Project[]>>;
  setCategories: Dispatch<SetStateAction<CategoryMap>>;
  setEvents: Dispatch<SetStateAction<EventItem[]>>;
  selectedColorScheme: string;
  onSelectColorScheme: (scheme: string) => void;
  getCurrentThemeColors: () => readonly string[];
  onArchiveProject: (projectId: number) => void;
  onUnarchiveProject: (projectId: number) => void;
  onDeleteProject: (projectId: number) => void;
  colors: AppThemeColors;
};

export const SettingsModal: React.FC<Props> = ({
  visible,
  onClose,
  setShowSettings,
  projects,
  categories,
  setProjects,
  setCategories,
  setEvents,
  selectedColorScheme,
  onSelectColorScheme,
  getCurrentThemeColors,
  onArchiveProject,
  onUnarchiveProject,
  onDeleteProject,
  colors,
}) => {
  const { t } = useTranslation();
  const [showDataManagement, setShowDataManagement] = useState(false);

  const { handleImportData, handleExportData, handleClearData } = useDataManagement({
    projects,
    categories,
    setProjects,
    setCategories,
    setEvents,
    getCurrentThemeColors,
    setShowSettings,
  });

  if (!visible) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.modalBackdrop }}>
      <Pressable style={{ flex: 1 }} onPress={onClose} />
      <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 0, paddingBottom: 0, paddingHorizontal: 0, overflow: 'hidden', maxHeight: '80%' }}>
        <ModalHeader
          title={t('projects.settings')}
          onClose={onClose}
          colors={colors}
        />
        
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
          <CategorySection
            categories={categories}
            setCategories={setCategories}
            projects={projects}
            setProjects={setProjects}
            setEvents={setEvents}
            colors={colors}
            getCurrentThemeColors={getCurrentThemeColors}
          />

          <ProjectSection
            projects={projects}
            categories={categories}
            setProjects={setProjects}
            onArchive={onArchiveProject}
            onUnarchive={onUnarchiveProject}
            onDelete={onDeleteProject}
            colors={colors}
          />

          <ThemeSection
            selectedColorScheme={selectedColorScheme}
            onSelectScheme={onSelectColorScheme}
            colors={colors}
          />

          <View>
            <Pressable 
              onPress={() => setShowDataManagement(!showDataManagement)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: showDataManagement ? 12 : 0 }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('projects.dataManagement')}</Text>
              <Text style={{ fontSize: 12, color: colors.textTertiary }}>{showDataManagement ? '▼' : '▶'}</Text>
            </Pressable>
            {showDataManagement && (
              <DataSection
                colors={colors}
                onImport={handleImportData}
                onExport={handleExportData}
                onClear={handleClearData}
              />
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default SettingsModal;
