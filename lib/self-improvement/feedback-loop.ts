// lib/self-improvement/feedback-loop.ts

export type FeedbackSignalType = "EXPLICIT_RATING" | "REPHRASE_DETECTED" | "CONVERSATION_ABANDONMENT";

export interface UserFeedbackSignal {
  id: string;
  signalType: FeedbackSignalType;
  sessionId: string;
  rating?: number; // 1 to 5
  feedbackText?: string;
  rephraseCount?: number;
  sentimentScore?: number; // -1.0 to 1.0
  timestamp: string;
  prioritizedForImprovement: boolean;
}

const feedbackQueue: UserFeedbackSignal[] = [];

/**
 * Capture explicit user rating / feedback
 */
export function recordExplicitFeedback(sessionId: string, rating: number, feedbackText?: string): UserFeedbackSignal {
  const signal: UserFeedbackSignal = {
    id: `fb_exp_${Date.now()}`,
    signalType: "EXPLICIT_RATING",
    sessionId,
    rating,
    feedbackText,
    timestamp: new Date().toISOString(),
    prioritizedForImprovement: rating <= 2 // Prioritize low ratings for retraining
  };

  feedbackQueue.unshift(signal);
  return signal;
}

/**
 * Capture implicit negative signal (e.g. user rephrasing query multiple times or abandoning flow)
 */
export function recordImplicitNegativeSignal(
  sessionId: string,
  signalType: "REPHRASE_DETECTED" | "CONVERSATION_ABANDONMENT",
  metadata?: { rephraseCount?: number; sentimentScore?: number }
): UserFeedbackSignal {
  const signal: UserFeedbackSignal = {
    id: `fb_imp_${Date.now()}`,
    signalType,
    sessionId,
    rephraseCount: metadata?.rephraseCount || 1,
    sentimentScore: metadata?.sentimentScore || -0.5,
    timestamp: new Date().toISOString(),
    prioritizedForImprovement: true
  };

  feedbackQueue.unshift(signal);
  return signal;
}

export function getFeedbackQueue(): UserFeedbackSignal[] {
  if (feedbackQueue.length === 0) {
    // Seed initial feedback signals for testing/demo
    feedbackQueue.push({
      id: "fb_seed_1",
      signalType: "EXPLICIT_RATING",
      sessionId: "sess_feedback_1",
      rating: 5,
      feedbackText: "Great memory retention of my budget rules!",
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      prioritizedForImprovement: false
    });
    feedbackQueue.push({
      id: "fb_seed_2",
      signalType: "REPHRASE_DETECTED",
      sessionId: "sess_feedback_2",
      rephraseCount: 3,
      sentimentScore: -0.4,
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      prioritizedForImprovement: true
    });
  }
  return feedbackQueue;
}
