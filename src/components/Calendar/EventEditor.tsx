import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useData } from '../../context/DataContext';

type DraftEvent = any;

type Props = {
  initialDraft: DraftEvent;
  editingField: 'start' | 'end' | null;
  timeOptions: number[];
  timeListRef: any;
  onOpenTimeEditor: (f: 'start' | 'end') => void;
  themeColors: string[];
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
          <Text style={{ color: colors.textTertiary }}>{t('calendar.start')}</Text>
          <Pressable onPress={() => onOpenTimeEditor('start')}>
            <Text style={{ color: colors.text }}>{formatMinutes(draftEvent.start)}</Text>
          </Pressable>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.textTertiary }}>{t('calendar.end')}</Text>
          <Pressable onPress={() => onOpenTimeEditor('end')}>
            <Text style={{ color: colors.text }}>{formatMinutes(draftEvent.end)}</Text>
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
                const current = editingField === 'start' ? draftEvent.start : draftEvent.end;
                const nearest = Math.round(current / 1) * 1;
                const active = m === nearest;
                return (
                  <Pressable
                    key={`${editingField}-${m}`}
                    onPress={() => onSelectTime(editingField, m)}
                    style={{ padding: 8, backgroundColor: active ? colors.backgroundTertiary : colors.surface }}
                  >
                    <Text style={{ color: active ? colors.text : colors.textTertiary }}>{formatMinutes(m)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={{ marginTop: 12 }}>
          <Text style={{ color: colors.textTertiary }}>{t('calendar.details')}</Text>
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
          <Text style={{ color: colors.textTertiary }}>{t('calendar.category')}</Text>
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
                  <Text style={{ color: isSelected ? colors.primaryText : catColor }}>{catName}</Text>
                </Pressable>
              );
            })}

            <Pressable onPress={() => setLocal({ ...local, isNewCategory: true })} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.textTertiary }}>{t('projects.newCategory')}</Text>
            </Pressable>
          </View>

          {draftEvent.isNewCategory && (
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
          <Text style={{ color: colors.textTertiary }}>{t('calendar.project')}</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {projects.map((p) => (
              <Pressable key={p.id} onPress={() => setLocal({ ...local, isNewProject: false, selectedProjectId: p.id })} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.hexColor }} />
                  <Text style={{ color: colors.text }}>{p.name}</Text>
                </View>
              </Pressable>
            ))}

            <Pressable onPress={() => setDraftEvent({ ...draftEvent, isNewProject: true })} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.textTertiary }}>{t('projects.newProject')}</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ height: 36 }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
          <Pressable onPress={() => {
            if (local.id) deleteEvent(local.id);
            onClose();
          }} style={{ padding: 12 }}>
            <Text style={{ color: colors.error }}>{t('common.delete')}</Text>
          </Pressable>
          <Pressable onPress={onClose} style={{ padding: 12 }}>
            <Text style={{ color: colors.textTertiary }}>{t('common.cancel')}</Text>
          </Pressable>
          <Pressable onPress={() => {
            // handle new vs update
            if (local.id) {
              updateEvent(local.id, { ...local });
            } else {
              const { id, ...rest } = local;
              addEvent(rest as Omit<DraftEvent, 'id'>);
            }
            onClose();
          }} style={{ padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}>
            <Text style={{ color: colors.primaryText }}>{t('common.save')}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};

export default React.memo(EventEditor);
