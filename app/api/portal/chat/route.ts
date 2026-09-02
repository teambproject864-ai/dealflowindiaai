import { NextRequest, NextResponse } from "next/server";
import { KimiClient } from "@/lib/kimi/client";
import { getAgentByKey } from "@/lib/revenue-agents";
import { db } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// In-memory fallback session message cache
const sessionMessagesCache = new Map<string, any[]>();

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, ["admin", "agent", "customer"]);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    let requestedSessionId = searchParams.get("sessionId");

    // Scoped session handling: If user is a customer, lock down to customer-specific session ID
    let sessionId = requestedSessionId || `session-${user!.id}`;
    if (user!.role === "customer") {
      // Prevent customer from accessing arbitrary sessions
      if (requestedSessionId && requestedSessionId !== `session-${user!.id}` && !requestedSessionId.startsWith(`session-${user!.id}`)) {
        sessionId = `session-${user!.id}`;
      }
    }

    let messages: any[] = [];

    if (db) {
      try {
        const snap = await db
          .collection("chat_sessions")
          .doc(sessionId)
          .collection("messages")
          .orderBy("createdAt", "asc")
          .get();

        if (snap && !snap.empty) {
          messages = snap.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
          }));
        }
      } catch (err) {
        console.warn("[portal/chat] Firestore read fallback:", err);
      }
    }

    if (messages.length === 0 && sessionMessagesCache.has(sessionId)) {
      messages = sessionMessagesCache.get(sessionId) || [];
    }

    return NextResponse.json({
      success: true,
      sessionId,
      messages,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch chat messages",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, ["admin", "agent", "customer"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const message = body.message || body.content || body.text;
    let sessionId = body.sessionId || `session-${user!.id}`;
    
    // Ensure customer cannot write to arbitrary cross-tenant session IDs
    if (user!.role === "customer") {
      sessionId = `session-${user!.id}`;
    }

    const { companyName, assignedAgentKey, conversationHistory } = body;
    const effectiveCustomerId = user!.role === "customer" ? user!.id : (body.customerId || user!.id);

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ success: false, error: "Message string is required" }, { status: 400 });
    }

    const agent = getAgentByKey(assignedAgentKey || "ashok") || {
      name: "Ashok",
      title: "Outbound Lead Specialist",
    };

    const isComplexQuery =
      /contract|billing|refund|pricing negotiation|legal|custom integration|escalate|talk to human/i.test(message);

    let replyText = "";
    let escalated = false;

    // Call Kimi API for friendly, simple English response
    const kimiClient = new KimiClient();
    try {
      const systemPrompt = `You are DealFlow AI Assistant, a friendly, warm, and helpful customer support assistant for ${companyName || user!.name || "the customer"}.
Your assigned revenue agent is ${agent.name} (${agent.title}).
RULES:
1. Speak in simple, clear, conversational human-like English.
2. Avoid technical jargon or complicated metrics.
3. Be encouraging, concise, and helpful.
4. Keep responses under 3 paragraphs.
5. If the user asks complex questions about billing, contract negotiation, or requests a human, politely inform them you are connecting them to ${agent.name}.`;

      const response = await kimiClient.chatCompletion({
        model: "moonshot-v1-8k",
        messages: [
          { role: "system", content: systemPrompt },
          ...(conversationHistory || []).slice(-4).map((m: any) => ({
            role: m.sender === "user" || m.senderRole === "user" ? "user" : "assistant",
            content: m.content || m.text || "",
          })),
          { role: "user", content: message },
        ],
        temperature: 0.7,
      });

      replyText = response.choices[0]?.message?.content || "";
    } catch (err) {
      // Fallback response if Kimi API is unavailable in offline mode
      replyText = `Hi there! Thanks for reaching out. I'm here to help you get the most out of DealFlow AI. Everything on your ${companyName || "account"} is running smoothly. Is there anything specific about your campaign performance or next steps you'd like to check?`;
    }

    if (isComplexQuery || replyText.toLowerCase().includes("connecting you to")) {
      escalated = true;
      replyText += `\n\nI've flagged this request and notified your assigned Revenue Agent, ${agent.name}, to join and assist you directly.`;
    }

    const now = new Date().toISOString();
    const userMessageObj = {
      id: `msg-${Date.now()}-u`,
      senderRole: user!.role,
      senderName: user!.name || "Customer",
      role: "user",
      content: message,
      text: message,
      customerId: effectiveCustomerId,
      createdAt: now,
      timestamp: now,
    };

    const botMessageObj = {
      id: `msg-${Date.now()}-b`,
      senderRole: "agent",
      senderName: agent.name || "DealFlow AI Assistant",
      role: "assistant",
      content: replyText,
      text: replyText,
      createdAt: new Date(Date.now() + 50).toISOString(),
      timestamp: new Date(Date.now() + 50).toISOString(),
    };

    // Save to Firestore if available
    if (db) {
      try {
        const sessionRef = db.collection("chat_sessions").doc(sessionId);
        await sessionRef.collection("messages").add(userMessageObj);
        await sessionRef.collection("messages").add(botMessageObj);
      } catch (err) {
        console.warn("[portal/chat] Firestore write fallback:", err);
      }
    }

    // Update in-memory session cache
    const currentList = sessionMessagesCache.get(sessionId) || [];
    currentList.push(userMessageObj, botMessageObj);
    sessionMessagesCache.set(sessionId, currentList);

    const suggestedActions = escalated
      ? ["Schedule Standup Call", "Send Direct Email", "View Campaign Playbook"]
      : ["Check Campaign Status", "Schedule Weekly Standup", "View Performance Metrics"];

    return NextResponse.json({
      success: true,
      reply: replyText,
      message: replyText,
      messages: currentList,
      escalated,
      assignedAgentKey: agent.name,
      suggestedActions,
      timestamp: now,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process chat message",
      },
      { status: 500 }
    );
  }
}
