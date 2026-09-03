// app/api/portal/meeting-recordings/route.ts
import { NextResponse } from "next/server";
import { getSecuredMeetingRecordings, getRecordingById } from "@/lib/meeting/recording-service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const recordingId = searchParams.get("id");
    const userId = searchParams.get("userId") || "agent-1";
    const userRole = (searchParams.get("userRole") as any) || "agent";
    const customerId = searchParams.get("customerId") || undefined;
    const ticketId = searchParams.get("ticketId") || undefined;

    if (recordingId) {
      const recording = await getRecordingById(recordingId, userId, userRole);
      if (!recording) {
        return NextResponse.json({ success: false, error: "Recording not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, recording });
    }

    const recordings = await getSecuredMeetingRecordings({
      userId,
      userRole,
      customerId,
      ticketId,
    });

    return NextResponse.json({ success: true, recordings });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch meeting recordings" },
      { status: 500 }
    );
  }
}
