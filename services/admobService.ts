import { Platform } from 'react-native';
import { Config } from '../constants/Config';

let AdsConsent: typeof import('react-native-google-mobile-ads')['AdsConsent'] | null = null;
let AdsConsentStatus: typeof import('react-native-google-mobile-ads')['AdsConsentStatus'] | null = null;
let requestTrackingPermissionsAsync: typeof import('expo-tracking-transparency')['requestTrackingPermissionsAsync'] | null = null;

try {
  const ads = require('react-native-google-mobile-ads');
  AdsConsent = ads.AdsConsent;
  AdsConsentStatus = ads.AdsConsentStatus;
} catch { /* unavailable in Expo Go */ }

try {
  const tracking = require('expo-tracking-transparency');
  requestTrackingPermissionsAsync = tracking.requestTrackingPermissionsAsync;
} catch { /* unavailable in Expo Go */ }

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
  if (!AdsConsent || !AdsConsentStatus) return false;
  try {
    if (Platform.OS === 'ios' && requestTrackingPermissionsAsync) {
      await requestTrackingPermissionsAsync();
    }
    const consentInfo = await AdsConsent.requestInfoUpdate();
    if (consentInfo.isConsentFormAvailable && consentInfo.status === AdsConsentStatus.REQUIRED) {
      await AdsConsent.showForm();
    }
    const updated = await AdsConsent.requestInfoUpdate();
    return (
      updated.status === AdsConsentStatus.OBTAINED ||
      updated.status === AdsConsentStatus.NOT_REQUIRED
    );
  } catch {
    return false;
  }
}
