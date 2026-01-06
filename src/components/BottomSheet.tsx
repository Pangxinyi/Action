import { BlurView } from 'expo-blur';
import React, { ReactNode } from 'react';
import { DimensionValue, Modal, Pressable, StyleSheet } from 'react-native';

import { useThemeColors } from '../hooks/useThemeColors';

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Optional fixed height. If not provided, height will adapt to content with maxHeight of 90% */
  height?: DimensionValue;
  children: ReactNode;
  /** Set to 0 when using ModalHeader inside */
  paddingTop?: number;
};

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  height,
  children,
  paddingTop = 12,
}) => {
  const { colors, isDark } = useThemeColors();

  return (
    <Modal 
      visible={isOpen} 
      transparent 
      animationType="slide"
      statusBarTranslucent
    >
      <Pressable
        style={styles.overlay}
        onPress={onClose}
      >
        <BlurView 
          style={StyleSheet.absoluteFill} 
          tint={isDark ? 'dark' : 'light'} 
          intensity={20} 
        />
        
        {/* 
           修复核心：移除 onStartShouldSetResponder 和 onResponderRelease，
           仅保留 onPress 拦截冒泡，这样既能拦截点击（不关闭），
           又不会拦截滑动（让 ScrollView 滚动）。
        */}
        <Pressable
          style={[
            styles.content,
            {
              backgroundColor: colors.surface,
              paddingTop,
              ...(height ? { height } : { maxHeight: '90%' })
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {children}
        </Pressable>
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
    overflow: 'hidden',
    width: '100%',
  },
});