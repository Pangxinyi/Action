import type { Dispatch, SetStateAction } from 'react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import AccumulationSlider from '../../../../components/AccumulationSlider';
import type { AppThemeColors } from '../../../../hooks/useThemeColors';
import type { CategoryMap, Project } from '../../../../types';

export type EditingProject = Pick<Project, 'id' | 'name' | 'category' | 'hexColor' | 'percent'>;

type Props = {
  editingProject: EditingProject;
  setEditingProject: Dispatch<SetStateAction<EditingProject | null>>;
  categories: CategoryMap;
  colors: AppThemeColors;
  onSave: (project: EditingProject) => void;
  onCancel: () => void;
};

export const ProjectEditItem: React.FC<Props> = ({
  editingProject,
  setEditingProject,
  categories,
  colors,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();

  const categoryEntries = useMemo(() => Object.entries(categories), [categories]);
  // Palette was removed: color is determined by selected category or defaults

  const handleSave = () => {
    const trimmed = editingProject.name.trim();
    if (!trimmed) return;
    onSave({ ...editingProject, name: trimmed });
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}> 
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
        ]}
        value={editingProject.name}
        onChangeText={(text) => setEditingProject((prev) => (prev ? { ...prev, name: text } : prev))}
        placeholder={t('projects.projectName')}
        placeholderTextColor={colors.textQuaternary}
      />

      <View style={styles.chipRow}>
        {categoryEntries.map(([catName, catColor]) => {
          const isSelected = editingProject.category === catName;
          return (
            <Pressable
              key={catName}
              onPress={() =>
                setEditingProject((prev) => (prev ? { ...prev, category: catName, hexColor: catColor } : prev))
              }
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: isSelected ? catColor : colors.surface,
                  borderColor: catColor,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: isSelected ? colors.accentText : catColor }}>
                {t(`categories.${catName.toLowerCase()}`, { defaultValue: catName })}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <AccumulationSlider
        percent={editingProject.percent}
        hexColor={editingProject.hexColor}
        onChangePercent={(newPercent) => 
          setEditingProject((prev) => (prev ? { ...prev, percent: newPercent } : prev))
        }
        colors={colors}
      />

      {/* color picker removed — color is determined by selected category or defaults */}

      <View style={styles.actionsRow}>
        <View style={styles.buttonFlex}>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor: colors.accent,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.accentText }}>{t('common.save')}</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [
            styles.cancelButton,
            {
              backgroundColor: colors.backgroundTertiary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textTertiary }}>{t('common.cancel')}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  sliderContainer: {
    height: 32,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    transform: [{ translateX: -8 }],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonFlex: {
    flex: 1,
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});

export default ProjectEditItem;
