export const Strings = {
  appName: 'KoreanTalk',
  tagline: 'AI Conversation Practice',

  onboarding: {
    title: 'Speak Korean\nWith Confidence',
    subtitle: 'Practice real conversations with AI. Learn naturally, make mistakes freely.',
    ctaStart: 'Start Free',
    ctaPro: 'Get Pro',
  },

  home: {
    greeting: 'Ready to practice?',
    freeMinutesLeft: (min: number) => `${min} min remaining today`,
    watchAd: 'Watch ad for +5 min',
    dailyLimit: 'Daily limit reached',
  },

  scenarios: {
    title: 'Choose a Scenario',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    premiumBadge: 'PRO',
    startButton: 'Start Conversation',
    minutesEstimate: (min: number) => `~${min} min`,
  },

  chat: {
    placeholder: '한국어로 말해보세요...',
    send: 'Send',
    endSession: 'End Session',
    timeRemaining: (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`,
    timeUp: "Time's up!",
    watchAdForMore: 'Watch ad for 5 more minutes',
    upgradeForUnlimited: 'Upgrade to Pro for unlimited practice',
  },

  rewarded: {
    title: 'Get 5 Free Minutes',
    description: 'Watch a short ad to continue your practice session',
    watchButton: 'Watch Ad (+5 min)',
    loading: 'Loading ad...',
    noAd: 'No ad available right now. Try again later.',
  },

  subscription: {
    proTitle: 'KoreanTalk Pro',
    proSubtitle: 'Unlimited AI conversation practice',
    monthly: '$7.99 / month',
    yearly: '$59.99 / year',
    savePercent: 'Save 37%',
    features: [
      'Unlimited AI conversation',
      'All 20+ scenarios (incl. advanced)',
      'Premium grammar correction (Sonnet AI)',
      'Weekly progress report',
      'No ads',
    ],
    cta: 'Start Pro',
    restore: 'Restore purchases',
    adFreeTitle: 'Remove Ads',
    adFreePrice: '$4.99 one-time',
    adFreeFeatures: [
      'Remove all ads',
      '20 min free practice daily',
      '50+ beginner & intermediate scenarios',
    ],
    adFreeCta: 'Buy Once, Use Forever',
  },

  errors: {
    networkError: 'Connection error. Please check your internet.',
    apiError: 'AI is busy. Please try again.',
    adNotReady: 'Ad not ready yet. Please wait a moment.',
    unknown: 'Something went wrong. Please try again.',
  },
} as const;
