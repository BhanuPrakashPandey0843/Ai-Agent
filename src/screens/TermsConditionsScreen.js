// src/screens/TermsConditionsScreen.js
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

function TermsSection({ icon, number, title, children, styles, colors }) {
  return (
    <View style={styles.termsSection}>
      <View style={styles.termsSectionHeader}>
        <View style={styles.termsSectionNum}>
          <Text style={styles.termsSectionNumText}>{number}</Text>
        </View>
        <View style={styles.termsSectionTitleRow}>
          <View style={styles.termsIconWrap}>
            <Ionicons name={icon} size={16} color={colors.primary} />
          </View>
          <Text style={styles.termsSectionTitle}>{title}</Text>
        </View>
      </View>
      <View style={styles.termsSectionBody}>{children}</View>
    </View>
  );
}

function BulletPoint({ text, styles }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function WarningBox({ icon, text, styles, colors }) {
  return (
    <View style={styles.warningBox}>
      <Ionicons name={icon} size={18} color={colors.warning} style={styles.warningIcon} />
      <Text style={styles.warningText}>{text}</Text>
    </View>
  );
}

function BodyText({ children, styles }) {
  return <Text style={styles.bodyText}>{children}</Text>;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function TermsConditionsScreen() {
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Terms &amp; Conditions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
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
            <Ionicons name="document-text" size={32} color={colors.white} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Terms &amp; Conditions</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Please read these terms carefully. By using {APP_NAME} you agree to these terms and
            our community standards.
          </Text>
          <View style={styles.heroPill}>
            <Ionicons name="calendar-outline" size={12} color={colors.primary} />
            <Text style={[styles.heroPillText, { color: colors.primary }]}>Effective: June 2025</Text>
          </View>
        </Animated.View>

        {/* Body */}
        <Animated.View style={{ opacity: bodyFade }}>

          {/* 1. Acceptance */}
          <TermsSection {...themedProps} icon="checkmark-circle-outline" number="01" title="Acceptance of Terms">
            <BodyText {...themedProps}>
              By downloading, installing, or using the {APP_NAME} mobile application ("App"), you
              acknowledge that you have read, understood, and agree to be bound by these Terms and
              Conditions ("Terms") and our Privacy Policy.
            </BodyText>
            <BodyText {...themedProps}>
              If you do not agree to these Terms, do not use the App. We reserve the right to
              modify these Terms at any time; continued use after changes constitutes acceptance.
            </BodyText>
          </TermsSection>

          {/* 2. User Responsibilities */}
          <TermsSection {...themedProps} icon="person-outline" number="02" title="User Responsibilities">
            <BodyText {...themedProps}>As a user of FaithFrames, you are responsible for:</BodyText>
            <BulletPoint {...themedProps} text="Providing accurate and complete registration information." />
            <BulletPoint {...themedProps} text="Maintaining the confidentiality of your account credentials." />
            <BulletPoint {...themedProps} text="All activities that occur under your account." />
            <BulletPoint {...themedProps} text="Using the App in compliance with all applicable laws and regulations." />
            <BulletPoint {...themedProps} text="Treating other community members with respect and kindness." />
            <BulletPoint {...themedProps} text="Reporting any violations or harmful content you encounter." />
          </TermsSection>

          {/* 3. Community Guidelines */}
          <TermsSection {...themedProps} icon="people-outline" number="03" title="Community Guidelines">
            <BodyText {...themedProps}>
              FaithFrames is a community built on faith, love, and respect. All users are expected
              to uphold these values in every interaction:
            </BodyText>
            <BulletPoint {...themedProps} text="Engage with others in a spirit of Christian love and grace." />
            <BulletPoint {...themedProps} text="Share content that is uplifting, edifying, and faith-affirming." />
            <BulletPoint {...themedProps} text="Respect differences in theological interpretation and tradition." />
            <BulletPoint {...themedProps} text="Support fellow believers in their spiritual journeys." />
            <BulletPoint {...themedProps} text="Report harmful, offensive, or inappropriate content immediately." />
            <WarningBox
              {...themedProps}
              icon="warning-outline"
              text="Violations of community guidelines may result in content removal, account suspension, or permanent ban."
            />
          </TermsSection>

          {/* 4. Prohibited Activities */}
          <TermsSection {...themedProps} icon="ban-outline" number="04" title="Prohibited Activities">
            <BodyText {...themedProps}>The following activities are strictly prohibited on FaithFrames:</BodyText>
            <BulletPoint {...themedProps} text="Posting hate speech, harassment, or discriminatory content." />
            <BulletPoint {...themedProps} text="Sharing false, misleading, or deceptive information." />
            <BulletPoint {...themedProps} text="Uploading malware, viruses, or harmful code." />
            <BulletPoint {...themedProps} text="Attempting to gain unauthorized access to other accounts or systems." />
            <BulletPoint {...themedProps} text="Commercial solicitation or spam without explicit permission." />
            <BulletPoint {...themedProps} text="Impersonating other users, clergy, or FaithFrames staff." />
            <BulletPoint {...themedProps} text="Violating the intellectual property rights of others." />
            <BulletPoint {...themedProps} text="Engaging in any unlawful activity through the App." />
          </TermsSection>

          {/* 5. Account Usage */}
          <TermsSection {...themedProps} icon="key-outline" number="05" title="Account Usage">
            <BodyText {...themedProps}>
              Your FaithFrames account is personal and non-transferable. You agree not to share
              your account credentials or allow others to access your account. You are solely
              responsible for all activity that occurs under your account.
            </BodyText>
            <BodyText {...themedProps}>
              You must notify us immediately at {SUPPORT_EMAIL} if you suspect any unauthorized
              use of your account or any other security breach.
            </BodyText>
          </TermsSection>

          {/* 6. Content Ownership */}
          <TermsSection {...themedProps} icon="images-outline" number="06" title="Content Ownership">
            <BodyText {...themedProps}>
              Any content you create or submit within FaithFrames (testimonies, prayer requests,
              comments) remains your intellectual property. By submitting content, you grant
              FaithFrames a non-exclusive, royalty-free, worldwide license to use, display, and
              distribute that content within our platform for the purpose of operating the service.
            </BodyText>
            <BodyText {...themedProps}>
              All content provided by FaithFrames — including devotionals, wallpapers, Bible
              content, and design elements — is owned by FaithFrames or its content partners and
              is protected by applicable copyright law.
            </BodyText>
          </TermsSection>

          {/* 7. Intellectual Property */}
          <TermsSection {...themedProps} icon="shield-outline" number="07" title="Intellectual Property">
            <BodyText {...themedProps}>
              The FaithFrames name, logo, design, and all associated trademarks are the
              exclusive property of FaithFrames. You may not use, reproduce, or distribute any
              of our trademarks without our prior written consent.
            </BodyText>
            <BodyText {...themedProps}>
              Scripture quotations are from the King James Version (KJV), which is in the public
              domain. Other Bible translations used may be subject to their respective copyright
              notices.
            </BodyText>
          </TermsSection>

          {/* 8. Service Availability */}
          <TermsSection {...themedProps} icon="wifi-outline" number="08" title="Service Availability">
            <BodyText {...themedProps}>
              We strive to maintain continuous service availability but cannot guarantee
              uninterrupted access. The App may be temporarily unavailable due to:
            </BodyText>
            <BulletPoint {...themedProps} text="Scheduled maintenance and updates." />
            <BulletPoint {...themedProps} text="Technical failures or server issues beyond our control." />
            <BulletPoint {...themedProps} text="Force majeure events." />
            <BodyText {...themedProps}>
              We will make reasonable efforts to notify users of planned downtime in advance.
            </BodyText>
          </TermsSection>

          {/* 9. Limitation of Liability */}
          <TermsSection {...themedProps} icon="alert-circle-outline" number="09" title="Limitation of Liability">
            <BodyText {...themedProps}>
              To the maximum extent permitted by law, FaithFrames and its team shall not be
              liable for any indirect, incidental, special, consequential, or punitive damages
              arising from your use of the App.
            </BodyText>
            <WarningBox
              {...themedProps}
              icon="information-circle-outline"
              text="FaithFrames provides spiritual content for encouragement and growth. It is not a substitute for professional pastoral counseling, mental health support, or medical advice."
            />
          </TermsSection>

          {/* 10. Account Suspension */}
          <TermsSection {...themedProps} icon="pause-circle-outline" number="10" title="Account Suspension">
            <BodyText {...themedProps}>
              We reserve the right to suspend or restrict your account if we determine, in our
              sole discretion, that you have violated these Terms or engaged in conduct harmful
              to our community or platform. Suspension may be temporary or permanent depending
              on the severity of the violation.
            </BodyText>
            <BodyText {...themedProps}>
              If you believe your account was suspended in error, please contact
              {' '}{SUPPORT_EMAIL} to appeal.
            </BodyText>
          </TermsSection>

          {/* 11. Termination */}
          <TermsSection {...themedProps} icon="close-circle-outline" number="11" title="Termination">
            <BodyText {...themedProps}>
              You may delete your account at any time from the App settings. Upon deletion, your
              account and personal data will be removed from our systems within 30 days, subject
              to any legal retention obligations.
            </BodyText>
            <BodyText {...themedProps}>
              We reserve the right to terminate accounts for repeated or severe violations of
              these Terms without prior notice.
            </BodyText>
          </TermsSection>

          {/* 12. Changes to Terms */}
          <TermsSection {...themedProps} icon="refresh-outline" number="12" title="Changes to Terms">
            <BodyText {...themedProps}>
              We may revise these Terms at any time. We will notify you of material changes via
              in-app notification or email. The revised Terms will be effective upon posting.
              Your continued use of the App after changes take effect constitutes acceptance
              of the new Terms.
            </BodyText>
          </TermsSection>

          {/* 13. Governing Law */}
          <TermsSection {...themedProps} icon="globe-outline" number="13" title="Governing Law">
            <BodyText {...themedProps}>
              These Terms shall be governed by and construed in accordance with applicable law.
              Any disputes arising from these Terms or your use of FaithFrames shall be resolved
              through good-faith negotiation wherever possible, and through appropriate legal
              proceedings where necessary.
            </BodyText>
          </TermsSection>

          {/* 14. Contact */}
          <TermsSection {...themedProps} icon="mail-outline" number="14" title="Contact Us">
            <BodyText {...themedProps}>
              If you have questions about these Terms or need assistance, please contact our
              team:
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
                <Text style={[styles.contactLabel, { color: colors.textMuted }]}>Legal &amp; Support</Text>
                <Text style={[styles.contactValue, { color: linkColor }]}>{SUPPORT_EMAIL}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </TermsSection>

        </Animated.View>

        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          {APP_NAME} · Terms &amp; Conditions · © 2026
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

  // Terms section
  termsSection: {
    backgroundColor: colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  termsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  termsSectionNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  termsSectionNumText: {
    fontSize: 10,
    fontWeight: Typography.fontWeightBold,
    color: colors.primary,
  },
  termsSectionTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  termsIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsSectionTitle: {
    flex: 1,
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightBold,
    color: colors.textPrimary,
  },
  termsSectionBody: {
    gap: 0,
    paddingLeft: 36,
  },

  bodyText: {
    fontSize: Typography.fontSizeSM,
    color: colors.textSecondary,
    lineHeight: Typography.lineHeightMD,
    marginBottom: Spacing.sm,
  },

  // Bullet
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: Typography.fontSizeSM,
    color: colors.textSecondary,
    lineHeight: Typography.lineHeightMD,
  },

  // Warning box
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: `${colors.warning}1A`,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${colors.warning}33`,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  warningIcon: { marginTop: 1, flexShrink: 0 },
  warningText: {
    flex: 1,
    fontSize: Typography.fontSizeSM,
    color: colors.textSecondary,
    lineHeight: Typography.lineHeightMD,
  },

  // Contact
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
