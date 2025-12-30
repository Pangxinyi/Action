import React, { createContext, useCallback, useContext, useState } from 'react';
import { useAppData } from '../../hooks/useAppData';

type Project = any;
type EventItem = any;

type DataContextType = {
  projects: Project[];
  events: EventItem[];
  categories: { [key: string]: string };
  addEvent: (payload: Omit<EventItem, 'id'>) => void;
  updateEvent: (id: number | string, payload: Partial<EventItem>) => void;
  deleteEvent: (id: number | string) => void;
  setProjects: (p: Project[] | ((p: Project[]) => Project[])) => void;
  setCategories: (c: { [key: string]: string } | ((c: { [key: string]: string }) => { [key: string]: string })) => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<{ [key: string]: string }>({});

  // reuse existing hook to load/save
  useAppData(projects, events, categories, setProjects, setEvents, setCategories);

  const addEvent = useCallback((payload: Omit<EventItem, 'id'>) => {
    setEvents((prev) => [...prev, { id: Date.now(), ...payload }]);
  }, []);

  const updateEvent = useCallback((id: number | string, payload: Partial<EventItem>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...payload } : e)));
  }, []);

  const deleteEvent = useCallback((id: number | string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <DataContext.Provider value={{ projects, events, categories, addEvent, updateEvent, deleteEvent, setProjects, setCategories }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
