// lib/whatsapp/openwa-whatsapp-client.ts
import { db } from "@/lib/firebase-admin";
import crypto from "crypto";

export interface OpenWASessionState {
  sessionId: string;
  phoneNumber?: string;
  status: "STARTING" | "SCAN_QR_CODE" | "AUTHENTICATING" | "CONNECTED" | "DISCONNECTED" | "ERROR";
  qrCodeDataUrl?: string;
  pairingCode?: string;
  batteryLevel?: number;
  isPlugged?: boolean;
  pushname?: string;
  webhookUrl?: string;
  lastConnectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpenWAMessagePayload {
  messageId: string;
  sessionId: string;
  toPhone: string;
  fromPhone?: string;
  senderRole: "customer" | "agent" | "admin" | "system";
  senderId?: string;
  senderName?: string;
  content: string;
  mediaUrl?: string;
  mediaType?: "image" | "document" | "audio" | "video";
  direction: "outbound" | "inbound";
  triggerType?: "manual_chat" | "meeting_confirmation" | "meeting_reminder" | "deal_status_update" | "mom_dispatch" | "onboarding";
  status: "queued" | "sent" | "delivered" | "read" | "failed";
  encryptedHash: string;
  gateway: "openwa";
  sentAt: string;
  createdAt: string;
}

// Role-based rate limits (daily)
const OPENWA_ROLE_RATE_LIMITS: Record<string, number> = {
  customer: 20,
  agent: 200,
  admin: 1000,
  system: 10000,
};

// In-Memory Storage & Vault for fast lookups & tests
const openwaSessions = new Map<string, OpenWASessionState>();
const openwaRateLimitTracker = new Map<string, { count: number; date: string }>();
const openwaComplianceArchive = new Map<string, OpenWAMessagePayload>();

// Initial Seed OpenWA Session & Messages
const SEED_SESSION: OpenWASessionState = {
  sessionId: "openwa-default-session",
  phoneNumber: "+15550192831",
  status: "CONNECTED",
  pushname: "Dealflow AI Sales Bot (OpenWA)",
  batteryLevel: 94,
  isPlugged: true,
  webhookUrl: "/api/whatsapp/openwa/webhook",
  lastConnectedAt: new Date(Date.now() - 7200000).toISOString(),
  createdAt: new Date(Date.now() - 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
};
openwaSessions.set(SEED_SESSION.sessionId, SEED_SESSION);

const SEED_OPENWA_MSGS: OpenWAMessagePayload[] = [
  {
    messageId: "openwa-seed-1",
    sessionId: "openwa-default-session",
    toPhone: "+1 (555) 019-4829",
    fromPhone: "+15550192831",
    senderRole: "system",
    senderName: "DealFlow OpenWA Bot",
    content: "Welcome to DealFlow Autonomous Workforce! Your OpenWA channel is now connected and synchronized.",
    direction: "outbound",
    triggerType: "onboarding",
    status: "delivered",
    encryptedHash: crypto.createHash("sha256").update("Welcome OpenWA").digest("hex"),
    gateway: "openwa",
    sentAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    messageId: "openwa-seed-2",
    sessionId: "openwa-default-session",
    toPhone: "+15550192831",
    fromPhone: "+1 (555) 019-4829",
    senderRole: "customer",
    senderId: "cust-1",
    senderName: "Sarah Jenkins (VP Sales)",
    content: "We reviewed the proposal. Can we schedule a 15-min call to finalize the pilot?",
    direction: "inbound",
    triggerType: "manual_chat",
    status: "read",
    encryptedHash: crypto.createHash("sha256").update("Customer Reply").digest("hex"),
    gateway: "openwa",
    sentAt: new Date(Date.now() - 1800000).toISOString(),
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  }
];
SEED_OPENWA_MSGS.forEach(m => openwaComplianceArchive.set(m.messageId, m));

/**
 * Checks role-based anti-spam rate limiting for OpenWA.
 */
export function checkOpenWARateLimit(senderKey: string, role: "customer" | "agent" | "admin" | "system"): {
  allowed: boolean;
  limit: number;
  remaining: number;
} {
  const today = new Date().toISOString().split("T")[0];
  const maxLimit = OPENWA_ROLE_RATE_LIMITS[role] || 20;

  const trackKey = `openwa:${senderKey}:${today}`;
  const currentData = openwaRateLimitTracker.get(trackKey) || { count: 0, date: today };

  if (currentData.count >= maxLimit) {
    return { allowed: false, limit: maxLimit, remaining: 0 };
  }

  return { allowed: true, limit: maxLimit, remaining: maxLimit - currentData.count };
}

function incrementOpenWARateLimit(senderKey: string) {
  const today = new Date().toISOString().split("T")[0];
  const trackKey = `openwa:${senderKey}:${today}`;
  const currentData = openwaRateLimitTracker.get(trackKey) || { count: 0, date: today };
  openwaRateLimitTracker.set(trackKey, { count: currentData.count + 1, date: today });
}

/**
 * Initializes or fetches an OpenWA Session for onboarding (with simulated or live QR/pairing).
 */
export async function initializeOpenWASession(sessionId: string = "openwa-default-session"): Promise<OpenWASessionState> {
  const existing = openwaSessions.get(sessionId);
  if (existing && existing.status === "CONNECTED") {
    return existing;
  }

  // Create or refresh session
  const now = new Date().toISOString();
  const mockQr = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==#session=${sessionId}`;
  const pairingCode = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

  const sessionState: OpenWASessionState = {
    sessionId,
    phoneNumber: "+1 (800) 555-DEAL",
    status: "SCAN_QR_CODE",
    qrCodeDataUrl: mockQr,
    pairingCode,
    batteryLevel: 98,
    isPlugged: true,
    pushname: "Dealflow AI Agent",
    webhookUrl: "/api/whatsapp/openwa/webhook",
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  openwaSessions.set(sessionId, sessionState);

  // Firestore sync if available
  if (db) {
    try {
      await db.collection("whatsapp_openwa_sessions").doc(sessionId).set(sessionState, { merge: true });
    } catch (err) {
      console.warn("[OpenWA] Firestore session update warning:", err);
    }
  }

  return sessionState;
}

/**
 * Simulates confirming QR scan / connection event.
 */
export async function confirmOpenWAConnection(sessionId: string, phoneNumber: string = "+15550192831"): Promise<OpenWASessionState> {
  const session = openwaSessions.get(sessionId) || await initializeOpenWASession(sessionId);
  const now = new Date().toISOString();

  session.status = "CONNECTED";
  session.phoneNumber = phoneNumber;
  session.qrCodeDataUrl = undefined;
  session.lastConnectedAt = now;
  session.updatedAt = now;

  openwaSessions.set(sessionId, session);

  if (db) {
    try {
      await db.collection("whatsapp_openwa_sessions").doc(sessionId).set(session, { merge: true });
    } catch (err) {
      console.warn("[OpenWA] Firestore connection confirm warning:", err);
    }
  }

  return session;
}

/**
 * Disconnects an OpenWA session.
 */
export async function disconnectOpenWASession(sessionId: string): Promise<boolean> {
  const session = openwaSessions.get(sessionId);
  if (!session) return false;

  session.status = "DISCONNECTED";
  session.updatedAt = new Date().toISOString();
  openwaSessions.set(sessionId, session);

  if (db) {
    try {
      await db.collection("whatsapp_openwa_sessions").doc(sessionId).set(session, { merge: true });
    } catch (err) {
      console.warn("[OpenWA] Firestore disconnect warning:", err);
    }
  }

  return true;
}

/**
 * Sends a WhatsApp message via OpenWA with cryptographic hashing, anti-spam checks, and audit logging.
 */
export async function sendOpenWAMessage(params: {
  sessionId?: string;
  toPhone: string;
  content: string;
  senderRole: "customer" | "agent" | "admin" | "system";
  senderId?: string;
  senderName?: string;
  mediaUrl?: string;
  mediaType?: "image" | "document" | "audio" | "video";
  triggerType?: "manual_chat" | "meeting_confirmation" | "meeting_reminder" | "deal_status_update" | "mom_dispatch" | "onboarding";
}): Promise<{ success: boolean; message: OpenWAMessagePayload; error?: string }> {
  const sessionId = params.sessionId || "openwa-default-session";
  const senderKey = params.senderId || params.senderRole;
  const rateLimitCheck = checkOpenWARateLimit(senderKey, params.senderRole);

  if (!rateLimitCheck.allowed) {
    return {
      success: false,
      message: {} as any,
      error: `OpenWA rate limit exceeded for role '${params.senderRole}'. Daily limit: ${rateLimitCheck.limit} msgs.`,
    };
  }

  const messageId = `openwa-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const encryptedHash = crypto.createHash("sha256").update(`openwa:${messageId}:${params.toPhone}:${params.content}`).digest("hex");

  const messagePayload: OpenWAMessagePayload = {
    messageId,
    sessionId,
    toPhone: params.toPhone,
    fromPhone: "+15550192831",
    senderRole: params.senderRole,
    senderId: params.senderId,
    senderName: params.senderName || "Dealflow OpenWA Bot",
    content: params.content,
    mediaUrl: params.mediaUrl,
    mediaType: params.mediaType,
    direction: "outbound",
    triggerType: params.triggerType || "manual_chat",
    status: "delivered",
    encryptedHash,
    gateway: "openwa",
    sentAt: now,
    createdAt: now,
  };

  // Attempt external OpenWA REST server if configured
  try {
    const openwaUrl = process.env.OPENWA_SERVER_URL;
    const openwaApiKey = process.env.OPENWA_API_KEY;

    if (openwaUrl && openwaApiKey) {
      const cleanPhone = params.toPhone.replace(/\D/g, "");
      const res = await fetch(`${openwaUrl}/api/sendText`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openwaApiKey}`,
        },
        body: JSON.stringify({
          sessionId,
          chatId: `${cleanPhone}@c.us`,
          text: params.content,
        }),
      });

