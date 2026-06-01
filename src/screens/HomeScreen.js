import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CATEGORIES, APP_NAME } from '../constants';
import {
  HomeTheme,
  STORY_CATEGORIES,
  FEATURED_STORIES,
} from '../theme/homeTheme';
import useWallpapers from '../hooks/useWallpapers';
import useFavorites from '../hooks/useFavorites';
import WallpaperCard from '../components/wallpaper/WallpaperCard';
import { WallpaperCardSkeleton } from '../components/common/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import CategoryBowl from '../components/home/CategoryBowl';
import FeaturedStoryCard from '../components/home/FeaturedStoryCard';
import GospelBanner from '../components/home/GospelBanner';
import CategoryFilterChip from '../components/home/CategoryFilterChip';

const H = HomeTheme;

function PointsBadge({ count }) {
  return (
    <View style={styles.pointsBadge}>
      <MaterialCommunityIcons name="star-four-points" size={14} color={H.coinStar} />
      <Text style={styles.pointsText}>{String(count ?? 0).padStart(2, '0')}</Text>
    </View>
  );
}

function ProfileAvatar({ onPress, photoURL }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.avatarWrap}>
      {photoURL ? (
        <Image source={{ uri: photoURL }} style={styles.avatarImg} />
      ) : (
        <Image source={require('../../assets/unknownuser.png')} style={styles.avatarImg} />
      )}
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, userProfile } = useAuth();
  const { wallpapers, loading, refreshing, error, refresh, retry } = useWallpapers(null);
  const { toggle, isFavorite } = useFavorites();
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let items = wallpapers;
    if (selectedCat !== 'all') items = items.filter((w) => w.category === selectedCat);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (w) =>
          w.title?.toLowerCase().includes(q) ||
          w.category?.toLowerCase().includes(q) ||
          w.country?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [wallpapers, selectedCat, searchQuery]);

  const goCategory = useCallback(
    (item) => {
      const cat = item.category || item;
      navigation.navigate('Category', { category: cat });
    },
    [navigation]
  );

  const goFeatured = useCallback(
    (story) => navigation.navigate('Category', { category: story.category }),
    [navigation]
  );

  const goGospel = useCallback(
    () =>
      navigation.navigate('Category', {
        category: { id: 'Christian', label: 'Christian' },
      }),
    [navigation]
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={H.bg} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={H.primary}
            colors={[H.primary]}
          />
        }
      >
        <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
          <Text style={styles.brandTitle}>{APP_NAME}</Text>
          <View style={styles.headerRight}>
            <PointsBadge count={userProfile?.coins} />
            <ProfileAvatar
              photoURL={userProfile?.photoURL || user?.photoURL}
              onPress={() => navigation.navigate('Settings')}
            />
          </View>
        </View>

        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={H.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search wallpapers & verses"
              placeholderTextColor={H.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={H.textMuted} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.searchBtn}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Search')}
              >
                <Ionicons name="options-outline" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.sectionHeading}>Explore Faith</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
        >
          {STORY_CATEGORIES.map((cat) => (
            <CategoryBowl key={cat.id} item={cat} onPress={goCategory} />
          ))}
        </ScrollView>

        <Text style={[styles.sectionHeading, styles.sectionGap]}>Featured Stories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.historyRow}
        >
          {FEATURED_STORIES.map((story) => (
            <FeaturedStoryCard key={story.id} story={story} onPress={goFeatured} />
          ))}
        </ScrollView>

        <Text style={[styles.sectionHeading, styles.sectionGap]}>Jesus & The Gospel</Text>
        <View style={styles.bannerSection}>
          <GospelBanner onPress={goGospel} />
        </View>

        <Text style={[styles.sectionHeading, styles.sectionGap]}>Wallpapers</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <CategoryFilterChip
            label="All"
            active={selectedCat === 'all'}
            onPress={() => setSelectedCat('all')}
          />
          {CATEGORIES.map((cat) => (
            <CategoryFilterChip
              key={cat.id}
              label={cat.label}
              icon={cat.icon}
              color={cat.color}
              active={selectedCat === cat.id}
              onPress={() => setSelectedCat(cat.id)}
            />
          ))}
        </ScrollView>

        {error && !loading ? (
          <View style={styles.errorBox}>
            <Ionicons name="cloud-offline-outline" size={40} color={H.textMuted} />
            <Text style={styles.errMsg}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={retry}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.wallGrid}>
            {[0, 1, 2, 3].map((i) => (
              <WallpaperCardSkeleton key={i} />
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <Text style={styles.emptyWall}>
            {wallpapers.length === 0
              ? 'No wallpapers yet. Add some in the admin panel.'
              : 'No wallpapers match this filter'}
          </Text>
        ) : (
          <View style={styles.wallGrid}>
            {filtered.map((item, index) => (
              <WallpaperCard
                key={item.id}
                item={item}
                index={index}
                isFavorite={isFavorite(item.id)}
                onFavoriteToggle={toggle}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: H.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: H.text,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: H.coinBg,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700',
    color: H.coinText,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#B8D4E8',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...H.shadow,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  searchWrap: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: H.searchBg,
    borderRadius: 28,
    height: 52,
    paddingLeft: 16,
    paddingRight: 6,
    gap: 10,
    ...H.shadow,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: H.text,
    paddingVertical: 0,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: H.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: H.text,
    paddingHorizontal: 20,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  sectionGap: {
    marginTop: 8,
  },
  catRow: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 8,
  },
  historyRow: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 4,
  },
  bannerSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  filterRow: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 14,
  },
  wallGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  emptyWall: {
    textAlign: 'center',
    color: H.textMuted,
    paddingVertical: 24,
    fontSize: 14,
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  errorBox: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginHorizontal: 20,
    backgroundColor: H.surface,
    borderRadius: 16,
    ...H.shadow,
  },
  errMsg: {
    fontSize: 14,
    color: H.textMuted,
    textAlign: 'center',
    marginVertical: 12,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: H.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '700',
  },
});
