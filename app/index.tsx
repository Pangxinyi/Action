import {
  PackageOpen
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import '@constants/i18n'; // 初始化 i18n
import { useAppData } from '@hooks/useAppData';
import { useThemeColors } from '@hooks/useThemeColors';
import * as Localization from 'expo-localization';
import {
  LogBox,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../src/components/EmptyState';
import Header from '../src/components/Header';
import { ModalHeader } from '../src/components/ModalHeader';
import SegmentedControl from '../src/components/SegmentedControl';
import TabBar from '../src/components/TabBar';
import { COLOR_THEMES } from '../src/constants/theme';
import { CalendarView } from '../src/features/calendar';
import { ProjectsView, projectStyles } from '../src/features/projects';
import type {
  AnalyticsViewProps,
  CategoryMap,
  EventItem,
  Project,
  TabKey
} from '../src/types';
import { parseLocalDate } from '../src/utils/date';


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
              style={[projectStyles.projectRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                setEditingProject(p);
                setModalOpen(true);
              }}
            >
              <View style={projectStyles.projectRowHeader}>
                <View style={projectStyles.projectRowLeft}>
                  <View
                    style={[
                      projectStyles.projectDot,
                      { backgroundColor: p.hexColor },
                    ]}
                  />
                  <Text style={[projectStyles.projectRowName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{p.name}</Text>
                </View>
                <Text style={[projectStyles.projectRowTime, { color: colors.textSecondary }]}>
                  {hours}{t('common.hours')} {mins}{t('common.minutes')}
                </Text>
              </View>
              <View style={[projectStyles.progressTrack, { backgroundColor: colors.backgroundTertiary }]}>
                <View
                  style={[
                    projectStyles.progressFill,
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
              style={[projectStyles.projectRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowUnassignedEvents(true)}
            >
              <View style={projectStyles.projectRowHeader}>
                <View style={projectStyles.projectRowLeft}>
                  <View
                    style={[
                      projectStyles.projectDot,
                      { backgroundColor: unassignedProject.hexColor },
                    ]}
                  />
                  <Text style={[projectStyles.projectRowName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{unassignedProject.name}</Text>
                </View>
                <Text style={[projectStyles.projectRowTime, { color: colors.textSecondary }]}>
                  {hours}{t('common.hours')} {mins}{t('common.minutes')}
                </Text>
              </View>
              <View style={[projectStyles.progressTrack, { backgroundColor: colors.backgroundTertiary }]}>
                <View
                  style={[
                    projectStyles.progressFill,
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
              style={[projectStyles.projectRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                setSelectedCategory(c.name);
                setShowCategoryEvents(true);
              }}
            >
              <View style={projectStyles.projectRowHeader}>
                <View style={projectStyles.projectRowLeft}>
                  <View
                    style={[
                      projectStyles.projectDot,
                      { backgroundColor: c.color },
                    ]}
                  />
                  <Text style={[projectStyles.projectRowName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                    {c.name === 'uncategorized' ? t('calendar.uncategorized') : c.name}
                  </Text>
                </View>
                <Text style={[projectStyles.projectRowTime, { color: colors.textSecondary }]}>
                  {hours}{t('common.hours')} {mins}{t('common.minutes')}
                </Text>
              </View>
              <View style={[projectStyles.progressTrack, { backgroundColor: colors.backgroundTertiary }]}>
                <View
                  style={[
                    projectStyles.progressFill,
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


});
