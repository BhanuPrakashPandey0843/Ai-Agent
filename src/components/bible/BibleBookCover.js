import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COVER_COLORS = {
  hindi: { face: '#4A2819', edge: '#2D180F' },
  telugu: { face: '#63320F', edge: '#3D1E0A' },
};

export default function BibleBookCover({ language, animatedStyle }) {
  const colors = COVER_COLORS[language.coverTone];

  return (
    <View style={styles.bookStage}>
      <View style={styles.pageBlock} />
      <View style={[styles.spine, { backgroundColor: colors.edge }]} />
      <View style={[styles.cover, { backgroundColor: colors.face }, animatedStyle]}>
        <View style={styles.innerBorder}>
          <View style={styles.topRule} />
          <Ionicons name="add" size={30} color="#E18A3A" />
          <Text style={styles.coverTitle} numberOfLines={1}>{language.nativeTitle}</Text>
          <Text style={styles.coverSubtitle}>
            {language.id === 'hindi' ? 'पवित्र बाइबल' : 'పవిత్ర బైబిల్'}
          </Text>
          <View style={styles.bottomRule} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bookStage: {
    width: 112,
    height: 150,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    perspective: 800,
  },
  pageBlock: {
    position: 'absolute',
    right: 6,
    width: 94,
    height: 136,
    borderRadius: 5,
    backgroundColor: '#F2E7D2',
    borderRightWidth: 3,
    borderRightColor: '#D4C1A2',
  },
  spine: {
    position: 'absolute',
    left: 7,
    width: 18,
    height: 142,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  cover: {
    width: 98,
    height: 144,
    padding: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E18A3A',
    transform: [{ perspective: 800 }, { rotateY: '-8deg' }],
    backfaceVisibility: 'hidden',
  },
  innerBorder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(225,138,58,0.72)',
    paddingHorizontal: 3,
  },
  topRule: {
    width: 38,
    height: 1,
    backgroundColor: '#E18A3A',
    opacity: 0.8,
  },
  coverTitle: {
    color: '#FFF4EB',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  coverSubtitle: {
    color: '#F0C28E',
    fontSize: 7,
    textAlign: 'center',
  },
  bottomRule: {
    width: 38,
    height: 1,
    backgroundColor: '#E18A3A',
    opacity: 0.8,
  },
});
