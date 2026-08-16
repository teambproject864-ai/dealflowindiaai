import Redis from "ioredis";
import { logger } from "./logger";

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
  queueName: string;
  payload: Record<string, any>;
  createdAt: string;
}

// Resilient in-memory fallback for local dev / offline test environments
const inMemoryCache = new Map<string, { value: any; expiresAt?: number }>();
const inMemorySessions = new Map<string, UserSession>();
const inMemoryQueues = new Map<string, BackgroundJob[]>();

let redisClient: Redis | null = null;
let redisInitialized = false;

export function getRedisClient(): Redis | null {
  if (redisInitialized) return redisClient;
  redisInitialized = true;

  const url = process.env.REDIS_URL;
  if (url) {
    try {
      redisClient = new Redis(url, {
        maxRetriesPerRequest: 0,
        connectTimeout: 500,
        enableOfflineQueue: false,
        retryStrategy: () => null,
        lazyConnect: true,
      });

      redisClient.on("error", (err) => {
        logger.warn("[Redis] Connection error, using resilient in-memory fallback", { error: err.message });
      });

      redisClient.on("connect", () => {
        logger.info("[Redis] Successfully connected to Redis server");
      });

      return redisClient;
    } catch (err: any) {
      logger.warn("[Redis] Failed to instantiate Redis client", { error: err.message });
    }
  }

  logger.info("[Redis] REDIS_URL not set or unreachable, operating in resilient in-memory cache mode");
  return null;
}

// --- Caching Layer ---

export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
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

export async function setCache<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
  const redis = getRedisClient();
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

export async function deleteCache(key: string): Promise<void> {
  const redis = getRedisClient();
  if (redis && redis.status === "ready") {
    try {
      await redis.del(key);
    } catch {
      // Fallback
    }
  }
  inMemoryCache.delete(key);
}

// --- Session Store ---

export async function createSession(userId: string, role: string, data: Record<string, any> = {}, ttlSeconds: number = 86400): Promise<UserSession> {
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

  await setCache(`session:${sessionId}`, session, ttlSeconds);
  inMemorySessions.set(sessionId, session);
  return session;
}

export async function getSession(sessionId: string): Promise<UserSession | null> {
  const session = await getCache<UserSession>(`session:${sessionId}`);
  if (session) return session;
  return inMemorySessions.get(sessionId) || null;
}

export async function destroySession(sessionId: string): Promise<void> {
  await deleteCache(`session:${sessionId}`);
  inMemorySessions.delete(sessionId);
}

// --- Background Job Queues ---

export async function enqueueJob(queueName: string, payload: Record<string, any>): Promise<BackgroundJob> {
  const job: BackgroundJob = {
    id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    queueName,
    payload,
    createdAt: new Date().toISOString(),
  };

  const redis = getRedisClient();
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

export async function dequeueJob(queueName: string): Promise<BackgroundJob | null> {
  const redis = getRedisClient();
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

export async function processJobQueue(queueName: string, handler: (job: BackgroundJob) => Promise<void>): Promise<number> {
  let processedCount = 0;
  let job = await dequeueJob(queueName);
  while (job) {
    try {
      await handler(job);
      processedCount++;
    } catch (err: any) {
      logger.error(`[Redis Queue] Job '${job.id}' in '${queueName}' processing failed`, err);
    }
    job = await dequeueJob(queueName);
  }
  return processedCount;
}
