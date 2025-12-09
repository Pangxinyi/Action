import i18n from 'i18next';
import {
  Calendar as CalendarIcon,
  Network,
  PieChart,
  Plus,
  Sliders,
  Trash2,
  X
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Category as SkiaCategory, Project as SkiaProject } from '@components/ClusterViewAdvanced';
import { ClusterViewAdvanced } from '@components/ClusterViewAdvanced';
import '@constants/i18n'; // 初始化 i18n
import { useAppData } from '@hooks/useAppData';
import {
  Alert,
  Modal,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { clearAppData } from '../utils/storage';


// --- CONSTANTS ---

const APP_COLORS = ['#BFA2DB', '#D1D9F2', '#A8E6CF', '#E6B8B7', '#E6C8DC', '#EFD9CE'] as const;
const CATEGORY_COLORS = ['#BFA2DB', '#D1D9F2', '#A8E6CF', '#E6B8B7', '#E6C8DC', '#EFD9CE'] as const;

// Color Theme Palettes
const COLOR_THEMES = {
  default: ['#BFA2DB', '#D1D9F2', '#A8E6CF', '#E6B8B7', '#E6C8DC', '#EFD9CE'],
  matisse: ['#A63A2B', '#F9D8A7', '#C65C36', '#E0B458', '#7B3B2E', '#D68C45'],
  starry: ['#2C3E50', '#FFE082', '#4A90E2', '#5BC0EB', '#F6D186', '#3D348B'],
  sunflower: ['#E3B505', '#A1887F', '#E86C1A', '#A15C38', '#F0E6C2', '#FFC857'],
} as const;

const NODE_SIZE = 72;
const TIME_STEP_MIN = 1;

type CategoryMap = {
  [categoryName: string]: string; // category name -> color
};


type Project = {
  id: number;
  name: string;
  time: string;
  percent: number;
  hexColor: string;
  category: string | null;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  // Temporary state for modal editing
  newCategoryName?: string;
  newCategoryColor?: string;
};

type EventItem = {
  id: number;
  title: string;
  start: number; // minutes from 0:00
  duration: number; // minutes
  hexColor: string;
  details?: string; // tag/details from import
  category?: string; // category/type from import
  date: string; // YYYY-MM-DD format for date tracking
  projectId?: number; // link to project
};

type Link = {
  source: number;
  target: number;
};

const DEFAULT_PROJECTS: Project[] = [];

const DEFAULT_EVENTS: EventItem[] = [];

const DEFAULT_LINKS: Link[] = [];

const DEFAULT_CATEGORIES: CategoryMap = {};

// --- Shared small helpers ---

const formatMinutes = (total: number) => {
  const m = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

// --- UI Shared Components ---

type HeaderProps = {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

const Header: React.FC<HeaderProps> = ({ title, subtitle, leftIcon, rightIcon }) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
        <View>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {rightIcon && <View>{rightIcon}</View>}
    </View>
  );
};

type TabKey = 'calendar' | 'analytics' | 'projects';

const TabBar: React.FC<{ activeTab: TabKey; setActiveTab: (t: TabKey) => void }> = ({
  activeTab,
  setActiveTab,
}) => {
  const { t } = useTranslation();
  const mkTab = (key: TabKey, label: string, Icon: any) => {
    const active = activeTab === key;
    return (
      <Pressable style={styles.tabItem} onPress={() => setActiveTab(key)}>
        <Icon size={24} strokeWidth={active ? 2.5 : 2} color={active ? '#000' : '#9CA3AF'} />
        <Text style={[styles.tabLabel, { color: active ? '#000' : '#9CA3AF' }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.tabBar}>
      {mkTab('calendar', t('tabs.calendar'), CalendarIcon)}
      {mkTab('analytics', t('tabs.analytics'), PieChart)}
      {mkTab('projects', t('tabs.projects'), Network)}
    </View>
  );
};

// --- Calendar View (Today) ---

type DraftEvent = {
  id: number | null;
  start: number;          // 开始时间（分钟）
  end: number;            // 结束时间（分钟）
  selectedProjectId: number | null;
  isNewProject: boolean;
  newProjectName: string;
  details?: string; // tag/details for event
  category?: string; // category for event
  title?: string;
  date: string; // YYYY-MM-DD format
  projectId?: number; // link to project
  isNewCategory?: boolean; // for creating new category
  newCategoryName?: string;
  newCategoryColor?: string; // hex color for new category
};



type CalendarViewProps = {
  events: EventItem[];
  setEvents: React.Dispatch<React.SetStateAction<EventItem[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  categories: CategoryMap;
  setCategories: React.Dispatch<React.SetStateAction<CategoryMap>>;
  selectedColorScheme: string;
};

const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  setEvents,
  projects,
  setProjects,
  categories,
  setCategories,
  selectedColorScheme,
}) => {
  const { t } = useTranslation();
  const [editingField, setEditingField] = useState<'start' | 'end' | null>(null);
  const [tempTime, setTempTime] = useState('');
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftEvent, setDraftEvent] = useState<DraftEvent | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const timeListRef = useRef<ScrollView | null>(null);

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

  // 格式化完整日期（带星期、月份、日期）
  const formatFullDate = (date: Date): string => {
    const weekday = formatWeekday(date, false);
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                        'july', 'august', 'september', 'october', 'november', 'december'];
    const month = t(`months.${monthNames[date.getMonth()]}`);
    const day = date.getDate();
    return `${weekday}, ${month} ${day}`;
  };

  // 获取事件的当前颜色（基于项目或分类）
  const getEventColor = (evt: EventItem): string => {
    // 优先从关联的项目获取颜色
    if (evt.projectId) {
      const project = projects.find(p => p.id === evt.projectId);
      if (project) {
        return project.hexColor;
      }
    }
    // 其次从分类获取颜色
    if (evt.category && categories[evt.category]) {
      return categories[evt.category];
    }
    // 最后使用事件自己的颜色或默认颜色
    return evt.hexColor || '#9CA3AF';
  };

  // Date navigation functions
  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

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



  const timeOptions = useMemo(
    () =>
      Array.from(
        { length: (48 * 60) / TIME_STEP_MIN }, // 支持跨越午夜的事件（最多48小时）
        (_, i) => i * TIME_STEP_MIN,
      ),
    [],
  );
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
      details: evt.details || '',
      category: evt.category || '',
      title: evt.title,
      date: evt.date,
      isNewCategory: false,
      newCategoryName: '',
      newCategoryColor: APP_COLORS[0],
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

    // Handle new category
    if (draftEvent.isNewCategory && draftEvent.newCategoryName?.trim()) {
      const catName = draftEvent.newCategoryName.trim();
      const catColor = draftEvent.newCategoryColor || APP_COLORS[0];
      setCategories((prev) => ({ ...prev, [catName]: catColor }));
      selectedCategory = catName;
    }

    if (draftEvent.isNewProject && draftEvent.newProjectName.trim()) {
      const newProject: Project = {
        id: Date.now(),
        name: draftEvent.newProjectName,
        time: '0h 0m',
        percent: 0,
        hexColor: '#9CA3AF', // 默认灰色，后期跟着 category 变色
        category: null,
        x: 150,
        y: 150,
      };
      setProjects((prev) => [...prev, newProject]);
      title = newProject.name;
      // 颜色跟着 category 走，不跟着 project 走
    } else if (draftEvent.selectedProjectId) {
      const proj = projects.find((p) => p.id === draftEvent.selectedProjectId);
      if (proj) {
        title = proj.name;
        // 颜色跟着 category 走，不跟着 project 走
      }
    }

    // 颜色由 category 决定，如果选了 category 就用 category 的颜色
    if (selectedCategory && categories[selectedCategory]) {
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

  const handleReset = () => {
    Alert.alert('Reset all data?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setEvents([]);
          setProjects([]);
        },
      },
    ]);
  };


  const openTimeEditor = (field: 'start' | 'end') => {
    setEditingField(field);
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


  const parseTimeString = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // 支持 9:30 / 09:30 / 930(不建议但兼容) 这类
    const match = trimmed.match(/^(\d{1,2})(?::?(\d{2}))?$/);
    if (!match) return null;

    const h = parseInt(match[1], 10);
    const m = match[2] ? parseInt(match[2], 10) : 0;

    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  };

  const applyTempTime = () => {
    if (!draftEvent || !editingField) return;
    const minutes = parseTimeString(tempTime);
    if (minutes == null) {
      Alert.alert('Invalid time', 'Please enter time like 14:30');
      return;
    }

    if (editingField === 'start') {
      setDraftEvent({ ...draftEvent, start: minutes });  // 只改 start
    } else {
      setDraftEvent({ ...draftEvent, end: minutes });    // 只改 end
    }
    setEditingField(null);
  };



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
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} {...panResponderRef.current?.panHandlers}>
      <View style={styles.header}>
        <Pressable 
          style={styles.headerLeft} 
          onPress={() => setIsCalendarOpen(!isCalendarOpen)}
        >
          <View>
            <Text style={[styles.headerTitle, { fontWeight: 'bold' }]}>
              {formatMonthYear(selectedDate).split(' ')[0]}
            </Text>
            <Text style={styles.headerSubtitle}>
              {i18n.language === 'zh' 
                ? `${selectedDate.getDate()}日 ${formatWeekday(selectedDate, false)}`
                : `${String(selectedDate.getDate()).padStart(2, '0')} ${formatWeekday(selectedDate, false)}`
              }
            </Text>
          </View>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Pressable style={styles.todayButton} onPress={handleTodayClick}>
            <Text style={styles.todayButtonText}>{t('calendar.today')}</Text>
          </Pressable>
          <Pressable style={styles.fabSmall} onPress={handleAddNow}>
            <Plus size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Mini Calendar Modal - Backdrop and Dropdown */}
      {isCalendarOpen && (
        <>
          {/* Overlay backdrop - closes calendar when tapped */}
          <Pressable
            style={styles.calendarBackdrop}
            onPress={() => setIsCalendarOpen(false)}
          />
          
          {/* Calendar dropdown */}
          <View 
            style={styles.calendarDropdown}
          >
            <View style={styles.calendarHeader}>
              <Pressable onPress={() => {
                const prev = new Date(selectedDate);
                prev.setMonth(prev.getMonth() - 1);
                setSelectedDate(prev);
              }}>
                <Text style={styles.calendarNavText}>←</Text>
              </Pressable>
              <Text style={styles.calendarMonth}>
                {formatMonthYear(selectedDate)}
              </Text>
              <Pressable onPress={() => {
                const next = new Date(selectedDate);
                next.setMonth(next.getMonth() + 1);
                setSelectedDate(next);
              }}>
                <Text style={styles.calendarNavText}>→</Text>
              </Pressable>
            </View>

            {/* Weekday labels */}
            <View style={styles.calendarWeekdays}>
              {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((day) => (
                <Text key={day} style={styles.calendarWeekdayLabel}>{t(`calendar.${day}`)}</Text>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.calendarGrid}>
              {/* Empty cells for days before month starts */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.calendarEmptyCell} />
              ))}

              {/* Day cells */}
              {calendarDays.map((day) => {
                const isSelected =
                  selectedDate.getDate() === day &&
                  selectedDate.getMonth() === new Date().getMonth() &&
                  selectedDate.getFullYear() === new Date().getFullYear();
                const isToday = 
                  day === new Date().getDate() &&
                  selectedDate.getMonth() === new Date().getMonth() &&
                  selectedDate.getFullYear() === new Date().getFullYear();
                
                // Check if this day has events and find most common category
                const dayDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEvents = events.filter(evt => evt.date === dayDateStr);
                const hasEvents = dayEvents.length > 0;
                
                // Count categories to find the most common one
                let dotColor = '#EF4444'; // default red
                if (hasEvents) {
                  const categoryCount: { [key: string]: number } = {};
                  dayEvents.forEach(evt => {
                    const cat = evt.category || 'default';
                    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
                  });
                  
                  // Find most common category
                  const mostCommonCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0];
                  if (mostCommonCategory && mostCommonCategory !== 'default' && categories[mostCommonCategory]) {
                    dotColor = categories[mostCommonCategory];
                  }
                }

                return (
                  <Pressable
                    key={day}
                    style={[
                      styles.calendarDay,
                      isSelected && styles.calendarDaySelected,
                      isToday && styles.calendarDayToday,
                    ]}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(day);
                      setSelectedDate(newDate);
                      setIsCalendarOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        isSelected && styles.calendarDayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                    {hasEvents && (
                      <View style={[styles.calendarEventDot, { backgroundColor: dotColor }]} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </>
      )}

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ minHeight: 1440, paddingHorizontal: 12, paddingTop: 0 }}>
          {hours.map((hour) => (
            <View
              key={hour}
              style={[
                styles.hourRow,
                { height: 60 * pixelsPerMinute, borderColor: '#E5E7EB' },
              ]}
            >
              <View style={styles.hourLabelContainer}>
                <Text style={styles.hourLabel}>{`${hour}:00`}</Text>
              </View>
              <View style={styles.hourTrack}>
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
            const eventColor = getEventColor(evt);
            if (top < 0) return null;
            return (
              <Pressable
                key={evt.id}
                onPress={() => handleEventPress(evt)}
                style={[
                  styles.eventCard,
                  {
                    top,
                    height: Math.max(20, height),
                    backgroundColor: `${eventColor}4D`,
                    borderLeftColor: eventColor,
                  },
                ]}
              >
                {evt.details && (
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {evt.details}
                  </Text>
                )}
                <Text style={[styles.eventTime, { fontSize: 11, marginTop: 2 }]} numberOfLines={1}>
                  {evt.projectId ? projects.find(p => p.id === evt.projectId)?.name : evt.title}
                </Text>
                <Text style={styles.eventTime}>
                  {formatMinutes(evt.start)} - {formatMinutes(evt.start + evt.duration)}
                </Text>
              </Pressable>
            );
          })}

          <View style={[styles.nowLine, { top: nowTop }]}>
            <View style={styles.nowDot} />
          </View>
        </View>
      </ScrollView>

      {/* Event Modal */}
      <Modal visible={isModalOpen && !!draftEvent} transparent animationType="slide">
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => {
            setIsModalOpen(false);
            setDraftEvent(null);
            setEditingField(null);
          }}
        >
          <View 
            style={styles.bottomSheetLarge}
            onStartShouldSetResponder={() => true}
            onResponderRelease={() => {}}
          >
            {/* 顶部标题 + 删除 + 关闭 */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {draftEvent?.id ? t('calendar.editEvent') : t('calendar.addEvent')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {draftEvent?.id && (
                  <Pressable style={styles.iconDanger} onPress={handleDelete}>
                    <Trash2 size={18} color="#DC2626" />
                  </Pressable>
                )}
                <Pressable
                  style={styles.iconButton}
                  onPress={() => {
                    setIsModalOpen(false);
                    setDraftEvent(null);
                    setEditingField(null); 
                  }}
                >
                  <X size={20} color="#6B7280" />
                </Pressable>
              </View>
            </View>

            {draftEvent && (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                {/* ---- 时间大卡片 ---- */}
                {/* ---- 时间大卡片 ---- */}
                <View style={[styles.card, styles.timeCard]}>
                  <View style={styles.timeHeaderRow}>
                    <Text style={styles.timeHeaderLabel}>{t('calendar.start')}</Text>
                    <Text style={styles.timeHeaderLabel}>{t('calendar.end')}</Text>
                  </View>

                  <View style={styles.timeMainRow}>
                    {/* START */}
                    <Pressable
                      style={styles.timeBlock}
                      onPress={() => openTimeEditor('start')}
                    >
                      <Text style={styles.timeBig}>
                        {formatMinutes(draftEvent.start)}
                      </Text>
                    </Pressable>

                    <Text style={styles.timeArrow}>→</Text>

                    {/* END */}
                    <Pressable
                      style={styles.timeBlock}
                      onPress={() => openTimeEditor('end')}
                    >
                      <Text style={styles.timeBig}>
                        {formatMinutes(draftEvent.end)}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* 👉 下拉时间选择器，类似 Google Calendar 的选择列表 */}
                {editingField && (
                  <View style={styles.timePickerContainer}>
                    <Text style={styles.timePickerTitle}>
                      {editingField === 'start'
                        ? t('calendar.startTime')
                        : t('calendar.duration')}
                    </Text>
                    <ScrollView
                      key={editingField}
                      ref={timeListRef}
                      style={{ maxHeight: 260 }}
                      scrollEnabled={true}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ paddingVertical: 0 }}
                      onContentSizeChange={(width, height) => {
                        if (height === 0) return;
                        
                        // Only scroll if we have an active editing field
                        if (!editingField || !draftEvent) return;
                        
                        const current =
                          editingField === 'start' ? draftEvent.start : draftEvent.end;
                        const nearestIndex = Math.round(current / TIME_STEP_MIN);
                        const totalItems = (48 * 60) / TIME_STEP_MIN; // 支持跨越午夜的事件
                        const actualRowHeight = height / totalItems;
                        const scrollY = nearestIndex * actualRowHeight;

                        timeListRef.current?.scrollTo({ y: scrollY, animated: false });
                      }}
                    >
                      {timeOptions.map((m) => {
                        const current =
                          editingField === 'start'
                            ? draftEvent.start
                            : draftEvent.end;

                        const nearest =
                          Math.round(current / TIME_STEP_MIN) * TIME_STEP_MIN;
                        const active = m === nearest;

                        return (
                          <Pressable
                            key={`${editingField}-${m}`}
                            style={[
                              styles.timeOptionRow,
                              active && styles.timeOptionRowActive,
                            ]}
                            onPress={() => handleSelectTime(editingField, m)}
                          >
                            <Text
                              style={[
                                styles.timeOptionText,
                                active && styles.timeOptionTextActive,
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
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>{t('calendar.details')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('calendar.details')}
                    value={draftEvent.details || ''}
                    onChangeText={(txt) =>
                      setDraftEvent({ ...draftEvent, details: txt })
                    }
                    multiline
                  />
                </View>

                {/* ---- Project 选择 ---- */}
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>{t('calendar.project')}</Text>
                  <View style={styles.projectGrid}>
                    {projects.map((p) => {
                      const active =
                        !draftEvent.isNewProject &&
                        draftEvent.selectedProjectId === p.id;
                      return (
                        <Pressable
                          key={p.id}
                          style={[
                            styles.projectChip,
                            active && styles.projectChipActive,
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
                            style={styles.projectChipText}
                          >
                            {p.name}
                          </Text>
                        </Pressable>
                      );
                    })}

                    <Pressable
                      style={[
                        styles.newProjectChip,
                        draftEvent.isNewProject && styles.newProjectChipActive,
                      ]}
                      onPress={() =>
                        setDraftEvent({ ...draftEvent, isNewProject: true })
                      }
                    >
                      <Plus
                        size={14}
                        color={
                          draftEvent.isNewProject ? '#2563EB' : '#6B7280'
                        }
                      />
                      <Text
                        style={[
                          styles.newProjectText,
                          draftEvent.isNewProject && { color: '#2563EB' },
                        ]}
                      >
                        {t('projects.newProject')}
                      </Text>
                    </Pressable>
                  </View>

                  {draftEvent.isNewProject && (
                    <TextInput
                      style={styles.input}
                      placeholder={t('projects.projectName')}
                      value={draftEvent.newProjectName}
                      onChangeText={(txt) =>
                        setDraftEvent({ ...draftEvent, newProjectName: txt })
                      }
                    />
                  )}
                </View>

                {/* ---- Event Category ---- */}
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>{t('calendar.category')}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {Object.keys(categories).map((catName) => {
                      const catColor = categories[catName];
                      const isSelected = draftEvent.category === catName;
                      return (
                        <Pressable
                          key={catName}
                          style={[
                            {
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 8,
                              backgroundColor: `${catColor}20`,
                              borderColor: catColor,
                              borderWidth: 2,
                            },
                            isSelected && { backgroundColor: catColor, borderColor: catColor },
                          ]}
                          onPress={() => {
                            setDraftEvent({ 
                              ...draftEvent, 
                              category: catName,
                              isNewCategory: false,
                              newCategoryName: '',
                            });
                          }}
                        >
                          <Text
                            style={[
                              { color: catColor, fontWeight: '600', fontSize: 12 },
                              isSelected && { color: '#FFFFFF' },
                            ]}
                          >
                            {catName}
                          </Text>
                        </Pressable>
                      );
                    })}
                    
                    <Pressable
                      style={[
                        styles.newProjectChip,
                        draftEvent.isNewCategory && styles.newProjectChipActive,
                      ]}
                      onPress={() =>
                        setDraftEvent({ ...draftEvent, isNewCategory: true })
                      }
                    >
                      <Plus
                        size={14}
                        color={
                          draftEvent.isNewCategory ? '#2563EB' : '#6B7280'
                        }
                      />
                      <Text
                        style={[
                          styles.newProjectText,
                          draftEvent.isNewCategory && { color: '#2563EB' },
                        ]}
                      >
                        {t('projects.newCategory')}
                      </Text>
                    </Pressable>
                  </View>

                  {draftEvent.isNewCategory && (
                    <View style={{ marginTop: 12, gap: 8 }}>
                      <TextInput
                        style={styles.input}
                        placeholder={t('projects.categoryName')}
                        value={draftEvent.newCategoryName || ''}
                        onChangeText={(txt) =>
                          setDraftEvent({ ...draftEvent, newCategoryName: txt })
                        }
                      />
                      <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 4 }}>
                        {t('common.color')}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                        {themeColors.map((color) => (
                          <Pressable
                            key={color}
                            style={[
                              {
                                width: 36,
                                height: 36,
                                borderRadius: 8,
                                backgroundColor: color,
                              },
                              draftEvent.newCategoryColor === color && {
                                borderColor: '#000000',
                                borderWidth: 3,
                              },
                            ]}
                            onPress={() =>
                              setDraftEvent({ ...draftEvent, newCategoryColor: color })
                            }
                          />
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}

            {/* 底部主按钮 */}
            <Pressable style={styles.primaryButton} onPress={handleSave}>
              <Text style={styles.primaryButtonText}>
                {draftEvent?.id ? t('calendar.save') : t('calendar.addEvent')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

          </View>
  );
};

// --- Analytics View ---

type AnalyticsViewProps = {
  projects: Project[];
  events: EventItem[];
  selectedColorScheme: string;
};

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ projects, events, selectedColorScheme }) => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<'Week' | 'Month' | 'Year'>('Week');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showPicker, setShowPicker] = useState(false);
  
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

  // 获取当前主题的颜色数组
  const themeColors = COLOR_THEMES[selectedColorScheme as keyof typeof COLOR_THEMES] || COLOR_THEMES.default;

  // Get available months/years from events
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    events.forEach(evt => {
      years.add(new Date(evt.date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a); // Descending order
  }, [events]);

  const availableMonths = useMemo(() => {
    const months = new Set<number>();
    events.forEach(evt => {
      const date = new Date(evt.date);
      if (date.getFullYear() === selectedYear) {
        months.add(date.getMonth());
      }
    });
    return Array.from(months).sort((a, b) => b - a); // Descending order
  }, [events, selectedYear]);

  // Filter events based on timeRange
  const filteredEvents = (() => {
    if (timeRange === 'Week') {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
      return events.filter((evt) => {
        const eventDate = new Date(evt.date);
        return eventDate >= startDate && eventDate <= today;
      });
    } else if (timeRange === 'Month') {
      return events.filter((evt) => {
        const eventDate = new Date(evt.date);
        return eventDate.getMonth() === selectedMonth && eventDate.getFullYear() === selectedYear;
      });
    } else {
      return events.filter((evt) => {
        const eventDate = new Date(evt.date);
        return eventDate.getFullYear() === selectedYear;
      });
    }
  })();

  // Calculate chart data based on timeRange
  const chartData = (() => {
    if (timeRange === 'Week') {
      // Weekly data - 7 days (Mon-Sun)
      const data = [0, 0, 0, 0, 0, 0, 0];
      filteredEvents.forEach((evt) => {
        const eventDate = new Date(evt.date);
        const dayOfWeek = eventDate.getDay();
        const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        if (idx >= 0 && idx < 7) {
          data[idx] += evt.duration;
        }
      });
      return data;
    } else if (timeRange === 'Year') {
      // Yearly data - 12 months
      const data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      filteredEvents.forEach((evt) => {
        const eventDate = new Date(evt.date);
        const monthIndex = eventDate.getMonth();
        if (monthIndex >= 0 && monthIndex < 12) {
          data[monthIndex] += evt.duration;
        }
      });
      return data;
    } else {
      // Monthly data - group by date ranges (1-7, 8-14, 15-21, 22-28, 29-31)
      const data = [0, 0, 0, 0, 0]; // 5 groups
      filteredEvents.forEach((evt) => {
        const eventDate = new Date(evt.date);
        const day = eventDate.getDate();
        
        let groupIndex = -1;
        if (day >= 1 && day <= 7) groupIndex = 0;
        else if (day >= 8 && day <= 14) groupIndex = 1;
        else if (day >= 15 && day <= 21) groupIndex = 2;
        else if (day >= 22 && day <= 28) groupIndex = 3;
        else if (day >= 29) groupIndex = 4;
        
        if (groupIndex >= 0 && groupIndex < 5) {
          data[groupIndex] += evt.duration;
        }
      });
      return data;
    }
  })();

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

  const maxVal = Math.max(...chartData);

  // Calculate total focus time (based on filtered events)
  const totalMinutes = filteredEvents.reduce((sum, evt) => sum + evt.duration, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

  // Calculate time distribution by project (based on filtered events)
  const projectTimeMap = new Map<number, number>();
  filteredEvents.forEach((evt) => {
    if (evt.projectId) {
      projectTimeMap.set(evt.projectId, (projectTimeMap.get(evt.projectId) || 0) + evt.duration);
    }
  });

  const projectsWithTime = projects
    .map((p) => ({
      ...p,
      duration: projectTimeMap.get(p.id) || 0,
      percent: totalMinutes > 0 ? Math.round((projectTimeMap.get(p.id) || 0) / totalMinutes * 100) : 0,
    }))
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
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <Header title={t('analytics.title')} />

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={styles.toggleContainer}>
          {(['Week', 'Month', 'Year'] as const).map((range) => {
            const active = timeRange === range;
            return (
              <Pressable
                key={range}
                style={[styles.toggleItem, active && styles.toggleItemActive]}
                onPress={() => setTimeRange(range)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    active && styles.toggleTextActive,
                  ]}
                >
                  {t(`analytics.${range.toLowerCase()}` as any)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.analyticsCard}>
          <View style={styles.analyticsHeader}>
            <View style={{ position: 'relative' }}>
              <Text style={styles.analyticsTitle}>{t('analytics.totalTime')}</Text>
              {timeRange === 'Week' ? (
                <Text style={styles.analyticsSubtitle}>{getSubtitle()}</Text>
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
                        <View style={styles.pickerDropdown}>
                          <ScrollView style={{ maxHeight: 200 }}>
                            {timeRange === 'Month' 
                              ? availableMonths.map((month) => {
                                  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                                                      'july', 'august', 'september', 'october', 'november', 'december'];
                                  const isSelected = month === selectedMonth;
                                  return (
                                    <Pressable
                                      key={month}
                                      style={styles.pickerItem}
                                      onPress={() => {
                                        setSelectedMonth(month);
                                        setShowPicker(false);
                                      }}
                                    >
                                      <Text style={styles.pickerCheck}>{isSelected ? '✓' : ''}</Text>
                                      <Text style={[styles.pickerItemText, isSelected && styles.pickerItemSelected]}>
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
                                      style={styles.pickerItem}
                                      onPress={() => {
                                        setSelectedYear(year);
                                        setShowPicker(false);
                                      }}
                                    >
                                      <Text style={styles.pickerCheck}>{isSelected ? '✓' : ''}</Text>
                                      <Text style={[styles.pickerItemText, isSelected && styles.pickerItemSelected]}>
                                        {year}
                                      </Text>
                                    </Pressable>
                                  );
                                })
                            }
                          </ScrollView>
                        </View>
                      )}
                    </>
                  ) : (
                    <Text style={styles.analyticsSubtitle}>{getSubtitle()}</Text>
                  )}
                </>
              )}
            </View>
            <Text style={styles.analyticsValue}>
              {totalHours}<Text style={styles.analyticsValueUnit}>{t('common.hours')}</Text> {totalMins}
              <Text style={styles.analyticsValueUnit}>{t('common.minutes')}</Text>
            </Text>
          </View>
          <View style={styles.barChartRow}>
            {chartData.map((val, idx) => {
              const height = maxVal ? (val / maxVal) * 100 : 0;
              return (
                <View 
                  key={idx} 
                  style={[
                    styles.barWrapper,
                    timeRange === 'Month' && { alignItems: 'flex-start' }
                  ]}
                >
                  <View style={styles.barBackground}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${height}%`,
                          backgroundColor: themeColors[idx % themeColors.length],
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{chartLabels[idx]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('analytics.projects')}</Text>
        {projectsWithTime.map((p) => {
          const hours = Math.floor(p.duration / 60);
          const mins = p.duration % 60;
          return (
            <View key={p.id} style={styles.projectRow}>
              <View style={styles.projectRowHeader}>
                <View style={styles.projectRowLeft}>
                  <View
                    style={[
                      styles.projectDot,
                      { backgroundColor: p.hexColor },
                    ]}
                  />
                  <Text style={styles.projectRowName} numberOfLines={1} ellipsizeMode="tail">{p.name}</Text>
                </View>
                <Text style={styles.projectRowTime}>
                  {hours}{t('common.hours')} {mins}{t('common.minutes')}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${p.percent}%`, backgroundColor: p.hexColor },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

// --- GRAVITY CLUSTERS VIEW ---

type ProjectsViewProps = {
  projects: Project[];
  events: EventItem[];
  categories: CategoryMap;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setCategories: React.Dispatch<React.SetStateAction<CategoryMap>>;
  setEvents: React.Dispatch<React.SetStateAction<EventItem[]>>;
  selectedColorScheme: string;
  setSelectedColorScheme: React.Dispatch<React.SetStateAction<string>>;
};

const ProjectsView: React.FC<ProjectsViewProps> = ({ projects, events, categories, setProjects, setCategories, setEvents, selectedColorScheme, setSelectedColorScheme }) => {
  const { t, i18n } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('gravity');
  const [selectedNode, setSelectedNode] = useState<Project | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showColorTheme, setShowColorTheme] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const containerRef = useRef<View>(null);
  
  // 缩放状态 - Pinch to zoom
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(1);
  const initialDistance = useRef(0);
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3;

  // 获取当前主题的颜色数组
  const getCurrentThemeColors = () => {
    return COLOR_THEMES[selectedColorScheme as keyof typeof COLOR_THEMES] || COLOR_THEMES.default;
  };

  // 获取 category 颜色
  const getCategoryColor = (categoryName: string | null): string => {
    if (!categoryName) return '#9CA3AF'; // uncategorized gray
    return categories[categoryName] || '#9CA3AF';
  };

  // 物理模拟：聚类引力效果
  useEffect(() => {
    let animationFrameId: number;
    
    // 画布尺寸
    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 1200;
    
    const simulate = () => {
      setProjects((prevProjects) => {
        const nextProjects = prevProjects.map((p) => ({
          ...p,
          vx: (p.vx || 0) * 0.9,
          vy: (p.vy || 0) * 0.9,
        }));

        // 计算类别中心点 - 与渲染逻辑一致
        const catCenters: Record<string, { x: number; y: number }> = {};
        const categoryArray = Object.keys(categories);
        
        // 计算每个类别的项目数量
        const projectCountPerCategory: Record<string, number> = {};
        nextProjects.forEach(p => {
          const catName = p.category || 'uncategorized';
          projectCountPerCategory[catName] = (projectCountPerCategory[catName] || 0) + 1;
        });
        
        // 根据项目数量计算半径
        const calculateRadius = (count: number): number => {
          const baseRadius = 100;
          const minRadius = 80;
          const maxRadius = 200;
          const dynamicRadius = baseRadius + (count - 1) * 15;
          return Math.max(minRadius, Math.min(maxRadius, dynamicRadius));
        };
        
        // 如果没有任何 category，uncategorized 在中间
        if (categoryArray.length === 0) {
          catCenters['uncategorized'] = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
        } else {
          // 按项目数量排序
          const sortedCategories = [...categoryArray].sort((a, b) => {
            const countA = projectCountPerCategory[a] || 0;
            const countB = projectCountPerCategory[b] || 0;
            return countB - countA;
          });
          
          // 使用网格布局
          sortedCategories.forEach((catName, i) => {
            const cols = 2;
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = 200 + col * 350;
            const y = 200 + row * 350;
            catCenters[catName] = { x, y };
          });
          
          // Uncategorized 固定在画布底部
          catCenters['uncategorized'] = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 150 };
        }

        // 排斥力：防止节点重叠（包括下方标签空间）
        for (let i = 0; i < nextProjects.length; i++) {
          for (let j = i + 1; j < nextProjects.length; j++) {
            const p1 = nextProjects[i];
            const p2 = nextProjects[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq) || 1;

            const r1 = 30 + (p1.percent / 100) * 10;
            const r2 = 30 + (p2.percent / 100) * 10;
            // 增加间距以容纳下方标签（约30px高度）
            const minSpace = r1 + r2 + 50;

            if (dist < minSpace) {
              const force = ((minSpace - dist) / dist) * 0.6;
              const fx = dx * force;
              const fy = dy * force;
              p1.vx = (p1.vx || 0) + fx;
              p1.vy = (p1.vy || 0) + fy;
              p2.vx = (p2.vx || 0) - fx;
              p2.vy = (p2.vy || 0) - fy;
            }
          }
        }

        // 吸引力：将节点吸向类别中心
        nextProjects.forEach((p) => {
          const center = p.category ? catCenters[p.category] : catCenters['uncategorized'];
          if (!center) return;

          const dx = center.x - p.x;
          const dy = center.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          const force = dist * 0.008;
          p.vx = (p.vx || 0) + (dx / dist) * force;
          p.vy = (p.vy || 0) + (dy / dist) * force;
        });

        // 应用速度与边界检查
        return nextProjects.map((p) => {
          let newX = p.x + (p.vx || 0);
          let newY = p.y + (p.vy || 0);

          // 更新边界以匹配更大的画布
          if (newX < 30) {
            newX = 30;
            p.vx = (p.vx || 0) * -0.5;
          }
          if (newX > CANVAS_WIDTH - 30) {
            newX = CANVAS_WIDTH - 30;
            p.vx = (p.vx || 0) * -0.5;
          }
          if (newY < 30) {
            newY = 30;
            p.vy = (p.vy || 0) * -0.5;
          }
          if (newY > CANVAS_HEIGHT - 30) {
            newY = CANVAS_HEIGHT - 30;
            p.vy = (p.vy || 0) * -0.5;
          }

          return { ...p, x: newX, y: newY };
        });
      });

      animationFrameId = requestAnimationFrame(simulate);
    };

    animationFrameId = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [categories, setProjects]);

  const handleNodeClick = (project: Project) => {
    setSelectedNode({ ...project });
    setModalOpen(true);
  };

  const handleImportData = async () => {
    try {
      // 使用 DocumentPicker 选择多个JSON文件
      const DocumentPicker = require('expo-document-picker');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        multiple: true, // 支持多选
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const files = result.assets || [result];
      let totalImported = 0;
      let totalProjectsCreated = 0;
      const newCategories: CategoryMap = { ...categories };
      let colorIndex = Object.keys(newCategories).length;
      const allNewEvents: EventItem[] = [];
      const newProjects: Project[] = [...projects];
      const themeColors = getCurrentThemeColors();

      // 处理每个文件
      for (const file of files) {
        try {
          const response = await fetch(file.uri);
          const jsonText = await response.text();
          const data = JSON.parse(jsonText);

          if (!Array.isArray(data)) {
            Alert.alert('Error', `File ${file.name} must contain an array of events`);
            continue;
          }

          // 转换数据为 EventItem 格式
          data.forEach((item: any, index: number) => {
            // 只读取需要的字段：date, time, tag, type, project
            const date = item.date || new Date().toISOString().split('T')[0];
            const tag = item.tag || undefined;
            const type = item.type || null; // type 字段用作 category
            const project = item.project || null;
            const time = item.time || null;
            
            // 解析时间范围，获取开始时间和持续时间
            const timeData = time ? parseTimeRangeWithStart(time) : { start: 9 * 60, duration: 60 };
            const start = timeData.start;
            const duration = timeData.duration;
            
            // 只有 type 字段的内容才存储为 category
            const category = type;
            if (category && !newCategories[category]) {
              const color = themeColors[colorIndex % themeColors.length];
              newCategories[category] = color;
              colorIndex++;
            }

            // 处理 project 字段
            let projectId: number | undefined = undefined;
            if (project && project.length > 0) {
              const projectName = Array.isArray(project) ? project[0] : project;
              
              // 查找或创建 project，project 的 category 只能是 type 字段的值
              let existingProject = newProjects.find(p => p.name === projectName);
              if (!existingProject) {
                existingProject = {
                  id: Date.now() + newProjects.length + index * 1000 + Math.random() * 100,
                  name: projectName,
                  time: '0h 0m',
                  percent: 0,
                  hexColor: category && newCategories[category] ? newCategories[category] : '#9CA3AF',
                  category: category, // 只使用 type 字段作为 category
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

            // 获取颜色（只使用 type 字段的颜色）
            const color = category && newCategories[category] ? newCategories[category] : '#9CA3AF';

            // 创建 event
            const event: EventItem = {
              id: Date.now() + totalImported * 100 + Math.random() * 50,
              title: projectId ? newProjects.find(p => p.id === projectId)?.name || 'Event' : 'Event',
              start,
              duration,
              hexColor: color,
              details: tag, // tag 字段用作 details
              category: category, // 只使用 type 字段作为 category
              date: date,
              projectId,
            };

            allNewEvents.push(event);
            totalImported++;
          });

        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          Alert.alert('Error', `Failed to process ${file.name}: ${fileError}`);
        }
      }

      if (allNewEvents.length > 0) {
        // 更新状态
        console.log('About to import:', allNewEvents.length, 'events from', files.length, 'files');
        setEvents(prev => {
          const updated = [...prev, ...allNewEvents];
          console.log('Total events after import:', updated.length);
          return updated;
        });
        setCategories(newCategories);
        setProjects(newProjects);
        setShowSettings(false);
        
        Alert.alert('Success', `Imported ${totalImported} events from ${files.length} file(s), created ${totalProjectsCreated} new projects`);
      }

    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', `Failed to import files: ${error}`);
    }
  };

  // 解析时间范围，返回开始时间和持续时间
  const parseTimeRange = (timeStr: string): number => {
    try {
      const match = timeStr.match(/(\d+)(am|pm)-(\d+)(am|pm)/i);
      if (!match) return 60; // 默认1小时
      
      let start = parseInt(match[1]);
      let end = parseInt(match[3]);
      const startPeriod = match[2].toLowerCase();
      const endPeriod = match[4].toLowerCase();
      
      // 转换为24小时制
      if (startPeriod === 'pm' && start !== 12) start += 12;
      if (startPeriod === 'am' && start === 12) start = 0;
      if (endPeriod === 'pm' && end !== 12) end += 12;
      if (endPeriod === 'am' && end === 12) end = 0;
      
      let duration = end - start;
      if (duration < 0) duration += 24;
      
      return duration * 60;
    } catch {
      return 60;
    }
  };

  const parseTimeRangeWithStart = (timeStr: string): { start: number; duration: number } => {
    try {
      // 匹配格式: "9pm-10pm" 或 "4.30pm-5.30pm" 或 "11.30am-12.30pm"
      const match = timeStr.match(/(\d+)(?:\.(\d+))?(am|pm)-(\d+)(?:\.(\d+))?(am|pm)/i);
      if (!match) return { start: 9 * 60, duration: 60 }; // 默认9:00开始，1小时
      
      let startHour = parseInt(match[1]);
      const startMin = match[2] ? parseInt(match[2]) : 0;
      let endHour = parseInt(match[4]);
      const endMin = match[5] ? parseInt(match[5]) : 0;
      const startPeriod = match[3].toLowerCase();
      const endPeriod = match[6].toLowerCase();
      
      // 转换为24小时制
      if (startPeriod === 'pm' && startHour !== 12) startHour += 12;
      if (startPeriod === 'am' && startHour === 12) startHour = 0;
      if (endPeriod === 'pm' && endHour !== 12) endHour += 12;
      if (endPeriod === 'am' && endHour === 12) endHour = 0;
      
      const startMinutes = startHour * 60 + startMin;
      let endMinutes = endHour * 60 + endMin;
      
      // 处理跨午夜的情况
      if (endMinutes <= startMinutes) {
        endMinutes += 24 * 60;
      }
      
      const duration = endMinutes - startMinutes;
      
      return { start: startMinutes, duration };
    } catch (error) {
      console.error('Parse time error:', error, timeStr);
      return { start: 9 * 60, duration: 60 };
    }
  };

  const handleClearData = async () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all projects and events? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            // Clear state
            setProjects([]);
            setCategories({});
            setEvents([]);
            setShowSettings(false);
            
            // Explicitly clear AsyncStorage
            try {
              await clearAppData();
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              console.error('Failed to clear storage:', error);
              Alert.alert('Warning', 'Data cleared from app but storage may need manual reset');
            }
          }
        },
      ]
    );
  };

  const handleSelectStyle = (style: string) => {
    setSelectedStyle(style);
  };

  const handleSelectColorScheme = (scheme: string) => {
    setSelectedColorScheme(scheme);
    
    // 获取新主题的颜色数组
    const newColors = COLOR_THEMES[scheme as keyof typeof COLOR_THEMES] || COLOR_THEMES.default;
    
    // 更新所有分类的颜色
    const updatedCategories: CategoryMap = {};
    const categoryNames = Object.keys(categories).filter(name => name !== 'uncategorized');
    
    categoryNames.forEach((catName, index) => {
      updatedCategories[catName] = newColors[index % newColors.length];
    });
    
    // 确保 uncategorized 永远是灰色
    if (categories['uncategorized']) {
      updatedCategories['uncategorized'] = '#9CA3AF';
    }
    
    setCategories(updatedCategories);
    
    // 更新所有项目的颜色以匹配其分类的新颜色
    setProjects(prevProjects => 
      prevProjects.map(project => ({
        ...project,
        hexColor: project.category && updatedCategories[project.category] 
          ? updatedCategories[project.category] 
          : '#9CA3AF'
      }))
    );
  };

  if (showSettings) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000AA' }}>
        <Pressable style={{ flex: 1 }} onPress={() => setShowSettings(false)} />
        <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16, paddingBottom: 24, paddingHorizontal: 16, maxHeight: '80%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#000000' }}>{t('projects.settings')}</Text>
            <Pressable onPress={() => setShowSettings(false)}>
              <X size={24} color="#6B7280" />
            </Pressable>
          </View>
          
          <ScrollView contentContainerStyle={{ gap: 20 }}>
            {/* Color Theme */}
            <View>
              <Pressable 
                onPress={() => setShowColorTheme(!showColorTheme)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: showColorTheme ? 12 : 0 }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('projects.colorTheme')}</Text>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>{showColorTheme ? '▼' : '▶'}</Text>
              </Pressable>
              {showColorTheme && (
                <View style={{ gap: 8 }}>
                  {[
                    { id: 'default', title: t('themes.default') },
                    { id: 'matisse', title: t('themes.matisseRed') },
                    { id: 'starry', title: t('themes.starryNight') },
                    { id: 'sunflower', title: t('themes.sunflower') },
                  ].map((option) => (
                    <Pressable
                      key={option.id}
                      onPress={() => handleSelectColorScheme(option.id)}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, borderWidth: selectedColorScheme === option.id ? 2 : 1, borderColor: selectedColorScheme === option.id ? '#3B82F6' : '#E5E7EB', backgroundColor: selectedColorScheme === option.id ? '#F0F9FF' : '#FAFAFA' }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#1F2937', flex: 1 }}>{option.title}</Text>
                      {selectedColorScheme === option.id && (
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginLeft: 8 }}>
                          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>✓</Text>
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            

            {/* Data Management */}
            <View>
              <Pressable 
                onPress={() => setShowDataManagement(!showDataManagement)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: showDataManagement ? 12 : 0 }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('projects.dataManagement')}</Text>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>{showDataManagement ? '▼' : '▶'}</Text>
              </Pressable>
              {showDataManagement && (
                <View style={{ gap: 8 }}>
                  <Pressable
                    onPress={handleImportData}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: '#3B82F6' }}
                  >
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>{t('projects.importData')}</Text>
                    <Text style={{ fontSize: 20, color: '#FFFFFF' }}>↑</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleClearData}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: '#EF4444' }}
                  >
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>{t('projects.clearAllData')}</Text>
                    <Trash2 size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // 渲染类别背景标签
  const categoryArray = Object.entries(categories);
  const catCenters: Array<{ name: string; color: string; x: number; y: number; radius: number }> = [];
  
  // 画布尺寸 - 更大的画布
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 1200;
  
  // 计算每个类别的项目数量
  const projectCountPerCategory: Record<string, number> = {};
  projects.forEach(p => {
    const catName = p.category || 'uncategorized';
    projectCountPerCategory[catName] = (projectCountPerCategory[catName] || 0) + 1;
  });
  
  // 根据项目数量计算半径
  const calculateRadius = (count: number): number => {
    const baseRadius = 100;
    const minRadius = 80;
    const maxRadius = 200;
    // 每增加1个项目，半径增加15px
    const dynamicRadius = baseRadius + (count - 1) * 15;
    return Math.max(minRadius, Math.min(maxRadius, dynamicRadius));
  };
  
  // 检查两个圆是否重叠
  const isOverlapping = (
    x1: number, y1: number, r1: number, 
    x2: number, y2: number, r2: number,
    padding: number = 30
  ): boolean => {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (r1 + r2 + padding);
  };
  
  // 找到不重叠的位置
  const findNonOverlappingPosition = (
    radius: number, 
    existingCenters: Array<{ x: number; y: number; radius: number }>,
    startX: number,
    startY: number
  ): { x: number; y: number } => {
    let x = startX;
    let y = startY;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
      let hasOverlap = false;
      for (const center of existingCenters) {
        if (isOverlapping(x, y, radius, center.x, center.y, center.radius)) {
          hasOverlap = true;
          break;
        }
      }
      
      if (!hasOverlap) {
        return { x, y };
      }
      
      // 螺旋式向外寻找位置
      const angle = attempts * 0.5;
      const dist = 50 + attempts * 20;
      x = startX + Math.cos(angle) * dist;
      y = startY + Math.sin(angle) * dist;
      
      // 确保在画布范围内
      x = Math.max(radius + 20, Math.min(CANVAS_WIDTH - radius - 20, x));
      y = Math.max(radius + 20, Math.min(CANVAS_HEIGHT - radius - 20, y));
      
      attempts++;
    }
    
    return { x, y };
  };
  
  // 按项目数量排序（大的先布局）
  const sortedCategories = [...categoryArray].sort((a, b) => {
    const countA = projectCountPerCategory[a[0]] || 0;
    const countB = projectCountPerCategory[b[0]] || 0;
    return countB - countA;
  });
  
  // 布局类别圆圈 - 确保不重叠
  const placedCenters: Array<{ x: number; y: number; radius: number }> = [];
  
  sortedCategories.forEach(([name, color], i) => {
    const count = projectCountPerCategory[name] || 0;
    const radius = calculateRadius(count);
    
    // 初始位置使用网格布局
    const cols = 2;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const startX = 200 + col * 350;
    const startY = 200 + row * 350;
    
    const { x, y } = findNonOverlappingPosition(radius, placedCenters, startX, startY);
    
    catCenters.push({ name, color, x, y, radius });
    placedCenters.push({ x, y, radius });
  });

  // If Skia mode is selected, render the advanced Skia view
  if (selectedStyle === 'skia') {
    // Convert data to Skia format
    const skiaCategories: SkiaCategory[] = Object.entries(categories).map(([name, color], index) => {
      const catArray = Object.entries(categories);
      let centerX = 180;
      let centerY = 300;
      
      if (catArray.length === 1) {
        centerX = 180;
        centerY = 250;
      } else if (catArray.length === 2) {
        centerX = 100 + index * 160;
        centerY = 250;
      } else if (catArray.length > 2) {
        const angle = (index / catArray.length) * 2 * Math.PI - Math.PI / 2;
        centerX = 180 + Math.cos(angle) * 130;
        centerY = 280 + Math.sin(angle) * 130;
      }
      
      return {
        id: name,
        name,
        color,
        center: { x: centerX, y: centerY },
      };
    });

    const skiaProjects: SkiaProject[] = projects.map((p) => ({
      id: String(p.id),
      name: p.name,
      percent: p.percent,
      categoryId: p.category,
    }));

    const handleSkiaCategoryChange = (projectId: string, categoryId: string | null) => {
      setProjects((prev) =>
        prev.map((p) =>
          String(p.id) === projectId
            ? { ...p, category: categoryId, hexColor: categoryId ? categories[categoryId] : '#9CA3AF' }
            : p
        )
      );
    };

    return (
      <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#000000' }}>{t('tabs.projects')}</Text>
          <Pressable onPress={() => setShowSettings(true)} style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
            <Sliders size={18} color="#6B7280" />
          </Pressable>
        </View>
        <ClusterViewAdvanced
          categories={skiaCategories}
          projects={skiaProjects}
          onProjectCategoryChange={handleSkiaCategoryChange}
        />
      </View>
    );
  }

  // Default gravity clusters view
  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#000000' }}>{t('tabs.projects')}</Text>
        <Pressable onPress={() => setShowSettings(true)} style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
          <Sliders size={18} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ width: CANVAS_WIDTH * scale, minHeight: CANVAS_HEIGHT * scale }}
        horizontal={false}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={true}
        bounces={true}
        maximumZoomScale={MAX_SCALE}
        minimumZoomScale={MIN_SCALE}
        bouncesZoom={true}
      >
        <ScrollView 
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          bounces={true}
          contentContainerStyle={{ width: CANVAS_WIDTH * scale, minHeight: CANVAS_HEIGHT * scale }}
          maximumZoomScale={MAX_SCALE}
          minimumZoomScale={MIN_SCALE}
          bouncesZoom={true}
          onTouchStart={(e) => {
            if (e.nativeEvent.touches.length === 2) {
              const touch1 = e.nativeEvent.touches[0];
              const touch2 = e.nativeEvent.touches[1];
              const dx = touch1.pageX - touch2.pageX;
              const dy = touch1.pageY - touch2.pageY;
              initialDistance.current = Math.sqrt(dx * dx + dy * dy);
              scaleRef.current = scale;
            }
          }}
          onTouchMove={(e) => {
            if (e.nativeEvent.touches.length === 2 && initialDistance.current > 0) {
              const touch1 = e.nativeEvent.touches[0];
              const touch2 = e.nativeEvent.touches[1];
              const dx = touch1.pageX - touch2.pageX;
              const dy = touch1.pageY - touch2.pageY;
              const currentDistance = Math.sqrt(dx * dx + dy * dy);
              const newScale = scaleRef.current * (currentDistance / initialDistance.current);
              setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale)));
            }
          }}
          onTouchEnd={() => {
            initialDistance.current = 0;
          }}
        >
          <View 
            ref={containerRef} 
            style={{ 
              width: CANVAS_WIDTH, 
              height: CANVAS_HEIGHT, 
              position: 'relative',
              transform: [{ scale: scale }],
              transformOrigin: 'top left',
            }}
          >
            {/* 类别背景圆圈 - 动态大小 */}
            {catCenters.map((cat) => (
              <View
                key={cat.name}
                style={{
                  position: 'absolute',
                  left: cat.x - cat.radius,
                  top: cat.y - cat.radius,
                  width: cat.radius * 2,
                  height: cat.radius * 2,
                  borderRadius: cat.radius,
                  backgroundColor: cat.color,
                  opacity: 0.15,
                }}
          />
        ))}
        {catCenters.map((cat) => (
          <View
            key={`label-${cat.name}`}
            style={{
              position: 'absolute',
              left: cat.x - 60,
              top: cat.y - 10,
              width: 120,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: cat.color, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1 }}>
              {cat.name}
            </Text>
          </View>
        ))}

        {/* 项目节点 */}
        {projects.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#9CA3AF' }}>{t('projects.noProjectsYet')}</Text>
          </View>
        ) : (
          (() => {
            // 先计算所有项目的总时间
            const totalAllMinutes = projects.reduce((sum, p) => {
              const pEvents = events.filter(e => e.projectId === p.id);
              const pMinutes = pEvents.reduce((s, e) => s + e.duration, 0);
              return sum + pMinutes;
            }, 0);

            return projects.map((project) => {
              // 计算该项目的总投入时间（分钟）
              const projectEvents = events.filter(e => e.projectId === project.id);
              const totalMinutes = projectEvents.reduce((sum, e) => sum + e.duration, 0);
              
              // 根据注意力分配比例计算节点大小
              // 如果总时间为0，使用最小尺寸；否则按比例计算
              const baseSize = 32;
              const maxSize = 72;
              let size = baseSize;
              
              if (totalAllMinutes > 0) {
                const ratio = totalMinutes / totalAllMinutes; // 该项目占总时间的比例
                // 比例从0%到100%映射到32px-72px
                size = baseSize + (maxSize - baseSize) * ratio;
              }
              
              const color = getCategoryColor(project.category);

            return (
              <View
                key={project.id}
                style={{
                  position: 'absolute',
                  left: project.x - size / 2,
                  top: project.y - size / 2,
                }}
              >
                <Pressable onPress={() => handleNodeClick(project)} style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      backgroundColor: color,
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#000000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 8,
                      borderWidth: 2,
                      borderColor: '#FFFFFF',
                      overflow: 'hidden',
                    }}
                  >
                    {/* 液体填充效果 */}
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: `${project.percent}%`,
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Text 
                      style={{ 
                        fontSize: 10, 
                        fontWeight: '700', 
                        color: '#FFFFFF', 
                        zIndex: 10, 
                        textAlign: 'center', 
                        paddingHorizontal: 2,
                        width: size - 8,
                      }}
                      numberOfLines={2}
                      ellipsizeMode="clip"
                    >
                      {project.name}
                    </Text>
                  </View>
                  {/* 只在文字可能溢出时显示下方标签 */}
                  {project.name.length > 6 && (
                    <View
                      style={{
                        marginTop: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        backgroundColor: 'transparent',
                        borderRadius: 12,
                        maxWidth: 100,
                        alignSelf: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: '#6B7280',
                          textAlign: 'center',
                        }}
                      >
                        {project.name}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>
            );
          });
        })()
        )}
          </View>
        </ScrollView>
      </ScrollView>

      {/* 编辑弹窗 - iOS Style Bottom Sheet */}
      {modalOpen && selectedNode && (
        <Modal
          visible={modalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setModalOpen(false)}
        >
          <Pressable 
            style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' }}
            onPress={() => setModalOpen(false)}
          >
            <View 
              style={{ 
                backgroundColor: '#FFFFFF', 
                borderTopLeftRadius: 24, 
                borderTopRightRadius: 24, 
                paddingTop: 20,
                paddingBottom: 40,
                maxHeight: '80%',
              }}
            >
              {/* Header */}
              <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <View style={{ flex: 1, marginRight: 16 }}>
                    <TextInput
                      style={{ 
                        fontSize: 28, 
                        fontWeight: '700', 
                        color: '#000000',
                        padding: 0,
                        margin: 0,
                      }}
                      value={selectedNode.name}
                      onChangeText={(text) => setSelectedNode({ ...selectedNode, name: text })}
                      placeholder="Project Name"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <Pressable 
                    onPress={() => setModalOpen(false)}
                    style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: 16, 
                      backgroundColor: '#F3F4F6', 
                      justifyContent: 'center', 
                      alignItems: 'center' 
                    }}
                  >
                    <X size={18} color="#6B7280" />
                  </Pressable>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280' }}>Edit Details</Text>
              </View>

              <ScrollView 
                style={{ flexGrow: 1 }}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Section 1: Accumulation (Progress) */}
                <View style={{ marginBottom: 32 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#000000', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Accumulation
                    </Text>
                    <View style={{ 
                      paddingHorizontal: 12, 
                      paddingVertical: 4, 
                      borderRadius: 12, 
                      backgroundColor: selectedNode.percent >= 100 ? '#10B981' : '#F3F4F6' 
                    }}>
                      <Text style={{ 
                        fontSize: 18, 
                        fontWeight: '800', 
                        color: selectedNode.percent >= 100 ? '#FFFFFF' : '#000000' 
                      }}>
                        {Math.round(selectedNode.percent)}%
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar - Draggable */}
                  <View 
                    style={{ height: 48, justifyContent: 'center', marginBottom: 12 }}
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
                      backgroundColor: '#F3F4F6', 
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
                        backgroundColor: '#FFFFFF',
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
                </View>

                {/* Section 2: Category */}
                <View style={{ marginBottom: 32 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#000000', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
                    Category
                  </Text>
                  
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {/* Uncategorized Option */}
                    <Pressable
                      onPress={() => setSelectedNode({ ...selectedNode, category: null, hexColor: '#9CA3AF' })}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 20,
                        backgroundColor: !selectedNode.category ? '#1F2937' : '#F9FAFB',
                        borderWidth: 2,
                        borderColor: !selectedNode.category ? '#1F2937' : '#E5E7EB',
                      }}
                    >
                      <Text style={{ 
                        fontSize: 13, 
                        fontWeight: '700', 
                        color: !selectedNode.category ? '#FFFFFF' : '#6B7280' 
                      }}>
                        Uncategorized
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
                            backgroundColor: isSelected ? catColor : '#FFFFFF',
                            borderWidth: 2,
                            borderColor: catColor,
                          }}
                        >
                          <Text style={{ 
                            fontSize: 13, 
                            fontWeight: '700', 
                            color: isSelected ? '#FFFFFF' : catColor 
                          }}>
                            {catName}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Section 3: Create New Category */}
                <View style={{ 
                  backgroundColor: '#F9FAFB', 
                  padding: 16, 
                  borderRadius: 16, 
                  borderWidth: 1, 
                  borderColor: '#E5E7EB' 
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#000000', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
                    Create New Category
                  </Text>

                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 15,
                      fontWeight: '500',
                      color: '#000000',
                      marginBottom: 16,
                    }}
                    placeholder="Category name..."
                    placeholderTextColor="#9CA3AF"
                    value={selectedNode.newCategoryName || ''}
                    onChangeText={(text) => setSelectedNode({ ...selectedNode, newCategoryName: text })}
                  />

                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
                    Color
                  </Text>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                    {getCurrentThemeColors().map((color) => {
                      const isSelected = (selectedNode.newCategoryColor || getCurrentThemeColors()[0]) === color;
                      return (
                        <Pressable
                          key={color}
                          onPress={() => setSelectedNode({ ...selectedNode, newCategoryColor: color })}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: color,
                            borderWidth: isSelected ? 3 : 2,
                            borderColor: isSelected ? '#000000' : '#FFFFFF',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 3,
                          }}
                        />
                      );
                    })}
                  </View>

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
                      backgroundColor: selectedNode.newCategoryName?.trim() ? '#3B82F6' : '#E5E7EB',
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: 'center',
                    }}
                    disabled={!selectedNode.newCategoryName?.trim()}
                  >
                    <Text style={{ 
                      fontSize: 15, 
                      fontWeight: '700', 
                      color: selectedNode.newCategoryName?.trim() ? '#FFFFFF' : '#9CA3AF' 
                    }}>
                      Create & Assign
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
                    backgroundColor: '#000000',
                    paddingVertical: 16,
                    borderRadius: 16,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                    Save Changes
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

