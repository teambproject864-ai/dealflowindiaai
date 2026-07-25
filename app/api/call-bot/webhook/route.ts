// app/api/call-bot/webhook/route.ts

import { NextResponse } from "next/server";
import { isCallBotEnabled } from "@/lib/call-bot/config";
import { handleTurn } from "@/lib/call-bot/voice-pipeline";

export async function POST(req: Request) {
  if (!isCallBotEnabled()) {
    return NextResponse.json({ success: true, message: "Call bot is currently disabled via ENABLE_CALL_BOT." });
  }

  try {
    const payload = await req.json().catch(() => ({}));
    const { event, data } = payload;

    const botId = data?.bot_id || data?.botId || payload?.bot_id || "";
    const metadata = data?.metadata || payload?.metadata || {};
    const callId = metadata.callId || data?.callId || payload?.callId || botId;
    const callType = metadata.callType || data?.callType || "discovery";
    const intakeFormId = metadata.intakeFormId || data?.intakeFormId || "";

    console.log(`[CallBot:Webhook] Received event '${event}' for botId=${botId}, callId=${callId}`);

    // 1. Handle real-time transcript / audio data events from Recall.ai
    if (event === "transcript.data" || event === "realtime_transcript" || event === "transcript") {
      const transcriptData = data?.transcript || data;
      const text = transcriptData?.text || transcriptData?.words?.map((w: any) => w.text).join(" ") || "";
      const speaker = transcriptData?.speaker || transcriptData?.speaker_name || "Prospect";

      // Ignore utterances spoken by the AI bot itself
      if (speaker && (speaker.includes("AI") || speaker.includes("Dealflow") || speaker.includes("Praneeth Assist"))) {
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
