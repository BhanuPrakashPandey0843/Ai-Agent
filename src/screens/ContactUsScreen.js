
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme/colors';
import { SUPPORT_EMAIL } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { db } from '../config/firebase';
import ScreenContainer from '../components/common/ScreenContainer';
import BackHeader from '../components/common/BackHeader';
import GradientButton from '../components/common/GradientButton';

const QUICK_CONTACTS = [
  { id: 'email', icon: 'mail-outline', label: 'Email Support', value: SUPPORT_EMAIL, type: 'email' },
  { id: 'feedback', icon: 'chatbubbles-outline', label: 'Send Feedback', type: 'feedback' },
  { id: 'prayer', icon: 'heart-outline', label: 'Prayer Request', type: 'prayer' },
  { id: 'issue', icon: 'bug-outline', label: 'Report Issue', type: 'issue' },
  { id: 'feature', icon: 'bulb-outline', label: 'Feature Request', type: 'feature' },
];

const CATEGORIES = [
  'General Inquiry',
  'Technical Support',
  'Billing',
  'Prayer Request',
  'Bible Content',
  'Quiz Content',
  'Wallpaper Request',
  'Report Problem',
];

const FAQS = [
  {
    id: '1',
    question: 'How to use Bible features?',
    answer:
      'Open the Bible tab to browse books, chapters, and verses. You can bookmark, take notes, and share verses with friends.',
  },
  {
    id: '2',
    question: 'How do quizzes work?',
    answer:
      'Go to the Quiz tab to play daily and themed quizzes. Earn coins, track your stats, and compete on the leaderboard.',
  },
  {
    id: '3',
    question: 'How wallpapers work?',
    answer:
      'Browse beautiful faith-inspired wallpapers in the Home tab. Save favorites, download in HD, and set as your wallpaper.',
  },
  {
    id: '4',
    question: 'How to restore purchases?',
    answer:
      'Premium features are managed through your App Store or Play Store account. Contact support if you need help restoring.',
  },
  {
    id: '5',
    question: 'How notifications work?',
    answer:
      'Customize your notification preferences in Settings to receive daily verses, prayer reminders, and more.',
  },
];

function QuickContactCard({ item, onPress }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.quickIcon}>
        <Ionicons name={item.icon} size={24} color={Colors.primary} />
      </View>
      <Text style={[styles.quickLabel, { color: colors.text }]}>{item.label}</Text>
    </TouchableOpacity>
  );
}

function AccordionItem({ id, question, answer, expandedId, setExpandedId }) {
  const { colors } = useTheme();
  const isExpanded = expandedId === id;
  return (
    <TouchableOpacity
      style={[styles.accordion, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => setExpandedId(isExpanded ? null : id)}
      activeOpacity={0.7}
    >
      <View style={styles.accordionHeader}>
        <Text style={[styles.accordionQuestion, { color: colors.text }]}>{question}</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.primary}
        />
      </View>
      {isExpanded && (
        <Text style={[styles.accordionAnswer, { color: colors.textSecondary }]}>{answer}</Text>
      )}
    </TouchableOpacity>
  );
}

export default function ContactUsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    category: CATEGORIES[0],
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const handleQuickContact = async (item) => {
    switch (item.type) {
      case 'email':
        Linking.openURL(`mailto:${item.value}`);
        break;
      case 'feedback':
        setForm({ ...form, category: 'General Inquiry', subject: 'Feedback' });
        break;
      case 'prayer':
        setForm({ ...form, category: 'Prayer Request', subject: 'Prayer Request' });
        break;
      case 'issue':
        setForm({ ...form, category: 'Report Problem', subject: 'Bug Report' });
        break;
      case 'feature':
        setForm({ ...form, category: 'General Inquiry', subject: 'Feature Request' });
        break;
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'contact_messages'), {
        uid: user?.uid || null,
        name: form.name,
        email: form.email,
        category: form.category,
        subject: form.subject,
        message: form.message,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      showToast('Message sent successfully!', 'success');
      setForm({
        name: '',
        email: '',
        subject: '',
        category: CATEGORIES[0],
        message: '',
      });
    } catch (err) {
      showToast('Failed to send message. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.huge },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <BackHeader title="Contact Us" />

        {/* Hero Section */}
        <View style={styles.hero}>
          <LinearGradient colors={Colors.gradientPrimary} style={styles.heroIcon}>
            <Ionicons name="chatbubbles" size={40} color={Colors.white} />
          </LinearGradient>
          <Text style={[styles.heroTitle, { color: colors.text }]}>We're Here for You</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Have questions, prayer requests, or feedback? We'd love to hear from you.
          </Text>
        </View>

        {/* Quick Contact Cards */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Quick Contact</Text>
          <View style={styles.quickGrid}>
            {QUICK_CONTACTS.map((item) => (
              <QuickContactCard key={item.id} item={item} onPress={() => handleQuickContact(item)} />
            ))}
          </View>
        </View>

        {/* Contact Form */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Send a Message</Text>
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Full Name"
              placeholderTextColor={Colors.textMuted}
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Email Address"
              placeholderTextColor={Colors.textMuted}
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Subject"
              placeholderTextColor={Colors.textMuted}
              value={form.subject}
              onChangeText={(text) => setForm({ ...form, subject: text })}
            />
            <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      form.category === cat && styles.categoryChipActive,
                      { backgroundColor: form.category === cat ? Colors.primary : 'transparent' },
                    ]}
                    onPress={() => setForm({ ...form, category: cat })}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        { color: form.category === cat ? Colors.white : colors.textSecondary },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TextInput
              style={[styles.textarea, { color: colors.text, borderColor: colors.border }]}
              placeholder="Your message..."
              placeholderTextColor={Colors.textMuted}
              value={form.message}
              onChangeText={(text) => setForm({ ...form, message: text })}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <GradientButton title="Send Message" onPress={handleSubmit} loading={loading} />
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>FAQ</Text>
          {FAQS.map((faq) => (
            <AccordionItem
              key={faq.id}
              {...faq}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
            />
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing.xxxl },
  hero: { alignItems: 'center', marginBottom: Spacing.xxxl },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    fontSize: Typography.fontSize3XL,
    fontWeight: Typography.fontWeightExtraBold,
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    fontSize: Typography.fontSizeMD,
    textAlign: 'center',
    lineHeight: Typography.lineHeightLG,
  },
  section: { marginBottom: Spacing.xxxl },
  sectionLabel: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  quickLabel: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightMedium,
    textAlign: 'center',
  },
  formCard: {
    padding: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    fontSize: Typography.fontSizeMD,
  },
  pickerContainer: {
    marginBottom: Spacing.lg,
  },
  categoryScroll: { flexGrow: 0 },
  categoryChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: { borderColor: Colors.primary },
  categoryText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightMedium,
  },
  textarea: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    fontSize: Typography.fontSizeMD,
  },
  accordion: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accordionQuestion: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightMedium,
    flex: 1,
    marginRight: Spacing.md,
  },
  accordionAnswer: {
    fontSize: Typography.fontSizeSM,
    marginTop: Spacing.md,
    lineHeight: Typography.lineHeightMD,
  },
});

