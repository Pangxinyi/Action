import { Plus } from 'lucide-react-native';
import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import CategorySelector from '../../../components/CategorySelector';
import { KeyboardSafeScroll } from '../../../components/KeyboardSafeScroll';
import { TIME_STEP_MIN } from '../../../constants/theme';
import type { CategoryMap, DraftEvent, Project } from '../../../types';
import { formatMinutes } from '../../../utils/date';

// Types
interface ThemeColors {
  surface: string;
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textQuaternary: string;
  primaryText: string;
  border: string;
  accent: string;
  accentLight: string;
  primary: string;
  [key: string]: string;
}

interface EventEditFormProps {
  draftEvent: DraftEvent;
  setDraftEvent: React.Dispatch<React.SetStateAction<DraftEvent | null>>;
  projects: Project[];
  categories: CategoryMap;
  themeColors: readonly string[];
  colors: ThemeColors;
  editingField: 'start' | 'end' | null;
  setEditingField: React.Dispatch<React.SetStateAction<'start' | 'end' | null>>;
  onSelectTime: (field: 'start' | 'end', minutes: number) => void;
}

export const EventEditForm: React.FC<EventEditFormProps> = ({
  draftEvent,
  setDraftEvent,
  projects,
  categories,
  themeColors,
  colors,
  editingField,
  setEditingField,
  onSelectTime,
}) => {
  const { t } = useTranslation();
  const timeScrollRef = useRef<ScrollView>(null);

  // Time options for picker (supports events spanning midnight)
  const timeOptions = useMemo(
    () =>
      Array.from(
        { length: (48 * 60) / TIME_STEP_MIN },
        (_, i) => i * TIME_STEP_MIN,
      ),
    [],
  );

  const openTimeEditor = (field: 'start' | 'end') => {
    setEditingField(field);
  };

  return (
    <KeyboardSafeScroll
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      nestedScrollEnabled={true}
    >
      {/* ---- 时间大卡片 ---- */}
      <View style={[styles.card, styles.timeCard, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.timeHeaderRow}>
          <Text style={[styles.timeHeaderLabel, { color: colors.textTertiary }]}>{t('calendar.start')}</Text>
          <Text style={[styles.timeHeaderLabel, { color: colors.textTertiary }]}>{t('calendar.end')}</Text>
        </View>

        <View style={styles.timeMainRow}>
          {/* START */}
          <Pressable
            style={styles.timeBlock}
            onPress={() => openTimeEditor('start')}
          >
            <Text style={[styles.timeBig, { color: colors.text }]}>
              {formatMinutes(draftEvent.start)}
            </Text>
          </Pressable>

          <Text style={[styles.timeArrow, { color: colors.textTertiary }]}>→</Text>

          {/* END */}
          <Pressable
            style={styles.timeBlock}
            onPress={() => openTimeEditor('end')}
          >
            <Text style={[styles.timeBig, { color: colors.text }]}>
              {formatMinutes(draftEvent.end)}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 👉 优化后的下拉时间选择器 */}
      {editingField && (
        <View style={[styles.timePickerContainer, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}>
          <Text style={[styles.timePickerTitle, { color: colors.textTertiary }]}>
            {editingField === 'start'
              ? t('calendar.startTime')
              : t('calendar.duration')}
          </Text>
          
          {/* 使用 ScrollView 替换 FlatList 以避免 VirtualizedList 嵌套警告 */}
          <ScrollView
            key={editingField}
            ref={timeScrollRef}
            style={{ maxHeight: 260 }}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 0 }}
            nestedScrollEnabled={true}
            onContentSizeChange={(width, height) => {
              if (height === 0) return;
              if (!editingField || !draftEvent) return;
              
              const current = editingField === 'start' ? draftEvent.start : draftEvent.end;
              const nearestIndex = Math.round(current / TIME_STEP_MIN);
              const totalItems = (48 * 60) / TIME_STEP_MIN;
              const actualRowHeight = height / totalItems;
              const scrollY = nearestIndex * actualRowHeight;

              timeScrollRef.current?.scrollTo({ y: scrollY, animated: false });
            }}
          >
            {timeOptions.map((m) => {
              const current = editingField === 'start' ? draftEvent.start : draftEvent.end;
              const nearest = Math.round(current / TIME_STEP_MIN) * TIME_STEP_MIN;
              const active = m === nearest;

              return (
                <Pressable
                  key={`${editingField}-${m}`}
                  style={[
                    styles.timeOptionRow,
                    { backgroundColor: colors.surface },
                    active && [styles.timeOptionRowActive, { backgroundColor: colors.backgroundTertiary }],
                  ]}
                  onPress={() => onSelectTime(editingField, m)}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      { color: colors.textTertiary },
                      active && [styles.timeOptionTextActive, { color: colors.text }],
                    ]}
                  >
                    {formatMinutes(m)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ---- Event Details / Tag ---- */}
      <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('calendar.details')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder={t('calendar.details')}
          placeholderTextColor={colors.textQuaternary}
          value={draftEvent.details || ''}
          onChangeText={(txt) =>
            setDraftEvent({ ...draftEvent, details: txt })
          }
          multiline
        />
      </View>

      {/* ---- Event Category (using CategorySelector) ---- */}
      <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
        <CategorySelector
          categories={categories}
          selectedCategory={draftEvent.category ?? null}
          onSelectCategory={(catName) =>
            setDraftEvent({ ...draftEvent, category: catName ?? undefined, isNewCategory: false, newCategoryName: '' })
          }
          onCreateCategory={() => setDraftEvent({ ...draftEvent, isNewCategory: true })}
          isNewCategory={draftEvent.isNewCategory}
          newCategoryName={draftEvent.newCategoryName || ''}
          setNewCategoryName={(name) => setDraftEvent({ ...draftEvent, newCategoryName: name })}
          newCategoryColor={draftEvent.newCategoryColor}
          setNewCategoryColor={(color) => setDraftEvent({ ...draftEvent, newCategoryColor: color })}
          themeColors={themeColors}
          colors={colors}
        />
      </View>

      {/* ---- Project 选择 ---- */}
      <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('calendar.project')}</Text>
        <Text style={{ fontSize: 12, color: colors.textQuaternary, marginBottom: 12, lineHeight: 16 }}>
          {t('calendar.projectHint')}
        </Text>
        <View style={styles.projectGrid}>
          {projects.filter(p => !p.archived).map((p) => {
            const active =
              !draftEvent.isNewProject &&
              draftEvent.selectedProjectId === p.id;
            return (
              <Pressable
                key={p.id}
                style={[
                  styles.projectChip,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  active && [styles.projectChipActive, { borderColor: colors.accent, backgroundColor: colors.accentLight }],
                ]}
                onPress={() =>
                  setDraftEvent({
                    ...draftEvent,
                    isNewProject: false,
                    selectedProjectId: p.id,
                  })
                }
              >
                <View
                  style={[
                    styles.projectDot,
                    { backgroundColor: p.hexColor },
                  ]}
                />
                <Text
                  numberOfLines={1}
                  style={[styles.projectChipText, { color: colors.text }]}
                >
                  {p.name}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            style={[
              styles.newProjectChip,
              { borderColor: colors.border, backgroundColor: colors.surface },
              draftEvent.isNewProject && [styles.newProjectChipActive, { borderColor: colors.accent, backgroundColor: colors.accentLight }],
            ]}
            onPress={() =>
              setDraftEvent({ ...draftEvent, isNewProject: true })
            }
          >
            <Plus
              size={14}
              color={
                draftEvent.isNewProject ? colors.accent : colors.textTertiary
              }
            />
            <Text
              style={[
                styles.newProjectText,
                { color: colors.textTertiary },
                draftEvent.isNewProject && { color: colors.accent },
              ]}
            >
              {t('projects.newProject')}
            </Text>
          </Pressable>
        </View>

        {draftEvent.isNewProject && (
          <>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder={t('projects.projectName')}
              placeholderTextColor={colors.textQuaternary}
              value={draftEvent.newProjectName}
              onChangeText={(txt) =>
                setDraftEvent({ ...draftEvent, newProjectName: txt })
              }
            />
            
            {/* Accumulation Slider */}
            <View style={{ marginTop: 16, paddingHorizontal: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {t('projects.accumulation')}
                </Text>
                <View style={{ 
                  paddingHorizontal: 10, 
                  paddingVertical: 3, 
                  borderRadius: 10, 
                  backgroundColor: colors.backgroundTertiary 
                }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                    {Math.round(draftEvent.newProjectPercent)}%
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 11, color: colors.textTertiary, lineHeight: 16, marginBottom: 12 }}>
                {t('projects.accumulationHint')}
              </Text>

              {/* Slider 容器优化: 增加 Capture 确保按下滑块时 ScrollView 绝对不会动 */}
              <View 
                style={{ height: 40, justifyContent: 'center', marginBottom: 6 }}
                onStartShouldSetResponderCapture={() => true}
                onMoveShouldSetResponderCapture={() => true}
                onResponderGrant={(e) => {
                  const locationX = e.nativeEvent.locationX;
                  const containerWidth = 327;
                  const newPercent = Math.max(0, Math.min(100, (locationX / containerWidth) * 100));
                  setDraftEvent({ ...draftEvent, newProjectPercent: Math.round(newPercent) });
                }}
                onResponderMove={(e) => {
                  const locationX = e.nativeEvent.locationX;
                  const containerWidth = 327;
                  const newPercent = Math.max(0, Math.min(100, (locationX / containerWidth) * 100));
                  setDraftEvent({ ...draftEvent, newProjectPercent: Math.round(newPercent) });
                }}
              >
                <View style={{ 
                  height: 6, 
                  backgroundColor: colors.border, 
                  borderRadius: 3,
                  overflow: 'hidden',
                }}>
                  <View style={{ 
                    height: '100%', 
                    width: `${draftEvent.newProjectPercent}%`, 
                    backgroundColor: colors.accent,
                    borderRadius: 3,
                  }} />
                </View>
                
                {/* Draggable Handle */}
                <View 
                  style={{ 
                    position: 'absolute',
                    left: `${draftEvent.newProjectPercent}%`,
                    transform: [{ translateX: -10 }],
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: colors.surface,
                    borderWidth: 2,
                    borderColor: colors.accent,
                    shadowColor: colors.text,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.15,
                    shadowRadius: 3,
                    elevation: 3,
                  }}
                />
              </View>

              {/* Scale Labels */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 1 }}>
                <Text style={{ fontSize: 9, color: colors.textQuaternary, fontWeight: '600' }}>{t('projects.accumulationLevel0')}</Text>
                <Text style={{ fontSize: 9, color: colors.textQuaternary, fontWeight: '600' }}>{t('projects.accumulationLevel30')}</Text>
                <Text style={{ fontSize: 9, color: colors.textQuaternary, fontWeight: '600' }}>{t('projects.accumulationLevel60')}</Text>
                <Text style={{ fontSize: 9, color: colors.textQuaternary, fontWeight: '600' }}>{t('projects.accumulationLevel85')}</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </KeyboardSafeScroll>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  timeCard: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
  },
  timePickerContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  timePickerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  timeOptionRow: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    marginBottom: 4,
  },
  timeOptionRowActive: {
    backgroundColor: '#111827',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#111827',
  },
  timeOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeHeaderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  timeMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeBlock: {
    flex: 1,
    alignItems: 'center',
  },
  timeBig: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  timeArrow: {
    fontSize: 18,
    color: '#9CA3AF',
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  projectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  projectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    maxWidth: '48%',
  },
  projectChipActive: {
    borderColor: '#111827',
    backgroundColor: '#E5E7EB',
  },
  projectChipText: {
    fontSize: 13,
    color: '#111827',
  },
  projectDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginRight: 6,
  },
  newProjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  newProjectChipActive: {
  },
  newProjectText: {
    fontSize: 13,
    color: '#6B7280',
  },
  input: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#111827',
  },
});

export default EventEditForm;
