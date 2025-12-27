import React from 'react';
import { View, Text } from 'react-native';

export type EventCardProps = {
  id: number | string;
  title?: string;
  start?: number;
  duration?: number;
  color?: string;
  height?: number;
};

const EventCard: React.FC<EventCardProps> = ({ title }) => {
  return (
    <View>
      <Text numberOfLines={1} ellipsizeMode="tail">{title}</Text>
    </View>
  );
};

export default React.memo(EventCard);
