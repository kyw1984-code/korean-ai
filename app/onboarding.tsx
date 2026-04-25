import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../stores/useUserStore';
import { Colors } from '../constants/Colors';
import { useThemeColors, type ThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../hooks/useTranslation';

type Level = 'beginner' | 'intermediate' | 'advanced';
type Step = 'hook' | 'level';

export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>('hook');
  const [selectedLevel, setSelectedLevel] = useState<Level>('beginner');
  const setLevel = useUserStore((s) => s.setLevel);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const colors = useThemeColors();
  const t = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  function handleStart() {
    setLevel(selectedLevel);
    completeOnboarding();
    router.replace('/(tabs)');
  }

  if (step === 'hook') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.kdramaEmoji}>🦉</Text>
          <Text style={styles.title}>{t.onboarding.hook.title}</Text>
          <Text style={styles.subtitle}>{t.onboarding.hook.subtitle}</Text>

          <View style={styles.sampleCard}>
            {t.onboarding.hook.sample.map((msg, i) => (
              <View
                key={i}
                style={[styles.sampleBubbleRow, msg.role === 'user' ? styles.bubbleRight : styles.bubbleLeft]}
              >
                {msg.role === 'ai' && <Text style={styles.sampleAvatar}>🤖</Text>}
                <View style={styles.sampleBubbleCol}>
                  <View style={[
                    styles.sampleBubble,
                    msg.role === 'ai' ? styles.sampleBubbleAi : styles.sampleBubbleUser,
                  ]}>
                    <Text style={[
                      styles.sampleText,
                      msg.role === 'ai' ? styles.sampleTextAi : styles.sampleTextUser,
                    ]}>
                      {msg.text}
                    </Text>
                  </View>
                  {msg.note && <Text style={styles.sampleNote}>{msg.note}</Text>}
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.ctaButton} onPress={() => setStep('level')} activeOpacity={0.85}>
            <Text style={styles.ctaText}>{t.onboarding.hook.nextButton}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const levels: Level[] = ['beginner', 'intermediate', 'advanced'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep('hook')}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.emoji}>🇰🇷</Text>
        <Text style={styles.sectionLabel}>{t.onboarding.levelQuestion}</Text>

        {levels.map((id) => {
          const levelData = t.onboarding.levels[id];
          const isSelected = selectedLevel === id;
          return (
            <TouchableOpacity
              key={id}
              style={[styles.levelCard, isSelected && styles.levelCardSelected]}
              onPress={() => setSelectedLevel(id)}
              activeOpacity={0.8}
            >
              <Text style={styles.levelEmoji}>{levelData.emoji}</Text>
              <View style={styles.levelText}>
                <Text style={[styles.levelLabel, isSelected && styles.levelLabelSelected]}>
                  {levelData.label}
                </Text>
                <Text style={styles.levelDesc}>{levelData.description}</Text>
              </View>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.ctaButton} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.ctaText}>{t.onboarding.ctaStart} →</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>{t.onboarding.disclaimer}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48, alignItems: 'center' },
    backBtn: { alignSelf: 'flex-start', marginBottom: 16 },
    backText: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
    kdramaEmoji: { fontSize: 72, marginBottom: 20 },
    emoji: { fontSize: 64, marginBottom: 16 },
    title: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      lineHeight: 38,
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    },
    sampleCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      marginBottom: 32,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    sampleBubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    bubbleLeft: { justifyContent: 'flex-start' },
    bubbleRight: { justifyContent: 'flex-end' },
    sampleAvatar: { fontSize: 24 },
    sampleBubbleCol: { maxWidth: '80%' },
    sampleBubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
    sampleBubbleAi: { backgroundColor: colors.card, borderBottomLeftRadius: 4 },
    sampleBubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4, alignSelf: 'flex-end' },
    sampleText: { fontSize: 15, lineHeight: 22 },
    sampleTextAi: { color: colors.text },
    sampleTextUser: { color: '#FFFFFF' },
    sampleNote: { fontSize: 11, color: colors.textSecondary, marginTop: 4, paddingHorizontal: 4 },
    sectionLabel: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      alignSelf: 'flex-start',
      marginBottom: 20,
    },
    levelCard: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      padding: 16,
      borderRadius: 16,
      borderWidth: 2,
      borderBottomWidth: 5,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surface,
      marginBottom: 12,
    },
    levelCardSelected: { 
      borderColor: Colors.primary, 
      backgroundColor: colors.primaryTint,
      borderBottomWidth: 2,
      transform: [{ translateY: 3 }],
    },
    levelEmoji: { fontSize: 32, marginRight: 16 },
    levelText: { flex: 1 },
    levelLabel: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 2 },
    levelLabelSelected: { color: Colors.primary },
    levelDesc: { fontSize: 13, color: colors.textSecondary },
    checkmark: { fontSize: 20, color: Colors.primary, fontWeight: '700' },
    ctaButton: {
      width: '100%',
      backgroundColor: Colors.primary,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
      marginTop: 12,
      borderBottomWidth: 5,
      borderColor: Colors.primaryDark,
    },
    ctaText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
    disclaimer: { marginTop: 20, fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  });
}
