import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ScreenContainer from '../components/common/ScreenContainer';
import AuthCard from '../components/common/AuthCard';
import FloatingInput from '../components/common/FloatingInput';
import GradientButton from '../components/common/GradientButton';
import BackHeader from '../components/common/BackHeader';

const getAuthErrorMessage = (error) => {
  if (!error) return 'Something went wrong';
  if (error.includes('email-already-in-use')) return 'An account with this email already exists';
  if (error.includes('weak-password')) return 'Password should be at least 6 characters';
  if (error.includes('invalid-email')) return 'Please enter a valid email';
  return 'Sign up failed. Please try again';
};

export default function SignupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { signup } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fade]);

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = 'Name is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    else if (password.length < 6) next.password = 'Minimum 6 characters';
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    const result = await signup(name.trim(), email.trim(), password);
    setLoading(false);
    if (result.success) {
      showToast('Account created! Welcome to Faith Frames', 'success');
    } else {
      showToast(getAuthErrorMessage(result.error), 'error');
    }
  };

  return (
    <ScreenContainer>
      <BackHeader title="Create Account" />
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
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fade }}>
            <Text style={styles.subtitle}>Join our community of faith</Text>

            <AuthCard delay={80}>
              <FloatingInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                error={errors.name}
                icon="person-outline"
                autoCapitalize="words"
              />
              <FloatingInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                icon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <FloatingInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                icon="lock-closed-outline"
                secureTextEntry={!showPassword}
                showPasswordToggle
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
              />
              <FloatingInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                error={errors.confirmPassword}
                icon="shield-checkmark-outline"
                secureTextEntry={!showPassword}
              />

              <GradientButton
                title="Create Account"
                onPress={handleSignup}
                loading={loading}
                style={{ marginTop: Spacing.md }}
              />
            </AuthCard>
          </Animated.View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xxxl, paddingTop: Spacing.lg },
  subtitle: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xxxl,
  },
  footerText: { color: Colors.textSecondary, fontSize: Typography.fontSizeMD },
  linkText: {
    color: Colors.primary,
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightBold,
  },
});
