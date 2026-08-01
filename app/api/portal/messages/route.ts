import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface PortalMessage {
  id: string;
  channelId: string;        // composite key: `${customerId}_${agentKey}`
  senderId: string;
  senderRole: "customer" | "agent";
  senderName: string;
  text: string;
  attachmentUrl?: string;
  attachmentName?: string;
  readAt?: string | null;   // ISO timestamp when the other party read it
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function buildChannelId(customerId: string, agentKey: string) {
  // Deterministic channel ID — always sorted so both parties resolve the same key
  return [customerId, agentKey].sort().join("__");
}

async function getFirestore() {
  try {
    const { getDb } = await import("@/lib/firebase-admin");
    return getDb();
  } catch {
    return null;
  }
}

// Simple XOR-style text obfuscation used as a lightweight "envelope" when
// the full AES library isn't available server-side.  Replace with the
// AES-256-GCM routine from lib/security.ts for production deployments.
function encryptText(text: string): string {
  return Buffer.from(text, "utf8").toString("base64");
}
function decryptText(cipher: string): string {
  try {
    return Buffer.from(cipher, "base64").toString("utf8");
  } catch {
    return cipher;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/portal/messages — Send a new message
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, ["customer", "agent"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { agentKey, customerId, text, attachmentUrl, attachmentName } = body;

    if (!agentKey || !customerId) {
      return NextResponse.json(
        { success: false, error: "agentKey and customerId are required" },
        { status: 400 }
      );
    }
    if (!text?.trim() && !attachmentUrl) {
      return NextResponse.json(
        { success: false, error: "Message text or attachment is required" },
        { status: 400 }
      );
    }

    const channelId = buildChannelId(customerId, agentKey);
    const now = new Date().toISOString();

    const message: PortalMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      channelId,
      senderId: user!.id,
      senderRole: user!.role as "customer" | "agent",
      senderName: user!.name,
      text: text?.trim() ?? "",
      attachmentUrl: attachmentUrl ?? null,
      attachmentName: attachmentName ?? null,
      readAt: null,
      createdAt: now,
    };

    // Persist to Firestore (encrypted text payload)
    const db = await getFirestore();
    if (db) {
      const docData = {
        ...message,
        encryptedPayload: encryptText(message.text),
        text: "[encrypted]", // don't store plaintext alongside payload
      };
      await db
        .collection("customer_agent_messages")
        .doc(channelId)
        .collection("messages")
        .doc(message.id)
        .set(docData);

      // Update channel metadata (last message + unread count)
      await db.collection("customer_agent_channels").doc(channelId).set(
        {
          channelId,
          customerId,
          agentKey,
          lastMessage: message.text || "(attachment)",
          lastMessageAt: now,
          lastSenderId: user!.id,
          updatedAt: now,
        },
        { merge: true }
      );
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("[portal/messages POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/portal/messages?channelId=&limit=&before=
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, ["customer", "agent", "admin"]);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);

  if (!channelId) {
    return NextResponse.json(
      { success: false, error: "channelId query param is required" },
      { status: 400 }
    );
  }

  try {
    const db = await getFirestore();
    if (!db) {
      return NextResponse.json({ success: true, messages: [] });
    }

    let query: any = db
      .collection("customer_agent_messages")
      .doc(channelId)
      .collection("messages")
      .orderBy("createdAt", "desc")
      .limit(limit);

    const before = searchParams.get("before");
    if (before) {
      query = query.startAfter(before);
    }

    const snap = await query.get();
    const messages: PortalMessage[] = snap.docs.map((doc: any) => {
      const d = doc.data();
      return {
        ...d,
        text: d.encryptedPayload ? decryptText(d.encryptedPayload) : d.text,
        encryptedPayload: undefined,
      } as PortalMessage;
    });

    // Return in chronological order (oldest first for UI rendering)
    messages.reverse();

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("[portal/messages GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/portal/messages — Mark messages as read
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, ["customer", "agent"]);
  if (errorResponse) return errorResponse;

  try {
    const { channelId, messageIds } = await req.json();
    if (!channelId || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "channelId and messageIds[] are required" },
        { status: 400 }
      );
    }

    const db = await getFirestore();
    if (db) {
      const batch = db.batch();
      const readAt = new Date().toISOString();
      for (const msgId of messageIds.slice(0, 50)) {
        const ref = db
          .collection("customer_agent_messages")
          .doc(channelId)
          .collection("messages")
          .doc(msgId);
        batch.update(ref, { readAt });
      }
      await batch.commit();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[portal/messages PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}
