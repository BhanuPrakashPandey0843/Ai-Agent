import React, { useState, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { APP_NAME } from '../constants';
import { HomeTheme, STORY_CATEGORIES } from '../theme/homeTheme';
import { useAuth } from '../context/AuthContext';
import CategoryBowl from '../components/home/CategoryBowl';
import FeaturedStoriesSection from '../components/home/FeaturedStoriesSection';
import ProphetStoriesSection from '../components/home/ProphetStoriesSection';

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
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const goCategory = useCallback(
    (item) => {
      const cat = item.category || item;
      navigation.navigate('Category', { category: cat });
    },
    [navigation]
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={H.bg} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
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

        <FeaturedStoriesSection />

        <ProphetStoriesSection />

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
});
