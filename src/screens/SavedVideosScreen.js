
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import BackHeader from '../components/common/BackHeader';
import WitnessVideoCard from '../components/library/WitnessVideoCard';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';
import useSavedVideos from '../hooks/useSavedVideos';
import { Spacing, Typography } from '../theme/colors';

export default function SavedVideosScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { savedVideos, loading, error } = useSavedVideos();

  const handleOpenVideo = useCallback(
    (video) => {
      navigation.navigate('VideoPlayer', { video });
    },
    [navigation]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <BackHeader title="Saved Videos" />

      {error && !loading && !savedVideos.length ? (
        <View style={styles.infoBox}>
          <EmptyState
            icon="cloud-offline-outline"
            title="Unable to load saved videos"
            message={error}
          />
        </View>
      ) : null}

      <FlatList
        data={savedVideos}
        keyExtractor={(item) => item.videoId || item.id}
        renderItem={({ item, index }) => (
          <View style={{ paddingHorizontal: Spacing.xl }}>
            <WitnessVideoCard
              item={{
                id: item.videoId || item.id,
                title: item.title,
                thumbnail: item.thumbnail,
                duration: item.duration,
                category: item.category,
                isActive: true,
              }}
              index={index}
              accent={colors.primary}
              onPress={handleOpenVideo}
            />
          </View>
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + Spacing.xxxl },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={false}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingHorizontal: Spacing.xl }}>
              {[0, 1, 2].map((i) => (
                <SkeletonLoader
                  key={i}
                  height={300}
                  borderRadius={20}
                  style={{ marginBottom: Spacing.xl }}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <EmptyState
                icon="bookmark-outline"
                title="No saved videos yet"
                message="Tap the bookmark button on any video to add it here."
              />
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
    paddingTop: 8,
  },
  infoBox: {
    marginHorizontal: 20,
    marginTop: 12,
  },
  emptyState: {
    marginTop: 60,
  },
});
