import {
  Calendar as CalendarIcon,
  Network,
  PieChart,
  Plus,
  Settings,
  Sun,
  Trash2,
  X,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';



// --- CONSTANTS ---

const APP_COLORS = ['#BFA2DB', '#D1D9F2', '#A8E6CF', '#E6B8B7'] as const;
const NODE_SIZE = 72;
const TIME_STEP_MIN = 5; // 下拉选项按 5 分钟一格
const TIME_ROW_HEIGHT = 44; // 每一行在下拉里的实际高度：8(top pad) + 14(font ~20) + 8(bottom pad) + 4(margin) = ~44px


type Project = {
  id: number;
  name: string;
  time: string;
  percent: number;
  hexColor: string;
  category: string | null;
  x: number;
  y: number;
};

type EventItem = {
  id: number;
  title: string;
  start: number; // minutes from 0:00
  duration: number; // minutes
  hexColor: string;
};

type Link = {
  source: number;
  target: number;
};

const DEFAULT_PROJECTS: Project[] = [
  { id: 101, name: 'Project Alpha', time: '12h 30m', percent: 45, hexColor: APP_COLORS[0], category: null, x: 80, y: 100 },
  { id: 102, name: 'Design System', time: '8h 15m', percent: 30, hexColor: APP_COLORS[1], category: null, x: 260, y: 120 },
  { id: 103, name: 'Marketing', time: '4h 45m', percent: 15, hexColor: APP_COLORS[2], category: null, x: 170, y: 240 },
  { id: 104, name: 'Admin', time: '2h 30m', percent: 10, hexColor: APP_COLORS[3], category: null, x: 170, y: 380 },
];

const DEFAULT_EVENTS: EventItem[] = [
  { id: 1, title: 'Deep Work: Project Alpha', start: 9 * 60, duration: 90, hexColor: APP_COLORS[0] },
  { id: 2, title: 'Team Sync', start: 11 * 60, duration: 45, hexColor: APP_COLORS[1] },
  { id: 3, title: 'Lunch Break', start: 12 * 60 + 30, duration: 60, hexColor: APP_COLORS[2] },
  { id: 4, title: 'Client Review', start: 14 * 60, duration: 60, hexColor: APP_COLORS[3] },
];

const DEFAULT_LINKS: Link[] = [
  { source: 101, target: 102 },
  { source: 102, target: 103 },
];

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
      {mkTab('calendar', 'Today', CalendarIcon)}
      {mkTab('analytics', 'Analytics', PieChart)}
      {mkTab('projects', 'Graph', Network)}
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
  title?: string;
};



