import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type TimeRange = 'Week' | 'Month' | 'Year';

export type StackedSegment = {
  category: string;
  duration: number;
  color: string;
};

export type StackedBarChartProps = {
  stackedChartData: StackedSegment[][];
  chartTotals: number[];
  maxVal: number;
  chartLabels: string[];
  timeRange: TimeRange;
  colors: {
    backgroundTertiary: string;
    textQuaternary: string;
  };
};

const StackedBarChart: React.FC<StackedBarChartProps> = ({
  stackedChartData,
  chartTotals,
  maxVal,
  chartLabels,
  timeRange,
  colors,
}) => {
  return (
    <View style={styles.barChartRow}>
      {stackedChartData.map((barSegments, idx) => {
        const barTotal = chartTotals[idx];
        const barHeight = maxVal ? (barTotal / maxVal) * 100 : 0;
        return (
          <View
            key={idx}
            style={[styles.barWrapper, timeRange === 'Month' && { alignItems: 'flex-start' }]}
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
  );
};

export default StackedBarChart;

const styles = StyleSheet.create({
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
});
