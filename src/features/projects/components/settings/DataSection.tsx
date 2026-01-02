import { Trash2 } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppThemeColors } from '../../../../hooks/useThemeColors';

type Props = {
  onImport: () => void;
  onExport: () => void;
  onClear: () => void;
  colors: AppThemeColors;
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

export const DataSection: React.FC<Props> = ({ onImport, onExport, onClear, colors }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.stack}>
      <Pressable
        onPress={onImport}
        style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[styles.buttonText, { color: colors.text }]}>{t('projects.importData')}</Text>
        <Text style={[styles.iconText, { color: colors.text }]}>↑</Text>
      </Pressable>
      <Pressable
        onPress={onExport}
        style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[styles.buttonText, { color: colors.text }]}>{t('projects.exportData')}</Text>
        <Text style={[styles.iconText, { color: colors.text }]}>↓</Text>
      </Pressable>
      <Pressable
        onPress={onClear}
        style={[styles.button, styles.danger, { backgroundColor: colors.error }]}
      >
        <Text style={[styles.buttonText, { color: colors.accentText }]}>{t('projects.clearAllData')}</Text>
        <Trash2 size={18} color={colors.accentText} />
      </Pressable>
    </View>
  );
};

export default DataSection;
