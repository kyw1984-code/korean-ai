import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../stores/useUserStore';
import { useConversationStore } from '../../stores/useConversationStore';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { useVocabStore } from '../../stores/useVocabStore';
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
  const { entries: vocabEntries, removeWord } = useVocabStore();
  const colors = useThemeColors();
  const t = useTranslation();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState<'progress' | 'vocab'>('progress');
  const [replaySession, setReplaySession] = useState<ConversationSession | null>(null);

  const totalSessions = sessionHistory.length;
  const totalMinutes = sessionHistory.reduce((acc, s) => {
    return acc + (s.endedAt ? Math.round((s.endedAt - s.startedAt) / 60000) : 0);
  }, 0);

  const weekly = useMemo(() => computeWeeklyStats(sessionHistory), [sessionHistory]);
  const streakDays = profile?.streakDays ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'progress' && styles.tabActive]}
          onPress={() => setActiveTab('progress')}
        >
          <Text style={[styles.tabText, activeTab === 'progress' && styles.tabTextActive]}>
            📊 {t.progress.title}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'vocab' && styles.tabActive]}
          onPress={() => setActiveTab('vocab')}
        >
          <Text style={[styles.tabText, activeTab === 'vocab' && styles.tabTextActive]}>
            📖 단어장 {vocabEntries.length > 0 ? `(${vocabEntries.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'vocab' ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          {vocabEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={styles.emptyText}>AI 메시지를 길게 누르면{'\n'}단어를 저장할 수 있어요!</Text>
            </View>
          ) : (
            vocabEntries.map((entry) => (
              <View key={entry.id} style={styles.vocabCard}>
                <View style={styles.vocabInfo}>
                  <Text style={styles.vocabKorean}>{entry.korean}</Text>
                  <Text style={styles.vocabDate}>
                    {new Date(entry.savedAt).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeWord(entry.id)} style={styles.vocabDelete}>
                  <Text style={styles.vocabDeleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      ) : (
      <ScrollView contentContainerStyle={styles.scroll}>

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
              <TouchableOpacity key={session.id} style={styles.sessionCard} onPress={() => setReplaySession(session)}>
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
              </TouchableOpacity>
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
      )}

      {/* Session replay modal */}
      <Modal visible={replaySession !== null} animationType="slide" onRequestClose={() => setReplaySession(null)}>
        <SafeAreaView style={styles.container}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {replaySession?.scenario.emoji} {replaySession?.scenario.titleEn}
            </Text>
            <TouchableOpacity onPress={() => setReplaySession(null)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.scroll}>
            {replaySession?.messages.map((msg) => (
              <View key={msg.id} style={[styles.replayBubble, msg.role === 'user' ? styles.replayUser : styles.replayAssistant]}>
                <Text style={[styles.replayText, msg.role === 'user' ? styles.replayTextUser : styles.replayTextAssistant]}>
                  {msg.content}
                </Text>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    tabRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    tab: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: '#ff6b6b',
    },
    tabText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    tabTextActive: { color: '#ff6b6b' },
    vocabCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 8,
    },
    vocabInfo: { flex: 1 },
    vocabKorean: { fontSize: 16, fontWeight: '700', color: colors.text },
    vocabDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    vocabDelete: { padding: 6 },
    vocabDeleteText: { fontSize: 16, color: colors.textSecondary },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text, flex: 1 },
    modalClose: { padding: 4 },
    modalCloseText: { fontSize: 18, color: colors.textSecondary },
    replayBubble: {
      maxWidth: '80%',
      borderRadius: 16,
      padding: 12,
      marginBottom: 8,
    },
    replayUser: { alignSelf: 'flex-end', backgroundColor: '#ff6b6b' },
    replayAssistant: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    replayText: { fontSize: 14, lineHeight: 20 },
    replayTextUser: { color: '#FFFFFF' },
    replayTextAssistant: { color: colors.text },
  });
}
