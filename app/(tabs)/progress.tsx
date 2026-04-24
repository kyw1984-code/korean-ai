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
import { Colors } from '../../constants/Colors';
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
  const weekly = sessions.filter((s) => new Date(s.startedAt).toISOString().split('T')[0] >= weekStart);
  const minutes = weekly.reduce((acc, s) => acc + (s.endedAt ? Math.round((s.endedAt - s.startedAt) / 60000) : 0), 0);
  const scenarioIds = new Set(weekly.map((s) => s.scenario.id));
  const scores = weekly.flatMap((s) => s.messages.filter((m) => m.feedback?.naturalScore !== undefined).map((m) => m.feedback!.naturalScore));
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : null;
  return { sessions: weekly.length, minutes, scenarios: scenarioIds.size, avgScore };
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
  const totalMinutes = sessionHistory.reduce((acc, s) => acc + (s.endedAt ? Math.round((s.endedAt - s.startedAt) / 60000) : 0), 0);
  const weekly = useMemo(() => computeWeeklyStats(sessionHistory), [sessionHistory]);
  const streakDays = profile?.streakDays ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Row */}
      <View style={styles.tabRow}>
        {(['progress', 'vocab'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'progress' ? `📊  ${t.progress.title}` : `📖  단어장${vocabEntries.length > 0 ? ` (${vocabEntries.length})` : ''}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'vocab' ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {vocabEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={styles.emptyTitle}>단어장이 비어있어요</Text>
              <Text style={styles.emptyText}>AI 메시지를 길게 누르면{'\n'}표현을 저장할 수 있어요</Text>
            </View>
          ) : (
            vocabEntries.map((entry) => (
              <View key={entry.id} style={styles.vocabCard}>
                <View style={styles.vocabInfo}>
                  <Text style={styles.vocabKorean}>{entry.korean}</Text>
                  <Text style={styles.vocabDate}>{new Date(entry.savedAt).toLocaleDateString()}</Text>
                </View>
                <TouchableOpacity onPress={() => removeWord(entry.id)} style={styles.vocabDelete}>
                  <Text style={styles.vocabDeleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Streak Banner */}
          <View style={styles.streakBanner}>
            <View style={styles.streakLeft}>
              <Text style={styles.streakLabel}>{t.progress.streak}</Text>
              {streakDays > 0 ? (
                <Text style={styles.streakValue}>{t.progress.streakDays(streakDays)}</Text>
              ) : (
                <Text style={styles.streakEmpty}>{t.progress.streakEmpty}</Text>
              )}
            </View>
            <Text style={styles.streakFlame}>{streakDays > 0 ? '🔥' : '💤'}</Text>
          </View>

          {/* Today */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.progress.today}</Text>
            <View style={styles.statsRow}>
              <StatCard emoji="⏱" value={`${usageToday.minutesUsed}m`} label={t.progress.practiced} colors={colors} accent={Colors.primary} />
              <StatCard emoji="📺" value={String(usageToday.adsWatched)} label={t.progress.adsWatched} colors={colors} accent={Colors.teal} />
              <StatCard emoji="✅" value={String(usageToday.sessionsCompleted)} label={t.progress.sessions} colors={colors} accent={Colors.gold} />
            </View>
          </View>

          {/* Weekly */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.progress.weeklyReport}</Text>
            {isPro ? (
              <View style={styles.statsRow}>
                <StatCard emoji="⏱" value={`${weekly.minutes}m`} label={t.progress.weeklyMinutes} colors={colors} accent={Colors.primary} />
                <StatCard emoji="💬" value={String(weekly.sessions)} label={t.progress.weeklySessions} colors={colors} accent={Colors.teal} />
                <StatCard emoji="🗂" value={String(weekly.scenarios)} label={t.progress.weeklyScenarios} colors={colors} accent={Colors.gold} />
                <StatCard emoji="⭐" value={weekly.avgScore !== null ? String(weekly.avgScore) : '—'} label={t.progress.weeklyAvgScore} colors={colors} accent={Colors.info} />
              </View>
            ) : (
              <TouchableOpacity style={styles.proLock} onPress={() => router.push('/paywall')} activeOpacity={0.8}>
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
              <StatCard emoji="🎯" value={String(totalSessions)} label={t.progress.sessions} colors={colors} accent={Colors.primary} />
              <StatCard emoji="🕐" value={`${totalMinutes}m`} label={t.progress.totalPractice} colors={colors} accent={Colors.teal} />
            </View>
          </View>

          {/* Recent Sessions */}
          {sessionHistory.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.progress.recentSessions}</Text>
              {sessionHistory.slice(0, 5).map((session) => (
                <TouchableOpacity key={session.id} style={styles.sessionCard} onPress={() => setReplaySession(session)} activeOpacity={0.75}>
                  <View style={styles.sessionEmojiContainer}>
                    <Text style={styles.sessionEmoji}>{session.scenario.emoji}</Text>
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTitle}>{session.scenario.titleEn}</Text>
                    <Text style={styles.sessionMeta}>
                      {t.progress.turns(session.turnsUsed)} · {session.endedAt ? `${Math.round((session.endedAt - session.startedAt) / 60000)}m` : t.progress.inProgress}
                    </Text>
                  </View>
                  <Text style={styles.sessionArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {totalSessions === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyTitle}>아직 세션이 없어요</Text>
              <Text style={styles.emptyText}>{t.progress.emptyText}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Replay Modal */}
      <Modal visible={replaySession !== null} animationType="slide" onRequestClose={() => setReplaySession(null)}>
        <SafeAreaView style={styles.container}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{replaySession?.scenario.emoji}  {replaySession?.scenario.titleEn}</Text>
            <TouchableOpacity onPress={() => setReplaySession(null)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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

function StatCard({ emoji, value, label, colors, accent }: {
  emoji: string; value: string; label: string; colors: ThemeColors; accent: string;
}) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.statCard, { borderTopColor: accent, borderTopWidth: 2 }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 20, paddingBottom: 40 },

    tabRow: {
      flexDirection: 'row',
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    tab: {
      flex: 1,
      paddingVertical: 15,
      alignItems: 'center',
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: Colors.primary,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textTertiary,
      letterSpacing: 0.2,
    },
    tabTextActive: { color: Colors.primary },

    streakBanner: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    streakLeft: { flex: 1 },
    streakLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 4 },
    streakValue: { fontSize: 30, fontWeight: '800', color: Colors.primary, letterSpacing: -0.5 },
    streakEmpty: { fontSize: 14, color: colors.textTertiary },
    streakFlame: { fontSize: 36 },

    section: { marginBottom: 28 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 12,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },

    statsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    statCard: {
      flex: 1,
      minWidth: 70,
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    statEmoji: { fontSize: 20, marginBottom: 8 },
    statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    statLabel: { fontSize: 10, color: colors.textTertiary, marginTop: 3, textAlign: 'center', fontWeight: '500', letterSpacing: 0.2 },

    proLock: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 22,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    lockIcon: { fontSize: 28, marginBottom: 10 },
    proLockText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, textAlign: 'center', marginBottom: 8 },
    proLockCta: { fontSize: 14, fontWeight: '800', color: Colors.primary },

    sessionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
      gap: 14,
    },
    sessionEmojiContainer: {
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sessionEmoji: { fontSize: 24 },
    sessionInfo: { flex: 1 },
    sessionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
    sessionMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
    sessionArrow: { fontSize: 22, color: colors.textTertiary, fontWeight: '300' },

    emptyState: { alignItems: 'center', paddingTop: 70 },
    emptyEmoji: { fontSize: 52, marginBottom: 16 },
    emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 8 },
    emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

    vocabCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 8,
    },
    vocabInfo: { flex: 1 },
    vocabKorean: { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
    vocabDate: { fontSize: 11, color: colors.textTertiary, marginTop: 3 },
    vocabDelete: { padding: 6 },
    vocabDeleteText: { fontSize: 15, color: colors.textTertiary },

    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    modalTitle: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1, letterSpacing: -0.2 },
    modalClose: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalCloseText: { fontSize: 14, color: colors.textSecondary },
    replayBubble: { maxWidth: '80%', borderRadius: 18, padding: 12, marginBottom: 8 },
    replayUser: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
    replayAssistant: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    replayText: { fontSize: 14, lineHeight: 20 },
    replayTextUser: { color: '#FFFFFF' },
    replayTextAssistant: { color: colors.text },
  });
}
