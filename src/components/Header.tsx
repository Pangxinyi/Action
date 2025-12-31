import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { HeaderProps } from '../types';

const Header: React.FC<HeaderProps> = ({ title, subtitle, leftIcon, rightIcon, colors }) => {
  return (
    <View style={[styles.header, colors && { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.headerLeft}>
        {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
        <View>
          <Text style={[styles.headerTitle, colors && { color: colors.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.headerSubtitle, colors && { color: colors.textTertiary }]}>{subtitle}</Text> : null}
        </View>
      </View>
      {rightIcon && <View>{rightIcon}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default Header;
