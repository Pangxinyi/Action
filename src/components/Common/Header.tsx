import React from 'react';
import { View, Text } from 'react-native';
import { AppThemeColors } from '@hooks/useThemeColors';

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
          <Text style={[{ fontSize: 16, fontWeight: '700' }, colors && { color: colors.text }]}>{title}</Text>
          {subtitle ? <Text style={[{ fontSize: 12 }, colors && { color: colors.textTertiary }]}>{subtitle}</Text> : null}
        </View>
      </View>
      {rightIcon && <View>{rightIcon}</View>}
    </View>
  );
};

export default React.memo(Header);

