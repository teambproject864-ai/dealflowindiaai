import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { ensureBotHealthy } from "@/lib/call-bot";

export async function POST(req: Request) {
  try {
    const { callId } = await req.json();

    if (!callId) {
      return NextResponse.json({ success: false, error: "Missing callId" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ success: true, callStatus: "in-progress" });
    }

    const ref = db.collection("calls").doc(callId);
    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: "Call not found" }, { status: 404 });
    }

    await ref.update({
      updatedAt: new Date().toISOString(),
      updatedAtMs: Date.now(),
    });

    const doc2 = await ref.get();
    const callData: any = doc2.data() || {};

    if (callData?.status === "in-progress") {
      void ensureBotHealthy({ callId, reason: "heartbeat" });
    }

    return NextResponse.json({
      success: true,
      callId,
      recallBotId: callData?.recallBotId || null,
      meetingUrl: callData?.meetingUrl || null,
    });
  } catch (error) {
    console.error("Error updating call heartbeat:", error);
    return NextResponse.json({ success: false, error: "Failed to heartbeat" }, { status: 500 });
  }
}
