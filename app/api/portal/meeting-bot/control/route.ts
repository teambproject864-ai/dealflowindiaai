// app/api/portal/meeting-bot/control/route.ts
import { NextResponse } from "next/server";
import { updateMeetingBotControl, getMeetingBotSessions } from "@/lib/call-bot/meeting-bot-controller";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const role = (searchParams.get("role") || "customer") as "customer" | "agent" | "admin";
  const userId = searchParams.get("userId") || undefined;

  try {
    const sessions = await getMeetingBotSessions(role, userId);
    return NextResponse.json({ success: true, sessions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to fetch bot sessions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, action, userRole } = body;

    if (!sessionId || !action) {
      return NextResponse.json({ success: false, error: "Missing sessionId or action parameter" }, { status: 400 });
    }

    const role = (userRole || "agent") as "customer" | "agent" | "admin";
    const result = await updateMeetingBotControl(sessionId, action, role);

    return NextResponse.json({
      success: result.success,
      session: result.session,
      message: result.message,
      mom: result.mom,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to execute bot control action" }, { status: 500 });
  }
}
