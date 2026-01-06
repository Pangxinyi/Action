import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppThemeColors } from '../hooks/useThemeColors';
import type { EventItem, Project } from '../types';
import { formatMinutes } from '../utils/date';

type Props = {
  event: EventItem;
  layout: { top: number; height: number };
  colors: AppThemeColors;
  projects?: Project[];
  onPress: (e: EventItem) => void;
};

export const EventCard = React.memo(function EventCard({ event, layout, colors, projects, onPress }: Props) {
  const { top, height } = layout;
  const cardHeight = Math.max(20, height);

  // Adjusted thresholds for compact display
  const isTinyCard = cardHeight < 30;
  const isStandardCard = cardHeight >= 50;

  const eventColor = event.hexColor || '#000000';
  const linkedProject = event.projectId ? projects?.find(p => p.id === event.projectId) : undefined;

  return (
    <Pressable
      onPress={() => onPress(event)}
      style={[
        styles.card,
        {
          top,
          height: cardHeight,
          backgroundColor: `${eventColor}99`,
          borderLeftColor: eventColor,
        },
      ]}
    >
      {/* Title */}
      <Text
        style={[styles.title, { color: colors.text }]}
        numberOfLines={isStandardCard && cardHeight > 80 ? 2 : 1} // Allow 2 lines for title if height > 80
        ellipsizeMode="tail"
      >
        {event.details || event.title || ''}
      </Text>

      {/* Time */}
      {!isTinyCard && (
        <Text style={[styles.time, { color: colors.textSecondary }]}> 
          {formatMinutes(event.start)} - {formatMinutes(event.start + event.duration)}
        </Text>
      )}

      {/* Project */}
      {isStandardCard && linkedProject && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: linkedProject.hexColor,
              marginRight: 8,
            }}
          />
          <Text style={{ fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>
            {linkedProject.name}
          </Text>
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 60,
    right: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
  },
  time: {
    fontSize: 10,
  },
});