type VisualizationType = 'gravity' | 'orbit' | 'pods' | 'list';

interface VisualizationOption {
  id: VisualizationType;
  title: string;
  description: string;
  icon: string;
}

const VISUALIZATION_OPTIONS: VisualizationOption[] = [
  {
    id: 'gravity',
    title: 'Gravity Clusters',
    description: 'Organic nodes pulled by gravity',
    icon: 'gravity',
  },
  {
    id: 'orbit',
    title: 'Solar Orbits',
    description: 'Projects orbiting around you',
    icon: 'orbit',
  },
  {
    id: 'pods',
    title: 'Category Pods',
    description: 'Structured containers for clarity',
    icon: 'pods',
  },
  {
    id: 'list',
    title: 'Data List',
    description: 'Minimalist data table',
    icon: 'list',
  },
];

// --- MAIN APP ---

const App: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('calendar');
  const [selectedVisualization, setSelectedVisualization] = useState<VisualizationType | null>(null);
  const [selectedColorScheme, setSelectedColorScheme] = useState('default');
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<CategoryMap>({});

  // Initialize data persistence
  useAppData(projects, events, categories, setProjects, setEvents, setCategories);

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(today.getDate()).padStart(2, '0')}`;

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
      />
    );
  } else if (activeTab === 'analytics') {
    content = <AnalyticsView projects={projects} events={events} selectedColorScheme={selectedColorScheme} />;
  } else {
    content = <ProjectsView projects={projects} events={events} categories={categories} setProjects={setProjects} setCategories={setCategories} setEvents={setEvents} selectedColorScheme={selectedColorScheme} setSelectedColorScheme={setSelectedColorScheme} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.appContainer}>
        <View style={styles.topStrip}>
          <Text style={styles.topStripText}>{t('calendar.today')} · {dateStr}</Text>
        </View>

        <View style={{ flex: 1 }}>{content}</View>

        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </View>
    </SafeAreaView>
  );
};

export default App;

// --- STYLES ---

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111827',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topStrip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  topStripText: {
    fontSize: 12,
    color: '#6B7280',
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
    height: 64,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 0,
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
    padding: 16,
  },
  bottomSheetLarge: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
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
  sectionLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
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
  timeAdjustRowOuter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  timeAdjustGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  timeInput: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    minWidth: 80,
  },

  smallChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  smallChipText: {
    fontSize: 11,
    color: '#4B5563',
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
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  newProjectChipActive: {
    borderColor: '#2563EB',
    backgroundColor: '#DBEAFE',
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
    maxHeight: 200,
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
