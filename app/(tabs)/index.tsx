import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SCENARIOS, Scenario, ScenarioLevel, LEVEL_LABELS, LEVEL_COLORS } from '../../constants/Scenarios';
import { useUserStore } from '../../stores/useUserStore';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { Colors } from '../../constants/Colors';
import { Strings } from '../../constants/Strings';
import { Config } from '../../constants/Config';

const LEVEL_FILTERS: Array<ScenarioLevel | 'all'> = ['all', 'beginner', 'intermediate', 'advanced'];

export default function HomeScreen() {
  const [activeFilter, setActiveFilter] = useState<ScenarioLevel | 'all'>('all');
  const profile = useUserStore((s) => s.profile);
  const usageToday = useUserStore((s) => s.usageToday);
  const { isPro, isAdFree, getMaxDailyMinutes } = useSubscriptionStore();

  const freeMinutes = isPro() ? Infinity : (usageToday.adsWatched * Config.freeMinutesPerAd - usageToday.minutesUsed);
  const displayMinutes = isPro() ? '∞' : `${Math.max(0, Math.round(freeMinutes))}`;

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
          <Text style={styles.greeting}>{Strings.home.greeting}</Text>
          <Text style={styles.levelBadge}>
            Level: <Text style={styles.levelValue}>{profile?.level ?? 'beginner'}</Text>
          </Text>
        </View>
        <View style={styles.timerBadge}>
          <Text style={styles.timerEmoji}>⏱️</Text>
          <Text style={styles.timerText}>{displayMinutes} min</Text>
        </View>
      </View>

      {/* Level filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {LEVEL_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : LEVEL_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Scenario grid */}
      <FlatList
        data={filtered as Scenario[]}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => (
          <ScenarioCard
            scenario={item}
            isLocked={item.isPremium && !isPro()}
            onPress={() => handleScenario(item)}
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
}: {
  scenario: Scenario;
  isLocked: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, isLocked && styles.cardLocked]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {isLocked && (
        <View style={styles.lockBadge}>
          <Text style={styles.lockText}>PRO</Text>
        </View>
      )}
      <Text style={styles.cardEmoji}>{scenario.emoji}</Text>
      <Text style={styles.cardTitle} numberOfLines={2}>{scenario.titleEn}</Text>
      <View style={[styles.levelTag, { backgroundColor: LEVEL_COLORS[scenario.level] + '20' }]}>
        <Text style={[styles.levelTagText, { color: LEVEL_COLORS[scenario.level] }]}>
          {LEVEL_LABELS[scenario.level]}
        </Text>
      </View>
      <Text style={styles.cardTime}>~{scenario.estimatedMinutes} min</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.text,
  },
  levelBadge: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  levelValue: {
    color: Colors.primary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerEmoji: { fontSize: 16, marginRight: 4 },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  filterRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  grid: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    flex: 1,
    margin: 6,
    padding: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLocked: {
    opacity: 0.75,
  },
  lockBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  lockText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78350F',
  },
  cardEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  levelTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  levelTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});
