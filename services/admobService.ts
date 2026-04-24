import { Platform } from 'react-native';
import { Config } from '../constants/Config';

// AdMob 유닛 ID (테스트 ID → 실제 ID는 .env에서 주입)
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
