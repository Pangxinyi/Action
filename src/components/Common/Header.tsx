import { AppThemeColors } from '@hooks/useThemeColors';
import React from 'react';
import { View } from 'react-native';
import ThemedText from './ThemedText';

type HeaderProps = {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  colors?: AppThemeColors;
};

const Header: React.FC<HeaderProps> = ({ title, subtitle, leftIcon, rightIcon, colors }) => {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 }, colors && { backgroundColor: colors.surface, borderBottomColor: colors.border }] as any}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
        <View>
          <ThemedText variant="title" style={colors ? { color: colors.text } : undefined}>{title}</ThemedText>
          {subtitle ? <ThemedText variant="label" style={colors ? { color: colors.textTertiary } : undefined}>{subtitle}</ThemedText> : null}
        </View>
      </View>
      {rightIcon && <View>{rightIcon}</View>}
    </View>
  );
};

export default React.memo(Header);

