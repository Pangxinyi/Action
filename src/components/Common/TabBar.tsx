import { AppThemeColors } from '@hooks/useThemeColors';
import React from 'react';
import { View } from 'react-native';
import ThemedText from './ThemedText';
import Button from './Button';

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
      <Button onPress={() => setActiveTab(key)} variant="ghost" style={{ alignItems: 'center', padding: 8 }}>
        <Icon size={24} strokeWidth={active ? 2.5 : 2} color={active ? colors.tabActive : colors.tabInactive} />
        <ThemedText style={{ color: active ? colors.tabActive : colors.tabInactive }}>{label}</ThemedText>
      </Button>
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

