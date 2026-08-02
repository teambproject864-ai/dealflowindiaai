import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logger } from "../logger";

// --- Schema Definitions for Supabase (Primary Source of Truth) ---
export interface SupabaseUser {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  role: "admin" | "agent" | "customer";
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupabaseOrganization {
  id: string;
  name: string;
  plan: "free" | "pro" | "enterprise";
  settings: Record<string, any>;
  createdAt: string;
}

export interface SupabaseWorkflow {
  id: string;
  organizationId: string;
  title: string;
  definition: Record<string, any>;
  status: "draft" | "active" | "completed" | "failed";
  state: Record<string, any>;
  updatedAt: string;
}

export interface SupabaseChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  role: "user" | "assistant" | "system";
  content: string;
  agentKey?: string;
  createdAt: string;
}

export interface SupabaseVectorDoc {
  id: string;
  title: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
  similarityScore?: number;
}

export interface SupabaseAgentState {
  id: string;
  agentKey: string;
  userId: string;
  contextMemory: Record<string, any>;
  stepLogs: Array<{ step: string; timestamp: string; status: string }>;
  updatedAt: string;
}

export interface DeadLetterRecord {
  id: string;
  collectionName: string;
  draftId: string;
  targetType: string;
  payload: Record<string, any>;
  errorMessage: string;
  retryCount: number;
  createdAt: string;
}

