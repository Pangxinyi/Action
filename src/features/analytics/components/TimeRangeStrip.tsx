import React, { useMemo } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppThemeColors } from '../../../hooks/useThemeColors';

type Props = {
  timeRange: 'Week' | 'Month' | 'Year';
  selectedOffset: number; // 0 = current, -1 = previous
  onSelectOffset: (offset: number) => void;
  colors: AppThemeColors;
  minDate?: Date;
};

const NUM_ITEMS = 20;
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
// ScrollView padding (16*2) + card padding (16*2) = 64
const CONTAINER_PADDING = 64;
const ESTIMATED_WIDTHS: Record<'Week' | 'Month' | 'Year', number> = {
  Week: 96,
  Month: 90,
  Year: 64,
};
// Nudge when hasHistory to tweak visual alignment (positive moves current pill slightly left)
const HAS_HISTORY_LEFT_NUDGE = 4;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

const formatMonthDay = (d: Date) => {
  const month = d.toLocaleString(undefined, { month: 'short' });
  return `${month} ${d.getDate()}`;
};

export const TimeRangeStrip: React.FC<Props> = ({ timeRange, selectedOffset, onSelectOffset, colors, minDate }) => {

  const items = useMemo(() => {
    const arr: { offset: number; label: string }[] = [];
    const now = new Date();
    const minDateTs = minDate ? minDate.getTime() : 0;

    // forward loop so offset 0 is first: 0, -1, -2, ...
    for (let i = 0; i < NUM_ITEMS; i++) {
      const offset = -i; // 0, -1, -2, -3...

      if (timeRange === 'Week') {
        // find this week's Monday
        const today = new Date(now);
        const dayOfWeek = today.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(today);
        monday.setDate(today.getDate() - daysFromMonday + offset * 7);
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        let label = `${formatMonthDay(monday)}-${sunday.getDate()}`;
        if (offset === 0) label = 'This Week';

        const endDate = sunday;
        if (minDate && endDate.getTime() < minDateTs) {
          break;
        }
        arr.push({ offset, label });
      } else if (timeRange === 'Month') {
        const d = new Date(now);
        d.setMonth(d.getMonth() + offset);
        // Month view label logic
        let label = d.toLocaleString(undefined, { month: 'short', year: 'numeric' });
        const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        if (minDate && endDate.getTime() < minDateTs) {
          break;
        }
        arr.push({ offset, label });
      } else {
        const year = new Date(now).getFullYear() + offset;
        let label = String(year);
        const startOfYear = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        if (minDate && endDate.getTime() < minDateTs) {
          break;
        }
        arr.push({ offset, label });
      }
    }

    return arr;
  }, [timeRange, minDate]);
  const hasHistory = items.length > 1;
  const estWidth = ESTIMATED_WIDTHS[timeRange] || 80;
  // 使用容器实际宽度（屏幕宽度减去外层padding）
  const containerWidth = SCREEN_WIDTH - CONTAINER_PADDING;
  // Apply a tiny adjustment only for devices with iPhone 13 mini screen size
  const isIphone13MiniSize = SCREEN_WIDTH === 375 && SCREEN_HEIGHT === 812;
  const smallScreenAdjust = isIphone13MiniSize && hasHistory ? 6 : 0;
  const spacerWidth = Math.max(0, containerWidth - estWidth - smallScreenAdjust + (hasHistory ? HAS_HISTORY_LEFT_NUDGE : 0));

  return (
    <FlatList
      data={items}
      inverted={hasHistory}
      horizontal
      showsHorizontalScrollIndicator={false}
      ListHeaderComponent={hasHistory ? <View style={{ width: spacerWidth }} /> : null}
      contentContainerStyle={{ paddingHorizontal: 0, alignItems: 'center' }}
      ItemSeparatorComponent={() => <View style={{ width: 6 }} />}
      keyExtractor={(it) => String(it.offset)}
      renderItem={({ item }) => {
        const selected = item.offset === selectedOffset;
        return (
          <View>
            <Pressable
              onPress={() => onSelectOffset(item.offset)}
              style={[
                styles.pill,
                {
                  backgroundColor: selected ? colors.text : 'transparent',
                  borderColor: selected ? colors.text : 'transparent',
                },
              ]}
            >
              <Text style={[styles.pillText, { color: selected ? colors.background : colors.textQuaternary }]}>{item.label}</Text>
            </Pressable>
          </View>
        );
      }}
    />
  );
};

export default TimeRangeStrip;
