import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useTheme } from '../context/ThemeContext';
import { Colors, getColors } from '../theme/colors';

// NOTE: Payments are temporarily disabled (see handlePurchase below) until the
// Razorpay/Stripe gateway keys are configured for a later release. Firebase is
// already initialized once, centrally, in ../config/firebase — this screen no
// longer creates its own second app instance.

const features = [
  {
    icon: 'checkmark-circle',
    title: 'Unlimited Bible Verses',
    description: 'Daily inspiration and wisdom',
  },
  {
    icon: 'heart',
    title: 'Premium Wallpapers',
    description: 'Beautiful faith-based backgrounds',
  },
  {
    icon: 'book',
    title: 'Exclusive Stories',
    description: 'Inspiring testimonies and parables',
  },
  {
    icon: 'shield-checkmark',
    title: 'Ad-free Experience',
    description: 'Uninterrupted spiritual journey',
  },
];

export default function PaywallScreen() {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const navigation = useNavigation();
  const { user, userProfile } = useAuth();
  const { isPremium } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState('IN'); // Default, we should get actual country

  useEffect(() => {
    if (isPremium) {
      navigation.navigate('Main'); // Navigate to main if already premium
    }
  }, [isPremium]);

  // Payments are temporarily disabled: the Razorpay/Stripe gateway keys are not
  // yet configured (see functions/.env), so createPaymentOrder would always
  // fail server-side. Rather than let the user hit a thrown error, tell them
  // plainly that purchases aren't open yet. Nothing else on this screen
  // (features list, restore, navigation) is affected, and the Cloud Function
  // itself is left untouched for the later release.
  const handlePurchase = () => {
    if (!user) {
      Alert.alert('Please sign in to continue');
      return;
    }
    Alert.alert(
      'Coming Soon',
      'Premium purchases are not available yet. Please check back soon!'
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: themeColors.textPrimary }]}>
            Unlock Premium
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Elevate your spiritual journey
          </Text>
        </View>
        <View style={styles.planCardContainer}>
          <LinearGradient
            colors={themeColors.gradientPrimary}
            style={styles.planCard}
          >
            <View style={styles.planCardHeader}>
              <Text style={styles.planName}>Annual Access</Text>
              <View style={styles.planPriceContainer}>
                <Text style={styles.currencyText}>{country === 'IN' ? '₹' : '$'}</Text>
                <Text style={styles.planPrice}>{country === 'IN' ? '10' : '1'}</Text>
                <Text style={styles.planPeriod}>/year</Text>
              </View>
              <Text style={styles.planDescription}>365 days of premium features</Text>
            </View>
          </LinearGradient>
        </View>
        <View style={styles.featuresContainer}>
          <Text style={[styles.featuresTitle, { color: themeColors.textPrimary }]}>
            What you get
          </Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons
                name={feature.icon}
                size={24}
                color={themeColors.primary}
                style={styles.featureIcon}
              />
              <View style={styles.featureTextContainer}>
                <Text style={[styles.featureTitle, { color: themeColors.textPrimary }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDescription, { color: themeColors.textSecondary }]}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.purchaseButton, loading && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.purchaseButtonText}>Continue to Payment</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.restoreButton}>
          <Text style={[styles.restoreText, { color: themeColors.textSecondary }]}>
            Restore Purchase
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 24, paddingBottom: 48 },
  header: { alignItems: 'flex-end', marginBottom: 24 },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  titleSection: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', textAlign: 'center', lineHeight: 40 },
  subtitle: { fontSize: 16, marginTop: 8, textAlign: 'center', lineHeight: 22 },
  planCardContainer: { marginBottom: 32 },
  planCard: { borderRadius: 24, padding: 24 },
  planCardHeader: { alignItems: 'center' },
  planName: { fontSize: 18, fontWeight: '600', color: 'white', marginBottom: 8 },
  planPriceContainer: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 },
  currencyText: { fontSize: 24, fontWeight: '700', color: 'white' },
  planPrice: { fontSize: 48, fontWeight: '800', color: 'white' },
  planPeriod: { fontSize: 18, fontWeight: '500', color: 'rgba(255,255,255,0.8)', marginLeft: 4, marginBottom: 8 },
  planDescription: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 8 },
  featuresContainer: { marginBottom: 32 },
  featuresTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  featureIcon: { marginRight: 16 },
  featureTextContainer: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  featureDescription: { fontSize: 14, fontWeight: '400' },
  purchaseButton: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  purchaseButtonDisabled: { opacity: 0.6 },
  purchaseButtonText: { color: 'white', fontSize: 18, fontWeight: '700' },
  restoreButton: { alignItems: 'center' },
  restoreText: { fontSize: 14, fontWeight: '500' },
});
