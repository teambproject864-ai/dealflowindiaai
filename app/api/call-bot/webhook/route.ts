// app/api/call-bot/webhook/route.ts

import { NextResponse } from "next/server";
import crypto from "crypto";
import { isCallBotEnabled } from "@/lib/call-bot/config";
import { handleTurn } from "@/lib/call-bot/voice-pipeline";

function safeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(req: Request) {
  if (!isCallBotEnabled()) {
    return NextResponse.json({ success: true, message: "Call bot is currently disabled via ENABLE_CALL_BOT." });
  }

  const secret = process.env.RECALL_WEBHOOK_SECRET?.trim();
  const bodyText = await req.text();

  if (secret) {
    let isValid = false;

    // 1. Recall.ai realtime_endpoints header authentication (Authorization or X-Webhook-Secret)
    const authHeader = req.headers.get("authorization");
    const secretHeader = req.headers.get("x-webhook-secret");

    if (secretHeader && safeCompare(secretHeader.trim(), secret)) {
      isValid = true;
    } else if (authHeader) {
      const cleanAuth = authHeader.trim();
      if (cleanAuth.startsWith("Bearer ") && safeCompare(cleanAuth.slice(7).trim(), secret)) {
        isValid = true;
      } else if (cleanAuth.startsWith("Token ") && safeCompare(cleanAuth.slice(6).trim(), secret)) {
        isValid = true;
      } else if (safeCompare(cleanAuth, secret)) {
        isValid = true;
      }
    }

    // 2. Check Svix headers (Recall.ai standard format)
    const webhookId = req.headers.get("webhook-id") || req.headers.get("svix-id");
    const webhookTimestamp = req.headers.get("webhook-timestamp") || req.headers.get("svix-timestamp");
    const webhookSignature = req.headers.get("webhook-signature") || req.headers.get("svix-signature");

    if (!isValid && webhookId && webhookTimestamp && webhookSignature) {
      // Svix signature verification: HMAC-SHA256 over "${webhookId}.${webhookTimestamp}.${bodyText}"
      const secretKey = secret.startsWith("whsec_")
        ? Buffer.from(secret.slice(6), "base64")
        : Buffer.from(secret, "utf-8");

      const toSign = `${webhookId}.${webhookTimestamp}.${bodyText}`;
      const expectedDigest = crypto.createHmac("sha256", secretKey).update(toSign).digest("base64");

      // webhook-signature can contain multiple space-separated signatures (e.g., "v1,abc... v1,def...")
      const signatures = webhookSignature.split(" ");
      isValid = signatures.some((sig) => {
        const parts = sig.split(",");
        if (parts.length === 2 && parts[0] === "v1") {
          return safeCompare(parts[1], expectedDigest);
        }
        return false;
      });
    }

    // 3. Check legacy headers
    const legacySignature = req.headers.get("x-recall-signature");
    if (!isValid && legacySignature) {
      // Legacy signature verification: hex HMAC over bodyText
      const hmac = crypto.createHmac("sha256", secret);
      const digest = hmac.update(bodyText).digest("hex");
      isValid = safeCompare(digest, legacySignature);
    }

    if (!isValid) {
      console.warn("[CallBot:Webhook] Webhook signature validation failed.");
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }
  } else {
    // If no secret is configured yet in environment, log warning but accept
    console.warn("[CallBot:Webhook] RECALL_WEBHOOK_SECRET is not set in environment variables. Allowing webhook in unverified mode.");
  }

  try {
    const payload = JSON.parse(bodyText);
    const { event, data } = payload;

    const botId = data?.bot_id || data?.botId || payload?.bot_id || "";
    const metadata = data?.metadata || payload?.metadata || {};
    const callId = metadata.callId || data?.callId || payload?.callId || botId;
    const callType = metadata.callType || data?.callType || "discovery";
    const intakeFormId = metadata.intakeFormId || data?.intakeFormId || "";

    console.log(`[CallBot:Webhook] Received event '${event}' for botId=${botId}, callId=${callId}`);

    // 1. Handle real-time transcript / audio data events & in-call chat events from Recall.ai
    if (event === "transcript.data" || event === "realtime_transcript" || event === "transcript" || event === "participant_events.chat_message") {
      const transcriptData = data?.transcript || data;
      const text = transcriptData?.text || transcriptData?.data?.text || transcriptData?.message || transcriptData?.words?.map((w: any) => w.text).join(" ") || "";
      const speaker = transcriptData?.speaker || transcriptData?.speaker_name || transcriptData?.participant?.name || "Prospect";

      // Ignore utterances spoken by the AI bot itself
      const lowerSpeaker = String(speaker || "").toLowerCase().trim();
      const isBotSelf =
        Boolean(transcriptData?.is_bot) ||
        Boolean(transcriptData?.is_self) ||
        lowerSpeaker.endsWith("(ai) | dealflow.ai") ||
        lowerSpeaker.includes("(ai)") ||
        lowerSpeaker === "dealflow ai live assistant" ||
        lowerSpeaker === "dealflow assistant";

      if (isBotSelf) {
        return NextResponse.json({ success: true, ignored: true, reason: "Self-speaker event ignored" });
      }

      if (text && text.trim()) {
        // Asynchronously process the turn in the voice pipeline
        handleTurn({
          callId,
          botId,
          transcriptChunk: text.trim(),
          callType,
          intakeFormId,
          speakerName: speaker
        }).catch((turnErr) => {
          console.error(`[CallBot:Webhook] Error processing turn for callId=${callId}:`, turnErr);
        });
      }

      return NextResponse.json({ success: true, event: "transcript_processed" });
    }

    // 2. Handle bot completion events (bot.done, bot.left_call, or status_change to done)
    const status = (data?.status?.code || data?.status || "").toLowerCase();
    if (event === "bot.done" || event === "bot.left_call" || status === "done" || status === "call_ended") {
      console.log(`[CallBot:Webhook] Call bot completed for callId=${callId}. Triggering post-call summary write-back...`);

      const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
      
      // Trigger post-call completion processing
      fetch(`${appUrl}/api/call-bot/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId, botId, callType, intakeFormId })
      }).catch((compErr) => {
        console.error(`[CallBot:Webhook] Error triggering complete endpoint for callId=${callId}:`, compErr);
      });

      return NextResponse.json({ success: true, event: "completion_triggered" });
    }

    return NextResponse.json({ success: true, event, status: "acknowledged" });

  } catch (error: any) {
    console.error("[CallBot:Webhook Error]:", error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal webhook handler error" },
      { status: 500 }
    );
  }
}
