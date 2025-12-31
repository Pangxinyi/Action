import type { AppThemeColors } from '@hooks/useThemeColors';
import { X } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type ModalHeaderProps = {
  title?: string;
  titleNode?: React.ReactNode;
  subtitle?: string;
  onClose: () => void;
  rightElement?: React.ReactNode;
  colors: AppThemeColors;
};

export const ModalHeader: React.FC<ModalHeaderProps> = ({ title, titleNode, subtitle, onClose, rightElement, colors }) => {
  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}> 
      <View style={{ flex: 1, marginRight: 12 }}>
        {titleNode ? (
          titleNode
        ) : (
          <>
            {title ? <Text style={[styles.title, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">{title}</Text> : null}
            {subtitle ? <Text style={[styles.subtitle, { color: colors.textTertiary }]} numberOfLines={1} ellipsizeMode="tail">{subtitle}</Text> : null}
          </>
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {rightElement}
        <Pressable
          style={[styles.iconButton, { backgroundColor: colors.backgroundTertiary }]}
          onPress={onClose}
        >
          <X size={20} color={colors.textTertiary} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  iconButton: {
    padding: 6,
    borderRadius: 999,
  },
});

export default ModalHeader;
