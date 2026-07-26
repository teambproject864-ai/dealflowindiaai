// lib/call-bot/call-router.ts

export type CallType = 
  | "client_sales" 
  | "customer_checkin" 
  | "internal_standup" 
  | "onboarding" 
  | "cross_functional"
  // Legacy aliases
  | "discovery" 
  | "standup" 
  | "weekly" 
  | "escalation";

export interface CallTypeConfig {
  callType: string;
  displayName: string;
  maxTurnLengthTokens: number;
  allowPricingDiscussion: boolean;
  objectionHandlingEnabled: boolean;
  tone: string;
  focusAreas: string[];
  systemPromptSectionKey: string;
}

export const CALL_TYPE_CONFIGS: Record<string, CallTypeConfig> = {
  client_sales: {
    callType: "client_sales",
    displayName: "Client Sales / Prospecting Call",
    maxTurnLengthTokens: 250,
    allowPricingDiscussion: true,
    objectionHandlingEnabled: true,
    tone: "consultative, high-conviction, and ROI-focused",
    focusAreas: ["Pain point qualification", "Deal sizing & pricing guardrails", "Competitor objection handling", "Closing next steps"],
    systemPromptSectionKey: "CLIENT_SALES_GUIDELINES"
  },
  customer_checkin: {
    callType: "customer_checkin",
    displayName: "Customer Check-in / QBR Call",
    maxTurnLengthTokens: 200,
    allowPricingDiscussion: false,
    objectionHandlingEnabled: true,
    tone: "supportive, analytical, and retention-oriented",
    focusAreas: ["CSAT & health score review", "Adoption roadblocks", "Expansion & upsell opportunities", "Renewals timeline"],
    systemPromptSectionKey: "CUSTOMER_CHECKIN_GUIDELINES"
  },
  internal_standup: {
    callType: "internal_standup",
    displayName: "Internal Team Standup Call",
    maxTurnLengthTokens: 120,
    allowPricingDiscussion: false,
    objectionHandlingEnabled: false,
    tone: "concise, rapid-fire, and action-focused",
    focusAreas: ["Sprint updates", "Blocker identification", "Task ownership & deadlines"],
    systemPromptSectionKey: "INTERNAL_STANDUP_GUIDELINES"
  },
  onboarding: {
    callType: "onboarding",
    displayName: "Customer Onboarding Call",
    maxTurnLengthTokens: 200,
    allowPricingDiscussion: false,
    objectionHandlingEnabled: false,
    tone: "welcoming, instructional, and step-by-step",
    focusAreas: ["Product setup steps", "API key & integration walkthrough", "Milestone roadmap", "Technical prerequisites"],
    systemPromptSectionKey: "ONBOARDING_CALL_GUIDELINES"
  },
  cross_functional: {
    callType: "cross_functional",
    displayName: "Cross-Functional Strategic Sync",
    maxTurnLengthTokens: 220,
    allowPricingDiscussion: true,
    objectionHandlingEnabled: true,
    tone: "collaborative, structured, and strategic",
    focusAreas: ["Product & GTM roadmap alignment", "Cross-team dependencies", "Resource allocation"],
    systemPromptSectionKey: "CROSS_FUNCTIONAL_GUIDELINES"
  },

  // Legacy mappings for backwards compatibility
  discovery: {
    callType: "client_sales",
    displayName: "Discovery / Sales Call",
    maxTurnLengthTokens: 250,
    allowPricingDiscussion: true,
    objectionHandlingEnabled: true,
    tone: "consultative, engaging, and solution-oriented",
    focusAreas: ["Uncovering customer pain points", "GTM strategy fit", "Quantifying ROI", "Handling objections"],
    systemPromptSectionKey: "DISCOVERY_CALL_GUIDELINES"
  },
  standup: {
    callType: "internal_standup",
    displayName: "Daily/Weekly Standup Call",
    maxTurnLengthTokens: 120,
    allowPricingDiscussion: false,
    objectionHandlingEnabled: false,
    tone: "concise, direct, and action-focused",
    focusAreas: ["Sprint updates", "Blockers identification", "Immediate next steps"],
    systemPromptSectionKey: "STANDUP_CALL_GUIDELINES"
  },
  weekly: {
    callType: "customer_checkin",
    displayName: "Weekly Progress Review",
    maxTurnLengthTokens: 180,
    allowPricingDiscussion: false,
    objectionHandlingEnabled: true,
    tone: "collaborative, strategic, and analytical",
    focusAreas: ["Weekly KPI review", "Campaign performance", "Strategic adjustments"],
    systemPromptSectionKey: "WEEKLY_CALL_GUIDELINES"
  },
  escalation: {
    callType: "client_sales",
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
 * Defaults to 'client_sales' if the provided type is invalid or unspecified.
 */
export function getCallTypeConfig(callType?: string): CallTypeConfig {
  if (!callType) return CALL_TYPE_CONFIGS.client_sales;
  const normalized = callType.toLowerCase().trim();
  return CALL_TYPE_CONFIGS[normalized] || CALL_TYPE_CONFIGS.client_sales;
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
