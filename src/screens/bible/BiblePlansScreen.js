import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { READING_PLANS } from '../../constants/bible';
import { useBible } from '../../context/BibleContext';
import { useBibleTheme } from '../../hooks/useBibleTheme';
import BackHeader from '../../components/common/BackHeader';

export default function BiblePlansScreen() {
  const route = useRoute();
  const theme = useBibleTheme();
  const { planProgress, completePlanDay } = useBible();
  const focusId = route.params?.planId;
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.root}>
      <BackHeader title="Reading Plans" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {READING_PLANS.map((plan) => {
          const progress = planProgress[plan.id];
          const done = progress?.completedDays?.length || 0;
          const nextDay = done + 1;
          const pct = Math.round((done / plan.days) * 100);
          const focused = !focusId || focusId === plan.id;
          if (!focused) return null;
          return (
            <View key={plan.id} style={styles.card}>
              <Text style={styles.title}>{plan.title}</Text>
              <Text style={styles.sub}>{plan.subtitle}</Text>
              <View style={styles.track}><View style={[styles.fill, { width: `${pct}%`, backgroundColor: plan.color }]} /></View>
              <Text style={styles.meta}>{pct}% · Day {Math.min(nextDay, plan.days)} of {plan.days}</Text>
              {nextDay <= plan.days ? (
                <TouchableOpacity style={[styles.btn, { backgroundColor: plan.color }]} onPress={() => completePlanDay(plan.id, nextDay)}>
                  <Text style={styles.btnText}>Mark Day {nextDay} Complete</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.complete}>Plan completed — praise God!</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    card: { backgroundColor: theme.surface, borderRadius: 18, padding: 18, marginBottom: 14, ...theme.shadow },
    title: { fontSize: 18, fontWeight: '800', color: theme.text },
    sub: { fontSize: 13, color: theme.textMuted, marginTop: 4 },
    track: { height: 8, backgroundColor: theme.border, borderRadius: 999, marginTop: 14, overflow: 'hidden' },
    fill: { height: 8, borderRadius: 999 },
    meta: { fontSize: 12, color: theme.textMuted, marginTop: 8 },
    btn: { marginTop: 14, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    btnText: { color: '#FFF', fontWeight: '800' },
    complete: { marginTop: 14, fontWeight: '700', color: theme.primary },
  });
}
