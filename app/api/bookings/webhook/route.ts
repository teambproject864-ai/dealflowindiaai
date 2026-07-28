import { NextResponse } from "next/server";
import { initiateVoiceCall } from "@/lib/voice-confirmation";
import { z } from "zod";
import crypto from "crypto";

const webhookSchema = z.object({
  callId: z.string().min(1),
  event: z.literal("booking_confirmed"),
  timestamp: z.number().optional(),
});

export async function POST(req: Request) {
  try {
    const rawBodyText = await req.clone().text();
    const body = await req.json().catch(() => ({}));
    const validated = webhookSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook payload", details: validated.error.format() },
        { status: 400 }
      );
    }

    // Replay attack prevention (±5 minute tolerance)
    if (body.timestamp) {
      const now = Date.now();
      const diffMs = Math.abs(now - body.timestamp);
      if (diffMs > 5 * 60 * 1000) {
        return NextResponse.json(
          { success: false, error: "Webhook timestamp expired (replay attack guard)" },
          { status: 400 }
        );
      }
    }

    // HMAC Signature Validation if secret configured
    const webhookSecret = process.env.BOOKING_WEBHOOK_SECRET || process.env.CALENDLY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signatureHeader = req.headers.get("x-signature") || req.headers.get("x-calendly-signature") || "";
      const expectedSig = crypto.createHmac("sha256", webhookSecret).update(rawBodyText).digest("hex");
      if (!signatureHeader || signatureHeader !== expectedSig) {
        return NextResponse.json(
          { success: false, error: "Invalid HMAC signature" },
          { status: 401 }
        );
      }
    }

    const { callId } = validated.data;

    // Fire and forget call initiation in the background so we return immediately
    void (async () => {
      try {
        await initiateVoiceCall(callId, 1);
      } catch (err: any) {
        console.error(`[BookingsWebhook] Background voice confirmation failed for call ${callId}:`, err.message);
      }
    })();

    return NextResponse.json({
      success: true,
      message: "Voice call confirmation triggered successfully",
      callId,
    });
  } catch (error: any) {
    console.error("[BookingsWebhook] Webhook endpoint error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process webhook trigger", message: error.message },
      { status: 500 }
    );
  }
}
