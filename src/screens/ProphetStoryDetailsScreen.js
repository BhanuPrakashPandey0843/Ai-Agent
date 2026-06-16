import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import BackHeader from '../components/common/BackHeader';
import useFirestoreSubscription from '../hooks/useFirestoreSubscription';
import { subscribeToStories } from '../services/firebaseService';
import { STORAGE_KEYS } from '../constants';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HERO_HEIGHT = SCREEN_WIDTH * 0.6;

export default function ProphetStoryDetailsScreen({ route }) {
  const { storyId } = route.params || {};
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { items, loading, error } = useFirestoreSubscription(
    subscribeToStories,
    STORAGE_KEYS.LIBRARY_CACHE_STORIES
  );

  const story = useMemo(() => items.find((item) => item.id === storyId), [items, storyId]);

  const metaLabel = story?.prophetName ? `Prophet ${story.prophetName} (A.S.)` : story?.category;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <BackHeader title="Story" transparent={false} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          <Image
            source={story?.image ? { uri: story.image } : require('../../assets/unknownuser.png')}
            style={styles.heroImage}
            contentFit="cover"
            transition={400}
            cachePolicy="memory-disk"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.heroFade}
          />
        </View>

        <View style={styles.content}> 
          <View style={styles.detailRow}>
            <View>
              <Text style={[styles.metaText, { color: colors.primary }]}>{metaLabel}</Text>
              <Text style={[styles.title, { color: colors.text }]}>{story?.title || 'Story unavailable'}</Text>
            </View>
            <TouchableOpacity style={[styles.actionChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5F3EE' }]}> 
              <Ionicons name="star" size={18} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Featured</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.description, { color: colors.textSecondary }]}> 
            {story?.description || 'This story will appear once it is available in the Prophet Stories collection.'}
          </Text>

          <View style={[styles.bodyCard, { backgroundColor: isDark ? '#141414' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#ECECEC' }]}> 
            <Text style={[styles.bodyText, { color: colors.text }]}> 
              {story?.content || 'Full story content is unavailable at the moment. Please return to the Prophet Stories section.'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  heroWrap: {
    width: '100%',
    height: HERO_HEIGHT,
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 16,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  bodyCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
  },
});
