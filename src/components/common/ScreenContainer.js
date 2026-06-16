import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

export default function ScreenContainer({ children, style }) {
  const { colors, isDark } = useTheme();
  
  const gradientColors = isDark 
    ? ['#000000', '#0A0A0A'] 
    : ['#FFFFFF', '#F8F8F8'];
  
  const backgroundColor = isDark ? '#000000' : '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
