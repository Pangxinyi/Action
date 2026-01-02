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

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#0a7ea4',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
};

export const ThemeColors = {
  light: {
    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
    backgroundTertiary: '#F3F4F6',
    surface: '#FFFFFF',
    surfaceSecondary: '#F9FAFB',
    
    // Text colors
    text: '#11181C',
    textSecondary: '#4B5563',
    textTertiary: '#6B7280',
    textQuaternary: '#9CA3AF',
    textInverse: '#FFFFFF',
    
    // Accent colors
    accent: '#0a7ea4',
    accentLight: '#E0F2FE',
    accentText: '#FFFFFF',
    
    // Primary colors
    primary: '#0a7ea4',
    primaryText: '#FFFFFF',
    
    // Status colors
    error: '#DC2626',
    errorLight: '#FEE2E2',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    success: '#10B981',
    successLight: '#D1FAE5',
    
    // Border & divider
    border: '#E5E7EB',
    divider: '#E5E7EB',
    
    // Chart colors
    chartGrid: '#E5E7EB',
    chartLabel: '#6B7280',
    
    // Modal
    modalBackdrop: 'rgba(0, 0, 0, 0.5)',
    
    // Tab bar
    tabBar: '#FFFFFF',
    tabActive: '#0a7ea4',
    tabInactive: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
  },
  dark: {
    // Backgrounds
    background: '#151718',
    backgroundSecondary: '#1F2123',
    backgroundTertiary: '#2A2C2E',
    surface: '#1F2123',
    surfaceSecondary: '#2A2C2E',
    
    // Text colors
    text: '#ECEDEE',
    textSecondary: '#D1D5DB',
    textTertiary: '#9CA3AF',
    textQuaternary: '#6B7280',
    textInverse: '#11181C',
    
    // Accent colors
    accent: '#38BDF8',
    accentLight: '#1E3A5F',
    accentText: '#11181C',
    
    // Primary colors
    primary: '#38BDF8',
    primaryText: '#11181C',
    
    // Status colors
    error: '#EF4444',
    errorLight: '#451A1A',
    warning: '#FBBF24',
    warningLight: '#3D2F0A',
    success: '#34D399',
    successLight: '#0D3025',
    
    // Border & divider
    border: '#374151',
    divider: '#374151',
    
    // Chart colors
    chartGrid: '#374151',
    chartLabel: '#9CA3AF',
    
    // Modal
    modalBackdrop: 'rgba(0, 0, 0, 0.7)',
    
    // Tab bar
    tabBar: '#1F2123',
    tabActive: '#38BDF8',
    tabInactive: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#38BDF8',
  },
};
