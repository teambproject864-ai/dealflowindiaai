import { NextResponse } from "next/server";
import { ChatMessage } from "@/types/webinar";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, message, slideIndex } = body;

    if (action === "ask_rag") {
      const userText = message || "";
      const botResponse: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: "AI Dealflow Bot Host",
        role: "bot",
        text: `[AI RAG Response]: Thank you for asking "${userText}". Based on our enterprise sales knowledge base, our autonomous dealflow agents integrate directly with your CRM (Salesforce / HubSpot) via REST APIs and Webhooks to sync lead scores in under 500ms.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sentiment: "positive",
      };

      return NextResponse.json({
        success: true,
        reply: botResponse,
        botStatus: "speaking",
      });
    }

    if (action === "escalate") {
      return NextResponse.json({
        success: true,
        humanEscalated: true,
        systemNotice: "Webinar host controls transferred to Human Co-Host. AI Bot switched to assistant mode.",
      });
    }

    if (action === "change_slide") {
      return NextResponse.json({
        success: true,
        currentSlideIndex: slideIndex,
        botStatus: "speaking",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
