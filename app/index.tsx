import React, { useCallback, useEffect, useState } from 'react';

import * as Localization from 'expo-localization';
import * as SystemUI from 'expo-system-ui';

import {
  LogBox,
  StatusBar,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from 'src/hooks/useAppData';
import { useThemeColors } from 'src/hooks/useThemeColors';
import 'src/i18n/i18n';
import TabBar from '../src/components/TabBar';
import { getDefaultCategories } from '../src/constants/categories';
import { AnalyticsView } from '../src/features/analytics';
import { CalendarView } from '../src/features/calendar';
import { ProjectsView } from '../src/features/projects';
import type { CategoryMap, EventItem, Project, TabKey } from '../src/types';


// Header component moved to src/components/Header.tsx

// types moved to src/types/index.ts

// TabBar component moved to src/components/TabBar.tsx

// Suppress known SafeAreaView deprecation warnings from third-party modules
LogBox.ignoreLogs(["SafeAreaView has been deprecated"]);

const getInitialLanguage = (): string => {
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const primary = locales[0];
      const languageCode = (primary.languageCode || '').toLowerCase();
      if (languageCode.startsWith('zh')) return 'zh';
    }
  } catch {
    // ignore
  }
  return 'en'; // Default fallback
};

const App: React.FC = () => {
  const { colors, isDark } = useThemeColors();
  const [activeTab, setActiveTab] = useState<TabKey>('calendar');
  const [selectedColorScheme, setSelectedColorScheme] = useState('default');
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<CategoryMap>({});

  // Initialize data persistence
  const handleDataLoaded = useCallback(() => {
    setCategories(prev => {
      return Object.keys(prev).length === 0 ? getDefaultCategories(getInitialLanguage()) : prev;
    });
  }, []);

  useAppData(projects, events, categories, setProjects, setEvents, setCategories, handleDataLoaded);

  // 当主题颜色变化时，同步原生根视图的背景色（避免切出/切回出现白条）
  useEffect(() => {
    const setRootBackground = async () => {
      try {
        await SystemUI.setBackgroundColorAsync(colors.background);
      } catch (e) {
        // ignore if SystemUI is unavailable
      }
    };
    setRootBackground();
  }, [colors.background]);

  let content: React.ReactNode;
  if (activeTab === 'calendar') {
    content = (
      <CalendarView
        events={events}
        setEvents={setEvents}
        projects={projects}
        setProjects={setProjects}
        categories={categories}
        setCategories={setCategories}
        selectedColorScheme={selectedColorScheme}
        colors={colors}
      />
    );
  } else if (activeTab === 'analytics') {
    content = <AnalyticsView projects={projects} events={events} categories={categories} selectedColorScheme={selectedColorScheme} setProjects={setProjects} setCategories={setCategories} colors={colors} />;
  } else {
    content = <ProjectsView projects={projects} events={events} categories={categories} setProjects={setProjects} setCategories={setCategories} setEvents={setEvents} selectedColorScheme={selectedColorScheme} setSelectedColorScheme={setSelectedColorScheme} onGoToCalendar={() => setActiveTab('calendar')} colors={colors} />;
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.background }}>
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.appContainer, { backgroundColor: colors.background }]}>
        

        <View style={{ flex: 1 }}>{content}</View>

        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} colors={colors} />
      </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default App;

// --- STYLES ---

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  appContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
