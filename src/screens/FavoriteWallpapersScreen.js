import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useWallpapers from '../hooks/useWallpapers';
import useFavorites from '../hooks/useFavorites';
import WallpaperCard from '../components/wallpaper/WallpaperCard';
import { WallpaperCardSkeleton } from '../components/common/SkeletonLoader';
import BackHeader from '../components/common/BackHeader';
import { useTheme } from '../context/ThemeContext';
import { Spacing, Typography } from '../theme/colors';

export default function FavoriteWallpapersScreen() {
  const insets = useSafeAreaInsets();
  const {
    wallpapers,
    loading,
    refreshing,
    error,
    refresh,
    retry,
  } = useWallpapers(null);
  const { favorites, toggle, isFavorite } = useFavorites();
  const { isDark, colors } = useTheme();

  const favoriteWallpapers = useMemo(() => {
    if (!wallpapers?.length || !favorites?.length) return [];
    return wallpapers.filter(wallpaper => favorites.includes(wallpaper.id));
  }, [wallpapers, favorites]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <BackHeader title="Favorite Wallpapers" />

      {error && !loading ? (
        <View style={[styles.infoBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.errorTitle, { color: colors.error, fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold }]}>
            Could not load wallpapers
          </Text>
          <Text style={[styles.errorDescription, { color: colors.textSecondary, fontSize: Typography.fontSizeSM }]}>
            {error}
          </Text>
          <Text style={[styles.retryText, { color: colors.primary, fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold }]} onPress={retry}>
            Tap to retry
          </Text>
        </View>
      ) : null}

      <FlatList
        data={favoriteWallpapers}
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
          { paddingBottom: insets.bottom + Spacing.xxxl },
        ]}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonGrid}>
              {[0, 1, 2, 3].map((i) => (
                <WallpaperCardSkeleton key={i} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: Typography.fontSizeMD }]}>
                No favorite wallpapers yet. Tap the heart on any wallpaper to add it here.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  row: { justifyContent: 'space-between' },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  emptyState: { marginTop: 80, alignItems: 'center', paddingHorizontal: 40 },
  emptyText: {
    textAlign: 'center',
    lineHeight: 24,
  },
  infoBox: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  errorTitle: {
    marginBottom: 8,
  },
  errorDescription: {
    marginBottom: 12,
  },
  retryText: {},
});
