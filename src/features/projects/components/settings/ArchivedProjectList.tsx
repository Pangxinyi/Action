import { Archive, Trash2 } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import type { AppThemeColors } from '@hooks/useThemeColors';
import { EmptyState } from '../../../../components/EmptyState';
import type { Project } from '../../../../types';

type Props = {
  projects: Project[];
  onUnarchive: (projectId: number) => void;
  onDelete: (projectId: number) => void;
  colors: AppThemeColors;
};

export const ArchivedProjectList: React.FC<Props> = ({ projects, onUnarchive, onDelete, colors }) => {
  const { t } = useTranslation();

  const archivedProjects = projects.filter((p) => p.archived);

  return (
    <View style={{ gap: 8 }}>
      {archivedProjects.length === 0 ? (
        <EmptyState
          message={t('projects.noArchivedProjects')}
          icon={<Archive size={20} color={colors.textTertiary} />}
          fullScreen={false}
          style={{ paddingVertical: 16 }}
          colors={colors}
        />
      ) : (
        archivedProjects.map((project) => (
          <View key={project.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.backgroundSecondary, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: project.hexColor }} />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.text }}>{project.name}</Text>
            </View>
            <Pressable
              onPress={() => onUnarchive(project.id)}
              style={{ padding: 8, backgroundColor: colors.accentLight, borderRadius: 8 }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.accent }}>↻</Text>
            </Pressable>
            <Pressable
              onPress={() => onDelete(project.id)}
              style={{ padding: 8, backgroundColor: colors.errorLight, borderRadius: 8 }}
            >
              <Trash2 size={14} color={colors.error} />
            </Pressable>
          </View>
        ))
      )}
    </View>
  );
};

export default ArchivedProjectList;
