// lib/llm-router/workflow-hub-rules.ts
import { ContentAnalysisResult } from "./content-analyzer";

export interface ModelProfile {
  id: string;
  name: string;
  provider: "dealflow-llm" | "nvidia" | "kimi" | "huggingface" | "openai";
  costPer1kTokens: number; // in USD cents
  avgLatencyMs: number;
  maxContextTokens: number;
  strengths: string[];
  supportedDomains: string[];
}

export const WORKFLOW_MODEL_CATALOG: Record<string, ModelProfile> = {
  "dealflow-domain-llm": {
    id: "dealflow-domain-llm",
    name: "Dealflow Domain Sales LLM (Fine-tuned B2B)",
    provider: "dealflow-llm",
    costPer1kTokens: 0.15,
    avgLatencyMs: 320,
    maxContextTokens: 32768,
    strengths: ["sales_negotiation", "gtm_strategy", "concession_bounds", "objection_handling"],
    supportedDomains: ["b2b_saas", "fintech", "general"],
  },
  "nvidia-nemotron": {
    id: "nvidia-nemotron",
    name: "NVIDIA Nemotron Ultra-High Performance",
    provider: "nvidia",
    costPer1kTokens: 0.40,
    avgLatencyMs: 220,
    maxContextTokens: 128000,
    strengths: ["code", "financial_audit", "complex_reasoning", "ultra_low_latency"],
    supportedDomains: ["b2b_saas", "fintech", "healthcare", "legal_compliance", "general"],
  },
  "kimi-k1.5": {
    id: "kimi-k1.5",
    name: "Moonshot Kimi K1.5 Long Context",
    provider: "kimi",
    costPer1kTokens: 0.20,
    avgLatencyMs: 450,
    maxContextTokens: 200000,
    strengths: ["extraction", "long_document_analysis", "multilingual", "compliance"],
    supportedDomains: ["b2b_saas", "fintech", "legal_compliance", "general"],
  },
  "huggingface-mistral": {
    id: "huggingface-mistral",
    name: "Mistral 7B Instruct v0.3 (Fast / Cost-Effective)",
    provider: "huggingface",
    costPer1kTokens: 0.05,
    avgLatencyMs: 500,
    maxContextTokens: 16384,
    strengths: ["conversational", "extraction", "simple_summary"],
    supportedDomains: ["general", "b2b_saas"],
  },
  "huggingface-llama3": {
    id: "huggingface-llama3",
    name: "Meta Llama-3 8B Instruct",
    provider: "huggingface",
    costPer1kTokens: 0.08,
    avgLatencyMs: 480,
    maxContextTokens: 8192,
    strengths: ["conversational", "drafting", "general_qa"],
    supportedDomains: ["general"],
  }
};

export interface WorkflowRoutingRule {
  id: string;
  name: string;
  priority: number; // Higher number = evaluated earlier
  evaluate: (analysis: ContentAnalysisResult, userContext?: Record<string, any>) => boolean;
  assignedModelId: string;
  fallbackChain: string[];
  rationale: string;
}

export const WORKFLOW_HUB_RULES: WorkflowRoutingRule[] = [
  // 1. High-value Sales Negotiation & GTM Playbooks -> Dealflow Domain LLM
  {
    id: "rule-gtm-negotiation",
    name: "Specialized B2B Sales & GTM Strategy Rule",
    priority: 100,
    evaluate: (analysis) => 
      analysis.contentType === "sales_negotiation" || 
      analysis.contentType === "gtm_strategy",
    assignedModelId: "dealflow-domain-llm",
    fallbackChain: ["nvidia-nemotron", "kimi-k1.5", "huggingface-mistral"],
    rationale: "Dealflow fine-tuned models possess proprietary objection scripts and concession boundary logic.",
  },

  // 2. Ultra Complexity or Enterprise Tier -> NVIDIA Nemotron
  {
    id: "rule-ultra-enterprise",
    name: "Ultra-Complexity & Enterprise Tier Rule",
    priority: 90,
    evaluate: (analysis, ctx) => 
      analysis.complexityTier === "ultra" || 
      ctx?.tierLevel === "enterprise" || 
      analysis.contentType === "code" ||
      analysis.contentType === "financial_audit",
    assignedModelId: "nvidia-nemotron",
    fallbackChain: ["dealflow-domain-llm", "kimi-k1.5", "huggingface-mistral"],
    rationale: "NVIDIA Nemotron provides maximum reasoning accuracy and ultra-low latency for mission-critical operations.",
  },

  // 3. Multi-Lingual or Massive Extraction -> Kimi K1.5
  {
    id: "rule-multilingual-context",
    name: "Multilingual & Deep Extraction Rule",
    priority: 80,
    evaluate: (analysis) => 
      analysis.isMultilingual || 
      analysis.contentType === "extraction" || 
      analysis.contentType === "compliance" || 
      analysis.tokenEstimate > 2000,
    assignedModelId: "kimi-k1.5",
    fallbackChain: ["nvidia-nemotron", "huggingface-mistral"],
    rationale: "Kimi K1.5 specializes in 200k token memory retention and cross-lingual translation precision.",
  },

  // 4. Balanced Growth Tier -> Kimi K1.5 / Mistral
  {
    id: "rule-growth-tier",
    name: "Growth Tier Balanced Optimization Rule",
    priority: 70,
    evaluate: (analysis, ctx) => 
      ctx?.tierLevel === "growth" || 
      analysis.complexityTier === "medium",
    assignedModelId: "dealflow-domain-llm",
    fallbackChain: ["kimi-k1.5", "huggingface-mistral"],
    rationale: "Optimizes cost-to-accuracy ratio for standard workflow execution.",
  },

  // 5. Default Fallback -> Hugging Face Mistral
  {
    id: "rule-default-cost-efficient",
    name: "Default Cost-Optimized Conversational Rule",
    priority: 10,
    evaluate: () => true,
    assignedModelId: "huggingface-mistral",
    fallbackChain: ["huggingface-llama3", "dealflow-domain-llm"],
    rationale: "Standard conversational requests are handled with high throughput and minimal credit usage.",
  }
];
