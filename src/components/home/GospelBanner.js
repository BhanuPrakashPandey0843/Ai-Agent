import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeTheme } from '../../theme/homeTheme';

const H = HomeTheme;

export default function GospelBanner({ onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.wrap}>
      <LinearGradient
        colors={['#1a2848', '#2d4a8c', '#558AFF', '#1a2848']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <MaterialCommunityIcons
          name="cross"
          size={56}
          color="rgba(255,255,255,0.15)"
          style={styles.watermark}
        />
        <View style={styles.content}>
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons name="book-open-page-variant" size={26} color={H.primary} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.title}>Jesus & The Gospel</Text>
            <Text style={styles.sub}>Discover Christ-centered wallpapers & verses</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={26} color="rgba(255,255,255,0.8)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 24,
    overflow: 'hidden',
    ...H.shadow,
  },
  gradient: {
    height: 132,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  watermark: {
    position: 'absolute',
    right: 24,
    top: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    zIndex: 1,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1 },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 18,
  },
});
