import { Archive, Settings, X } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ColorPicker } from '../../components/ColorPicker';
import { EmptyState } from '../../components/EmptyState';
import { ModalHeader } from '../../components/ModalHeader';
import SegmentedControl from '../../components/SegmentedControl';
import { COLOR_THEMES } from '../../constants/theme';
import type { CategoryMap, Project, ProjectDataPoint, ProjectsViewProps, TimeRangeType } from '../../types';
import { getContrastColor } from '../../utils/color';
import { parseLocalDate } from '../../utils/date';
import { SettingsModal } from './components/SettingsModal';

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  events,
  categories,
  setProjects,
  setCategories,
  setEvents,
  selectedColorScheme,
  setSelectedColorScheme,
  onGoToCalendar,
  colors,
}) => {
  const { t } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRangeType>('30d');
  const [selectedProject, setSelectedProject] = useState<ProjectDataPoint | null>(null);
  const [selectedNode, setSelectedNode] = useState<Project | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const initialWidth = Dimensions.get('window').width - 24;
  const [chartWidth, setChartWidth] = useState(initialWidth);

  const CHART_PADDING = { top: 40, right: 20, bottom: 60, left: 28 };
  const CHART_HEIGHT = 340;
  const chartInnerWidth = chartWidth - CHART_PADDING.left - CHART_PADDING.right;
  const chartInnerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const SHARE_THRESHOLD = 0.10;
  const ACCUMULATION_THRESHOLD = 60;

  const themeColors = useMemo(() => {
    return COLOR_THEMES[selectedColorScheme as keyof typeof COLOR_THEMES] || COLOR_THEMES.default;
  }, [selectedColorScheme]);

  const getCurrentThemeColors = () => themeColors;

  const getCategoryColor = useCallback(
    (categoryName: string | null): string => {
      if (!categoryName) return '#9CA3AF';
      return categories[categoryName] || '#9CA3AF';
    },
    [categories],
  );

  const projectDataPoints = useMemo((): ProjectDataPoint[] => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let startDate: Date;
    if (timeRange === '30d') {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeRange === '90d') {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 90);
    } else {
      startDate = new Date(today.getFullYear(), 0, 1);
    }
    startDate.setHours(0, 0, 0, 0);

    const filteredEvents = events.filter((evt) => {
      const evtDate = parseLocalDate(evt.date);
      return evtDate >= startDate && evtDate <= today;
    });

    const totalDuration = filteredEvents.reduce((sum, evt) => sum + evt.duration, 0);

    const projectMetrics = new Map<number, { duration: number; lastEventDate: Date }>();

    filteredEvents.forEach((evt) => {
      if (!evt.projectId) return;
      const current = projectMetrics.get(evt.projectId) || { duration: 0, lastEventDate: new Date(0) };
      current.duration += evt.duration;
      const evtDate = parseLocalDate(evt.date);
      if (evtDate > current.lastEventDate) {
        current.lastEventDate = evtDate;
      }
      projectMetrics.set(evt.projectId, current);
    });

    const dataPoints: ProjectDataPoint[] = [];

    projects.forEach((project) => {
      if (project.archived) return;

      const metrics = projectMetrics.get(project.id) || { duration: 0, lastEventDate: new Date(0) };

      const durationHours = metrics.duration / 60;
      const share = totalDuration > 0 ? metrics.duration / totalDuration : 0;

      const daysSinceLastEvent =
        metrics.duration > 0
          ? Math.floor((today.getTime() - metrics.lastEventDate.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

      dataPoints.push({
        id: project.id,
        name: project.name,
        category: project.category,
        color: getCategoryColor(project.category),
        durationHours,
        share,
        accumulation: project.percent,
        recentActivity: daysSinceLastEvent,
        x: share,
        y: project.percent / 100,
      });
    });

    return dataPoints;
  }, [projects, events, timeRange, getCategoryColor]);

  const getSuggestion = (share: number, accumulation: number): string => {
    const isHighShare = share >= SHARE_THRESHOLD;
    const isHighAccum = accumulation >= ACCUMULATION_THRESHOLD;

    if (isHighShare && isHighAccum) return t('visualization.suggestionTopRight');
    if (!isHighShare && isHighAccum) return t('visualization.suggestionTopLeft');
    if (isHighShare && !isHighAccum) return t('visualization.suggestionBottomRight');
    return t('visualization.suggestionBottomLeft');
  };

  const getQuadrantLabel = (share: number, accumulation: number): string => {
    const isHighShare = share >= SHARE_THRESHOLD;
    const isHighAccum = accumulation >= ACCUMULATION_THRESHOLD;

    if (isHighShare && isHighAccum) return t('visualization.quadrantTopRight');
    if (!isHighShare && isHighAccum) return t('visualization.quadrantTopLeft');
    if (isHighShare && !isHighAccum) return t('visualization.quadrantBottomRight');
    return t('visualization.quadrantBottomLeft');
  };

  const getBubbleRadius = (durationHours: number, allDurations: number[]): number => {
    const minRadius = 16;
    const maxRadius = 40;
    const maxDuration = Math.max(...allDurations, 1);
    const k = (maxRadius - minRadius) / Math.sqrt(maxDuration);
    return Math.min(maxRadius, minRadius + k * Math.sqrt(durationHours));
  };

  const getOpacity = (daysSinceLastEvent: number): number => {
    if (daysSinceLastEvent <= 7) return 1;
    if (daysSinceLastEvent <= 14) return 0.85;
    if (daysSinceLastEvent <= 30) return 0.6;
    return 0.35;
  };

  const handleBubblePress = (dataPoint: ProjectDataPoint) => {
    setSelectedProject(dataPoint);
  };

  const handleBubbleLongPress = (dataPoint: ProjectDataPoint) => {
    const project = projects.find((p) => p.id === dataPoint.id);
    if (project) {
      setSelectedNode({ ...project });
      setModalOpen(true);
    }
  };

  const handleArchiveProject = (projectId: number) => {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, archived: true } : p)));
    setModalOpen(false);
  };

  const handleUnarchiveProject = (projectId: number) => {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, archived: false } : p)));
  };

  const handleDeleteProject = (projectId: number) => {
    Alert.alert(t('common.confirm'), t('projects.deleteProjectConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          setProjects((prev) => prev.filter((p) => p.id !== projectId));
          setEvents((prev) => prev.map((e) => (e.projectId === projectId ? { ...e, projectId: undefined } : e)));
        },
      },
    ]);
  };

  const handleSelectColorScheme = (scheme: string) => {
    setSelectedColorScheme(scheme);

    const newColors = COLOR_THEMES[scheme as keyof typeof COLOR_THEMES] || COLOR_THEMES.default;

    const updatedCategories: CategoryMap = {};
    const categoryNames = Object.keys(categories).filter((name) => name !== 'uncategorized');

    categoryNames.forEach((catName, index) => {
      updatedCategories[catName] = newColors[index % newColors.length];
    });

    if (categories['uncategorized']) {
      updatedCategories['uncategorized'] = '#9CA3AF';
    }

    setCategories(updatedCategories);

    setProjects((prevProjects) =>
      prevProjects.map((project) => ({
        ...project,
        hexColor:
          project.category && updatedCategories[project.category]
            ? updatedCategories[project.category]
            : '#9CA3AF',
      })),
    );

    setEvents((prevEvents) =>
      prevEvents.map((event) => ({
        ...event,
        hexColor: event.category && updatedCategories[event.category] ? updatedCategories[event.category] : event.hexColor,
      })),
    );
  };

  if (showSettings) {
    return (
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        setShowSettings={setShowSettings}
        projects={projects}
        categories={categories}
        setProjects={setProjects}
        setCategories={setCategories}
        setEvents={setEvents}
        selectedColorScheme={selectedColorScheme}
        onSelectColorScheme={handleSelectColorScheme}
        getCurrentThemeColors={getCurrentThemeColors}
        onArchiveProject={handleArchiveProject}
        onUnarchiveProject={handleUnarchiveProject}
        onDeleteProject={handleDeleteProject}
        colors={colors}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>{t('visualization.title')}</Text>
        <Pressable
          onPress={() => setShowSettings(true)}
          style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: colors.backgroundTertiary, justifyContent: 'center', alignItems: 'center' }}
        >
          <Settings size={18} color={colors.textTertiary} />
        </Pressable>
      </View>

      {projectDataPoints.length === 0 ? (
        <EmptyState
          message={`${t('projects.noProjectsYet')}
\n${t('projects.noProjectsHint')}`}
          actionButton={
            onGoToCalendar ? (
              <Pressable
                onPress={onGoToCalendar}
                style={{
                  backgroundColor: colors.accent,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.accentText }}>{t('projects.goToCalendar')}</Text>
              </Pressable>
            ) : undefined
          }
          colors={colors}
        />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: colors.surface }}>
            <SegmentedControl
              options={[
                { key: '30d', label: t('visualization.timeRange30') },
                { key: '90d', label: t('visualization.timeRange90') },
                { key: 'year', label: t('visualization.timeRangeYear') },
              ]}
              value={timeRange}
              onChange={(k) => {
                setTimeRange(k as TimeRangeType);
                setSelectedProject(null);
              }}
              colors={colors}
            />
          </View>

          <View style={{ paddingHorizontal: 12, paddingTop: 20, paddingBottom: 16 }} onLayout={(e) => setChartWidth(e.nativeEvent.layout.width - 24)}>
            <View style={{ width: '100%', height: CHART_HEIGHT, backgroundColor: colors.surface, borderRadius: 16, padding: 10 }}>
              <View style={{ position: 'absolute', left: 0, top: CHART_HEIGHT / 2, transform: [{ rotate: '-90deg' }] }}>
                <Text style={{ fontSize: 9, fontWeight: '600', color: colors.textQuaternary }}>{t('visualization.yAxis')}</Text>
              </View>

              <View style={{ marginLeft: CHART_PADDING.left, marginTop: CHART_PADDING.top, width: chartInnerWidth, height: chartInnerHeight }}>
                {[0, 0.25, 0.5, 0.75, 1].map((val) => (
                  <View
                    key={`v-${val}`}
                    style={{ position: 'absolute', left: val * chartInnerWidth, top: 0, width: 1, height: chartInnerHeight, backgroundColor: colors.chartGrid }}
                  />
                ))}
                {[0, 0.25, 0.5, 0.75, 1].map((val) => (
                  <View
                    key={`h-${val}`}
                    style={{ position: 'absolute', left: 0, top: (1 - val) * chartInnerHeight, width: chartInnerWidth, height: 1, backgroundColor: colors.chartGrid }}
                  />
                ))}

                <View
                  style={{
                    position: 'absolute',
                    left: SHARE_THRESHOLD * chartInnerWidth,
                    top: 0,
                    width: 2,
                    height: chartInnerHeight,
                    backgroundColor: colors.textQuaternary,
                    opacity: 0.5,
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
                    opacity: 0.5,
                  }}
                />

                <View style={{ position: 'absolute', right: 4, top: 4 }}>
                  <Text style={{ fontSize: 9, fontWeight: '600', color: colors.textTertiary, textAlign: 'right' }}>{t('visualization.quadrantTopRight')}</Text>
                </View>
                <View style={{ position: 'absolute', left: 4, top: 4 }}>
                  <Text style={{ fontSize: 9, fontWeight: '600', color: colors.textTertiary }}>{t('visualization.quadrantTopLeft')}</Text>
                </View>
                <View style={{ position: 'absolute', right: 4, bottom: 4 }}>
                  <Text style={{ fontSize: 9, fontWeight: '600', color: colors.textTertiary, textAlign: 'right' }}>{t('visualization.quadrantBottomRight')}</Text>
                </View>
                <View style={{ position: 'absolute', left: 4, bottom: 4 }}>
                  <Text style={{ fontSize: 9, fontWeight: '600', color: colors.textTertiary }}>{t('visualization.quadrantBottomLeft')}</Text>
                </View>

                {projectDataPoints.map((point) => {
                  const allDurations = projectDataPoints.map((p) => p.durationHours);
                  const radius = getBubbleRadius(point.durationHours, allDurations);
                  const opacity = getOpacity(point.recentActivity);
                  const isSelected = selectedProject?.id === point.id;

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

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginLeft: CHART_PADDING.left, marginTop: 8, width: chartInnerWidth }}>
                <Text style={{ fontSize: 10, color: colors.chartLabel }}>0%</Text>
                <Text style={{ fontSize: 10, color: colors.chartLabel }}>25%</Text>
                <Text style={{ fontSize: 10, color: colors.chartLabel }}>50%</Text>
                <Text style={{ fontSize: 10, color: colors.chartLabel }}>75%</Text>
                <Text style={{ fontSize: 10, color: colors.chartLabel }}>100%</Text>
              </View>

              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.chartLabel, textAlign: 'center', marginTop: 4 }}>
                {t('visualization.xAxis')}
              </Text>

              <View style={{ position: 'absolute', left: 0, top: CHART_PADDING.top, bottom: CHART_PADDING.bottom + 40, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 1 }}>
                <Text style={{ fontSize: 8, color: colors.chartLabel, fontWeight: '600' }}>100%</Text>
                <Text style={{ fontSize: 8, color: colors.chartLabel, fontWeight: '600' }}>50%</Text>
                <Text style={{ fontSize: 8, color: colors.chartLabel, fontWeight: '600' }}>0%</Text>
              </View>
            </View>
          </View>

          <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
            {selectedProject ? (
              <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, shadowColor: colors.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 }}>{selectedProject.name}</Text>
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
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{Math.round(selectedProject.accumulation)}%</Text>
                    <Text style={{ fontSize: 11, color: colors.textQuaternary, marginTop: 2 }}>
                      {getQuadrantLabel(selectedProject.share, selectedProject.accumulation)}
                    </Text>
                  </View>
                </View>

                <View style={{ backgroundColor: colors.warningLight, borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: colors.warning }}>
                  <Text style={{ fontSize: 13, color: colors.text, lineHeight: 18 }}>{getSuggestion(selectedProject.share, selectedProject.accumulation)}</Text>
                </View>

                {selectedProject.recentActivity > 0 && (
                  <Text style={{ fontSize: 11, color: colors.textQuaternary, marginTop: 8, textAlign: 'center' }}>
                    {t('visualization.lastActive')}: {selectedProject.recentActivity === 0 ? t('visualization.today') : `${selectedProject.recentActivity} ${t('visualization.daysAgo')}`}
                  </Text>
                )}
              </View>
            ) : (
              <View style={{ backgroundColor: colors.backgroundSecondary, borderRadius: 16, padding: 16, alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 13, color: colors.textQuaternary }}>{t('visualization.tapToSelect')}</Text>
                <Text style={{ fontSize: 12, color: colors.textQuaternary, opacity: 0.7 }}>{t('visualization.longPressToEdit')}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {modalOpen && selectedNode && (
        <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: colors.modalBackdrop, justifyContent: 'flex-end' }} onPress={() => setModalOpen(false)}>
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
              <ModalHeader
                titleNode={
                  <TextInput
                    style={{ fontSize: 28, fontWeight: '700', color: colors.text, padding: 0, margin: 0 }}
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
                    style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.warningLight, justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Archive size={18} color={colors.warning} />
                  </Pressable>
                }
                colors={colors}
              />

              <ScrollView style={{ flexGrow: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
                <View style={{ marginBottom: 32 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {t('projects.accumulation')}
                    </Text>
                    <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: selectedNode.percent >= 100 ? colors.success : colors.backgroundTertiary }}>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: selectedNode.percent >= 100 ? colors.accentText : colors.text }}>
                        {Math.round(selectedNode.percent)}%
                      </Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 12, color: colors.textTertiary, lineHeight: 18, marginBottom: 16 }}>{t('projects.accumulationHint')}</Text>

                  <View
                    style={{ height: 48, justifyContent: 'center', marginBottom: 8 }}
                    onStartShouldSetResponder={() => true}
                    onResponderGrant={(e) => {
                      const locationX = e.nativeEvent.locationX;
                      const containerWidth = 327;
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
                    <View style={{ height: 8, backgroundColor: colors.backgroundTertiary, borderRadius: 4, overflow: 'hidden' }}>
                      <View style={{ height: '100%', width: `${selectedNode.percent}%`, backgroundColor: selectedNode.hexColor, borderRadius: 4 }} />
                    </View>

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

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 }}>
                    <Text style={{ fontSize: 10, color: colors.textQuaternary, fontWeight: '600' }}>{t('projects.accumulationLevel0')}</Text>
                    <Text style={{ fontSize: 10, color: colors.textQuaternary, fontWeight: '600' }}>{t('projects.accumulationLevel30')}</Text>
                    <Text style={{ fontSize: 10, color: colors.textQuaternary, fontWeight: '600' }}>{t('projects.accumulationLevel60')}</Text>
                    <Text style={{ fontSize: 10, color: colors.textQuaternary, fontWeight: '600' }}>{t('projects.accumulationLevel85')}</Text>
                  </View>
                </View>

                <View style={{ marginBottom: 32 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
                    {t('projects.category')}
                  </Text>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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
                      <Text style={{ fontSize: 13, fontWeight: '700', color: !selectedNode.category ? colors.textInverse : colors.textTertiary }}>
                        {t('projects.uncategorized')}
                      </Text>
                    </Pressable>

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
                          <Text style={{ fontSize: 13, fontWeight: '700', color: isSelected ? colors.accentText : catColor }}>{catName}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={{ backgroundColor: colors.backgroundSecondary, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
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

                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textTertiary, marginBottom: 12 }}>{t('common.color')}</Text>

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
                        setCategories((prev) => ({ ...prev, [newCatName]: newCatColor }));
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
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: selectedNode.newCategoryName?.trim() ? colors.accentText : colors.textQuaternary,
                      }}
                    >
                      {t('projects.createAndAssign')}
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>

              <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
                <Pressable
                  onPress={() => {
                    setProjects((prev) => prev.map((p) => (p.id === selectedNode.id ? selectedNode : p)));
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
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primaryText }}>{t('projects.saveChanges')}</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

export const projectStyles = StyleSheet.create({
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
    width: 64,
    height: 64,
    borderRadius: 32,
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
    width: 48,
    height: 48,
    borderRadius: 24,
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

export default ProjectsView;
