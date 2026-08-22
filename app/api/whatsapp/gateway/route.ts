// app/api/whatsapp/gateway/route.ts
import { NextResponse } from "next/server";
import { sendUnifiedWhatsAppMessage } from "@/lib/whatsapp/whatsapp-router";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      toPhone, 
      content, 
      senderRole = "customer", 
      senderId, 
      senderName, 
      mediaUrl, 
      mediaType, 
      triggerType,
      preferredGateway = "auto"
    } = body;

    if (!toPhone || !content) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: toPhone and content" },
        { status: 400 }
      );
    }

    const result = await sendUnifiedWhatsAppMessage({
      toPhone,
      content,
      senderRole,
      senderId,
      senderName,
      mediaUrl,
      mediaType,
      triggerType,
      preferredGateway,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, gatewayUsed: result.gatewayUsed },
        { status: 429 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gateway dispatch error" },
      { status: 500 }
    );
  }
}
