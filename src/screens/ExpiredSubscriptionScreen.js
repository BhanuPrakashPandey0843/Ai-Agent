import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../theme/colors';

export default function ExpiredSubscriptionScreen() {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const navigation = useNavigation();

  const handleRenew = () => {
    navigation.navigate('Paywall');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <View style={styles.content}>
        <Ionicons name="hourglass" size={100} color={themeColors.textMuted} />
        <Text style={[styles.title, { color: themeColors.textPrimary }]}>Subscription Expired</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          Your premium access has expired. Renew now to continue enjoying all the premium features.
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeColors.primary }]}
            onPress={handleRenew}
          >
            <Text style={styles.buttonText}>Renew Subscription</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 12, textAlign: 'center', marginTop: 32 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  buttonContainer: { width: '100%' },
  button: { width: '100%', borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '700' },
});
