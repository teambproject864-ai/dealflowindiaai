// lib/community-mining/ingestion.ts

import crypto from "crypto";
import { db } from "@/lib/firebase-admin";
import type {
  CMRawItem,
  CMSourceType,
  CMIngestionLog,
  PlanTier,
} from "@/types/community-mining";

/**
 * Computes deterministic SHA-256 fingerprint for deduplication.
 */
export function computeDedupHash(sourceId: string, externalId: string, rawText: string): string {
  const normalized = `${sourceId}::${externalId}::${rawText.trim().toLowerCase()}`;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export interface IngestItemPayload {
  sourceId: string;
  sourceType: CMSourceType;
  externalId?: string;
  rawText: string;
  author?: {
    name?: string;
    email?: string;
    handle?: string;
    company?: string;
  };
  segment?: string;
  planTier?: PlanTier;
  metadata?: Record<string, any>;
  createdAt?: string;
}

export interface IngestionResult {
  success: boolean;
  received: number;
  ingested: number;
  deduped: number;
  items: CMRawItem[];
  logId?: string;
  error?: string;
}

/**
 * Ingests a batch of raw items with deduplication and logging.
 */
export async function ingestRawItems(
  items: IngestItemPayload[],
  overrideSourceId?: string
): Promise<IngestionResult> {
  if (!items || items.length === 0) {
    return { success: true, received: 0, ingested: 0, deduped: 0, items: [] };
  }

  const now = new Date().toISOString();
  const validItems: CMRawItem[] = [];
  let dedupedCount = 0;

  // In-memory fallback if Firestore is disabled or unavailable in test
  const existingHashes = new Set<string>();

  for (const item of items) {
    const rawText = (item.rawText || "").trim();
    if (!rawText) continue;

    const sourceId = overrideSourceId || item.sourceId || "default_source";
    const sourceType: CMSourceType = item.sourceType || "community";
    const externalId = item.externalId || `ext_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const dedupHash = computeDedupHash(sourceId, externalId, rawText);

    // Dedup check in current batch
    if (existingHashes.has(dedupHash)) {
      dedupedCount++;
      continue;
    }

    // Dedup check in Firestore
    if (db) {
      try {
        const snap = await db
          .collection("cm_raw_items")
          .where("dedupHash", "==", dedupHash)
          .limit(1)
          .get();

        if (!snap.empty) {
          dedupedCount++;
          continue;
        }
      } catch (err) {
        console.warn("[CommunityMining:Ingest] Firestore dedup lookup error, proceeding with item:", err);
      }
    }

    existingHashes.add(dedupHash);

    const rawItem: CMRawItem = {
      id: `raw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sourceId,
      sourceType,
      externalId,
      dedupHash,
      rawText,
      author: item.author || {},
      segment: item.segment || "general",
      planTier: item.planTier || "growth",
      metadata: item.metadata || {},
      processed: false,
      createdAt: item.createdAt || now,
      ingestedAt: now,
    };

    validItems.push(rawItem);
  }

  // Write items to Firestore
  if (db && validItems.length > 0) {
    try {
      const batch = db.batch();
      for (const item of validItems) {
        const docRef = db.collection("cm_raw_items").doc(item.id);
        batch.set(docRef, item);
      }
      await batch.commit();

      // Update source statistics
      const sourceMap = new Map<string, number>();
      for (const it of validItems) {
        sourceMap.set(it.sourceId, (sourceMap.get(it.sourceId) || 0) + 1);
      }

      for (const [sId, count] of sourceMap.entries()) {
        const sRef = db.collection("cm_sources").doc(sId);
        const sSnap = await sRef.get();
        if (sSnap.exists) {
          const currentCount = sSnap.data()?.itemCount || 0;
          await sRef.update({
            itemCount: currentCount + count,
            lastSyncedAt: now,
            updatedAt: now,
          });
        }
      }
    } catch (dbErr: any) {
      console.error("[CommunityMining:Ingest] Firestore batch write error:", dbErr?.message || dbErr);
    }
  }

  // Write Ingestion Log
  const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const logEntry: CMIngestionLog = {
    id: logId,
    sourceId: items[0]?.sourceId || "multi_source",
    sourceType: items[0]?.sourceType || "community",
    itemsReceived: items.length,
    itemsIngested: validItems.length,
    itemsDeduped: dedupedCount,
    status: validItems.length > 0 ? "success" : (dedupedCount > 0 ? "success" : "failed"),
    timestamp: now,
  };

  if (db) {
    try {
      await db.collection("cm_ingestion_logs").doc(logId).set(logEntry);
    } catch (logErr) {
      // Non-blocking log error
    }
  }

  return {
    success: true,
    received: items.length,
    ingested: validItems.length,
    deduped: dedupedCount,
    items: validItems,
    logId,
  };
}

