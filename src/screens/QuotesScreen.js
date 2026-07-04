// src/screens/QuotesScreen.js
// Inspirational quotes feed — Firestore: quotes

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Share,
} from 'react-native';
import { subscribeToQuotes } from '../services/firebaseService';
import useFirestoreSubscription from '../hooks/useFirestoreSubscription';
import { QUOTE_CATEGORIES, STORAGE_KEYS } from '../constants';
import { LIBRARY_ACCENTS } from '../constants/library';
import QuoteCard from '../components/library/QuoteCard';
import CategoryChipRow from '../components/library/CategoryChipRow';
import LibraryEmptyState from '../components/library/LibraryEmptyState';
import LibraryErrorState from '../components/library/LibraryErrorState';
import SkeletonLoader from '../components/common/SkeletonLoader';
import BackHeader from '../components/common/BackHeader';
import { Spacing } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';

export default function QuotesScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { items, loading, error, refreshing, refresh, retry } =
    useFirestoreSubscription(subscribeToQuotes, STORAGE_KEYS.LIBRARY_CACHE_QUOTES);
  const { colors } = useTheme();

  const filtered = useMemo(() => {
    if (selectedCategory === 'All') return items;
    return items.filter((q) => (q.category || 'General') === selectedCategory);
  }, [items, selectedCategory]);

  const handleShare = useCallback(async (item) => {
    try {
      const author = item.author?.trim() ? `\n— ${item.author}` : '';
      await Share.share({
        message: `"${item.text}"${author}\n\nShared via Faith Frames`,
      });
    } catch {}
  }, []);

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <BackHeader title="Quotes" />
        <View style={styles.loading}>
          {[0, 1, 2].map((i) => (
            <SkeletonLoader
              key={i}
              height={160}
              borderRadius={24}
              style={{ marginBottom: Spacing.lg, marginHorizontal: Spacing.xl }}
            />
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <BackHeader title="Quotes" />
        <LibraryErrorState message={error} onRetry={retry} accent={LIBRARY_ACCENTS.quotes} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <BackHeader title="Quotes" />
      <CategoryChipRow
        categories={QUOTE_CATEGORIES}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        accent={LIBRARY_ACCENTS.quotes}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <QuoteCard item={item} index={index} accent={LIBRARY_ACCENTS.quotes} onShare={handleShare} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <LibraryEmptyState
            accent={LIBRARY_ACCENTS.quotes}
            icon="chatbubble-ellipses-outline"
            title={selectedCategory === 'All' ? 'No Quotes Yet' : `No ${selectedCategory} Quotes`}
            message="Inspirational quotes will appear here once added by the admin."
          />
        }
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, paddingTop: Spacing.md },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    flexGrow: 1,
  },
});
