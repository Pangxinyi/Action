import type { AppThemeColors } from '@hooks/useThemeColors';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Option = { key: string; label: string };

type Props = {
  options: Option[];
  value: string;
  onChange: (key: string) => void;
  colors?: AppThemeColors;
};

const SegmentedControl: React.FC<Props> = ({ options, value, onChange, colors }) => {
    return (
      <View style={[styles.container, colors && { backgroundColor: colors.backgroundTertiary }]}> 
        {options.map((opt) => {
          const active = value === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onChange(opt.key)}
              style={[
                styles.item,
                active && [styles.itemActive, colors && { backgroundColor: colors.surface }],
              ]}
            >
              <Text style={[styles.text, colors && { color: colors.textTertiary }, active && [styles.textActive, colors && { color: colors.text }]]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: '#E5E7EB',
      borderRadius: 999,
      padding: 2,
      marginBottom: 16,
    },
    item: {
      flex: 1,
      paddingVertical: 6,
      borderRadius: 999,
      alignItems: 'center',
    },
    itemActive: {
      backgroundColor: '#FFFFFF',
    },
    text: {
      fontSize: 13,
      color: '#6B7280',
      fontWeight: '600',
    },
    textActive: {
      color: '#111827',
    },
  });

  export default SegmentedControl;
