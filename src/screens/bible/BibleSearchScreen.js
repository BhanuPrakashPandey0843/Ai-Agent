import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { searchBible } from '../../services/bibleService';
import { addRecentSearch, getRecentSearches } from '../../storage/bibleStorage';
import { useBibleTheme } from '../../hooks/useBibleTheme';
import BackHeader from '../../components/common/BackHeader';

export default function BibleSearchScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const theme = useBibleTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ books: [], verse: null, chapter: null });
  const [recent, setRecent] = useState([]);

  React.useEffect(() => {
    getRecentSearches().then(setRecent);
  }, []);

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await searchBible(query);
      setResults(res);
      const r = await addRecentSearch(query);
      setRecent(r);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 100 }]}>
      <BackHeader title="Search Scripture" />
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={theme.textMuted} />
        <TextInput
          style={styles.input}
          placeholder="Book, chapter, or John 3:16"
          placeholderTextColor={theme.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runSearch}
          returnKeyType="search"
        />
        <TouchableOpacity onPress={runSearch} style={styles.goBtn}>
          <Text style={styles.goText}>Go</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color={theme.primary} style={{ marginTop: 24 }} /> : null}

      {results.verse ? (
        <TouchableOpacity style={styles.resultCard} onPress={() => navigation.navigate('BibleReader', { bookId: 'jn', chapter: 3, verse: 16 })}>
          <Text style={styles.resultTitle}>{results.verse.reference}</Text>
          <Text style={styles.resultBody}>{results.verse.text}</Text>
        </TouchableOpacity>
      ) : null}

      <FlatList
        data={results.books}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          recent.length ? (
            <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
              <Text style={styles.sectionLabel}>Recent</Text>
              <View style={styles.recentRow}>
                {recent.map((item) => (
                  <TouchableOpacity key={item} style={styles.recentChip} onPress={() => { setQuery(item); }}>
                    <Text style={styles.recentText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultCard}
            onPress={() => navigation.navigate('BibleChapters', { bookId: item.id })}
          >
            <Text style={styles.resultTitle}>{item.name}</Text>
            <Text style={styles.resultBody}>{item.chapters} chapters · {item.testament}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, backgroundColor: theme.surface, borderRadius: 14, paddingHorizontal: 12, ...theme.shadow },
    input: { flex: 1, paddingVertical: 14, color: theme.text, fontSize: 15 },
    goBtn: { backgroundColor: theme.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    goText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: theme.textMuted, marginBottom: 8 },
    recentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    recentChip: { backgroundColor: theme.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
    recentText: { fontSize: 12, color: theme.text },
    resultCard: { backgroundColor: theme.surface, borderRadius: 14, padding: 16, marginBottom: 10, ...theme.shadow },
    resultTitle: { fontSize: 16, fontWeight: '800', color: theme.text },
    resultBody: { fontSize: 13, color: theme.textMuted, marginTop: 4, lineHeight: 20 },
  });
}
