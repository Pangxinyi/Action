import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface ColorPickerProps {
  colors: readonly string[];
  selectedColor?: string;
  onSelect: (color: string) => void;
  size?: number;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ colors, selectedColor, onSelect, size = 32 }) => {
  return (
    <View style={styles.container}>
      {colors.map((color) => (
        <Pressable
          key={color}
          onPress={() => onSelect(color)}
          style={({ pressed }) => [
            styles.dot,
            { backgroundColor: color, width: size, height: size, borderRadius: size / 2 },
            selectedColor === color && styles.active,
            pressed && { opacity: 0.8 },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  dot: { width: 32, height: 32, borderRadius: 16 },
  active: { borderWidth: 3, borderColor: '#000' },
});

export default ColorPicker;
