import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme/colors';

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
  const [focused, setFocused] = useState(false);
  const floated = focused || (value != null && String(value).length > 0);

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.inputContainer,
          focused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={20}
            color={focused ? Colors.primary : Colors.textMuted}
            style={styles.icon}
          />
        ) : null}
        <View style={styles.inputInner}>
          <Text
            style={[
              styles.floatingLabel,
              floated && styles.floatingLabelActive,
              {
                color: focused ? Colors.primary : error ? Colors.error : Colors.textMuted,
              },
            ]}
            pointerEvents="none"
          >
            {label}
          </Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            placeholderTextColor="transparent"
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
              size={20}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.lg },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    minHeight: 58,
  },
  inputFocused: {
    borderColor: Colors.borderAccent,
    backgroundColor: Colors.bgCardLight,
  },
  inputError: { borderColor: Colors.error },
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
  },
  input: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeMD,
    paddingTop: 20,
    paddingBottom: 10,
    minHeight: 44,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSizeSM,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