/**
 * Ingests a call transcript directly from the live call bot pipeline.
 */
export async function ingestCallTranscript(args: {
  callId: string;
  transcriptText: string;
  contactName?: string;
  companyName?: string;
  contactEmail?: string;
  planTier?: PlanTier;
}): Promise<IngestionResult> {
  const item: IngestItemPayload = {
    sourceId: "call_transcript",
    sourceType: "call_transcript",
    externalId: `call_${args.callId}`,
    rawText: args.transcriptText,
    author: {
      name: args.contactName || "Prospect",
      company: args.companyName || "Prospect Company",
      email: args.contactEmail || "",
    },
    planTier: args.planTier || "growth",
    metadata: {
      callId: args.callId,
      source: "live_call_bot",
    },
    createdAt: new Date().toISOString(),
  };

  return ingestRawItems([item]);
}

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

/**
 * Parses raw CSV feedback text into structured IngestItemPayload array.
 */
export function parseCSVFeedback(csvContent: string, defaultSourceId = "csv_upload"): IngestItemPayload[] {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  // Parse header
  const headerLine = lines[0];
  const headers = parseCsvLine(headerLine).map((h) => h.toLowerCase().replace(/['"]+/g, ""));

  const textIdx = headers.findIndex((h) => h.includes("feedback") || h.includes("text") || h.includes("comment") || h.includes("content") || h.includes("message"));
  const authorIdx = headers.findIndex((h) => h.includes("author") || h.includes("user") || h.includes("name") || h.includes("customer"));
  const emailIdx = headers.findIndex((h) => h.includes("email"));
  const tierIdx = headers.findIndex((h) => h.includes("tier") || h.includes("plan") || h.includes("segment"));
  const dateIdx = headers.findIndex((h) => h.includes("date") || h.includes("created") || h.includes("time"));
  const extIdIdx = headers.findIndex((h) => h.includes("id") || h.includes("ticket") || h.includes("external"));

  const actualTextIdx = textIdx !== -1 ? textIdx : 0;
  const items: IngestItemPayload[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const cleanedValues = parseCsvLine(rawLine);

    const text = cleanedValues[actualTextIdx];
    if (!text || text.length < 3) continue;

    const authorName = authorIdx !== -1 ? cleanedValues[authorIdx] : undefined;
    const authorEmail = emailIdx !== -1 ? cleanedValues[emailIdx] : undefined;
    const planTier = (tierIdx !== -1 ? (cleanedValues[tierIdx]?.toLowerCase() as PlanTier) : "growth") || "growth";
    const externalId = extIdIdx !== -1 ? cleanedValues[extIdIdx] : `csv_${Date.now()}_${i}`;
    const createdAt = dateIdx !== -1 ? cleanedValues[dateIdx] : new Date().toISOString();

    items.push({
      sourceId: defaultSourceId,
      sourceType: "community",
      externalId,
      rawText: text,
      author: {
        name: authorName,
        email: authorEmail,
      },
      planTier,
      createdAt,
    });
  }

  return items;
}

/**
 * Parses raw JSON feedback content into structured IngestItemPayload array.
 */
export function parseJSONFeedback(jsonContent: string, defaultSourceId = "json_upload"): IngestItemPayload[] {
  try {
    const parsed = typeof jsonContent === "string" ? JSON.parse(jsonContent) : jsonContent;
    const arrayData = Array.isArray(parsed) ? parsed : (parsed.items || parsed.feedback || parsed.data || [parsed]);

    return arrayData.map((item: any, idx: number) => {
      const rawText = item.rawText || item.text || item.feedback || item.content || item.comment || item.message || JSON.stringify(item);
      const externalId = item.id || item.externalId || item.ticketId || `json_${Date.now()}_${idx}`;
      const sourceType: CMSourceType = item.sourceType || item.type || "support";

      return {
        sourceId: item.sourceId || defaultSourceId,
        sourceType,
        externalId: String(externalId),
        rawText: String(rawText),
        author: {
          name: item.author?.name || item.author || item.userName || item.name,
          email: item.author?.email || item.email,
          company: item.author?.company || item.company,
        },
        segment: item.segment || "general",
        planTier: (item.planTier || item.tier || "growth") as PlanTier,
        metadata: item.metadata || {},
        createdAt: item.createdAt || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error("[CommunityMining:ParseJSON] Error parsing JSON feedback:", err);
    return [];
  }
}