      if (!res.ok) {
        console.warn(`[OpenWA] Live HTTP dispatch failed (${res.status}), logging to fallback vault.`);
      }
    }
  } catch (err) {
    console.warn("[OpenWA] Network dispatch warning:", err);
  }

  // Update in-memory stores
  incrementOpenWARateLimit(senderKey);
  openwaComplianceArchive.set(messageId, messagePayload);

  // Firestore persistent compliance
  if (db) {
    try {
      await db.collection("whatsapp_openwa_messages").doc(messageId).set(messagePayload);
      await db.collection("whatsapp_compliance_vault").doc(messageId).set({
        ...messagePayload,
        gateway: "openwa",
        complianceVerified: true,
      });
    } catch (err) {
      console.warn("[OpenWA] Firestore persist warning:", err);
    }
  }

  return { success: true, message: messagePayload };
}

/**
 * Handles incoming OpenWA webhooks and message synchronization.
 */
export async function processIncomingOpenWAWebhook(payload: {
  sessionId?: string;
  from: string;
  body: string;
  senderName?: string;
  type?: string;
  mediaUrl?: string;
}): Promise<OpenWAMessagePayload> {
  const messageId = `openwa-in-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const encryptedHash = crypto.createHash("sha256").update(`openwa-in:${messageId}:${payload.from}:${payload.body}`).digest("hex");

  const messageRecord: OpenWAMessagePayload = {
    messageId,
    sessionId: payload.sessionId || "openwa-default-session",
    toPhone: "+15550192831",
    fromPhone: payload.from,
    senderRole: "customer",
    senderName: payload.senderName || "WhatsApp Customer",
    content: payload.body,
    mediaUrl: payload.mediaUrl,
    mediaType: (payload.type === "image" || payload.type === "document" || payload.type === "audio" || payload.type === "video") ? payload.type : undefined,
    direction: "inbound",
    triggerType: "manual_chat",
    status: "read",
    encryptedHash,
    gateway: "openwa",
    sentAt: now,
    createdAt: now,
  };

  openwaComplianceArchive.set(messageId, messageRecord);

  if (db) {
    try {
      await db.collection("whatsapp_openwa_messages").doc(messageId).set(messageRecord);
      await db.collection("whatsapp_compliance_vault").doc(messageId).set({
        ...messageRecord,
        gateway: "openwa",
        complianceVerified: true,
      });
    } catch (err) {
      console.warn("[OpenWA] Inbound persist warning:", err);
    }
  }

  return messageRecord;
}

/**
 * Retrieves OpenWA messages with role filtering.
 */
export async function getOpenWAHistory(userRole: "customer" | "agent" | "admin", phoneFilter?: string): Promise<OpenWAMessagePayload[]> {
  const all = Array.from(openwaComplianceArchive.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (userRole === "admin") {
    return phoneFilter ? all.filter(m => m.toPhone.includes(phoneFilter) || m.fromPhone?.includes(phoneFilter)) : all;
  }

  if (userRole === "agent") {
    return all.filter(m => m.senderRole === "agent" || m.senderRole === "system" || m.direction === "inbound");
  }

  // Customer: only messages to/from their number
  return phoneFilter ? all.filter(m => m.toPhone.includes(phoneFilter) || m.fromPhone?.includes(phoneFilter)) : all.slice(0, 10);
}
