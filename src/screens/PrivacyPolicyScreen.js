// src/screens/PrivacyPolicyScreen.js
import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Linking,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Typography, Spacing, BorderRadius, Shadows } from '../theme/colors';
import { APP_NAME, SUPPORT_EMAIL } from '../constants';
import { useTheme } from '../context/ThemeContext';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionBlock({ icon, title, children, styles, colors }) {
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionBlockHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={styles.sectionBlockTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBlockBody}>{children}</View>
    </View>
  );
}

function DataPoint({ icon, label, description, styles, colors }) {
  return (
    <View style={styles.dataPoint}>
      <View style={styles.dataPointIconWrap}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.dataPointText}>
        <Text style={styles.dataPointLabel}>{label}</Text>
        {description ? <Text style={styles.dataPointDesc}>{description}</Text> : null}
      </View>
    </View>
  );
}

function RightItem({ text, styles, colors }) {
  return (
    <View style={styles.rightItem}>
      <Ionicons name="checkmark-circle" size={16} color={colors.success} style={styles.rightIcon} />
      <Text style={styles.rightText}>{text}</Text>
    </View>
  );
}

function ThirdPartyCard({ icon, name, purpose, styles, colors }) {
  return (
    <View style={styles.thirdPartyCard}>
      <View style={styles.thirdPartyIconWrap}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.thirdPartyInfo}>
        <Text style={styles.thirdPartyName}>{name}</Text>
        <Text style={styles.thirdPartyPurpose}>{purpose}</Text>
      </View>
    </View>
  );
}

