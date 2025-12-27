import React from 'react';
import { View, Text } from 'react-native';

export type HourRowProps = {
  hour: number;
};

const HourRow: React.FC<HourRowProps> = ({ hour }) => (
  <View>
    <Text>{`${hour}:00`}</Text>
  </View>
);

export default React.memo(HourRow);
