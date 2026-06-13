import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getBookById } from '../../constants/bible';
import { useBibleTheme } from '../../hooks/useBibleTheme';
import BackHeader from '../../components/common/BackHeader';

export default function BibleChaptersScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useBibleTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const book = getBookById(route.params?.bookId);
  const chapters = useMemo(
    () => Array.from({ length: book?.chapters || 0 }, (_, i) => i + 1),
    [book?.chapters]
  );

  if (!book) return null;

  return (
    <View style={styles.root}>
      <BackHeader title={`${book.name} · ${book.chapters} chapters`} />
      <FlatList
        data={chapters}
        numColumns={4}
        keyExtractor={(item) => String(item)}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chapterCell}
            onPress={() => navigation.navigate('BibleReader', { bookId: book.id, chapter: item })}
          >
            <Text style={styles.chapterNum}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    chapterCell: {
      flex: 1,
      margin: 6,
      aspectRatio: 1,
      borderRadius: 14,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadow,
    },
    chapterNum: { fontSize: 16, fontWeight: '800', color: theme.text },
  });
}
