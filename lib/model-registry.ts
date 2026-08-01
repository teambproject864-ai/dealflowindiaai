// lib/model-registry.ts

export type UserRole = "customer" | "agent" | "admin";

export interface ModelPerformanceProfile {
  tokensPerSecond: number;
  latencyMs: number;
  contextWindow: number;
  accuracyRating: string; // e.g. "98.5%", "96.2%"
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  type: 'LLM' | 'Multimodal' | 'Image' | 'Specialized';
  badge: 'Standard' | 'Pro' | 'Enterprise' | 'Fastest' | 'High-Precision';
  description: string;
  useCases: string[];
  allowedRoles: UserRole[];
  roleAccessDescription?: Partial<Record<UserRole, string>>;
  memoryRequirements: string;
  gpuModel: string;
  performanceProfile: ModelPerformanceProfile;
}

export const SUPPORTED_MODELS: ModelConfig[] = [
  {
    id: 'dealflow-llm-v1',
    name: 'Dealflow LLM (Dealflow AI Core v1)',
    provider: 'Dealflow AI Core',
    type: 'Specialized',
    badge: 'High-Precision',
    description: 'Proprietary fine-tuned Dealflow intelligence engine specializing in financial metric extraction, B2B SaaS deal analysis, and automated GTM strategy & content generation.',
    useCases: ['Strategy & Content Generation', 'Deal Evaluation & ICP Scoring', 'Financial Metric Extraction', 'Outbound Campaign Drafting'],
    allowedRoles: ['customer', 'agent', 'admin'],
    roleAccessDescription: {
      admin: 'Full Strategy & Core Administration',
      agent: 'Deal Analysis & Campaign Generation',
      customer: 'ICP Review & Financial Insights'
    },
    memoryRequirements: '48GB VRAM',
    gpuModel: 'NVIDIA A100',
    performanceProfile: {
      tokensPerSecond: 85,
      latencyMs: 40,
      contextWindow: 65536,
      accuracyRating: '97.2%'
    }
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B Instruct',
    provider: 'Meta / NVIDIA',
    type: 'LLM',
    badge: 'Fastest',
    description: 'High-speed, low-latency LLM optimized for rapid content generation, summaries, and email drafts.',
    useCases: ['Fast Outbound Emails', 'Quick Deal Summaries', 'Lead Intake Notes'],
    allowedRoles: ['customer', 'agent', 'admin'],
    roleAccessDescription: {
      admin: 'High-speed system summaries',
      agent: 'Rapid outbound email generation',
      customer: 'Quick notes & intake summaries'
    },
    memoryRequirements: '24GB VRAM',
    gpuModel: 'NVIDIA A10G',
    performanceProfile: {
      tokensPerSecond: 130,
      latencyMs: 45,
      contextWindow: 131072,
      accuracyRating: '95.4%'
    }
  },
  {
    id: 'nemotron-3-8b',
    name: 'Nemotron 3 8B',
    provider: 'NVIDIA',
    type: 'LLM',
    badge: 'Standard',
    description: 'Balanced open-weights model for standard business content generation and customer campaign drafting.',
    useCases: ['Campaign Generation', 'Social Strategy', 'Customer Messaging'],
    allowedRoles: ['customer', 'agent', 'admin'],
    roleAccessDescription: {
      admin: 'Standard cluster orchestration',
      agent: 'Campaign & messaging drafting',
      customer: 'Messaging & feedback notes'
    },
    memoryRequirements: '24GB VRAM',
    gpuModel: 'NVIDIA A10G',
    performanceProfile: {
      tokensPerSecond: 120,
      latencyMs: 50,
      contextWindow: 8192,
      accuracyRating: '94.8%'
    }
  },
  {
    id: 'mistralai/mistral-7b-instruct-v0.3',
    name: 'Mistral 7B Instruct v0.3',
    provider: 'Mistral AI',
    type: 'LLM',
    badge: 'Standard',
    description: 'Versatile general-purpose model with concise instruction-following capabilities.',
    useCases: ['GTM Strategy', 'Content Studio', 'Document Summarization'],
    allowedRoles: ['customer', 'agent', 'admin'],
    roleAccessDescription: {
      admin: 'System prompt testing',
      agent: 'Content studio drafting',
      customer: 'Document summaries'
    },
    memoryRequirements: '24GB VRAM',
    gpuModel: 'NVIDIA A10G',
    performanceProfile: {
      tokensPerSecond: 110,
      latencyMs: 55,
      contextWindow: 32768,
      accuracyRating: '95.1%'
    }
  },
  {
    id: 'moonshot-v1-8k',
    name: 'Kimi (Moonshot v1 8K)',
    provider: 'Kimi / Moonshot AI',
    type: 'LLM',
    badge: 'High-Precision',
    description: 'High-performance Kimi model optimized for GTM report generation, copy synthesis, and structural content blueprints.',
    useCases: ['GTM Report Generation', 'Custom Imagery Blueprints', 'Structured Video Content', 'Outbound Strategy'],
    allowedRoles: ['customer', 'agent', 'admin'],
    roleAccessDescription: {
      admin: 'Full Strategy, API Tuning & System Prompts',
      agent: 'Campaign Playbooks & Content Synthesis',
      customer: 'GTM Strategy Summaries & AI Messenger'
    },
    memoryRequirements: 'Cloud API',
    gpuModel: 'Kimi Cluster',
    performanceProfile: {
      tokensPerSecond: 125,
      latencyMs: 35,
      contextWindow: 8192,
      accuracyRating: '98.1%'
    }
  },
  {
    id: 'moonshot-v1-32k',
    name: 'Kimi (Moonshot v1 32K)',
    provider: 'Kimi / Moonshot AI',
    type: 'LLM',
    badge: 'Pro',
    description: 'Long-context Kimi model suited for extensive documentation analysis and multi-chapter video blueprints.',
    useCases: ['Extended GTM Strategy', 'Multi-Page Financial Audit', 'Longform Content Orchestration'],
    allowedRoles: ['customer', 'agent', 'admin'],
    roleAccessDescription: {
      admin: 'Full Extended Audits & Global Configuration',
      agent: 'Longform Content & Playbook Generation',
      customer: 'Deep Document Analysis & Campaign Insights'
    },
    memoryRequirements: 'Cloud API',
    gpuModel: 'Kimi Cluster',
    performanceProfile: {
      tokensPerSecond: 95,
      latencyMs: 45,
      contextWindow: 32768,
      accuracyRating: '98.5%'
    }
  },
  {
    id: 'moonshot-v1-128k',
    name: 'Kimi (Moonshot v1 128K)',
    provider: 'Kimi / Moonshot AI',
    type: 'LLM',
    badge: 'Enterprise',
    description: 'Ultra-long context Kimi model capable of processing complete company archives and complex market intelligence.',
    useCases: ['Enterprise M&A Due Diligence', 'Comprehensive Market Synthesis', 'Full Playbook Generation'],
    allowedRoles: ['customer', 'agent', 'admin'],
    roleAccessDescription: {
      admin: 'Enterprise Due Diligence & Full Control',
      agent: 'Complete Archive Synthesis & Large Playbooks',
      customer: 'Enterprise Repository & Market Intelligence'
    },
    memoryRequirements: 'Cloud API',
    gpuModel: 'Kimi Cluster',
    performanceProfile: {
      tokensPerSecond: 75,
      latencyMs: 65,
      contextWindow: 131072,
      accuracyRating: '99.0%'
    }
  },


  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B Instruct',
    provider: 'Meta / NVIDIA',
    type: 'LLM',
    badge: 'Pro',
    description: 'State-of-the-art 70B parameter model engineered for complex reasoning, multi-page financial parsing, and deep strategy generation.',
    useCases: ['Complex M&A Memos', 'Competitive Analysis', 'High-Stakes Proposals'],
    allowedRoles: ['agent', 'admin'],
    memoryRequirements: '80GB VRAM',
    gpuModel: 'NVIDIA H100',
    performanceProfile: {
      tokensPerSecond: 40,
      latencyMs: 125,
      contextWindow: 131072,
      accuracyRating: '98.6%'
    }
  },
  {
    id: 'deepseek-ai/deepseek-v4-pro',
    name: 'DeepSeek V4 Pro',
    provider: 'DeepSeek / NVIDIA',
    type: 'LLM',
    badge: 'High-Precision',
    description: 'Enterprise reasoning engine with deep mathematical and financial audit accuracy.',
    useCases: ['Financial Due Diligence', 'Valuation Modeling', 'Regulatory Audits'],
    allowedRoles: ['agent', 'admin'],
    memoryRequirements: '80GB VRAM',
    gpuModel: 'NVIDIA H100',
    performanceProfile: {
      tokensPerSecond: 42,
      latencyMs: 115,
      contextWindow: 65536,
      accuracyRating: '98.9%'
    }
  },
  {
    id: 'mistralai/mistral-large-3',
    name: 'Mistral Large 3',
    provider: 'Mistral AI / NVIDIA',
    type: 'LLM',
    badge: 'Enterprise',
    description: 'Top-tier enterprise LLM offering superior multilingual reasoning and multi-turn dialogue orchestration.',
    useCases: ['Global Deal Orchestration', 'Multi-Agent Routing', 'Executive Pitch Decks'],
    allowedRoles: ['agent', 'admin'],
    memoryRequirements: '80GB VRAM',
    gpuModel: 'NVIDIA H100',
    performanceProfile: {
      tokensPerSecond: 50,
      latencyMs: 100,
      contextWindow: 32768,
      accuracyRating: '98.4%'
    }
  },
  {
    id: 'google/gemma-4-31b-it',
    name: 'Gemma 4 31B Instruct',
    provider: 'Google / NVIDIA',
    type: 'LLM',
    badge: 'Pro',
    description: 'Google enterprise instruction-tuned model designed for high-precision technical reasoning and synthesis.',
    useCases: ['Technical Architecture', 'Data Pipeline Logic', 'Playbook Optimization'],
    allowedRoles: ['agent', 'admin'],
    memoryRequirements: '80GB VRAM',
    gpuModel: 'NVIDIA H100',
    performanceProfile: {
      tokensPerSecond: 38,
      latencyMs: 130,
      contextWindow: 32768,
      accuracyRating: '97.8%'
    }
  }
];


