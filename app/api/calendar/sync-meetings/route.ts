// app/api/calendar/sync-meetings/route.ts
import { NextResponse } from "next/server";
import { syncUpcomingCalendarMeetings } from "@/lib/calendar-bot-syncer";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const lookaheadHours = parseInt(url.searchParams.get("hours") || "24", 10);
    const result = await syncUpcomingCalendarMeetings({ lookaheadHours });
    return NextResponse.json({
      success: true,
      message: `Checked ${result.checkedEventsCount} calendar events, scheduled bots for ${result.newlyScheduledCount} upcoming meetings.`,
      ...result,
    });
  } catch (error: any) {
    console.error("[CalendarSyncRoute] Error syncing calendar meetings:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
