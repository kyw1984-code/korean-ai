import { Scenario } from '../constants/Scenarios';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  feedback?: FeedbackData;
}

export interface FeedbackData {
  grammarNote: string;
  naturalScore: number;
  alternative: string | null;
}

export interface ConversationSession {
  id: string;
  scenario: Scenario;
  messages: Message[];
  startedAt: number;
  endedAt: number | null;
  turnsUsed: number;
}

export interface UserProfile {
  id: string;
  deviceId: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  createdAt: number;
  streakDays: number;
  lastPracticeDate: string | null;
}

export interface UsageRecord {
  date: string;
  minutesUsed: number;
  adsWatched: number;
  sessionsCompleted: number;
}

export type SubscriptionTier = 'free' | 'ad_free' | 'pro';

export interface SubscriptionState {
  tier: SubscriptionTier;
  expiresAt: number | null;
  isLoading: boolean;
}

export interface ApiConversationRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  scenarioId: string;
  userLevel: string;
  isPremium: boolean;
  deviceId: string;
}

export interface ApiConversationResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
}
