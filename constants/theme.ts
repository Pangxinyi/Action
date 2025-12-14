/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Semantic Theme Colors for Light and Dark Mode
export const ThemeColors = {
  light: {
    // Background colors
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
    backgroundTertiary: '#F3F4F6',
    
    // Surface colors (cards, modals, etc.)
    surface: '#FFFFFF',
    surfaceSecondary: '#F9FAFB',
    surfaceHover: '#F3F4F6',
    surfacePressed: '#E5E7EB',
    
    // Text colors
    text: '#111827',
    textSecondary: '#374151',
    textTertiary: '#6B7280',
    textQuaternary: '#9CA3AF',
    textInverse: '#FFFFFF',
    
    // Border colors
    border: '#E5E7EB',
    borderSecondary: '#D1D5DB',
    borderFocus: '#000000',
    
    // Primary actions
    primary: '#000000',
    primaryText: '#FFFFFF',
    
    // Accent colors
    accent: '#3B82F6',
    accentLight: '#DBEAFE',
    accentText: '#FFFFFF',
    
    // Status colors
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    
    // Calendar specific
    nowLine: '#EF4444',
    eventCardBg: 'rgba(0,0,0,0.03)',
    
    // Tab bar
    tabBar: '#FFFFFF',
    tabInactive: '#6B7280',
    tabActive: '#000000',
    
    // Modal
    modalBackdrop: 'rgba(0,0,0,0.4)',
    
    // Chart
    chartGrid: '#E5E7EB',
    chartLabel: '#9CA3AF',
    
    // Safe area
    safeArea: '#111827',
  },
  dark: {
    // Background colors
    background: '#0F0F0F',
    backgroundSecondary: '#1A1A1A',
    backgroundTertiary: '#262626',
    
    // Surface colors (cards, modals, etc.)
    surface: '#1A1A1A',
    surfaceSecondary: '#262626',
    surfaceHover: '#333333',
    surfacePressed: '#404040',
    
    // Text colors
    text: '#F9FAFB',
    textSecondary: '#E5E7EB',
    textTertiary: '#9CA3AF',
    textQuaternary: '#6B7280',
    textInverse: '#111827',
    
    // Border colors
    border: '#333333',
    borderSecondary: '#404040',
    borderFocus: '#FFFFFF',
    
    // Primary actions
    primary: '#FFFFFF',
    primaryText: '#111827',
    
    // Accent colors
    accent: '#60A5FA',
    accentLight: '#1E3A5F',
    accentText: '#FFFFFF',
    
    // Status colors
    success: '#34D399',
    successLight: '#064E3B',
    warning: '#FBBF24',
    warningLight: '#78350F',
    error: '#F87171',
    errorLight: '#7F1D1D',
    
    // Calendar specific
    nowLine: '#F87171',
    eventCardBg: 'rgba(255,255,255,0.05)',
    
    // Tab bar
    tabBar: '#1A1A1A',
    tabInactive: '#6B7280',
    tabActive: '#FFFFFF',
    
    // Modal
    modalBackdrop: 'rgba(0,0,0,0.7)',
    
    // Chart
    chartGrid: '#333333',
    chartLabel: '#6B7280',
    
    // Safe area
    safeArea: '#000000',
  },
};

export type ThemeColorKey = keyof typeof ThemeColors.light;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