type CalendarViewProps = {
  events: EventItem[];
  setEvents: React.Dispatch<React.SetStateAction<EventItem[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
};

const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  setEvents,
  projects,
  setProjects,
}) => {
  const [editingField, setEditingField] = useState<'start' | 'end' | null>(null);
  const [tempTime, setTempTime] = useState('');
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [draftEvent, setDraftEvent] = useState<DraftEvent | null>(null);
  const [startHour, setStartHour] = useState(6);
  const scrollRef = useRef<ScrollView | null>(null);
  const timeListRef = useRef<ScrollView | null>(null);

  // Scroll when field changes (START/END tap)
  useEffect(() => {
    // The scrolling will happen automatically in onContentSizeChange
  }, [editingField]);



  const timeOptions = useMemo(
    () =>
      Array.from(
        { length: (24 * 60) / TIME_STEP_MIN },
        (_, i) => i * TIME_STEP_MIN,
      ),
    [],
  );
  const pixelsPerMinute = 1;
  const hours = Array.from({ length: 24 - startHour }, (_, i) => i + startHour);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    const minutesSinceStart = now.getHours() * 60 + now.getMinutes() - startHour * 60;
    const scrollPos = minutesSinceStart * pixelsPerMinute;
    scrollRef.current.scrollTo({ y: Math.max(0, scrollPos), animated: false });
  }, [startHour]);

  const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const nowTop = (nowMinutes - startHour * 60) * pixelsPerMinute;
  const nowVisible = nowMinutes >= startHour * 60;

  const openNewEventAt = (totalMinutes: number) => {
    const firstProjectId = projects[0]?.id ?? null;
    setEditingField(null);
    setDraftEvent({
      id: null,
      start: totalMinutes,
      end: totalMinutes + 60,   // 默认一小时，之后可以改
      selectedProjectId: firstProjectId,
      isNewProject: false,
      newProjectName: '',
      title: '',
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
      title: evt.title,
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

    if (draftEvent.isNewProject && draftEvent.newProjectName.trim()) {
      const newColor = APP_COLORS[Math.floor(Math.random() * APP_COLORS.length)];
      const newProject: Project = {
        id: Date.now(),
        name: draftEvent.newProjectName,
        time: '0h 0m',
        percent: 0,
        hexColor: newColor,
        category: null,
        x: 150,
        y: 150,
      };
      setProjects((prev) => [...prev, newProject]);
      title = newProject.name;
      color = newColor;
    } else if (draftEvent.selectedProjectId) {
      const proj = projects.find((p) => p.id === draftEvent.selectedProjectId);
      if (proj) {
        title = proj.name;
        color = proj.hexColor;
      }
    }

    const rawDuration = draftEvent.end - draftEvent.start;
    const duration = Math.max(1, rawDuration); // 至少 1 分钟，防止 end <= start

    const payload: Omit<EventItem, 'id'> = {
      title,
      start: draftEvent.start,
      duration,
      hexColor: color,
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
          setIsSettingsOpen(false);
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




  const todayStr = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Header
        title="Today"
        subtitle={todayStr}
        leftIcon={
          <Pressable onPress={() => setIsSettingsOpen(true)} style={styles.iconButton}>
            <Settings size={20} color="#4B5563" />
          </Pressable>
        }
        rightIcon={
          <Pressable style={styles.fabSmall} onPress={handleAddNow}>
            <Plus size={18} color="#FFFFFF" />
          </Pressable>
        }
      />

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ minHeight: 1200, paddingHorizontal: 12, paddingTop: 0 }}>
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
                  style={styles.slotHalf}
                  onPress={() => handleSlotPress(hour, 0)}
                />
                <Pressable
                  style={[styles.slotHalf, { top: '50%' }]}
                  onPress={() => handleSlotPress(hour, 30)}
                />
              </View>
            </View>
          ))}

          {events.map((evt) => {
            const top = (evt.start - startHour * 60) * pixelsPerMinute;
            const height = evt.duration * pixelsPerMinute;
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
                    backgroundColor: `${evt.hexColor}4D`,
                    borderLeftColor: evt.hexColor,
                  },
                ]}
              >
                <Text style={styles.eventTitle}>{evt.title}</Text>
                <Text style={styles.eventTime}>
                  {formatMinutes(evt.start)} - {formatMinutes(evt.start + evt.duration)}
                </Text>
              </Pressable>
            );
          })}

          {nowVisible && (
            <View style={[styles.nowLine, { top: nowTop }]}>
              <View style={styles.nowDot} />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <Modal visible={isSettingsOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>App Settings</Text>
              <Pressable
                style={styles.iconButton}
                onPress={() => setIsSettingsOpen(false)}
              >
                <X size={20} color="#6B7280" />
              </Pressable>
            </View>

            <View style={{ gap: 16, marginBottom: 16 }}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Sun size={20} color="#F97316" />
                  <Text style={styles.cardHeaderText}>Start of Day</Text>
                </View>
                <View style={styles.segmentContainer}>
                  {[0, 6, 8, 9].map((h) => {
                    const active = startHour === h;
                    return (
                      <Pressable
                        key={h}
                        style={[
                          styles.segmentItem,
                          active && styles.segmentItemActive,
                        ]}
                        onPress={() => setStartHour(h)}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            active && styles.segmentTextActive,
                          ]}
                        >
                          {h}:00
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Pressable style={styles.resetButton} onPress={handleReset}>
                <Trash2 size={18} color="#DC2626" />
                <Text style={styles.resetButtonText}>Reset All Data</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Event Modal */}
      <Modal visible={isModalOpen && !!draftEvent} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetLarge}>
            {/* 顶部标题 + 删除 + 关闭 */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {draftEvent?.id ? 'Edit Event' : 'Add Event'}
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
                    <Text style={styles.timeHeaderLabel}>START</Text>
                    <Text style={styles.timeHeaderLabel}>END</Text>
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
                        ? 'Select start time'
                        : 'Select end time'}
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
                        const totalItems = (24 * 60) / TIME_STEP_MIN;
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



                {/* ---- Project 选择 ---- */}
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>Project</Text>
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
                        New Project
                      </Text>
                    </Pressable>
                  </View>

                  {draftEvent.isNewProject && (
                    <TextInput
                      style={styles.input}
                      placeholder="Enter Project Name"
                      value={draftEvent.newProjectName}
                      onChangeText={(txt) =>
                        setDraftEvent({ ...draftEvent, newProjectName: txt })
                      }
                    />
                  )}
                </View>
              </ScrollView>
            )}

            {/* 底部主按钮 */}
            <Pressable style={styles.primaryButton} onPress={handleSave}>
              <Text style={styles.primaryButtonText}>
                {draftEvent?.id ? 'Update Event' : 'Add Event'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// --- Analytics View ---

const AnalyticsView: React.FC<{ projects: Project[] }> = ({ projects }) => {
  const [timeRange, setTimeRange] = useState<'Week' | 'Month'>('Week');
  const weeklyData = [3, 5, 2, 6, 4, 1, 0];
  const maxVal = Math.max(...weeklyData);
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <Header title="Analytics" subtitle="Track your focus" />

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={styles.toggleContainer}>
          {(['Week', 'Month'] as const).map((range) => {
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
                  Last {range}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.analyticsCard}>
          <View style={styles.analyticsHeader}>
            <Text style={styles.analyticsTitle}>Total Focus</Text>
            <Text style={styles.analyticsValue}>
              27<Text style={styles.analyticsValueUnit}>h</Text> 14
              <Text style={styles.analyticsValueUnit}>m</Text>
            </Text>
          </View>
          <View style={styles.barChartRow}>
            {weeklyData.map((val, idx) => {
              const height = maxVal ? (val / maxVal) * 100 : 0;
              return (
                <View key={idx} style={styles.barWrapper}>
                  <View style={styles.barBackground}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${height}%`,
                          backgroundColor: APP_COLORS[idx % APP_COLORS.length],
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{days[idx]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Time Distribution</Text>
        {projects.map((p) => (
          <View key={p.id} style={styles.projectRow}>
            <View style={styles.projectRowHeader}>
              <View style={styles.projectRowLeft}>
                <View
                  style={[
                    styles.projectDot,
                    { backgroundColor: p.hexColor },
                  ]}
                />
                <Text style={styles.projectRowName}>{p.name}</Text>
              </View>
              <Text style={styles.projectRowTime}>{p.time}</Text>
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
        ))}
      </ScrollView>
    </View>
  );
};

// --- Project Graph View ---

type ProjectGraphViewProps = {
  projects: Project[];
  setProjects: (fn: (prev: Project[]) => Project[] | Project[]) => void;
  links: Link[];
  setLinks: (fn: (prev: Link[]) => Link[] | Link[]) => void;
};

const ProjectGraphView: React.FC<ProjectGraphViewProps> = ({
  projects,
  setProjects,
  links,
  setLinks,
}) => {
  const [selected, setSelected] = useState<Project | null>(null);
  const [graphModalVisible, setGraphModalVisible] = useState(false);

  // 拖拽状态（以“中心坐标”为基准）
  const dragStateRef = useRef<{
    id: number;
    startX: number;
    startY: number;
    touchX: number;
    touchY: number;
  } | null>(null);

  const openEdit = (p: Project) => {
    setSelected(p);
    setGraphModalVisible(true);
  };

  const closeEdit = () => {
    setGraphModalVisible(false);
    setSelected(null);
  };

  const handleSave = () => {
    if (!selected) return;
    setProjects((prev) => prev.map((p) => (p.id === selected.id ? selected : p)));
    closeEdit();
  };

  const isConnected = (targetId: number) => {
    if (!selected) return false;
    return links.some(
      (l) =>
        (l.source === selected.id && l.target === targetId) ||
        (l.source === targetId && l.target === selected.id),
    );
  };

  const toggleConnection = (targetId: number) => {
    if (!selected) return;
    setLinks((prev) => {
      const exists = prev.some(
        (l) =>
          (l.source === selected.id && l.target === targetId) ||
          (l.source === targetId && l.target === selected.id),
      );
      if (exists) {
        return prev.filter(
          (l) =>
            !(
              (l.source === selected.id && l.target === targetId) ||
              (l.source === targetId && l.target === selected.id)
            ),
        );
      }
      return [...prev, { source: selected.id, target: targetId }];
    });
  };

  // ----- 拖拽相关 -----

  const handleDragStart = (project: Project, e: any) => {
    const { pageX, pageY } = e.nativeEvent;
    dragStateRef.current = {
      id: project.id,
      startX: project.x,
      startY: project.y,
      touchX: pageX,
      touchY: pageY,
    };
  };

  const handleDragMove = (project: Project, e: any) => {
    const state = dragStateRef.current;
    if (!state || state.id !== project.id) return;

    const { pageX, pageY } = e.nativeEvent;
    const dx = pageX - state.touchX;
    const dy = pageY - state.touchY;

    const newX = state.startX + dx;
    const newY = state.startY + dy;

    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, x: newX, y: newY } : p)),
    );
  };

  const handleDragEnd = (project: Project, e: any) => {
    const state = dragStateRef.current;
    if (!state || state.id !== project.id) {
      dragStateRef.current = null;
      return;
    }

    const { pageX, pageY } = e.nativeEvent;
    const dx = pageX - state.touchX;
    const dy = pageY - state.touchY;
    const distSq = dx * dx + dy * dy;

    dragStateRef.current = null;

    // 移动距离很小，当作“点一下”，打开编辑弹窗
    if (distSq < 25) {
      openEdit(project);
    }
  };

  // ----- 渲染 -----

  const NODE_RADIUS = NODE_SIZE / 2;

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <Header title="Project Map" subtitle="Drag to move · Tap to edit" />

      {/* 图节点 + 连线画布 */}
      <View style={styles.graphCanvas}>
        {/* 连线：按圆心算，并剪掉两端半径，让线接到圆边上 */}
        {links.map((l, idx) => {
          const s = projects.find((p) => p.id === l.source);
          const t = projects.find((p) => p.id === l.target);
          if (!s || !t) return null;

          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          // 如果两个点太近就不画线，避免 length 变负
          if (dist < NODE_RADIUS * 1.2) return null;

          const ux = dx / dist;
          const uy = dy / dist;

          const startX = s.x + ux * NODE_RADIUS;
          const startY = s.y + uy * NODE_RADIUS;
          const endX = t.x - ux * NODE_RADIUS;
          const endY = t.y - uy * NODE_RADIUS;

          const segDx = endX - startX;
          const segDy = endY - startY;
          const length = Math.sqrt(segDx * segDx + segDy * segDy);
          const angle = (Math.atan2(segDy, segDx) * 180) / Math.PI;

          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;

          return (
            <View
              key={idx}
              style={[
                styles.graphLinkLine,
                {
                  width: length,
                  transform: [
                    { translateX: midX - length / 2 },
                    { translateY: midY },
                    { rotateZ: `${angle}deg` },
                  ],
                },
              ]}
            />
          );
        })}

        {/* 节点：绝对定位，支持拖拽 + 点击 */}
        {projects.map((p) => (
          <View
            key={p.id}
            style={[
              styles.graphNodeWrapper,
              {
                left: p.x - NODE_RADIUS,
                top: p.y - NODE_RADIUS,
              },
            ]}
            onStartShouldSetResponder={() => true}
            onResponderGrant={(e) => handleDragStart(p, e)}
            onResponderMove={(e) => handleDragMove(p, e)}
            onResponderRelease={(e) => handleDragEnd(p, e)}
            onResponderTerminationRequest={() => false}
          >
            <View
              style={[
                styles.graphNodeOuter,
                { borderColor: `${p.hexColor}40` },
              ]}
            >
              <View
                style={[
                  styles.graphNodeInner,
                  { backgroundColor: p.hexColor },
                ]}
              >
                <Text style={styles.graphNodeInitial}>
                  {p.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              {p.category ? (
                <View
                  style={[
                    styles.graphCategoryBadge,
                    { backgroundColor: `${p.hexColor}1A` },
                  ]}
                >
                  <Text style={styles.graphCategoryText} numberOfLines={1}>
                    {p.category}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.graphNodeLabel} numberOfLines={1}>
              {p.name}
            </Text>
          </View>
        ))}
      </View>

      {/* 编辑 Modal（你原来的那一段几乎不动，只是用 selected / toggleConnection） */}
      <Modal visible={graphModalVisible && !!selected} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetLarge}>
            {/* 头部 */}
            <View className="sheetHeader" style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {selected ? selected.name : 'Edit Project'}
              </Text>
              <Pressable style={styles.iconButton} onPress={closeEdit}>
                <X size={20} color="#6B7280" />
              </Pressable>
            </View>

            {selected && (
              <ScrollView
                style={{ marginTop: 8 }}
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                {/* Name */}
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>Name</Text>
                  <TextInput
                    style={styles.input}
                    value={selected.name}
                    onChangeText={(txt) =>
                      setSelected((prev) => (prev ? { ...prev, name: txt } : prev))
                    }
                  />
                </View>

                {/* Category */}
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>Category</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter category..."
                    value={selected.category ?? ''}
                    onChangeText={(txt) =>
                      setSelected((prev) =>
                        prev ? { ...prev, category: txt || null } : prev,
                      )
                    }
                  />
                </View>

                {/* Color */}
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>Color</Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                    {APP_COLORS.map((color) => {
                      const active = selected.hexColor === color;
                      return (
                        <Pressable
                          key={color}
                          style={[
                            styles.colorDotLarge,
                            { backgroundColor: color },
                            active && styles.colorDotLargeActive,
                          ]}
                          onPress={() =>
                            setSelected((prev) =>
                              prev ? { ...prev, hexColor: color } : prev,
                            )
                          }
                        />
                      );
                    })}
                  </View>
                </View>

                {/* Connections */}
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>Connections</Text>
                  {projects
                    .filter((p) => p.id !== selected.id)
                    .map((p) => {
                      const connected = isConnected(p.id);
                      return (
                        <Pressable
                          key={p.id}
                          style={styles.connectionRow}
                          onPress={() => toggleConnection(p.id)}
                        >
                          <View
                            style={[
                              styles.checkboxBox,
                              connected && styles.checkboxBoxActive,
                            ]}
                          />
                          <Text style={styles.checkboxLabel}>{p.name}</Text>
                        </Pressable>
                      );
                    })}

                  {projects.length <= 1 && (
                    <Text style={styles.emptyText}>
                      Create more projects to connect them.
                    </Text>
                  )}
                </View>
              </ScrollView>
            )}

            <Pressable style={styles.primaryButton} onPress={handleSave}>
              <Text style={styles.primaryButtonText}>Save Changes</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};



// --- MAIN APP ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('calendar');
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [events, setEvents] = useState<EventItem[]>(DEFAULT_EVENTS);
  const [links, setLinks] = useState<Link[]>(DEFAULT_LINKS);

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
      />
    );
  } else if (activeTab === 'analytics') {
    content = <AnalyticsView projects={projects} />;
  } else {
    content = (
      <ProjectGraphView
        projects={projects}
        setProjects={setProjects}
        links={links}
        setLinks={setLinks}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.appContainer}>
        <View style={styles.topStrip}>
          <Text style={styles.topStripText}>Today · {dateStr}</Text>
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
  tabBar: {
    flexDirection: 'row',
    height: 64,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-around',
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
  slotHalf: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: '50%',
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
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
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
  },
  projectRowName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  projectRowTime: {
    fontSize: 12,
    color: '#4B5563',
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
    graphScreen: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
  },


});
