import { useThemeColors } from '@hooks/useThemeColors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  message: React.ReactNode | string;
  icon?: React.ReactNode;
  actionButton?: React.ReactNode;
  // If true the component will expand to fill available space and center vertically
  fullScreen?: boolean;
  // Optional style override for the container
  style?: any;
  // Optional override for colors; if not provided the hook will be used
  colors?: ReturnType<typeof useThemeColors>['colors'];
};

export const EmptyState: React.FC<Props> = ({ message, icon, actionButton, fullScreen = true, style, colors: colorsProp }) => {
  const hook = useThemeColors();
  const colors = colorsProp || hook.colors;

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, style]}>
      {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
      <Text style={[styles.message, { color: colors.textTertiary }]}>{message}</Text>
      {actionButton ? <View style={styles.action}>{actionButton}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: 12,
  },
  message: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  action: {
    marginTop: 8,
  },
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default EmptyState;
