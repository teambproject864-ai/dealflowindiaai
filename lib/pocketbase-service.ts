import PocketBase from "pocketbase";
import { logger } from "./logger";
import { SupabaseWorkflowRepo, SupabaseChatRepo, SupabaseVectorRepo } from "./supabase-service";

export interface PocketBaseDraft {
  id: string;
  collectionName: string;
  payload: Record<string, any>;
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;
}

// In-memory fallback for local dev/testing when PocketBase server is offline
const mockDrafts = new Map<string, PocketBaseDraft>();

let pbClient: PocketBase | null = null;

export function getPocketBaseClient(): PocketBase | null {
  if (pbClient) return pbClient;

  const url = process.env.POCKETBASE_URL || "http://127.0.0.1:8090";
  try {
    pbClient = new PocketBase(url);
    // Disable auto cancellation for background ops
    pbClient.autoCancellation(false);
    return pbClient;
  } catch (err) {
    logger.warn("[PocketBase] Failed to initialize PocketBase client, using local draft fallback", { error: err });
    return null;
  }
}

/**
 * Save a temporary draft or transient artifact in PocketBase
 */
export async function saveDraft(collectionName: string, payload: Record<string, any>, draftId?: string): Promise<PocketBaseDraft> {
  const pb = getPocketBaseClient();
  const id = draftId || `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const record: PocketBaseDraft = {
    id,
    collectionName,
    payload,
    isSynced: false,
    createdAt: now,
    updatedAt: now,
  };

  if (pb) {
    try {
      const res = await pb.collection(collectionName).create({
        id,
        payload,
        isSynced: false,
      });
      if (res) return { ...record, id: res.id };
    } catch (err) {
      logger.warn(`[PocketBase] Could not save draft to PocketBase collection '${collectionName}', saving to local fallback`, { error: err });
    }
  }

  mockDrafts.set(`${collectionName}:${id}`, record);
  return record;
}

/**
 * Get a temporary draft by collection and ID
 */
export async function getDraft(collectionName: string, id: string): Promise<PocketBaseDraft | null> {
  const pb = getPocketBaseClient();
  if (pb) {
    try {
      const res = await pb.collection(collectionName).getOne(id);
      if (res) {
        return {
          id: res.id,
          collectionName,
          payload: res.payload || res,
          isSynced: !!res.isSynced,
          createdAt: res.created || new Date().toISOString(),
          updatedAt: res.updated || new Date().toISOString(),
        };
      }
    } catch {
      // Fallback
    }
  }

  return mockDrafts.get(`${collectionName}:${id}`) || null;
}

/**
 * Delete a transient draft after processing
 */
export async function deleteDraft(collectionName: string, id: string): Promise<boolean> {
  const pb = getPocketBaseClient();
  if (pb) {
    try {
      await pb.collection(collectionName).delete(id);
    } catch {
      // Fallback ignore
    }
  }
  return mockDrafts.delete(`${collectionName}:${id}`);
}

/**
 * List uncommitted drafts in a PocketBase collection
 */
export async function listUnsyncedDrafts(collectionName: string): Promise<PocketBaseDraft[]> {
  const pb = getPocketBaseClient();
  if (pb) {
    try {
      const records = await pb.collection(collectionName).getFullList({
        filter: "isSynced = false",
      });
      return records.map((r) => ({
        id: r.id,
        collectionName,
        payload: r.payload || r,
        isSynced: false,
        createdAt: r.created || new Date().toISOString(),
        updatedAt: r.updated || new Date().toISOString(),
      }));
    } catch {
      // Fallback
    }
  }

  const results: PocketBaseDraft[] = [];
  for (const [key, draft] of mockDrafts.entries()) {
    if (key.startsWith(`${collectionName}:`) && !draft.isSynced) {
      results.push(draft);
    }
  }
  return results;
}

/**
 * Synchronize required transient PocketBase data into Supabase (Primary Source of Truth)
 */
export async function syncPocketBaseToSupabase(collectionName: string, draftId: string, targetType: "workflow" | "chat" | "vector"): Promise<{ success: boolean; syncedRecordId?: string }> {
  const draft = await getDraft(collectionName, draftId);
  if (!draft) {
    throw new Error(`[PocketBase Sync] Draft '${draftId}' in '${collectionName}' not found.`);
  }

  try {
    let syncedRecordId: string | undefined;

    if (targetType === "workflow") {
      const saved = await SupabaseWorkflowRepo.saveWorkflow({
        id: draft.payload.id || draft.id,
        organizationId: draft.payload.organizationId || "org_default",
        title: draft.payload.title || "Synced Workflow Draft",
        definition: draft.payload.definition || {},
        status: "active",
        state: draft.payload.state || {},
      });
      syncedRecordId = saved.id;
    } else if (targetType === "chat") {
      const saved = await SupabaseChatRepo.addChatMessage({
        threadId: draft.payload.threadId || "thread_default",
        senderId: draft.payload.senderId || "user_default",
        role: draft.payload.role || "user",
        content: draft.payload.content || "",
        agentKey: draft.payload.agentKey,
      });
      syncedRecordId = saved.id;
    } else if (targetType === "vector") {
      const saved = await SupabaseVectorRepo.insertVectorDoc({
        title: draft.payload.title || "Synced Document",
        content: draft.payload.content || "",
        embedding: draft.payload.embedding || [0.1, 0.2, 0.3],
        metadata: draft.payload.metadata || {},
      });
      syncedRecordId = saved.id;
    }

    // Mark as synced in PocketBase
    draft.isSynced = true;
    mockDrafts.set(`${collectionName}:${draftId}`, draft);

    const pb = getPocketBaseClient();
    if (pb) {
      try {
        await pb.collection(collectionName).update(draftId, { isSynced: true });
      } catch {
        // Fallback mock already updated
      }
    }

    logger.info(`[PocketBase Sync] Draft '${draftId}' synced to Supabase successfully`, { targetType, syncedRecordId });
    return { success: true, syncedRecordId };
  } catch (err: any) {
    logger.error(`[PocketBase Sync] Failed to sync draft '${draftId}' to Supabase`, err);
    return { success: false };
  }
}
