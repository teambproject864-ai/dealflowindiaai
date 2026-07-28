
import { hfInfer } from "@/lib/huggingface";
import { nvChatCompletion, nvChatCompletionStream } from "@/lib/nvidia";
import type {
  LLMProvider,
  LLMModel,
  LLMAPIKey,
  LLMRequest,
  LLMResponse,
  LLMInteraction,
} from "./types";
import { modelCatalog, selectModelForTask, getModelsByProvider } from "./model-catalog";
import { encrypt, decrypt, anonymizeData } from "./crypto";
import { db } from "@/lib/firebase-admin";

// In-memory key store (in production, use Firebase or a dedicated DB)
const apiKeysStore: Map<string, LLMAPIKey> = new Map();

// In-memory interaction log (in production, use Firebase)
const interactionsLog: LLMInteraction[] = [];

// In-memory metrics
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalCost: 0,
  totalLatencyMs: 0,
};

class LLMManager {
  private activeKeys: Map<LLMProvider, LLMAPIKey[]> = new Map();

  constructor() {
    // Initialize with demo keys (in production, load from DB)
    this.initializeDemoKeys();
  }

  private initializeDemoKeys() {
    // Demo Hugging Face key
    if (process.env.HUGGING_FACE_API_KEY) {
      const hfKey: LLMAPIKey = {
        id: "demo-hf-key-1",
        provider: "huggingface",
        keyHash: encrypt(process.env.HUGGING_FACE_API_KEY),
        rateLimitRemaining: 1000,
        rateLimitReset: Date.now() + 3600000,
        lastUsed: new Date(),
        status: "active",
      };
      apiKeysStore.set(hfKey.id, hfKey);
      this.updateProviderKeys("huggingface");
    }

    // Demo NVIDIA key
    if (process.env.NVIDIA_API_KEY) {
      const nvKey: LLMAPIKey = {
        id: "demo-nv-key-1",
        provider: "nvidia",
        keyHash: encrypt(process.env.NVIDIA_API_KEY),
        rateLimitRemaining: 1000,
        rateLimitReset: Date.now() + 3600000,
        lastUsed: new Date(),
        status: "active",
      };
      apiKeysStore.set(nvKey.id, nvKey);
      this.updateProviderKeys("nvidia");
    }
  }

  private updateProviderKeys(provider: LLMProvider) {
    const keys = Array.from(apiKeysStore.values()).filter(
      (key) => key.provider === provider && key.status === "active"
    );
    this.activeKeys.set(provider, keys);
  }

  private getAPIKeyForProvider(provider: LLMProvider): LLMAPIKey | null {
    const keys = this.activeKeys.get(provider);
    if (!keys || keys.length === 0) {
      return null;
    }
    // Simple load balancing: pick the key with the most remaining rate limit
    let selectedKey = keys[0];
    for (const key of keys) {
      if (key.rateLimitRemaining > selectedKey.rateLimitRemaining) {
        selectedKey = key;
      }
    }
    return selectedKey;
  }

  async executeRequest(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    let interaction: LLMInteraction = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      request,
      response: null,
      error: null,
      timestamp: new Date(),
      latencyMs: 0,
      cost: 0,
      modelId: "",
      provider: request.provider || "huggingface",
      userId: request.userId,
      useCase: request.useCase,
    };

    metrics.totalRequests++;

