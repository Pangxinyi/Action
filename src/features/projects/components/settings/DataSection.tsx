import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppThemeColors } from '../../../../hooks/useThemeColors';

type Props = {
  onImport: () => void;
  onExport: () => void;
  colors: AppThemeColors;
  isOpen: boolean;
  onToggle: () => void;
};

const styles = StyleSheet.create({
  stack: {
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  iconText: {
    fontSize: 20,
  },
  danger: {
    borderWidth: 0,
  },
});

export const DataSection: React.FC<Props> = ({ onImport, onExport, colors, isOpen, onToggle }) => {
  const { t } = useTranslation();

  return (
    <View>
      <Pressable
        onPress={onToggle}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: isOpen ? 12 : 0 }}
      >
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {t('projects.dataManagement')}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textTertiary }}>{isOpen ? '▼' : '▶'}</Text>
      </Pressable>

      {isOpen && (
        <View style={styles.stack}>
          <Pressable
            onPress={onImport}
            style={[styles.button, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>{t('projects.importData')}</Text>
            <Text style={[styles.iconText, { color: colors.text }]}>↑</Text>
          </Pressable>
          <Pressable
            onPress={onExport}
            style={[styles.button, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>{t('projects.exportData')}</Text>
            <Text style={[styles.iconText, { color: colors.text }]}>↓</Text>
          </Pressable>
          {/* Clear All Data removed */}
        </View>
      )}
    </View>
  );
};

export default DataSection;
