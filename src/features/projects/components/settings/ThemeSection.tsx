import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLOR_THEMES } from '../../../../constants/theme';
import type { AppThemeColors } from '../../../../hooks/useThemeColors';

type Props = {
  selectedColorScheme: string;
  onSelectScheme: (scheme: string) => void;
  colors: AppThemeColors;
};

const styles = StyleSheet.create({
  colorDotLarge: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotLargeActive: {
    borderColor: '#111827',
  },
});

export const ThemeSection: React.FC<Props> = ({ selectedColorScheme, onSelectScheme, colors }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const themeOptions = useMemo(
    () => [
      { id: 'default', title: t('themes.default') },
      { id: 'vivid', title: t('themes.vivid') },
      { id: 'seaside', title: t('themes.seaside') },
      { id: 'twilight', title: t('themes.twilight') },
      { id: 'garden', title: t('themes.garden') },
      { id: 'mineral', title: t('themes.mineral') },
    ],
    [t],
  );

  return (
    <View>
      <Pressable
        onPress={() => setIsOpen((prev) => !prev)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: isOpen ? 12 : 0 }}
      >
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {t('projects.colorTheme')}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textTertiary }}>{isOpen ? '▼' : '▶'}</Text>
      </Pressable>
      {isOpen && (
        <View style={{ gap: 8 }}>
          {themeOptions.map((option) => {
            const themeColors = COLOR_THEMES[option.id as keyof typeof COLOR_THEMES] || COLOR_THEMES.default;
            const isSelected = selectedColorScheme === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => onSelectScheme(option.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? colors.accent : colors.border,
                  backgroundColor: isSelected ? colors.accentLight : colors.backgroundSecondary,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{option.title}</Text>
                <View style={{ flexDirection: 'row', marginLeft: 'auto' }}>
                  {themeColors.map((color: string, index: number) => (
                    <View
                      key={index}
                      style={[
                        styles.colorDotLarge,
                        {
                          backgroundColor: color,
                          marginLeft: index === 0 ? 0 : -10,
                          borderColor: isSelected ? colors.accentLight : colors.backgroundSecondary,
                        },
                        isSelected && styles.colorDotLargeActive,
                      ]}
                    />
                  ))}
                </View>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: isSelected ? colors.accent : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginLeft: 12,
                  }}
                >
                  {isSelected && <Text style={{ color: colors.accentText, fontWeight: '700', fontSize: 12 }}>✓</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default ThemeSection;
