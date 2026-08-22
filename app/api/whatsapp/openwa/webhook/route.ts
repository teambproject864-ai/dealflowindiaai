// app/api/whatsapp/openwa/webhook/route.ts
import { NextResponse } from "next/server";
import { processIncomingOpenWAWebhook } from "@/lib/whatsapp/openwa-whatsapp-client";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Support standard OpenWA webhook format
    const from = payload.from || payload.sender?.id || payload.chatId || "+15550199999";
    const body = payload.body || payload.content || payload.text || "";
    const senderName = payload.sender?.pushname || payload.sender?.formattedName || "WhatsApp Contact";
    const type = payload.type || "chat";
    const mediaUrl = payload.mediaUrl || payload.url;

    if (!body && !mediaUrl) {
      return NextResponse.json({ success: true, message: "Ignored empty payload" });
    }

    const messageRecord = await processIncomingOpenWAWebhook({
      sessionId: payload.sessionId,
      from,
      body,
      senderName,
      type,
      mediaUrl,
    });

    return NextResponse.json({
      success: true,
      messageId: messageRecord.messageId,
      status: "processed",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Webhook processing error" },
      { status: 500 }
    );
  }
}
