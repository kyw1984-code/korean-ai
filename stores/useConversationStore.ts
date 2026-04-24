import { create } from 'zustand';
import { Message, ConversationSession, FeedbackData } from '../types';
import { Scenario } from '../constants/Scenarios';

interface ConversationState {
  currentSession: ConversationSession | null;
  isLoading: boolean;
  timeRemainingSeconds: number;
  sessionHistory: ConversationSession[];

  startSession: (scenario: Scenario) => void;
  addMessage: (role: Message['role'], content: string, feedback?: FeedbackData) => void;
  endSession: () => void;
  setLoading: (loading: boolean) => void;
  addTime: (seconds: number) => void;
  tickTimer: () => void;
  clearSession: () => void;
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  currentSession: null,
  isLoading: false,
  timeRemainingSeconds: 0,
  sessionHistory: [],

  startSession: (scenario) => {
    set({
      currentSession: {
        id: generateId(),
        scenario,
        messages: [],
        startedAt: Date.now(),
        endedAt: null,
        turnsUsed: 0,
      },
      timeRemainingSeconds: 5 * 60,
      isLoading: false,
    });
  },

  addMessage: (role, content, feedback) => {
    const { currentSession } = get();
    if (!currentSession) return;

    const message: Message = {
      id: generateId(),
      role,
      content,
      timestamp: Date.now(),
      feedback,
    };

    set({
      currentSession: {
        ...currentSession,
        messages: [...currentSession.messages, message],
        turnsUsed: role === 'user'
          ? currentSession.turnsUsed + 1
          : currentSession.turnsUsed,
      },
    });
  },

  endSession: () => {
    const { currentSession, sessionHistory } = get();
    if (!currentSession) return;

    const ended = { ...currentSession, endedAt: Date.now() };
    set({
      currentSession: null,
      timeRemainingSeconds: 0,
      sessionHistory: [ended, ...sessionHistory].slice(0, 20),
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  addTime: (seconds) => set((s) => ({
    timeRemainingSeconds: s.timeRemainingSeconds + seconds,
  })),

  tickTimer: () => set((s) => ({
    timeRemainingSeconds: Math.max(0, s.timeRemainingSeconds - 1),
  })),

  clearSession: () => set({ currentSession: null, timeRemainingSeconds: 0 }),
}));
