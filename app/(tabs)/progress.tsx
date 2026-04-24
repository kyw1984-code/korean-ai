import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../stores/useUserStore';
import { useConversationStore } from '../../stores/useConversationStore';
import { Colors } from '../../constants/Colors';

export default function ProgressScreen() {
  const usageToday = useUserStore((s) => s.usageToday);
  const sessionHistory = useConversationStore((s) => s.sessionHistory);

  const totalSessions = sessionHistory.length;
  const totalMinutes = sessionHistory.reduce((acc, s) => {
    const duration = s.endedAt ? Math.round((s.endedAt - s.startedAt) / 60000) : 0;
    return acc + duration;
  }, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Your Progress</Text>

        {/* Today stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          <View style={styles.statsRow}>
            <StatCard emoji="⏱️" value={`${usageToday.minutesUsed}m`} label="Practiced" />
            <StatCard emoji="📺" value={String(usageToday.adsWatched)} label="Ads watched" />
            <StatCard emoji="✅" value={String(usageToday.sessionsCompleted)} label="Sessions" />
          </View>
        </View>

        {/* All time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Time</Text>
          <View style={styles.statsRow}>
            <StatCard emoji="🎯" value={String(totalSessions)} label="Sessions" />
            <StatCard emoji="🕐" value={`${totalMinutes}m`} label="Total practice" />
          </View>
        </View>

        {/* Recent sessions */}
        {sessionHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {sessionHistory.slice(0, 5).map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <Text style={styles.sessionEmoji}>{session.scenario.emoji}</Text>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle}>{session.scenario.titleEn}</Text>
                  <Text style={styles.sessionMeta}>
                    {session.turnsUsed} turns ·{' '}
                    {session.endedAt
                      ? `${Math.round((session.endedAt - session.startedAt) / 60000)}m`
                      : 'in progress'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {totalSessions === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyText}>Complete your first session to see progress!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.light.text, marginBottom: 24 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statEmoji: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.light.text },
  statLabel: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2, textAlign: 'center' },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 8,
    gap: 12,
  },
  sessionEmoji: { fontSize: 28 },
  sessionInfo: { flex: 1 },
  sessionTitle: { fontSize: 15, fontWeight: '700', color: Colors.light.text },
  sessionMeta: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, color: Colors.light.textSecondary, textAlign: 'center' },
});
