import { hfInfer, hfInferJSON } from './huggingface';
import { nvInfer, nvInferJSON } from './nvidia';
import { kimiInfer, kimiInferJSON } from './kimi';
import { dealflowLLM } from './dealflow-llm';
import { startLLMJob, completeLLMJob } from './llm-job-tracker';

// Define supported AI providers
export const SUPPORTED_PROVIDERS = ['huggingface', 'nvidia', 'kimi', 'dealflow-llm'] as const;
export type SupportedAIProvider = typeof SUPPORTED_PROVIDERS[number];

// Request attributes that can determine provider selection
export interface ProviderRequestAttributes {
  userRegion?: string;
  requestType?: string;
  tierLevel?: 'starter' | 'growth' | 'enterprise';
}

// Provider mapping configuration
export interface ProviderMappingRule {
  condition: (attrs: ProviderRequestAttributes) => boolean;
  provider: SupportedAIProvider;
  priority: number;
}

// Log entry for provider switching
export interface ProviderSwitchLog {
  timestamp: number;
  requestId?: string;
  attributes: ProviderRequestAttributes;
  selectedProvider: SupportedAIProvider;
  fallbackFrom?: SupportedAIProvider;
  isFallback: boolean;
}

// In-memory log storage
const providerSwitchLogs: ProviderSwitchLog[] = [];

// Default provider (fallback)
const DEFAULT_PROVIDER: SupportedAIProvider = 'huggingface';

// Provider mapping rules
const PROVIDER_MAPPING_RULES: ProviderMappingRule[] = [
  // Use Dealflow LLM for go-to-market tasks (highest priority)
  {
    condition: (attrs) => attrs.requestType?.startsWith('gtm-') || attrs.requestType?.startsWith('marketing-') || attrs.requestType === 'campaign',
    provider: 'dealflow-llm',
    priority: 20,
  },
  // Enterprise tier: use nvidia for highest performance
  {
    condition: (attrs) => attrs.tierLevel === 'enterprise',
    provider: 'nvidia',
    priority: 10,
  },
  // Growth tier: use kimi for balanced performance and cost
  {
    condition: (attrs) => attrs.tierLevel === 'growth',
    provider: 'kimi',
    priority: 9,
  },
  // Starter tier: use huggingface
  {
    condition: (attrs) => attrs.tierLevel === 'starter',
    provider: 'huggingface',
    priority: 8,
  },
  // Region-based rules (example)
  {
    condition: (attrs) => !!attrs.userRegion?.startsWith('Asia'),
    provider: 'kimi',
    priority: 7,
  },
  {
    condition: (attrs) => !!attrs.userRegion?.startsWith('North America'),
    provider: 'nvidia',
    priority: 7,
  },
  // Request type-based rules (example)
  {
    condition: (attrs) => attrs.requestType === 'analysis',
    provider: 'kimi',
    priority: 6,
  },
];

/**
 * Validate if a provider is supported
 */
export function isSupportedProvider(provider: string): provider is SupportedAIProvider {
  return SUPPORTED_PROVIDERS.includes(provider as SupportedAIProvider);
}

/**
 * Log a provider selection event
 */
function logProviderSelection(
  attributes: ProviderRequestAttributes,
  selectedProvider: SupportedAIProvider,
  fallbackFrom?: SupportedAIProvider
): void {
  const logEntry: ProviderSwitchLog = {
    timestamp: Date.now(),
    attributes,
    selectedProvider,
    fallbackFrom,
    isFallback: !!fallbackFrom,
  };
  providerSwitchLogs.push(logEntry);
  if (providerSwitchLogs.length > 100) {
    providerSwitchLogs.shift();
  }
  
  // Also log to console for debugging
  console.log(
    `[AI Provider Router] Selected provider: ${selectedProvider}`,
    fallbackFrom ? `(fallback from ${fallbackFrom})` : '',
    'Attributes:', attributes
  );
}

// Traffic distribution state for load balancing across providers
const providerTrafficCounter: Record<SupportedAIProvider, number> = {
  'huggingface': 0,
  'nvidia': 0,
  'kimi': 0,
  'dealflow-llm': 0
};

// Target weight distribution (percentages out of 100)
const PROVIDER_WEIGHTS: Record<SupportedAIProvider, number> = {
  'kimi': 35,
  'nvidia': 30,
  'dealflow-llm': 20,
  'huggingface': 15
};

