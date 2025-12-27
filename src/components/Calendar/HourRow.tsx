import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Props = {
  hour: number;
  pixelsPerMinute: number;
  colors: any;
  onSlotPress: (hour: number, minute: number) => void;
};

const HourRow: React.FC<Props> = ({ hour, pixelsPerMinute, colors, onSlotPress }) => {
  return (
    <View
      key={hour}
      style={[
        { height: 60 * pixelsPerMinute, borderColor: colors.border, flexDirection: 'row' },
      ]}
    >
      <View style={{ width: 56, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 12 }}>
        <Text style={{ color: colors.textQuaternary }}>{`${hour}:00`}</Text>
      </View>
      <View style={{ flex: 1, borderTopWidth: 1, borderTopColor: colors.chartGrid }}>
        <Pressable
          style={{ flex: 1 }}
          onPress={(e) => {
            const locationY = e.nativeEvent.locationY;
            let minutesInHour = Math.round((locationY / 60) * 60);
            minutesInHour = Math.round(minutesInHour / 5) * 5;
            minutesInHour = Math.min(59, Math.max(0, minutesInHour));
            onSlotPress(hour, minutesInHour);
          }}
        />
      </View>
    </View>
  );
};

export default React.memo(HourRow);
