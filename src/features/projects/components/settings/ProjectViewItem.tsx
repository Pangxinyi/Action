import { Archive } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppThemeColors } from '../../../../hooks/useThemeColors';
import type { Project } from '../../../../types';

type Props = {
  project: Project;
  colors: AppThemeColors;
  onEdit: (project: Project) => void;
  onArchive: (projectId: number) => void;
};

export const ProjectViewItem: React.FC<Props> = ({ project, colors, onEdit, onArchive }) => {
  return (
    <View style={styles.row}> 
      <View style={[styles.projectRow, { backgroundColor: colors.backgroundSecondary }]}> 
        <View style={[styles.projectRowLeft]}> 
          <View style={[styles.projectDot, { backgroundColor: project.hexColor }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.projectRowName, { color: colors.text }]}>{project.name}</Text>
            {project.category && (
              <Text style={[styles.projectCategory, { color: colors.textTertiary }]}>{project.category}</Text>
            )}
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => onEdit(project)}
        style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.backgroundTertiary, opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textTertiary }}>✎</Text>
      </Pressable>
      <Pressable
        onPress={() => onArchive(project.id)}
        style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.warningLight, opacity: pressed ? 0.85 : 1 }]}
      >
        <Archive size={14} color={colors.warning} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  projectRow: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  projectRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 10,
  },
  projectDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  projectRowName: {
    fontSize: 14,
    fontWeight: '600',
  },
  projectCategory: {
    fontSize: 11,
    marginTop: 2,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
});

export default ProjectViewItem;
