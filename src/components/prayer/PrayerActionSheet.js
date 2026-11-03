// src/components/prayer/PrayerActionSheet.js
// Owner actions for a prayer (Edit / Delete) with an in-sheet delete
// confirmation. Built on RN's Modal so it behaves the same on Android, iOS and
// web (Alert.alert with buttons is a no-op on react-native-web, so it can't be
// relied on for a destructive confirmation).
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Easing,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * @param {object|null} request  { item, step: 'menu' | 'confirm' } — null hides the sheet
 * @param {boolean} busy         a delete is in flight (blocks double taps)
 */
export default function PrayerActionSheet({ request, busy, colors, isDark, onClose, onEdit, onAskDelete, onConfirmDelete }) {
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();
  const visible = !!request;
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(request);
  const progress = useRef(new Animated.Value(0)).current;

  // Keep the last request around while the sheet animates out.
  useEffect(() => {
    if (request) setShown(request);
  }, [request]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, progress]);

  if (!mounted || !shown) return null;

  const item = shown.item;
  const confirming = shown.step === 'confirm';
  const sheetBg = isDark ? colors.bgSecondary : '#FFFBF6';
  const rowBg = isDark ? colors.bgCard : '#FFFFFF';
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [Math.min(windowH, 420), 0] });
  const title = item?.title || 'this prayer';
  const isCommunity = item?.kind === 'community' || (item?.category && item.category !== 'personal');

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={busy ? undefined : onClose}>
      <View style={styles.fill}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={busy ? undefined : onClose} accessibilityLabel="Close" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: sheetBg,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 12) + 4,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {confirming ? (
            <View style={styles.body}>
              <View style={[styles.warnIcon, { backgroundColor: colors.error + '1F' }]}>
                <Ionicons name="trash-outline" size={22} color={colors.error} />
              </View>
              <Text style={[styles.heading, { color: colors.textPrimary }]}>Delete this prayer?</Text>
              <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={3}>
                {`"${title}" will be permanently removed. This can't be undone.`}
              </Text>
              <View style={styles.btnRow}>
                <TouchableOpacity
                  onPress={onClose}
                  disabled={busy}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  style={[styles.btn, { backgroundColor: rowBg, borderColor: colors.border }]}
                >
                  <Text style={[styles.btnText, { color: colors.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onConfirmDelete(item)}
                  disabled={busy}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm delete"
                  style={[styles.btn, styles.btnDanger, { backgroundColor: colors.error, opacity: busy ? 0.7 : 1 }]}
                >
                  {busy ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                  <Text style={[styles.btnText, { color: '#FFFFFF' }]}>{busy ? 'Deleting…' : 'Delete'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.body}>
              <Text style={[styles.menuTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {item?.title || 'Prayer'}
              </Text>
              <TouchableOpacity
                onPress={() => onEdit(item)}
                activeOpacity={0.8}
                accessibilityRole="button"
                style={[styles.row, { backgroundColor: rowBg, borderColor: colors.border }]}
              >
                <Ionicons name="create-outline" size={19} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowText, { color: colors.textPrimary }]}>Edit prayer</Text>
                  {isCommunity ? (
                    <Text style={[styles.rowCaption, { color: colors.textMuted }]}>Edits are reviewed again before showing</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onAskDelete(item)}
                activeOpacity={0.8}
                accessibilityRole="button"
                style={[styles.row, { backgroundColor: rowBg, borderColor: colors.border }]}
              >
                <Ionicons name="trash-outline" size={19} color={colors.error} />
                <Text style={[styles.rowText, { color: colors.error }]}>Delete prayer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.8}
                accessibilityRole="button"
                style={[styles.cancelRow]}
              >
                <Text style={[styles.btnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderBottomWidth: 0,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginTop: 10 },
  body: { paddingHorizontal: 20, paddingTop: 14 },
  menuTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  rowText: { fontSize: 15, fontWeight: '700' },
  rowCaption: { fontSize: 11.5, fontWeight: '500', marginTop: 1 },
  cancelRow: { minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  warnIcon: { alignSelf: 'center', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heading: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  message: { fontSize: 13.5, lineHeight: 20, fontWeight: '500', textAlign: 'center', marginTop: 6, marginBottom: 18 },
  btnRow: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  btnDanger: { borderWidth: 0 },
  btnText: { fontSize: 14.5, fontWeight: '700' },
});
