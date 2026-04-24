import { useMemo, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../stores/useUserStore';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { useSubscription } from '../../hooks/useSubscription';
import { Colors } from '../../constants/Colors';
import { useThemeColors, type ThemeColors } from '../../hooks/useThemeColors';
import { useTranslation } from '../../hooks/useTranslation';
import {
  scheduleDailyReminder,
  cancelDailyReminder,
  isDailyReminderScheduled,
} from '../../services/notificationService';

type Level = 'beginner' | 'intermediate' | 'advanced';

export default function SettingsScreen() {
  const profile = useUserStore((s) => s.profile);
  const setLevel = useUserStore((s) => s.setLevel);
  const { isPro } = useSubscriptionStore();
  const { restore } = useSubscription();
  const colors = useThemeColors();
  const t = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [reminderEnabled, setReminderEnabled] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      isDailyReminderScheduled().then(setReminderEnabled);
    }
  }, []);

  const toggleReminder = async (value: boolean) => {
    if (value) {
      const ok = await scheduleDailyReminder(
        20, 0,
        t.notifications.reminderTitle,
        t.notifications.reminderBody,
      );
      setReminderEnabled(ok);
    } else {
      await cancelDailyReminder();
      setReminderEnabled(false);
    }
  };

  const levels: Array<{ id: Level; label: string }> = [
    { id: 'beginner', label: t.onboarding.levels.beginner.label + ' ' + t.onboarding.levels.beginner.emoji },
    { id: 'intermediate', label: t.onboarding.levels.intermediate.label + ' ' + t.onboarding.levels.intermediate.emoji },
    { id: 'advanced', label: t.onboarding.levels.advanced.label + ' ' + t.onboarding.levels.advanced.emoji },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t.settings.title}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.subscriptionSection}</Text>
          <View style={styles.card}>
            <View style={styles.tierRow}>
              <Text style={styles.tierEmoji}>{isPro() ? '⭐' : '🆓'}</Text>
              <View>
                <Text style={styles.tierLabel}>{isPro() ? t.subscription.proTier : t.subscription.freeTier}</Text>
                <Text style={styles.tierDesc}>
                  {isPro() ? t.subscription.proTierDesc : t.subscription.freeTierDesc}
                </Text>
              </View>
            </View>
            {!isPro() && (
              <TouchableOpacity style={styles.upgradeButton} onPress={() => router.push('/paywall')}>
                <Text style={styles.upgradeText}>{t.subscription.upgradeCta}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.levelSection}</Text>
          {levels.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[styles.levelRow, profile?.level === level.id && styles.levelRowActive]}
              onPress={() => setLevel(level.id)}
            >
              <Text style={[styles.levelText, profile?.level === level.id && styles.levelTextActive]}>
                {level.label}
              </Text>
              {profile?.level === level.id && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {Platform.OS !== 'web' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.notifications.reminderSection}</Text>
            <View style={styles.card}>
              <View style={styles.reminderRow}>
                <Text style={styles.reminderLabel}>
                  {reminderEnabled ? t.notifications.disableReminder : t.notifications.enableReminder}
                </Text>
                <Switch
                  value={reminderEnabled}
                  onValueChange={toggleReminder}
                  trackColor={{ false: colors.border, true: Colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <Text style={styles.reminderHint}>8:00 PM</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.accountSection}</Text>
          <TouchableOpacity style={styles.menuRow} onPress={restore}>
            <Text style={styles.menuText}>{t.settings.restorePurchases}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>KoreanTalk v1.0.0 · com.shoktree.koreantalk</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 24 },
    section: { marginBottom: 28 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tierRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    tierEmoji: { fontSize: 32 },
    tierLabel: { fontSize: 18, fontWeight: '800', color: colors.text },
    tierDesc: { fontSize: 13, color: colors.textSecondary },
    upgradeButton: {
      backgroundColor: Colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    upgradeText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    levelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
    },
    levelRowActive: { borderColor: Colors.primary, backgroundColor: colors.primaryTint },
    levelText: { fontSize: 16, fontWeight: '600', color: colors.text },
    levelTextActive: { color: Colors.primary },
    check: { fontSize: 18, color: Colors.primary, fontWeight: '700' },
    reminderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    reminderLabel: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1 },
    reminderHint: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
    menuRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    menuText: { fontSize: 16, color: colors.text },
    menuArrow: { fontSize: 20, color: colors.textSecondary },
    version: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
  });
}
