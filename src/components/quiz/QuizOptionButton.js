import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeTheme } from '../../theme/homeTheme';

const H = HomeTheme;

export default function QuizOptionButton({
  label,
  letter,
  state = 'default',
  disabled,
  onPress,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'correct' || state === 'wrong') {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.03, duration: 120, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }
  }, [state, scale]);

  const containerStyle = [styles.option];
  if (state === 'correct') containerStyle.push(styles.correct);
  if (state === 'wrong') containerStyle.push(styles.wrong);
  if (state === 'selected') containerStyle.push(styles.selected);

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={disabled}>
      <Animated.View style={[containerStyle, { transform: [{ scale }] }]}>
        <Text style={styles.letter}>{letter}</Text>
        <Text style={styles.label}>{label}</Text>
        {state === 'correct' ? (
          <MaterialCommunityIcons name="check-circle" size={22} color="#2E7D32" />
        ) : null}
        {state === 'wrong' ? (
          <MaterialCommunityIcons name="close-circle" size={22} color="#C62828" />
        ) : null}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: H.bg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDE8DC',
    gap: 12,
  },
  selected: {
    borderColor: H.primary,
    backgroundColor: '#E8EFFF',
  },
  correct: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  wrong: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  letter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: H.primary,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '700',
    fontSize: 14,
  },
  label: { flex: 1, fontSize: 15, color: H.text, fontWeight: '500' },
});
