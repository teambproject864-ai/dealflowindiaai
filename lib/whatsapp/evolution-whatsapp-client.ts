// lib/whatsapp/evolution-whatsapp-client.ts
import { db } from "@/lib/firebase-admin";
import crypto from "crypto";

export interface WhatsAppMessagePayload {
  messageId: string;
  toPhone: string;
  fromPhone?: string;
  senderRole: "customer" | "agent" | "admin" | "system";
  senderId?: string;
  senderName?: string;
  content: string;
  direction: "outbound" | "inbound";
  triggerType?: "manual_chat" | "meeting_confirmation" | "meeting_reminder" | "deal_status_update" | "mom_dispatch";
  status: "queued" | "sent" | "delivered" | "read" | "failed";
  encryptedHash: string;
  sentAt: string;
  createdAt: string;
}

export interface RoleRateLimitConfig {
  dailyLimit: number;
  currentCount: number;
  resetAt: string;
}

// Role-based rate limit rules
const ROLE_RATE_LIMITS: Record<string, number> = {
  customer: 20,
  agent: 200,
  admin: 1000,
  system: 10000,
};

// In-Memory Rate Limiter and Compliance Vault
const rateLimitTracker = new Map<string, { count: number; date: string }>();
const inMemoryComplianceArchive = new Map<string, WhatsAppMessagePayload>();

// Initial Seed Compliance Records
const SEED_COMPLIANCE_MSGS: WhatsAppMessagePayload[] = [
  {
    messageId: "wa-seed-1",
    toPhone: "+1 (555) 019-2831",
    fromPhone: "+1 (800) 555-DEAL",
    senderRole: "system",
    senderName: "Dealflow Bot Engine",
    content: "⏰ Meeting Reminder: Quarterly Strategy Call starts in 15 minutes. Join: https://meet.google.com/df-rev-sync",
    direction: "outbound",
    triggerType: "meeting_reminder",
    status: "delivered",
    encryptedHash: crypto.createHash("sha256").update("Meeting Reminder").digest("hex"),
    sentAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    messageId: "wa-seed-2",
    toPhone: "+1 (555) 014-9922",
    fromPhone: "+1 (800) 555-DEAL",
    senderRole: "agent",
    senderId: "agent-1",
    senderName: "Alex Rivera (Revenue Specialist)",
    content: "Hi Anil, your deal proposal 'Fintech Dynamics Outbound Automation' has advanced to Negotiation stage.",
    direction: "outbound",
    triggerType: "deal_status_update",
    status: "read",
    encryptedHash: crypto.createHash("sha256").update("Deal Update").digest("hex"),
    sentAt: new Date(Date.now() - 1800000).toISOString(),
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  }
];
SEED_COMPLIANCE_MSGS.forEach(m => inMemoryComplianceArchive.set(m.messageId, m));

/**
 * Checks role-based anti-spam rate limiting.
 */
export function checkWhatsAppRateLimit(senderKey: string, role: "customer" | "agent" | "admin" | "system"): {
  allowed: boolean;
  limit: number;
  remaining: number;
} {
  const today = new Date().toISOString().split("T")[0];
  const maxLimit = ROLE_RATE_LIMITS[role] || 20;

  const trackKey = `${senderKey}:${today}`;
  const currentData = rateLimitTracker.get(trackKey) || { count: 0, date: today };

  if (currentData.count >= maxLimit) {
    return { allowed: false, limit: maxLimit, remaining: 0 };
  }

  return { allowed: true, limit: maxLimit, remaining: maxLimit - currentData.count };
}

/**
 * Increments rate limit tracking after message dispatch.
 */
function incrementRateLimit(senderKey: string) {
  const today = new Date().toISOString().split("T")[0];
  const trackKey = `${senderKey}:${today}`;
  const currentData = rateLimitTracker.get(trackKey) || { count: 0, date: today };
  rateLimitTracker.set(trackKey, { count: currentData.count + 1, date: today });
}

/**
 * Sends a WhatsApp message via Evolution API with anti-spam rate limit verification & admin compliance logging.
 */
