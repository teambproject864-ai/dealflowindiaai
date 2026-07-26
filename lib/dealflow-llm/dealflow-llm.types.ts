// Dealflow LLM: Go-to-Market Large Language Model - Types

// Dealflow LLM Core Types
export interface DealflowLatentVector {
  id: string;
  vector: number[];
  timestamp: number;
  metadata: Record<string, any>;
}

export interface DealflowLearningState {
  epoch: number;
  loss: {
    llm: number;
    ganGenerator: number;
    ganDiscriminator: number;
    vae: number;
    total: number;
  };
  modeCollapseRisk: number;
}

export interface DealflowOutput {
  llmOutput: string;
  ganOutput: string;
  vaeOutput: { latent: DealflowLatentVector; reconstruction: string };
  fusedOutput: string;
  confidence: number;
  metadata: {
    timestamp: number;
    processingTimeMs: number;
    modelVersions: { llm: string; gan: string; vae: string };
  };
}

export interface DealflowMarketDataPoint {
  id: string;
  category: 'customer_insight' | 'campaign_performance' | 'content_performance' | string;
  features: number[];
  label?: string;
  metadata: Record<string, any>;
  timestamp: number;
}

export interface DealflowLLMConfig {
  maxLatentDim: number;
  numEpochs: number;
  learningRate: number;
  fusionStrategy: 'weighted_average' | 'consensus' | 'llm_primary_with_enhancements';
}
