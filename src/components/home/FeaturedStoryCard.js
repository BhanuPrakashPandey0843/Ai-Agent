import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeTheme } from '../../theme/homeTheme';

const H = HomeTheme;

export default function FeaturedStoryCard({ story, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(story)}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      style={styles.card}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={story.colors}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.image}
        >
          <View style={styles.tag}>
            <Text style={styles.tagText}>{story.tag}</Text>
          </View>
          <MaterialCommunityIcons name={story.icon} size={40} color="rgba(255,255,255,0.92)" />
        </LinearGradient>
        <Text style={styles.title} numberOfLines={2}>
          {story.title}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: 168 },
  image: {
    width: 168,
    height: 148,
    borderRadius: 28,
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagText: { fontSize: 11, color: '#FFF', fontWeight: '600' },
  title: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '700',
    color: H.text,
    lineHeight: 20,
  },
});