/**
 * Select provider based on weighted load distribution to prevent service overloading
 */
export function getLoadBalancedProvider(): SupportedAIProvider {
  const totalCalls = Object.values(providerTrafficCounter).reduce((sum, count) => sum + count, 0);

  // If initial state or zero calls, round robin starting with Kimi
  if (totalCalls === 0) {
    providerTrafficCounter['kimi']++;
    return 'kimi';
  }

  // Calculate standard deviation / deviation from target ratio
  let selectedProvider: SupportedAIProvider = 'kimi';
  let maxDeficit = -Infinity;

  for (const provider of SUPPORTED_PROVIDERS) {
    const currentRatio = (providerTrafficCounter[provider] / totalCalls) * 100;
    const targetRatio = PROVIDER_WEIGHTS[provider];
    const deficit = targetRatio - currentRatio;

    if (deficit > maxDeficit) {
      maxDeficit = deficit;
      selectedProvider = provider;
    }
  }

  providerTrafficCounter[selectedProvider]++;
  return selectedProvider;
}

/**
 * Select provider based on request attributes and load distribution
 */
export function selectAIProvider(
  attributes: ProviderRequestAttributes = {},
  requestId?: string
): SupportedAIProvider {
  // First check if AI_PROVIDER is set in environment variables
  const envProvider = process.env.AI_PROVIDER;
  if (envProvider && isSupportedProvider(envProvider)) {
    logProviderSelection(attributes, envProvider);
    return envProvider;
  }

  // Find matching rules sorted by priority (highest first)
  const matchingRules = PROVIDER_MAPPING_RULES.filter((rule) =>
    rule.condition(attributes)
  ).sort((a, b) => b.priority - a.priority);

  if (matchingRules.length > 0) {
    const selectedProvider = matchingRules[0].provider;
    logProviderSelection(attributes, selectedProvider);
    return selectedProvider;
  }

  // No high-priority rule matched, use load balanced provider distribution
  const loadBalancedProvider = getLoadBalancedProvider();
  logProviderSelection(attributes, loadBalancedProvider);
  return loadBalancedProvider;
}


/**
 * Get provider-specific inference functions
 */
