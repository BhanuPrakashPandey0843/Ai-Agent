// src/screens/AboutScreen.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme/colors';
import { APP_VERSION, APP_NAME, SUPPORT_EMAIL } from '../constants';

// ─── Small sub-components ─────────────────────────────────────────────────────

function FeatureCard({ icon, title, description, delay, fadeAnim }) {
  return (
    <Animated.View style={[styles.featureCard, { opacity: fadeAnim }]}>
      <View style={styles.featureIconWrap}>
        <Ionicons name={icon} size={24} color={Colors.primary} />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{description}</Text>
      </View>
    </Animated.View>
  );
}

function TimelineItem({ icon, title, body, isLast }) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineLeft}>
        <View style={styles.timelineDot}>
          <Ionicons name={icon} size={16} color={Colors.white} />
        </View>
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      <View style={styles.timelineContent}>
        <Text style={styles.timelineTitle}>{title}</Text>
        <Text style={styles.timelineBody}>{body}</Text>
      </View>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // Staggered entrance animations
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(30)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const cardFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(heroFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(heroSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(contentFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(cardFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const FEATURES = [
    { icon: 'book-outline', title: 'Daily Devotionals', description: 'Start every morning with Spirit-led devotionals tailored for your faith walk.' },
    { icon: 'book', title: 'Bible Reading', description: 'Full KJV Bible with offline support, bookmarks, and beautiful typography.' },
    { icon: 'hand-right-outline', title: 'Prayer Requests', description: 'Submit and pray over community prayer requests in real time.' },
    { icon: 'people-outline', title: 'Community', description: 'Connect with fellow believers, share testimonies and encourage one another.' },
    { icon: 'trending-up-outline', title: 'Spiritual Progress', description: 'Track your daily reading streaks, quiz scores, and growth milestones.' },
    { icon: 'library-outline', title: 'Christian Resources', description: 'Curated library of verses, prayers, quotes, and study plans.' },
    { icon: 'musical-notes-outline', title: 'Audio Content', description: 'Listen to devotionals and scripture readings for hands-free worship.' },
    { icon: 'person-outline', title: 'Personalized', description: 'Your faith journey, your pace — personalized daily content and reminders.' },
  ];

  const TIMELINE = [
    { icon: 'heart-outline', title: 'Our Purpose', body: 'To make daily engagement with Scripture simple, beautiful, and deeply personal for every believer.', isLast: false },
    { icon: 'eye-outline', title: 'Our Vision', body: 'A world where every Christian starts their day grounded in God\'s Word, supported by a thriving faith community.', isLast: false },
    { icon: 'flash-outline', title: 'Our Impact', body: 'Thousands of believers deepening their faith daily through curated devotionals, Bible reading, and prayer.', isLast: false },
    { icon: 'rocket-outline', title: 'What\'s Next', body: 'Expanded audio library, group Bible studies, mentor matching, and multilingual Scripture support coming soon.', isLast: true },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.gradientDark} style={StyleSheet.absoluteFill} />

      {/* Back button */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ─────────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.heroSection,
            { opacity: heroFade, transform: [{ translateY: heroSlide }] },
          ]}
        >
          <LinearGradient
            colors={['rgba(255,107,0,0.18)', 'rgba(255,107,0,0.04)']}
            style={styles.heroGradientBg}
          />
          <View style={styles.logoCircle}>
            <LinearGradient colors={Colors.gradientPrimary} style={styles.logoGradient}>
              <Ionicons name="flame" size={36} color={Colors.white} />
            </LinearGradient>
          </View>
          <Text style={styles.heroAppName}>{APP_NAME}</Text>
          <Text style={styles.heroTagline}>Grow Deeper in Faith Every Day</Text>
          <View style={styles.heroBadge}>
            <Ionicons name="shield-checkmark" size={13} color={Colors.primary} />
            <Text style={styles.heroBadgeText}>v{APP_VERSION} · Trusted & Secure</Text>
          </View>
        </Animated.View>

        {/* ── Mission ──────────────────────────────────────────── */}
        <Animated.View style={[styles.section, { opacity: contentFade }]}>
          <Text style={styles.sectionEyebrow}>OUR MISSION</Text>
          <Text style={styles.sectionHeading}>Faith That Moves You Forward</Text>
          <Text style={styles.sectionBody}>
            FaithFrames is built for believers who want more than a daily notification — they want
            a living, growing relationship with God. We combine Scripture, prayer, community, and
            personalized content into one seamless spiritual companion.
          </Text>

          <View style={styles.missionPillsRow}>
            {[
              { icon: 'book-outline', label: 'Daily Faith Growth' },
              { icon: 'trending-up-outline', label: 'Spiritual Dev' },
              { icon: 'people-outline', label: 'Community' },
              { icon: 'hand-right-outline', label: 'Prayer Support' },
            ].map((p) => (
              <View key={p.label} style={styles.missionPill}>
                <Ionicons name={p.icon} size={15} color={Colors.primary} />
                <Text style={styles.missionPillText}>{p.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Features ─────────────────────────────────────────── */}
        <Animated.View style={[styles.section, { opacity: cardFade }]}>
          <Text style={styles.sectionEyebrow}>FEATURES</Text>
          <Text style={styles.sectionHeading}>Everything You Need to Thrive</Text>

          <View style={styles.featuresGrid}>
            {FEATURES.map((f) => (
              <FeatureCard
                key={f.title}
                icon={f.icon}
                title={f.title}
                description={f.description}
                fadeAnim={cardFade}
              />
            ))}
          </View>
        </Animated.View>

        {/* ── Why FaithFrames timeline ──────────────────────────── */}
        <Animated.View style={[styles.section, { opacity: cardFade }]}>
          <Text style={styles.sectionEyebrow}>WHY FAITHFRAMES</Text>
          <Text style={styles.sectionHeading}>Purpose · Vision · Impact</Text>

          <View style={styles.timelineWrap}>
            {TIMELINE.map((t) => (
              <TimelineItem
                key={t.title}
                icon={t.icon}
                title={t.title}
                body={t.body}
                isLast={t.isLast}
              />
            ))}
          </View>
        </Animated.View>

        {/* ── Developer / credits ───────────────────────────────── */}
        <Animated.View style={[styles.section, { opacity: cardFade }]}>
          <Text style={styles.sectionEyebrow}>BUILT WITH LOVE</Text>
          <View style={styles.devCard}>
            <LinearGradient
              colors={['rgba(255,107,0,0.12)', 'rgba(255,107,0,0.04)']}
              style={styles.devCardGradient}
            />
            <View style={styles.devAvatar}>
              <LinearGradient colors={Colors.gradientPrimary} style={styles.devAvatarGradient}>
                <Ionicons name="code-slash" size={24} color={Colors.white} />
              </LinearGradient>
            </View>
            <Text style={styles.devName}>FaithFrames Team</Text>
            <Text style={styles.devRole}>Crafted with prayer, purpose &amp; passion</Text>
            <Text style={styles.devBio}>
              We are a small team of Christian developers and designers passionate about using
              technology to draw people closer to God and His Word.
            </Text>
          </View>
        </Animated.View>

        {/* ── Contact ───────────────────────────────────────────── */}
        <Animated.View style={[styles.section, { opacity: cardFade }]}>
          <Text style={styles.sectionEyebrow}>GET IN TOUCH</Text>
          <Text style={styles.sectionHeading}>Contact Us</Text>

          <TouchableOpacity
            style={styles.contactCard}
            activeOpacity={0.75}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          >
            <View style={styles.contactIconWrap}>
              <Ionicons name="mail" size={22} color={Colors.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email Support</Text>
              <Text style={styles.contactValue}>{SUPPORT_EMAIL}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            activeOpacity={0.75}
            onPress={() => Linking.openURL('https://faithframes.app')}
          >
            <View style={styles.contactIconWrap}>
              <Ionicons name="globe-outline" size={22} color={Colors.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Website</Text>
              <Text style={styles.contactValue}>faithframes.app</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── App info ─────────────────────────────────────────── */}
        <Animated.View style={[styles.section, { opacity: cardFade }]}>
          <Text style={styles.sectionEyebrow}>APP INFORMATION</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Version" value={APP_VERSION} />
            <View style={styles.infoSeparator} />
            <InfoRow label="Build" value="stable" />
            <View style={styles.infoSeparator} />
            <InfoRow label="Platform" value={Platform.OS === 'ios' ? 'iOS' : 'Android'} />
            <View style={styles.infoSeparator} />
            <InfoRow label="Last Updated" value="June 2025" />
          </View>
        </Animated.View>

        {/* Footer */}
        <Text style={styles.footerText}>
          © 2025 {APP_NAME}. Made with ❤️ for the Kingdom.
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },

  // Header bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
  },
  headerSpacer: { width: 40 },

  // Scroll
  scroll: { paddingHorizontal: Spacing.xl },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.lg,
  },
  heroGradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    ...Shadows.glow,
    marginBottom: Spacing.xl,
  },
  logoGradient: {
    flex: 1,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAppName: {
    fontSize: Typography.fontSize3XL,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  heroTagline: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: Spacing.lg,
    backgroundColor: Colors.accentSoft,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
  },
  heroBadgeText: {
    fontSize: Typography.fontSizeSM,
    color: Colors.primary,
    fontWeight: Typography.fontWeightSemiBold,
  },

  // Section wrapper
  section: {
    marginBottom: Spacing.xxxl,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: Typography.fontWeightBold,
    color: Colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  sectionHeading: {
    fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    lineHeight: Typography.lineHeightXL,
  },
  sectionBody: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeightLG,
    marginBottom: Spacing.lg,
  },

  // Mission pills
  missionPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  missionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.accentSoft,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
  },
  missionPillText: {
    fontSize: Typography.fontSizeSM,
    color: Colors.primary,
    fontWeight: Typography.fontWeightSemiBold,
  },

  // Features
  featuresGrid: {
    gap: Spacing.sm,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeightMD,
  },

  // Timeline
  timelineWrap: { paddingLeft: 4 },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 40,
  },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.borderAccent,
    marginVertical: 2,
    minHeight: 24,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  timelineTitle: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
    marginBottom: 4,
    marginTop: 6,
  },
  timelineBody: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeightMD,
  },

  // Developer card
  devCard: {
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxxl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  devCardGradient: { ...StyleSheet.absoluteFillObject },
  devAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    ...Shadows.glow,
    marginBottom: Spacing.lg,
  },
  devAvatarGradient: {
    flex: 1,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devName: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  devRole: {
    fontSize: Typography.fontSizeSM,
    color: Colors.primary,
    fontWeight: Typography.fontWeightSemiBold,
    marginBottom: Spacing.md,
  },
  devBio: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeightMD,
  },

  // Contact
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  contactIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: { flex: 1 },
  contactLabel: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeightMedium,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeightSemiBold,
  },

  // App info
  infoCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  infoSeparator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  infoLabel: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeightMedium,
  },
  infoValue: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeightSemiBold,
  },

  // Footer
  footerText: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: Typography.fontSizeSM,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
});
