import React, { ReactNode } from 'react';
import { DimensionValue, Modal, Pressable, StyleSheet, View } from 'react-native';

import { useThemeColors } from '@hooks/useThemeColors';

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  height?: DimensionValue;
  children: ReactNode;
};

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  height = '80%',
  children,
}) => {
  const { colors } = useThemeColors();

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <Pressable
        style={[styles.overlay, { backgroundColor: colors.modalBackdrop }]}
        onPress={onClose}
      >
        <View
          style={[
            styles.content,
            { backgroundColor: colors.surface, height },
          ]}
          onStartShouldSetResponder={() => true}
          onResponderRelease={() => {}}
        >
          {children}
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    overflow: 'hidden',
  },
});