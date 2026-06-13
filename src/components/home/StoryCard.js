

// src/components/home/StoryCard.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme/colors';

const StoryCard = ({
  item,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.container}
    >
      <LinearGradient
        colors={Colors.gradientGlass}
        style={styles.card}
      >
        <View style={styles.imageContainer}>
          {item.thumbnail ? (
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={['#1A1A22', '#14141A']}
              style={styles.image}
            >
              <Ionicons name="book-outline" size={40} color={Colors.primary} />
            </LinearGradient>
          )}
        </View>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.button}
        >
          <LinearGradient
            colors={Colors.gradientPrimary}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>Read</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  button: {
    width: 70,
  },
  gradientButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
    color: Colors.white,
  },
});

export default StoryCard;
