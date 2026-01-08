// src/constants/theme.ts

// 1. 核心常量 (来自你的新版本，逻辑必须)
export const COLOR_THEMES = {
  default: ['#BFA2DB', '#879DE2', '#A8E6CF', '#E6B8B7', '#E6C8DC', '#EFD9CE'],
  seaside: [ '#3698BF', '#D9D3B4', '#D97C2B', '#ac3c2dff', '#FADB85', '#8F9779'],
  twilight: ['#9FA6C8', '#8DAA91', '#D9A6A1', '#4C8C94', '#7F7B99', '#E3C98D'],
  garden: ['#4BC4D5', '#F3989F', '#89C764', '#FCD45E', '#D98A69', '#446E9B'],
  vivid:["#3A86FF", "#F72545","#FFBE0B","#06D6A0","#8338EC","#FB5607"],
  mineral: ["#C83C23", "#2E8B57", "#265C87","#D9A033","#9D7592","#E67E22"],
} as const;

export const NODE_SIZE = 72;
export const TIME_STEP_MIN = 1;


const tintColorLight = '#000000'; 
const tintColorDark = '#fff';

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
    
    // Primary actions (重要：恢复为黑色)
    primary: '#000000', 
    primaryText: '#FFFFFF',
    
    // Accent colors (用于选中状态，保持蓝色或者用原版配置)
    accent: '#0a7ea4', // Expo 蓝，或者你可以改成 '#000000'
    accentLight: '#E0F2FE',
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
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    
    // Modal
    modalBackdrop: 'rgba(0,0,0,0.4)',
    
    // Chart
    chartGrid: '#E5E7EB',
    chartLabel: '#9CA3AF',
    
    // Icons
    icon: '#687076',
    tint: tintColorLight,
  },
  dark: {
    // Background colors
    background: '#000000',
    backgroundSecondary: '#1A1A1A',
    backgroundTertiary: '#262626',
    
    // Surface colors
    surface: '#000000',
    surfaceSecondary: '#0A0A0A',
    surfaceHover: '#333333',
    surfacePressed: '#404040',
    
    // Text colors
    text: '#F9FAFB',
    textSecondary: '#E5E7EB',
    textTertiary: '#9CA3AF',
    textQuaternary: '#6B7280',
    textInverse: '#111827',
    
    // Border colors
    border: '#0A0A0A',
    borderSecondary: '#111111',
    borderFocus: '#FFFFFF',
    
    // Primary actions
    primary: '#FFFFFF',
    primaryText: '#111827',
    
    // Accent colors
    accent: '#38BDF8',
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
    tabBar: '#000000',
    tabInactive: '#6B7280',
    tabActive: '#FFFFFF',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    
    // Modal
    modalBackdrop: 'rgba(0,0,0,0.7)',
    
    // Chart
    chartGrid: '#333333',
    chartLabel: '#6B7280',
    
    // Icons
    icon: '#9BA1A6',
    tint: tintColorDark,
  },
};

// 导出类型，方便 TS 推断
export type ThemeColorKey = keyof typeof ThemeColors.light;