export const MODEL_REGISTRY = {
  featured: SUPPORTED_MODELS.slice(0, 3),
  nvidia: SUPPORTED_MODELS,
  all: SUPPORTED_MODELS,
  benchmarks: {
    targetUtilization: 0.9,
    p99LatencyMs: 100
  }
};

/**
 * Returns list of AI models authorized for a specific user role.
 */
export function getModelsForRole(role: string = 'customer'): ModelConfig[] {
  const normalizedRole = (role?.toLowerCase() || 'customer') as UserRole;
  return SUPPORTED_MODELS.filter(model => model.allowedRoles.includes(normalizedRole));
}

export const filterModelsByRole = getModelsForRole;


/**
 * Validates if a user role is authorized to use a specific model.
 */
export function isModelAllowedForRole(modelId: string, role: string = 'customer'): boolean {
  const model = getModelById(modelId);
  if (!model) return false;
  const normalizedRole = (role?.toLowerCase() || 'customer') as UserRole;
  return model.allowedRoles.includes(normalizedRole);
}

/**
 * Finds a model configuration by ID.
 */
export function getModelById(modelId: string): ModelConfig | undefined {
  const targetId = (modelId || "").toLowerCase();
  if (targetId === "dealflow-llm" || targetId === "dealflow-ai-core" || targetId === "dealflow-llm-v1") {
    return SUPPORTED_MODELS.find(m => m.id === "dealflow-llm-v1");
  }
  return SUPPORTED_MODELS.find(m => m.id.toLowerCase() === targetId);
}


/**
 * Gets default fallback model for a given user role.
 */
export function getDefaultModelForRole(role: string = 'customer'): ModelConfig {
  const allowed = getModelsForRole(role);
  return allowed[0] || SUPPORTED_MODELS[0];
}

export interface ModelInvocationLog {
  user: string;
  modelId: string;
  tokensIn: number;
  tokensOut: number;
  latency: number;
  gpuId: string;
  timestamp: string;
}

export async function logModelInvocation(log: ModelInvocationLog) {
  console.log(`[ModelRegistry] Invocated ${log.modelId} (Lat: ${log.latency}ms, GPU: ${log.gpuId}, User: ${log.user})`);
}
