import i18n from 'i18next';
import { Plus, Trash2 } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { ModalHeader } from '../../components/ModalHeader';
import PrimaryButton from '../../components/PrimaryButton';
import { COLOR_THEMES, TIME_STEP_MIN } from '../../constants/theme';
import type { CalendarViewProps, DraftEvent, EventItem, Project } from '../../types';
import CalendarDropdown from './components/CalendarDropdown';
import DailyTimeline from './components/DailyTimeline';
import { EventEditForm } from './components/EventEditForm';

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  setEvents,
  projects,
  setProjects,
  categories,
  setCategories,
  selectedColorScheme,
  colors,
}) => {
  const { t } = useTranslation();
  const [editingField, setEditingField] = useState<'start' | 'end' | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftEvent, setDraftEvent] = useState<DraftEvent | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const themeColors = COLOR_THEMES[selectedColorScheme as keyof typeof COLOR_THEMES] || COLOR_THEMES.default;

  const formatMonthYear = (date: Date): string => {
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                        'july', 'august', 'september', 'october', 'november', 'december'];
    const month = t(`months.${monthNames[date.getMonth()]}`);
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  const formatWeekday = (date: Date, short: boolean = false): string => {
    const weekdays = short 
      ? ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
      : ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return t(`calendar.${weekdays[date.getDay()]}`);
  };

  const handlePrevDay = useCallback(() => {
    setSelectedDate((d) => {
      const prev = new Date(d);
      prev.setDate(prev.getDate() - 1);
      return prev;
    });
  }, []);

  const handleNextDay = useCallback(() => {
    setSelectedDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      return next;
    });
  }, []);

  const handleTodayClick = () => {
    setSelectedDate(new Date());
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,

        // Core interception logic
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          // If modal is open, return false (release interception) and let touch events pass through to Modal
          if (isModalOpen) return false;

          // Otherwise, check if it's a horizontal swipe
          return Math.abs(gestureState.dx) > 10;
        },

        onPanResponderRelease: (evt, gestureState) => {
          const minDistance = 50;
          if (gestureState.dx > minDistance) {
            handlePrevDay();
          } else if (gestureState.dx < -minDistance) {
            handleNextDay();
          }
        },
      }),
    // Dependencies: recreate PanResponder when these states change
    [isModalOpen, handlePrevDay, handleNextDay],
  );

  const openNewEventAt = (totalMinutes: number) => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    setEditingField(null);
    setDraftEvent({
      id: null,
      start: totalMinutes,
      end: totalMinutes + 60,
      selectedProjectId: null,
      isNewProject: false,
      newProjectName: '',
      newProjectPercent: 60,
      details: '',
      category: '',
      title: '',
      date: dateStr,
      isNewCategory: false,
      newCategoryName: '',
      newCategoryColor: themeColors[0],
    });
    setIsModalOpen(true);
  };

  const handleSlotPress = (hour: number, minute: number) => {
    openNewEventAt(hour * 60 + minute);
  };

  const handleAddNow = () => {
    const now = new Date();
    const total = now.getHours() * 60 + now.getMinutes();
    const rounded = Math.ceil(total / TIME_STEP_MIN) * TIME_STEP_MIN;
    openNewEventAt(rounded);
  };

  const handleEventPress = (evt: EventItem) => {
    const matchingProject = projects.find((p) => p.name === evt.title);
    setEditingField(null);
    setDraftEvent({
      id: evt.id,
      start: evt.start,
      end: evt.start + evt.duration,
      selectedProjectId: matchingProject ? matchingProject.id : null,
      isNewProject: false,
      newProjectName: '',
      newProjectPercent: 60,
      details: evt.details || '',
      category: evt.category || '',
      title: evt.title,
      date: evt.date,
      isNewCategory: false,
      newCategoryName: '',
      newCategoryColor: themeColors[0],
    });
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (!draftEvent?.id) return;
    setEvents((prev) => prev.filter((e) => e.id !== draftEvent.id));
    setIsModalOpen(false);
    setDraftEvent(null);
    setEditingField(null);
  };

  const handleSave = () => {
    if (!draftEvent) return;
    setIsModalOpen(false);
    setDraftEvent(null);
    setEditingField(null);
    let title = draftEvent.title || 'New Event';
    let color = '#9CA3AF';
    let selectedCategory = draftEvent.category;
    let newCategoryColor: string | undefined = undefined;

    if (draftEvent.isNewCategory && draftEvent.newCategoryName?.trim()) {
      const catName = draftEvent.newCategoryName.trim();
      const catColor = draftEvent.newCategoryColor || themeColors[0];
      setCategories((prev) => ({ ...prev, [catName]: catColor }));
      selectedCategory = catName;
      newCategoryColor = catColor;
    }

    if (draftEvent.isNewProject && draftEvent.newProjectName.trim()) {
      const projectCategory = selectedCategory || null;
      const categoryColor = newCategoryColor || (projectCategory ? (categories[projectCategory] || '#9CA3AF') : '#9CA3AF');
      const newProject: Project = {
        id: Date.now(),
        name: draftEvent.newProjectName,
        time: '0h 0m',
        percent: draftEvent.newProjectPercent || 60,
        hexColor: categoryColor,
        category: projectCategory,
        x: 150,
        y: 150,
      };
      setProjects((prev) => [...prev, newProject]);
      title = newProject.name;
      draftEvent.selectedProjectId = newProject.id;
    } else if (draftEvent.selectedProjectId) {
      const proj = projects.find((p) => p.id === draftEvent.selectedProjectId);
      if (proj) {
        title = proj.name;
      }
    }

    if (newCategoryColor) {
      color = newCategoryColor;
    } else if (selectedCategory && categories[selectedCategory]) {
      color = categories[selectedCategory];
    }

    const rawDuration = draftEvent.end - draftEvent.start;
    const duration = Math.max(1, rawDuration);

    const payload: Omit<EventItem, 'id'> = {
      title,
      start: draftEvent.start,
      duration,
      hexColor: color,
      details: draftEvent.details || undefined,
      category: selectedCategory || undefined,
      date: draftEvent.date,
      projectId: draftEvent.selectedProjectId || undefined,
    };

    setEvents((prev) => {
      if (draftEvent.id) {
        return prev.map((e) => (e.id === draftEvent.id ? { ...e, ...payload } : e));
      }
      return [...prev, { id: Date.now(), ...payload }];
    });

    setIsModalOpen(false);
    setDraftEvent(null);
  };

  const handleSelectTime = (field: 'start' | 'end', minutes: number) => {
    if (!draftEvent) return;

    if (field === 'start') {
      setDraftEvent({ ...draftEvent, start: minutes });
    } else {
      setDraftEvent({ ...draftEvent, end: minutes });
    }
    setEditingField(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} {...panResponder.panHandlers}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable 
          style={styles.headerLeft} 
          onPress={() => setIsCalendarOpen(!isCalendarOpen)}
        >
          <View>
            <Text style={[styles.headerTitle, { fontWeight: 'bold', color: colors.text }]}>
              {formatMonthYear(selectedDate).split(' ')[0]}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
              {i18n.language === 'zh' 
                ? `${selectedDate.getDate()}日 ${formatWeekday(selectedDate, false)}`
                : `${String(selectedDate.getDate()).padStart(2, '0')} ${formatWeekday(selectedDate, false)}`
              }
            </Text>
          </View>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Pressable style={[styles.todayButton, { backgroundColor: colors.backgroundTertiary }]} onPress={handleTodayClick}>
            <Text style={[styles.todayButtonText, { color: colors.text }]}>{t('calendar.today')}</Text>
          </Pressable>
          <Pressable style={[styles.fabSmall, { backgroundColor: colors.primary }]} onPress={handleAddNow}>
            <Plus size={18} color={colors.primaryText} />
          </Pressable>
        </View>
      </View>

      <CalendarDropdown
        isOpen={isCalendarOpen}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        onClose={() => setIsCalendarOpen(false)}
        formatMonthYear={formatMonthYear}
        formatWeekday={formatWeekday}
        t={t}
        colors={colors}
        events={events}
        categories={categories}
      />

      <DailyTimeline
        events={events}
        selectedDate={selectedDate}
        projects={projects}
        colors={colors}
        onSlotPress={handleSlotPress}
        onEventPress={handleEventPress}
        isScrollEnabled={!isModalOpen}
      />

      <Modal visible={isModalOpen && !!draftEvent} transparent animationType="slide">
        <Pressable 
          style={[styles.modalOverlay, { backgroundColor: colors.modalBackdrop }]}
          onPress={() => {
            setIsModalOpen(false);
            setDraftEvent(null);
            setEditingField(null);
          }}
        >
          <View 
            style={[styles.bottomSheetLarge, { backgroundColor: colors.surface }]}
            onStartShouldSetResponder={() => true}
            onResponderRelease={() => {}}
          >
            <ModalHeader
              title={draftEvent?.id ? t('calendar.editEvent') : t('calendar.addEvent')}
              onClose={() => {
                setIsModalOpen(false);
                setDraftEvent(null);
                setEditingField(null);
              }}
              colors={colors}
              rightElement={
                draftEvent?.id && (
                  <Pressable style={styles.iconDanger} onPress={handleDelete}>
                    <Trash2 size={18} color={colors.error} />
                  </Pressable>
                )
              }
            />

            {draftEvent && (
              <EventEditForm
                draftEvent={draftEvent}
                setDraftEvent={setDraftEvent}
                projects={projects}
                categories={categories}
                themeColors={themeColors}
                colors={colors}
                editingField={editingField}
                setEditingField={setEditingField}
                onSelectTime={handleSelectTime}
              />
            )}

            <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8, backgroundColor: colors.surface }}>
              <PrimaryButton onPress={handleSave} label={draftEvent?.id ? t('calendar.save') : t('calendar.addEvent')} colors={colors} />
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  iconDanger: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#FEE2E2',
  },
  fabSmall: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: '#000000',
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
  },
  bottomSheetLarge: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    overflow: 'hidden',
    height: '75%',
    flexDirection: 'column',
  },
});
