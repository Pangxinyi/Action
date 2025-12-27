import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { AppThemeColors } from '@hooks/useThemeColors';

type TabKey = 'calendar' | 'analytics' | 'projects';

type Props = {
  activeTab: TabKey;
  setActiveTab: (t: TabKey) => void;
  colors: AppThemeColors;
  t: (k: string) => string;
  Icons: { Calendar: any; PieChart: any; Network: any };
};

const TabBar: React.FC<Props> = ({ activeTab, setActiveTab, colors, t, Icons }) => {
  const mkTab = (key: TabKey, label: string, Icon: any) => {
    const active = activeTab === key;
    return (
      <Pressable style={{ alignItems: 'center', padding: 8 }} onPress={() => setActiveTab(key)}>
        <Icon size={24} strokeWidth={active ? 2.5 : 2} color={active ? colors.tabActive : colors.tabInactive} />
        <Text style={{ color: active ? colors.tabActive : colors.tabInactive }}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.tabBar, borderTopWidth: 1, borderColor: colors.border }}>
      {mkTab('calendar', t('tabs.calendar'), Icons.Calendar)}
      {mkTab('analytics', t('tabs.analytics'), Icons.PieChart)}
      {mkTab('projects', t('tabs.projects'), Icons.Network)}
    </View>
  );
};

export default React.memo(TabBar);

