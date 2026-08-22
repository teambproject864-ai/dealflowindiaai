// lib/llm-router/auto-llm-assigner.ts
import { analyzeTaskContent, ContentAnalysisResult } from "./content-analyzer";
import { 
  WORKFLOW_HUB_RULES, 
  WORKFLOW_MODEL_CATALOG, 
  ModelProfile,
  WorkflowRoutingRule 
} from "./workflow-hub-rules";
import { recordAssignmentTelemetry } from "./assignment-telemetry";

export interface LLMAssignmentDecision {
  assignedModelId: string;
  modelProfile: ModelProfile;
  contentAnalysis: ContentAnalysisResult;
  appliedRule: {
    id: string;
    name: string;
    rationale: string;
  };
  fallbackChain: string[];
  confidenceScore: number;
  estimatedCostCents: number;
  estimatedLatencyMs: number;
  assignedAt: string;
}

/**
 * Evaluates task content against the Workflow Hub rules and assigns the optimal LLM.
 */
export function assignOptimalLLM(
  content: string, 
  userContext?: {
    tierLevel?: "starter" | "growth" | "enterprise";
    userRegion?: string;
    requestType?: string;
    budgetPriority?: "cost" | "performance" | "balanced";
    customSlaMs?: number;
  }
): LLMAssignmentDecision {
  const startTime = Date.now();
  const analysis = analyzeTaskContent(content, userContext);

  // Sort rules by priority descending
  const sortedRules = [...WORKFLOW_HUB_RULES].sort((a, b) => b.priority - a.priority);

  let matchedRule: WorkflowRoutingRule = sortedRules[sortedRules.length - 1]; // default
  for (const rule of sortedRules) {
    if (rule.evaluate(analysis, userContext)) {
      matchedRule = rule;
      break;
    }
  }

  const modelProfile = WORKFLOW_MODEL_CATALOG[matchedRule.assignedModelId] || WORKFLOW_MODEL_CATALOG["dealflow-domain-llm"];

  // Calculate dynamic confidence score based on rule specificity & complexity fit
  let confidenceScore = 0.92;
  if (matchedRule.priority >= 90) confidenceScore = 0.98;
  else if (matchedRule.priority >= 70) confidenceScore = 0.95;
  if (analysis.complexityScore >= 8 && modelProfile.id === "nvidia-nemotron") confidenceScore = 0.99;

  const tokenUnits = analysis.tokenEstimate / 1000;
  const estimatedCostCents = Number((tokenUnits * modelProfile.costPer1kTokens).toFixed(4));
  const executionLatencyMs = Math.max(1, Date.now() - startTime);

  // Log telemetry
  recordAssignmentTelemetry({
    contentType: analysis.contentType,
    complexityScore: analysis.complexityScore,
    complexityTier: analysis.complexityTier,
    domain: analysis.domain,
    isMultilingual: analysis.isMultilingual,
    assignedModel: modelProfile.id,
    assignedProvider: modelProfile.provider,
    appliedRuleId: matchedRule.id,
    rationale: matchedRule.rationale,
    latencyMs: modelProfile.avgLatencyMs,
    tokensProcessed: analysis.tokenEstimate,
    confidenceScore,
    success: true,
    fallbackUsed: false,
  });

  return {
    assignedModelId: modelProfile.id,
    modelProfile,
    contentAnalysis: analysis,
    appliedRule: {
      id: matchedRule.id,
      name: matchedRule.name,
      rationale: matchedRule.rationale,
    },
    fallbackChain: matchedRule.fallbackChain,
    confidenceScore,
    estimatedCostCents,
    estimatedLatencyMs: modelProfile.avgLatencyMs,
    assignedAt: new Date().toISOString(),
  };
}
