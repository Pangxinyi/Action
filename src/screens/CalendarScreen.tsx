import React from 'react';
import { View, Text } from 'react-native';
import { useData } from '../context/DataContext';

const CalendarScreen: React.FC = () => {
  const { events } = useData();
  return (
    <View style={{ flex: 1 }}>
      <Text>Calendar Screen - {events.length} events</Text>
    </View>
  );
};

export default CalendarScreen;
