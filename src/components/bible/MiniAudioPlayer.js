import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBible } from '../../context/BibleContext';
import { useBibleTheme } from '../../hooks/useBibleTheme';

export default function MiniAudioPlayer({ bottomInset = 0 }) {
  const theme = useBibleTheme();
  const { audio, pauseAudio, resumeAudio, stopAudio } = useBible();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!audio.playing && !audio.paused) return null;

  return (
    <View style={[styles.wrap, { bottom: bottomInset + 88 }]}>
      <View style={styles.player}>
        <Ionicons name="volume-high" size={18} color={theme.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{audio.reference || 'Audio Bible'}</Text>
          <Text style={styles.sub}>{audio.paused ? 'Paused' : 'Playing'}</Text>
        </View>
        <TouchableOpacity onPress={audio.paused ? resumeAudio : pauseAudio} style={styles.btn}>
          <Ionicons name={audio.paused ? 'play' : 'pause'} size={18} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={stopAudio} style={styles.btnSecondary}>
          <Ionicons name="close" size={16} color={theme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    wrap: { position: 'absolute', left: 16, right: 16 },
    player: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 12,
      ...theme.shadow,
    },
    title: { fontSize: 13, fontWeight: '800', color: theme.text },
    sub: { fontSize: 11, color: theme.textMuted },
    btn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
    btnSecondary: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  });
}
