import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubscriptionState, SubscriptionTier } from '../types';

interface SubscriptionStoreState extends SubscriptionState {
  setTier: (tier: SubscriptionTier, expiresAt?: number | null) => void;
  setLoading: (loading: boolean) => void;
  isPro: () => boolean;
  isAdFree: () => boolean;
  getMaxDailyMinutes: () => number;
}

export const useSubscriptionStore = create<SubscriptionStoreState>()(
  persist(
    (set, get) => ({
      tier: 'free' as SubscriptionTier,
      expiresAt: null,
      isLoading: false,

      setTier: (tier, expiresAt = null) => set({ tier, expiresAt }),
      setLoading: (loading) => set({ isLoading: loading }),

      isPro: () => {
        const { tier, expiresAt } = get();
        if (tier !== 'pro') return false;
        if (expiresAt && Date.now() > expiresAt) return false;
        return true;
      },

      isAdFree: () => {
        const { tier } = get();
        return tier === 'ad_free' || get().isPro();
      },

      getMaxDailyMinutes: () => {
        const state = get();
        if (state.isPro()) return Infinity;
        if (state.isAdFree()) return 20;
        return 30; // free: up to 30 min via ads
      },
    }),
    {
      name: 'subscription-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
