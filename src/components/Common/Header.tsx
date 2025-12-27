import React from 'react';
import { Text, View } from 'react-native';

export type HeaderProps = { title: string; subtitle?: string };

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => (
  <View>
    <Text>{title}</Text>
    {subtitle ? <Text>{subtitle}</Text> : null}
  </View>
);

export default Header;
