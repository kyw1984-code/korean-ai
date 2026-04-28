import { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { useSubscription } from '../hooks/useSubscription';
import { Colors } from '../constants/Colors';
import { useThemeColors, type ThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../hooks/useTranslation';
import { Config } from '../constants/Config';

export default function PaywallScreen() {
  const { isLoading } = useSubscriptionStore();
  const { subscribePro, buyAdFree, restore } = useSubscription();
  const colors = useThemeColors();
  const t = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  async function handlePro() {
    const success = await subscribePro(selectedPlan === 'yearly');
    if (success) router.back();
  }

  async function handleAdFree() {
    const success = await buyAdFree();
    if (success) router.back();
  }

  const features = t.subscription.features;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.crownWrapper}>
            <View style={styles.crownGlow} />
            <Text style={styles.crownEmoji}>👑</Text>
          </View>
          <Text style={styles.title}>{t.subscription.proTitle}</Text>
          <Text style={styles.subtitle}>{t.subscription.proSubtitle}</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresCard}>
          {features.map((feature, idx) => (
            <View key={feature} style={[styles.featureRow, idx < features.length - 1 && styles.featureRowBorder]}>
              <View style={styles.featureCheck}>
                <Text style={styles.featureCheckText}>✓</Text>
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Plan Selector */}
        <View style={styles.planRow}>
          {/* Monthly */}
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardActive]}
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.8}
          >
            <Text style={[styles.planLabel, selectedPlan === 'monthly' && styles.planLabelActive]}>Monthly</Text>
            <Text style={[styles.planPrice, selectedPlan === 'monthly' && styles.planPriceActive]}>
              {Config.proMonthlyPrice}
            </Text>
            <Text style={[styles.planPer, selectedPlan === 'monthly' && styles.planPerActive]}>/month</Text>
          </TouchableOpacity>

          {/* Yearly */}
          <TouchableOpacity
            style={[styles.planCard, styles.planCardYearly, selectedPlan === 'yearly' && styles.planCardActive]}
            onPress={() => setSelectedPlan('yearly')}
            activeOpacity={0.8}
          >
            <View style={styles.saveBadge}>
              <Text style={styles.saveText}>{t.subscription.savePercent}</Text>
            </View>
            <Text style={[styles.planLabel, selectedPlan === 'yearly' && styles.planLabelActive]}>Yearly</Text>
            <Text style={[styles.planPrice, selectedPlan === 'yearly' && styles.planPriceActive]}>
              {Config.proYearlyPrice}
            </Text>
            <Text style={[styles.planPer, selectedPlan === 'yearly' && styles.planPerActive]}>/year</Text>
          </TouchableOpacity>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={[styles.ctaButton, isLoading && styles.ctaButtonDisabled]}
          onPress={handlePro}
          activeOpacity={0.85}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.ctaText}>{t.subscription.cta}</Text>
              <Text style={styles.ctaSubtext}>
                {selectedPlan === 'monthly' ? t.subscription.monthly : t.subscription.yearly}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.legalText}>자동 갱신 · 언제든 취소 가능</Text>

        <View style={styles.legalLinksRow}>
          <TouchableOpacity onPress={() => Linking.openURL('https://kyw1984-code.github.io/korean-ai/privacy-policy.html')}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalLinkSep}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://kyw1984-code.github.io/korean-ai/terms-of-use.html')}>
            <Text style={styles.legalLink}>Terms of Use</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Ad-Free Card */}
        <View style={styles.adFreeCard}>
          <View style={styles.adFreeHeader}>
            <View>
              <Text style={styles.adFreeTitle}>{t.subscription.adFreeTitle}</Text>
              <Text style={styles.adFreeDesc}>일회성 구매 · 영구 적용</Text>
            </View>
            <Text style={styles.adFreePrice}>{Config.adFreePrice}</Text>
          </View>
          <View style={styles.adFreeFeatures}>
            {t.subscription.adFreeFeatures.map((f) => (
              <Text key={f} style={styles.adFreeFeature}>· {f}</Text>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.adFreeButton, isLoading && styles.ctaButtonDisabled]}
            onPress={handleAdFree}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.adFreeButtonText}>{t.subscription.adFreeCta}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={restore} style={styles.restoreButton}>
          <Text style={styles.restoreText}>{t.subscription.restore}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    closeButton: {
      position: 'absolute',
      top: 56,
      right: 20,
      zIndex: 10,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },

    scroll: { paddingHorizontal: 22, paddingTop: 60, paddingBottom: 48 },

    heroSection: { alignItems: 'center', marginBottom: 28 },
    crownWrapper: { position: 'relative', marginBottom: 16 },
    crownGlow: {
      position: 'absolute',
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(240,192,64,0.15)',
      top: -8,
      left: -8,
    },
    crownEmoji: { fontSize: 52 },
    title: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      letterSpacing: -0.8,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: 20,
    },

    featuresCard: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      marginBottom: 22,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 18,
      gap: 14,
    },
    featureRowBorder: {
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    featureCheck: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(34,197,94,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    featureCheckText: { fontSize: 12, color: Colors.success, fontWeight: '800' },
    featureText: { fontSize: 14, color: colors.text, fontWeight: '500', flex: 1 },

    planRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    planCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 18,
      alignItems: 'center',
      borderWidth: 2,
      borderBottomWidth: 5,
      borderColor: colors.borderStrong,
    },
    planCardYearly: { position: 'relative', overflow: 'visible' },
    planCardActive: {
      borderColor: Colors.primary,
      backgroundColor: colors.primaryTint,
      borderBottomWidth: 2,
      transform: [{ translateY: 3 }],
    },
    saveBadge: {
      position: 'absolute',
      top: -10,
      backgroundColor: Colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 10,
    },
    saveText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
    planLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 6 },
    planLabelActive: { color: Colors.primary },
    planPrice: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    planPriceActive: { color: Colors.primary },
    planPer: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
    planPerActive: { color: Colors.primary },

    ctaButton: {
      width: '100%',
      backgroundColor: Colors.primary,
      borderRadius: 20,
      paddingVertical: 18,
      alignItems: 'center',
      borderBottomWidth: 5,
      borderColor: Colors.primaryDark,
      marginBottom: 10,
    },
    ctaButtonDisabled: { opacity: 0.5, borderBottomWidth: 2, transform: [{ translateY: 3 }] },
    ctaText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
    ctaSubtext: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 3 },

    legalText: { fontSize: 11, color: colors.textTertiary, textAlign: 'center', marginBottom: 8 },
    legalLinksRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 24 },
    legalLink: { fontSize: 11, color: colors.textTertiary, textDecorationLine: 'underline' },
    legalLinkSep: { fontSize: 11, color: colors.textTertiary },

    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
    dividerLine: { flex: 1, height: 0.5, backgroundColor: colors.border },
    dividerText: { fontSize: 12, color: colors.textTertiary, fontWeight: '500' },

    adFreeCard: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 24,
    },
    adFreeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 14,
    },
    adFreeTitle: { fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
    adFreeDesc: { fontSize: 11, color: colors.textTertiary, marginTop: 3 },
    adFreePrice: {
      fontSize: 22,
      fontWeight: '800',
      color: Colors.teal,
      letterSpacing: -0.5,
    },
    adFreeFeatures: { marginBottom: 16, gap: 4 },
    adFreeFeature: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
    adFreeButton: {
      backgroundColor: colors.isDark ? 'rgba(45,212,191,0.12)' : 'rgba(45,212,191,0.10)',
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(45,212,191,0.30)',
    },
    adFreeButtonText: { color: Colors.teal, fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },

    restoreButton: { alignItems: 'center' },
    restoreText: { fontSize: 13, color: colors.textTertiary },
  });
}
