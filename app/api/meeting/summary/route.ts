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
      return NextResponse.json({ content: "" });
    }

    const doc = await db.collection("summaries").where("callId", "==", callId).where("type", "==", "post-call").limit(1).get();
    
    if (doc.empty) {
      return NextResponse.json({ content: "" });
    }

    return NextResponse.json(doc.docs[0].data());
  } catch (error) {
    console.error("Error fetching summary:", error);
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}
