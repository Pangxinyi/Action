import React from 'react';
import { View, Text } from 'react-native';
import { useData } from '../context/DataContext';

const AnalyticsScreen: React.FC = () => {
  const { projects } = useData();
  return (
    <View style={{ flex: 1 }}>
      <Text>Analytics Screen - {projects.length} projects</Text>
    </View>
  );
};

export default AnalyticsScreen;
