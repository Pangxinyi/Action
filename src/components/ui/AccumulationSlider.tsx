import React from 'react';
import { Text, View } from 'react-native';

interface AccumulationSliderProps {
  percent: number;
  onChangePercent: (percent: number) => void;
  colors: any;
  hexColor?: string;
}

const AccumulationSlider: React.FC<AccumulationSliderProps> = ({
  percent,
  onChangePercent,
  colors,
  hexColor,
}) => {
  const [containerWidth, setContainerWidth] = React.useState(327);

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Accumulation
        </Text>
        <View style={{ paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8, backgroundColor: percent >= 100 ? colors.success : colors.backgroundTertiary }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: percent >= 100 ? colors.accentText : colors.text }}>
            {Math.round(percent)}%
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 11, color: colors.textQuaternary, lineHeight: 16, marginBottom: 12 }}>
        Set a rough score for this project: &quot;How much will each hour invested help me 5 years from now?&quot;
      </Text>

      <View
        style={{ height: 48, justifyContent: 'center', marginBottom: 8 }}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          const locationX = e.nativeEvent.locationX;
          const newPercent = Math.max(0, Math.min(100, (locationX / containerWidth) * 100));
          onChangePercent(Math.round(newPercent));
        }}
        onResponderMove={(e) => {
          const locationX = e.nativeEvent.locationX;
          const newPercent = Math.max(0, Math.min(100, (locationX / containerWidth) * 100));
          onChangePercent(Math.round(newPercent));
        }}
      >
        <View style={{ height: 8, backgroundColor: colors.backgroundTertiary, borderRadius: 4, overflow: 'hidden' }}>
          <View style={{ height: '100%', width: `${percent}%`, backgroundColor: hexColor || colors.accent, borderRadius: 4 }} />
        </View>

        <View
          style={{
            position: 'absolute',
            left: `${percent}%`,
            transform: [{ translateX: -12 }],
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: colors.surface,
            borderWidth: 3,
            borderColor: hexColor || colors.accent,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
          }}
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 }}>
        <Text style={{ fontSize: 10, color: colors.textQuaternary, fontWeight: '600' }}>Drain</Text>
        <Text style={{ fontSize: 10, color: colors.textQuaternary, fontWeight: '600' }}>Maintain</Text>
        <Text style={{ fontSize: 10, color: colors.textQuaternary, fontWeight: '600' }}>Growth</Text>
        <Text style={{ fontSize: 10, color: colors.textQuaternary, fontWeight: '600' }}>Core</Text>
      </View>
    </View>
  );
};

export default AccumulationSlider;