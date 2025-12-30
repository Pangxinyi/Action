import { useThemeColors } from '@hooks/useThemeColors';
import React from 'react';
import { Text, TextProps } from 'react-native';

type Props = TextProps & {
  variant?: 'body' | 'label' | 'title';
  color?: string;
};

const ThemedText: React.FC<Props> = ({ variant = 'body', style, color, children, ...rest }) => {
  const { colors } = useThemeColors();
  const size = variant === 'title' ? 18 : variant === 'label' ? 12 : 14;
  const weight = variant === 'title' ? '700' : variant === 'label' ? '600' : '400';
  return (
    <Text
      {...rest}
      style={[{ fontSize: size, fontWeight: weight, color: color || colors.text }, style]}
    >
      {children}
    </Text>
  );
};

export default React.memo(ThemedText);
