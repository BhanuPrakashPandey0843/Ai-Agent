import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ScreenContainer from '../components/common/ScreenContainer';
import AuthCard from '../components/common/AuthCard';
import FloatingInput from '../components/common/FloatingInput';
import GradientButton from '../components/common/GradientButton';
import BackHeader from '../components/common/BackHeader';

export default function ForgotPasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { forgotPassword } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const scale = useRef(new Animated.Value(0.9)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 7, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start();
  }, [scale, fade]);

  const handleReset = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return;
    }
    setError('');
    setLoading(true);
    const result = await forgotPassword(email.trim());
    setLoading(false);
    if (result.success) {
      setSent(true);
      showToast('Reset link sent to your email', 'success');
    } else {
      showToast('Could not send reset email. Try again.', 'error');
    }
  };

  return (
    <ScreenContainer>
      <BackHeader title="Reset Password" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + Spacing.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
            <View style={styles.iconWrap}>
              <Ionicons
                name={sent ? 'checkmark-circle' : 'mail-unread-outline'}
                size={48}
                color={Colors.primary}
              />
            </View>

            {sent ? (
              <AuthCard>
                <Text style={styles.title}>Check Your Email</Text>
                <Text style={styles.subtitle}>
                  We've sent a password reset link to{'\n'}
                  <Text style={styles.emailHighlight}>{email}</Text>
                </Text>
                <GradientButton
                  title="Back to Sign In"
                  onPress={() => navigation.navigate('Login')}
                  style={{ marginTop: Spacing.xxl }}
                />
              </AuthCard>
            ) : (
              <AuthCard>
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>
                  Enter your email and we'll send you a link to reset your password.
                </Text>
                <FloatingInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  error={error}
                  icon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <GradientButton
                  title="Send Reset Link"
                  onPress={handleReset}
                  loading={loading}
                />
              </AuthCard>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xxxl, paddingTop: Spacing.xxl },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.xxxl,
  },
  title: {
    fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeightMD,
    marginBottom: Spacing.xxl,
  },
  emailHighlight: { color: Colors.primary, fontWeight: Typography.fontWeightSemiBold },
});
