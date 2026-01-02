import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type DistributionMode = 'project' | 'category';

export type ProjectWithTime = {
  id: number;
  name: string;
  hexColor: string;
  duration: number;
  timeShare: number;
};

export type CategoryWithTime = {
  name: string;
  color: string;
  duration: number;
  percent: number;
};

export type UnassignedProject = {
  id: number;
  name: string;
  hexColor: string;
  duration: number;
  timeShare: number;
};

export type ProjectListProps = {
  distributionMode: DistributionMode;
  projectsWithTime: ProjectWithTime[];
  categoriesWithTime: CategoryWithTime[];
  unassignedProject: UnassignedProject | null;
  colors: {
    surface: string;
    border: string;
    backgroundTertiary: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
  };
  t: (key: string) => string;
  onProjectPress: (project: ProjectWithTime) => void;
  onUnassignedPress: () => void;
  onCategoryPress: (categoryName: string) => void;
};

const ProjectList: React.FC<ProjectListProps> = ({
  distributionMode,
  projectsWithTime,
  categoriesWithTime,
  unassignedProject,
  colors,
  t,
  onProjectPress,
  onUnassignedPress,
  onCategoryPress,
}) => {
  if (distributionMode === 'project') {
    return (
      <>
        {projectsWithTime.map((p) => {
          const hours = Math.floor(p.duration / 60);
          const mins = p.duration % 60;
          return (
            <Pressable
              key={p.id}
              style={[styles.projectRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => onProjectPress(p)}
            >
              <View style={styles.projectRowHeader}>
                <View style={styles.projectRowLeft}>
                  <View style={[styles.projectDot, { backgroundColor: p.hexColor }]} />
                  <Text style={[styles.projectRowName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                    {p.name}
                  </Text>
                </View>
                <Text style={[styles.projectRowTime, { color: colors.textSecondary }]}>
                  {hours}{t('common.hours')} {mins}{t('common.minutes')}
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.backgroundTertiary }]}>
                <View style={[styles.progressFill, { width: `${p.timeShare}%`, backgroundColor: p.hexColor }]} />
              </View>
            </Pressable>
          );
        })}

        {unassignedProject && (() => {
          const hours = Math.floor(unassignedProject.duration / 60);
          const mins = unassignedProject.duration % 60;
          return (
            <Pressable
              key="unassigned"
              style={[styles.projectRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={onUnassignedPress}
            >
              <View style={styles.projectRowHeader}>
                <View style={styles.projectRowLeft}>
                  <View style={[styles.projectDot, { backgroundColor: unassignedProject.hexColor }]} />
                  <Text style={[styles.projectRowName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                    {unassignedProject.name}
                  </Text>
                </View>
                <Text style={[styles.projectRowTime, { color: colors.textSecondary }]}>
                  {hours}{t('common.hours')} {mins}{t('common.minutes')}
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.backgroundTertiary }]}>
                <View style={[styles.progressFill, { width: `${unassignedProject.timeShare}%`, backgroundColor: unassignedProject.hexColor }]} />
              </View>
            </Pressable>
          );
        })()}
      </>
    );
  }

  return (
    <>
      {categoriesWithTime.map((c) => {
        const hours = Math.floor(c.duration / 60);
        const mins = c.duration % 60;
        return (
          <Pressable
            key={c.name}
            style={[styles.projectRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => onCategoryPress(c.name)}
          >
            <View style={styles.projectRowHeader}>
              <View style={styles.projectRowLeft}>
                <View style={[styles.projectDot, { backgroundColor: c.color }]} />
                <Text style={[styles.projectRowName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                  {c.name === 'uncategorized' ? t('calendar.uncategorized') : c.name}
                </Text>
              </View>
              <Text style={[styles.projectRowTime, { color: colors.textSecondary }]}>
                {hours}{t('common.hours')} {mins}{t('common.minutes')}
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.backgroundTertiary }]}>
              <View style={[styles.progressFill, { width: `${c.percent}%`, backgroundColor: c.color }]} />
            </View>
          </Pressable>
        );
      })}
    </>
  );
};

export default ProjectList;

const styles = StyleSheet.create({
  projectRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  projectRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  projectRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  projectDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginRight: 6,
  },
  projectRowName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  projectRowTime: {
    fontSize: 12,
    color: '#4B5563',
    flexShrink: 0,
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  progressFill: {
    height: 4,
    borderRadius: 999,
  },
});
