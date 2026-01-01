import i18n from 'i18next';
import {
  Archive,
  Folder,
  PackageOpen,
  Plus,
  Settings,
  Trash2,
  X
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import '@constants/i18n'; // 初始化 i18n
import { useAppData } from '@hooks/useAppData';
import { useThemeColors } from '@hooks/useThemeColors';
import * as DocumentPicker from 'expo-document-picker';
import * as Localization from 'expo-localization';
import * as Sharing from 'expo-sharing';
import {
  Alert,
  Dimensions,
  LogBox,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import CalendarDropdown from '../src/components/CalendarDropdown';
import ColorPicker from '../src/components/ColorPicker';
import EmptyState from '../src/components/EmptyState';
import { EventCard } from '../src/components/EventCard';
import Header from '../src/components/Header';
import { ModalHeader } from '../src/components/ModalHeader';
import PrimaryButton from '../src/components/PrimaryButton';
import SegmentedControl from '../src/components/SegmentedControl';
import TabBar from '../src/components/TabBar';
import { COLOR_THEMES, NODE_SIZE, TIME_STEP_MIN } from '../src/constants/theme';
import { EventEditForm } from '../src/features/calendar/components/EventEditForm';
import type {
  AnalyticsViewProps,
  CalendarViewProps,
  CategoryMap,
  DraftEvent,
  EventItem,
  Project,
  ProjectDataPoint,
  ProjectsViewProps,
  TabKey,
  TimeRangeType
} from '../src/types';
import { getContrastColor } from '../src/utils/color';
import { parseLocalDate } from '../src/utils/date';
import { clearAppData, exportDataAsJSON, loadAppData } from '../utils/storage';


// --- CONSTANTS ---

// (moved to src/constants/theme.ts)
const getDefaultCategories = (language: string): CategoryMap => {
  if (language === 'zh') {
    return {
      '工作': COLOR_THEMES.default[0],
      '学习': COLOR_THEMES.default[1],
      '运动': COLOR_THEMES.default[2],
    };
  }
  return {
    'Work': COLOR_THEMES.default[0],
    'Learning': COLOR_THEMES.default[1],
    'Fitness': COLOR_THEMES.default[2],
  };
};


// Header component moved to src/components/Header.tsx

// types moved to src/types/index.ts

// TabBar component moved to src/components/TabBar.tsx

// --- Calendar View (Today) ---
// types moved to src/types/index.ts


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
  const { t } = useTranslation();
  const [editingField, setEditingField] = useState<'start' | 'end' | null>(null);
  // tempTime removed (unused)
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftEvent, setDraftEvent] = useState<DraftEvent | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  // 获取当前主题的颜色数组
  const themeColors = COLOR_THEMES[selectedColorScheme as keyof typeof COLOR_THEMES] || COLOR_THEMES.default;

  // 格式化月份年份显示
  const formatMonthYear = (date: Date): string => {
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                        'july', 'august', 'september', 'october', 'november', 'december'];
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

  // formatFullDate removed (unused)




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

  // Scroll when field changes (START/END tap)
  useEffect(() => {
    // The scrolling will happen automatically in onContentSizeChange
  }, [editingField]);


  const pixelsPerMinute = 1;
  const hours = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    const minutesSinceStart = now.getHours() * 60 + now.getMinutes();
    const scrollPos = minutesSinceStart * pixelsPerMinute;
    scrollRef.current.scrollTo({ y: Math.max(0, scrollPos), animated: false });
  }, []);

  // When date changes, scroll to current time (if viewing today) or to 6:00 (if viewing other days)
  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    const isToday =
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate();

    let scrollPos = 0;
    if (isToday) {
      const minutesSinceStart = now.getHours() * 60 + now.getMinutes();
      scrollPos = minutesSinceStart * pixelsPerMinute;
    } else {
      scrollPos = 6 * 60 * pixelsPerMinute; // Default to 6:00 for other days
    }
    scrollRef.current.scrollTo({ y: Math.max(0, scrollPos), animated: true });
  }, [selectedDate]);

  const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const nowTop = nowMinutes * pixelsPerMinute;
  const isSelectedDateToday =
    selectedDate.getFullYear() === currentTime.getFullYear() &&
    selectedDate.getMonth() === currentTime.getMonth() &&
    selectedDate.getDate() === currentTime.getDate();

  const openNewEventAt = (totalMinutes: number) => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    setEditingField(null);
    setDraftEvent({
      id: null,
      start: totalMinutes,
      end: totalMinutes + 60,   // 默认一小时，之后可以改
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
      end: evt.start + evt.duration,   // 用绝对结束时间
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
      const categoryColor = newCategoryColor || (projectCategory ? (categories[projectCategory] || '#9CA3AF') : '#9CA3AF');
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

  // handleReset removed (unused)


  const handleSelectTime = (field: 'start' | 'end', minutes: number) => {
    if (!draftEvent) return;

    if (field === 'start') {
      setDraftEvent({ ...draftEvent, start: minutes });
    } else {
      setDraftEvent({ ...draftEvent, end: minutes });
    }
    setEditingField(null);
  };


  // parseTimeString removed (unused)

  // applyTempTime removed (unused)



  // Get days in current month for mini calendar
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    return firstDay.getDay();
  };

  const daysInMonth = getDaysInMonth(selectedDate);
  const firstDay = getFirstDayOfMonth(selectedDate);
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} {...panResponderRef.current?.panHandlers}>
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

      {/* Mini Calendar Modal - Backdrop and Dropdown */}
      {isCalendarOpen && (
        <>
          {/* Overlay backdrop - closes calendar when tapped */}
          <Pressable
            style={[styles.calendarBackdrop, { backgroundColor: colors.modalBackdrop }]}
            onPress={() => setIsCalendarOpen(false)}
          />
          
          <CalendarDropdown
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            firstDay={firstDay}
            calendarDays={calendarDays}
            formatMonthYear={formatMonthYear}
            formatWeekday={formatWeekday}
            t={t}
            colors={colors}
            onClose={() => setIsCalendarOpen(false)}
            events={events}
            categories={categories}
          />
        </>
      )}

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ minHeight: 1440, paddingHorizontal: 12, paddingTop: 0 }}>
          {hours.map((hour) => (
            <View
              key={hour}
              style={[
                styles.hourRow,
                { height: 60 * pixelsPerMinute, borderColor: colors.border },
              ]}
            >
              <View style={styles.hourLabelContainer}>
                <Text style={[styles.hourLabel, { color: colors.textQuaternary }]}>{`${hour}:00`}</Text>
              </View>
              <View style={[styles.hourTrack, { borderTopColor: colors.chartGrid }]}>
                <Pressable
                  style={{ flex: 1 }}
                  onPress={(e) => {
                    // Get the Y position within this hour track
                    const locationY = e.nativeEvent.locationY;
                    // Calculate minutes within this hour (0-59)
                    let minutesInHour = Math.round((locationY / 60) * 60);
                    // Round to nearest 5-minute increment
                    minutesInHour = Math.round(minutesInHour / 5) * 5;
                    // Clamp to 0-59 range
                    minutesInHour = Math.min(59, Math.max(0, minutesInHour));
                    handleSlotPress(hour, minutesInHour);
                  }}
                />
              </View>
            </View>
          ))}

          {events
            .filter((evt) => {
              const eventDate = evt.date;
              const selectedDateStr = `${selectedDate.getFullYear()}-${String(
                selectedDate.getMonth() + 1,
              ).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
              return eventDate === selectedDateStr;
            })
            .map((evt) => {
            const top = evt.start * pixelsPerMinute;
            const height = evt.duration * pixelsPerMinute;
            if (top < 0) return null;
            const cardHeight = Math.max(20, height);
            return (
              <EventCard
                key={evt.id}
                event={evt}
                layout={{ top, height: cardHeight }}
                colors={colors}
                projects={projects}
                styles={styles}
                onPress={handleEventPress}
              />
            );
          })}

          {isSelectedDateToday && (
            <View style={[styles.nowLine, { top: nowTop }]}>
              <View style={styles.nowDot} />
            </View>
          )}
        </View>
      </ScrollView>

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
            <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8, backgroundColor: colors.surface }}>
              <PrimaryButton onPress={handleSave} label={draftEvent?.id ? t('calendar.save') : t('calendar.addEvent')} colors={colors} />
            </View>
          </View>
        </Pressable>
      </Modal>

          </View>
  );
};

// --- Analytics View ---
// types moved to src/types/index.ts

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ projects, events, categories, selectedColorScheme, setProjects, setCategories, colors }) => {
  const { i18n } = useTranslation();
  // Provide a local `t` that delegates to `i18n.t` so translation calls remain safe
  const t = (key: string, opts?: any) => (i18n && typeof (i18n as any).t === 'function' ? (i18n as any).t(key, opts) : key);
  const [timeRange, setTimeRange] = useState<'Week' | 'Month' | 'Year'>('Week');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showPicker, setShowPicker] = useState(false);
  const [distributionMode, setDistributionMode] = useState<'project' | 'category'>('category');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showUnassignedEvents, setShowUnassignedEvents] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryEvents, setShowCategoryEvents] = useState(false);
  
  // Archive handlers
  
  const days = i18n.language === 'zh' 
    ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    : [
        t('calendar.mon'), 
        t('calendar.tue'), 
        t('calendar.wed'), 
        t('calendar.thu'), 
        t('calendar.fri'), 
        t('calendar.sat'), 
        t('calendar.sun')
      ];

  // note: themeColors is available where needed via getCurrentThemeColors() or global helper

  // Get available months/years from events
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    events.forEach(evt => {
      years.add(parseLocalDate(evt.date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a); // Descending order
  }, [events]);

  const availableMonths = useMemo(() => {
    const months = new Set<number>();
    events.forEach(evt => {
      const date = parseLocalDate(evt.date);
      if (date.getFullYear() === selectedYear) {
        months.add(date.getMonth());
      }
    });
    return Array.from(months).sort((a, b) => b - a); // Descending order
  }, [events, selectedYear]);

  // Filter events based on timeRange
  const filteredEvents = useMemo(() => {
    if (timeRange === 'Week') {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
      
      // Get Monday of this week
      const monday = new Date(today);
      monday.setDate(today.getDate() - daysFromMonday);
      monday.setHours(0, 0, 0, 0);
      
      // Get Sunday of this week
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      
      return events.filter((evt) => {
        const eventDate = parseLocalDate(evt.date);
        return eventDate >= monday && eventDate <= sunday;
      });
    } else if (timeRange === 'Month') {
      return events.filter((evt) => {
        const eventDate = parseLocalDate(evt.date);
        return eventDate.getMonth() === selectedMonth && eventDate.getFullYear() === selectedYear;
      });
    } else {
      return events.filter((evt) => {
        const eventDate = parseLocalDate(evt.date);
        return eventDate.getFullYear() === selectedYear;
      });
    }
  }, [events, timeRange, selectedMonth, selectedYear]);

  // Calculate stacked chart data based on timeRange (by category)
  const stackedChartData = useMemo(() => {
    // Get number of bars based on timeRange
    const barCount = timeRange === 'Week' ? 7 : timeRange === 'Year' ? 12 : 5;
    
    // Initialize: each bar is an array of { category, duration, color }
    const data: { category: string; duration: number; color: string }[][] = 
      Array.from({ length: barCount }, () => []);
    
    // Group events by time period and category
    const periodCategoryMap: Map<number, Map<string, number>> = new Map();
    
    filteredEvents.forEach((evt) => {
      const eventDate = parseLocalDate(evt.date);
      let idx = -1;
      
      if (timeRange === 'Week') {
        const dayOfWeek = eventDate.getDay();
        idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      } else if (timeRange === 'Year') {
        idx = eventDate.getMonth();
      } else {
        // Month view
        const day = eventDate.getDate();
        if (day >= 1 && day <= 7) idx = 0;
        else if (day >= 8 && day <= 14) idx = 1;
        else if (day >= 15 && day <= 21) idx = 2;
        else if (day >= 22 && day <= 28) idx = 3;
        else if (day >= 29) idx = 4;
      }
      
      if (idx >= 0 && idx < barCount) {
        if (!periodCategoryMap.has(idx)) {
          periodCategoryMap.set(idx, new Map());
        }
        const categoryMap = periodCategoryMap.get(idx)!;
        const category = evt.category || 'uncategorized';
        categoryMap.set(category, (categoryMap.get(category) || 0) + evt.duration);
      }
    });
    
    // Convert to stacked data format
    periodCategoryMap.forEach((categoryMap, idx) => {
      categoryMap.forEach((duration, category) => {
        data[idx].push({
          category,
          duration,
          color: categories[category] || '#9CA3AF',
        });
      });
      // Sort by duration descending so larger segments are at bottom
      data[idx].sort((a, b) => b.duration - a.duration);
    });
    
    return data;
  }, [filteredEvents, timeRange, categories]);

  // Calculate total for each bar (for height calculation)
  const chartTotals = stackedChartData.map(bar => 
    bar.reduce((sum, segment) => sum + segment.duration, 0)
  );
  const maxVal = Math.max(...chartTotals);

  // Labels for chart
  const chartLabels = (() => {
    if (timeRange === 'Week') {
      return days;
    } else if (timeRange === 'Year') {
      // For year view: show only month number for Chinese, first letter for English
      if (i18n.language === 'zh') {
        return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
      } else {
        return ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
      }
    } else {
      // Month view: show start dates like Apple Fitness
      return ['1', '8', '15', '22', '29'];
    }
  })();


  // Calculate total focus time (based on filtered events)
  const totalMinutes = filteredEvents.reduce((sum, evt) => sum + evt.duration, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

  // Calculate time distribution by project (based on filtered events)
  const projectTimeMap = new Map<number, number>();
  let unassignedProjectTime = 0;
  filteredEvents.forEach((evt) => {
    if (evt.projectId) {
      projectTimeMap.set(evt.projectId, (projectTimeMap.get(evt.projectId) || 0) + evt.duration);
    } else {
      unassignedProjectTime += evt.duration;
    }
  });

  const projectsWithTime = projects
    .map((p) => ({
      ...p,
      duration: projectTimeMap.get(p.id) || 0,
      timeShare: totalMinutes > 0 ? Math.round((projectTimeMap.get(p.id) || 0) / totalMinutes * 100) : 0,
    }))
    .filter((p) => p.duration > 0) // 只显示有时间的项目
    .sort((a, b) => b.duration - a.duration); // 按时长降序排序

  // 添加未分配项目行
  const unassignedProject = unassignedProjectTime > 0 ? {
    id: -1,
    name: t('calendar.uncategorized'),
    hexColor: '#9CA3AF',
    duration: unassignedProjectTime,
    timeShare: totalMinutes > 0 ? Math.round((unassignedProjectTime / totalMinutes) * 100) : 0,
  } : null;

  // Calculate time distribution by category (based on filtered events)
  const categoryTimeMap = new Map<string, number>();
  filteredEvents.forEach((evt) => {
    const category = evt.category || 'uncategorized';
    categoryTimeMap.set(category, (categoryTimeMap.get(category) || 0) + evt.duration);
  });

  const categoriesWithTime = Array.from(categoryTimeMap.entries())
    .map(([name, duration]) => ({
      name,
      color: categories[name] || '#9CA3AF',
      duration,
      percent: totalMinutes > 0 ? Math.round((duration / totalMinutes) * 100) : 0,
    }))
    .filter((c) => c.duration > 0) // 只显示有时间的类别
    .sort((a, b) => b.duration - a.duration); // 按时长降序排序

  // 根据时间范围显示不同的副标题
  const getSubtitle = () => {
    if (timeRange === 'Week') return t('analytics.thisWeek');
    if (timeRange === 'Month') {
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'mayShort', 'jun', 
                          'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthStr = t(`months.${monthNames[selectedMonth]}`).toUpperCase();
      return i18n.language === 'zh' 
        ? t(`months.${['january', 'february', 'march', 'april', 'may', 'june', 
                       'july', 'august', 'september', 'october', 'november', 'december'][selectedMonth]}`)
        : `${monthStr} ${selectedYear}`;
    }
    return `${selectedYear}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary }}>
      <Header title={t('analytics.title')} colors={colors} />

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        onScrollBeginDrag={() => showPicker && setShowPicker(false)}
      >
        <SegmentedControl
          options={([
            { key: 'Week', label: t('analytics.week') },
            { key: 'Month', label: t('analytics.month') },
            { key: 'Year', label: t('analytics.year') },
          ] as { key: string; label: string }[])}
          value={timeRange}
          onChange={(k) => setTimeRange(k as any)}
          colors={colors}
        />

        <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.analyticsHeader}>
            <View style={{ position: 'relative' }}>
              <Text style={[styles.analyticsTitle, { color: colors.text }]}>{t('analytics.totalTime')}</Text>
              {timeRange === 'Week' ? (
                <Text style={[styles.analyticsSubtitle, { color: colors.textTertiary }]}>{getSubtitle()}</Text>
              ) : (
                <>
                  {(timeRange === 'Month' && availableMonths.length > 1) || 
                   (timeRange === 'Year' && availableYears.length > 1) ? (
                    <>
                      <Pressable 
                        onPress={() => setShowPicker(true)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      >
                        <Text style={styles.analyticsSubtitle}>{getSubtitle()}</Text>
                        <View style={styles.pickerIconContainer}>
                          <Text style={styles.pickerIconUp}>▲</Text>
                          <Text style={styles.pickerIconDown}>▼</Text>
                        </View>
                      </Pressable>
                      
                      {/* Inline Picker Dropdown */}
                      {showPicker && (
                        <>
                          {/* Backdrop to close picker */}
                          <Pressable 
                            style={{ position: 'absolute', top: -200, left: -200, right: -200, bottom: -500, zIndex: 999 }} 
                            onPress={() => setShowPicker(false)} 
                          />
                          <View style={[styles.pickerDropdown, { zIndex: 1000, backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <ScrollView style={{ maxHeight: 132 }} nestedScrollEnabled={true}>
                            {timeRange === 'Month' 
                              ? availableMonths.map((month) => {
                                  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                                                      'july', 'august', 'september', 'october', 'november', 'december'];
                                  const isSelected = month === selectedMonth;
                                  return (
                                    <Pressable
                                      key={month}
                                      style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                                      onPress={() => {
                                        setSelectedMonth(month);
                                        setShowPicker(false);
                                      }}
                                    >
                                      <Text style={[styles.pickerCheck, { color: colors.accent }]}>{isSelected ? '✓' : ''}</Text>
                                      <Text style={[styles.pickerItemText, { color: colors.text }, isSelected && [styles.pickerItemSelected, { color: colors.accent }]]}>
                                        {i18n.language === 'zh' 
                                          ? `${selectedYear}年${t(`months.${monthNames[month]}`)}`
                                          : `${t(`months.${monthNames[month]}`)} ${selectedYear}`
                                        }
                                      </Text>
                                    </Pressable>
                                  );
                                })
                              : availableYears.map((year) => {
                                  const isSelected = year === selectedYear;
                                  return (
                                    <Pressable
                                      key={year}
                                      style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                                      onPress={() => {
                                        setSelectedYear(year);
                                        setShowPicker(false);
                                      }}
                                    >
                                      <Text style={[styles.pickerCheck, { color: colors.accent }]}>{isSelected ? '✓' : ''}</Text>
                                      <Text style={[styles.pickerItemText, { color: colors.text }, isSelected && [styles.pickerItemSelected, { color: colors.accent }]]}>
                                        {year}
                                      </Text>
                                    </Pressable>
                                  );
                                })
                            }
                          </ScrollView>
                        </View>
                        </>
                      )}
                    </>
                  ) : (
                    <Text style={[styles.analyticsSubtitle, { color: colors.textTertiary }]}>{getSubtitle()}</Text>
                  )}
                </>
              )}
            </View>
            <Text style={[styles.analyticsValue, { color: colors.text }]}>
              {totalHours}<Text style={[styles.analyticsValueUnit, { color: colors.textTertiary }]}>{t('common.hours')}</Text> {totalMins}
              <Text style={[styles.analyticsValueUnit, { color: colors.textTertiary }]}>{t('common.minutes')}</Text>
            </Text>
          </View>
          <View style={styles.barChartRow}>
            {stackedChartData.map((barSegments, idx) => {
              const barTotal = chartTotals[idx];
              const barHeight = maxVal ? (barTotal / maxVal) * 100 : 0;
              return (
                <View 
                  key={idx} 
                  style={[
                    styles.barWrapper,
                    timeRange === 'Month' && { alignItems: 'flex-start' }
                  ]}
                >
                  <View style={[styles.barBackground, { backgroundColor: colors.backgroundTertiary }]}>
                    <View style={{ height: `${barHeight}%`, width: '100%', flexDirection: 'column-reverse', borderRadius: 4, overflow: 'hidden' }}>
                      {barSegments.map((segment, segIdx) => {
                        const segmentPercent = barTotal > 0 ? (segment.duration / barTotal) * 100 : 0;
                        return (
                          <View
                            key={segIdx}
                            style={{
                              height: `${segmentPercent}%`,
                              width: '100%',
                              backgroundColor: segment.color,
                            }}
                          />
                        );
                      })}
                    </View>
                  </View>
                  <Text style={[styles.barLabel, { color: colors.textQuaternary }]}>{chartLabels[idx]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Distribution Mode Toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('analytics.projects')}</Text>
          <View style={{ flexDirection: 'row', gap: 4, backgroundColor: colors.backgroundTertiary, borderRadius: 8, padding: 2 }}>
            <Pressable
              onPress={() => setDistributionMode('category')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: distributionMode === 'category' ? colors.surface : 'transparent',
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: distributionMode === 'category' ? colors.text : colors.textTertiary,
              }}>
                {t('analytics.byCategory')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setDistributionMode('project')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: distributionMode === 'project' ? colors.surface : 'transparent',
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: distributionMode === 'project' ? colors.text : colors.textTertiary,
              }}>
                {t('analytics.byProject')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Distribution List - By Project */}
        {distributionMode === 'project' && projectsWithTime.map((p) => {
          const hours = Math.floor(p.duration / 60);
          const mins = p.duration % 60;
          return (
            <Pressable 
              key={p.id} 
              style={[styles.projectRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                setEditingProject(p);
                setModalOpen(true);
              }}
            >
              <View style={styles.projectRowHeader}>
                <View style={styles.projectRowLeft}>
                  <View
                    style={[
                      styles.projectDot,
                      { backgroundColor: p.hexColor },
                    ]}
                  />
                  <Text style={[styles.projectRowName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{p.name}</Text>
                </View>
                <Text style={[styles.projectRowTime, { color: colors.textSecondary }]}>
                  {hours}{t('common.hours')} {mins}{t('common.minutes')}
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.backgroundTertiary }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${p.timeShare}%`, backgroundColor: p.hexColor },
                  ]}
                />
              </View>
            </Pressable>
          );
        })}

        {/* Unassigned Project */}
        {distributionMode === 'project' && unassignedProject && (() => {
          const hours = Math.floor(unassignedProject.duration / 60);
          const mins = unassignedProject.duration % 60;
          return (
            <Pressable 
              key="unassigned" 
              style={[styles.projectRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowUnassignedEvents(true)}
            >
              <View style={styles.projectRowHeader}>
                <View style={styles.projectRowLeft}>
                  <View
                    style={[
                      styles.projectDot,
                      { backgroundColor: unassignedProject.hexColor },
                    ]}
                  />
                  <Text style={[styles.projectRowName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{unassignedProject.name}</Text>
                </View>
                <Text style={[styles.projectRowTime, { color: colors.textSecondary }]}>
                  {hours}{t('common.hours')} {mins}{t('common.minutes')}
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.backgroundTertiary }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${unassignedProject.timeShare}%`, backgroundColor: unassignedProject.hexColor },
                  ]}
                />
              </View>
            </Pressable>
          );
        })()}

        {/* Distribution List - By Category */}
        {distributionMode === 'category' && categoriesWithTime.map((c) => {
          const hours = Math.floor(c.duration / 60);
          const mins = c.duration % 60;
          return (
            <Pressable 
              key={c.name} 
              style={[styles.projectRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                setSelectedCategory(c.name);
                setShowCategoryEvents(true);
              }}
            >
              <View style={styles.projectRowHeader}>
                <View style={styles.projectRowLeft}>
                  <View
                    style={[
                      styles.projectDot,
                      { backgroundColor: c.color },
                    ]}
                  />
                  <Text style={[styles.projectRowName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                    {c.name === 'uncategorized' ? t('calendar.uncategorized') : c.name}
                  </Text>
                </View>
                <Text style={[styles.projectRowTime, { color: colors.textSecondary }]}>
                  {hours}{t('common.hours')} {mins}{t('common.minutes')}
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.backgroundTertiary }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${c.percent}%`, backgroundColor: c.color },
                  ]}
                />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Edit Project Modal */}
      {modalOpen && editingProject && (
        <Modal
          visible={modalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setModalOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: colors.modalBackdrop, justifyContent: 'flex-end' }}>
            {/* Backdrop */}
            <Pressable 
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              onPress={() => setModalOpen(false)}
            />
            
            {/* Content */}
              <View 
                style={{ 
                  backgroundColor: colors.surface, 
                  borderTopLeftRadius: 24, 
                  borderTopRightRadius: 24, 
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingHorizontal: 0,
                  overflow: 'hidden',
                  maxHeight: '80%',
                }}
              >
                {/* Header */}
                <ModalHeader
                  title={editingProject.name}
                  subtitle={(() => {
                    const projectEvents = filteredEvents.filter(evt => evt.projectId === editingProject.id);
                    const cnt = projectEvents.length;
                    const totalMinutes = projectEvents.reduce((s, e) => s + (e.duration || 0), 0);
                    const h = Math.floor(totalMinutes / 60);
                    const m = totalMinutes % 60;
                    const timeStr = h > 0 ? `${h}${t('common.hours')} ${m}${t('common.minutes')}` : `${m}${t('common.minutes')}`;
                    return `${cnt} ${cnt === 1 ? t('visualization.event') : t('visualization.events')} · ${timeStr}`;
                  })()}
                  onClose={() => setModalOpen(false)}
                  colors={colors}
                />

                {/* Events List */}
                <ScrollView 
                  style={{ flexGrow: 1 }}
                  contentContainerStyle={{ padding: 24, paddingBottom: 24 }}
                  showsVerticalScrollIndicator={false}
                >
                {(() => {
                  const projectEvents = filteredEvents.filter(evt => evt.projectId === editingProject.id);
                  
                  if (projectEvents.length === 0) {
                    return (
                      <EmptyState
                        message={t('visualization.noEventsForProject') || 'No events for this project'}
                        colors={colors}
                      />
                    );
                  }
                  
                    return projectEvents.map((evt, index) => {
                    const eventDate = parseLocalDate(evt.date);
                    const hours = Math.floor(evt.duration / 60);
                    const mins = evt.duration % 60;
                    const categoryColor = evt.category ? (categories[evt.category] || editingProject.hexColor) : editingProject.hexColor;
                    
                    // Format time range
                    const formatMinutes = (totalMins: number) => {
                      const h = Math.floor(totalMins / 60);
                      const m = totalMins % 60;
                      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                    };
                    const startTime = formatMinutes(evt.start);
                    const endTime = formatMinutes(evt.start + evt.duration);
                    
                    return (
                      <View 
                        key={`${evt.date}-${evt.start}-${index}`}
                        style={{
                          backgroundColor: colors.backgroundSecondary,
                          borderRadius: 12,
                          padding: 16,
                          marginBottom: 12,
                          borderLeftWidth: 4,
                          borderLeftColor: editingProject.hexColor,
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 }}>
                            {evt.details || evt.title || t('calendar.newEvent')}
                          </Text>
                          <View style={{ 
                            paddingHorizontal: 8, 
                            paddingVertical: 4, 
                            backgroundColor: colors.surface,
                            borderRadius: 6,
                          }}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textTertiary }}>
                              {hours > 0 && `${hours}${t('common.hours')} `}{mins}{t('common.minutes')}
                            </Text>
                          </View>
                        </View>

                        {evt.category && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: categoryColor }} />
                            <Text style={{ fontSize: 13, color: colors.textTertiary }}>
                              {(() => {
                                const name = evt.category || '';
                                return name ? t(`categories.${name.toLowerCase()}`, { defaultValue: name }) : '';
                              })()}
                            </Text>
                          </View>
                        )}

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <Text style={{ fontSize: 13, color: colors.textTertiary }}>
                            {eventDate.toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </Text>
                          <Text style={{ fontSize: 13, color: colors.textQuaternary }}>•</Text>
                          <Text style={{ fontSize: 13, color: colors.textTertiary }}>
                            {startTime} - {endTime}
                          </Text>
                        </View>
                      </View>
                    );
                  });
                })()}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Unassigned Events Modal */}
      {showUnassignedEvents && (() => {
        const unassignedEvents = filteredEvents.filter(evt => !evt.projectId);
        return (
          <Modal
            visible={showUnassignedEvents}
            transparent
            animationType="slide"
            onRequestClose={() => setShowUnassignedEvents(false)}
          >
            <View style={{ flex: 1, backgroundColor: colors.modalBackdrop, justifyContent: 'flex-end' }}>
              {/* Backdrop */}
              <Pressable 
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                onPress={() => setShowUnassignedEvents(false)}
              />
              
              {/* Content */}
              <View 
                style={{ 
                  backgroundColor: colors.surface, 
                  borderTopLeftRadius: 24, 
                  borderTopRightRadius: 24, 
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingHorizontal: 0,
                  overflow: 'hidden',
                  maxHeight: '80%',
                }}
              >
                {/* Header */}
                <ModalHeader
                  title={t('calendar.uncategorized')}
                  subtitle={(() => {
                    const cnt = unassignedEvents.length;
                    const totalMinutes = unassignedEvents.reduce((s, e) => s + (e.duration || 0), 0);
                    const h = Math.floor(totalMinutes / 60);
                    const m = totalMinutes % 60;
                    const timeStr = h > 0 ? `${h}${t('common.hours')} ${m}${t('common.minutes')}` : `${m}${t('common.minutes')}`;
                    return `${cnt} ${cnt === 1 ? t('visualization.event') : t('visualization.events')} · ${timeStr}`;
                  })()}
                  onClose={() => setShowUnassignedEvents(false)}
                  colors={colors}
                />

                {/* Events List */}
                <ScrollView 
                  style={{ flexGrow: 1 }}
                  contentContainerStyle={{ padding: 24, paddingBottom: 24 }}
                  showsVerticalScrollIndicator={false}
                >
                  {unassignedEvents.length === 0 ? (
                    <EmptyState
                      message={t('projects.noProjectsYet')}
                      icon={<PackageOpen size={28} color={colors.textTertiary} />}
                      fullScreen={false}
                    />
                  ) : (
                    unassignedEvents.map((evt, index) => {
                      const eventDate = parseLocalDate(evt.date);
                      const hours = Math.floor(evt.duration / 60);
                      const mins = evt.duration % 60;
                      const categoryColor = evt.category ? (categories[evt.category] || '#9CA3AF') : '#9CA3AF';
                      
                      // Format time range
                      const formatMinutes = (totalMins: number) => {
                        const h = Math.floor(totalMins / 60);
                        const m = totalMins % 60;
                        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                      };
                      const startTime = formatMinutes(evt.start);
                      const endTime = formatMinutes(evt.start + evt.duration);
                      
                      return (
                        <View 
                          key={`${evt.date}-${evt.start}-${index}`}
                          style={{
                            backgroundColor: colors.backgroundSecondary,
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 12,
                            borderLeftWidth: 4,
                            borderLeftColor: categoryColor,
                          }}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 }}>
                              {evt.details || evt.title || t('calendar.newEvent')}
                            </Text>
                            <View style={{ 
                              paddingHorizontal: 8, 
                              paddingVertical: 4, 
                              backgroundColor: colors.surface,
                              borderRadius: 6,
                            }}>
                              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textTertiary }}>
                                {hours > 0 && `${hours}${t('common.hours')} `}{mins}{t('common.minutes')}
                              </Text>
                            </View>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: categoryColor }} />
                            <Text style={{ fontSize: 13, color: colors.textTertiary }}>
                              {(() => {
                                const name = evt.category || 'uncategorized';
                                if (name === 'uncategorized') return t('calendar.uncategorized');
                                return name === 'uncategorized' ? t('calendar.uncategorized') : t(`categories.${name.toLowerCase()}`, { defaultValue: name });
                              })()}
                            </Text>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <Text style={{ fontSize: 13, color: colors.textTertiary }}>
                              {eventDate.toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </Text>
                            <Text style={{ fontSize: 13, color: colors.textQuaternary }}>•</Text>
                            <Text style={{ fontSize: 13, color: colors.textTertiary }}>
                              {startTime} - {endTime}
                            </Text>
                          </View>
                        </View>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        );
      })()}

      {/* Category Events Modal */}
      {showCategoryEvents && selectedCategory && (() => {
        const categoryEvents = filteredEvents.filter(evt => {
          const evtCategory = evt.category || 'uncategorized';
          return evtCategory === selectedCategory;
        });
        const categoryColor = categories[selectedCategory] || '#9CA3AF';
        
        return (
          <Modal
            visible={showCategoryEvents}
            transparent
            animationType="slide"
            onRequestClose={() => setShowCategoryEvents(false)}
          >
            <View style={{ flex: 1, backgroundColor: colors.modalBackdrop, justifyContent: 'flex-end' }}>
              {/* Backdrop */}
              <Pressable 
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                onPress={() => setShowCategoryEvents(false)}
              />
              
              {/* Content */}
              <View 
                style={{ 
                  backgroundColor: colors.surface, 
                  borderTopLeftRadius: 24, 
                  borderTopRightRadius: 24, 
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingHorizontal: 0,
                  overflow: 'hidden',
                  maxHeight: '80%',
                }}
              >
                {/* Header */}
                <ModalHeader
                  title={selectedCategory === 'uncategorized' ? t('calendar.uncategorized') : selectedCategory}
                  subtitle={`${categoryEvents.length} ${categoryEvents.length === 1 ? t('visualization.event') : t('visualization.events')} · ${(() => {
                    const totalMinutes = categoryEvents.reduce((s, e) => s + (e.duration || 0), 0);
                    const h = Math.floor(totalMinutes / 60);
                    const m = totalMinutes % 60;
                    if (h > 0) return `${h}${t('common.hours')} ${m}${t('common.minutes')}`;
                    return `${m}${t('common.minutes')}`;
                  })()}`}
                  onClose={() => setShowCategoryEvents(false)}
                  colors={colors}
                />

                {/* Events List */}
                <ScrollView 
                  style={{ flexGrow: 1 }}
                  contentContainerStyle={{ padding: 24, paddingBottom: 24 }}
                  showsVerticalScrollIndicator={false}
                >
                  {categoryEvents.length === 0 ? (
                    <EmptyState
                      message={t('projects.noProjectsYet')}
                      icon={<PackageOpen size={28} color={colors.textTertiary} />}
                      fullScreen={false}
                    />
                  ) : (
                    categoryEvents.map((evt, index) => {
                      const eventDate = parseLocalDate(evt.date);
                      const hours = Math.floor(evt.duration / 60);
                      const mins = evt.duration % 60;
                      
                      // Format time range
                      const formatMinutes = (totalMins: number) => {
                        const h = Math.floor(totalMins / 60);
                        const m = totalMins % 60;
                        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                      };
                      const startTime = formatMinutes(evt.start);
                      const endTime = formatMinutes(evt.start + evt.duration);
                      
                      return (
                        <View 
                          key={`${evt.date}-${evt.start}-${index}`}
                          style={{
                            backgroundColor: colors.backgroundSecondary,
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 12,
                            borderLeftWidth: 4,
                            borderLeftColor: categoryColor,
                          }}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 }}>
                              {evt.details || evt.title || t('calendar.newEvent')}
                            </Text>
                            <View style={{ 
                              paddingHorizontal: 8, 
                              paddingVertical: 4, 
                              backgroundColor: colors.surface,
                              borderRadius: 6,
                            }}>
                              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textTertiary }}>
                                {hours > 0 && `${hours}${t('common.hours')} `}{mins}{t('common.minutes')}
                              </Text>
                            </View>
                          </View>

                          {/* Linked Project */}
                          {evt.projectId && (() => {
                            const linkedProject = projects.find(p => p.id === evt.projectId);
                            if (linkedProject) {
                              return (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: linkedProject.hexColor }} />
                                  <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textSecondary }}>
                                    {linkedProject.name}
                                  </Text>
                                </View>
                              );
                            }
                            return null;
                          })()}

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <Text style={{ fontSize: 13, color: colors.textTertiary }}>
                              {eventDate.toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </Text>
                            <Text style={{ fontSize: 13, color: colors.textQuaternary }}>•</Text>
                            <Text style={{ fontSize: 13, color: colors.textTertiary }}>
                              {startTime} - {endTime}
                            </Text>
                          </View>
                        </View>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        );
      })()}
    </View>
  );
};

// --- PROJECT QUADRANT MAP VIEW ---
// types moved to src/types/index.ts

const ProjectsView: React.FC<ProjectsViewProps> = ({ projects, events, categories, setProjects, setCategories, setEvents, selectedColorScheme, setSelectedColorScheme, onGoToCalendar, colors }) => {
  const { t } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRangeType>('30d');
  const [selectedProject, setSelectedProject] = useState<ProjectDataPoint | null>(null);
  const [showColorTheme, setShowColorTheme] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [showArchivedProjects, setShowArchivedProjects] = useState(false);
  const [showProjectManagement, setShowProjectManagement] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string; color: string } | null>(null);
  const [editingProject, setEditingProject] = useState<{ id: number; name: string; category: string | null; hexColor: string; percent: number } | null>(null);
  const [selectedNode, setSelectedNode] = useState<Project | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const initialWidth = Dimensions.get('window').width - 24;
  const [chartWidth, setChartWidth] = useState(initialWidth);

  // Chart dimensions
  const CHART_PADDING = { top: 40, right: 20, bottom: 60, left: 28 };
  const CHART_HEIGHT = 340; // ~55% of screen for chart area
  const chartInnerWidth = chartWidth - CHART_PADDING.left - CHART_PADDING.right;
  const chartInnerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  
  // Quadrant thresholds
  const SHARE_THRESHOLD = 0.10; // 10% time share
  const ACCUMULATION_THRESHOLD = 60; // 60% accumulation

  // Get current theme colors - use useMemo to ensure it updates
  const themeColors = useMemo(() => {
    return COLOR_THEMES[selectedColorScheme as keyof typeof COLOR_THEMES] || COLOR_THEMES.default;
  }, [selectedColorScheme]);

  // Get current theme colors
  const getCurrentThemeColors = () => {
    return themeColors;
  };

  // Get category color
  const getCategoryColor = useCallback((categoryName: string | null): string => {
    if (!categoryName) return '#9CA3AF';
    return categories[categoryName] || '#9CA3AF';
  }, [categories]);

  // Calculate project data for quadrant chart
  const projectDataPoints = useMemo((): ProjectDataPoint[] => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // Calculate date range
    let startDate: Date;
    if (timeRange === '30d') {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeRange === '90d') {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 90);
    } else {
      startDate = new Date(today.getFullYear(), 0, 1); // Jan 1st of current year
    }
    startDate.setHours(0, 0, 0, 0);

    // Filter events in time range
    const filteredEvents = events.filter(evt => {
      const evtDate = parseLocalDate(evt.date);
      return evtDate >= startDate && evtDate <= today;
    });

    // Calculate total duration in range
    const totalDuration = filteredEvents.reduce((sum, evt) => sum + evt.duration, 0);

    // Calculate per-project metrics
    const projectMetrics = new Map<number, { duration: number; lastEventDate: Date }>();
    
    filteredEvents.forEach(evt => {
      if (!evt.projectId) return;
      const current = projectMetrics.get(evt.projectId) || { duration: 0, lastEventDate: new Date(0) };
      current.duration += evt.duration;
      const evtDate = parseLocalDate(evt.date);
      if (evtDate > current.lastEventDate) {
        current.lastEventDate = evtDate;
      }
      projectMetrics.set(evt.projectId, current);
    });

    // Convert to data points
    const dataPoints: ProjectDataPoint[] = [];

    projects.forEach(project => {
      // Only archived projects should be hidden
      if (project.archived) return;
      
      // Get metrics, or use default "zero" metrics if no data in range
      const metrics = projectMetrics.get(project.id) || { duration: 0, lastEventDate: new Date(0) };
      
      // 🔥 核心修改：不再跳过没有时间的项目
      // 之前的逻辑：if (!metrics || metrics.duration === 0) return;
      // 这是错的！没有投入时间的项目也应该显示，只是贴在 X=0 的位置

      const durationHours = metrics.duration / 60;
      const share = totalDuration > 0 ? metrics.duration / totalDuration : 0;
      
      // Calculate days since last event
      // If never active (lastEventDate is epoch), set to a large number for visual indication
      const daysSinceLastEvent = metrics.duration > 0 
        ? Math.floor((today.getTime() - metrics.lastEventDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999; // No data = very inactive, bubble will be faded

      dataPoints.push({
        id: project.id,
        name: project.name,
        category: project.category,
        color: getCategoryColor(project.category),
        durationHours,
        share,
        accumulation: project.percent, // Accumulation is still valid even if share is 0!
        recentActivity: daysSinceLastEvent,
        x: share, // If no time, this will be 0 (left edge)
        y: project.percent / 100, // Normalize to 0-1
      });
    });

    return dataPoints;
  }, [projects, events, timeRange, getCategoryColor]);

  // Get suggestion text based on quadrant
  const getSuggestion = (share: number, accumulation: number): string => {
    const isHighShare = share >= SHARE_THRESHOLD;
    const isHighAccum = accumulation >= ACCUMULATION_THRESHOLD;
    
    if (isHighShare && isHighAccum) return t('visualization.suggestionTopRight');
    if (!isHighShare && isHighAccum) return t('visualization.suggestionTopLeft');
    if (isHighShare && !isHighAccum) return t('visualization.suggestionBottomRight');
    return t('visualization.suggestionBottomLeft');
  };

  // Get quadrant label
  const getQuadrantLabel = (share: number, accumulation: number): string => {
    const isHighShare = share >= SHARE_THRESHOLD;
    const isHighAccum = accumulation >= ACCUMULATION_THRESHOLD;
    
    if (isHighShare && isHighAccum) return t('visualization.quadrantTopRight');
    if (!isHighShare && isHighAccum) return t('visualization.quadrantTopLeft');
    if (isHighShare && !isHighAccum) return t('visualization.quadrantBottomRight');
    return t('visualization.quadrantBottomLeft');
  };

  // Calculate bubble radius based on duration
  const getBubbleRadius = (durationHours: number, allDurations: number[]): number => {
    const minRadius = 16;
    const maxRadius = 40;
    const maxDuration = Math.max(...allDurations, 1);
    const k = (maxRadius - minRadius) / Math.sqrt(maxDuration);
    return Math.min(maxRadius, minRadius + k * Math.sqrt(durationHours));
  };

  // Calculate opacity based on recent activity
  const getOpacity = (daysSinceLastEvent: number): number => {
    if (daysSinceLastEvent <= 7) return 1;
    if (daysSinceLastEvent <= 14) return 0.85;
    if (daysSinceLastEvent <= 30) return 0.6;
    return 0.35;
  };

  // Handle bubble press
  const handleBubblePress = (dataPoint: ProjectDataPoint) => {
    setSelectedProject(dataPoint);
  };

  // Handle long press to edit
  const handleBubbleLongPress = (dataPoint: ProjectDataPoint) => {
    const project = projects.find(p => p.id === dataPoint.id);
    if (project) {
      setSelectedNode({ ...project });
      setModalOpen(true);
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const files = result.assets || [result];
      let totalImported = 0;
      let totalProjectsCreated = 0;
      const newCategories: CategoryMap = { ...categories };
      let colorIndex = Object.keys(categories).filter(name => name !== 'uncategorized').length;
      const allNewEvents: EventItem[] = [];
      const newProjects: Project[] = [...projects];
      const themeColors = getCurrentThemeColors();

      for (const file of files) {
        try {
          const response = await fetch(file.uri);
          const jsonText = await response.text();
          const data = JSON.parse(jsonText);

          if (!Array.isArray(data)) {
            Alert.alert(t('common.error'), t('projects.importFileArrayRequired', { file: file.name }));
            continue;
          }

          data.forEach((item: any, index: number) => {
            const date = item.date || new Date().toISOString().split('T')[0];
            const tag = item.tag || undefined;
            const type = item.type || null;
            const project = item.project || null;
            const time = item.time || null;
            
            const timeData = time ? parseTimeRangeWithStart(time) : { start: 9 * 60, duration: 60 };
            const start = timeData.start;
            const duration = timeData.duration;
            
            const category = type;
            if (category && !newCategories[category]) {
              const color = themeColors[colorIndex % themeColors.length];
              newCategories[category] = color;
              colorIndex++;
            }

            let projectId: number | undefined = undefined;
            if (project && project.length > 0) {
              const projectName = Array.isArray(project) ? project[0] : project;
              
              let existingProject = newProjects.find(p => p.name === projectName);
              if (!existingProject) {
                existingProject = {
                  id: Date.now() + newProjects.length + index * 1000 + Math.random() * 100,
                  name: projectName,
                  time: '0h 0m',
                  percent: 0,
                  hexColor: category && newCategories[category] ? newCategories[category] : '#9CA3AF',
                  category: category,
                  x: 180 + (Math.random() - 0.5) * 100,
                  y: 250 + (Math.random() - 0.5) * 100,
                  vx: 0,
                  vy: 0,
                };
                newProjects.push(existingProject);
                totalProjectsCreated++;
              }
              projectId = existingProject.id;
            }

            const color = category && newCategories[category] ? newCategories[category] : '#9CA3AF';

            const event: EventItem = {
              id: Date.now() + totalImported * 100 + Math.random() * 50,
              title: projectId ? newProjects.find(p => p.id === projectId)?.name || 'Event' : 'Event',
              start,
              duration,
              hexColor: color,
              details: tag,
              category: category,
              date: date,
              projectId,
            };

            allNewEvents.push(event);
            totalImported++;
          });

        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          Alert.alert(t('common.error'), t('projects.importProcessFailed', { file: file.name, error: String(fileError) }));
        }
      }

      if (allNewEvents.length > 0) {
        setEvents(prev => [...prev, ...allNewEvents]);
        setCategories(newCategories);
        setProjects(newProjects);
        setShowSettings(false);
        Alert.alert(t('common.confirm'), t('projects.importSuccess', { total: totalImported, files: files.length, projects: totalProjectsCreated }));
      }

    } catch (error) {
      console.error('Import error:', error);
      Alert.alert(t('common.error'), t('projects.importFailed', { error: String(error) }));
    }
  };

  const handleExportData = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert(t('projects.exportNotAvailable'));
        return;
      }

      const data = await loadAppData();
      if (!data) {
        Alert.alert(t('projects.noDataToExport'));
        return;
      }

      const jsonString = exportDataAsJSON(data);

      console.log('[Export] Platform.OS:', Platform.OS);
      // Prefer the legacy filesystem module to avoid deprecation warnings / errors.
      let legacy: any = null;
      try {
        // @ts-ignore
        legacy = await import('expo-file-system/legacy');
      } catch (legacyErr) {
        console.log('[Export] legacy module import failed', legacyErr);
      }

      let dir = legacy ? (legacy.cacheDirectory || legacy.documentDirectory) : undefined;
      console.log('[Export] legacy.documentDirectory:', legacy && legacy.documentDirectory);
      console.log('[Export] legacy.cacheDirectory:', legacy && legacy.cacheDirectory);

      if (!dir) {
        // As a last fallback, try the modern module (may emit deprecation warnings on some runtimes)
        try {
          const fsModule: any = await import('expo-file-system');
          dir = fsModule && (fsModule.cacheDirectory || fsModule.documentDirectory);
          console.log('[Export] fallback FileSystem dirs:', dir);
        } catch (errFs) {
          console.warn('[Export] modern FileSystem import failed', errFs);
        }
      }

      if (!dir) {
        Alert.alert(t('projects.exportNotAvailable'));
        return;
      }

      const now = new Date();
      const fileName = `action_export_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.json`;
      const fileUri = `${dir}${fileName}`;
      console.log('[Export] fileUri:', fileUri);

      // Prefer legacy module to perform the write (avoids deprecation warnings on modern API)
      if (legacy && typeof legacy.writeAsStringAsync === 'function') {
        try {
          await legacy.writeAsStringAsync(fileUri, jsonString);
          console.log('[Export] wrote file to legacy uri:', fileUri);
          const canShare = await Sharing.isAvailableAsync();
          if (!canShare) {
            Alert.alert(t('projects.exportNotAvailable'));
            return;
          }
          await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Export Data', UTI: 'public.json' });
          // cleanup
          try { if (legacy.cacheDirectory && fileUri.startsWith(legacy.cacheDirectory)) { await legacy.deleteAsync(fileUri, { idempotent: true }); } } catch {}
          // Export completed and sharing was invoked. No separate alert required.
          return;
        } catch (legacyWriteErr) {
          console.warn('[Export] legacy write failed, will try modern FS as fallback', legacyWriteErr);
          // fallthrough to modern FS
        }
      }

      // If we get here, try modern FileSystem API as a fallback (may emit deprecation warnings on some runtimes)
      try {
        const fsModule: any = await import('expo-file-system');
        await fsModule.writeAsStringAsync(fileUri, jsonString);
      } catch (err) {
        console.warn('[Export] modern write failed', err);
        // Try to use legacy with explicit legacy dir if available
        try {
          // @ts-ignore
          const legacy2: any = await import('expo-file-system/legacy');
          const legacyDir2 = legacy2.documentDirectory || legacy2.cacheDirectory;
          if (!legacyDir2) throw new Error('No writable directory');
          const legacyUri2 = `${legacyDir2}${fileName}`;
          await legacy2.writeAsStringAsync(legacyUri2, jsonString);
          console.log('[Export] wrote file to legacy uri (fallback):', legacyUri2);
          const canShare2 = await Sharing.isAvailableAsync();
          if (!canShare2) {
            Alert.alert(t('projects.exportNotAvailable'));
            return;
          }
          await Sharing.shareAsync(legacyUri2, { mimeType: 'application/json', dialogTitle: 'Export Data', UTI: 'public.json' });
          try { if (legacy2.cacheDirectory && legacyUri2.startsWith(legacy2.cacheDirectory)) { await legacy2.deleteAsync(legacyUri2, { idempotent: true }); } } catch {}
          // Export completed and sharing was invoked. No alert shown to avoid interrupting sharing UI.
          return;
        } catch (err2) {
          console.error('[Export] Write failed (legacy fallback)', err2);
          Alert.alert(t('projects.exportFailed'), String(err2));
          return;
        }
      }

      const canShare = await Sharing.isAvailableAsync();
      console.log('[Export] Sharing.isAvailableAsync():', canShare);
      if (!canShare) {
        Alert.alert(t('projects.exportNotAvailable'));
        return;
      }

      await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Export Data', UTI: 'public.json' });

      // Clean up if we wrote to cache
      try {
        if (dir === (FileSystem as any).cacheDirectory) {
          await (FileSystem as any).deleteAsync(fileUri, { idempotent: true });
        }
      } catch {
        // ignore
      }

      // Export completed and sharing was invoked. No separate alert required.
    } catch (error) {
      console.error('Export failed', error);
      Alert.alert(t('projects.exportFailed'), String(error));
    }
  }, [t]);

  const parseTimeRangeWithStart = (timeStr: string): { start: number; duration: number } => {
    try {
      const match = timeStr.match(/(\d+)(?:\.(\d+))?(am|pm)-(\d+)(?:\.(\d+))?(am|pm)/i);
      if (!match) return { start: 9 * 60, duration: 60 };
      
      let startHour = parseInt(match[1]);
      const startMin = match[2] ? parseInt(match[2]) : 0;
      let endHour = parseInt(match[4]);
      const endMin = match[5] ? parseInt(match[5]) : 0;
      const startPeriod = match[3].toLowerCase();
      const endPeriod = match[6].toLowerCase();
      
      if (startPeriod === 'pm' && startHour !== 12) startHour += 12;
      if (startPeriod === 'am' && startHour === 12) startHour = 0;
      if (endPeriod === 'pm' && endHour !== 12) endHour += 12;
      if (endPeriod === 'am' && endHour === 12) endHour = 0;
      
      const startMinutes = startHour * 60 + startMin;
      let endMinutes = endHour * 60 + endMin;
      
      if (endMinutes <= startMinutes) {
        endMinutes += 24 * 60;
      }
      
      return { start: startMinutes, duration: endMinutes - startMinutes };
    } catch {
      return { start: 9 * 60, duration: 60 };
    }
  };

  const handleClearData = async () => {
    Alert.alert(
      t('projects.clearConfirmTitle'),
      t('projects.clearConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            setProjects([]);
            setCategories({});
            setEvents([]);
            setShowSettings(false);
            
            try {
              await clearAppData();
              Alert.alert(t('common.confirm'), t('projects.clearSuccess'));
            } catch (error) {
              console.error('Failed to clear storage:', error);
              Alert.alert(t('common.error'), t('projects.clearPartialWarning'));
            }
          }
        },
      ]
    );
  };

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
            // Remove category
            const newCategories = { ...categories };
            delete newCategories[categoryName];
            setCategories(newCategories);
            
            // Update projects using this category
            setProjects(prev => prev.map(p => 
              p.category === categoryName ? { ...p, category: null, hexColor: '#9CA3AF' } : p
            ));
            
            // Update events using this category
            setEvents(prev => prev.map(e => 
              e.category === categoryName ? { ...e, category: undefined } : e
            ));
          }
        }
      ]
    );
  };

  const handleArchiveProject = (projectId: number) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, archived: true } : p
    ));
    setModalOpen(false);
  };

  const handleUnarchiveProject = (projectId: number) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, archived: false } : p
    ));
  };

  const handleDeleteProject = (projectId: number) => {
    Alert.alert(
      t('common.confirm'),
      t('projects.deleteProjectConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            setProjects(prev => prev.filter(p => p.id !== projectId));
            // Unlink events from this project
            setEvents(prev => prev.map(e => 
              e.projectId === projectId ? { ...e, projectId: undefined } : e
            ));
          }
        }
      ]
    );
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !editingCategory.newName.trim()) return;
    
    const { oldName, newName, color } = editingCategory;
    const trimmedNewName = newName.trim();
    
    // Check if new name conflicts with existing category (except itself)
    if (trimmedNewName !== oldName && categories[trimmedNewName]) {
      Alert.alert(t('common.error'), 'Category name already exists');
      return;
    }
    
    // Update categories
    const newCategories = { ...categories };
    delete newCategories[oldName];
    newCategories[trimmedNewName] = color;
    setCategories(newCategories);
    
    // Update projects
    setProjects(prev => prev.map(p => 
      p.category === oldName ? { ...p, category: trimmedNewName, hexColor: color } : p
    ));
    
    // Update events
    setEvents(prev => prev.map(e => 
      e.category === oldName ? { ...e, category: trimmedNewName } : e
    ));
    
    setEditingCategory(null);
  };

  const handleSelectColorScheme = (scheme: string) => {
    setSelectedColorScheme(scheme);
    
    const newColors = COLOR_THEMES[scheme as keyof typeof COLOR_THEMES] || COLOR_THEMES.default;
    
    const updatedCategories: CategoryMap = {};
    const categoryNames = Object.keys(categories).filter(name => name !== 'uncategorized');
    
    categoryNames.forEach((catName, index) => {
      updatedCategories[catName] = newColors[index % newColors.length];
    });
    
    if (categories['uncategorized']) {
      updatedCategories['uncategorized'] = '#9CA3AF';
    }
    
    setCategories(updatedCategories);
    
    setProjects(prevProjects => 
      prevProjects.map(project => ({
        ...project,
        hexColor: project.category && updatedCategories[project.category] 
          ? updatedCategories[project.category] 
          : '#9CA3AF'
      }))
    );
    
    // Update events' hexColor to match new theme colors
    setEvents(prevEvents =>
      prevEvents.map(event => ({
        ...event,
        hexColor: event.category && updatedCategories[event.category]
          ? updatedCategories[event.category]
          : event.hexColor // keep original if no category match
      }))
    );
  };

  // Settings panel
  if (showSettings) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.modalBackdrop }}>
        <Pressable style={{ flex: 1 }} onPress={() => setShowSettings(false)} />
        <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 0, paddingBottom: 0, paddingHorizontal: 0, overflow: 'hidden', maxHeight: '80%' }}>
          <ModalHeader
            title={t('projects.settings')}
            onClose={() => setShowSettings(false)}
            colors={colors}
          />
          
          <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
            {/* Manage Categories */}
            <View>
              <Pressable 
                onPress={() => setShowManageCategories(!showManageCategories)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: showManageCategories ? 12 : 0 }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('projects.categoryManagement')}</Text>
                <Text style={{ fontSize: 12, color: colors.textTertiary }}>{showManageCategories ? '▼' : '▶'}</Text>
              </Pressable>
              {showManageCategories && (
                <View style={{ gap: 8 }}>
                  {editingCategory?.oldName === '' ? (
                    <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary, padding: 12, borderRadius: 12, gap: 8 }}>
                      <TextInput
                        style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: colors.text }}
                        value={editingCategory.newName}
                        onChangeText={(text) => setEditingCategory({ ...editingCategory, newName: text })}
                        placeholder={t('projects.categoryName')}
                        placeholderTextColor={colors.textQuaternary}
                        autoFocus
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
                  ) : Object.keys(categories).length === 0 ? (
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
                    Object.entries(categories).map(([catName, catColor]) => (
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
                  ))) }
                </View>
              )}
            </View>

            {/* Project Management */}
            <View>
              <Pressable 
                onPress={() => setShowProjectManagement(!showProjectManagement)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: showProjectManagement ? 12 : 0 }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('projects.projectManagement')}</Text>
                <Text style={{ fontSize: 12, color: colors.textTertiary }}>{showProjectManagement ? '▼' : '▶'}</Text>
              </Pressable>
              {showProjectManagement && (
                <View style={{ gap: 8 }}>
                  {projects.filter(p => !p.archived).length === 0 ? (
                    <EmptyState
                      message={t('projects.noActiveProjects')}
                      icon={<Folder size={20} color={colors.textTertiary} />}
                      fullScreen={false}
                      style={{ paddingVertical: 16 }}
                      actionButton={(
                        <Pressable
                          onPress={() => {
                            const newProj = { id: Date.now(), name: '', time: '0h 0m', category: null, hexColor: '#9CA3AF', percent: 100, x: 150, y: 150 };
                            setProjects(prev => [...prev, newProj]);
                            setEditingProject(newProj);
                          }}
                          style={{ backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 }}
                        >
                          <Text style={{ color: colors.accentText, fontWeight: '700' }}>{t('projects.addProject', { defaultValue: 'Add Project' })}</Text>
                        </Pressable>
                      )}
                      colors={colors}
                    />
                  ) : (
                    projects.filter(p => !p.archived).map((project) => (
                      <View key={project.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {editingProject?.id === project.id ? (
                          <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary, padding: 12, borderRadius: 12, gap: 8 }}>
                            <TextInput
                              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: colors.text }}
                              value={editingProject.name}
                              onChangeText={(text) => setEditingProject({ ...editingProject, name: text })}
                              placeholder={t('projects.projectName')}
                              placeholderTextColor={colors.textQuaternary}
                            />
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                              <Pressable
                                onPress={() => setEditingProject({ ...editingProject, category: null, hexColor: '#9CA3AF' })}
                                style={{
                                  paddingHorizontal: 12,
                                  paddingVertical: 8,
                                  borderRadius: 8,
                                  backgroundColor: !editingProject.category ? colors.text : colors.surface,
                                  borderWidth: 1,
                                  borderColor: !editingProject.category ? colors.text : colors.border,
                                }}
                              >
                                <Text style={{ fontSize: 12, fontWeight: '600', color: !editingProject.category ? colors.textInverse : colors.textTertiary }}>
                                  {t('projects.uncategorized')}
                                </Text>
                              </Pressable>
                              {Object.entries(categories).map(([catName, catColor]) => {
                                const isSelected = editingProject.category === catName;
                                return (
                                  <Pressable
                                    key={catName}
                                    onPress={() => setEditingProject({ ...editingProject, category: catName, hexColor: catColor })}
                                    style={{
                                      paddingHorizontal: 12,
                                      paddingVertical: 8,
                                      borderRadius: 8,
                                      backgroundColor: isSelected ? catColor : colors.surface,
                                      borderWidth: 1,
                                      borderColor: catColor,
                                    }}
                                  >
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: isSelected ? colors.accentText : catColor }}>
                                      {t(`categories.${catName.toLowerCase()}`, { defaultValue: catName })}
                                    </Text>
                                  </Pressable>
                                );
                              })}
                            </View>
                            {/* Accumulation Slider */}
                            <View>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase' }}>
                                  {t('projects.accumulation')}
                                </Text>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                                  {Math.round(editingProject.percent)}%
                                </Text>
                              </View>
                              <View 
                                style={{ height: 32, justifyContent: 'center' }}
                                onStartShouldSetResponder={() => true}
                                onResponderGrant={(e) => {
                                  const locationX = e.nativeEvent.locationX;
                                  const containerWidth = 280;
                                  const newPercent = Math.max(0, Math.min(100, (locationX / containerWidth) * 100));
                                  setEditingProject({ ...editingProject, percent: Math.round(newPercent) });
                                }}
                                onResponderMove={(e) => {
                                  const locationX = e.nativeEvent.locationX;
                                  const containerWidth = 280;
                                  const newPercent = Math.max(0, Math.min(100, (locationX / containerWidth) * 100));
                                  setEditingProject({ ...editingProject, percent: Math.round(newPercent) });
                                }}
                              >
                                <View style={{ height: 6, backgroundColor: colors.backgroundTertiary, borderRadius: 3, overflow: 'hidden' }}>
                                  <View style={{ height: '100%', width: `${editingProject.percent}%`, backgroundColor: editingProject.hexColor, borderRadius: 3 }} />
                                </View>
                                <View style={{ position: 'absolute', left: `${editingProject.percent}%`, transform: [{ translateX: -8 }], width: 16, height: 16, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 2, borderColor: editingProject.hexColor }} />
                              </View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              <Pressable
                                onPress={() => {
                                  if (editingProject.name.trim()) {
                                    setProjects(prev => prev.map(p => 
                                      p.id === editingProject.id ? { ...p, name: editingProject.name.trim(), category: editingProject.category, hexColor: editingProject.hexColor, percent: editingProject.percent } : p
                                    ));
                                  }
                                  setEditingProject(null);
                                }}
                                style={{ flex: 1, backgroundColor: colors.accent, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
                              >
                                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.accentText }}>{t('common.save')}</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => setEditingProject(null)}
                                style={{ flex: 1, backgroundColor: colors.backgroundTertiary, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
                              >
                                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textTertiary }}>{t('common.cancel')}</Text>
                              </Pressable>
                            </View>
                          </View>
                        ) : (
                          <>
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.backgroundSecondary, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12 }}>
                              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: project.hexColor }} />
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{project.name}</Text>
                                {project.category && (
                                  <Text style={{ fontSize: 11, color: colors.textTertiary, marginTop: 2 }}>{project.category}</Text>
                                )}
                              </View>
                            </View>
                            <Pressable
                              onPress={() => setEditingProject({ id: project.id, name: project.name, category: project.category, hexColor: project.hexColor, percent: project.percent })}
                              style={{ padding: 8, backgroundColor: colors.backgroundTertiary, borderRadius: 8 }}
                            >
                              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textTertiary }}>✎</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => handleArchiveProject(project.id)}
                              style={{ padding: 8, backgroundColor: colors.warningLight, borderRadius: 8 }}
                            >
                              <Archive size={14} color={colors.warning} />
                            </Pressable>
                          </>
                        )}
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* Archived Projects */}
            <View>
              <Pressable 
                onPress={() => setShowArchivedProjects(!showArchivedProjects)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: showArchivedProjects ? 12 : 0 }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('projects.archivedProjects')}</Text>
                <Text style={{ fontSize: 12, color: colors.textTertiary }}>{showArchivedProjects ? '▼' : '▶'}</Text>
              </Pressable>
              {showArchivedProjects && (
                <View style={{ gap: 8 }}>
                  {projects.filter(p => p.archived).length === 0 ? (
                    <EmptyState
                      message={t('projects.noArchivedProjects')}
                      icon={<Archive size={20} color={colors.textTertiary} />}
                      fullScreen={false}
                      style={{ paddingVertical: 16 }}
                    />
                  ) : (
                    projects.filter(p => p.archived).map((project) => (
                      <View key={project.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.backgroundSecondary, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12 }}>
                          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: project.hexColor }} />
                          <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.text }}>{project.name}</Text>
                        </View>
                        <Pressable
                          onPress={() => handleUnarchiveProject(project.id)}
                          style={{ padding: 8, backgroundColor: colors.accentLight, borderRadius: 8 }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.accent }}>↻</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleDeleteProject(project.id)}
                          style={{ padding: 8, backgroundColor: colors.errorLight, borderRadius: 8 }}
                        >
                          <Trash2 size={14} color={colors.error} />
                        </Pressable>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* Color Theme */}
            <View>
              <Pressable 
                onPress={() => setShowColorTheme(!showColorTheme)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: showColorTheme ? 12 : 0 }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('projects.colorTheme')}</Text>
                <Text style={{ fontSize: 12, color: colors.textTertiary }}>{showColorTheme ? '▼' : '▶'}</Text>
              </Pressable>
              {showColorTheme && (
                <View style={{ gap: 8 }}>
                  {[
                    { id: 'default', title: t('themes.default') },
                    { id: 'vivid', title: t('themes.vivid') },
                    { id: 'seaside', title: t('themes.seaside') },
                    { id: 'twilight', title: t('themes.twilight') },
                    { id: 'garden', title: t('themes.garden') },
                    
                    { id: 'mineral', title: t('themes.mineral') },
                  ].map((option) => {
                    const themeColors = COLOR_THEMES[option.id as keyof typeof COLOR_THEMES] || COLOR_THEMES.default;
                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => handleSelectColorScheme(option.id)}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, borderWidth: selectedColorScheme === option.id ? 2 : 1, borderColor: selectedColorScheme === option.id ? colors.accent : colors.border, backgroundColor: selectedColorScheme === option.id ? colors.accentLight : colors.backgroundSecondary }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{option.title}</Text>
                        <View style={{ flexDirection: 'row', marginLeft: 'auto' }}>
                          {themeColors.map((color, index) => (
                            <View 
                              key={index} 
                              style={{ 
                                width: 24, 
                                height: 24, 
                                borderRadius: 12, 
                                backgroundColor: color,
                                marginLeft: index === 0 ? 0 : -10,
                                borderWidth: 2,
                                borderColor: selectedColorScheme === option.id ? colors.accentLight : colors.backgroundSecondary
                              }} 
                            />
                          ))}
                        </View>
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: selectedColorScheme === option.id ? colors.accent : 'transparent', justifyContent: 'center', alignItems: 'center', marginLeft: 12 }}>
                          {selectedColorScheme === option.id && <Text style={{ color: colors.accentText, fontWeight: '700', fontSize: 12 }}>✓</Text>}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            

            {/* Data Management */}
            <View>
              <Pressable 
                onPress={() => setShowDataManagement(!showDataManagement)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: showDataManagement ? 12 : 0 }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('projects.dataManagement')}</Text>
                <Text style={{ fontSize: 12, color: colors.textTertiary }}>{showDataManagement ? '▼' : '▶'}</Text>
              </Pressable>
              {showDataManagement && (
                <View style={{ gap: 8 }}>
                  <Pressable
                    onPress={handleImportData}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
                  >
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.text }}>{t('projects.importData')}</Text>
                    <Text style={{ fontSize: 20, color: colors.text }}>↑</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleExportData}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
                  >
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.text }}>{t('projects.exportData')}</Text>
                    <Text style={{ fontSize: 20, color: colors.text }}>↓</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleClearData}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.error }}
                  >
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.accentText }}>{t('projects.clearAllData')}</Text>
                    <Trash2 size={18} color={colors.accentText} />
                  </Pressable>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // Main quadrant map view
  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>{t('visualization.title')}</Text>
        <Pressable onPress={() => setShowSettings(true)} style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: colors.backgroundTertiary, justifyContent: 'center', alignItems: 'center' }}>
          <Settings size={18} color={colors.textTertiary} />
        </Pressable>
      </View>

      {/* Empty state or Chart + Detail Card */}
      {projectDataPoints.length === 0 ? (
        <EmptyState
          message={`${t('projects.noProjectsYet')}
\n${t('projects.noProjectsHint')}`}
          actionButton={onGoToCalendar ? (
            <Pressable
              onPress={onGoToCalendar}
              style={{
                backgroundColor: colors.accent,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.accentText }}>
                {t('projects.goToCalendar')}
              </Text>
            </Pressable>
          ) : undefined}
          colors={colors}
        />
      ) : (
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Time Range Selector */}
          <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: colors.surface }}>
            <SegmentedControl
              options={([
                { key: '30d', label: t('visualization.timeRange30') },
                { key: '90d', label: t('visualization.timeRange90') },
                { key: 'year', label: t('visualization.timeRangeYear') },
              ] as { key: string; label: string }[])}
              value={timeRange}
              onChange={(k) => {
                setTimeRange(k as TimeRangeType);
                setSelectedProject(null);
              }}
              colors={colors}
            />
          </View>

          {/* Quadrant Chart */}
          <View 
            style={{ paddingHorizontal: 12, paddingTop: 20, paddingBottom: 16 }}
            onLayout={(e) => setChartWidth(e.nativeEvent.layout.width - 24)}
          >
            <View style={{ width: '100%', height: CHART_HEIGHT, backgroundColor: colors.surface, borderRadius: 16, padding: 10 }}>
              {/* Y-axis label */}
              <View style={{ position: 'absolute', left: 0, top: CHART_HEIGHT / 2, transform: [{ rotate: '-90deg' }] }}>
                <Text style={{ fontSize: 9, fontWeight: '600', color: colors.textQuaternary }}>{t('visualization.yAxis')}</Text>
              </View>

              {/* Chart area */}
              <View style={{ marginLeft: CHART_PADDING.left, marginTop: CHART_PADDING.top, width: chartInnerWidth, height: chartInnerHeight }}>
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((val) => (
                  <View 
                    key={`v-${val}`}
                    style={{ 
                      position: 'absolute', 
                      left: val * chartInnerWidth, 
                      top: 0, 
                      width: 1, 
                      height: chartInnerHeight, 
                      backgroundColor: colors.chartGrid 
                    }} 
                  />
                ))}
                {[0, 0.25, 0.5, 0.75, 1].map((val) => (
                  <View 
                    key={`h-${val}`}
                    style={{ 
                      position: 'absolute', 
                      left: 0, 
                      top: (1 - val) * chartInnerHeight, 
                      width: chartInnerWidth, 
                      height: 1, 
                      backgroundColor: colors.chartGrid 
                    }} 
                  />
                ))}

                {/* Quadrant lines */}
                <View 
                  style={{ 
                    position: 'absolute', 
                    left: SHARE_THRESHOLD * chartInnerWidth, 
                    top: 0, 
                    width: 2, 
                    height: chartInnerHeight, 
                    backgroundColor: colors.textQuaternary,
                    opacity: 0.5
                  }} 
                />
                <View 
                  style={{ 
                    position: 'absolute', 
                    left: 0, 
                    top: (1 - ACCUMULATION_THRESHOLD / 100) * chartInnerHeight, 
                    width: chartInnerWidth, 
                    height: 2, 
                    backgroundColor: colors.textQuaternary,
                    opacity: 0.5
                  }} 
                />

                {/* Quadrant labels */}
                <View style={{ position: 'absolute', right: 4, top: 4 }}>
                  <Text style={{ fontSize: 9, fontWeight: '600', color: colors.textTertiary, textAlign: 'right' }}>
                    {t('visualization.quadrantTopRight')}
                  </Text>
                </View>
                <View style={{ position: 'absolute', left: 4, top: 4 }}>
                  <Text style={{ fontSize: 9, fontWeight: '600', color: colors.textTertiary }}>
                    {t('visualization.quadrantTopLeft')}
                  </Text>
                </View>
                <View style={{ position: 'absolute', right: 4, bottom: 4 }}>
                  <Text style={{ fontSize: 9, fontWeight: '600', color: colors.textTertiary, textAlign: 'right' }}>
                    {t('visualization.quadrantBottomRight')}
                  </Text>
                </View>
                <View style={{ position: 'absolute', left: 4, bottom: 4 }}>
                  <Text style={{ fontSize: 9, fontWeight: '600', color: colors.textTertiary }}>
                    {t('visualization.quadrantBottomLeft')}
                  </Text>
                </View>

                {/* Project bubbles */}
                {projectDataPoints.map((point) => {
                  const allDurations = projectDataPoints.map(p => p.durationHours);
                  const radius = getBubbleRadius(point.durationHours, allDurations);
                  const opacity = getOpacity(point.recentActivity);
                  const isSelected = selectedProject?.id === point.id;

                  // Clamp bubble position to chart boundaries
                  const x = Math.max(radius, Math.min(point.x * chartInnerWidth, chartInnerWidth - radius));
                  const y = Math.max(radius, Math.min((1 - point.y) * chartInnerHeight, chartInnerHeight - radius));

                  return (
                    <Pressable
                      key={point.id}
                      onPress={() => handleBubblePress(point)}
                      onLongPress={() => handleBubbleLongPress(point)}
                      style={{
                        position: 'absolute',
                        left: x - radius,
                        top: y - radius,
                        width: radius * 2,
                        height: radius * 2,
                        borderRadius: radius,
                        backgroundColor: point.color,
                        opacity: opacity,
                        borderWidth: isSelected ? 3 : 1,
                        borderColor: isSelected ? '#000000' : '#FFFFFF',
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                        elevation: 4,
                      }}
                    >
                      {radius > 20 && (
                        <Text
                          style={{
                            fontSize: radius > 30 ? 10 : 8,
                            fontWeight: '700',
                            color: getContrastColor(point.color),
                            textAlign: 'center',
                            paddingHorizontal: 2,
                          }}
                        >
                          {point.name}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* X-axis labels */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginLeft: CHART_PADDING.left, marginTop: 8, width: chartInnerWidth }}>
                <Text style={{ fontSize: 10, color: colors.chartLabel }}>0%</Text>
                <Text style={{ fontSize: 10, color: colors.chartLabel }}>25%</Text>
                <Text style={{ fontSize: 10, color: colors.chartLabel }}>50%</Text>
                <Text style={{ fontSize: 10, color: colors.chartLabel }}>75%</Text>
                <Text style={{ fontSize: 10, color: colors.chartLabel }}>100%</Text>
              </View>
              
              {/* X-axis label */}
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.chartLabel, textAlign: 'center', marginTop: 4 }}>
                {t('visualization.xAxis')}
              </Text>

              {/* Y-axis labels */}
              <View style={{ position: 'absolute', left: 0, top: CHART_PADDING.top, bottom: CHART_PADDING.bottom + 40, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 1 }}>
                <Text style={{ fontSize: 8, color: colors.chartLabel, fontWeight: '600' }}>100%</Text>
                <Text style={{ fontSize: 8, color: colors.chartLabel, fontWeight: '600' }}>50%</Text>
                <Text style={{ fontSize: 8, color: colors.chartLabel, fontWeight: '600' }}>0%</Text>
              </View>
            </View>
          </View>

          {/* Project Detail Card */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
            {selectedProject ? (
              <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, shadowColor: colors.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                      {selectedProject.name}
                    </Text>
                    {selectedProject.category && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: selectedProject.color, marginRight: 6 }} />
                        <Text style={{ fontSize: 13, color: colors.textTertiary }}>{selectedProject.category}</Text>
                      </View>
                    )}
                  </View>
                  <Pressable onPress={() => setSelectedProject(null)}>
                    <X size={20} color={colors.textQuaternary} />
                  </Pressable>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                  <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary, borderRadius: 12, padding: 12 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textTertiary, marginBottom: 4 }}>{t('visualization.timeSpent')}</Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                      {Math.floor(selectedProject.durationHours)}h {Math.round((selectedProject.durationHours % 1) * 60)}m
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textQuaternary, marginTop: 2 }}>
                      {t('visualization.share')}: {Math.round(selectedProject.share * 100)}%
                    </Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary, borderRadius: 12, padding: 12 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textTertiary, marginBottom: 4 }}>{t('projects.accumulation')}</Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                      {Math.round(selectedProject.accumulation)}%
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textQuaternary, marginTop: 2 }}>
                      {getQuadrantLabel(selectedProject.share, selectedProject.accumulation)}
                    </Text>
                  </View>
                </View>

                <View style={{ backgroundColor: colors.warningLight, borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: colors.warning }}>
                  <Text style={{ fontSize: 13, color: colors.text, lineHeight: 18 }}>
                    {getSuggestion(selectedProject.share, selectedProject.accumulation)}
                  </Text>
                </View>

                {selectedProject.recentActivity > 0 && (
                  <Text style={{ fontSize: 11, color: colors.textQuaternary, marginTop: 8, textAlign: 'center' }}>
                    {t('visualization.lastActive')}: {selectedProject.recentActivity === 0 ? t('visualization.today') : `${selectedProject.recentActivity} ${t('visualization.daysAgo')}`}
                  </Text>
                )}
              </View>
            ) : (
              <View style={{ backgroundColor: colors.backgroundSecondary, borderRadius: 16, padding: 16, alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 13, color: colors.textQuaternary }}>
                  {t('visualization.tapToSelect')}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textQuaternary, opacity: 0.7 }}>
                  {t('visualization.longPressToEdit')}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Edit Project Modal */}
      {modalOpen && selectedNode && (
        <Modal
          visible={modalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setModalOpen(false)}
        >
          <Pressable 
            style={{ flex: 1, backgroundColor: colors.modalBackdrop, justifyContent: 'flex-end' }}
            onPress={() => setModalOpen(false)}
          >
            <View 
              style={{ 
                backgroundColor: colors.surface, 
                borderTopLeftRadius: 24, 
                borderTopRightRadius: 24, 
                paddingTop: 0,
                paddingBottom: 0,
                paddingHorizontal: 0,
                overflow: 'hidden',
                maxHeight: '80%',
              }}
            >
              {/* Header */}
              <ModalHeader
                titleNode={
                  <TextInput
                    style={{ 
                      fontSize: 28, 
                      fontWeight: '700', 
                      color: colors.text,
                      padding: 0,
                      margin: 0,
                    }}
                    value={selectedNode.name}
                    onChangeText={(text) => setSelectedNode({ ...selectedNode, name: text })}
                    placeholder="Project Name"
                    placeholderTextColor={colors.textQuaternary}
                  />
                }
                subtitle={t('projects.editDetails')}
                onClose={() => setModalOpen(false)}
                rightElement={
                  <Pressable 
                    onPress={() => handleArchiveProject(selectedNode.id)}
                    style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: 16, 
                      backgroundColor: colors.warningLight, 
                      justifyContent: 'center', 
                      alignItems: 'center' 
                    }}
                  >
                    <Archive size={18} color={colors.warning} />
                  </Pressable>
                }
                colors={colors}
              />

              <ScrollView 
                style={{ flexGrow: 1 }}
                contentContainerStyle={{ padding: 24, paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Accumulation (Progress) */}
                <View style={{ marginBottom: 32 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {t('projects.accumulation')}
                    </Text>
                    <View style={{ 
                      paddingHorizontal: 12, 
                      paddingVertical: 4, 
                      borderRadius: 12, 
                      backgroundColor: selectedNode.percent >= 100 ? colors.success : colors.backgroundTertiary 
                    }}>
                      <Text style={{ 
                        fontSize: 18, 
                        fontWeight: '800', 
                        color: selectedNode.percent >= 100 ? colors.accentText : colors.text 
                      }}>
                        {Math.round(selectedNode.percent)}%
                      </Text>
                    </View>
                  </View>

                  {/* Hint Text */}
                  <Text style={{ fontSize: 12, color: colors.textTertiary, lineHeight: 18, marginBottom: 16 }}>
                    {t('projects.accumulationHint')}
                  </Text>

                  {/* Progress Bar - Draggable */}
                  <View 
                    style={{ height: 48, justifyContent: 'center', marginBottom: 8 }}
                    onStartShouldSetResponder={() => true}
                    onResponderGrant={(e) => {
                      const locationX = e.nativeEvent.locationX;
                      const containerWidth = 327; // Approximate width (screen width - 48px padding)
                      const newPercent = Math.max(0, Math.min(100, (locationX / containerWidth) * 100));
                      setSelectedNode({ ...selectedNode, percent: Math.round(newPercent) });
                    }}
                    onResponderMove={(e) => {
                      const locationX = e.nativeEvent.locationX;
                      const containerWidth = 327;
                      const newPercent = Math.max(0, Math.min(100, (locationX / containerWidth) * 100));
                      setSelectedNode({ ...selectedNode, percent: Math.round(newPercent) });
                    }}
                  >
                    <View style={{ 
                      height: 8, 
                      backgroundColor: colors.backgroundTertiary, 
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}>
                      <View style={{ 
                        height: '100%', 
                        width: `${selectedNode.percent}%`, 
                        backgroundColor: selectedNode.hexColor,
                        borderRadius: 4,
                      }} />
                    </View>
                    
                    {/* Draggable Handle */}
                    <View 
                      style={{ 
                        position: 'absolute',
                        left: `${selectedNode.percent}%`,
                        transform: [{ translateX: -12 }],
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: colors.surface,
                        borderWidth: 3,
                        borderColor: selectedNode.hexColor,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                        elevation: 4,
                      }}
                    />
                  </View>

                  {/* Scale Labels */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 }}>
                    <Text style={{ fontSize: 10, color: colors.textQuaternary, fontWeight: '600' }}>{t('projects.accumulationLevel0')}</Text>
                    <Text style={{ fontSize: 10, color: colors.textQuaternary, fontWeight: '600' }}>{t('projects.accumulationLevel30')}</Text>
                    <Text style={{ fontSize: 10, color: colors.textQuaternary, fontWeight: '600' }}>{t('projects.accumulationLevel60')}</Text>
                    <Text style={{ fontSize: 10, color: colors.textQuaternary, fontWeight: '600' }}>{t('projects.accumulationLevel85')}</Text>
                  </View>
                </View>

                {/* Category Selection */}
                <View style={{ marginBottom: 32 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
                    {t('projects.category')}
                  </Text>
                  
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {/* Uncategorized Option */}
                    <Pressable
                      onPress={() => setSelectedNode({ ...selectedNode, category: null, hexColor: '#9CA3AF' })}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 20,
                        backgroundColor: !selectedNode.category ? colors.text : colors.backgroundSecondary,
                        borderWidth: 2,
                        borderColor: !selectedNode.category ? colors.text : colors.border,
                      }}
                    >
                      <Text style={{ 
                        fontSize: 13, 
                        fontWeight: '700', 
                        color: !selectedNode.category ? colors.textInverse : colors.textTertiary 
                      }}>
                        {t('projects.uncategorized')}
                      </Text>
                    </Pressable>

                    {/* Existing Categories */}
                    {Object.entries(categories).map(([catName, catColor]) => {
                      const isSelected = selectedNode.category === catName;
                      return (
                        <Pressable
                          key={catName}
                          onPress={() => setSelectedNode({ ...selectedNode, category: catName, hexColor: catColor })}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 20,
                            backgroundColor: isSelected ? catColor : colors.surface,
                            borderWidth: 2,
                            borderColor: catColor,
                          }}
                        >
                          <Text style={{ 
                            fontSize: 13, 
                            fontWeight: '700', 
                            color: isSelected ? colors.accentText : catColor 
                          }}>
                            {catName}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Create New Category */}
                <View style={{ 
                  backgroundColor: colors.backgroundSecondary, 
                  padding: 16, 
                  borderRadius: 16, 
                  borderWidth: 1, 
                  borderColor: colors.border 
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
                    {t('projects.createNewCategory')}
                  </Text>

                  <TextInput
                    style={{
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 15,
                      fontWeight: '500',
                      color: colors.text,
                      marginBottom: 16,
                    }}
                    placeholder={t('projects.categoryNamePlaceholder')}
                    placeholderTextColor={colors.textQuaternary}
                    value={selectedNode.newCategoryName || ''}
                    onChangeText={(text) => setSelectedNode({ ...selectedNode, newCategoryName: text })}
                  />

                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textTertiary, marginBottom: 12 }}>
                    {t('common.color')}
                  </Text>

                  <ColorPicker
                    colors={getCurrentThemeColors()}
                    selectedColor={selectedNode.newCategoryColor || getCurrentThemeColors()[0]}
                    onSelect={(c) => setSelectedNode({ ...selectedNode, newCategoryColor: c })}
                    size={40}
                  />

                  <Pressable
                    onPress={() => {
                      if (selectedNode.newCategoryName?.trim()) {
                        const newCatName = selectedNode.newCategoryName.trim();
                        const newCatColor = selectedNode.newCategoryColor || getCurrentThemeColors()[0];
                        setCategories(prev => ({ ...prev, [newCatName]: newCatColor }));
                        setSelectedNode({ 
                          ...selectedNode, 
                          category: newCatName, 
                          hexColor: newCatColor,
                          newCategoryName: '',
                          newCategoryColor: undefined,
                        });
                      }
                    }}
                    style={{
                      backgroundColor: selectedNode.newCategoryName?.trim() ? colors.accent : colors.backgroundTertiary,
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: 'center',
                    }}
                    disabled={!selectedNode.newCategoryName?.trim()}
                  >
                    <Text style={{ 
                      fontSize: 15, 
                      fontWeight: '700', 
                      color: selectedNode.newCategoryName?.trim() ? colors.accentText : colors.textQuaternary 
                    }}>
                      {t('projects.createAndAssign')}
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>

              {/* Save Button */}
              <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
                <Pressable
                  onPress={() => {
                    setProjects(prev => prev.map(p => 
                      p.id === selectedNode.id ? selectedNode : p
                    ));
                    setModalOpen(false);
                  }}
                  style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 16,
                    borderRadius: 16,
                    alignItems: 'center',
                    shadowColor: colors.text,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primaryText }}>
                    {t('projects.saveChanges')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

// --- Projects View (Visualization Selection) ---

// Visualization types removed (unused)

// --- MAIN APP ---

const App: React.FC = () => {
  // Suppress known SafeAreaView deprecation warnings from third-party modules
  LogBox.ignoreLogs(["SafeAreaView has been deprecated"]);
  const { i18n } = useTranslation();
  const { colors, isDark } = useThemeColors();
  const [activeTab, setActiveTab] = useState<TabKey>('calendar');
  const [selectedColorScheme, setSelectedColorScheme] = useState('default');
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const getInitialLanguage = () => {
    try {
      const locales = Localization.getLocales();
      if (locales && locales.length > 0) {
        const primary = locales[0];
        const languageCode = (primary.languageCode || '').toLowerCase();
        if (languageCode.startsWith('zh')) return 'zh';
      }
    } catch {
      // ignore and fall back
    }
    return i18n?.language || 'en';
  };

  const [categories, setCategories] = useState<CategoryMap>({});

  // Initialize data persistence
  useAppData(projects, events, categories, setProjects, setEvents, setCategories, () => {
    // If categories are still empty after loading, use defaults
    setCategories(prev => Object.keys(prev).length === 0 ? getDefaultCategories(getInitialLanguage()) : prev);
  });

  

  let content: React.ReactNode;
  if (activeTab === 'calendar') {
    content = (
      <CalendarView
        events={events}
        setEvents={setEvents}
        projects={projects}
        setProjects={setProjects}
        categories={categories}
        setCategories={setCategories}
        selectedColorScheme={selectedColorScheme}
        colors={colors}
      />
    );
  } else if (activeTab === 'analytics') {
    content = <AnalyticsView projects={projects} events={events} categories={categories} selectedColorScheme={selectedColorScheme} setProjects={setProjects} setCategories={setCategories} colors={colors} />;
  } else {
    content = <ProjectsView projects={projects} events={events} categories={categories} setProjects={setProjects} setCategories={setCategories} setEvents={setEvents} selectedColorScheme={selectedColorScheme} setSelectedColorScheme={setSelectedColorScheme} onGoToCalendar={() => setActiveTab('calendar')} colors={colors} />;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.appContainer, { backgroundColor: colors.background }]}>
        

        <View style={{ flex: 1 }}>{content}</View>

        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} colors={colors} />
      </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default App;

// --- STYLES ---

const styles = StyleSheet.create({

    safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  appContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },

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
  iconButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
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
  calendarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  calendarDropdown: {
    position: 'absolute',
    top: 80,
    left: '50%',
    transform: [{ translateX: -140 }],
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
    paddingHorizontal: 8,
    paddingVertical: 12,
    zIndex: 1000,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarNavText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 8,
  },
  calendarMonth: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  calendarWeekdays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarWeekdayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    width: 36,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  calendarEmptyCell: {
    width: 32,
    height: 32,
    marginHorizontal: 2,
  },
  calendarDay: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    marginVertical: 2,
  },
  calendarDaySelected: {
    backgroundColor: '#000000',
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: '#000000',
  },
  calendarDayText: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  calendarEventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EF4444',
    position: 'absolute',
    bottom: 4,
  },
  tabBar: {
    flexDirection: 'row',
    height: 52,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 6,
    marginBottom: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  hourLabelContainer: {
    width: 48,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: 4,
    paddingTop: 0,
    marginTop: -6,
  },
  hourLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  hourTrack: {
    flex: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  eventCard: {
    position: 'absolute',
    left: 60,
    right: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  eventTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  eventTime: {
    fontSize: 10,
    color: '#6B7280',
  },
  nowLine: {
    position: 'absolute',
    left: 60,
    right: 0,
    borderTopWidth: 2,
    borderTopColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#EF4444',
    marginLeft: -3,
    marginTop: -3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    overflow: 'hidden',
  },
  bottomSheetLarge: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    overflow: 'hidden',
    // 原来是 maxHeight: '85%',
    height: '75%',             // 或者 '70%' / '80%'，看你喜欢多高
    flexDirection: 'column',
  },

  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cardHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    padding: 2,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: '#111827',
  },
  segmentText: {
    fontSize: 13,
    color: '#4B5563',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FCA5A5',
    gap: 8,
  },
  resetButtonText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  // Form-related styles moved to EventEditForm.tsx
  primaryButton: {
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    padding: 2,
    marginBottom: 16,
  },
  toggleItem: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
  },
  toggleItemActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleText: {
    fontSize: 13,
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  analyticsSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  pickerIconContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  pickerIconUp: {
    fontSize: 8,
    color: '#6B7280',
    lineHeight: 8,
    marginBottom: -1,
  },
  pickerIconDown: {
    fontSize: 8,
    color: '#6B7280',
    lineHeight: 8,
  },
  pickerButton: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 2,
  },
  pickerDropdown: {
    position: 'absolute',
    top: 38,
    left: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 200,
    maxHeight: 132,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    width: 200,
    maxHeight: 300,
    overflow: 'hidden',
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pickerCheck: {
    fontSize: 16,
    color: '#3B82F6',
    marginRight: 8,
    width: 20,
  },
  pickerItemText: {
    fontSize: 15,
    color: '#111827',
  },
  pickerItemSelected: {
    fontWeight: '600',
    color: '#3B82F6',
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  analyticsValueUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
  },
  barChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 6,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  barBackground: {
    flex: 1,
    width: '100%',
    backgroundColor: '#EEF2FF',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    marginTop: 8,
  },
  projectRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
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
  projectCategory: {
    fontSize: 11,
    color: '#6B7280',
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
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  linkRow: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  linkText: {
    fontSize: 13,
    color: '#4B5563',
  },
  helperText: {
    marginTop: 12,
    fontSize: 11,
    color: '#9CA3AF',
  },
  colorDotLarge: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotLargeActive: {
    borderColor: '#111827',
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  checkboxBoxActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#111827',
  },
  // --- Graph / Node Map ---
  graphCanvas: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  graphLinkLine: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: '#CBD5E1',
  },
  graphNodeWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  graphNodeOuter: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  graphNodeInner: {
    width: NODE_SIZE - 16,
    height: NODE_SIZE - 16,
    borderRadius: (NODE_SIZE - 16) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  graphNodeInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  graphCategoryBadge: {
    position: 'absolute',
    bottom: -10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  graphCategoryText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#374151',
  },
  graphNodeLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    alignSelf: 'center',
  },


});
