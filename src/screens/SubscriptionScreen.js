import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../theme/colors';
import { useSubscription } from '../context/SubscriptionContext';

export default function SubscriptionScreen() {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const navigation = useNavigation();
  const route = useRoute();
  const { refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState(false);

  const { paymentId, orderId, gateway, gatewayParams } = route.params || {};

  // Note: Here you would integrate the actual payment SDK
  // For example, Razorpay's React Native SDK or Stripe's PaymentSheet
  // For this example, we'll simulate the payment flow

  const simulateSuccess = async () => {
    try {
      setLoading(true);
      // In real app, after successful payment, wait for webhook and refresh subscription
      await new Promise(resolve => setTimeout(resolve, 2000));
      await refreshSubscription();
      navigation.replace('PaymentSuccess');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const simulateFailure = () => {
    navigation.replace('PaymentFailed');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.statusContainer}>
          <Ionicons name="card" size={80} color={themeColors.primary} />
          <Text style={[styles.title, { color: themeColors.textPrimary }]}>Complete Payment</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            You're almost there!
          </Text>
        </View>

        <View style={[styles.detailsCard, { backgroundColor: themeColors.bgCard }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Order ID</Text>
            <Text style={[styles.detailValue, { color: themeColors.textPrimary }]}>{orderId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Gateway</Text>
            <Text style={[styles.detailValue, { color: themeColors.textPrimary }]}>{gateway}</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeColors.primary }]}
            onPress={simulateSuccess}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Simulate Success</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={simulateFailure}
          >
            <Text style={[styles.buttonText, { color: themeColors.error }]}>
              Simulate Failure
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  statusContainer: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginTop: 24, marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center' },
  detailsCard: { borderRadius: 16, padding: 20, marginBottom: 32 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '600' },
  buttonContainer: { marginTop: 'auto', gap: 12 },
  button: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  secondaryButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E5E7EB' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '700' },
});
