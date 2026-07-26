// app/api/portal/agent/dealflow-bot/decision/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { decisionId, action, agentNotes } = body; // action: 'approve' | 'reject'

    if (!decisionId || !action) {
      return NextResponse.json({ success: false, error: "decisionId and action are required" }, { status: 400 });
    }

    const updatedStatus = action === "approve" ? "approved" : "rejected";

    return NextResponse.json({
      success: true,
      decisionId,
      status: updatedStatus,
      agentNotes: agentNotes || "",
      updatedAt: new Date().toISOString(),
      message: `In-meeting decision ${decisionId} successfully ${updatedStatus} by Agent.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed to update decision" }, { status: 500 });
  }
}
