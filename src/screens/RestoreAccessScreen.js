import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../theme/colors';
import { useSubscription } from '../context/SubscriptionContext';

export default function RestoreAccessScreen() {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const navigation = useNavigation();
  const { refreshSubscription, isPremium } = useSubscription();
  const [loading, setLoading] = useState(false);

  const handleRestore = async () => {
    try {
      setLoading(true);
      await refreshSubscription();
      if (isPremium) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        Alert.alert('No Active Subscription', 'No active subscription found. Please purchase one.');
      }
    } catch (err) {
      console.error('Error restoring access:', err);
      Alert.alert('Error', 'Failed to restore access');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.statusContainer}>
          <Ionicons name="refresh" size={80} color={themeColors.primary} />
          <Text style={[styles.title, { color: themeColors.textPrimary }]}>Restore Access</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Restore your premium subscription if you have already purchased it.
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeColors.primary }, loading && styles.buttonDisabled]}
            onPress={handleRestore}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Restore Purchase</Text>
            )}
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
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  buttonContainer: { marginTop: 'auto' },
  button: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '700' },
});
