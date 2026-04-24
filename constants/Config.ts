export const Config = {
  // API
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',

  // Usage limits
  freeMinutesPerAd: 5,
  maxDailyMinutesFree: 30,
  maxDailyMinutesAdFree: 20,
  maxSessionTurns: 10,
  maxOutputTokens: 300,

  // Subscription
  proMonthlyPrice: '$7.99',
  proYearlyPrice: '$59.99',
  adFreePrice: '$4.99',

  // RevenueCat
  revenueCatApiKey: {
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
  },

  // Ad unit IDs (will be filled from .env)
  admob: {
    rewardedAdIos: process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS ?? 'ca-app-pub-3940256099942544/1712485313',
    rewardedAdAndroid: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID ?? 'ca-app-pub-3940256099942544/5224354917',
    bannerIos: process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS ?? 'ca-app-pub-3940256099942544/2934735716',
    bannerAndroid: process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID ?? 'ca-app-pub-3940256099942544/6300978111',
  },
} as const;
