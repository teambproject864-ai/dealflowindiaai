// app/api/portal/meeting-bot/mom/route.ts
import { NextResponse } from "next/server";
import { ensureMOMDistribution, getMeetingBotSessions } from "@/lib/call-bot/meeting-bot-controller";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ success: false, error: "sessionId parameter is required" }, { status: 400 });
  }

  try {
    const sessions = await getMeetingBotSessions("admin");
    const session = sessions.find((s) => s.sessionId === sessionId);

    if (!session) {
      return NextResponse.json({ success: false, error: "Meeting session not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      sessionId,
      status: session.status,
      momStatus: session.momStatus || "pending",
      momId: session.momId || null,
      momDeliveredAt: session.momDeliveredAt || null,
      momRecipients: session.momRecipients || session.recipients?.map((r) => r.email) || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to fetch MOM status" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "sessionId parameter is required" }, { status: 400 });
    }

    // Trigger or re-dispatch automated MOM generation & distribution
    const result = await ensureMOMDistribution(sessionId);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "Failed to generate and distribute MOM" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Minutes of Meeting (MOM) generated and distributed to all pre-configured participants successfully.",
      mom: result.mom,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to execute MOM dispatch" }, { status: 500 });
  }
}