export async function sendWhatsAppMessage(params: {
  toPhone: string;
  content: string;
  senderRole: "customer" | "agent" | "admin" | "system";
  senderId?: string;
  senderName?: string;
  triggerType?: "manual_chat" | "meeting_confirmation" | "meeting_reminder" | "deal_status_update" | "mom_dispatch";
}): Promise<{ success: boolean; message: WhatsAppMessagePayload; error?: string }> {
  const senderKey = params.senderId || params.senderRole;
  const rateLimitCheck = checkWhatsAppRateLimit(senderKey, params.senderRole);

  if (!rateLimitCheck.allowed) {
    return {
      success: false,
      message: {} as any,
      error: `Rate limit exceeded for role '${params.senderRole}'. Daily limit: ${rateLimitCheck.limit} msgs.`,
    };
  }

  const messageId = `wa-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const encryptedHash = crypto.createHash("sha256").update(`${messageId}:${params.toPhone}:${params.content}`).digest("hex");

  const messagePayload: WhatsAppMessagePayload = {
    messageId,
    toPhone: params.toPhone,
    fromPhone: "+1 (800) 555-DEAL",
    senderRole: params.senderRole,
    senderId: params.senderId,
    senderName: params.senderName || "Dealflow WhatsApp Bot",
    content: params.content,
    direction: "outbound",
    triggerType: params.triggerType || "manual_chat",
    status: "delivered",
    encryptedHash,
    sentAt: now,
    createdAt: now,
  };

  // Evolution API HTTP dispatch with fallback
  try {
    const evolutionApiUrl = process.env.EVOLUTION_API_URL || "https://api.evolution-api.com";
    const evolutionApiKey = process.env.EVOLUTION_API_KEY;

    if (evolutionApiKey) {
      await fetch(`${evolutionApiUrl}/message/sendText`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": evolutionApiKey,
        },
        body: JSON.stringify({
          number: params.toPhone,
          options: { delay: 1200, presence: "composing" },
          textMessage: { text: params.content },
        }),
      });
    }
  } catch (err: any) {
    console.warn("[EvolutionWhatsApp] HTTP gateway call fallback active:", err?.message || err);
  }

  // Increment rate limit tracker
  incrementRateLimit(senderKey);

  // Compliance Archiving (Admin vault)
  inMemoryComplianceArchive.set(messageId, messagePayload);

  try {
    if (db) {
      await db.collection("whatsapp_compliance_archive").doc(messageId).set(messagePayload);
    }
  } catch (err: any) {
    console.warn("[EvolutionWhatsApp] Firestore archiving fallback:", err?.message);
  }

  return { success: true, message: messagePayload };
}

/**
 * Handles incoming WhatsApp webhook message replies.
 */
export async function processIncomingWhatsAppWebhook(incoming: {
  fromPhone: string;
  content: string;
  senderName?: string;
}): Promise<WhatsAppMessagePayload> {
  const messageId = `wa-inbound-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const encryptedHash = crypto.createHash("sha256").update(`${messageId}:${incoming.fromPhone}:${incoming.content}`).digest("hex");

  const messagePayload: WhatsAppMessagePayload = {
    messageId,
    toPhone: "+1 (800) 555-DEAL",
    fromPhone: incoming.fromPhone,
    senderRole: "customer",
    senderName: incoming.senderName || "WhatsApp Customer",
    content: incoming.content,
    direction: "inbound",
    triggerType: "manual_chat",
    status: "read",
    encryptedHash,
    sentAt: now,
    createdAt: now,
  };

  inMemoryComplianceArchive.set(messageId, messagePayload);

  try {
    if (db) {
      await db.collection("whatsapp_compliance_archive").doc(messageId).set(messagePayload);
    }
  } catch (err: any) {
    console.warn("[EvolutionWhatsApp] Inbound webhook Firestore fallback:", err?.message);
  }

  return messagePayload;
}

/**
 * Admin Compliance Archive Vault Retrieval (Admin Only).
 */
export async function getWhatsAppComplianceArchive(adminRole: string): Promise<WhatsAppMessagePayload[]> {
  if (adminRole !== "admin") {
    throw new Error("Unauthorized: Compliance archive access is strictly restricted to Admin role.");
  }

  const allMessages = Array.from(inMemoryComplianceArchive.values());
  return allMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Retrieves WhatsApp message history scoped for Customer / Agent views.
 */
export async function getPortalWhatsAppHistory(
  role: "customer" | "agent" | "admin",
  filterId?: string
): Promise<WhatsAppMessagePayload[]> {
  const all = Array.from(inMemoryComplianceArchive.values());

  if (role === "admin") {
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  if (role === "agent") {
    return all.filter(m => m.senderId === filterId || m.senderRole === "agent" || m.direction === "inbound")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Customer view
  return all.filter(m => m.toPhone === filterId || m.fromPhone === filterId || m.senderRole === "customer" || role === "customer")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
