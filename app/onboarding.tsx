import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../stores/useUserStore';
import { Colors } from '../constants/Colors';
import { Strings } from '../constants/Strings';

type Level = 'beginner' | 'intermediate' | 'advanced';

const LEVELS: Array<{ id: Level; emoji: string; label: string; description: string }> = [
  { id: 'beginner', emoji: '🌱', label: 'Beginner', description: 'I know a few words and basic phrases' },
  { id: 'intermediate', emoji: '🌿', label: 'Intermediate', description: 'I can have simple conversations' },
  { id: 'advanced', emoji: '🌳', label: 'Advanced', description: 'I can express complex ideas in Korean' },
];

export default function OnboardingScreen() {
  const [selectedLevel, setSelectedLevel] = useState<Level>('beginner');
  const setLevel = useUserStore((s) => s.setLevel);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);

  function handleStart() {
    setLevel(selectedLevel);
    completeOnboarding();
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.emoji}>🇰🇷</Text>
        <Text style={styles.title}>{Strings.onboarding.title}</Text>
        <Text style={styles.subtitle}>{Strings.onboarding.subtitle}</Text>

        <Text style={styles.sectionLabel}>What's your Korean level?</Text>

        {LEVELS.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[styles.levelCard, selectedLevel === level.id && styles.levelCardSelected]}
            onPress={() => setSelectedLevel(level.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.levelEmoji}>{level.emoji}</Text>
            <View style={styles.levelText}>
              <Text style={[styles.levelLabel, selectedLevel === level.id && styles.levelLabelSelected]}>
                {level.label}
              </Text>
              <Text style={styles.levelDesc}>{level.description}</Text>
            </View>
            {selectedLevel === level.id && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.ctaButton} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.ctaText}>{Strings.onboarding.ctaStart} →</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Free to start. Watch ads for more practice time. No credit card needed.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    marginBottom: 12,
  },
  levelCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF5F5',
  },
  levelEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  levelText: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  levelLabelSelected: {
    color: Colors.primary,
  },
  levelDesc: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  checkmark: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '700',
  },
  ctaButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  disclaimer: {
    marginTop: 20,
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
