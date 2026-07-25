// lib/call-bot/call-router.ts

export type CallType = "discovery" | "onboarding" | "standup" | "weekly" | "escalation";

export interface CallTypeConfig {
  callType: CallType;
  displayName: string;
  maxTurnLengthTokens: number;
  allowPricingDiscussion: boolean;
  objectionHandlingEnabled: boolean;
  tone: string;
  focusAreas: string[];
  systemPromptSectionKey: string;
}

export const CALL_TYPE_CONFIGS: Record<CallType, CallTypeConfig> = {
  discovery: {
    callType: "discovery",
    displayName: "Discovery / Sales Call",
    maxTurnLengthTokens: 250,
    allowPricingDiscussion: true,
    objectionHandlingEnabled: true,
    tone: "consultative, engaging, and solution-oriented",
    focusAreas: ["Uncovering customer pain points", "GTM strategy fit", "Quantifying ROI", "Handling objections"],
    systemPromptSectionKey: "DISCOVERY_CALL_GUIDELINES"
  },
  onboarding: {
    callType: "onboarding",
    displayName: "Customer Onboarding Call",
    maxTurnLengthTokens: 200,
    allowPricingDiscussion: false,
    objectionHandlingEnabled: false,
    tone: "welcoming, instructional, and encouraging",
    focusAreas: ["Product setup steps", "Integration walkthrough", "Goal alignment", "Technical prerequisites"],
    systemPromptSectionKey: "ONBOARDING_CALL_GUIDELINES"
  },
  standup: {
    callType: "standup",
    displayName: "Daily/Weekly Standup Call",
    maxTurnLengthTokens: 120,
    allowPricingDiscussion: false,
    objectionHandlingEnabled: false,
    tone: "concise, direct, and action-focused",
    focusAreas: ["Sprint updates", "Blockers identification", "Immediate next steps"],
    systemPromptSectionKey: "STANDUP_CALL_GUIDELINES"
  },
  weekly: {
    callType: "weekly",
    displayName: "Weekly Progress Review",
    maxTurnLengthTokens: 180,
    allowPricingDiscussion: false,
    objectionHandlingEnabled: true,
    tone: "collaborative, strategic, and analytical",
    focusAreas: ["Weekly KPI review", "Campaign performance", "Strategic adjustments"],
    systemPromptSectionKey: "WEEKLY_CALL_GUIDELINES"
  },
  escalation: {
    callType: "escalation",
    displayName: "Executive Escalation Call",
    maxTurnLengthTokens: 150,
    allowPricingDiscussion: true,
    objectionHandlingEnabled: true,
    tone: "empathetic, decisive, and reassuring",
    focusAreas: ["Issue resolution", "Customer satisfaction retention", "Root cause mitigation"],
    systemPromptSectionKey: "ESCALATION_CALL_GUIDELINES"
  }
};

/**
 * Returns the matching behavior configuration object for a given call type string.
 * Defaults to 'discovery' if the provided type is invalid or unspecified.
 */
export function getCallTypeConfig(callType?: string): CallTypeConfig {
  if (!callType) return CALL_TYPE_CONFIGS.discovery;
  const normalized = callType.toLowerCase().trim() as CallType;
  return CALL_TYPE_CONFIGS[normalized] || CALL_TYPE_CONFIGS.discovery;
}

/**
 * Checks if pricing discussions are authorized for the specified call type.
 */
export function isPricingAllowed(callType: string): boolean {
  return getCallTypeConfig(callType).allowPricingDiscussion;
}

/**
 * Checks if objection handling behavior is active for the specified call type.
 */
export function isObjectionHandlingEnabled(callType: string): boolean {
  return getCallTypeConfig(callType).objectionHandlingEnabled;
}
