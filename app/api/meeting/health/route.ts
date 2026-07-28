import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/firebase-admin";
import { getBotStatus } from "@/lib/recall";
import { ensureBotHealthy } from "@/lib/call-bot";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const callId = searchParams.get("callId");
    if (!callId) return NextResponse.json({ error: "Missing callId" }, { status: 400 });
    if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const callDoc = await db.collection("calls").doc(callId).get();
    if (!callDoc.exists) return NextResponse.json({ error: "Call not found" }, { status: 404 });

    const callData: any = callDoc.data() || {};
    const botId = callData.recallBotId || null;

    let botStatus: any = null;
    if (botId) {
      botStatus = await getBotStatus(botId).catch((e: any) => ({ error: e?.message || "status_failed" }));
    }

    const ensured = await ensureBotHealthy({ callId, reason: "health_check" });

    return NextResponse.json({
      success: true,
      callId,
      meetingUrl: callData.meetingUrl || null,
      recallBotId: botId,
      botStatus,
      ensured,
      updatedAt: callData.updatedAt || null,
      updatedAtMs: callData.updatedAtMs || null,
    });
  } catch (error: any) {
    console.error("Meeting health error:", error);
    return NextResponse.json({ error: error.message || "health_failed" }, { status: 500 });
  }
}

