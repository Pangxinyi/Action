import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

interface AccumulationSimpleProps {
  percent: number;
  onChangePercent: (p: number) => void;
  colors: any;
  hexColor?: string;
}

const AccumulationSimple: React.FC<AccumulationSimpleProps> = ({ percent, onChangePercent, colors, hexColor }) => {
  const { t } = useTranslation();
  const [width, setWidth] = React.useState(0);

  const handleStart = (locationX: number) => {
    const w = width || 300;
    const newPercent = Math.max(0, Math.min(100, (locationX / w) * 100));
    onChangePercent(Math.round(newPercent));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.titleText, { color: colors.textTertiary }]}>{t('projects.accumulation')}</Text>
        <View style={[styles.badge, { backgroundColor: percent >= 100 ? colors.success : colors.backgroundTertiary }]}
          pointerEvents="none"
        >
          <Text style={[styles.badgeText, { color: percent >= 100 ? colors.accentText : colors.text }]}>{Math.round(percent)}%</Text>
        </View>
      </View>

      <View
        style={styles.sliderArea}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponderCapture={() => true}
        onMoveShouldSetResponderCapture={() => true}
        onResponderGrant={(e) => handleStart(e.nativeEvent.locationX)}
        onResponderMove={(e) => handleStart(e.nativeEvent.locationX)}
      >
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <View style={[styles.fill, { width: `${percent}%`, backgroundColor: hexColor || colors.accent }]} />
        </View>

        <View
          style={[
            styles.thumb,
            {
              left: `${percent}%`,
              backgroundColor: colors.surface,
              borderColor: hexColor || colors.accent,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  sliderArea: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  thumb: {
    position: 'absolute',
    transform: [{ translateX: -10 }],
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  badgeContainer: {
    position: 'absolute',
    right: 8,
    top: 0,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
});

export default AccumulationSimple;
