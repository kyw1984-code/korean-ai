import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SCENARIOS, Scenario, ScenarioLevel, LEVEL_LABELS, LEVEL_COLORS } from '../../constants/Scenarios';
import { useUserStore } from '../../stores/useUserStore';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { Colors } from '../../constants/Colors';
import { Config } from '../../constants/Config';
import { useThemeColors, type ThemeColors } from '../../hooks/useThemeColors';
import { useTranslation } from '../../hooks/useTranslation';

const LEVEL_FILTERS: Array<ScenarioLevel | 'all'> = ['all', 'beginner', 'intermediate', 'advanced'];

function getDailyChallenge(): Scenario {
  const seed = parseInt(new Date().toISOString().split('T')[0].replace(/-/g, ''), 10);
  return SCENARIOS[seed % SCENARIOS.length];
}

export default function HomeScreen() {
  const [activeFilter, setActiveFilter] = useState<ScenarioLevel | 'all'>('all');
  const profile = useUserStore((s) => s.profile);
  const usageToday = useUserStore((s) => s.usageToday);
  const { isPro } = useSubscriptionStore();
  const colors = useThemeColors();
  const t = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const freeMinutes = isPro()
    ? Infinity
    : usageToday.adsWatched * Config.freeMinutesPerAd - usageToday.minutesUsed;
  const displayMinutes = isPro() ? '∞' : String(Math.max(0, Math.round(freeMinutes)));
  const dailyChallenge = useMemo(() => getDailyChallenge(), []);

  const filtered = activeFilter === 'all'
    ? SCENARIOS
    : SCENARIOS.filter((s) => s.level === activeFilter);

  function handleScenario(scenario: Scenario) {
    if (scenario.isPremium && !isPro()) {
      router.push('/paywall');
      return;
    }
    router.push(`/chat/${scenario.id}`);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{t.home.greeting}</Text>
          <Text style={styles.levelBadge}>
            <Text style={styles.levelValue}>{(profile?.level ?? 'beginner').toUpperCase()}</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.timerBadge}
          onPress={freeMinutes <= 0 && !isPro() ? () => router.push('/paywall') : undefined}
        >
          <Text style={styles.timerEmoji}>⏱</Text>
          <Text style={styles.timerText}>{displayMinutes} min</Text>
        </TouchableOpacity>
      </View>

      {/* Daily Challenge */}
      <TouchableOpacity style={styles.challenge} onPress={() => handleScenario(dailyChallenge)} activeOpacity={0.85}>
        <View style={styles.challengeGlow} />
        <View style={styles.challengeLeft}>
          <Text style={styles.challengeTag}>✦  오늘의 챌린지</Text>
          <Text style={styles.challengeTitle}>{dailyChallenge.emoji}  {dailyChallenge.titleEn}</Text>
        </View>
        <Text style={styles.challengeArrow}>›</Text>
      </TouchableOpacity>

      {/* Level Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {LEVEL_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f === 'all' ? t.home.filterAll : LEVEL_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered as Scenario[]}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ScenarioCard
            scenario={item}
            isLocked={item.isPremium && !isPro()}
            onPress={() => handleScenario(item)}
            colors={colors}
          />
        )}
      />
    </SafeAreaView>
  );
}

function ScenarioCard({
  scenario,
  isLocked,
  onPress,
  colors,
}: {
  scenario: Scenario;
  isLocked: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity
      style={[styles.card, isLocked && styles.cardLocked]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {isLocked && (
        <View style={styles.lockBadge}>
          <Text style={styles.lockText}>PRO</Text>
        </View>
      )}
      <Text style={styles.cardEmoji}>{scenario.emoji}</Text>
      <Text style={styles.cardTitle} numberOfLines={2}>{scenario.titleEn}</Text>
      <View style={[styles.levelTag, { backgroundColor: LEVEL_COLORS[scenario.level] + '18' }]}>
        <Text style={[styles.levelTagText, { color: LEVEL_COLORS[scenario.level] }]}>
          {LEVEL_LABELS[scenario.level]}
        </Text>
      </View>
      <Text style={styles.cardTime}>~{scenario.estimatedMinutes} min</Text>
    </TouchableOpacity>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 22,
      paddingTop: 6,
      paddingBottom: 18,
    },
    greeting: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
    },
    levelBadge: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 3,
      letterSpacing: 1.2,
    },
    levelValue: {
      color: Colors.primary,
      fontWeight: '700',
    },
    timerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 24,
      gap: 5,
    },
    timerEmoji: { fontSize: 14 },
    timerText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.2,
    },

    challenge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: colors.isDark ? 'rgba(232,50,90,0.10)' : 'rgba(232,50,90,0.06)',
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: 'rgba(232,50,90,0.20)',
      overflow: 'hidden',
    },
    challengeGlow: {
      position: 'absolute',
      top: -40,
      right: -30,
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(232,50,90,0.12)',
    },
    challengeLeft: { flex: 1 },
    challengeTag: {
      fontSize: 11,
      fontWeight: '700',
      color: Colors.primary,
      marginBottom: 5,
      letterSpacing: 0.8,
    },
    challengeTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.2,
    },
    challengeArrow: {
      fontSize: 28,
      color: Colors.primary,
      fontWeight: '300',
      marginLeft: 8,
    },

    filterRow: {
      paddingHorizontal: 16,
      paddingBottom: 14,
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    filterChipActive: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    filterText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.1,
    },
    filterTextActive: { color: '#FFFFFF' },

    grid: { paddingHorizontal: 12, paddingBottom: 32 },
    gridRow: { justifyContent: 'space-between', marginBottom: 12 },

    card: {
      flex: 1,
      margin: 6,
      padding: 18,
      backgroundColor: colors.card,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.isDark ? '#000' : 'rgba(0,0,0,0.06)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: colors.isDark ? 0.4 : 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    cardLocked: { opacity: 0.6 },
    lockBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: colors.isDark ? 'rgba(240,192,64,0.15)' : 'rgba(240,192,64,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(240,192,64,0.30)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    lockText: {
      fontSize: 9,
      fontWeight: '800',
      color: Colors.gold,
      letterSpacing: 0.8,
    },
    cardEmoji: { fontSize: 34, marginBottom: 10 },
    cardTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 10,
      lineHeight: 20,
      letterSpacing: -0.2,
    },
    levelTag: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      marginBottom: 8,
    },
    levelTagText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
    cardTime: { fontSize: 11, color: colors.textTertiary, fontWeight: '500' },
  });
}
