import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { useSubscription } from '../hooks/useSubscription';
import { Colors } from '../constants/Colors';
import { useThemeColors, type ThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../hooks/useTranslation';

export default function PaywallScreen() {
  const { isLoading } = useSubscriptionStore();
  const { subscribePro, buyAdFree, restore } = useSubscription();
  const colors = useThemeColors();
  const t = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  async function handlePro(yearly = false) {
    const success = await subscribePro(yearly);
    if (success) router.back();
  }

  async function handleAdFree() {
    const success = await buyAdFree();
    if (success) router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.crown}>👑</Text>
        <Text style={styles.title}>{t.subscription.proTitle}</Text>
        <Text style={styles.subtitle}>{t.subscription.proSubtitle}</Text>

        <View style={styles.featuresCard}>
          {t.subscription.features.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.proButton, isLoading && styles.buttonDisabled]}
          onPress={() => handlePro(false)}
          activeOpacity={0.85}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.proButtonText}>{t.subscription.cta}</Text>
              <Text style={styles.proPrice}>{t.subscription.monthly}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.yearlyRow}>
          <Text style={styles.yearlyText}>or </Text>
          <TouchableOpacity onPress={() => handlePro(true)} disabled={isLoading}>
            <Text style={styles.yearlyLink}>{t.subscription.yearly}</Text>
          </TouchableOpacity>
          <View style={styles.saveBadge}>
            <Text style={styles.saveText}>{t.subscription.savePercent}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.adFreeCard}>
          <Text style={styles.adFreeTitle}>{t.subscription.adFreeTitle}</Text>
          <Text style={styles.adFreePrice}>{t.subscription.adFreePrice}</Text>
          {t.subscription.adFreeFeatures.map((f) => (
            <Text key={f} style={styles.adFreeFeature}>• {f}</Text>
          ))}
          <TouchableOpacity style={styles.adFreeButton} onPress={handleAdFree} disabled={isLoading}>
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
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeText: { fontSize: 16, color: colors.textSecondary },
    scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
    crown: { fontSize: 56, marginBottom: 12 },
    title: { fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center' },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 28,
    },
    featuresCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    featureCheck: { fontSize: 16, color: Colors.success, marginRight: 12, fontWeight: '700' },
    featureText: { fontSize: 15, color: colors.text, flex: 1 },
    proButton: {
      width: '100%',
      backgroundColor: Colors.primary,
      borderRadius: 18,
      paddingVertical: 20,
      alignItems: 'center',
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    proButtonText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
    proPrice: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
    yearlyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 4 },
    yearlyText: { fontSize: 14, color: colors.textSecondary },
    yearlyLink: { fontSize: 14, color: Colors.primary, fontWeight: '700', textDecorationLine: 'underline' },
    saveBadge: {
      backgroundColor: Colors.accent,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      marginLeft: 6,
    },
    saveText: { fontSize: 11, fontWeight: '800', color: '#78350F' },
    divider: { width: '100%', height: 1, backgroundColor: colors.border, marginVertical: 28 },
    adFreeCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    adFreeTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
    adFreePrice: { fontSize: 22, fontWeight: '800', color: Colors.secondary, marginTop: 4, marginBottom: 12 },
    adFreeFeature: { fontSize: 14, color: colors.textSecondary, marginBottom: 6 },
    adFreeButton: {
      marginTop: 16,
      backgroundColor: Colors.secondary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    adFreeButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    restoreButton: { marginTop: 24 },
    restoreText: { fontSize: 14, color: colors.textSecondary, textDecorationLine: 'underline' },
    buttonDisabled: { opacity: 0.6 },
  });
}
