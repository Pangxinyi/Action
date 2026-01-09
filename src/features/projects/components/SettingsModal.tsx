import type { Dispatch, SetStateAction } from 'react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '../../../components/BottomSheet';
import { KeyboardSafeScroll } from '../../../components/KeyboardSafeScroll';
import { ModalHeader } from '../../../components/ModalHeader';
import type { AppThemeColors } from '../../../hooks/useThemeColors';
import type { CategoryMap, EventItem, Project } from '../../../types';
import { useDataManagement } from '../hooks/useDataManagement';
import { ArchivedSection } from './settings/ArchivedSection';
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
  type SectionType = 'category' | 'project' | 'archived' | 'theme' | 'data' | null;
  const [activeSection, setActiveSection] = useState<SectionType>(null);

  const toggleSection = (section: SectionType) => {
    setActiveSection((prev) => (prev === section ? null : section));
  };

  const { handleImportData, handleExportData } = useDataManagement({
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
    <BottomSheet isOpen={visible} onClose={onClose} paddingTop={0}>
      <ModalHeader
        title={t('projects.settings')}
        onClose={onClose}
        colors={colors}
      />
      
      <KeyboardSafeScroll contentContainerStyle={{ padding: 24, gap: 20, paddingBottom: 64 }}>
        <CategorySection
          categories={categories}
          setCategories={setCategories}
          projects={projects}
          setProjects={setProjects}
          setEvents={setEvents}
          colors={colors}
          getCurrentThemeColors={getCurrentThemeColors}
          isOpen={activeSection === 'category'}
          onToggle={() => toggleSection('category')}
        />

        <ProjectSection
          projects={projects}
          categories={categories}
          setProjects={setProjects}
          onArchive={onArchiveProject}
          colors={colors}
          isOpen={activeSection === 'project'}
          onToggle={() => toggleSection('project')}
        />

        <ArchivedSection
          projects={projects}
          onUnarchive={onUnarchiveProject}
          onDelete={onDeleteProject}
          colors={colors}
          isOpen={activeSection === 'archived'}
          onToggle={() => toggleSection('archived')}
        />

        <ThemeSection
          selectedColorScheme={selectedColorScheme}
          onSelectScheme={onSelectColorScheme}
          colors={colors}
          isOpen={activeSection === 'theme'}
          onToggle={() => toggleSection('theme')}
        />
        <DataSection
          colors={colors}
          onImport={handleImportData}
          onExport={handleExportData}
          isOpen={activeSection === 'data'}
          onToggle={() => toggleSection('data')}
        />
      </KeyboardSafeScroll>
    </BottomSheet>
  );
};

export default SettingsModal;
