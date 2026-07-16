// src/screens/WitnessScreen.js
// Witness Videos — premium hero carousel + vertical video catalogue.
// Content is fully admin-controlled via witnessCarousel / witnessVideos
// (see /admin/witness-videos in the admin panel).
import React from 'react';
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
import { Spacing, Typography } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCENT = LIBRARY_ACCENTS.witness;

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

  const openVideo = (video) => {
    navigation.navigate('VideoPlayer', { video });
  };

  const loading = bannersLoading && videosLoading;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <View style={{ paddingTop: insets.top + Spacing.xl, paddingHorizontal: Spacing.xl }}>
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
      <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
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
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.huge },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={ACCENT} colors={[ACCENT]} />
        }
        ListHeaderComponent={
          <View>
            <Text style={[styles.header, { color: colors.textPrimary }]}>Witness Videos</Text>
            <Text style={[styles.subheader, { color: colors.textSecondary }]}>
              Real stories of faith, hope, and grace
            </Text>
            {banners.length > 0 ? <WitnessCarousel banners={banners} /> : null}
          </View>
        }
        ListEmptyComponent={
          <LibraryEmptyState
            accent={ACCENT}
            icon="videocam-outline"
            title="No videos yet"
            message="Check back soon for new witness videos."
          />
        }
        renderItem={({ item, index }) => (
          <View style={{ paddingHorizontal: Spacing.xl }}>
            <WitnessVideoCard item={item} index={index} accent={ACCENT} onPress={openVideo} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { flexGrow: 1 },
  header: {
    fontSize: Typography.fontSize4XL,
    fontWeight: Typography.fontWeightExtraBold,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  subheader: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightMedium,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
});
