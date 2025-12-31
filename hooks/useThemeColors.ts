import { ThemeColors } from '@constants/theme';
import { useColorScheme } from 'react-native';

/**
 * Custom hook that returns theme colors based on the current system color scheme.
 * Automatically switches between light and dark themes.
 */
export function useThemeColors() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return {
    colors: isDark ? ThemeColors.dark : ThemeColors.light,
    isDark,
    colorScheme,
  };
}

/**
 * Type for the theme colors object
 */
export type AppThemeColors = typeof ThemeColors.light;

