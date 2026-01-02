import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EventCard } from '../../../../src/components/EventCard';
import type { EventItem, Project } from '../../../../src/types';
import type { AppThemeColors } from '../../../hooks/useThemeColors';

type Props = {
  events: EventItem[];
  selectedDate: Date;
  projects: Project[];
  colors: AppThemeColors;
  onSlotPress: (hour: number, minute: number) => void;
  onEventPress: (event: EventItem) => void;
  scrollRef?: React.RefObject<ScrollView | null>;
  isScrollEnabled?: boolean;
};

const PIXELS_PER_MINUTE = 1;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DailyTimeline: React.FC<Props> = ({
  events,
  selectedDate,
  projects,
  colors,
  onSlotPress,
  onEventPress,
  scrollRef: externalScrollRef,
  isScrollEnabled = true,
}) => {
  const internalScrollRef = useRef<ScrollView | null>(null);
  const scrollRef = externalScrollRef || internalScrollRef;
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate now line position
  const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const nowTop = nowMinutes * PIXELS_PER_MINUTE;
  
  const isSelectedDateToday =
    selectedDate.getFullYear() === currentTime.getFullYear() &&
    selectedDate.getMonth() === currentTime.getMonth() &&
    selectedDate.getDate() === currentTime.getDate();

  // Initial scroll to current time
  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    const minutesSinceStart = now.getHours() * 60 + now.getMinutes();
    const scrollPos = minutesSinceStart * PIXELS_PER_MINUTE;
    scrollRef.current.scrollTo({ y: Math.max(0, scrollPos), animated: false });
  }, [scrollRef]);

  // Scroll when date changes
  useEffect(() => {
    if (!scrollRef.current) return;

    // 1. Format selected date string (YYYY-MM-DD)
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const selectedDateStr = `${year}-${month}-${day}`;

    // 2. Filter events for the selected day
    const todaysEvents = events.filter((e) => e.date === selectedDateStr);

    let targetScrollY = 0;

    if (todaysEvents.length > 0) {
      // ✅ Case A: Has events on this day
      // Find earliest start time (in minutes)
      const earliestStart = Math.min(...todaysEvents.map((e) => e.start));
      
      // Calculate scroll position with buffer
      // earliestStart * PIXELS_PER_MINUTE (event position)
      // - 100 (buffer: shows event in upper-middle area, not at top edge)
      targetScrollY = earliestStart * PIXELS_PER_MINUTE - 100;
    } else {
      // ✅ Case B: No events on this day (keep original logic)
      const now = new Date();
      const isToday =
        selectedDate.getFullYear() === now.getFullYear() &&
        selectedDate.getMonth() === now.getMonth() &&
        selectedDate.getDate() === now.getDate();

      if (isToday) {
        // If today with no events, scroll to current time
        const minutesSinceStart = now.getHours() * 60 + now.getMinutes();
        targetScrollY = minutesSinceStart * PIXELS_PER_MINUTE - 200; // Center it
      } else {
        // If other day with no events, scroll to 6:00 AM
        targetScrollY = 6 * 60 * PIXELS_PER_MINUTE;
      }
    }

    // Prevent scrolling to negative area
    targetScrollY = Math.max(0, targetScrollY);

    // Execute scroll
    scrollRef.current.scrollTo({ y: targetScrollY, animated: true });
  }, [selectedDate, scrollRef]); // ⚠️ Note: Only depends on selectedDate, not events

  // Filter events for selected date
  const selectedDateStr = `${selectedDate.getFullYear()}-${String(
    selectedDate.getMonth() + 1
  ).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  const dayEvents = events.filter((evt) => evt.date === selectedDateStr);

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 24 }}
      scrollEnabled={isScrollEnabled}
    >
      <View style={{ minHeight: 1440, paddingHorizontal: 12, paddingTop: 0 }}>
        {/* Hour rows */}
        {HOURS.map((hour) => (
          <View
            key={hour}
            style={[
              styles.hourRow,
              { height: 60 * PIXELS_PER_MINUTE, borderColor: colors.border },
            ]}
          >
            <View style={styles.hourLabelContainer}>
              <Text style={[styles.hourLabel, { color: colors.textQuaternary }]}>
                {`${hour}:00`}
              </Text>
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
                  onSlotPress(hour, minutesInHour);
                }}
              />
            </View>
          </View>
        ))}

        {/* Event cards */}
        {dayEvents.map((evt) => {
          const top = evt.start * PIXELS_PER_MINUTE;
          const height = evt.duration * PIXELS_PER_MINUTE;
          if (top < 0) return null;
          const cardHeight = Math.max(20, height);
          return (
            <EventCard
              key={evt.id}
              event={evt}
              layout={{ top, height: cardHeight }}
              colors={colors}
              projects={projects}
              onPress={onEventPress}
            />
          );
        })}

        {/* Now line (only show for today) */}
        {isSelectedDateToday && (
          <View style={[styles.nowLine, { top: nowTop }]}>
            <View style={styles.nowDot} />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
});

export default DailyTimeline;
