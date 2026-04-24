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
    if (Platform.OS !== 'web') isDailyReminderScheduled().then(setReminderEnabled);
  }, []);

  const toggleReminder = async (value: boolean) => {
    if (value) {
      const ok = await scheduleDailyReminder(20, 0, t.notifications.reminderTitle, t.notifications.reminderBody);
      setReminderEnabled(ok);
    } else {
      await cancelDailyReminder();
      setReminderEnabled(false);
    }
  };

  const levels: Array<{ id: Level; label: string; emoji: string }> = [
    { id: 'beginner', label: t.onboarding.levels.beginner.label, emoji: t.onboarding.levels.beginner.emoji },
    { id: 'intermediate', label: t.onboarding.levels.intermediate.label, emoji: t.onboarding.levels.intermediate.emoji },
    { id: 'advanced', label: t.onboarding.levels.advanced.label, emoji: t.onboarding.levels.advanced.emoji },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t.settings.title}</Text>

        {/* Subscription Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.subscriptionSection}</Text>
          <View style={[styles.card, isPro() && styles.cardPro]}>
            <View style={styles.tierRow}>
              <View style={[styles.tierIconBg, isPro() && styles.tierIconBgPro]}>
                <Text style={styles.tierEmoji}>{isPro() ? '👑' : '✦'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tierLabel}>{isPro() ? t.subscription.proTier : t.subscription.freeTier}</Text>
                <Text style={styles.tierDesc}>{isPro() ? t.subscription.proTierDesc : t.subscription.freeTierDesc}</Text>
              </View>
            </View>
            {!isPro() && (
              <TouchableOpacity style={styles.upgradeButton} onPress={() => router.push('/paywall')} activeOpacity={0.85}>
                <Text style={styles.upgradeText}>{t.subscription.upgradeCta}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.levelSection}</Text>
          <View style={styles.levelGroup}>
            {levels.map((level, idx) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.levelRow,
                  idx < levels.length - 1 && styles.levelRowBorder,
                  profile?.level === level.id && styles.levelRowActive,
                ]}
                onPress={() => setLevel(level.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.levelEmoji}>{level.emoji}</Text>
                <Text style={[styles.levelText, profile?.level === level.id && styles.levelTextActive]}>
                  {level.label}
                </Text>
                {profile?.level === level.id && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notifications */}
        {Platform.OS !== 'web' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.notifications.reminderSection}</Text>
            <View style={styles.card}>
              <View style={styles.reminderRow}>
                <View>
                  <Text style={styles.reminderLabel}>
                    {reminderEnabled ? t.notifications.disableReminder : t.notifications.enableReminder}
                  </Text>
                  <Text style={styles.reminderHint}>매일 오후 8:00</Text>
                </View>
                <Switch
                  value={reminderEnabled}
                  onValueChange={toggleReminder}
                  trackColor={{ false: colors.border, true: Colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>
        )}

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.accountSection}</Text>
          <View style={styles.menuGroup}>
            <TouchableOpacity style={styles.menuRow} onPress={restore} activeOpacity={0.7}>
              <Text style={styles.menuText}>{t.settings.restorePurchases}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.version}>KoreanTalk v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 22, paddingBottom: 48 },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 28,
      letterSpacing: -0.8,
    },

    section: { marginBottom: 28 },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textTertiary,
      marginBottom: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardPro: {
      borderColor: 'rgba(240,192,64,0.25)',
      backgroundColor: colors.isDark ? 'rgba(240,192,64,0.06)' : 'rgba(240,192,64,0.05)',
    },

    tierRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
    tierIconBg: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tierIconBgPro: { backgroundColor: 'rgba(240,192,64,0.12)' },
    tierEmoji: { fontSize: 24 },
    tierLabel: { fontSize: 17, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
    tierDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

    upgradeButton: {
      backgroundColor: Colors.primary,
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: 'center',
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },
    upgradeText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },

    levelGroup: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    levelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 18,
      gap: 14,
    },
    levelRowBorder: {
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    levelRowActive: { backgroundColor: colors.primaryTint },
    levelEmoji: { fontSize: 22, width: 28, textAlign: 'center' },
    levelText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
    levelTextActive: { color: Colors.primary },
    checkBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkText: { fontSize: 12, color: '#FFFFFF', fontWeight: '800' },

    reminderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    reminderLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
    reminderHint: { fontSize: 12, color: colors.textTertiary, marginTop: 3 },

    menuGroup: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    menuRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 18,
    },
    menuText: { fontSize: 15, color: colors.text, fontWeight: '500' },
    menuArrow: { fontSize: 22, color: colors.textTertiary },

    version: {
      fontSize: 11,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: 12,
      letterSpacing: 0.5,
    },
  });
}
