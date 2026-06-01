import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../theme/colors';
import useWallpapers from '../hooks/useWallpapers';
import WallpaperCard from '../components/wallpaper/WallpaperCard';
import useFavorites from '../hooks/useFavorites';
import BackHeader from '../components/common/BackHeader';
import { WallpaperCardSkeleton } from '../components/common/SkeletonLoader';

export default function CategoryScreen({ route }) {
  const { category: categoryParam } = route.params;
  const categoryId = typeof categoryParam === 'object' ? categoryParam?.id : categoryParam;
  const categoryTitle =
    typeof categoryParam === 'object' ? categoryParam?.label || categoryParam?.id : categoryParam;
  const insets = useSafeAreaInsets();
  const { wallpapers, loading, loadMore } = useWallpapers(categoryId);
  const { toggle, isFavorite } = useFavorites();

  return (
    <View style={styles.container}>
      <BackHeader title={categoryTitle} />

      <FlatList
        data={wallpapers}
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
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonGrid}>
              {[0, 1, 2, 3].map((i) => (
                <WallpaperCardSkeleton key={i} />
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>No wallpapers in this category</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  list: { paddingHorizontal: Spacing.lg - Spacing.xs, paddingTop: Spacing.md },
  row: { justifyContent: 'space-between' },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  empty: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 60,
    fontSize: Typography.fontSizeMD,
  },
});
