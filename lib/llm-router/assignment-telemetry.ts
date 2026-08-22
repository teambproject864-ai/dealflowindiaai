// lib/llm-router/assignment-telemetry.ts

export interface AssignmentTelemetryRecord {
  id: string;
  timestamp: string;
  requestId?: string;
  contentType: string;
  complexityScore: number;
  complexityTier: string;
  domain: string;
  isMultilingual: boolean;
  assignedModel: string;
  assignedProvider: string;
  appliedRuleId: string;
  rationale: string;
  latencyMs: number;
  tokensProcessed: number;
  confidenceScore: number; // 0.0 to 1.0
  success: boolean;
  fallbackUsed: boolean;
  fallbackFrom?: string;
}

export interface TelemetryMetricsSummary {
  totalAssignments: number;
  successRatePercent: number;
  avgConfidenceScore: number;
  avgLatencyMs: number;
  providerDistribution: Record<string, number>;
  modelDistribution: Record<string, number>;
  contentTypeDistribution: Record<string, number>;
  fallbackCount: number;
  recentRecords: AssignmentTelemetryRecord[];
}

// In-Memory Telemetry Ring Buffer
const MAX_TELEMETRY_RECORDS = 500;
const telemetryStore: AssignmentTelemetryRecord[] = [];

// Seed sample telemetry records
const SEED_RECORDS: AssignmentTelemetryRecord[] = [
  {
    id: "tel-seed-1",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    contentType: "sales_negotiation",
    complexityScore: 8,
    complexityTier: "high",
    domain: "b2b_saas",
    isMultilingual: false,
    assignedModel: "dealflow-domain-llm",
    assignedProvider: "dealflow-llm",
    appliedRuleId: "rule-gtm-negotiation",
    rationale: "Dealflow fine-tuned models possess proprietary objection scripts and concession boundary logic.",
    latencyMs: 310,
    tokensProcessed: 840,
    confidenceScore: 0.96,
    success: true,
    fallbackUsed: false,
  },
  {
    id: "tel-seed-2",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    contentType: "financial_audit",
    complexityScore: 9,
    complexityTier: "ultra",
    domain: "fintech",
    isMultilingual: false,
    assignedModel: "nvidia-nemotron",
    assignedProvider: "nvidia",
    appliedRuleId: "rule-ultra-enterprise",
    rationale: "NVIDIA Nemotron provides maximum reasoning accuracy and ultra-low latency.",
    latencyMs: 215,
    tokensProcessed: 1420,
    confidenceScore: 0.98,
    success: true,
    fallbackUsed: false,
  },
  {
    id: "tel-seed-3",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    contentType: "conversational",
    complexityScore: 3,
    complexityTier: "low",
    domain: "general",
    isMultilingual: false,
    assignedModel: "huggingface-mistral",
    assignedProvider: "huggingface",
    appliedRuleId: "rule-default-cost-efficient",
    rationale: "Standard conversational requests are handled with high throughput.",
    latencyMs: 460,
    tokensProcessed: 180,
    confidenceScore: 0.91,
    success: true,
    fallbackUsed: false,
  }
];
telemetryStore.push(...SEED_RECORDS);

/**
 * Records a model assignment event
 */
export function recordAssignmentTelemetry(record: Omit<AssignmentTelemetryRecord, "id" | "timestamp">): AssignmentTelemetryRecord {
  const fullRecord: AssignmentTelemetryRecord = {
    id: `tel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...record,
  };

  telemetryStore.unshift(fullRecord);
  if (telemetryStore.length > MAX_TELEMETRY_RECORDS) {
    telemetryStore.pop();
  }

  return fullRecord;
}

/**
 * Calculates aggregate performance, accuracy & routing metrics
 */
export function getAssignmentTelemetryMetrics(): TelemetryMetricsSummary {
  const total = telemetryStore.length;
  if (total === 0) {
    return {
      totalAssignments: 0,
      successRatePercent: 100,
      avgConfidenceScore: 1,
      avgLatencyMs: 0,
      providerDistribution: {},
      modelDistribution: {},
      contentTypeDistribution: {},
      fallbackCount: 0,
      recentRecords: [],
    };
  }

  const successCount = telemetryStore.filter(t => t.success).length;
  const totalConfidence = telemetryStore.reduce((acc, t) => acc + t.confidenceScore, 0);
  const totalLatency = telemetryStore.reduce((acc, t) => acc + t.latencyMs, 0);
  const fallbackCount = telemetryStore.filter(t => t.fallbackUsed).length;

  const providerDistribution: Record<string, number> = {};
  const modelDistribution: Record<string, number> = {};
  const contentTypeDistribution: Record<string, number> = {};

  telemetryStore.forEach(t => {
    providerDistribution[t.assignedProvider] = (providerDistribution[t.assignedProvider] || 0) + 1;
    modelDistribution[t.assignedModel] = (modelDistribution[t.assignedModel] || 0) + 1;
    contentTypeDistribution[t.contentType] = (contentTypeDistribution[t.contentType] || 0) + 1;
  });

  return {
    totalAssignments: total,
    successRatePercent: Number(((successCount / total) * 100).toFixed(1)),
    avgConfidenceScore: Number((totalConfidence / total).toFixed(2)),
    avgLatencyMs: Math.round(totalLatency / total),
    providerDistribution,
    modelDistribution,
    contentTypeDistribution,
    fallbackCount,
    recentRecords: telemetryStore.slice(0, 15),
  };
}
