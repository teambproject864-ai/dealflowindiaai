// app/api/whatsapp/openwa/send/route.ts
import { NextResponse } from "next/server";
import { sendOpenWAMessage } from "@/lib/whatsapp/openwa-whatsapp-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { toPhone, content, senderRole = "customer", senderId, senderName, mediaUrl, mediaType, triggerType } = body;

    if (!toPhone || !content) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: toPhone and content" },
        { status: 400 }
      );
    }

    const result = await sendOpenWAMessage({
      toPhone,
      content,
      senderRole,
      senderId,
      senderName,
      mediaUrl,
      mediaType,
      triggerType,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
