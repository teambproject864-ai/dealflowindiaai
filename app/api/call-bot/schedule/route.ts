// app/api/call-bot/schedule/route.ts

import { NextResponse } from "next/server";
import { isCallBotEnabled } from "@/lib/call-bot/config";
import { createBot } from "@/lib/call-bot/meeting-client";
import { getCallTypeConfig } from "@/lib/call-bot/call-router";
import { logAuditEvent } from "@/lib/audit-logger";

export async function POST(req: Request) {
  if (!isCallBotEnabled()) {
    return NextResponse.json({
      success: false,
      message: "Call bot is currently disabled via ENABLE_CALL_BOT feature flag.",
      enabled: false
    }, { status: 200 });
  }

  try {
    const body = await req.json();
    const { callId, meetingUrl, callType = "discovery", intakeFormId, personaName } = body;

    if (!callId || !meetingUrl) {
      return NextResponse.json({
        success: false,
        error: "Missing required parameters: callId and meetingUrl are mandatory."
      }, { status: 400 });
    }

    const config = getCallTypeConfig(callType);

    // 1. Dispatch Recall.ai Bot to join the meeting
    const botRes = await createBot(meetingUrl, {
      callId,
      callType: config.callType,
      intakeFormId: intakeFormId || "",
      personaName: personaName || "Praneeth Assist"
    });

    const recallBotId = botRes.id;
    const nowIso = new Date().toISOString();

    // 2. Persist call record & bot assignment to Firestore (calls/{callId})
    try {
      const { db } = await import("@/lib/firebase-admin");
      if (db) {
        await db.collection("calls").doc(callId).set({
          callId,
          meetingUrl,
          type: config.callType,
          intakeFormId: intakeFormId || "",
          recallBotId,
          status: "scheduled",
          botCreatedAt: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso
        }, { merge: true });
      }
    } catch (dbErr: any) {
      console.warn(`[CallBot:Schedule] Firestore write warning for calls/${callId}:`, dbErr?.message || dbErr);
    }

    // 3. Compliance Audit Log
    await logAuditEvent(req, "system_scheduler", "call_bot_scheduled", {
      callId,
      meetingUrl,
      callType: config.callType,
      recallBotId
    });

    return NextResponse.json({
      success: true,
      callId,
      recallBotId,
      callType: config.callType,
      status: "scheduled",
      message: `Successfully scheduled live call bot ${recallBotId} for call ${callId}.`
    });

  } catch (error: any) {
    console.error("[CallBot:Schedule API Error]:", error?.message || error);
    return NextResponse.json({
      success: false,
      error: error?.message || "Failed to schedule live call bot"
    }, { status: 500 });
  }
}
