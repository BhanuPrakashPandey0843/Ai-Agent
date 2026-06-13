import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useBible } from '../../context/BibleContext';
import { useBibleTheme } from '../../hooks/useBibleTheme';
import BackHeader from '../../components/common/BackHeader';

export default function BibleNotesScreen() {
  const route = useRoute();
  const theme = useBibleTheme();
  const { notes, upsertNote, removeNote } = useBible();
  const draft = route.params?.draft;
  const [body, setBody] = useState('');
  const styles = useMemo(() => createStyles(theme), [theme]);

  const saveDraft = async () => {
    if (!draft || !body.trim()) return;
    await upsertNote({
      id: `${draft.bookId}_${draft.chapter}_${draft.verse}`,
      ...draft,
      body: body.trim(),
    });
    setBody('');
  };

  return (
    <View style={styles.root}>
      <BackHeader title="Notes" />
      {draft ? (
        <View style={styles.compose}>
          <Text style={styles.ref}>{draft.reference}</Text>
          <Text style={styles.preview} numberOfLines={2}>{draft.text}</Text>
          <TextInput
            style={styles.input}
            placeholder="Write your reflection..."
            placeholderTextColor={theme.textMuted}
            value={body}
            onChangeText={setBody}
            multiline
          />
          <TouchableOpacity style={styles.saveBtn} onPress={saveDraft}>
            <Text style={styles.saveText}>Save Note</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        ListEmptyComponent={<Text style={styles.empty}>Your verse notes will appear here.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.ref}>{item.reference}</Text>
            <Text style={styles.text}>{item.body}</Text>
            <TouchableOpacity onPress={() => removeNote(item.id)}>
              <Text style={styles.delete}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    compose: { margin: 16, backgroundColor: theme.surface, borderRadius: 16, padding: 16, ...theme.shadow },
    ref: { fontSize: 14, fontWeight: '800', color: theme.primary },
    preview: { fontSize: 13, color: theme.textMuted, marginTop: 4, marginBottom: 10 },
    input: { minHeight: 90, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12, color: theme.text, textAlignVertical: 'top' },
    saveBtn: { marginTop: 12, backgroundColor: theme.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    saveText: { color: '#FFF', fontWeight: '700' },
    card: { backgroundColor: theme.surface, borderRadius: 14, padding: 16, marginBottom: 10, ...theme.shadow },
    text: { fontSize: 14, color: theme.text, marginTop: 8, lineHeight: 20 },
    delete: { marginTop: 10, color: '#E55A00', fontWeight: '700', fontSize: 13 },
    empty: { textAlign: 'center', color: theme.textMuted, marginTop: 40 },
  });
}
