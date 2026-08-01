import { NextRequest, NextResponse } from "next/server";
import { CalendarSlot, MeetingBooking } from "@/lib/types";

// In-memory mock store for calendar slots and bookings
const mockSlots: CalendarSlot[] = [
  { id: "slot-1", startTime: "2026-08-04T14:00:00Z", endTime: "2026-08-04T14:30:00Z", agentKey: "ashok", status: "available", title: "Weekly Standup - Option 1" },
  { id: "slot-2", startTime: "2026-08-04T16:00:00Z", endTime: "2026-08-04T16:30:00Z", agentKey: "ashok", status: "available", title: "Weekly Standup - Option 2" },
  { id: "slot-3", startTime: "2026-08-05T10:00:00Z", endTime: "2026-08-05T10:30:00Z", agentKey: "ashok", status: "available", title: "GTM Campaign Strategy Review" },
  { id: "slot-4", startTime: "2026-08-06T15:00:00Z", endTime: "2026-08-06T15:30:00Z", agentKey: "ashok", status: "available", title: "Pipeline Optimization Call" }
];

const mockBookings: MeetingBooking[] = [
  {
    id: "booking-101",
    slotId: "slot-1",
    agentKey: "ashok",
    agentName: "Ashok",
    customerId: "cust-1",
    customerName: "Acme Corp",
    startTime: "2026-08-04T14:00:00Z",
    endTime: "2026-08-04T14:30:00Z",
    meetingType: "weekly_standup",
    status: "confirmed",
    calendarSyncStatus: "synced_google"
  }
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agentKey = searchParams.get("agentKey") || "ashok";

  const availableSlots = mockSlots.filter(s => s.agentKey === agentKey || s.agentKey === "all");

  return NextResponse.json({
    success: true,
    calendarConnected: true,
    provider: "Google Calendar & Outlook",
    availableSlots,
    bookings: mockBookings
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slotId, agentKey, agentName, customerId, customerName, meetingType, calendarProvider } = body;

    const newBooking: MeetingBooking = {
      id: `booking-${Date.now()}`,
      slotId: slotId || `slot-${Date.now()}`,
      agentKey: agentKey || "ashok",
      agentName: agentName || "Assigned Agent",
      customerId: customerId || "cust-default",
      customerName: customerName || "Customer",
      startTime: body.startTime || new Date(Date.now() + 86400000).toISOString(),
      endTime: body.endTime || new Date(Date.now() + 88200000).toISOString(),
      meetingType: meetingType || "weekly_standup",
      status: "confirmed",
      calendarSyncStatus: calendarProvider === "outlook" ? "synced_outlook" : "synced_google"
    };

    mockBookings.push(newBooking);

    return NextResponse.json({
      success: true,
      booking: newBooking,
      reminderSent: true,
      message: `Weekly standup call confirmed with ${newBooking.agentName}. 2-Way Calendar Sync active (${newBooking.calendarSyncStatus}). Automated reminders scheduled.`
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Booking failed" },
      { status: 500 }
    );
  }
}
