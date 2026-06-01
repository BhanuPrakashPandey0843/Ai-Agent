import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CategoryBowl({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.catItem} onPress={() => onPress(item)} activeOpacity={0.8}>
      <View style={styles.iconSlot}>
        <View style={[styles.iconCircle, { backgroundColor: item.bowl }]}>
          <MaterialCommunityIcons name={item.icon} size={28} color={item.iconColor} />
        </View>
      </View>
      <View style={[styles.bowl, { backgroundColor: item.bowl }]}>
        <Text style={[styles.label, { color: item.text }]}>{item.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  catItem: { alignItems: 'center', width: 86 },
  iconSlot: {
    marginBottom: -14,
    zIndex: 2,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  bowl: {
    width: 86,
    paddingTop: 20,
    paddingBottom: 11,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
  },
  label: { fontSize: 13, fontWeight: '700' },
});
