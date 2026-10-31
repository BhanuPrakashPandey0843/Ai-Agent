import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBibleTheme } from '../../hooks/useBibleTheme';
import { LANGUAGE_BIBLES } from '../../data/languageBibles';
import BibleBookCard from './BibleBookCard';

export default function LanguageBibleSection() {
  const navigation = useNavigation();
  const theme = useBibleTheme();
  const [openingLanguage, setOpeningLanguage] = useState(null);

  const openReader = (languageId) => {
    setOpeningLanguage(null);
    navigation.navigate('LanguageBibleReader', { languageId });
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: theme.text }]}>Bible in Your Language</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>
        Read God&apos;s Word in the language closest to your heart.
      </Text>
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
});
