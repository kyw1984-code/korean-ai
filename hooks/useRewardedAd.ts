import { useState, useEffect, useRef, useCallback } from 'react';
import { useConversationStore } from '../stores/useConversationStore';
import { useUserStore } from '../stores/useUserStore';
import { Config } from '../constants/Config';
import { getRewardedAdUnitId } from '../services/admobService';

let RewardedAd: typeof import('react-native-google-mobile-ads')['RewardedAd'] | null = null;
let RewardedAdEventType: typeof import('react-native-google-mobile-ads')['RewardedAdEventType'] | null = null;
let AdEventType: typeof import('react-native-google-mobile-ads')['AdEventType'] | null = null;
let TestIds: typeof import('react-native-google-mobile-ads')['TestIds'] | null = null;

try {
  const ads = require('react-native-google-mobile-ads');
  RewardedAd = ads.RewardedAd;
  RewardedAdEventType = ads.RewardedAdEventType;
  AdEventType = ads.AdEventType;
  TestIds = ads.TestIds;
} catch { /* unavailable in Expo Go */ }

const adUnitId = TestIds && __DEV__ ? TestIds.REWARDED : getRewardedAdUnitId();

export function useRewardedAd() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adRef = useRef<any>(null);
  const addTime = useConversationStore((s) => s.addTime);
  const addAdWatched = useUserStore((s) => s.addAdWatched);

  const loadAd = useCallback(() => {
    if (!RewardedAd || !RewardedAdEventType || !AdEventType) return;
    if (isLoading || isLoaded) return;
    setIsLoading(true);

    const rewarded = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });
    adRef.current = rewarded;

    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setIsLoaded(true);
      setIsLoading(false);
    });

    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        addTime(Config.freeMinutesPerAd * 60);
        addAdWatched();
      }
    );

    const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      adRef.current = null;
      setIsLoaded(false);
      setIsLoading(false);
    });

    const unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, () => {
      adRef.current = null;
      setIsLoading(false);
      setIsLoaded(false);
    });

    rewarded.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [isLoading, isLoaded, addTime, addAdWatched]);

  useEffect(() => {
    if (!isLoaded && !isLoading) {
      loadAd();
    }
  }, [isLoaded, isLoading, loadAd]);

  const showAd = useCallback(async (): Promise<boolean> => {
    const ad = adRef.current;
    if (!ad || !isLoaded) return false;
    try {
      await ad.show();
      return true;
    } catch {
      return false;
    }
  }, [isLoaded]);

  return { isLoaded, isLoading, showAd };
}
