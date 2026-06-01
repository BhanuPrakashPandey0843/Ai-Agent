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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ScreenContainer from '../components/common/ScreenContainer';
import AuthCard from '../components/common/AuthCard';
import FloatingInput from '../components/common/FloatingInput';
import GradientButton from '../components/common/GradientButton';

const getAuthErrorMessage = (error) => {
  if (!error) return 'Something went wrong';
  if (error.includes('user-not-found')) return 'No account found with this email';
  if (error.includes('wrong-password')) return 'Incorrect password';
  if (error.includes('invalid-email')) return 'Please enter a valid email';
  if (error.includes('too-many-requests')) return 'Too many attempts. Try again later';
  if (error.includes('network')) return 'Network error. Check your connection';
  return 'Login failed. Please try again';
};

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [headerFade]);

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    else if (password.length < 6) next.password = 'Minimum 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result.success) {
      showToast('Welcome back!', 'success');
    } else {
      showToast(getAuthErrorMessage(result.error), 'error');
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + Spacing.xxxl, paddingBottom: insets.bottom + Spacing.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.header, { opacity: headerFade }]}>
            <Image source={require('../../assets/icon.png')} style={styles.logo} />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your faith journey</Text>
          </Animated.View>

          <AuthCard delay={120}>
            <FloatingInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
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

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <GradientButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={{ marginTop: Spacing.md }}
            />
          </AuthCard>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xxxl },
  header: { alignItems: 'center', marginBottom: Spacing.xxxl },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: Typography.fontSize3XL,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: Spacing.lg, marginTop: -Spacing.sm },
  forgotText: {
    color: Colors.primary,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightMedium,
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
