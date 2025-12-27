import React from 'react';
import { View, Text, Pressable } from 'react-native';

export type TabBarProps = { active: string; onSelect: (k: string) => void };

const TabBar: React.FC<TabBarProps> = ({ active, onSelect }) => (
  <View style={{ flexDirection: 'row' }}>
    {['calendar','analytics','projects'].map((k) => (
      <Pressable key={k} onPress={() => onSelect(k)} style={{ padding: 8 }}>
        <Text style={{ fontWeight: active === k ? '700' : '400' }}>{k}</Text>
      </Pressable>
    ))}
  </View>
);

export default TabBar;
