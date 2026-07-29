// src/screens/WitnessScreen.js
// Witness Videos — premium hero carousel + vertical video catalogue.
// Content is fully admin-controlled via witnessCarousel / witnessVideos
// (see /admin/witness-videos in the admin panel).
//
// Reached from the Library grid alongside Daily Verse / Daily Prayer /
// Wallpapers (see LibraryScreen FEATURES) - this screen uses the same
// shared BackHeader those siblings use, rather than a bespoke hero title,
// so the heading style and back-navigation affordance stay consistent
// across every screen pushed from the Library grid.
import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { subscribeToWitnessCarousel, subscribeToWitnessVideos } from '../services/firebaseService';
import useFirestoreSubscription from '../hooks/useFirestoreSubscription';
import { STORAGE_KEYS } from '../constants';
import { LIBRARY_ACCENTS } from '../constants/library';
import WitnessCarousel from '../components/library/WitnessCarousel';
import WitnessVideoCard from '../components/library/WitnessVideoCard';
import LibraryEmptyState from '../components/library/LibraryEmptyState';
import LibraryErrorState from '../components/library/LibraryErrorState';
import SkeletonLoader from '../components/common/SkeletonLoader';
import BackHeader from '../components/common/BackHeader';
import { Spacing, Typography } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCENT = LIBRARY_ACCENTS.witness;

// Memoized so it only re-renders when the banners themselves change, not on
// every parent re-render (e.g. pull-to-refresh toggling `refreshing`).
const WitnessListHeader = React.memo(function WitnessListHeader({ banners, textSecondary }) {
  return (
    <View>
      <Text style={[styles.subheader, { color: textSecondary }]}>
        Real stories of faith, hope, and grace
      </Text>
      {banners.length > 0 ? <WitnessCarousel banners={banners} /> : null}
    </View>
  );
});

export default function WitnessScreen() {
  const navigation = useNavigation();
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    items: banners,
    loading: bannersLoading,
  } = useFirestoreSubscription(subscribeToWitnessCarousel, STORAGE_KEYS.LIBRARY_CACHE_WITNESS_CAROUSEL);

  const {
    items: videos,
    loading: videosLoading,
    error,
    refreshing,
    refresh,
    retry,
  } = useFirestoreSubscription(subscribeToWitnessVideos, STORAGE_KEYS.LIBRARY_CACHE_WITNESS_VIDEOS);

  const openVideo = useCallback(
    (video) => {
      navigation.navigate('VideoPlayer', { video });
    },
    [navigation]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  const renderItem = useCallback(
    ({ item, index }) => (
      <View style={styles.itemWrap}>
        <WitnessVideoCard item={item} index={index} accent={ACCENT} onPress={openVideo} />
      </View>
    ),
    [openVideo]
  );

  const refreshControl = useMemo(
    () => <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={ACCENT} colors={[ACCENT]} />,
    [refreshing, refresh]
  );

  const listHeader = useMemo(
    () => <WitnessListHeader banners={banners} textSecondary={colors.textSecondary} />,
    [banners, colors.textSecondary]
  );

  const listEmpty = useMemo(
    () => (
      <LibraryEmptyState
        accent={ACCENT}
        icon="videocam-outline"
        title="No videos yet"
        message="Check back soon for new witness videos."
      />
    ),
    []
  );

  const loading = bannersLoading && videosLoading;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <BackHeader title="Witness Videos" />
        <View style={styles.skeletonWrap}>
          <SkeletonLoader height={220} borderRadius={24} style={{ marginBottom: Spacing.xxl }} />
          {[0, 1, 2].map((i) => (
            <SkeletonLoader key={i} height={300} borderRadius={20} style={{ marginBottom: Spacing.xl }} />
          ))}
        </View>
      </View>
    );
  }

  if (error && !videos.length) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <BackHeader title="Witness Videos" />
        <LibraryErrorState message={error} onRetry={retry} accent={ACCENT} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <BackHeader title="Witness Videos" />
      <FlatList
        data={videos}
        keyExtractor={keyExtractor}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.huge }]}
        refreshControl={refreshControl}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        renderItem={renderItem}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { flexGrow: 1, paddingTop: Spacing.lg },
  itemWrap: { paddingHorizontal: Spacing.xl },
  skeletonWrap: { paddingTop: Spacing.xl, paddingHorizontal: Spacing.xl },
  subheader: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightMedium,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
});
