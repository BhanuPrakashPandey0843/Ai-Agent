import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/colors';
import { searchWallpapers, searchStories } from '../services/firebaseService';
import WallpaperCard from '../components/wallpaper/WallpaperCard';
import ProphetStoryCard from '../components/home/ProphetStoryCard';
import useFavorites from '../hooks/useFavorites';

// Search screen renders two result groups from a single query: Faith Stories
// (full-width cards, tap -> ProphetStoryDetails) and Wallpapers (2-col grid).
// Both search functions already exist in firebaseService — no new fetch logic.

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { toggle, isFavorite } = useFavorites();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - (Spacing.lg - Spacing.xs) * 2;

  const [query, setQuery] = useState(route.params?.initialQuery || '');
  const [wallpaperResults, setWallpaperResults] = useState([]);
  const [storyResults, setStoryResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    setLoading(true);
    setSearched(true);
    try {
      const [wallpapers, stories] = await Promise.all([
        searchWallpapers(trimmed).catch(() => []),
        searchStories(trimmed).catch(() => []),
      ]);
      setWallpaperResults(wallpapers);
      setStoryResults(stories);
    } catch {
      setWallpaperResults([]);
      setStoryResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    runSearch(query);
  }, [runSearch, query]);

  // Auto-run when arriving from Home's search bar with a prefilled query.
  useEffect(() => {
    if (route.params?.initialQuery?.trim()) {
      runSearch(route.params.initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenStory = useCallback(
    (story) => {
      navigation.navigate('ProphetStoryDetails', { storyId: story.id });
    },
    [navigation]
  );

  const hasResults = storyResults.length > 0 || wallpaperResults.length > 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <Text style={styles.headerTitle}>Search</Text>
        <Text style={styles.headerSub}>Find faith stories and wallpapers</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search stories, wallpapers, prophets..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoFocus={!route.params?.initialQuery}
        />
        {query.length > 0 ? (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={wallpaperResults}
        keyExtractor={(item) => `wallpaper-${item.id}`}
        numColumns={2}
        renderItem={({ item, index }) => (
          <WallpaperCard
            item={item}
            index={index}
            isFavorite={isFavorite(item.id)}
            onFavoriteToggle={toggle}
          />
        )}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          storyResults.length > 0 ? (
            <View style={styles.storiesSection}>
              <Text style={styles.sectionLabel}>
                Faith Stories ({storyResults.length})
              </Text>
              {storyResults.map((story, index) => (
                <ProphetStoryCard
                  key={story.id}
                  story={story}
                  index={index}
                  onPress={handleOpenStory}
                  colors={Colors}
                  isDark
                  cardWidth={cardWidth}
                />
              ))}
              {wallpaperResults.length > 0 ? (
                <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>
                  Wallpapers ({wallpaperResults.length})
                </Text>
              ) : null}
            </View>
          ) : null
        }
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 100 },
        ]}
        ListEmptyComponent={
          searched && !loading && !hasResults ? (
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
  storiesSection: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizeMD,
    marginTop: Spacing.lg,
  },
});
