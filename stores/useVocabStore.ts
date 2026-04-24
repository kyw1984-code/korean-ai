import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VocabEntry {
  id: string;
  korean: string;
  note: string;
  scenarioId: string;
  savedAt: number;
}

interface VocabState {
  entries: VocabEntry[];
  saveWord: (korean: string, note: string, scenarioId: string) => void;
  removeWord: (id: string) => void;
  hasWord: (korean: string) => boolean;
}

export const useVocabStore = create<VocabState>()(
  persist(
    (set, get) => ({
      entries: [],

      saveWord: (korean, note, scenarioId) => {
        if (get().hasWord(korean)) return;
        const entry: VocabEntry = {
          id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
          korean,
          note,
          scenarioId,
          savedAt: Date.now(),
        };
        set((s) => ({ entries: [entry, ...s.entries] }));
      },

      removeWord: (id) => set((s) => ({
        entries: s.entries.filter((e) => e.id !== id),
      })),

      hasWord: (korean) => get().entries.some((e) => e.korean === korean),
    }),
    {
      name: 'vocab-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
