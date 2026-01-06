import React from 'react';
import { KeyboardAwareScrollView, KeyboardAwareScrollViewProps } from 'react-native-keyboard-aware-scroll-view';

// 1. 使用库自带的 Props 类型，而不是 ScrollViewProps
export const KeyboardSafeScroll: React.FC<KeyboardAwareScrollViewProps> = (props) => {
  return (
    <KeyboardAwareScrollView
      // 默认配置
      enableOnAndroid={true}
      extraScrollHeight={20} 
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      // 透传所有其他属性 (包括 style, contentContainerStyle, children)
      {...props}
    />
  );
}; 