    try {
      // Select model
      let selectedModel: LLMModel;
      if (request.model) {
        // If provider is specified, first try to find a matching model for that provider
        if (request.provider) {
          const providerModel = modelCatalog.find(
            (m) => (m.name === request.model || m.id === request.model) && m.provider === request.provider
          );
          if (providerModel) {
            selectedModel = providerModel;
          } else {
            // If no exact match for provider, fall back to any model with that name/id
            const model = modelCatalog.find(
              (m) => m.name === request.model || m.id === request.model
            );
            if (!model) {
              throw new Error(`Model ${request.model} not found`);
            }
            selectedModel = model;
          }
        } else {
          const model = modelCatalog.find(
            (m) => m.name === request.model || m.id === request.model
          );
          if (!model) {
            throw new Error(`Model ${request.model} not found`);
          }
          selectedModel = model;
        }
      } else if (request.provider) {
        // If only provider is specified, select best model from that provider
        const providerModels = getModelsByProvider(request.provider);
        if (providerModels.length === 0) {
          throw new Error(`No available models for provider: ${request.provider}`);
        }
        // Sort provider models by performance/cost ratio
        providerModels.sort((a, b) => {
          const ratioA = a.performanceScore / (a.costPerInputToken + a.costPerOutputToken);
          const ratioB = b.performanceScore / (b.costPerInputToken + b.costPerOutputToken);
          return ratioB - ratioA;
        });
        selectedModel = providerModels[0];
      } else {
        selectedModel = selectModelForTask(request.taskType, {
          maxLatencyMs: 2000,
          minPerformanceScore: 85,
        });
      }
      interaction.modelId = selectedModel.id;
      interaction.provider = selectedModel.provider;

      // Get API key if available
      const apiKey = this.getAPIKeyForProvider(selectedModel.provider);

      // Execute request
      let output: string;
      if (selectedModel.provider === "nvidia") {
        output = await nvChatCompletion({
          model: selectedModel.name,
          messages: [
            ...(request.systemPrompt
              ? [{ role: "system" as const, content: request.systemPrompt }]
              : []),
            { role: "user" as const, content: request.userPrompt },
          ],
          maxTokens: request.maxTokens || 800,
          temperature: request.temperature || 0.2,
          topP: request.topP || 0.95,
        });
      } else {
        output = await hfInfer(
          request.userPrompt,
          request.systemPrompt || "",
          {
            max_tokens: request.maxTokens || 800,
            temperature: request.temperature || 0.2,
            top_p: request.topP || 0.95,
          }
        );
      }

      // Update API key usage if we have one
      if (apiKey) {
        apiKey.lastUsed = new Date();
        apiKey.rateLimitRemaining--;
      }

      // Calculate metrics
      const inputTokens = Math.ceil(
        (request.systemPrompt?.length || 0 + request.userPrompt.length) / 4
      );
      const outputTokens = Math.ceil(output.length / 4);
      const cost =
        inputTokens * selectedModel.costPerInputToken +
        outputTokens * selectedModel.costPerOutputToken;
      const latencyMs = Date.now() - startTime;

      // Build response
      const response: LLMResponse = {
        id: `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        requestId: interaction.id,
        provider: selectedModel.provider,
        model: selectedModel.name,
        output,
        latencyMs,
        inputTokens,
        outputTokens,
        cost,
        timestamp: new Date(),
      };

      interaction.response = response;
      interaction.latencyMs = latencyMs;
      interaction.cost = cost;
      metrics.successfulRequests++;
      metrics.totalCost += cost;
      metrics.totalLatencyMs += latencyMs;

      // Log interaction (anonymize first)
      const anonymizedRequest = {
        ...request,
        systemPrompt: request.systemPrompt ? anonymizeData(request.systemPrompt) : undefined,
        userPrompt: anonymizeData(request.userPrompt),
      };
      const anonymizedResponse = {
        ...response,
        output: anonymizeData(output),
      };
      interactionsLog.push({
        ...interaction,
        request: anonymizedRequest,
        response: anonymizedResponse,
      });

      // Log audit event in Firebase
      await this.logAuditEvent(
        "llm_request",
        `Executed LLM request with model ${selectedModel.name}`,
        {
          requestId: interaction.id,
          model: selectedModel.name,
          provider: selectedModel.provider,
          cost,
          latencyMs,
        }
      );

      return response;
    } catch (error: any) {
      interaction.error = error.message;
      metrics.failedRequests++;
      interactionsLog.push(interaction);

      // Failover: try a different model/provider if possible
      if (!request.provider) {
        console.log("Attempting failover to another provider...");
        const otherProvider: LLMProvider =
          interaction.provider === "huggingface" ? "nvidia" : "huggingface";
        const otherModels = modelCatalog.filter(
          (m) => m.provider === otherProvider && m.available
        );
        if (otherModels.length > 0) {
          return this.executeRequest({
            ...request,
            provider: otherProvider,
            model: otherModels[0].name,
          });
        }
      }

      await this.logAuditEvent(
        "llm_error",
        `LLM request failed: ${error.message}`,
        { requestId: interaction.id }
      );
      throw error;
    }
  }

  private async logAuditEvent(
    actionType: string,
    actionDetails: string,
    metadata: Record<string, any> = {}
  ) {
    try {
      if (db) {
        await db.collection("llm_audit_logs").add({
          actionType,
          actionDetails,
          metadata,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error("Failed to log audit event:", e);
    }
  }

  getMetrics() {
    return {
      ...metrics,
      averageLatencyMs:
        metrics.successfulRequests > 0
          ? metrics.totalLatencyMs / metrics.successfulRequests
          : 0,
      successRate:
        metrics.totalRequests > 0
          ? metrics.successfulRequests / metrics.totalRequests
          : 0,
    };
  }

  getInteractions(limit: number = 100): LLMInteraction[] {
    return interactionsLog.slice(-limit);
  }
}

export const llmManager = new LLMManager();

