
import { NextResponse } from "next/server";
import { UnifiedMeetingSystem } from "@/lib/unified-meeting-system";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/meetings/[meetingId] - Get a single meeting
export async function GET(
  request: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { meetingId } = await params;
    const system = UnifiedMeetingSystem.getInstance();
    const meeting = await system.getMeeting(meetingId);

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: "Meeting not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      meeting,
    });
  } catch (error: any) {
    console.error("[Meetings API GET by ID]:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/meetings/[meetingId]/start - Start meeting
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { meetingId } = await params;
    const { action } = await request.json();
    const system = UnifiedMeetingSystem.getInstance();

    let result;
    if (action === "start") {
      result = await system.startMeeting(meetingId);
    } else if (action === "end") {
      result = await system.endMeeting(meetingId);
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      meeting: result,
    });
  } catch (error: any) {
    console.error("[Meetings API PATCH]:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
