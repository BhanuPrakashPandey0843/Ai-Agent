import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Design reference: the original bowl was 86dp wide. Every other measurement
 * (icon circle, paddings, radii, font) is expressed relative to that width so the
 * bowl keeps the exact same proportions at any size.
 */
const BASE_WIDTH = 86;
const MIN_ITEM_WIDTH = 58;
const MAX_ITEM_WIDTH = 112;
const MIN_GAP = 10;
const MAX_GAP = 20;
const MIN_SCALE = 0.68;
const MAX_SCALE = 1.3;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Computes a responsive layout for the "Explore Faith" row so that all bowls fit
 * the available width (no horizontal overflow) on any phone or tablet.
 */
export function useCategoryRowLayout(count, horizontalPadding = 20) {
  const { width } = useWindowDimensions();
  const gap = clamp(Math.round(width * 0.03), MIN_GAP, MAX_GAP);
  const available = Math.max(width - horizontalPadding * 2, 0);
  const safeCount = Math.max(count, 1);
  const rawItemWidth = Math.floor((available - gap * (safeCount - 1)) / safeCount);
  const itemWidth = clamp(rawItemWidth, MIN_ITEM_WIDTH, MAX_ITEM_WIDTH);
  return { itemWidth, gap };
}

export default function CategoryBowl({ item, onPress, itemWidth = BASE_WIDTH }) {
  const width = Math.round(itemWidth);
  const scale = clamp(width / BASE_WIDTH, MIN_SCALE, MAX_SCALE);

  const circleSize = Math.round(52 * scale);
  const sizes = {
    item: { width },
    iconSlot: { marginBottom: -Math.round(14 * scale) },
    circle: {
      width: circleSize,
      height: circleSize,
      borderRadius: circleSize / 2,
      borderWidth: Math.max(2, Math.round(3 * scale)),
    },
    bowl: {
      width,
      paddingTop: Math.round(20 * scale),
      paddingBottom: Math.round(11 * scale),
      paddingHorizontal: Math.max(3, Math.round(4 * scale)),
      borderTopLeftRadius: Math.round(10 * scale),
      borderTopRightRadius: Math.round(10 * scale),
      borderBottomLeftRadius: Math.round(40 * scale),
      borderBottomRightRadius: Math.round(40 * scale),
    },
    label: { fontSize: Math.round(13 * clamp(scale, 0.88, 1.2)) },
  };

  return (
    <TouchableOpacity
      style={[styles.catItem, sizes.item]}
      onPress={() => onPress(item)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={item.label}
    >
      <View style={[styles.iconSlot, sizes.iconSlot]}>
        <View style={[styles.iconCircle, sizes.circle, { backgroundColor: item.bowl }]}>
          <MaterialCommunityIcons
            name={item.icon}
            size={Math.round(28 * scale)}
            color={item.iconColor}
          />
        </View>
      </View>
      <View style={[styles.bowl, sizes.bowl, { backgroundColor: item.bowl }]}>
        <Text
          style={[styles.label, sizes.label, { color: item.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          maxFontSizeMultiplier={1.25}
        >
          {item.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  catItem: { alignItems: 'center' },
  iconSlot: {
    zIndex: 2,
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#FFFFFF',
  },
  bowl: {
    alignItems: 'center',
  },
  label: { fontWeight: '700', textAlign: 'center', alignSelf: 'stretch' },
});
