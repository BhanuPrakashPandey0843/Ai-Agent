import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeTheme } from '../../theme/homeTheme';

const H = HomeTheme;

export default function QuizTypeCard({ quizType, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={[styles.iconWrap, { backgroundColor: `${quizType.color}22` }]}>
        <MaterialCommunityIcons name={quizType.icon} size={28} color={quizType.color} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{quizType.label}</Text>
        <Text style={styles.sub} numberOfLines={2}>
          {quizType.subtitle}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={H.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: H.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    ...H.shadow,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: H.text, marginBottom: 4 },
  sub: { fontSize: 13, color: H.textMuted, lineHeight: 18 },
});
