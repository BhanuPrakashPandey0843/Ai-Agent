import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/colors';
import { searchWallpapers } from '../services/firebaseService';
import WallpaperCard from '../components/wallpaper/WallpaperCard';
import useFavorites from '../hooks/useFavorites';
export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { toggle, isFavorite } = useFavorites();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const items = await searchWallpapers(query.trim());
      setResults(items);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <Text style={styles.headerTitle}>Search</Text>
        <Text style={styles.headerSub}>Find wallpapers by title or category</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, category..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoFocus
        />
        <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item, index }) => (
          <WallpaperCard
            item={item}
            index={index}
            isFavorite={isFavorite(item.id)}
            onFavoriteToggle={toggle}
          />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 100 },
        ]}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          searched && !loading ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No results for "{query}"</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize3XL,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    height: 52,
    gap: Spacing.md,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeMD,
  },
  searchBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: Spacing.lg - Spacing.xs, paddingTop: Spacing.lg },
  row: { justifyContent: 'space-between' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizeMD,
    marginTop: Spacing.lg,
  },
});
