import type { AppThemeColors } from '@hooks/useThemeColors';
import type React from 'react';

export type CategoryMap = {
  [categoryName: string]: string;
};

export type Project = {
  id: number;
  name: string;
  time: string;
  percent: number;
  hexColor: string;
  category: string | null;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  archived?: boolean;
  newCategoryName?: string;
  newCategoryColor?: string;
};

export type EventItem = {
  id: number;
  title?: string;
  start: number;
  duration: number;
  hexColor: string;
  details?: string;
  category?: string;
  date: string;
  projectId?: number;
};

export type DraftEvent = {
  id: number | null;
  start: number;
  end: number;
  selectedProjectId: number | null;
  isNewProject: boolean;
  newProjectName: string;
  newProjectPercent: number;
  details?: string;
  category?: string;
  title?: string;
  date: string;
  projectId?: number;
  isNewCategory?: boolean;
  newCategoryName?: string;
  newCategoryColor?: string;
};

export type HeaderProps = {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  colors?: AppThemeColors;
};

export type TabKey = 'calendar' | 'analytics' | 'projects';

export type CalendarViewProps = {
  events: EventItem[];
  setEvents: React.Dispatch<React.SetStateAction<EventItem[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  categories: CategoryMap;
  setCategories: React.Dispatch<React.SetStateAction<CategoryMap>>;
  selectedColorScheme: string;
  colors: AppThemeColors;
};

export type AnalyticsViewProps = {
  projects: Project[];
  events: EventItem[];
  categories: CategoryMap;
  selectedColorScheme: string;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setCategories: React.Dispatch<React.SetStateAction<CategoryMap>>;
  colors: AppThemeColors;
};

export type TimeRangeType = '30d' | '90d' | 'year';

export type ProjectDataPoint = {
  id: number;
  name: string;
  category: string | null;
  color: string;
  durationHours: number;
  share: number;
  accumulation: number;
  recentActivity: number;
  x: number;
  y: number;
};

export type ProjectsViewProps = {
  projects: Project[];
  events: EventItem[];
  categories: CategoryMap;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setCategories: React.Dispatch<React.SetStateAction<CategoryMap>>;
  setEvents: React.Dispatch<React.SetStateAction<EventItem[]>>;
  selectedColorScheme: string;
  setSelectedColorScheme: React.Dispatch<React.SetStateAction<string>>;
  onGoToCalendar?: () => void;
  colors: AppThemeColors;
};
