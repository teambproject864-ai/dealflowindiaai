// app/api/calls/confirm-voice/retry-scheduler/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { initiateVoiceCall, VoiceConfirmationRecord } from "@/lib/voice-confirmation";

export async function GET(req: Request) {
  try {
    const now = Date.now();
    const fiveMinutesAgoIso = new Date(now - 5 * 60 * 1000).toISOString();

    if (!db) {
      return NextResponse.json({ success: true, retriedCount: 0, retriedCalls: [] });
    }

    const snapshot = await db
      .collection("voice_confirmations")
      .where("status", "==", "failed")
      .get();

    const retriedCalls: string[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data() as VoiceConfirmationRecord;
      
      // Check if attempt count is within max attempts and the last call attempt finished more than 5 minutes ago
      if (data.attemptsCount < data.maxAttempts && data.updatedAt < fiveMinutesAgoIso) {
        const nextAttempt = data.attemptsCount + 1;
        
        // Fire and forget call retry in background
        void (async (id: string, att: number) => {
          try {
            await initiateVoiceCall(id, att);
          } catch (err: any) {
            console.error(`[RetryScheduler] Background retry ${att} failed for call ${id}:`, err.message);
          }
        })(data.callId, nextAttempt);

        retriedCalls.push(data.callId);
      }
    }

    return NextResponse.json({
      success: true,
      processed: snapshot.docs.length,
      retriedCount: retriedCalls.length,
      retriedCallIds: retriedCalls,
    });
  } catch (error: any) {
    console.error("[RetryScheduler] Error during polling run:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
