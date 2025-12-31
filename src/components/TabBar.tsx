import type { AppThemeColors } from '@hooks/useThemeColors';
import { Calendar as CalendarIcon, Network, PieChart } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TabKey } from '../types';

type Props = {
  activeTab: TabKey;
  setActiveTab: (t: TabKey) => void;
  colors: AppThemeColors;
};

const TabBar: React.FC<Props> = ({ activeTab, setActiveTab, colors }) => {
  const { t } = useTranslation();
  const mkTab = (key: TabKey, label: string, Icon: any) => {
    const active = activeTab === key;
    return (
      <Pressable style={styles.tabItem} onPress={() => setActiveTab(key)}>
        <Icon size={24} strokeWidth={active ? 2.5 : 2} color={active ? colors.tabActive : colors.tabInactive} />
        <Text style={[styles.tabLabel, { color: active ? colors.tabActive : colors.tabInactive }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.tabBar, borderColor: colors.border }]}> 
      {mkTab('calendar', t('tabs.calendar'), CalendarIcon)}
      {mkTab('analytics', t('tabs.analytics'), PieChart)}
      {mkTab('projects', t('tabs.projects'), Network)}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 52,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 6,
    marginBottom: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});

export default TabBar;
