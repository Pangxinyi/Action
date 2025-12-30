import React from 'react';
import { Pressable, View } from 'react-native';
import ThemedText from '../Common/ThemedText';

export type EventItem = {
  id: number;
  title?: string;
  start: number;
  duration: number;
  hexColor: string;
  details?: string;
  category?: string;
  date: string;
  projectId?: number;
};

type Props = {
  evt: EventItem;
  top: number;
  height: number;
  colors: any;
  projects: any[];
  onPress: (evt: EventItem) => void;
};

const formatMinutes = (total: number) => {
  const m = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

const EventCard: React.FC<Props> = ({ evt, top, height, colors, projects, onPress }) => {
  const cardHeight = Math.max(20, height);
  const showOnlyTitle = cardHeight <= 28;
  const showTitleAndTime = cardHeight > 28 && cardHeight <= 44;
  const showAll = cardHeight > 44;

  const linked = evt.projectId ? projects.find(p => p.id === evt.projectId) : null;

  return (
    <Pressable
      onPress={() => onPress(evt)}
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        top,
        height: cardHeight,
        backgroundColor: `${evt.hexColor || '#9CA3AF'}99`,
        borderLeftColor: evt.hexColor || '#9CA3AF',
        borderLeftWidth: 4,
        borderRadius: 8,
        padding: 8,
        overflow: 'hidden',
      }}
    >
      <ThemedText numberOfLines={showOnlyTitle ? 1 : showTitleAndTime ? 1 : 2} ellipsizeMode="tail" style={{ color: colors.text, fontWeight: '600' }}>
        {evt.details || evt.title}
      </ThemedText>

      {(showTitleAndTime || showAll) && (
        <ThemedText style={{ color: colors.textSecondary, marginTop: 2 }}>
          {formatMinutes(evt.start)} - {formatMinutes(evt.start + evt.duration)}
        </ThemedText>
      )}

      {showAll && linked && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: linked.hexColor, marginRight: 8 }} />
          <ThemedText numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 12 }}>{linked.name}</ThemedText>
        </View>
      )}
    </Pressable>
  );
};

export default React.memo(EventCard);
