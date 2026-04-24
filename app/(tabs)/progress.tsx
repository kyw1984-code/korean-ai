import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../stores/useUserStore';
import { useConversationStore } from '../../stores/useConversationStore';
import { Colors } from '../../constants/Colors';
import { useThemeColors, type ThemeColors } from '../../hooks/useThemeColors';
import { useTranslation } from '../../hooks/useTranslation';

export default function ProgressScreen() {
  const usageToday = useUserStore((s) => s.usageToday);
  const sessionHistory = useConversationStore((s) => s.sessionHistory);
  const colors = useThemeColors();
  const t = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const totalSessions = sessionHistory.length;
  const totalMinutes = sessionHistory.reduce((acc, s) => {
    const duration = s.endedAt ? Math.round((s.endedAt - s.startedAt) / 60000) : 0;
    return acc + duration;
  }, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t.progress.title}</Text>

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.progress.allTime}</Text>
          <View style={styles.statsRow}>
            <StatCard emoji="🎯" value={String(totalSessions)} label={t.progress.sessions} colors={colors} />
            <StatCard emoji="🕐" value={`${totalMinutes}m`} label={t.progress.totalPractice} colors={colors} />
          </View>
        </View>

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
    section: { marginBottom: 28 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
    statsRow: { flexDirection: 'row', gap: 12 },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statEmoji: { fontSize: 24, marginBottom: 8 },
    statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
    statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
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
