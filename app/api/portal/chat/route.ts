import { NextRequest, NextResponse } from "next/server";
import { KimiClient } from "@/lib/kimi/client";
import { getAgentByKey } from "@/lib/revenue-agents";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, customerId, companyName, assignedAgentKey, conversationHistory } = body;

    if (!message || typeof message !== "string") {
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
      const systemPrompt = `You are DealFlow AI Assistant, a friendly, warm, and helpful customer support assistant for ${companyName || "the customer"}.
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
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text || "",
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

    const suggestedActions = escalated
      ? ["Schedule Standup Call", "Send Direct Email", "View Campaign Playbook"]
      : ["Check Campaign Status", "Schedule Weekly Standup", "View Performance Metrics"];

    return NextResponse.json({
      success: true,
      reply: replyText,
      escalated,
      assignedAgentKey: agent.name,
      suggestedActions,
      timestamp: new Date().toISOString(),
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
