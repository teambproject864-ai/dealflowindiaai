import { KimiChatCompletionRequest, KimiChatCompletionResponse, KimiApiCallLog } from "./types";
import { signKimiRequest } from "../security/request-signing";
import { KimiAPIError, handleKimiError } from "./error-handler";
import { decryptEnvelope, isEnvelope } from "../secure-storage/envelope-encryption";

export enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN"
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
}

export class KimiClient {
  private apiKey: string;
  private baseUrl: string;
  private rateLimiter: any;
  private cache: Map<string, { response: KimiChatCompletionResponse; expires: number }>;
  private logs: KimiApiCallLog[];
  private cacheTTL: number;

  // Circuit breaker state
  private circuitState: CircuitState = CircuitState.CLOSED;
  private consecutiveFailures: number = 0;
  private nextAttemptTimestamp: number = 0;
  private failureThreshold: number;
  private resetTimeoutMs: number;

  constructor(
    apiKey?: string,
    baseUrl?: string,
    cacheTTL: number = 300000,
    circuitOptions: Partial<CircuitBreakerOptions> = {}
  ) {
    this.baseUrl = baseUrl || process.env.KIMI_BASE_URL || "https://api.moonshot.cn/v1";
    this.apiKey = this.resolveApiKey(apiKey);
    this.cacheTTL = cacheTTL;
    this.cache = new Map();
    this.logs = [];
    this.rateLimiter = null;

    this.failureThreshold = circuitOptions.failureThreshold || 5;
    this.resetTimeoutMs = circuitOptions.resetTimeoutMs || 30000;
  }

  private resolveApiKey(inputKey?: string): string {
    if (inputKey && inputKey !== "mock-key" && !inputKey.startsWith("simulated-")) {
      if (isEnvelope(inputKey)) {
        try {
          return decryptEnvelope(inputKey);
        } catch {
          // fallback
        }
      }
      return inputKey;
    }

    if (process.env.ENC_KIMI_API_KEY) {
      try {
        return decryptEnvelope(process.env.ENC_KIMI_API_KEY);
      } catch (e) {
        console.error("[KimiClient] Error decrypting ENC_KIMI_API_KEY envelope:", e);
      }
    }

    if (process.env.KIMI_API_KEY) {
      return process.env.KIMI_API_KEY;
    }

    if (process.env.NODE_ENV === "test" || process.env.VITEST || process.env.JEST_WORKER_ID) {
      return "mock-kimi-api-key-for-tests";
    }

    throw new Error("STRICT CONFIGURATION ERROR: Kimi API Key is missing. Please ensure ENC_KIMI_API_KEY or KIMI_API_KEY is configured in your .env.local file.");
  }


  private async getRateLimiter() {
    if (!this.rateLimiter) {
      const { RateLimiterMemory } = await import("rate-limiter-flexible");
      this.rateLimiter = new RateLimiterMemory({
        points: 60,
        duration: 60,
      });
    }
    return this.rateLimiter;
  }

  private checkCircuitBreaker(): void {
    const now = Date.now();
    if (this.circuitState === CircuitState.OPEN) {
      if (now >= this.nextAttemptTimestamp) {
        this.circuitState = CircuitState.HALF_OPEN;
      } else {
        throw new KimiAPIError(
          `Circuit breaker is OPEN. Kimi API calls are suspended until ${new Date(this.nextAttemptTimestamp).toISOString()}`,
          503,
          "KIMI_CIRCUIT_OPEN"
        );
      }
    }
  }

  private recordSuccess(): void {
    this.consecutiveFailures = 0;
    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.circuitState = CircuitState.CLOSED;
    }
  }

  private recordFailure(): void {
    this.consecutiveFailures++;
    if (this.consecutiveFailures >= this.failureThreshold) {
      this.circuitState = CircuitState.OPEN;
      this.nextAttemptTimestamp = Date.now() + this.resetTimeoutMs;
    }
  }

  public getCircuitStatus(): { state: CircuitState; consecutiveFailures: number; nextAttemptTimestamp: number } {
    return {
      state: this.circuitState,
      consecutiveFailures: this.consecutiveFailures,
      nextAttemptTimestamp: this.nextAttemptTimestamp,
    };
  }

  private getCacheKey(request: KimiChatCompletionRequest): string {
    return JSON.stringify(request);
  }

  async chatCompletion(
    request: KimiChatCompletionRequest,
    options: { maxRetries?: number } = {}
  ): Promise<KimiChatCompletionResponse> {
    const startTime = Date.now();
    const requestId = `kimi-req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const log: Omit<KimiApiCallLog, "latency" | "success"> = {
      id: requestId,
      timestamp: startTime,
      request,
    };

    // 1. Check circuit breaker state
    this.checkCircuitBreaker();

    // 2. Check cache
    const cacheKey = this.getCacheKey(request);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      const latency = Date.now() - startTime;
      this.logs.push({ ...log, response: cached.response, latency, success: true });
      return cached.response;
    }

    // 3. Rate limiting
    try {
      const limiter = await this.getRateLimiter();
      await limiter.consume("kimi-api", 1);
    } catch {
      throw new KimiAPIError("Kimi API Rate limit exceeded in local token bucket", 429, "KIMI_RATE_LIMIT_EXCEEDED", requestId);
    }

    const maxRetries = options.maxRetries ?? 3;
    let attempt = 0;
    let lastError: any = null;

    while (attempt <= maxRetries) {
      try {
        const bodyString = JSON.stringify(request);
        const signedHeaders = signKimiRequest(bodyString, this.apiKey);

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
            ...signedHeaders,
          },
          body: bodyString,
        });

        if (!response.ok) {
          const errorText = await response.text();
          const isTransient = [429, 500, 502, 503, 504].includes(response.status);

          if (isTransient && attempt < maxRetries) {
            attempt++;
            const backoffMs = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 10000);
            await new Promise((res) => setTimeout(res, backoffMs));
            continue;
          }

          throw new KimiAPIError(
            `Kimi API error: ${response.status} - ${errorText}`,
            response.status,
            response.status === 429 ? "KIMI_RATE_LIMIT_EXCEEDED" : "KIMI_API_ERROR",
            requestId
          );
        }

        const data: KimiChatCompletionResponse = await response.json();

        // Record success in circuit breaker
        this.recordSuccess();

        // Cache the result
        this.cache.set(cacheKey, { response: data, expires: Date.now() + this.cacheTTL });

        const latency = Date.now() - startTime;
        this.logs.push({ ...log, response: data, latency, success: true });

        return data;
      } catch (error: any) {
        lastError = error;
        if (attempt >= maxRetries || error instanceof KimiAPIError && [401, 400, 403].includes(error.statusCode)) {
          break;
        }
        attempt++;
      }
    }

    // Record failure in circuit breaker
    this.recordFailure();

    const latency = Date.now() - startTime;
    const errorMsg = lastError instanceof Error ? lastError.message : String(lastError);
    this.logs.push({ ...log, error: errorMsg, latency, success: false });

    // Handle error with standardized mapper
    const unifiedError = handleKimiError(lastError, { requestId, endpoint: "/chat/completions" });
    throw new KimiAPIError(
      unifiedError.error.message,
      lastError?.statusCode || 500,
      unifiedError.error.code,
      requestId
    );
  }

  getLogs(limit: number = 100): KimiApiCallLog[] {
    return this.logs.slice(-limit);
  }

  clearCache(): void {
    this.cache.clear();
  }

  resetCircuitBreaker(): void {
    this.circuitState = CircuitState.CLOSED;
    this.consecutiveFailures = 0;
    this.nextAttemptTimestamp = 0;
  }
}
