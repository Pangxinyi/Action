import React from 'react';
import { View, Text } from 'react-native';
import { useData } from '../context/DataContext';

const ProjectsScreen: React.FC = () => {
  const { categories } = useData();
  return (
    <View style={{ flex: 1 }}>
      <Text>Projects Screen - {Object.keys(categories).length} categories</Text>
    </View>
  );
};

export default ProjectsScreen;