// In-Memory Storage for Fallback / Offline Testing Mode
const mockUsers = new Map<string, SupabaseUser>();
const mockOrgs = new Map<string, SupabaseOrganization>();
const mockWorkflows = new Map<string, SupabaseWorkflow>();
const mockChatMessages: SupabaseChatMessage[] = [];
const mockVectorDocs: SupabaseVectorDoc[] = [];
const mockAgentStates = new Map<string, SupabaseAgentState>();
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
   * Exponential backoff retry wrapper for transient database failures
   */
  async withRetry<T>(operationName: string, fn: () => Promise<T>, maxRetries = 3): Promise<T> {
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
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
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
        const { data, error } = await client
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
          .single();

        if (!error && data) return data;
      }

      mockUsers.set(user.id, fullUser);
      return fullUser;
    });
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<SupabaseUser | null> {
    return this.withRetry("getUserByFirebaseUid", async () => {
      const client = this.getClient();
      if (client) {
        const { data, error } = await client
          .from("users")
          .select("*")
          .eq("firebase_uid", firebaseUid)
          .single();
        if (!error && data) return data;
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
        const { data, error } = await client.from("workflows").upsert(record).select().single();
        if (!error && data) return data;
      }

      mockWorkflows.set(workflow.id, record);
      return record;
    });
  }

  async getWorkflow(id: string): Promise<SupabaseWorkflow | null> {
    return this.withRetry("getWorkflow", async () => {
      const client = this.getClient();
      if (client) {
        const { data, error } = await client.from("workflows").select("*").eq("id", id).single();
        if (!error && data) return data;
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
        const { data, error } = await client.from("chat_messages").insert(record).select().single();
        if (!error && data) return data;
      }

      mockChatMessages.push(record);
      return record;
    });
  }

  async getThreadMessages(threadId: string): Promise<SupabaseChatMessage[]> {
    return this.withRetry("getThreadMessages", async () => {
      const client = this.getClient();
      if (client) {
        const { data, error } = await client
          .from("chat_messages")
          .select("*")
          .eq("threadId", threadId)
          .order("createdAt", { ascending: true });
        if (!error && data) return data;
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
        const { data, error } = await client.from("knowledge_base").insert(record).select().single();
        if (!error && data) return data;
      }

      mockVectorDocs.push(record);
      return record;
    });
  }

  async searchSimilarVectors(queryEmbedding: number[], topK = 5): Promise<SupabaseVectorDoc[]> {
    return this.withRetry("searchSimilarVectors", async () => {
      const client = this.getClient();
      if (client) {
        const { data, error } = await client.rpc("match_documents", {
          query_embedding: queryEmbedding,
          match_count: topK,
        });
        if (!error && data) return data;
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
        return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
      }

      const scored = mockVectorDocs.map((doc) => ({
        ...doc,
        similarityScore: cosineSimilarity(queryEmbedding, doc.embedding),
      }));

      scored.sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0));
      return scored.slice(0, topK);
    });
  }

  // --- Agent State Repository ---
  async saveAgentState(state: Omit<SupabaseAgentState, "updatedAt">): Promise<SupabaseAgentState> {
    return this.withRetry("saveAgentState", async () => {
      const client = this.getClient();
      const now = new Date().toISOString();
      const record: SupabaseAgentState = { ...state, updatedAt: now };

      if (client) {
        const { data, error } = await client.from("agent_states").upsert(record).select().single();
        if (!error && data) return data;
      }

      mockAgentStates.set(`${state.agentKey}_${state.userId}`, record);
      return record;
    });
  }

  async getAgentState(agentKey: string, userId: string): Promise<SupabaseAgentState | null> {
    return this.withRetry("getAgentState", async () => {
      const client = this.getClient();
      if (client) {
        const { data, error } = await client
          .from("agent_states")
          .select("*")
          .eq("agentKey", agentKey)
          .eq("userId", userId)
          .single();
        if (!error && data) return data;
      }

      return mockAgentStates.get(`${agentKey}_${userId}`) || null;
    });
  }

  // --- Dead-Letter Queue (DLQ) for Failed PocketBase Sync Jobs ---
  async enqueueDeadLetter(record: Omit<DeadLetterRecord, "id" | "createdAt" | "retryCount">): Promise<DeadLetterRecord> {
    const id = `dlq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const dlqRecord: DeadLetterRecord = {
      ...record,
      id,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    const client = this.getClient();
    if (client) {
      try {
        await client.from("sync_dead_letter_queue").insert({
          id: dlqRecord.id,
          collection_name: dlqRecord.collectionName,
          draft_id: dlqRecord.draftId,
          target_type: dlqRecord.targetType,
          payload: dlqRecord.payload,
          error_message: dlqRecord.errorMessage,
          retry_count: dlqRecord.retryCount,
        });
      } catch (err) {
        logger.warn("[SupabaseService] Failed to insert DLQ to database", { error: err });
      }
    }

    mockDeadLetterQueue.set(id, dlqRecord);
    logger.error(`[Supabase DLQ] Enqueued failed sync job '${id}'`, { draftId: record.draftId });
    return dlqRecord;
  }

  async getDeadLetterQueue(): Promise<DeadLetterRecord[]> {
    const client = this.getClient();
    if (client) {
      try {
        const { data } = await client.from("sync_dead_letter_queue").select("*");
        if (data) return data;
      } catch {
        // Fallback
      }
    }
    return Array.from(mockDeadLetterQueue.values());
  }
}

export const supabaseService = new SupabaseService();

// Export convenience repository references matching previous interface contracts
export const SupabaseUserRepo = {
  upsertUser: (u: Omit<SupabaseUser, "createdAt" | "updatedAt">) => supabaseService.upsertUser(u),
  getUserByFirebaseUid: (uid: string) => supabaseService.getUserByFirebaseUid(uid),
};

export const SupabaseWorkflowRepo = {
  saveWorkflow: (w: Omit<SupabaseWorkflow, "updatedAt">) => supabaseService.saveWorkflow(w),
  getWorkflow: (id: string) => supabaseService.getWorkflow(id),
};

export const SupabaseChatRepo = {
  addChatMessage: (m: Omit<SupabaseChatMessage, "id" | "createdAt">) => supabaseService.addChatMessage(m),
  getThreadMessages: (threadId: string) => supabaseService.getThreadMessages(threadId),
};

export const SupabaseVectorRepo = {
  insertVectorDoc: (d: Omit<SupabaseVectorDoc, "id">) => supabaseService.insertVectorDoc(d),
  searchSimilarVectors: (q: number[], topK?: number) => supabaseService.searchSimilarVectors(q, topK),
};

export const SupabaseAgentStateRepo = {
  saveAgentState: (s: Omit<SupabaseAgentState, "updatedAt">) => supabaseService.saveAgentState(s),
  getAgentState: (agentKey: string, userId: string) => supabaseService.getAgentState(agentKey, userId),
};
