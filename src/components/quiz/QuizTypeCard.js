import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function QuizTypeCard({ quizType, onPress }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.bgCard }]} onPress={onPress} activeOpacity={0.88}>
      <View style={[styles.iconWrap, { backgroundColor: `${quizType.color}22` }]}>
        <MaterialCommunityIcons name={quizType.icon} size={28} color={quizType.color} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{quizType.label}</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]} numberOfLines={2}>
          {quizType.subtitle}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  sub: { fontSize: 13, lineHeight: 18 },
});