function BodyText({ children, styles }) {
  return <Text style={styles.bodyText}>{children}</Text>;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const themedProps = { styles, colors };
  const linkColor = isDark ? colors.primary : colors.primaryDark;

  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(24)).current;
  const bodyFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(heroFade, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(heroSlide, { toValue: 0, duration: 550, useNativeDriver: true }),
      ]),
      Animated.timing(bodyFade, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />
      <LinearGradient
        colors={[colors.bg, colors.bgSecondary]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.bgCard }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero banner */}
        <Animated.View
          style={[
            styles.heroBanner,
            { opacity: heroFade, transform: [{ translateY: heroSlide }] },
          ]}
        >
          <LinearGradient
            colors={[colors.accentSoft, colors.bgCard]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroIconCircle}>
            <Ionicons name="shield-checkmark" size={32} color={colors.white} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Your Privacy Matters</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            {APP_NAME} is committed to protecting your personal information. We collect only what
            we need and never sell your data.
          </Text>
          <View style={styles.heroPill}>
            <Ionicons name="calendar-outline" size={12} color={colors.primary} />
            <Text style={[styles.heroPillText, { color: colors.primary }]}>Last updated: June 2026</Text>
          </View>
        </Animated.View>

        {/* Body sections */}
        <Animated.View style={{ opacity: bodyFade }}>

          {/* Introduction */}
          <SectionBlock {...themedProps} icon="information-circle-outline" title="Introduction">
            <BodyText {...themedProps}>
              This Privacy Policy explains how {APP_NAME} ("we", "our", or "us") collects, uses,
              and safeguards your information when you use our mobile application and related
              services. By using FaithFrames, you agree to the collection and use of information
              as described in this policy.
            </BodyText>
          </SectionBlock>

          {/* Information We Collect */}
          <SectionBlock {...themedProps} icon="document-text-outline" title="Information We Collect">
            <BodyText {...themedProps}>We collect the following types of information to deliver and improve our service:</BodyText>

            <Text style={[styles.subHeading, { color: colors.textAccent }]}>Account Information</Text>
            <DataPoint {...themedProps} icon="person-outline" label="Name &amp; Email" description="Used to create and manage your FaithFrames account." />
            <DataPoint {...themedProps} icon="key-outline" label="Authentication Data" description="Securely managed via Firebase Authentication." />

            <Text style={[styles.subHeading, { color: colors.textAccent }]}>User Profile Information</Text>
            <DataPoint {...themedProps} icon="settings-outline" label="Preferences &amp; Settings" description="Dark mode, notification preferences, language." />
            <DataPoint {...themedProps} icon="heart-outline" label="Bookmarks &amp; Favorites" description="Saved verses, prayers, and wallpapers." />

            <Text style={[styles.subHeading, { color: colors.textAccent }]}>App Usage Information</Text>
            <DataPoint {...themedProps} icon="bar-chart-outline" label="Feature Interactions" description="Which features you use and how frequently." />
            <DataPoint {...themedProps} icon="time-outline" label="Session Duration" description="Time spent in-app to improve content recommendations." />

            <Text style={[styles.subHeading, { color: colors.textAccent }]}>Device &amp; Technical Information</Text>
            <DataPoint {...themedProps} icon="phone-portrait-outline" label="Device Type &amp; OS" description="Used for compatibility and performance optimization." />
            <DataPoint {...themedProps} icon="wifi-outline" label="Crash &amp; Error Logs" description="Anonymous data to identify and fix technical issues." />
          </SectionBlock>

          {/* How We Use Your Information */}
          <SectionBlock {...themedProps} icon="flash-outline" title="How We Use Your Information">
            <BodyText {...themedProps}>Your information enables us to deliver a meaningful, personalized faith experience:</BodyText>

            {[
              { icon: 'person-circle-outline', label: 'Provide and personalize your experience' },
              { icon: 'notifications-outline', label: 'Send relevant spiritual content and notifications' },
              { icon: 'shield-outline', label: 'Maintain account security and prevent fraud' },
              { icon: 'trending-up-outline', label: 'Analyze usage to improve our features' },
              { icon: 'mail-outline', label: 'Respond to your support requests' },
              { icon: 'checkmark-done-outline', label: 'Ensure compliance with our community guidelines' },
            ].map((item) => (
              <DataPoint {...themedProps} key={item.label} icon={item.icon} label={item.label} />
            ))}
          </SectionBlock>

          {/* Data Security */}
          <SectionBlock {...themedProps} icon="lock-closed-outline" title="Data Security">
            <BodyText {...themedProps}>
              We implement industry-standard security measures to protect your personal information
              against unauthorized access, alteration, disclosure, or destruction.
            </BodyText>
            <View style={styles.securityBanner}>
              <LinearGradient
                colors={[`${colors.success}26`, `${colors.success}0A`]}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="lock-closed" size={22} color={colors.success} />
              <Text style={[styles.securityText, { color: colors.textSecondary }]}>
                All data is encrypted in transit using TLS/SSL and stored securely via Firebase's
                enterprise-grade infrastructure. We never store plaintext passwords.
              </Text>
            </View>
          </SectionBlock>

          {/* Third-Party Services */}
          <SectionBlock {...themedProps} icon="cube-outline" title="Third-Party Services">
            <BodyText {...themedProps}>
              We use the following trusted third-party services to operate FaithFrames:
            </BodyText>
            <View style={styles.thirdPartyList}>
              <ThirdPartyCard {...themedProps} icon="flame-outline" name="Firebase Authentication" purpose="Secure sign-in &amp; account management" />
              <ThirdPartyCard {...themedProps} icon="server-outline" name="Firebase Firestore" purpose="Cloud database for content and user data" />
              <ThirdPartyCard {...themedProps} icon="analytics-outline" name="Firebase Analytics" purpose="Anonymous usage analytics to improve the app" />
              <ThirdPartyCard {...themedProps} icon="notifications-outline" name="Firebase Cloud Messaging" purpose="Push notifications for daily content" />
              <ThirdPartyCard {...themedProps} icon="image-outline" name="Cloudinary" purpose="Secure image storage and delivery" />
            </View>
            <BodyText {...themedProps}>
              Each third-party service operates under its own privacy policy. We encourage you
              to review them. We do not share your identifiable data with advertisers.
            </BodyText>
          </SectionBlock>

          {/* User Rights */}
          <SectionBlock {...themedProps} icon="person-outline" title="Your Rights">
            <BodyText {...themedProps}>You have the following rights regarding your personal data:</BodyText>
            <View style={styles.rightsGrid}>
              {[
                'Access your personal data at any time',
                'Correct inaccurate or incomplete data',
                'Delete your account and all associated data',
                'Export your data (data portability)',
                'Opt out of non-essential communications',
                'Withdraw consent where applicable',
              ].map((r) => (
                <RightItem {...themedProps} key={r} text={r} />
              ))}
            </View>
            <BodyText {...themedProps}>
              To exercise any of these rights, please contact us at {SUPPORT_EMAIL}.
            </BodyText>
          </SectionBlock>

          {/* Children's Privacy */}
          <SectionBlock {...themedProps} icon="people-outline" title="Children's Privacy">
            <BodyText {...themedProps}>
              FaithFrames is not directed at children under the age of 13. We do not knowingly
              collect personal information from children under 13. If you believe a child has
              provided us personal information, please contact us immediately and we will promptly
              delete such information.
            </BodyText>
          </SectionBlock>

          {/* Updates */}
          <SectionBlock {...themedProps} icon="refresh-outline" title="Updates to This Policy">
            <BodyText {...themedProps}>
              We may update this Privacy Policy periodically. We will notify you of significant
              changes via in-app notification or email. Your continued use of FaithFrames after
              changes become effective constitutes acceptance of the updated policy. We recommend
              reviewing this page occasionally.
            </BodyText>
          </SectionBlock>

          {/* Contact */}
          <SectionBlock {...themedProps} icon="mail-outline" title="Contact Us">
            <BodyText {...themedProps}>
              If you have questions, concerns, or requests about this Privacy Policy or your data,
              please reach out to our privacy team:
            </BodyText>
            <TouchableOpacity
              style={[styles.contactCard, { backgroundColor: colors.bgCard }]}
              activeOpacity={0.75}
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            >
              <View style={styles.contactIconWrap}>
                <Ionicons name="mail" size={20} color={colors.primary} />
              </View>
              <View style={styles.contactTextWrap}>
                <Text style={[styles.contactLabel, { color: colors.textMuted }]}>Privacy Inquiries</Text>
                <Text style={[styles.contactValue, { color: linkColor }]}>{SUPPORT_EMAIL}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </SectionBlock>

        </Animated.View>

        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          {APP_NAME} · Privacy Policy · © 2026
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

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
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    color: colors.textPrimary,
  },
  headerSpacer: { width: 40 },

  scroll: { paddingHorizontal: Spacing.xl },

  // Hero
  heroBanner: {
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxxl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxxl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  heroIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.glow(isDark),
  },
  heroTitle: {
    fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightExtraBold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    fontSize: Typography.fontSizeSM,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeightMD,
    marginBottom: Spacing.lg,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
  },
  heroPillText: {
    fontSize: Typography.fontSizeSM,
    color: colors.primary,
    fontWeight: Typography.fontWeightSemiBold,
  },

  // Section block
  sectionBlock: {
    backgroundColor: colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBlockTitle: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
    color: colors.textPrimary,
    flex: 1,
  },
  sectionBlockBody: { gap: 0 },

  bodyText: {
    fontSize: Typography.fontSizeSM,
    color: colors.textSecondary,
    lineHeight: Typography.lineHeightMD,
    marginBottom: Spacing.sm,
  },
  subHeading: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
    color: colors.textAccent,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Data point
  dataPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  dataPointIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  dataPointText: { flex: 1 },
  dataPointLabel: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    color: colors.textPrimary,
  },
  dataPointDesc: {
    fontSize: Typography.fontSizeXS,
    color: colors.textMuted,
    marginTop: 1,
  },

  // Security banner
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: `${colors.success}14`,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${colors.success}33`,
    padding: Spacing.md,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  securityText: {
    flex: 1,
    fontSize: Typography.fontSizeSM,
    color: colors.textSecondary,
    lineHeight: Typography.lineHeightMD,
  },

  // Third party
  thirdPartyList: { gap: Spacing.sm, marginBottom: Spacing.sm },
  thirdPartyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  thirdPartyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thirdPartyInfo: { flex: 1 },
  thirdPartyName: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    color: colors.textPrimary,
  },
  thirdPartyPurpose: {
    fontSize: Typography.fontSizeXS,
    color: colors.textMuted,
    marginTop: 1,
  },

  // Rights
  rightsGrid: { gap: Spacing.sm, marginBottom: Spacing.sm },
  rightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  rightIcon: { marginTop: 1, flexShrink: 0 },
  rightText: {
    flex: 1,
    fontSize: Typography.fontSizeSM,
    color: colors.textSecondary,
    lineHeight: Typography.lineHeightMD,
  },

  // Contact card
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  contactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTextWrap: { flex: 1 },
  contactLabel: {
    fontSize: Typography.fontSizeXS,
    color: colors.textMuted,
    fontWeight: Typography.fontWeightMedium,
  },
  contactValue: {
    fontSize: Typography.fontSizeSM,
    color: colors.textPrimary,
    fontWeight: Typography.fontWeightSemiBold,
  },

  footerText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: Typography.fontSizeSM,
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
  },
});
