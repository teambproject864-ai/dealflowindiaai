// app/api/whatsapp/webhook/route.ts
import { NextResponse } from "next/server";
import { processIncomingWhatsAppWebhook } from "@/lib/whatsapp/evolution-whatsapp-client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fromPhone = body.fromPhone || body.data?.key?.remoteJid || body.sender || "+15550192831";
    const content = body.content || body.data?.message?.conversation || body.text || "Hello from WhatsApp";

    const loggedMessage = await processIncomingWhatsAppWebhook({
      fromPhone,
      content,
      senderName: body.senderName || "WhatsApp Contact",
    });

    return NextResponse.json({
      success: true,
      receivedMessageId: loggedMessage.messageId,
      status: "Logged to Admin Compliance Archive Vault",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Webhook processing failed" }, { status: 500 });
  }
}
