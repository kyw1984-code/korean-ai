import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, UsageRecord } from '../types';

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function generateDeviceId(): string {
  return `device_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

interface UserState {
  profile: UserProfile | null;
  usageToday: UsageRecord;
  isOnboarded: boolean;

  initProfile: () => void;
  setLevel: (level: UserProfile['level']) => void;
  addMinutesUsed: (minutes: number) => void;
  addAdWatched: () => void;
  incrementSessions: () => void;
  recordPracticeDay: () => void;
  getRemainingFreeMinutes: (maxMinutes: number) => number;
  completeOnboarding: () => void;
}

const defaultUsage = (): UsageRecord => ({
  date: getTodayKey(),
  minutesUsed: 0,
  adsWatched: 0,
  sessionsCompleted: 0,
});

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      usageToday: defaultUsage(),
      isOnboarded: false,

      initProfile: () => {
        const { profile } = get();
        if (!profile) {
          set({
            profile: {
              id: generateDeviceId(),
              deviceId: generateDeviceId(),
              level: 'beginner',
              createdAt: Date.now(),
              streakDays: 0,
              lastPracticeDate: null,
            },
          });
        } else if (profile != null && !('streakDays' in (profile as UserProfile))) {
          const p = profile as UserProfile;
          set({ profile: { ...p, streakDays: 0, lastPracticeDate: null } });
        }
        // Reset daily usage if it's a new day
        const usage = get().usageToday;
        if (usage.date !== getTodayKey()) {
          set({ usageToday: defaultUsage() });
        }
      },

      setLevel: (level) => set((s) => ({
        profile: s.profile ? { ...s.profile, level } : s.profile,
      })),

      addMinutesUsed: (minutes) => set((s) => ({
        usageToday: {
          ...s.usageToday,
          date: getTodayKey(),
          minutesUsed: s.usageToday.minutesUsed + minutes,
        },
      })),

      addAdWatched: () => set((s) => ({
        usageToday: {
          ...s.usageToday,
          adsWatched: s.usageToday.adsWatched + 1,
        },
      })),

      incrementSessions: () => set((s) => ({
        usageToday: {
          ...s.usageToday,
          sessionsCompleted: s.usageToday.sessionsCompleted + 1,
        },
      })),

      recordPracticeDay: () => {
        const { profile } = get();
        if (!profile) return;
        const today = getTodayKey();
        if (profile.lastPracticeDate === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = yesterday.toISOString().split('T')[0];
        const isConsecutive = profile.lastPracticeDate === yesterdayKey;

        set({
          profile: {
            ...profile,
            streakDays: isConsecutive ? profile.streakDays + 1 : 1,
            lastPracticeDate: today,
          },
        });
      },

      getRemainingFreeMinutes: (maxMinutes) => {
        const { usageToday } = get();
        const today = getTodayKey();
        if (usageToday.date !== today) return maxMinutes;
        const earned = usageToday.adsWatched * 5;
        const remaining = earned - usageToday.minutesUsed;
        return Math.max(0, Math.min(remaining, maxMinutes - usageToday.minutesUsed));
      },

      completeOnboarding: () => set({ isOnboarded: true }),
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
