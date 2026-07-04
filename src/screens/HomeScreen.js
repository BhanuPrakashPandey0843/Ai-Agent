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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { APP_NAME } from '../constants';
import { STORY_CATEGORIES } from '../theme/homeTheme';
import { useAuth } from '../context/AuthContext';
import CategoryBowl from '../components/home/CategoryBowl';
import FeaturedStoriesSection from '../components/home/FeaturedStoriesSection';
import ProphetStoriesSection from '../components/home/ProphetStoriesSection';

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
  const { colors, isDark } = useTheme();
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
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>{APP_NAME}</Text>
          <View style={styles.headerRight}>
            <ProfileAvatar
              photoURL={userProfile?.photoURL || user?.photoURL}
              onPress={() => navigation.navigate('Settings')}
            />
          </View>
        </View>

        <View style={styles.searchWrap}>
          <View style={[styles.searchBar, { backgroundColor: colors.bgCard }]}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search wallpapers & verses"
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.searchBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Search')}
              >
                <Ionicons name="options-outline" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Explore Faith</Text>
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
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#B8D4E8',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
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
    borderRadius: 28,
    height: 52,
    paddingLeft: 16,
    paddingRight: 6,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '800',
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
