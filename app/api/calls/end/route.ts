import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { callId } = await req.json();

    if (!callId) {
      return NextResponse.json({ success: false, error: "Missing callId" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ success: true });
    }

    const ref = db.collection("calls").doc(callId);
    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: "Call not found" }, { status: 404 });
    }

    await ref.update({
      status: "completed",
      updatedAt: new Date().toISOString(),
      updatedAtMs: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error ending call:", error);
    return NextResponse.json({ success: false, error: "Failed to end call" }, { status: 500 });
  }
}
