import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useBibleTheme } from '../../hooks/useBibleTheme';
import { LANGUAGE_BIBLES } from '../../data/languageBibles';
import {
  getLanguageContinueReading,
  getRecentLanguageReadings,
  getSelectedBibleLanguage,
} from '../../storage/bibleStorage';
import BibleBookCard from './BibleBookCard';

export default function LanguageBibleSection() {
  const navigation = useNavigation();
  const theme = useBibleTheme();
  const [openingLanguage, setOpeningLanguage] = useState(null);
  const [continueReading, setContinueReading] = useState(null);
  const [recentReadings, setRecentReadings] = useState([]);

  useFocusEffect(useCallback(() => {
    let active = true;
    const loadContinueReading = async () => {
      const selectedLanguage = await getSelectedBibleLanguage();
      const reading = selectedLanguage ? await getLanguageContinueReading(selectedLanguage) : null;
      const recent = await getRecentLanguageReadings();
      const validRecent = recent.filter((item) => LANGUAGE_BIBLES.some((language) => language.id === item.languageId));
      if (
        active
        && LANGUAGE_BIBLES.some((item) => item.id === selectedLanguage)
        && reading?.bookId
        && reading?.chapter
      ) {
        setContinueReading({ ...reading, languageId: selectedLanguage });
      } else if (active) {
        setContinueReading(null);
      }
      if (active) setRecentReadings(validRecent.slice(0, 4));
    };
    loadContinueReading();
    return () => {
      active = false;
    };
  }, []));

  const openReader = (languageId, reading = null) => {
    setOpeningLanguage(null);
    navigation.navigate('LanguageBibleReader', {
      languageId,
      ...(reading ? { bookId: reading.bookId, chapter: reading.chapter } : {}),
    });
  };
  const otherRecentReadings = recentReadings.filter((item) => (
    !continueReading
    || item.languageId !== continueReading.languageId
    || item.bookId !== continueReading.bookId
    || item.chapter !== continueReading.chapter
  )).slice(0, 3);

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: theme.text }]}>Bible in Your Language</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>
        Read God&apos;s Word in the language closest to your heart.
      </Text>
      {continueReading ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Continue reading ${continueReading.bookName || "Bible"}, chapter ${continueReading.chapter}`}
          onPress={() => openReader(continueReading.languageId, continueReading)}
          style={[
            styles.continueCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={[styles.continueIcon, { backgroundColor: theme.surfaceAlt }]}>
            <Ionicons name="book-outline" size={18} color={theme.primary} />
          </View>
          <View style={styles.continueTextWrap}>
            <Text style={[styles.continueTitle, { color: theme.text }]}>Continue reading</Text>
            <Text style={[styles.continueSubtitle, { color: theme.textMuted }]} numberOfLines={1}>
              {LANGUAGE_BIBLES.find((item) => item.id === continueReading.languageId)?.nativeTitle} · {continueReading.bookName} {continueReading.chapter}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={17} color={theme.primary} />
        </TouchableOpacity>
      ) : null}
      {otherRecentReadings.length ? (
        <View style={styles.recentSection}>
          <Text style={[styles.recentHeading, { color: theme.textMuted }]}>RECENTLY READ</Text>
          {otherRecentReadings.map((reading) => {
            const language = LANGUAGE_BIBLES.find((item) => item.id === reading.languageId);
            return (
              <TouchableOpacity
                key={`${reading.languageId}-${reading.bookId}-${reading.chapter}`}
                accessibilityRole="button"
                accessibilityLabel={`Open ${language.nativeTitle}, ${reading.bookName}, chapter ${reading.chapter}`}
                onPress={() => openReader(reading.languageId, reading)}
                style={[styles.recentItem, { borderBottomColor: theme.border }]}
              >
                <Text style={[styles.recentNative, { color: theme.primary }]}>{language.nativeTitle}</Text>
                <Text style={[styles.recentReference, { color: theme.text }]} numberOfLines={1}>
                  {reading.bookName} {reading.chapter}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
      <View style={styles.cards}>
        {LANGUAGE_BIBLES.map((language, index) => (
          <BibleBookCard
            key={language.id}
            language={language}
            index={index}
            theme={theme}
            disabled={!!openingLanguage}
            onOpen={(id) => {
              setOpeningLanguage(id);
              openReader(id);
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 18 },
  title: {
    marginHorizontal: 20,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  subtitle: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 19,
  },
  cards: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
  },
  continueCard: {
    minHeight: 62,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  continueIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  continueTextWrap: { flex: 1, minWidth: 0 },
  continueTitle: { fontSize: 13, fontWeight: '800' },
  continueSubtitle: { fontSize: 11, marginTop: 3 },
  recentSection: { marginHorizontal: 20, marginBottom: 12 },
  recentHeading: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 3 },
  recentItem: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  recentNative: { width: 48, fontSize: 11, fontWeight: '700' },
  recentReference: { flex: 1, fontSize: 12, fontWeight: '600' },
});
