import Redis from "ioredis";
import { logger } from "../logger";

export interface UserSession {
  sessionId: string;
  userId: string;
  role: string;
  data: Record<string, any>;
  createdAt: string;
  expiresAt: string;
}

export interface BackgroundJob {
  id: string;
  queueName: "fcm_dispatch" | "pocketbase_sync" | "vector_embedding" | "ai_workflow_execution" | string;
  payload: Record<string, any>;
  createdAt: string;
}

// Resilient in-memory fallback for local dev / offline test environments
const inMemoryCache = new Map<string, { value: any; expiresAt?: number }>();
const inMemorySessions = new Map<string, UserSession>();
const inMemoryQueues = new Map<string, BackgroundJob[]>();

let redisClient: Redis | null = null;
let redisInitialized = false;

export class RedisService {
  getClient(): Redis | null {
    if (redisInitialized) return redisClient;
    redisInitialized = true;

    const url = process.env.REDIS_URL;
    if (url) {
      try {
        redisClient = new Redis(url, {
          maxRetriesPerRequest: 1,
          connectTimeout: 2000,
          enableOfflineQueue: false,
        });

        redisClient.on("error", (err) => {
          logger.warn("[RedisService] Connection error, using resilient in-memory fallback", { error: err.message });
        });

        redisClient.on("connect", () => {
          logger.info("[RedisService] Successfully connected to Redis server");
        });

        return redisClient;
      } catch (err: any) {
        logger.warn("[RedisService] Failed to instantiate Redis client", { error: err.message });
      }
    }

    logger.info("[RedisService] REDIS_URL not set or unreachable, operating in resilient in-memory cache mode");
    return null;
  }

  // --- Caching Layer ---
  async getCache<T>(key: string): Promise<T | null> {
    const redis = this.getClient();
    if (redis && redis.status === "ready") {
      try {
        const data = await redis.get(key);
        if (data) return JSON.parse(data) as T;
      } catch {
        // Fallback
      }
    }

    const cached = inMemoryCache.get(key);
    if (cached) {
      if (cached.expiresAt && Date.now() > cached.expiresAt) {
        inMemoryCache.delete(key);
        return null;
      }
      return cached.value as T;
    }
    return null;
  }

  async setCache<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    const redis = this.getClient();
    if (redis && redis.status === "ready") {
      try {
        await redis.setex(key, ttlSeconds, JSON.stringify(value));
        return;
      } catch {
        // Fallback
      }
    }

    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : undefined;
    inMemoryCache.set(key, { value, expiresAt });
  }

  async deleteCache(key: string): Promise<void> {
    const redis = this.getClient();
    if (redis && redis.status === "ready") {
      try {
        await redis.del(key);
      } catch {
        // Fallback
      }
    }
    inMemoryCache.delete(key);
  }

  /**
   * Invalidates multiple cache keys matching a prefix or pattern
   */
  async invalidatePattern(patternPrefix: string): Promise<number> {
    let count = 0;
    const redis = this.getClient();
    if (redis && redis.status === "ready") {
      try {
        const keys = await redis.keys(`${patternPrefix}*`);
        if (keys.length > 0) {
          count = await redis.del(...keys);
          return count;
        }
      } catch {
        // Fallback
      }
    }

    for (const key of inMemoryCache.keys()) {
      if (key.startsWith(patternPrefix)) {
        inMemoryCache.delete(key);
        count++;
      }
    }
    return count;
  }

  // --- Session Management ---
  async createSession(userId: string, role: string, data: Record<string, any> = {}, ttlSeconds = 86400): Promise<UserSession> {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();
    const expires = new Date(now.getTime() + ttlSeconds * 1000);

    const session: UserSession = {
      sessionId,
      userId,
      role,
      data,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };

    await this.setCache(`session:${sessionId}`, session, ttlSeconds);
    inMemorySessions.set(sessionId, session);
    return session;
  }

  async getSession(sessionId: string): Promise<UserSession | null> {
    const session = await this.getCache<UserSession>(`session:${sessionId}`);
    if (session) return session;
    return inMemorySessions.get(sessionId) || null;
  }

  async destroySession(sessionId: string): Promise<void> {
    await this.deleteCache(`session:${sessionId}`);
    inMemorySessions.delete(sessionId);
  }

  // --- Background Job Queues ---
  async enqueueJob(
    queueName: "fcm_dispatch" | "pocketbase_sync" | "vector_embedding" | "ai_workflow_execution" | string,
    payload: Record<string, any>
  ): Promise<BackgroundJob> {
    const job: BackgroundJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      queueName,
      payload,
      createdAt: new Date().toISOString(),
    };

    const redis = this.getClient();
    if (redis && redis.status === "ready") {
      try {
        await redis.rpush(`queue:${queueName}`, JSON.stringify(job));
        return job;
      } catch {
        // Fallback
      }
    }

    const queue = inMemoryQueues.get(queueName) || [];
    queue.push(job);
    inMemoryQueues.set(queueName, queue);
    return job;
  }

  async dequeueJob(queueName: string): Promise<BackgroundJob | null> {
    const redis = this.getClient();
    if (redis && redis.status === "ready") {
      try {
        const data = await redis.lpop(`queue:${queueName}`);
        if (data) return JSON.parse(data) as BackgroundJob;
      } catch {
        // Fallback
      }
    }

    const queue = inMemoryQueues.get(queueName);
    if (queue && queue.length > 0) {
      return queue.shift() || null;
    }
    return null;
  }

  async processJobQueue(queueName: string, handler: (job: BackgroundJob) => Promise<void>): Promise<number> {
    let processedCount = 0;
    let job = await this.dequeueJob(queueName);
    while (job) {
      try {
        await handler(job);
        processedCount++;
      } catch (err: any) {
        logger.error(`[Redis Queue] Job '${job.id}' in '${queueName}' processing failed`, err);
      }
      job = await this.dequeueJob(queueName);
    }
    return processedCount;
  }
}

export const redisService = new RedisService();

// Export standalone convenience functions
export const getCache = <T>(key: string) => redisService.getCache<T>(key);
export const setCache = <T>(key: string, val: T, ttl?: number) => redisService.setCache<T>(key, val, ttl);
export const deleteCache = (key: string) => redisService.deleteCache(key);
export const createSession = (userId: string, role: string, data?: Record<string, any>, ttl?: number) => redisService.createSession(userId, role, data, ttl);
export const getSession = (sessionId: string) => redisService.getSession(sessionId);
export const destroySession = (sessionId: string) => redisService.destroySession(sessionId);
export const enqueueJob = (queueName: string, payload: Record<string, any>) => redisService.enqueueJob(queueName, payload);
export const dequeueJob = (queueName: string) => redisService.dequeueJob(queueName);
export const processJobQueue = (queueName: string, handler: (job: BackgroundJob) => Promise<void>) => redisService.processJobQueue(queueName, handler);
