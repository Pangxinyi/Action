import { PackageOpen, Trash2 } from 'lucide-react-native';
import type { Dispatch, SetStateAction } from 'react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';

import { ColorPicker } from '../../../../components/ColorPicker';
import { EmptyState } from '../../../../components/EmptyState';
import type { AppThemeColors } from '../../../../hooks/useThemeColors';
import type { CategoryMap, EventItem, Project } from '../../../../types';

export type CategorySectionProps = {
  categories: CategoryMap;
  setCategories: Dispatch<SetStateAction<CategoryMap>>;
  projects: Project[];
  setProjects: Dispatch<SetStateAction<Project[]>>;
  setEvents: Dispatch<SetStateAction<EventItem[]>>;
  colors: AppThemeColors;
  getCurrentThemeColors: () => readonly string[];
  isOpen: boolean;
  onToggle: () => void;
};

export const CategorySection: React.FC<CategorySectionProps> = ({
  categories,
  setCategories,
  projects,
  setProjects,
  setEvents,
  colors,
  getCurrentThemeColors,
  isOpen,
  onToggle,
}) => {
  const { t } = useTranslation();
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string; color: string } | null>(null);

  const sortedCategories = useMemo(() => Object.entries(categories), [categories]);

  const handleDeleteCategory = (categoryName: string) => {
    Alert.alert(
      t('common.confirm'),
      `${t('common.delete')} "${categoryName}"?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            const newCategories = { ...categories };
            delete newCategories[categoryName];
            setCategories(newCategories);

            setProjects((prev) =>
              prev.map((p) => (p.category === categoryName ? { ...p, category: null, hexColor: '#9CA3AF' } : p)),
            );

            // 删除类别时，同时更新 events 的 hexColor 为灰色
            setEvents((prev) => prev.map((e) => (e.category === categoryName ? { ...e, category: undefined, hexColor: '#9CA3AF' } : e)));
          },
        },
      ],
    );
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !editingCategory.newName.trim()) return;

    const { oldName, newName, color } = editingCategory;
    const trimmedNewName = newName.trim();

    if (trimmedNewName !== oldName && categories[trimmedNewName]) {
      Alert.alert(t('common.error'), 'Category name already exists');
      return;
    }

    const newCategories = { ...categories };
    delete newCategories[oldName];
    newCategories[trimmedNewName] = color;
    setCategories(newCategories);

    setProjects((prev) => prev.map((p) => (p.category === oldName ? { ...p, category: trimmedNewName, hexColor: color } : p)));

    setEvents((prev) => prev.map((e) => (e.category === oldName ? { ...e, category: trimmedNewName } : e)));

    setEditingCategory(null);
  };

  return (
    <View>
      <Pressable
        onPress={onToggle}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: isOpen ? 12 : 0 }}
      >
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {t('projects.categoryManagement')}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textTertiary }}>{isOpen ? '▼' : '▶'}</Text>
      </Pressable>

      {isOpen && (
        <View style={{ gap: 8 }}>
          {sortedCategories.length === 0 && !editingCategory ? (
            <EmptyState
              message={t('projects.noCategories', { defaultValue: 'No categories yet' })}
              icon={<PackageOpen size={28} color={colors.textTertiary} />}
              fullScreen={false}
              actionButton={(
                <Pressable
                  onPress={() => setEditingCategory({ oldName: '', newName: '', color: getCurrentThemeColors()[0] })}
                  style={{ backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 }}
                >
                  <Text style={{ color: colors.accentText, fontWeight: '700' }}>{t('projects.addCategory', { defaultValue: 'Add Category' })}</Text>
                </Pressable>
              )}
              colors={colors}
            />
          ) : (
            <>
              {sortedCategories.map(([catName, catColor]) => (
                <View key={catName} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {editingCategory?.oldName === catName ? (
                    <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary, padding: 12, borderRadius: 12, gap: 8 }}>
                      <TextInput
                        style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: colors.text }}
                        value={editingCategory.newName}
                        onChangeText={(text) => setEditingCategory({ ...editingCategory, newName: text })}
                        placeholder={t('projects.categoryName')}
                        placeholderTextColor={colors.textQuaternary}
                      />
                      <ColorPicker
                        colors={getCurrentThemeColors()}
                        selectedColor={editingCategory.color}
                        onSelect={(c) => setEditingCategory({ ...editingCategory, color: c })}
                        size={32}
                      />
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Pressable
                          onPress={handleUpdateCategory}
                          style={{ flex: 1, backgroundColor: colors.accent, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.accentText }}>{t('common.save')}</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setEditingCategory(null)}
                          style={{ flex: 1, backgroundColor: colors.backgroundTertiary, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textTertiary }}>{t('common.cancel')}</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.backgroundSecondary, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12 }}>
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: catColor }} />
                        <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.text }}>{catName}</Text>
                      </View>
                      <Pressable
                        onPress={() => setEditingCategory({ oldName: catName, newName: catName, color: catColor })}
                        style={{ padding: 8, backgroundColor: colors.backgroundTertiary, borderRadius: 8 }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textTertiary }}>✎</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteCategory(catName)}
                        style={{ padding: 8, backgroundColor: colors.errorLight, borderRadius: 8 }}
                      >
                        <Trash2 size={14} color={colors.error} />
                      </Pressable>
                    </>
                  )}
                </View>
              ))}

              {editingCategory?.oldName === '' && (
                <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary, padding: 12, borderRadius: 12, gap: 8 }}>
                  <TextInput
                    style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: colors.text }}
                    value={editingCategory.newName}
                    onChangeText={(text) => setEditingCategory({ ...editingCategory, newName: text })}
                    placeholder={t('projects.categoryName')}
                    placeholderTextColor={colors.textQuaternary}
                  />
                  <ColorPicker
                    colors={getCurrentThemeColors()}
                    selectedColor={editingCategory.color}
                    onSelect={(c) => setEditingCategory({ ...editingCategory, color: c })}
                    size={32}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      onPress={handleUpdateCategory}
                      style={{ flex: 1, backgroundColor: colors.accent, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.accentText }}>{t('common.save')}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setEditingCategory(null)}
                      style={{ flex: 1, backgroundColor: colors.backgroundTertiary, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textTertiary }}>{t('common.cancel')}</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {!editingCategory && (
                <Pressable
                  onPress={() => setEditingCategory({ oldName: '', newName: '', color: getCurrentThemeColors()[0] })}
                  style={{ backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
                >
                  <Text style={{ color: colors.accentText, fontWeight: '700' }}>{t('projects.addCategory', { defaultValue: 'Add Category' })}</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
};

export default CategorySection;
