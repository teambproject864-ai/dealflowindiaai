import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./logger";

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

// In-Memory Storage for Development / Offline Test Fallback Mode
const mockUsers = new Map<string, SupabaseUser>();
const mockOrgs = new Map<string, SupabaseOrganization>();
const mockWorkflows = new Map<string, SupabaseWorkflow>();
const mockChatMessages: SupabaseChatMessage[] = [];
const mockVectorDocs: SupabaseVectorDoc[] = [];
const mockAgentStates = new Map<string, SupabaseAgentState>();

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      supabaseClient = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      logger.info("[Supabase] Initialized Supabase primary database client");
      return supabaseClient;
    } catch (err) {
      logger.warn("[Supabase] Failed to initialize Supabase client, using mock repository", { error: err });
    }
  }
  return null;
}

// --- Repositories ---

export const SupabaseUserRepo = {
  async upsertUser(user: Omit<SupabaseUser, "createdAt" | "updatedAt">): Promise<SupabaseUser> {
    const client = getSupabaseClient();
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
      logger.warn("[Supabase] Upsert user failed in DB, using fallback", { error });
    }

    mockUsers.set(user.id, fullUser);
    return fullUser;
  },

  async getUserByFirebaseUid(firebaseUid: string): Promise<SupabaseUser | null> {
    const client = getSupabaseClient();
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
  },
};

export const SupabaseWorkflowRepo = {
  async saveWorkflow(workflow: Omit<SupabaseWorkflow, "updatedAt">): Promise<SupabaseWorkflow> {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    const record: SupabaseWorkflow = { ...workflow, updatedAt: now };

    if (client) {
      const { data, error } = await client.from("workflows").upsert(record).select().single();
      if (!error && data) return data;
    }

    mockWorkflows.set(workflow.id, record);
    return record;
  },

  async getWorkflow(id: string): Promise<SupabaseWorkflow | null> {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from("workflows").select("*").eq("id", id).single();
      if (!error && data) return data;
    }
    return mockWorkflows.get(id) || null;
  },
};

export const SupabaseChatRepo = {
  async addChatMessage(msg: Omit<SupabaseChatMessage, "id" | "createdAt">): Promise<SupabaseChatMessage> {
    const client = getSupabaseClient();
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
  },

  async getThreadMessages(threadId: string): Promise<SupabaseChatMessage[]> {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from("chat_messages")
        .select("*")
        .eq("threadId", threadId)
        .order("createdAt", { ascending: true });
      if (!error && data) return data;
    }

    return mockChatMessages.filter((m) => m.threadId === threadId);
  },
};

export const SupabaseVectorRepo = {
  async insertVectorDoc(doc: Omit<SupabaseVectorDoc, "id">): Promise<SupabaseVectorDoc> {
    const client = getSupabaseClient();
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
  },

  async searchSimilarVectors(queryEmbedding: number[], topK: number = 5): Promise<SupabaseVectorDoc[]> {
    const client = getSupabaseClient();
    if (client) {
      // Call pgvector match_documents function in Supabase
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
  },
};

export const SupabaseAgentStateRepo = {
  async saveAgentState(state: Omit<SupabaseAgentState, "updatedAt">): Promise<SupabaseAgentState> {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    const record: SupabaseAgentState = { ...state, updatedAt: now };

    if (client) {
      const { data, error } = await client.from("agent_states").upsert(record).select().single();
      if (!error && data) return data;
    }

    mockAgentStates.set(`${state.agentKey}_${state.userId}`, record);
    return record;
  },

  async getAgentState(agentKey: string, userId: string): Promise<SupabaseAgentState | null> {
    const client = getSupabaseClient();
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
  },
};
