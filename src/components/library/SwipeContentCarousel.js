import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Typography, BorderRadius } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';
import SkeletonLoader from '../common/SkeletonLoader';
import SwipeContentCard, { SWIPE_CARD_W } from './SwipeContentCard';
import LibraryEmptyState from './LibraryEmptyState';
import LibraryErrorState from './LibraryErrorState';
import { getBookmarkIds, toggleBookmarkId } from '../../storage';
import { useToast } from '../../context/ToastContext';

export default function SwipeContentCarousel({
  items = [],
  loading,
  error,
  accent,
  gradients,
  tagLabel,
  tagIcon,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  bookmarkStorageKey,
  shareMessage,
  onRetry,
  fromCache,
}) {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  
  const bgCard = isDark ? '#101010' : '#F5F5F5';
  const textMuted = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const [activeIndex, setActiveIndex] = useState(0);
  const [bookmarked, setBookmarked] = useState({});
  const flatRef = useRef(null);

  useEffect(() => {
    if (!bookmarkStorageKey) return;
    getBookmarkIds(bookmarkStorageKey).then((ids) => {
      const map = {};
      ids.forEach((id) => {
        map[id] = true;
      });
      setBookmarked(map);
    });
  }, [bookmarkStorageKey]);

  const handleShare = useCallback(
    async (item) => {
      try {
        const message = shareMessage(item);
        await Share.share({ message });
      } catch {}
    },
    [shareMessage]
  );

  const handleCopy = useCallback(
    async (item) => {
      try {
        const text = shareMessage(item);
        await Clipboard.setStringAsync(text);
        showToast('Copied to clipboard', 'success', 2000);
      } catch {
        showToast('Could not copy text', 'error');
      }
    },
    [shareMessage, showToast]
  );

  const handleBookmark = useCallback(
    async (id) => {
      if (!bookmarkStorageKey) return;
      const next = await toggleBookmarkId(bookmarkStorageKey, id);
      const map = {};
      next.forEach((bid) => {
        map[bid] = true;
      });
      setBookmarked(map);
    },
    [bookmarkStorageKey]
  );

  const onViewableChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <SkeletonLoader width={SWIPE_CARD_W} height={360} borderRadius={24} />
        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <SkeletonLoader key={i} width={i === 0 ? 20 : 7} height={7} borderRadius={4} />
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return <LibraryErrorState message={error} onRetry={onRetry} accent={accent} />;
  }

  if (!items.length) {
    return (
      <LibraryEmptyState
        accent={accent}
        icon={emptyIcon}
        title={emptyTitle}
        message={emptyMessage}
      />
    );
  }

  return (
    <View style={styles.root}>
      {fromCache ? (
        <View style={[styles.cacheBanner, { borderColor: accent + '40', backgroundColor: bgCard }]}>
          <Ionicons name="cloud-offline-outline" size={14} color={accent} />
          <Text style={[styles.cacheText, { color: accent }]}>Showing saved content</Text>
        </View>
      ) : null}

      <FlatList
        ref={flatRef}
        data={items}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SWIPE_CARD_W}
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={styles.flatContent}
        onViewableItemsChanged={onViewableChanged}
        viewabilityConfig={viewConfig}
        renderItem={({ item, index }) => (
          <SwipeContentCard
            item={item}
            index={index}
            accent={accent}
            tagLabel={tagLabel}
            tagIcon={tagIcon}
            bodyText={item.verse}
            reference={item.reference}
            bgurl={item.bgurl}
            gradients={gradients}
            isBookmarked={!!bookmarked[item.id]}
            onBookmark={bookmarkStorageKey ? handleBookmark : null}
            onShare={handleShare}
            onCopy={handleCopy}
          />
        )}
      />

      {items.length > 1 ? (
        <View style={styles.dotsRow}>
          {items.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => flatRef.current?.scrollToIndex({ index: i, animated: true })}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.dot,
                  i === activeIndex
                    ? { width: 20, backgroundColor: accent }
                    : { width: 7, backgroundColor: textMuted + '60' },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <View style={[styles.countChip, { backgroundColor: bgCard, borderColor: borderColor }]}>
        <Text style={[styles.countText, { color: textMuted }]}>
          {activeIndex + 1} / {items.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', paddingTop: 12, gap: 14 },
  flatContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 12,
  },
  dot: { height: 7, borderRadius: 4 },
  countChip: {
    alignSelf: 'center',
    borderRadius: BorderRadius.round,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    marginBottom: 8,
  },
  countText: {
    fontSize: 11,
    fontWeight: Typography.fontWeightBold,
  },
  cacheBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  cacheText: {
    fontSize: 11,
    fontWeight: Typography.fontWeightSemiBold,
  },
});
