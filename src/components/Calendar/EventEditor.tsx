import { default as React, default as React } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

type DraftEvent = any;

type Props = {
  draftEvent: DraftEvent;
  setDraftEvent: (d: DraftEvent | null) => void;
  editingField: 'start' | 'end' | null;
  timeOptions: number[];
  timeListRef: any;
  onSelectTime: (field: 'start' | 'end', minutes: number) => void;
  onOpenTimeEditor: (f: 'start' | 'end') => void;
  projects: any[];
  categories: { [k: string]: string };
  setCategories: (c: { [k: string]: string }) => void;
  themeColors: string[];
  colors: any;
  onSave: () => void;
  onDelete: () => void;
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
  draftEvent,
  setDraftEvent,
  editingField,
  timeOptions,
  timeListRef,
  onSelectTime,
  onOpenTimeEditor,
  projects,
  categories,
  setCategories,
  themeColors,
  colors,
  onSave,
  onDelete,
  onClose,
  t,
}) => {
  if (!draftEvent) return null;

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
            value={draftEvent.details || ''}
            onChangeText={(txt) => setDraftEvent({ ...draftEvent, details: txt })}
            multiline
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={{ color: colors.textTertiary }}>{t('calendar.category')}</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {Object.keys(categories).map((catName) => {
              const catColor = categories[catName];
              const isSelected = draftEvent.category === catName;
              return (
                <Pressable
                  key={catName}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: `${catColor}20`, borderColor: catColor, borderWidth: 2 }}
                  onPress={() => setDraftEvent({ ...draftEvent, category: catName, isNewCategory: false, newCategoryName: '' })}
                >
                  <Text style={{ color: isSelected ? colors.primaryText : catColor }}>{catName}</Text>
                </Pressable>
              );
            })}

            <Pressable onPress={() => setDraftEvent({ ...draftEvent, isNewCategory: true })} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.textTertiary }}>{t('projects.newCategory')}</Text>
            </Pressable>
          </View>

          {draftEvent.isNewCategory && (
            <View style={{ marginTop: 8 }}>
              <TextInput
                value={draftEvent.newCategoryName || ''}
                onChangeText={(txt) => setDraftEvent({ ...draftEvent, newCategoryName: txt })}
                placeholder={t('projects.categoryName')}
                placeholderTextColor={colors.textQuaternary}
                style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, padding: 8 }}
              />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                {themeColors.map((c) => (
                  <Pressable key={c} onPress={() => setDraftEvent({ ...draftEvent, newCategoryColor: c })} style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: c, borderWidth: draftEvent.newCategoryColor === c ? 3 : 0, borderColor: colors.primary }} />
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={{ color: colors.textTertiary }}>{t('calendar.project')}</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {projects.map((p) => (
              <Pressable key={p.id} onPress={() => setDraftEvent({ ...draftEvent, isNewProject: false, selectedProjectId: p.id })} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
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
          <Pressable onPress={onDelete} style={{ padding: 12 }}>
            <Text style={{ color: colors.error }}>{t('common.delete')}</Text>
          </Pressable>
          <Pressable onPress={onClose} style={{ padding: 12 }}>
            <Text style={{ color: colors.textTertiary }}>{t('common.cancel')}</Text>
          </Pressable>
          <Pressable onPress={onSave} style={{ padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}>
            <Text style={{ color: colors.primaryText }}>{t('common.save')}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};

export default React.memo(EventEditor);

const EventEditor: React.FC = () => {
  return (
    <View>
      <Text>Event editor placeholder</Text>
    </View>
  );
};

export default EventEditor;
