import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../stores/useUserStore';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { Colors } from '../../constants/Colors';

const LEVELS = [
  { id: 'beginner' as const, label: 'Beginner 🌱' },
  { id: 'intermediate' as const, label: 'Intermediate 🌿' },
  { id: 'advanced' as const, label: 'Advanced 🌳' },
];

export default function SettingsScreen() {
  const profile = useUserStore((s) => s.profile);
  const setLevel = useUserStore((s) => s.setLevel);
  const { tier, isPro } = useSubscriptionStore();

  function handleUpgrade() {
    router.push('/paywall');
  }

  function handleRestorePurchases() {
    Alert.alert('Restore Purchases', 'Checking your purchases...');
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        {/* Subscription status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.card}>
            <View style={styles.tierRow}>
              <Text style={styles.tierEmoji}>{isPro() ? '⭐' : '🆓'}</Text>
              <View>
                <Text style={styles.tierLabel}>{isPro() ? 'Pro' : 'Free'}</Text>
                <Text style={styles.tierDesc}>
                  {isPro() ? 'Unlimited practice' : 'Watch ads for free time'}
                </Text>
              </View>
            </View>
            {!isPro() && (
              <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
                <Text style={styles.upgradeText}>Upgrade to Pro →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Korean Level</Text>
          {LEVELS.map((level) => (
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

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.menuRow} onPress={handleRestorePurchases}>
            <Text style={styles.menuText}>Restore Purchases</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>KoreanTalk v1.0.0 · com.shoktree.koreantalk</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.light.text, marginBottom: 24 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text, marginBottom: 12 },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  tierEmoji: { fontSize: 32 },
  tierLabel: { fontSize: 18, fontWeight: '800', color: Colors.light.text },
  tierDesc: { fontSize: 13, color: Colors.light.textSecondary },
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
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 8,
  },
  levelRowActive: { borderColor: Colors.primary, backgroundColor: '#FFF5F5' },
  levelText: { fontSize: 16, fontWeight: '600', color: Colors.light.text },
  levelTextActive: { color: Colors.primary },
  check: { fontSize: 18, color: Colors.primary, fontWeight: '700' },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  menuText: { fontSize: 16, color: Colors.light.text },
  menuArrow: { fontSize: 20, color: Colors.light.textSecondary },
  version: { fontSize: 12, color: Colors.light.textSecondary, textAlign: 'center', marginTop: 8 },
});
