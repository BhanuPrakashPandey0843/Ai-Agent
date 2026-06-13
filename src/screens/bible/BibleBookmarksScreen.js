import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBible } from '../../context/BibleContext';
import { useBibleTheme } from '../../hooks/useBibleTheme';
import BackHeader from '../../components/common/BackHeader';

export default function BibleBookmarksScreen() {
  const navigation = useNavigation();
  const theme = useBibleTheme();
  const { bookmarks } = useBible();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.root}>
      <BackHeader title="Bookmarks" />
      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Save verses while reading — long press any verse in the reader.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('BibleReader', { bookId: item.bookId, chapter: item.chapter, verse: item.verse })}
          >
            <Text style={styles.ref}>{item.reference}</Text>
            {item.text ? <Text style={styles.text} numberOfLines={3}>{item.text}</Text> : null}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    card: { backgroundColor: theme.surface, borderRadius: 14, padding: 16, marginBottom: 10, ...theme.shadow },
    ref: { fontSize: 15, fontWeight: '800', color: theme.primary },
    text: { fontSize: 14, color: theme.text, marginTop: 6, lineHeight: 20 },
    empty: { textAlign: 'center', color: theme.textMuted, marginTop: 40, paddingHorizontal: 24, lineHeight: 22 },
  });
}
