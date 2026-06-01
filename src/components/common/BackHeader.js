// src/components/common/BackHeader.js — Reusable screen header with back button
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing } from '../../theme/colors';

const BackHeader = ({ title, rightComponent, transparent = false }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + 8,
          backgroundColor: transparent ? 'transparent' : colors.background,
          borderBottomColor: colors.border,
          borderBottomWidth: transparent ? 0 : 1,
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.backBtn, { backgroundColor: colors.surface }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </TouchableOpacity>

      {title && (
        <Text
          style={[styles.title, { color: colors.text }]}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}

      <View style={styles.rightSlot}>
        {rightComponent || <View style={styles.placeholder} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    marginHorizontal: Spacing.md,
  },
  rightSlot: {
    width: 40,
    alignItems: 'flex-end',
  },
  placeholder: {
    width: 40,
  },
});

export default BackHeader;
