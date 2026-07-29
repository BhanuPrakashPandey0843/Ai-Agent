import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/colors';

const ToastContext = createContext(null);

const ICONS = {
  success: 'checkmark-circle',
  error: 'close-circle',
  info: 'information-circle',
  warning: 'warning',
};

export const ToastProvider = ({ children }) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setToast(null);
    });
  }, [opacity]);

  const showToast = useCallback(
    (message, type = 'info', duration = 3000) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ message, type });
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      timerRef.current = setTimeout(hide, duration);
    },
    [hide, opacity]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            { top: insets.top + Spacing.lg, opacity },
            toast.type === 'error' && styles.toastError,
            toast.type === 'success' && styles.toastSuccess,
          ]}
        >
          <Ionicons
            name={ICONS[toast.type] || ICONS.info}
            size={20}
            color={Colors.primary}
            style={styles.icon}
          />
          <Text style={styles.text} numberOfLines={2}>
            {toast.message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,18,12,0.95)',
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    zIndex: 9999,
    elevation: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  toastSuccess: { borderColor: 'rgba(76,175,80,0.4)' },
  toastError: { borderColor: 'rgba(244,67,54,0.4)' },
  icon: { marginRight: Spacing.sm },
  text: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightMedium,
  },
});
