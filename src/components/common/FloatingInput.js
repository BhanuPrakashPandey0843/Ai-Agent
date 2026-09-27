import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

export default function FloatingInput({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  icon,
  showPasswordToggle,
  onTogglePassword,
  showPassword,
  ...rest
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const floated = focused || (value != null && String(value).length > 0);

  const stateColor = focused ? colors.primary : error ? colors.error : colors.textMuted;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: focused ? colors.bgCardSoft : colors.bgCard,
            borderColor: error ? colors.error : focused ? colors.primary : colors.border,
          },
        ]}
      >
        {icon ? (
          <Ionicons name={icon} size={19} color={stateColor} style={styles.icon} />
        ) : null}
        <View style={styles.inputInner}>
          <Text
            style={[
              styles.floatingLabel,
              floated && styles.floatingLabelActive,
              { color: stateColor },
            ]}
            pointerEvents="none"
          >
            {label}
          </Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            placeholderTextColor="transparent"
            selectionColor={colors.primary}
            cursorColor={colors.primary}
            {...rest}
          />
        </View>
        {showPasswordToggle ? (
          <TouchableOpacity
            onPress={onTogglePassword}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={19}
              color={focused ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.lg },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.lg,
    minHeight: 58,
  },
  icon: { marginRight: Spacing.sm },
  inputInner: { flex: 1, justifyContent: 'center' },
  floatingLabel: {
    position: 'absolute',
    left: 0,
    top: 18,
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightMedium,
    letterSpacing: 0.3,
  },
  floatingLabelActive: {
    top: 6,
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightSemiBold,
    letterSpacing: 0.4,
  },
  input: {
    fontSize: Typography.fontSizeMD,
    paddingTop: 20,
    paddingBottom: 10,
    minHeight: 44,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightMedium,
  },
});
