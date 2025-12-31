import type { AppThemeColors } from '@hooks/useThemeColors';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  onPress: () => void;
  label: string;
  colors?: AppThemeColors;
};

const PrimaryButton: React.FC<Props> = ({ onPress, label, colors }) => {
  return (
    <Pressable style={[styles.primaryButton, colors && { backgroundColor: colors.primary }]} onPress={onPress}>
      <Text style={[styles.primaryButtonText, colors && { color: colors.primaryText }]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default PrimaryButton;
