import { useState, useEffect, useCallback } from 'react';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { getRewardedAdUnitId } from '../services/admobService';
import { useConversationStore } from '../stores/useConversationStore';
import { useUserStore } from '../stores/useUserStore';
import { Config } from '../constants/Config';

const adUnitId = __DEV__ ? TestIds.REWARDED : getRewardedAdUnitId();

export function useRewardedAd() {
  const [ad, setAd] = useState<RewardedAd | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const addTime = useConversationStore((s) => s.addTime);
  const addAdWatched = useUserStore((s) => s.addAdWatched);

  const loadAd = useCallback(() => {
    if (isLoading || isLoaded) return;
    setIsLoading(true);

    const rewarded = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true, // GDPR 준수
    });

    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setAd(rewarded);
      setIsLoaded(true);
      setIsLoading(false);
    });

    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        // 광고 시청 완료 → 5분 지급
        addTime(Config.freeMinutesPerAd * 60);
        addAdWatched();
      }
    );

    const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      setAd(null);
      setIsLoaded(false);
      // 새 광고 미리 로드
      loadAd();
    });

    const unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, () => {
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
    const cleanup = loadAd();
    return cleanup;
  }, []);

  const showAd = useCallback(async (): Promise<boolean> => {
    if (!ad || !isLoaded) return false;
    try {
      await ad.show();
      return true;
    } catch {
      return false;
    }
  }, [ad, isLoaded]);

  return { isLoaded, isLoading, showAd };
}
