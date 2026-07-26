// app/api/whatsapp/send/route.ts
import { NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/evolution-whatsapp-client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { toPhone, content, senderRole, senderId, senderName, triggerType } = body;

    if (!toPhone || !content) {
      return NextResponse.json({ success: false, error: "toPhone and content are required parameters" }, { status: 400 });
    }

    const role = (senderRole || "agent") as "customer" | "agent" | "admin" | "system";
    const result = await sendWhatsAppMessage({
      toPhone,
      content,
      senderRole: role,
      senderId,
      senderName,
      triggerType: triggerType || "manual_chat",
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 429 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      statusMessage: "WhatsApp message sent successfully via Evolution API client.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to process WhatsApp message request" }, { status: 500 });
  }
}
