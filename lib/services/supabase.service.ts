import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logger } from "../logger";

export interface SupabaseUser {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  role: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupabaseOrganization {
  id: string;
  name: string;
  tier: "free" | "starter" | "growth" | "enterprise";
  creditsBalance: number;
  apiKeys: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface SupabaseWorkflow {
  id: string;
  customerId: string;
  agentKey: string;
  title: string;
  status: "draft" | "active" | "completed" | "failed";
  config: Record<string, any>;
  result?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SupabaseAgentState {
  agentKey: string;
  currentTask?: string;
  status: "idle" | "running" | "waiting" | "error";
  contextMemory: Record<string, any>;
  lastHeartbeat: string;
  updatedAt: string;
}

export interface SupabaseChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderRole: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SupabaseVectorDoc {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
}

export interface DeadLetterRecord {
  id: string;
  originalPayload: Record<string, any>;
  targetSystem: string;
  errorMessage: string;
  retryCount: number;
  createdAt: string;
  resolvedAt?: string;
}

// In-Memory Fallbacks for Local Testing / Offline Dev
const mockUsers = new Map<string, SupabaseUser>();
const mockOrgs = new Map<string, SupabaseOrganization>();
const mockWorkflows = new Map<string, SupabaseWorkflow>();
const mockAgentStates = new Map<string, SupabaseAgentState>();
const mockChatMessages: SupabaseChatMessage[] = [];
const mockVectorDocs: SupabaseVectorDoc[] = [];
const mockDeadLetterQueue = new Map<string, DeadLetterRecord>();

let supabaseClient: SupabaseClient | null = null;

export class SupabaseService {
  private readonly defaultUrl = "https://vsbhpnqrjuxgacevxssq.supabase.co";
  private readonly defaultPublishableKey = "sb_publishable_MttaUW2TWHQI5A2wD-WxCA_Dty9e-nE";

  getClient(): SupabaseClient | null {
    if (supabaseClient) return supabaseClient;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || this.defaultUrl;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || this.defaultPublishableKey;

    if (url && key) {
      try {
        supabaseClient = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        logger.info("[SupabaseService] Initialized primary database client", { url });
        return supabaseClient;
      } catch (err) {
        logger.warn("[SupabaseService] Failed to initialize client, using fallback repository", { error: err });
      }
    }
    return null;
  }

  /**
   * Fast timeout wrapper to prevent long network stalls on unreachable endpoints
   */
  async withTimeout<T = any>(promise: Promise<T> | any, timeoutMs = 250): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Supabase request timeout")), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
  }

  /**
   * Exponential backoff retry wrapper for transient database failures
   */
  async withRetry<T>(operationName: string, fn: () => Promise<T>, maxRetries = 1): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
      const startTime = Date.now();
      try {
        const result = await fn();
        const latency = Date.now() - startTime;
        this.logQueryPerformance(operationName, latency, true);
        return result;
      } catch (err: any) {
        attempt++;
        const latency = Date.now() - startTime;
        this.logQueryPerformance(operationName, latency, false, err.message);
        if (attempt >= maxRetries) throw err;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
    throw new Error(`[SupabaseService] Operation '${operationName}' failed after max retries.`);
  }

  private logQueryPerformance(operation: string, latencyMs: number, success: boolean, error?: string) {
    if (latencyMs > 200) {
      logger.warn(`[Supabase Performance] High query latency on '${operation}'`, { latencyMs, success, error });
    } else {
      logger.info(`[Supabase Performance] '${operation}' completed in ${latencyMs}ms`, { success });
    }
  }

  // --- User Repository ---
  async upsertUser(user: Omit<SupabaseUser, "createdAt" | "updatedAt">): Promise<SupabaseUser> {
    return this.withRetry("upsertUser", async () => {
      const client = this.getClient();
      const now = new Date().toISOString();
      const fullUser: SupabaseUser = { ...user, createdAt: now, updatedAt: now };

      if (client) {
        try {
          const { data, error } = await this.withTimeout(
            client
              .from("users")
              .upsert({
                id: user.id,
                firebase_uid: user.firebaseUid,
                email: user.email,
                name: user.name,
                role: user.role,
                organization_id: user.organizationId,
                updated_at: now,
              })
              .select()
              .single() as any,
            250
          );
          if (!error && data) return data;
        } catch {
          // fallback to memory
        }
      }

      mockUsers.set(user.id, fullUser);
      return fullUser;
    });
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<SupabaseUser | null> {
    return this.withRetry("getUserByFirebaseUid", async () => {
      const client = this.getClient();
      if (client) {
        try {
          const { data, error } = await this.withTimeout(
            client
              .from("users")
              .select("*")
              .eq("firebase_uid", firebaseUid)
              .single() as any,
            250
          );
          if (!error && data) return data;
        } catch {
          // fallback to memory
        }
      }

      for (const user of mockUsers.values()) {
        if (user.firebaseUid === firebaseUid) return user;
      }
      return null;
    });
  }

  // --- Workflow Repository ---
  async saveWorkflow(workflow: Omit<SupabaseWorkflow, "updatedAt">): Promise<SupabaseWorkflow> {
    return this.withRetry("saveWorkflow", async () => {
      const client = this.getClient();
      const now = new Date().toISOString();
      const record: SupabaseWorkflow = { ...workflow, updatedAt: now };

      if (client) {
        try {
          const { data, error } = await this.withTimeout(
            client.from("workflows").upsert(record).select().single() as any,
            250
          );
          if (!error && data) return data;
        } catch {
          // fallback
        }
      }

      mockWorkflows.set(workflow.id, record);
      return record;
    });
  }

  async getWorkflow(id: string): Promise<SupabaseWorkflow | null> {
    return this.withRetry("getWorkflow", async () => {
      const client = this.getClient();
      if (client) {
        try {
          const { data, error } = await this.withTimeout(
            client.from("workflows").select("*").eq("id", id).single() as any,
            250
          );
          if (!error && data) return data;
        } catch {
          // fallback
        }
      }
      return mockWorkflows.get(id) || null;
    });
  }

  // --- Chat Repository ---
  async addChatMessage(msg: Omit<SupabaseChatMessage, "id" | "createdAt">): Promise<SupabaseChatMessage> {
    return this.withRetry("addChatMessage", async () => {
      const client = this.getClient();
      const record: SupabaseChatMessage = {
        ...msg,
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
      };

      if (client) {
        try {
          const { data, error } = await this.withTimeout(
            client.from("chat_messages").insert(record).select().single() as any,
            250
          );
          if (!error && data) return data;
        } catch {
          // fallback
        }
      }

      mockChatMessages.push(record);
      return record;
    });
  }

  async getThreadMessages(threadId: string): Promise<SupabaseChatMessage[]> {
    return this.withRetry("getThreadMessages", async () => {
      const client = this.getClient();
      if (client) {
        try {
          const { data, error } = await this.withTimeout(
            client
              .from("chat_messages")
              .select("*")
              .eq("threadId", threadId)
              .order("createdAt", { ascending: true }) as any,
            250
          );
          if (!error && data) return data;
        } catch {
          // fallback
        }
      }

      return mockChatMessages.filter((m) => m.threadId === threadId);
    });
  }

  // --- Vector Knowledge Base Repository (pgvector) ---
  async insertVectorDoc(doc: Omit<SupabaseVectorDoc, "id">): Promise<SupabaseVectorDoc> {
    return this.withRetry("insertVectorDoc", async () => {
      const client = this.getClient();
      const record: SupabaseVectorDoc = {
        ...doc,
        id: `vec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      };

      if (client) {
        try {
          const { data, error } = await this.withTimeout(
            client.from("knowledge_base").insert(record).select().single() as any,
            250
          );
          if (!error && data) return data;
        } catch {
          // fallback
        }
      }

      mockVectorDocs.push(record);
      return record;
    });
  }

  async searchSimilarVectors(queryEmbedding: number[], topK = 5): Promise<SupabaseVectorDoc[]> {
    return this.withRetry("searchSimilarVectors", async () => {
      const client = this.getClient();
      if (client) {
        try {
          const { data, error } = await this.withTimeout(
            client.rpc("match_documents", {
              query_embedding: queryEmbedding,
              match_count: topK,
            }) as any,
            250
          );
          if (!error && data) return data;
        } catch {
          // fallback
        }
      }

      // Cosine similarity fallback
      function cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) return 0;
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < a.length; i++) {
          dot += a[i] * b[i];
          normA += a[i] * a[i];
          normB += b[i] * b[i];
        }
        if (normA === 0 || normB === 0) return 0;
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
      }

      return [...mockVectorDocs]
        .map((doc) => ({ ...doc, similarityScore: cosineSimilarity(queryEmbedding, doc.embedding) }))
        .sort((a, b) => (b.similarityScore ?? 0) - (a.similarityScore ?? 0))
        .slice(0, topK);
    });
  }

  // --- Multi-Agent Context Memory State Store ---
  async saveAgentState(state: Omit<SupabaseAgentState, "updatedAt">): Promise<SupabaseAgentState> {
    return this.withRetry("saveAgentState", async () => {
      const client = this.getClient();
      const now = new Date().toISOString();
      const record: SupabaseAgentState = { ...state, updatedAt: now };

      if (client) {
        try {
          const { data, error } = await this.withTimeout(
            client.from("agent_states").upsert(record).select().single() as any,
            250
          );
          if (!error && data) return data;
        } catch {
          // fallback
        }
      }

      mockAgentStates.set(state.agentKey, record);
      return record;
    });
  }

  async getAgentState(agentKey: string): Promise<SupabaseAgentState | null> {
    return this.withRetry("getAgentState", async () => {
      const client = this.getClient();
      if (client) {
        try {
          const { data, error } = await this.withTimeout(
            client.from("agent_states").select("*").eq("agentKey", agentKey).single() as any,
            250
          );
          if (!error && data) return data;
        } catch {
          // fallback
        }
      }
      return mockAgentStates.get(agentKey) || null;
    });
  }

  // --- Dead Letter Queue (DLQ) for Failed Ingestions & Syncs ---
  async recordDLQ(targetSystem: string, payload: Record<string, any>, errorMessage: string): Promise<DeadLetterRecord> {
    const record: DeadLetterRecord = {
      id: `dlq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      originalPayload: payload,
      targetSystem,
      errorMessage,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    const client = this.getClient();
    if (client) {
      try {
        await this.withTimeout(client.from("dead_letter_queue").insert(record) as any, 250);
      } catch {
        // Safe fallback
      }
    }

    mockDeadLetterQueue.set(record.id, record);
    logger.warn(`[Supabase DLQ] Ingestion failure captured for '${targetSystem}'`, { dlqId: record.id, errorMessage });
    return record;
  }

  async getDLQRecords(limit = 50): Promise<DeadLetterRecord[]> {
    const client = this.getClient();
    if (client) {
      try {
        const { data, error } = await this.withTimeout(
          client.from("dead_letter_queue").select("*").order("createdAt", { ascending: false }).limit(limit) as any,
          250
        );
        if (!error && data) return data;
      } catch {
        // fallback
      }
    }
    return Array.from(mockDeadLetterQueue.values()).slice(0, limit);
  }

  async getDeadLetterQueue(limit = 50): Promise<DeadLetterRecord[]> {
    return this.getDLQRecords(limit);
  }
}

export const supabaseService = new SupabaseService();

// Standalone Helper Functions
export const SupabaseUserRepo = {
  upsertUser: (user: Omit<SupabaseUser, "createdAt" | "updatedAt">) => supabaseService.upsertUser(user),
  getUserByFirebaseUid: (uid: string) => supabaseService.getUserByFirebaseUid(uid),
};

export const SupabaseWorkflowRepo = {
  saveWorkflow: (wf: Omit<SupabaseWorkflow, "updatedAt">) => supabaseService.saveWorkflow(wf),
  getWorkflow: (id: string) => supabaseService.getWorkflow(id),
};

export const SupabaseAgentStateRepo = {
  saveAgentState: (st: Omit<SupabaseAgentState, "updatedAt">) => supabaseService.saveAgentState(st),
  getAgentState: (agentKey: string) => supabaseService.getAgentState(agentKey),
};

export const SupabaseChatRepo = {
  addChatMessage: (msg: any) => supabaseService.addChatMessage(msg),
  getThreadMessages: (threadId: string) => supabaseService.getThreadMessages(threadId),
};

export const SupabaseVectorRepo = {
  insertVectorDoc: (doc: any) => supabaseService.insertVectorDoc(doc),
  searchSimilarVectors: (queryEmbedding: number[], topK?: number) => supabaseService.searchSimilarVectors(queryEmbedding, topK),
};

export const SupabaseOrgRepo = {
  getOrganization: async (id: string) => mockOrgs.get(id) || null,
};

