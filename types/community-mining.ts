// types/community-mining.ts

export type CMSourceType = "support" | "community" | "review" | "call_transcript" | "survey";
export type CMSourceStatus = "active" | "paused" | "error";

export interface CMSource {
  id: string;
  name: string;
  type: CMSourceType;
  status: CMSourceStatus;
  config?: {
    webhookUrl?: string;
    pollingIntervalHours?: number;
    platformName?: string;
    endpointUrl?: string;
    dailyItemCap?: number;
  };
  itemCount: number;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type PlanTier = "free" | "starter" | "growth" | "enterprise" | "unknown";

export interface CMRawItem {
  id: string;
  sourceId: string;
  sourceType: CMSourceType;
  externalId: string;
  dedupHash: string;
  rawText: string;
  author?: {
    name?: string;
    email?: string;
    handle?: string;
    company?: string;
  };
  segment?: string;
  planTier?: PlanTier;
  metadata?: Record<string, any>;
  processed: boolean;
  createdAt: string;
  ingestedAt: string;
}

export type CMSentiment = "positive" | "neutral" | "negative" | "mixed";
export type CMSeverity = "low" | "medium" | "high" | "critical";

export interface CMEntity {
  name: string;
  entityType: "feature" | "competitor" | "error" | "pricing_tier" | "integration" | "general";
  featureName?: string;
  competitorName?: string;
  errorType?: string;
  sentiment?: CMSentiment;
}

export interface CMInsight {
  id: string;
  rawItemId: string;
  sourceId: string;
  sourceType: CMSourceType;
  sentiment: CMSentiment;
  sentimentScore: number; // -1.0 to 1.0
  themeTags: string[];
  entities: CMEntity[];
  severity: CMSeverity;
  summary: string;
  embeddingVector?: number[];
  themeId?: string;
  planTier?: PlanTier;
  authorName?: string;
  authorEmail?: string;
  rawSnippet: string;
  processedAt: string;
}

export type CMThemeStatus = "new" | "reviewed" | "actioned";
export type CMTeam = "product" | "marketing" | "cs" | "sales";

export interface CMThemeTrendPoint {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface CMTheme {
  id: string;
  label: string;
  description: string;
  itemCount: number;
  trend: CMThemeTrendPoint[];
  sentimentAvg: number; // -1.0 to 1.0
  severity: CMSeverity;
  status: CMThemeStatus;
  assignedTeam: CMTeam;
  sampleQuotes: string[];
  topEntities: string[];
  relatedInsightIds: string[];
  firstSeenAt: string;
  lastUpdatedAt: string;
  velocityScore?: number; // week-over-week % delta
}

export interface CMRoutingRule {
  id: string;
  name: string;
  keywords: string[];
  categories: string[];
  assignedTeam: CMTeam;
  destinationChannel: "slack" | "email" | "webhook";
  destinationTarget: string; // Slack webhook URL, email address, or generic webhook
  minSeverity?: CMSeverity;
  enabled: boolean;
  alertOnThemeThreshold?: number; // e.g. notify when item count >= 5
  createdAt: string;
  updatedAt: string;
}

export interface CMNotification {
  id: string;
  ruleId?: string;
  themeId?: string;
  themeLabel: string;
  summary: string;
  severity: CMSeverity;
  destinationType: "slack" | "email" | "webhook";
  destination: string;
  sampleQuotes: string[];
  deepLink: string;
  status: "pending" | "sent" | "failed";
  sentAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface CMIngestionLog {
  id: string;
  sourceId: string;
  sourceType: CMSourceType;
  itemsReceived: number;
  itemsIngested: number;
  itemsDeduped: number;
  status: "success" | "partial" | "failed";
  error?: string;
  timestamp: string;
}

export interface CMProcessingLog {
  id: string;
  sourceId: string;
  itemCount: number;
  tokensUsed: number;
  estimatedCostUsd: number;
  modelUsed: string;
  provider: string;
  status: "success" | "failed";
  error?: string;
  timestamp: string;
}

export interface CMStatsOverview {
  totalIngested: number;
  totalProcessed: number;
  activeThemesCount: number;
  criticalAlertsCount: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
    mixed: number;
  };
  sourcesHealth: Array<{
    id: string;
    name: string;
    type: CMSourceType;
    status: CMSourceStatus;
    itemCount: number;
    lastSyncedAt?: string;
  }>;
  trendingThemes: CMTheme[];
  weeklyVelocity: number; // % change vs previous week
}
