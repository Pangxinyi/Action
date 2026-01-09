import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import type { AppThemeColors } from '../../../../hooks/useThemeColors';
import type { Project } from '../../../../types';
import { ArchivedProjectList } from './ArchivedProjectList';

type Props = {
  projects: Project[];
  onUnarchive: (projectId: number) => void;
  onDelete: (projectId: number) => void;
  colors: AppThemeColors;
  isOpen: boolean;
  onToggle: () => void;
};

export const ArchivedSection: React.FC<Props> = ({
  projects,
  onUnarchive,
  onDelete,
  colors,
  isOpen,
  onToggle,
}) => {
  const { t } = useTranslation();

  return (
    <View style={{ gap: 16 }}>
      <Pressable
        onPress={onToggle}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: isOpen ? 12 : 0 }}
      >
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {t('projects.archivedProjects')}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textTertiary }}>{isOpen ? '▼' : '▶'}</Text>
      </Pressable>

      {isOpen && (
        <ArchivedProjectList
          projects={projects}
          onUnarchive={onUnarchive}
          onDelete={onDelete}
          colors={colors}
        />
      )}
    </View>
  );
};

export default ArchivedSection;
