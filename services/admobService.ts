import { Platform } from 'react-native';
import { AdsConsent, AdsConsentStatus } from 'react-native-google-mobile-ads';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { Config } from '../constants/Config';

export function getRewardedAdUnitId(): string {
  return Platform.OS === 'ios'
    ? Config.admob.rewardedAdIos
    : Config.admob.rewardedAdAndroid;
}

export function getBannerAdUnitId(): string {
  return Platform.OS === 'ios'
    ? Config.admob.bannerIos
    : Config.admob.bannerAndroid;
}

/**
 * GDPR (EU) + ATT (iOS) consent flow.
 * Call once at app startup, before loading any ads.
 * Returns true if personalised ads are allowed.
 */
export async function requestAdConsent(): Promise<boolean> {
  try {
    // 1. iOS: Apple ATT permission (must come before GDPR form on iOS)
    if (Platform.OS === 'ios') {
      await requestTrackingPermissionsAsync();
    }

    // 2. Google UMP — handles GDPR for EEA/UK users automatically.
    //    Non-EEA users pass through immediately.
    const consentInfo = await AdsConsent.requestInfoUpdate();

    if (
      consentInfo.isConsentFormAvailable &&
      consentInfo.status === AdsConsentStatus.REQUIRED
    ) {
      await AdsConsent.showForm();
    }

    const updated = await AdsConsent.requestInfoUpdate();
    return (
      updated.status === AdsConsentStatus.OBTAINED ||
      updated.status === AdsConsentStatus.NOT_REQUIRED
    );
  } catch {
    // Consent failure should not block app usage — degrade to non-personalised ads
    return false;
  }
}
