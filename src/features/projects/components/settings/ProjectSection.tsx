import type { Dispatch, SetStateAction } from 'react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import type { AppThemeColors } from '../../../../hooks/useThemeColors';
import type { CategoryMap, Project } from '../../../../types';
import { ActiveProjectList } from './ActiveProjectList';
import { ArchivedProjectList } from './ArchivedProjectList';

type Props = {
  projects: Project[];
  categories: CategoryMap;
  setProjects: Dispatch<SetStateAction<Project[]>>;
  onArchive: (projectId: number) => void;
  onUnarchive: (projectId: number) => void;
  onDelete: (projectId: number) => void;
  colors: AppThemeColors;
};

export const ProjectSection: React.FC<Props> = ({
  projects,
  categories,
  setProjects,
  onArchive,
  onUnarchive,
  onDelete,
  colors,
}) => {
  const { t } = useTranslation();
  const [showProjectManagement, setShowProjectManagement] = useState(false);
  const [showArchivedProjects, setShowArchivedProjects] = useState(false);

  return (
    <View style={{ gap: 16 }}>
      <View>
        <Pressable
          onPress={() => setShowProjectManagement((prev) => !prev)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: showProjectManagement ? 12 : 0 }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('projects.projectManagement')}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textTertiary }}>{showProjectManagement ? '▼' : '▶'}</Text>
        </Pressable>
        {showProjectManagement && (
          <ActiveProjectList
            projects={projects}
            categories={categories}
            setProjects={setProjects}
            onArchive={onArchive}
            colors={colors}
          />
        )}
      </View>

      <View>
        <Pressable
          onPress={() => setShowArchivedProjects((prev) => !prev)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: showArchivedProjects ? 12 : 0 }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('projects.archivedProjects')}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textTertiary }}>{showArchivedProjects ? '▼' : '▶'}</Text>
        </Pressable>
        {showArchivedProjects && (
          <ArchivedProjectList
            projects={projects}
            onUnarchive={onUnarchive}
            onDelete={onDelete}
            colors={colors}
          />
        )}
      </View>
    </View>
  );
};

export default ProjectSection;
