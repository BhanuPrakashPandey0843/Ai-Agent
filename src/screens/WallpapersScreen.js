import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  StatusBar,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useWallpapers from '../hooks/useWallpapers';
import useFavorites from '../hooks/useFavorites';
import WallpaperCard, { GRID_GAP } from '../components/wallpaper/WallpaperCard';
import { WallpaperCardSkeleton } from '../components/common/SkeletonLoader';
import BackHeader from '../components/common/BackHeader';
import { useTheme } from '../context/ThemeContext';
import { Spacing, Typography } from '../theme/colors';

const MAX_GALLERY_WIDTH = 760;
// Outer screen margin is Spacing.lg. Every cell carries GRID_GAP / 2 of padding
// on each side, so the list itself only needs the remainder.
const LIST_PADDING_X = Spacing.lg - GRID_GAP / 2;

export default function WallpapersScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const galleryWidth = Math.min(screenWidth, MAX_GALLERY_WIDTH);
  // Two equal columns inside the list padding; the card fills its column minus the gap.
  const columnWidth = (galleryWidth - LIST_PADDING_X * 2) / 2;
  const cardWidth = Math.max(0, columnWidth - GRID_GAP);
  const {
    wallpapers,
    loading,
    loadingMore,
    refreshing,
    error,
    refresh,
    retry,
    loadMore,
  } = useWallpapers(null);
  const { toggle, isFavorite } = useFavorites();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <BackHeader title="Wallpapers" />

      {error && !loading ? (
        <View
          style={[
            styles.infoBox,
            {
              width: galleryWidth - Spacing.lg * 2,
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.errorTitle, { color: colors.error, fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold }]}>
            Could not load wallpapers
          </Text>
          <Text style={[styles.errorDescription, { color: colors.textMuted, fontSize: Typography.fontSizeSM }]}>
            {error}
          </Text>
          <TouchableOpacity onPress={retry} activeOpacity={0.75} accessibilityRole="button">
            <Text style={[styles.retryText, { color: colors.primary, fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold }]}>
              Tap to retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlashList
        data={wallpapers}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.cell}>
            <WallpaperCard
              item={item}
              index={index}
              cardWidth={cardWidth}
              isFavorite={isFavorite(item.id)}
              onFavoriteToggle={toggle}
            />
          </View>
        )}
        style={{ width: galleryWidth, alignSelf: 'center' }}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + Spacing.xxxl },
        ]}
        numColumns={2}
        masonry
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Faith-filled wallpapers
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Tap a wallpaper to preview, save, or set it as your background.
            </Text>
          </View>
        }
        ListEmptyComponent={loading ? (
          <View style={styles.skeletonGrid}>
            {[0, 1, 2, 3].map((index) => (
              <WallpaperCardSkeleton
                key={index}
                width={cardWidth}
                colors={colors}
                imageHeight={cardWidth * (index % 3 === 0 ? 1.3 : 1.1)}
              />
            ))}
          </View>
        ) : !error ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textMuted, fontSize: Typography.fontSizeMD }]}>
              No wallpapers have been uploaded yet.
            </Text>
          </View>
        ) : null}
        ListFooterComponent={loadingMore ? (
          <View style={[styles.skeletonGrid, styles.loadingMore]}>
            {[0, 1].map((index) => (
              <WallpaperCardSkeleton
                key={index}
                width={cardWidth}
                colors={colors}
                imageHeight={cardWidth * 1.1}
              />
            ))}
          </View>
        ) : null}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: {
    paddingHorizontal: LIST_PADDING_X,
    paddingTop: Spacing.sm,
  },
  // Half-gap on each side + a full gap below => uniform GRID_GAP between cards.
  cell: {
    paddingHorizontal: GRID_GAP / 2,
    paddingBottom: GRID_GAP,
  },
  header: {
    paddingHorizontal: GRID_GAP / 2,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightBold,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSizeMD,
    lineHeight: Typography.lineHeightMD,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    paddingHorizontal: GRID_GAP / 2,
  },
  loadingMore: { marginTop: Spacing.sm },
  emptyState: { marginTop: 80, alignItems: 'center' },
  emptyText: {
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 24,
  },
  infoBox: {
    alignSelf: 'center',
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
