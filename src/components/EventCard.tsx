import type { AppThemeColors } from '@hooks/useThemeColors';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { EventItem, Project } from '../types';
import { formatMinutes } from '../utils/date';

type Props = {
  event: EventItem;
  layout: { top: number; height: number };
  colors: AppThemeColors;
  projects?: Project[];
  styles: any; // parent styles object (keeps original styling)
  onPress: (e: EventItem) => void;
};

export const EventCard = React.memo(function EventCard({ event, layout, colors, projects, styles, onPress }: Props) {
  const { top, height } = layout;
  const cardHeight = Math.max(20, height);
  const showOnlyTitle = cardHeight <= 28;
  const showTitleAndTime = cardHeight > 28 && cardHeight <= 44;
  const showAll = cardHeight > 44;

  const eventColor = event.hexColor || '#000000';

  const linkedProject = event.projectId ? projects?.find(p => p.id === event.projectId) : undefined;

  return (
    <Pressable
      onPress={() => onPress(event)}
      style={[
        styles.eventCard,
        {
          top,
          height: cardHeight,
          backgroundColor: `${eventColor}99`,
          borderLeftColor: eventColor,
        },
      ]}
    >
      <Text
        style={[styles.eventTitle, { color: colors.text }]}
        numberOfLines={showOnlyTitle ? 1 : showTitleAndTime ? 1 : 2}
        ellipsizeMode="tail"
      >
        {event.details || event.title || ''}
      </Text>

      {(showTitleAndTime || showAll) && (
        <Text style={[styles.eventTime, { color: colors.textSecondary }]}> 
          {formatMinutes(event.start)} - {formatMinutes(event.start + event.duration)}
        </Text>
      )}

      {showAll && linkedProject && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: linkedProject.hexColor, marginRight: 8 }} />
          <Text style={{ fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>{linkedProject.name}</Text>
        </View>
      )}
    </Pressable>
  );
});

 
