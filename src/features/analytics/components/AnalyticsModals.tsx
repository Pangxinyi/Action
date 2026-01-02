import { PackageOpen } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { BottomSheet } from '../../../components/BottomSheet';
import { EmptyState } from '../../../components/EmptyState';
import { ModalHeader } from '../../../components/ModalHeader';
import type { AppThemeColors } from '../../../hooks/useThemeColors';
import type { CategoryMap, EventItem, Project } from '../../../types';
import { parseLocalDate } from '../../../utils/date';

type AnalyticsModalsProps = {
  modalOpen: boolean;
  editingProject: Project | null;
  onCloseEditProject: () => void;
  showUnassignedEvents: boolean;
  onCloseUnassigned: () => void;
  showCategoryEvents: boolean;
  onCloseCategory: () => void;
  selectedCategory: string | null;
  filteredEvents: EventItem[];
  categories: CategoryMap;
  projects: Project[];
  colors: AppThemeColors;
  t: (key: string, opts?: any) => string;
  language: string;
};

const AnalyticsModals: React.FC<AnalyticsModalsProps> = ({
  modalOpen,
  editingProject,
  onCloseEditProject,
  showUnassignedEvents,
  onCloseUnassigned,
  showCategoryEvents,
  onCloseCategory,
  selectedCategory,
  filteredEvents,
  categories,
  projects,
  colors,
  t,
  language,
}) => {
  const formatMinutes = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const locale = language === 'zh' ? 'zh-CN' : 'en-US';

  return (
    <>
      {modalOpen && editingProject && (() => {
        const projectEvents = filteredEvents.filter(evt => evt.projectId === editingProject.id);
        const projectSubtitle = (() => {
          const cnt = projectEvents.length;
          const totalMinutes = projectEvents.reduce((s, e) => s + (e.duration || 0), 0);
          const h = Math.floor(totalMinutes / 60);
          const m = totalMinutes % 60;
          const timeStr = h > 0 ? `${h}${t('common.hours')} ${m}${t('common.minutes')}` : `${m}${t('common.minutes')}`;
          return `${cnt} ${cnt === 1 ? t('visualization.event') : t('visualization.events')} · ${timeStr}`;
        })();

        return (
          <BottomSheet isOpen={modalOpen} onClose={onCloseEditProject} height="80%">
            <ModalHeader
              title={editingProject.name}
              subtitle={projectSubtitle}
              onClose={onCloseEditProject}
              colors={colors}
            />

            <ScrollView 
              style={{ flexGrow: 1 }}
              contentContainerStyle={{ padding: 24, paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {projectEvents.length === 0 ? (
                <EmptyState
                  message={t('visualization.noEventsForProject') || 'No events for this project'}
                  colors={colors}
                />
              ) : (
                projectEvents.map((evt, index) => {
                  const eventDate = parseLocalDate(evt.date);
                  const hours = Math.floor(evt.duration / 60);
                  const mins = evt.duration % 60;
                  const categoryColor = evt.category ? (categories[evt.category] || editingProject.hexColor) : editingProject.hexColor;

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
                          {eventDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
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
          </BottomSheet>
        );
      })()}

      {showUnassignedEvents && (() => {
        const unassignedEvents = filteredEvents.filter(evt => !evt.projectId);
        const subtitle = (() => {
          const cnt = unassignedEvents.length;
          const totalMinutes = unassignedEvents.reduce((s, e) => s + (e.duration || 0), 0);
          const h = Math.floor(totalMinutes / 60);
          const m = totalMinutes % 60;
          const timeStr = h > 0 ? `${h}${t('common.hours')} ${m}${t('common.minutes')}` : `${m}${t('common.minutes')}`;
          return `${cnt} ${cnt === 1 ? t('visualization.event') : t('visualization.events')} · ${timeStr}`;
        })();

        return (
          <BottomSheet isOpen={showUnassignedEvents} onClose={onCloseUnassigned} height="80%">
            <ModalHeader
              title={t('calendar.uncategorized')}
              subtitle={subtitle}
              onClose={onCloseUnassigned}
              colors={colors}
            />

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
                            return t(`categories.${name.toLowerCase()}`, { defaultValue: name });
                          })()}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Text style={{ fontSize: 13, color: colors.textTertiary }}>
                          {eventDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
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
          </BottomSheet>
        );
      })()}

      {showCategoryEvents && selectedCategory && (() => {
        const categoryEvents = filteredEvents.filter(evt => (evt.category || 'uncategorized') === selectedCategory);
        const categoryColor = categories[selectedCategory] || '#9CA3AF';
        const subtitle = (() => {
          const totalMinutes = categoryEvents.reduce((s, e) => s + (e.duration || 0), 0);
          const h = Math.floor(totalMinutes / 60);
          const m = totalMinutes % 60;
          if (h > 0) return `${h}${t('common.hours')} ${m}${t('common.minutes')}`;
          return `${m}${t('common.minutes')}`;
        })();

        return (
          <BottomSheet isOpen={showCategoryEvents} onClose={onCloseCategory} height="80%">
            <ModalHeader
              title={selectedCategory === 'uncategorized' ? t('calendar.uncategorized') : selectedCategory}
              subtitle={`${categoryEvents.length} ${categoryEvents.length === 1 ? t('visualization.event') : t('visualization.events')} · ${subtitle}`}
              onClose={onCloseCategory}
              colors={colors}
            />

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
                          {eventDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
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
          </BottomSheet>
        );
      })()}
    </>
  );
};

export default AnalyticsModals;
