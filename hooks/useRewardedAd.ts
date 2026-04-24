import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const adRef = useRef<RewardedAd | null>(null);
  const addTime = useConversationStore((s) => s.addTime);
  const addAdWatched = useUserStore((s) => s.addAdWatched);

  const loadAd = useCallback(() => {
    if (isLoading || isLoaded) return;
    setIsLoading(true);

    const rewarded = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true, // GDPR 준수
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

    // 광고 닫힌 후 상태 리셋 — 재귀 호출 대신 상태만 초기화
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

  // 닫힌 후 자동으로 다음 광고 미리 로드
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
