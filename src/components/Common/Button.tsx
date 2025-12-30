import { useThemeColors } from '@hooks/useThemeColors';
import React from 'react';
import { Pressable, StyleProp, Text, ViewStyle } from 'react-native';

type Props = {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'ghost';
};

const Button: React.FC<Props> = ({ title, children, onPress, style, variant = 'primary' }) => {
  const { colors } = useThemeColors();
  const bg = variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.accent : 'transparent';
  const fg = variant === 'primary' ? colors.primaryText : colors.text;

  return (
    <Pressable onPress={onPress} style={[{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: bg, alignItems: 'center' }, style] as any}>
      {children ? children : <Text style={{ color: fg, fontWeight: '700' }}>{title}</Text>}
    </Pressable>
  );
};

export default React.memo(Button);