export function getProviderInferenceFunctions(provider: SupportedAIProvider) {
  switch (provider) {
    case 'huggingface':
      return { infer: hfInfer, inferJSON: hfInferJSON };
    case 'nvidia':
      return { infer: nvInfer, inferJSON: nvInferJSON };
    case 'kimi':
      return { infer: kimiInfer, inferJSON: kimiInferJSON };
    case 'dealflow-llm':
      return { 
        infer: async (prompt: string, systemPrompt: string, options: any) => {
          const result = await dealflowLLM.infer(prompt, systemPrompt, options);
          return result.fusedOutput;
        }, 
        inferJSON: hfInferJSON 
      };
    default:
      // This should never happen with TypeScript checks
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

/**
 * Perform dynamic inference with provider selection
 */
export async function performDynamicInference(
  prompt: string,
  systemPrompt: string,
  attributes: ProviderRequestAttributes = {},
  options: any = {}
): Promise<string> {
  const initialProvider = selectAIProvider(attributes);
  
  // Create a list of providers to try, starting with initial provider, then all others
  const providersToTry: SupportedAIProvider[] = [initialProvider];
  for (const provider of SUPPORTED_PROVIDERS) {
    if (!providersToTry.includes(provider)) {
      providersToTry.push(provider);
    }
  }
  
  let lastError: any;
  let lastProvider: SupportedAIProvider | null = null;
  let activeJobId: string | null = null;
  let activeProviderModel: string | null = null;
  
  // Get the model name for each provider (for tracking)
  const getProviderModel = (provider: SupportedAIProvider): string => {
    switch (provider) {
      case 'huggingface': return 'mistralai/Mistral-7B-Instruct-v0.3';
      case 'nvidia': return 'nvidia/nemotron';
      case 'kimi': return 'kimi-v1';
      case 'dealflow-llm': return 'dealflow-llm-v1';
      default: return 'unknown-model';
    }
  };
  
  for (const provider of providersToTry) {
    try {
      console.log(`[AI Provider Router] Trying provider: ${provider}`);
      const { infer } = getProviderInferenceFunctions(provider);
      if (lastProvider) {
        logProviderSelection(attributes, provider, lastProvider);
      }
      
      // Extract analysisId from requestType (format: "gtm-analysis-<analysisId>")
      let extractedAnalysisId: string | undefined;
      if (attributes.requestType?.startsWith("gtm-analysis-")) {
        extractedAnalysisId = attributes.requestType.replace("gtm-analysis-", "");
      }
      
      // Start LLM job tracking
      const model = getProviderModel(provider);
      activeJobId = startLLMJob(provider, model, extractedAnalysisId);
      activeProviderModel = model;
      
      const result = await infer(prompt, systemPrompt, options);
      
      // Complete job on success
      if (activeJobId) {
        completeLLMJob(activeJobId, "completed");
      }
      
      console.log(`[AI Provider Router] Success with provider: ${provider}`);
      return result;
    } catch (error) {
      // Complete job as failed
      if (activeJobId) {
        completeLLMJob(activeJobId, "failed", error instanceof Error ? error.message : "Unknown error");
      }
      lastError = error;
      lastProvider = provider;
      console.error(
        `[AI Provider Router] Inference with ${provider} failed, trying next...`,
        error
      );
    }
  }
  
  // If all providers failed, throw the last error
  throw new Error(`All AI providers failed. Last error: ${lastError?.message || "Unknown error"}`);
}

/**
 * Perform dynamic JSON inference with provider selection
 */
export async function performDynamicInferenceJSON(
  prompt: string,
  systemPrompt: string,
  attributes: ProviderRequestAttributes = {},
  options: any = {}
): Promise<any> {
  const initialProvider = selectAIProvider(attributes);
  
  // Create a list of providers to try, starting with initial provider, then all others
  const providersToTry: SupportedAIProvider[] = [initialProvider];
  for (const provider of SUPPORTED_PROVIDERS) {
    if (!providersToTry.includes(provider)) {
      providersToTry.push(provider);
    }
  }
  
  let lastError: any;
  let lastProvider: SupportedAIProvider | null = null;
  let activeJobId: string | null = null;
  
  // Get the model name for each provider (for tracking)
  const getProviderModel = (provider: SupportedAIProvider): string => {
    switch (provider) {
      case 'huggingface': return 'mistralai/Mistral-7B-Instruct-v0.3';
      case 'nvidia': return 'nvidia/nemotron';
      case 'kimi': return 'kimi-v1';
      case 'dealflow-llm': return 'dealflow-llm-v1';
      default: return 'unknown-model';
    }
  };
  
  for (const provider of providersToTry) {
    try {
      console.log(`[AI Provider Router] Trying provider: ${provider} (JSON)`);
      const { inferJSON } = getProviderInferenceFunctions(provider);
      if (lastProvider) {
        logProviderSelection(attributes, provider, lastProvider);
      }
      
      // Extract analysisId from requestType (format: "gtm-analysis-<analysisId>")
      let extractedAnalysisId: string | undefined;
      if (attributes.requestType?.startsWith("gtm-analysis-")) {
        extractedAnalysisId = attributes.requestType.replace("gtm-analysis-", "");
      }
      
      // Start LLM job tracking
      const model = getProviderModel(provider);
      activeJobId = startLLMJob(provider, model, extractedAnalysisId);
      
      const result = await inferJSON(prompt, systemPrompt, options);
      
      // Complete job on success
      if (activeJobId) {
        completeLLMJob(activeJobId, "completed");
      }
      
      console.log(`[AI Provider Router] Success with provider: ${provider} (JSON)`);
      return result;
    } catch (error) {
      // Complete job as failed
      if (activeJobId) {
        completeLLMJob(activeJobId, "failed", error instanceof Error ? error.message : "Unknown error");
      }
      lastError = error;
      lastProvider = provider;
      console.error(
        `[AI Provider Router] JSON inference with ${provider} failed, trying next...`,
        error
      );
    }
  }
  
  // If all providers failed, throw the last error
  throw new Error(`All AI providers failed for JSON inference. Last error: ${lastError?.message || "Unknown error"}`);
}

/**
 * Get all provider switch logs
 */
export function getProviderSwitchLogs(limit: number = 100): ProviderSwitchLog[] {
  return providerSwitchLogs.slice(-limit);
}

/**
 * Clear provider switch logs
 */
export function clearProviderSwitchLogs(): void {
  providerSwitchLogs.length = 0;
}
