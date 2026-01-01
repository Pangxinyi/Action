import { Plus, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Modal,
    PanResponder,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { ModalHeader } from '../../components/ModalHeader';
import PrimaryButton from '../../components/PrimaryButton';
import { COLOR_THEMES, TIME_STEP_MIN } from '../../constants/theme';
import type {
    CalendarViewProps,
    DraftEvent,
    EventItem,
    Project
} from '../../types';
import CalendarDropdown from './components/CalendarDropdown';
import DailyTimeline from './components/DailyTimeline';
import { EventEditForm } from './components/EventEditForm';

const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  setEvents,
  projects,
  setProjects,
  categories,
  setCategories,
  selectedColorScheme,
  colors,
}) => {
  const { t, i18n } = useTranslation();
  const [editingField, setEditingField] = useState<'start' | 'end' | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftEvent, setDraftEvent] = useState<DraftEvent | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // 获取当前主题的颜色数组
  const themeColors =
    COLOR_THEMES[selectedColorScheme as keyof typeof COLOR_THEMES] || COLOR_THEMES.default;

  // 格式化月份年份显示
  const formatMonthYear = (date: Date): string => {
    const monthNames = [
      'january',
      'february',
      'march',
      'april',
      'may',
      'june',
      'july',
      'august',
      'september',
      'october',
      'november',
      'december',
    ];
    const month = t(`months.${monthNames[date.getMonth()]}`);
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  // 格式化星期几
  const formatWeekday = (date: Date, short: boolean = false): string => {
    const weekdays = short
      ? ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
      : ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return t(`calendar.${weekdays[date.getDay()]}`);
  };

  // Date navigation functions
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

  // Pan responder for swipe gesture
  const panResponderRef = useRef<any>(null);
  useEffect(() => {
    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10; // Minimum 10px horizontal movement
      },
      onPanResponderRelease: (evt, gestureState) => {
        const minDistance = 50; // Minimum swipe distance
        if (gestureState.dx > minDistance) {
          // Swiped right - go to previous day
          handlePrevDay();
        } else if (gestureState.dx < -minDistance) {
          // Swiped left - go to next day
          handleNextDay();
        }
      },
    });
  }, [selectedDate, handlePrevDay, handleNextDay]);

  const openNewEventAt = (totalMinutes: number) => {
    const dateStr = `${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1
    ).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    setEditingField(null);
    setDraftEvent({
      id: null,
      start: totalMinutes,
      end: totalMinutes + 60, // 默认一小时，之后可以改
      selectedProjectId: null,
      isNewProject: false,
      newProjectName: '',
      newProjectPercent: 60, // default to "Growth" level
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
      end: evt.start + evt.duration, // 用绝对结束时间
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
    let color = '#9CA3AF'; // 默认灰色
    let selectedCategory = draftEvent.category;
    let newCategoryColor: string | undefined = undefined;

    // Handle new category
    if (draftEvent.isNewCategory && draftEvent.newCategoryName?.trim()) {
      const catName = draftEvent.newCategoryName.trim();
      const catColor = draftEvent.newCategoryColor || themeColors[0];
      setCategories((prev) => ({ ...prev, [catName]: catColor }));
      selectedCategory = catName;
      newCategoryColor = catColor; // 保存新类别的颜色
    }

    if (draftEvent.isNewProject && draftEvent.newProjectName.trim()) {
      const projectCategory = selectedCategory || null;
      // 使用新类别颜色或已存在类别的颜色
      const categoryColor =
        newCategoryColor ||
        (projectCategory ? categories[projectCategory] || '#9CA3AF' : '#9CA3AF');
      const newProject: Project = {
        id: Date.now(),
        name: draftEvent.newProjectName,
        time: '0h 0m',
        percent: draftEvent.newProjectPercent || 60, // use user-defined accumulation
        hexColor: categoryColor, // 使用类别颜色
        category: projectCategory, // 绑定事件的类别到项目
        x: 150,
        y: 150,
      };
      setProjects((prev) => [...prev, newProject]);
      title = newProject.name;
      // Save the new project ID to link to the event
      draftEvent.selectedProjectId = newProject.id;
      // 颜色跟着 category 走，不跟着 project 走
    } else if (draftEvent.selectedProjectId) {
      const proj = projects.find((p) => p.id === draftEvent.selectedProjectId);
      if (proj) {
        title = proj.name;
        // 颜色跟着 category 走，不跟着 project 走
      }
    }

    // 颜色由 category 决定，如果选了 category 就用 category 的颜色
    // 优先使用新创建类别的颜色
    if (newCategoryColor) {
      color = newCategoryColor;
    } else if (selectedCategory && categories[selectedCategory]) {
      color = categories[selectedCategory];
    }

    const rawDuration = draftEvent.end - draftEvent.start;
    const duration = Math.max(1, rawDuration); // 至少 1 分钟，防止 end <= start

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
    <View
      style={{ flex: 1, backgroundColor: colors.background }}
      {...panResponderRef.current?.panHandlers}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <Pressable style={styles.headerLeft} onPress={() => setIsCalendarOpen(!isCalendarOpen)}>
          <View>
            <Text style={[styles.headerTitle, { fontWeight: 'bold', color: colors.text }]}>
              {formatMonthYear(selectedDate).split(' ')[0]}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
              {i18n.language === 'zh'
                ? `${selectedDate.getDate()}日 ${formatWeekday(selectedDate, false)}`
                : `${String(selectedDate.getDate()).padStart(2, '0')} ${formatWeekday(
                    selectedDate,
                    false
                  )}`}
            </Text>
          </View>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Pressable
            style={[styles.todayButton, { backgroundColor: colors.backgroundTertiary }]}
            onPress={handleTodayClick}
          >
            <Text style={[styles.todayButtonText, { color: colors.text }]}>
              {t('calendar.today')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.fabSmall, { backgroundColor: colors.primary }]}
            onPress={handleAddNow}
          >
            <Plus size={18} color={colors.primaryText} />
          </Pressable>
        </View>
      </View>

      {/* Mini Calendar Dropdown with backdrop */}
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
      />

      {/* Event Modal */}
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
            {/* 顶部标题 + 删除 + 关闭 */}
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

            {/* 底部主按钮 */}
            <View
              style={{
                paddingHorizontal: 16,
                paddingBottom: 16,
                paddingTop: 8,
                backgroundColor: colors.surface,
              }}
            >
              <PrimaryButton
                onPress={handleSave}
                label={draftEvent?.id ? t('calendar.save') : t('calendar.addEvent')}
                colors={colors}
              />
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

export default CalendarView;
