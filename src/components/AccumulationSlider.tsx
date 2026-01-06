import React from 'react';
import { useTranslation } from 'react-i18next';
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
  // 移除硬编码默认宽度，改用 layout 动态获取
  const [containerWidth, setContainerWidth] = React.useState(0);
  const { t } = useTranslation();

  return (
    <View style={{ marginBottom: 32 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {t('projects.accumulation')}
        </Text>
        <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: percent >= 100 ? colors.success : colors.backgroundTertiary }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: percent >= 100 ? colors.accentText : colors.text }}>
            {Math.round(percent)}%
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 12, color: colors.textTertiary, lineHeight: 18, marginBottom: 16 }}>
        {t('projects.accumulationHint')}
      </Text>

      <View
        style={{ height: 40, justifyContent: 'center', marginBottom: 6 }}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        // 关键修复：使用 Capture 确保按下滑块时 ScrollView/底层不会拦截滑动
        onStartShouldSetResponderCapture={() => true}
        onMoveShouldSetResponderCapture={() => true}
        onResponderGrant={(e) => {
          const locationX = e.nativeEvent.locationX;
          const width = containerWidth || 300; // 防御性默认值
          const newPercent = Math.max(0, Math.min(100, (locationX / width) * 100));
          onChangePercent(Math.round(newPercent));
        }}
        onResponderMove={(e) => {
          const locationX = e.nativeEvent.locationX;
          const width = containerWidth || 300;
          const newPercent = Math.max(0, Math.min(100, (locationX / width) * 100));
          onChangePercent(Math.round(newPercent));
        }}
      >
        {/* 轨道：高度统一为 6 */}
        <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
          <View style={{ height: '100%', width: `${percent}%`, backgroundColor: hexColor || colors.accent, borderRadius: 3 }} />
        </View>

        {/* 手柄：大小统一为 20，偏移 -10 */}
        <View
          style={{
            position: 'absolute',
            left: `${percent}%`,
            transform: [{ translateX: -10 }],
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.surface,
            borderWidth: 2,
            borderColor: hexColor || colors.accent,
            shadowColor: colors.text || '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 3,
            elevation: 3,
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
  );
};

export default AccumulationSlider;