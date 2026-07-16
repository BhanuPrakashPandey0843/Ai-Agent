// src/screens/library/FaithContentScreen.js
// Generic "Explore Faith" content screen — premium hero carousel + vertical
// content catalogue, backed entirely by the admin panel. Bible, Jesus,
// Prayers, and Worship are all this same screen parameterized by `kind`
// (see constants/contentKinds.js); this replaces four copy-pasted screens.
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useFirestoreSubscription from '../../hooks/useFirestoreSubscription';
import { getContentKindConfig } from '../../constants/contentKinds';
import WitnessCarousel from '../../components/library/WitnessCarousel';
import FaithContentCard from '../../components/library/FaithContentCard';
import LibraryEmptyState from '../../components/library/LibraryEmptyState';
import LibraryErrorState from '../../components/library/LibraryErrorState';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { Spacing, Typography } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FaithContentScreen({ kind }) {
  const config = getContentKindConfig(kind);
  const navigation = useNavigation();
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { items: banners, loading: bannersLoading } = useFirestoreSubscription(
    config.subscribeCarousel,
    config.storageKeyCarousel
  );

  const {
    items: content,
    loading: contentLoading,
    error,
    refreshing,
    refresh,
    retry,
  } = useFirestoreSubscription(config.subscribeContent, config.storageKeyContent);

  const openContent = useCallback(
    (item) => {
      navigation.navigate('ContentDetail', { kind, item });
    },
    [navigation, kind]
  );

  const renderItem = useCallback(
    ({ item, index }) => (
      <View style={{ paddingHorizontal: Spacing.xl }}>
        <FaithContentCard kind={kind} item={item} index={index} accent={config.accent} onPress={openContent} />
      </View>
    ),
    [kind, config.accent, openContent]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  const loading = bannersLoading && contentLoading;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <View style={{ paddingTop: insets.top + Spacing.xl, paddingHorizontal: Spacing.xl }}>
          <SkeletonLoader height={220} borderRadius={24} style={{ marginBottom: Spacing.xxl }} />
          {[0, 1, 2].map((i) => (
            <SkeletonLoader key={i} height={300} borderRadius={20} style={{ marginBottom: Spacing.xl }} />
          ))}
        </View>
      </View>
    );
  }

  if (error && !content.length) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <LibraryErrorState message={error} onRetry={retry} accent={config.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <FlatList
        data={content}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.huge },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={config.accent} colors={[config.accent]} />
        }
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews
        ListHeaderComponent={
          <View>
            <Text style={[styles.header, { color: colors.textPrimary }]}>{config.headerTitle}</Text>
            <Text style={[styles.subheader, { color: colors.textSecondary }]}>{config.headerSubtitle}</Text>
            {banners.length > 0 ? <WitnessCarousel banners={banners} /> : null}
          </View>
        }
        ListEmptyComponent={
          <LibraryEmptyState
            accent={config.accent}
            icon={config.emptyIcon}
            title={config.emptyTitle}
            message={config.emptyMessage}
          />
        }
        renderItem={renderItem}
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
