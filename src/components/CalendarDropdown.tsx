import type { AppThemeColors } from '@hooks/useThemeColors';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CategoryMap, EventItem } from '../types';

type Props = {
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  firstDay: number;
  calendarDays: number[];
  formatMonthYear: (d: Date) => string;
  formatWeekday: (d: Date, short?: boolean) => string;
  t: (key: string) => string;
  colors: AppThemeColors;
  onClose: () => void;
  events: EventItem[];
  categories: CategoryMap;
};

const CalendarDropdown: React.FC<Props> = ({ selectedDate, setSelectedDate, firstDay, calendarDays, formatMonthYear, formatWeekday, t, colors, onClose, events, categories }) => {
  return (
    <View style={[styles.calendarDropdown, { backgroundColor: colors.surface, shadowColor: colors.text }]}> 
      <View style={styles.calendarHeader}>
        <Pressable onPress={() => {
          const prev = new Date(selectedDate);
          prev.setDate(1);
          prev.setMonth(prev.getMonth() - 1);
          setSelectedDate(prev);
        }}>
          <Text style={[styles.calendarNavText, { color: colors.text }]}>←</Text>
        </Pressable>
        <Text style={[styles.calendarMonth, { color: colors.text }]}>{formatMonthYear(selectedDate)}</Text>
        <Pressable onPress={() => {
          const next = new Date(selectedDate);
          next.setDate(1);
          next.setMonth(next.getMonth() + 1);
          setSelectedDate(next);
        }}>
          <Text style={[styles.calendarNavText, { color: colors.text }]}>→</Text>
        </Pressable>
      </View>

      <View style={styles.calendarWeekdays}>
        {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((day) => (
          <Text key={day} style={[styles.calendarWeekdayLabel, { color: colors.textTertiary }]}>{t(`calendar.${day}`)}</Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {Array.from({ length: firstDay }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.calendarEmptyCell} />
        ))}

        {calendarDays.map((day) => {
          const isSelected =
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === new Date().getMonth() &&
            selectedDate.getFullYear() === new Date().getFullYear();
          const isToday =
            day === new Date().getDate() &&
            selectedDate.getMonth() === new Date().getMonth() &&
            selectedDate.getFullYear() === new Date().getFullYear();

          // Check if this day has events and find most common color
          const dayDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = events.filter(evt => evt.date === dayDateStr);
          const hasEvents = dayEvents.length > 0;
          
          // Count colors to find the most common one (using event's hexColor directly)
          let dotColor = '#9CA3AF'; // default gray
          if (hasEvents) {
            const colorCount: { [key: string]: number } = {};
            dayEvents.forEach(evt => {
              const color = evt.hexColor || '#9CA3AF';
              colorCount[color] = (colorCount[color] || 0) + 1;
            });
            
            // Find most common color
            const mostCommonColor = Object.entries(colorCount).sort((a, b) => b[1] - a[1])[0]?.[0];
            if (mostCommonColor) {
              dotColor = mostCommonColor;
            }
          }

          return (
            <Pressable
              key={day}
              style={[
                styles.calendarDay,
                isSelected && styles.calendarDaySelected,
                isToday && styles.calendarDayToday,
                { backgroundColor: isSelected ? colors.primary : 'transparent', borderColor: colors.border },
              ]}
              onPress={() => {
                const d = new Date(selectedDate);
                d.setDate(day);
                setSelectedDate(d);
                onClose();
              }}
            >
              <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected, { color: isSelected ? colors.primaryText : colors.text }]}>{day}</Text>
              {hasEvents && (
                <View style={[styles.calendarEventDot, { backgroundColor: dotColor }]} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default CalendarDropdown;
