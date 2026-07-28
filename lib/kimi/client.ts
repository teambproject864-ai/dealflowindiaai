import { KimiChatCompletionRequest, KimiChatCompletionResponse, KimiApiCallLog } from "./types";

export class KimiClient {
  private apiKey: string;
  private baseUrl: string;
  private rateLimiter: any;
  private cache: Map<string, { response: KimiChatCompletionResponse; expires: number }>;
  private logs: KimiApiCallLog[];
  private cacheTTL: number;

  constructor(apiKey: string = process.env.KIMI_API_KEY || "mock-key", baseUrl: string = "https://api.moonshot.cn/v1", cacheTTL: number = 300000) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.cacheTTL = cacheTTL;
    this.cache = new Map();
    this.logs = [];
    this.rateLimiter = null;
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

  private getCacheKey(request: KimiChatCompletionRequest): string {
    return JSON.stringify(request);
  }

  async chatCompletion(request: KimiChatCompletionRequest): Promise<KimiChatCompletionResponse> {
    const startTime = Date.now();
    const log: Omit<KimiApiCallLog, "latency" | "success"> = {
      id: crypto.randomUUID(),
      timestamp: startTime,
      request,
    };

    try {
      // Check cache first
      const cacheKey = this.getCacheKey(request);
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() < cached.expires) {
        const latency = Date.now() - startTime;
        this.logs.push({ ...log, response: cached.response, latency, success: true });
        return cached.response;
      }

      // Rate limiting
      const limiter = await this.getRateLimiter();
      await limiter.consume("kimi-api", 1);

      // Make API call
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Kimi API error: ${response.status} - ${errorText}`);
      }

      const data: KimiChatCompletionResponse = await response.json();

      // Cache the result
      this.cache.set(cacheKey, { response: data, expires: Date.now() + this.cacheTTL });

      const latency = Date.now() - startTime;
      this.logs.push({ ...log, response: data, latency, success: true });

      return data;
    } catch (error: any) {
      const latency = Date.now() - startTime;
      this.logs.push({ ...log, error: error.message, latency, success: false });
      throw error;
    }
  }

  getLogs(limit: number = 100): KimiApiCallLog[] {
    return this.logs.slice(-limit);
  }

  clearCache(): void {
    this.cache.clear();
  }
}
