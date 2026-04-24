import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../stores/useUserStore';
import { useConversationStore } from '../../stores/useConversationStore';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { useThemeColors, type ThemeColors } from '../../hooks/useThemeColors';
import { useTranslation } from '../../hooks/useTranslation';
import type { ConversationSession } from '../../types';

function getWeekStartISO(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function computeWeeklyStats(sessions: ConversationSession[]) {
  const weekStart = getWeekStartISO();
  const weekly = sessions.filter((s) => {
    const date = new Date(s.startedAt).toISOString().split('T')[0];
    return date >= weekStart;
  });

  const minutes = weekly.reduce((acc, s) => {
    return acc + (s.endedAt ? Math.round((s.endedAt - s.startedAt) / 60000) : 0);
  }, 0);

  const scenarioIds = new Set(weekly.map((s) => s.scenario.id));

  const scores = weekly.flatMap((s) =>
    s.messages
      .filter((m) => m.feedback?.naturalScore !== undefined)
      .map((m) => m.feedback!.naturalScore)
  );
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
    : null;

  return {
    sessions: weekly.length,
    minutes,
    scenarios: scenarioIds.size,
    avgScore,
  };
}

export default function ProgressScreen() {
  const usageToday = useUserStore((s) => s.usageToday);
  const profile = useUserStore((s) => s.profile);
  const sessionHistory = useConversationStore((s) => s.sessionHistory);
  const isPro = useSubscriptionStore((s) => s.isPro());
  const colors = useThemeColors();
  const t = useTranslation();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const totalSessions = sessionHistory.length;
  const totalMinutes = sessionHistory.reduce((acc, s) => {
    return acc + (s.endedAt ? Math.round((s.endedAt - s.startedAt) / 60000) : 0);
  }, 0);

  const weekly = useMemo(() => computeWeeklyStats(sessionHistory), [sessionHistory]);
  const streakDays = profile?.streakDays ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t.progress.title}</Text>

        {/* Streak banner */}
        <View style={styles.streakBanner}>
          <Text style={styles.streakLabel}>{t.progress.streak}</Text>
          {streakDays > 0 ? (
            <Text style={styles.streakValue}>{t.progress.streakDays(streakDays)}</Text>
          ) : (
            <Text style={styles.streakEmpty}>{t.progress.streakEmpty}</Text>
          )}
        </View>

        {/* Today */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.progress.today}</Text>
          <View style={styles.statsRow}>
            <StatCard
              emoji="⏱️"
              value={`${usageToday.minutesUsed}m`}
              label={t.progress.practiced}
              colors={colors}
            />
            <StatCard
              emoji="📺"
              value={String(usageToday.adsWatched)}
              label={t.progress.adsWatched}
              colors={colors}
            />
            <StatCard
              emoji="✅"
              value={String(usageToday.sessionsCompleted)}
              label={t.progress.sessions}
              colors={colors}
            />
          </View>
        </View>

        {/* Weekly Report */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.progress.weeklyReport}</Text>
          {isPro ? (
            <View style={styles.statsRow}>
              <StatCard emoji="⏱️" value={`${weekly.minutes}m`} label={t.progress.weeklyMinutes} colors={colors} />
              <StatCard emoji="💬" value={String(weekly.sessions)} label={t.progress.weeklySessions} colors={colors} />
              <StatCard emoji="🗂️" value={String(weekly.scenarios)} label={t.progress.weeklyScenarios} colors={colors} />
              <StatCard
                emoji="⭐"
                value={weekly.avgScore !== null ? String(weekly.avgScore) : '—'}
                label={t.progress.weeklyAvgScore}
                colors={colors}
              />
            </View>
          ) : (
            <TouchableOpacity style={styles.proLock} onPress={() => router.push('/paywall')}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.proLockText}>{t.progress.weeklyProLocked}</Text>
              <Text style={styles.proLockCta}>{t.progress.weeklyUnlockCta}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* All-time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.progress.allTime}</Text>
          <View style={styles.statsRow}>
            <StatCard emoji="🎯" value={String(totalSessions)} label={t.progress.sessions} colors={colors} />
            <StatCard emoji="🕐" value={`${totalMinutes}m`} label={t.progress.totalPractice} colors={colors} />
          </View>
        </View>

        {/* Recent sessions */}
        {sessionHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.progress.recentSessions}</Text>
            {sessionHistory.slice(0, 5).map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <Text style={styles.sessionEmoji}>{session.scenario.emoji}</Text>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle}>{session.scenario.titleEn}</Text>
                  <Text style={styles.sessionMeta}>
                    {t.progress.turns(session.turnsUsed)} ·{' '}
                    {session.endedAt
                      ? `${Math.round((session.endedAt - session.startedAt) / 60000)}m`
                      : t.progress.inProgress}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {totalSessions === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyText}>{t.progress.emptyText}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  emoji,
  value,
  label,
  colors,
}: {
  emoji: string;
  value: string;
  label: string;
  colors: ThemeColors;
}) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 24 },
    streakBanner: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 28,
      borderWidth: 1,
      borderColor: colors.border,
    },
    streakLabel: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
    streakValue: { fontSize: 28, fontWeight: '800', color: '#ff6b6b' },
    streakEmpty: { fontSize: 14, color: colors.textSecondary },
    section: { marginBottom: 28 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
    statsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    statCard: {
      flex: 1,
      minWidth: 70,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statEmoji: { fontSize: 22, marginBottom: 6 },
    statValue: { fontSize: 20, fontWeight: '800', color: colors.text },
    statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
    proLock: {
      backgroundColor: colors.lockBg,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    lockIcon: { fontSize: 28, marginBottom: 8 },
    proLockText: { fontSize: 15, fontWeight: '600', color: colors.lockText, textAlign: 'center', marginBottom: 8 },
    proLockCta: { fontSize: 14, fontWeight: '700', color: '#ff6b6b' },
    sessionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
      gap: 12,
    },
    sessionEmoji: { fontSize: 28 },
    sessionInfo: { flex: 1 },
    sessionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    sessionMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyEmoji: { fontSize: 48, marginBottom: 16 },
    emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center' },
  });
}
