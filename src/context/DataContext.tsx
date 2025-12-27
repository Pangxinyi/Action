import React, { createContext, useContext, useState } from 'react';
import { useAppData } from '../../hooks/useAppData';

type Project = any;
type EventItem = any;

type DataContextType = {
  projects: Project[];
  setProjects: (p: Project[] | ((p: Project[]) => Project[])) => void;
  events: EventItem[];
  setEvents: (e: EventItem[] | ((e: EventItem[]) => EventItem[])) => void;
  categories: { [key: string]: string };
  setCategories: (c: { [key: string]: string } | ((c: { [key: string]: string }) => { [key: string]: string })) => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<{ [key: string]: string }>({});

  // reuse existing hook to load/save
  useAppData(projects, events, categories, setProjects, setEvents, setCategories);

  return (
    <DataContext.Provider value={{ projects, setProjects, events, setEvents, categories, setCategories }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
