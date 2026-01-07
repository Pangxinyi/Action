import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import Header from '../../components/Header';
import SegmentedControl from '../../components/SegmentedControl';
import type { AnalyticsViewProps, Project } from '../../types';
import { parseLocalDate } from '../../utils/date';
import AnalyticsModals from './components/AnalyticsModals';
import ProjectList from './components/ProjectList';
import StackedBarChart from './components/StackedBarChart';
import TimeRangeStrip from './components/TimeRangeStrip';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  projects,
  events,
  categories,
  selectedColorScheme: _selectedColorScheme,
  setProjects: _setProjects,
  setCategories: _setCategories,
  colors,
}) => {
  const { i18n } = useTranslation();
  // Provide a local `t` that delegates to `i18n.t` so translation calls remain safe
  const t = (key: string, opts?: any) => (i18n && typeof (i18n as any).t === 'function' ? (i18n as any).t(key, opts) : key);
  const [timeRange, setTimeRange] = useState<'Week' | 'Month' | 'Year'>('Week');
  const [selectedOffset, setSelectedOffset] = useState(0); // 0 = current, -1 previous, etc.
  const [distributionMode, setDistributionMode] = useState<'project' | 'category'>('category');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showUnassignedEvents, setShowUnassignedEvents] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryEvents, setShowCategoryEvents] = useState(false);

  const days = i18n.language === 'zh'
    ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    : [
        t('calendar.mon'),
        t('calendar.tue'),
        t('calendar.wed'),
        t('calendar.thu'),
        t('calendar.fri'),
        t('calendar.sat'),
        t('calendar.sun'),
      ];

  

  const filteredEvents = useMemo(() => {
    const now = new Date();
    if (timeRange === 'Week') {
      const dayOfWeek = now.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const monday = new Date(now);
      monday.setDate(now.getDate() - daysFromMonday + selectedOffset * 7);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      return events.filter((evt) => {
        const eventDate = parseLocalDate(evt.date);
        return eventDate >= monday && eventDate <= sunday;
      });
    }

    if (timeRange === 'Month') {
      const d = new Date(now);
      d.setMonth(d.getMonth() + selectedOffset);
      const year = d.getFullYear();
      const month = d.getMonth();
      return events.filter((evt) => {
        const eventDate = parseLocalDate(evt.date);
        return eventDate.getMonth() === month && eventDate.getFullYear() === year;
      });
    }

    // Year
    const year = new Date(now).getFullYear() + selectedOffset;
    return events.filter((evt) => {
      const eventDate = parseLocalDate(evt.date);
      return eventDate.getFullYear() === year;
    });
  }, [events, timeRange, selectedOffset]);

  const stackedChartData = useMemo(() => {
    const barCount = timeRange === 'Week' ? 7 : timeRange === 'Year' ? 12 : 5;
    const data: { category: string; duration: number; color: string }[][] = Array.from({ length: barCount }, () => []);
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

    periodCategoryMap.forEach((categoryMap, idx) => {
      categoryMap.forEach((duration, category) => {
        data[idx].push({ category, duration, color: categories[category] || '#9CA3AF' });
      });
      data[idx].sort((a, b) => b.duration - a.duration);
    });

    return data;
  }, [filteredEvents, timeRange, categories]);

  const chartTotals = stackedChartData.map(bar => bar.reduce((sum, segment) => sum + segment.duration, 0));
  const maxVal = Math.max(...chartTotals);

  const chartLabels = (() => {
    if (timeRange === 'Week') return days;
    if (timeRange === 'Year') {
      if (i18n.language === 'zh') return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
      return ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    }
    return ['1', '8', '15', '22', '29'];
  })();

  const earliestEventDate = useMemo(() => {
    if (!events || events.length === 0) return new Date();
    let minTs: number | null = null;
    events.forEach((evt) => {
      try {
        const d = parseLocalDate(evt.date);
        const t = d.getTime();
        if (minTs === null || t < minTs) minTs = t;
      } catch {
        // ignore parse errors
      }
    });
    return minTs ? new Date(minTs) : new Date();
  }, [events]);

  const showSwipeHint = useMemo(() => {
    if (!events || events.length === 0) return false;
    const now = new Date();
    if (timeRange === 'Week') {
      const dayOfWeek = now.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - daysFromMonday);
      monday.setHours(0, 0, 0, 0);
      return events.some((evt) => parseLocalDate(evt.date) < monday);
    }

    if (timeRange === 'Month') {
      const d = new Date(now);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      return events.some((evt) => parseLocalDate(evt.date) < startOfMonth);
    }

    // Year
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    startOfYear.setHours(0, 0, 0, 0);
    return events.some((evt) => parseLocalDate(evt.date) < startOfYear);
  }, [events, timeRange]);

  const totalMinutes = filteredEvents.reduce((sum, evt) => sum + evt.duration, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

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
      timeShare: totalMinutes > 0 ? Math.round(((projectTimeMap.get(p.id) || 0) / totalMinutes) * 100) : 0,
    }))
    .filter((p) => p.duration > 0)
    .sort((a, b) => b.duration - a.duration);

  const unassignedProject = unassignedProjectTime > 0 ? {
    id: -1,
    name: t('calendar.uncategorized'),
    hexColor: '#9CA3AF',
    duration: unassignedProjectTime,
    timeShare: totalMinutes > 0 ? Math.round((unassignedProjectTime / totalMinutes) * 100) : 0,
  } : null;

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
    .filter((c) => c.duration > 0)
    .sort((a, b) => b.duration - a.duration);

  

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary }}>
      <Header title={t('analytics.title')} colors={colors} />

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}
        contentContainerStyle={{ paddingBottom: 24 }}
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
            <View>
              <Text style={[styles.analyticsTitle, { color: colors.text }]}>{t('analytics.totalTime')}</Text>
              {showSwipeHint && (
                <Text style={[styles.analyticsSubtitle, { color: colors.textQuaternary }]}>{t('analytics.swipeHint')}</Text>
              )}
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.analyticsValue, { color: colors.text }]}>
                {totalHours}
                <Text style={[styles.analyticsValueUnit, { color: colors.textTertiary }]}>{t('common.hours')}</Text>
                {' '}{totalMins}
                <Text style={[styles.analyticsValueUnit, { color: colors.textTertiary }]}>{t('common.minutes')}</Text>
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 1, marginBottom: 10, width: '100%' }}>
            <TimeRangeStrip
              timeRange={timeRange}
              selectedOffset={selectedOffset}
              onSelectOffset={setSelectedOffset}
              minDate={earliestEventDate}
              colors={colors}
            />
          </View>

          <StackedBarChart
            stackedChartData={stackedChartData}
            chartTotals={chartTotals}
            maxVal={maxVal}
            chartLabels={chartLabels}
            timeRange={timeRange}
            colors={colors}
          />
        </View>

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

        <ProjectList
          distributionMode={distributionMode}
          projectsWithTime={projectsWithTime}
          categoriesWithTime={categoriesWithTime}
          unassignedProject={unassignedProject}
          colors={colors}
          t={t}
          onProjectPress={(p) => {
            const projectToEdit = projects.find((proj) => proj.id === p.id);
            if (!projectToEdit) return;
            setEditingProject(projectToEdit);
            setModalOpen(true);
          }}
          onUnassignedPress={() => setShowUnassignedEvents(true)}
          onCategoryPress={(name) => {
            setSelectedCategory(name);
            setShowCategoryEvents(true);
          }}
        />
      </ScrollView>

      <AnalyticsModals
        modalOpen={modalOpen}
        editingProject={editingProject}
        onCloseEditProject={() => setModalOpen(false)}
        showUnassignedEvents={showUnassignedEvents}
        onCloseUnassigned={() => setShowUnassignedEvents(false)}
        showCategoryEvents={showCategoryEvents}
        onCloseCategory={() => setShowCategoryEvents(false)}
        selectedCategory={selectedCategory}
        filteredEvents={filteredEvents}
        categories={categories}
        projects={projects}
        colors={colors}
        t={t}
        language={i18n.language}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: 8,
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
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  analyticsValueUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    marginTop: 8,
  },
});
