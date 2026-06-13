import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BIBLE_BOOKS, getBooksByTestament } from '../../constants/bible';
import { useBibleTheme } from '../../hooks/useBibleTheme';
import BackHeader from '../../components/common/BackHeader';

export default function BibleBooksScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useBibleTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const initial = route.params?.testament || 'OT';
  const [testament, setTestament] = useState(initial);

  const books = useMemo(() => getBooksByTestament(testament), [testament]);

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 100 }]}>
      <BackHeader title="Holy Bible" />
      <View style={styles.tabs}>
        {['OT', 'NT'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, testament === t && styles.tabActive]}
            onPress={() => setTestament(t)}
          >
            <Text style={[styles.tabText, testament === t && styles.tabTextActive]}>
              {t === 'OT' ? 'Old Testament' : 'New Testament'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.bookCard}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('BibleChapters', { bookId: item.id })}
          >
            <Text style={styles.bookName}>{item.name}</Text>
            <Text style={styles.bookMeta}>{item.chapters} chapters · {item.group}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
    tab: { flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: theme.surface, alignItems: 'center' },
    tabActive: { backgroundColor: `${theme.primary}18`, borderWidth: 1, borderColor: theme.primary },
    tabText: { fontSize: 13, fontWeight: '700', color: theme.textMuted },
    tabTextActive: { color: theme.primary },
    bookCard: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      minHeight: 92,
      ...theme.shadow,
    },
    bookName: { fontSize: 15, fontWeight: '800', color: theme.text },
    bookMeta: { fontSize: 11, color: theme.textMuted, marginTop: 6 },
  });
}
