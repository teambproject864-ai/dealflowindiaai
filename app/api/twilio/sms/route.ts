import { NextResponse } from "next/server";
import { TwilioService } from "@/lib/twilio-service";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;

    const body = await req.json().catch(() => ({}));
    const { to, message } = body;

    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters: 'to' and 'message'" },
        { status: 400 }
      );
    }

    const twilio = TwilioService.getInstance();
    const result = await twilio.sendSMS(to, message);

    return NextResponse.json({
      success: true,
      messageSid: result.sid,
      status: result.status,
    });
  } catch (error: any) {
    console.error("[TwilioSMSAPI] Outbound SMS failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send SMS" },
      { status: 500 }
    );
  }
}
