import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useData } from '../../context/DataContext';
import Button from '../Common/Button';
import ThemedText from '../Common/ThemedText';

type DraftEvent = any;

type Props = {
  initialDraft: DraftEvent;
  editingField: 'start' | 'end' | null;
  timeOptions: number[];
  timeListRef: any;
  onOpenTimeEditor: (f: 'start' | 'end') => void;
  themeColors: readonly string[];
  colors: any;
  onClose: () => void;
  t: (k: string) => string;
};

const formatMinutes = (total: number) => {
  const m = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

const EventEditor: React.FC<Props> = ({
  initialDraft,
  editingField,
  timeOptions,
  timeListRef,
  onOpenTimeEditor,
  themeColors,
  colors,
  onClose,
  t,
}) => {
  const { projects, categories, addEvent, updateEvent, deleteEvent } = useData();
  const [local, setLocal] = useState<DraftEvent | null>(null);

  useEffect(() => {
    if (initialDraft) {
      setLocal({ ...initialDraft });
    } else {
      setLocal(null);
    }
  }, [initialDraft]);

  if (!local) return null;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={{ padding: 12 }}>
        <View style={{ marginBottom: 12 }}>
          <ThemedText variant="label" style={{ color: colors.textTertiary }}>{t('calendar.start')}</ThemedText>
          <Pressable onPress={() => onOpenTimeEditor('start')}>
            <ThemedText style={{ color: colors.text }}>{formatMinutes(local.start)}</ThemedText>
          </Pressable>
        </View>

        <View style={{ marginBottom: 12 }}>
          <ThemedText variant="label" style={{ color: colors.textTertiary }}>{t('calendar.end')}</ThemedText>
          <Pressable onPress={() => onOpenTimeEditor('end')}>
            <ThemedText style={{ color: colors.text }}>{formatMinutes(local.end)}</ThemedText>
          </Pressable>
        </View>

        {editingField && (
          <View style={{ maxHeight: 260 }}>
            <ScrollView
              key={editingField}
              ref={timeListRef}
              style={{ maxHeight: 260 }}
              showsVerticalScrollIndicator={false}
            >
              {timeOptions.map((m) => {
                const current = editingField === 'start' ? local.start : local.end;
                const nearest = Math.round(current / 1) * 1;
                const active = m === nearest;
                return (
                  <Pressable
                    key={`${editingField}-${m}`}
                    onPress={() => {
                      if (editingField === 'start') setLocal({ ...local, start: m });
                      else setLocal({ ...local, end: m });
                    }}
                    style={{ padding: 8, backgroundColor: active ? colors.backgroundTertiary : colors.surface }}
                  >
                    <ThemedText style={{ color: active ? colors.text : colors.textTertiary }}>{formatMinutes(m)}</ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={{ marginTop: 12 }}>
              <ThemedText variant="label" style={{ color: colors.textTertiary }}>{t('calendar.details')}</ThemedText>
                <TextInput
            style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, padding: 8, marginTop: 8 }}
            placeholder={t('calendar.details')}
            placeholderTextColor={colors.textQuaternary}
            value={local.details || ''}
            onChangeText={(txt) => setLocal({ ...local, details: txt })}
            multiline
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <ThemedText variant="label" style={{ color: colors.textTertiary }}>{t('calendar.category')}</ThemedText>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {Object.keys(categories).map((catName) => {
              const catColor = categories[catName];
              const isSelected = local.category === catName;
              return (
                <Pressable
                  key={catName}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: `${catColor}20`, borderColor: catColor, borderWidth: 2 }}
                  onPress={() => setLocal({ ...local, category: catName, isNewCategory: false, newCategoryName: '' })}
                >
                  <ThemedText style={{ color: isSelected ? colors.primaryText : catColor }}>{catName}</ThemedText>
                </Pressable>
              );
            })}

            <Pressable onPress={() => setLocal({ ...local, isNewCategory: true })} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
              <ThemedText variant="label" style={{ color: colors.textTertiary }}>{t('projects.newCategory')}</ThemedText>
            </Pressable>
          </View>

          {local.isNewCategory && (
            <View style={{ marginTop: 8 }}>
              <TextInput
                value={local.newCategoryName || ''}
                onChangeText={(txt) => setLocal({ ...local, newCategoryName: txt })}
                placeholder={t('projects.categoryName')}
                placeholderTextColor={colors.textQuaternary}
                style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, padding: 8 }}
              />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                {themeColors.map((c) => (
                  <Pressable key={c} onPress={() => setLocal({ ...local, newCategoryColor: c })} style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: c, borderWidth: local.newCategoryColor === c ? 3 : 0, borderColor: colors.primary }} />
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={{ marginTop: 12 }}>
          <ThemedText variant="label" style={{ color: colors.textTertiary }}>{t('calendar.project')}</ThemedText>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {projects.map((p) => (
              <Pressable key={p.id} onPress={() => setLocal({ ...local, isNewProject: false, selectedProjectId: p.id })} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.hexColor }} />
                  <ThemedText style={{ color: colors.text }}>{p.name}</ThemedText>
                </View>
              </Pressable>
            ))}

            <Pressable onPress={() => setLocal({ ...local, isNewProject: true })} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
              <ThemedText variant="label" style={{ color: colors.textTertiary }}>{t('projects.newProject')}</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={{ height: 36 }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
          <Pressable onPress={() => {
            if (local.id) deleteEvent(local.id);
            onClose();
          }} style={{ padding: 12 }}>
            <ThemedText style={{ color: colors.error }}>{t('common.delete')}</ThemedText>
          </Pressable>
          <Pressable onPress={onClose} style={{ padding: 12 }}>
            <ThemedText style={{ color: colors.textTertiary }}>{t('common.cancel')}</ThemedText>
          </Pressable>
          <Button title={t('common.save')} onPress={() => {
            if (local.id) {
              updateEvent(local.id, { ...local });
            } else {
              const { id, ...rest } = local;
              addEvent(rest as Omit<DraftEvent, 'id'>);
            }
            onClose();
          }} style={{ padding: 12, borderRadius: 8 }} />
        </View>
      </View>
    </ScrollView>
  );
};

export default React.memo(EventEditor);
