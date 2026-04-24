import { useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  initRevenueCat,
  getCustomerInfo,
  purchasePackage,
  restorePurchases,
  checkIsPro,
  checkIsAdFree,
  PACKAGE_PRO_MONTHLY,
  PACKAGE_PRO_YEARLY,
  PACKAGE_AD_FREE,
} from '../services/revenuecatService';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';

export function useSubscription() {
  const { setTier, setLoading, isPro, isAdFree } = useSubscriptionStore();

  useEffect(() => {
    async function init() {
      try {
        await initRevenueCat();
        await syncSubscription();
      } catch {
        // RevenueCat 미설정 환경(Expo Go 등)에서는 스킵
      }
    }
    init();
  }, []);

  const syncSubscription = useCallback(async () => {
    const info = await getCustomerInfo();
    if (!info) return;

    if (checkIsPro(info)) {
      const exp = info.entitlements.active['pro']?.expirationDate;
      setTier('pro', exp ? new Date(exp).getTime() : null);
    } else if (checkIsAdFree(info)) {
      setTier('ad_free', null);
    } else {
      setTier('free', null);
    }
  }, [setTier]);

  const subscribePro = useCallback(async (yearly = false) => {
    setLoading(true);
    try {
      const packageId = yearly ? PACKAGE_PRO_YEARLY : PACKAGE_PRO_MONTHLY;
      const info = await purchasePackage(packageId);
      if (info && checkIsPro(info)) {
        const exp = info.entitlements.active['pro']?.expirationDate;
        setTier('pro', exp ? new Date(exp).getTime() : null);
        return true;
      }
    } catch {
      Alert.alert('Purchase failed', 'Please try again or contact support.');
    } finally {
      setLoading(false);
    }
    return false;
  }, [setTier, setLoading]);

  const buyAdFree = useCallback(async () => {
    setLoading(true);
    try {
      const info = await purchasePackage(PACKAGE_AD_FREE);
      if (info && checkIsAdFree(info)) {
        setTier('ad_free', null);
        return true;
      }
    } catch {
      Alert.alert('Purchase failed', 'Please try again or contact support.');
    } finally {
      setLoading(false);
    }
    return false;
  }, [setTier, setLoading]);

  const restore = useCallback(async () => {
    setLoading(true);
    try {
      const info = await restorePurchases();
      if (checkIsPro(info)) {
        const exp = info.entitlements.active['pro']?.expirationDate;
        setTier('pro', exp ? new Date(exp).getTime() : null);
        Alert.alert('Restored!', 'Your Pro subscription has been restored.');
      } else if (checkIsAdFree(info)) {
        setTier('ad_free', null);
        Alert.alert('Restored!', 'Your Ad-Free purchase has been restored.');
      } else {
        Alert.alert('Nothing to restore', 'No active purchases found for this account.');
      }
    } catch {
      Alert.alert('Restore failed', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [setTier, setLoading]);

  return { subscribePro, buyAdFree, restore, isPro, isAdFree, syncSubscription };
}
