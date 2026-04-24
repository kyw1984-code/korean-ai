export interface Translations {
  appName: string;
  tagline: string;
  onboarding: {
    hook: {
      title: string;
      subtitle: string;
      nextButton: string;
      sample: Array<{ role: 'ai' | 'user'; text: string; note?: string }>;
    };
    levelQuestion: string;
    ctaStart: string;
    disclaimer: string;
    levels: {
      beginner: { label: string; emoji: string; description: string };
      intermediate: { label: string; emoji: string; description: string };
      advanced: { label: string; emoji: string; description: string };
    };
  };
  home: {
    greeting: string;
    watchAd: string;
    dailyLimit: string;
    filterAll: string;
    minRemaining: (min: number) => string;
  };
  chat: {
    placeholder: string;
    endSession: string;
    timeUp: string;
    timeUpMsg: string;
    sessionComplete: string;
    sessionCompleteMsg: string;
    sessionCompleteBtn: string;
    watchAdBtn: (adLoaded: boolean) => string;
    goPro: string;
    feedbackLabel: string;
    adLoadingTitle: string;
    adLoadingMsg: string;
  };
  rewarded: {
    noAd: string;
  };
  subscription: {
    proTitle: string;
    proSubtitle: string;
    monthly: string;
    yearly: string;
    savePercent: string;
    features: string[];
    cta: string;
    restore: string;
    adFreeTitle: string;
    adFreePrice: string;
    adFreeFeatures: string[];
    adFreeCta: string;
    freeTier: string;
    freeTierDesc: string;
    proTier: string;
    proTierDesc: string;
    upgradeCta: string;
  };
  settings: {
    title: string;
    subscriptionSection: string;
    levelSection: string;
    accountSection: string;
    restorePurchases: string;
  };
  progress: {
    title: string;
    today: string;
    allTime: string;
    recentSessions: string;
    practiced: string;
    adsWatched: string;
    sessions: string;
    totalPractice: string;
    inProgress: string;
    turns: (n: number) => string;
    emptyText: string;
    streak: string;
    streakDays: (n: number) => string;
    streakEmpty: string;
    weeklyReport: string;
    weeklyProLocked: string;
    weeklyMinutes: string;
    weeklySessions: string;
    weeklyScenarios: string;
    weeklyAvgScore: string;
    weeklyUnlockCta: string;
  };
  notifications: {
    permissionTitle: string;
    permissionBody: string;
    reminderTitle: string;
    reminderBody: string;
    enableReminder: string;
    disableReminder: string;
    reminderSection: string;
  };
  errors: {
    networkError: string;
    apiError: string;
    adNotReady: string;
    unknown: string;
  };
}
