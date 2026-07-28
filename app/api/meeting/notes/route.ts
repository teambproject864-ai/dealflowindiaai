import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const callId = searchParams.get("callId");

    if (!callId) {
      return NextResponse.json({ error: "Missing callId" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ buyingSignals: [], objections: [], keyMoments: [] });
    }

    const doc = await db.collection("notes").doc(callId).get();
    if (!doc.exists) {
      return NextResponse.json({ buyingSignals: [], objections: [], keyMoments: [] });
    }

    return NextResponse.json(doc.data());
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}
