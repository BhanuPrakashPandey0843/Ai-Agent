// src/components/prayer/PrayerSearchBar.js
// Local search over the already-loaded daily prayers (no new backend calls).
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PrayerSearchBar({ value, onChangeText, colors, accent, onAddPress }) {
  return (
    <View style={{ marginHorizontal: 20, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <View style={[styles.wrap, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={accent} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Search prayers..."
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.textPrimary }]}
          returnKeyType="search"
        />
        {value ? (
          <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>
      {onAddPress ? (
        <TouchableOpacity
          onPress={onAddPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.addBtn, { backgroundColor: accent }]}
          accessibilityLabel="Add prayer"
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    flex: 1,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '500' },
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
