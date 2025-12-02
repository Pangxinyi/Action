/**
 * Example Usage of ClusterView
 * 
 * This demonstrates how to integrate the Gravity Clusters visualization
 * into your existing app structure.
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Category, ClusterView, Project } from './ClusterView';

export const ClusterViewExample: React.FC = () => {
  // Sample categories with positions
  const [categories] = useState<Category[]>([
    {
      id: 'work',
      name: 'Work',
      color: '#3B82F6',
      center: { x: 150, y: 200 },
    },
    {
      id: 'learning',
      name: 'Learning',
      color: '#8B5CF6',
      center: { x: 300, y: 200 },
    },
    {
      id: 'health',
      name: 'Health',
      color: '#10B981',
      center: { x: 225, y: 350 },
    },
  ]);

  // Sample projects
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'p1',
      name: 'App Design',
      percent: 75,
      categoryId: 'work',
    },
    {
      id: 'p2',
      name: 'Backend API',
      percent: 100,
      categoryId: 'work',
    },
    {
      id: 'p3',
      name: 'React Course',
      percent: 45,
      categoryId: 'learning',
    },
    {
      id: 'p4',
      name: 'TypeScript',
      percent: 100,
      categoryId: 'learning',
    },
    {
      id: 'p5',
      name: 'Morning Run',
      percent: 30,
      categoryId: 'health',
    },
  ]);

  const handleCategoryChange = (projectId: string, categoryId: string | null) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, categoryId } : p
      )
    );
    console.log(`Project ${projectId} moved to category ${categoryId}`);
  };

  return (
    <View style={styles.container}>
      <ClusterView
        categories={categories}
        projects={projects}
        onProjectCategoryChange={handleCategoryChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
