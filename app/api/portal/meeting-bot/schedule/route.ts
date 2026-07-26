// app/api/portal/meeting-bot/schedule/route.ts
import { NextResponse } from "next/server";
import { scheduleMeetingBotSession } from "@/lib/call-bot/meeting-bot-controller";
import { generateCalendarSyncLinks } from "@/lib/calendar-sync";
import { scheduleMeetingReminders } from "@/lib/meeting-reminders";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      meetingTitle,
      meetingUrl,
      startTime,
      callScenario,
      scheduledByUserId,
      scheduledByUserRole,
      assignedAgentId,
      customerId,
      recipients,
    } = body;

    if (!meetingTitle || !meetingUrl || !startTime) {
      return NextResponse.json({ success: false, error: "Meeting title, meeting URL, and start time are required" }, { status: 400 });
    }

    // Schedule Bot Session
    const session = await scheduleMeetingBotSession({
      meetingTitle,
      meetingUrl,
      startTime: startTime || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      callScenario: callScenario || "client_sales",
      scheduledByUserId: scheduledByUserId || "cust-1",
      scheduledByUserRole: scheduledByUserRole || "customer",
      assignedAgentId: assignedAgentId || "agent-1",
      customerId: customerId || "cust-1",
      remindersEnabled: true,
    });

    // Generate Calendar Sync Links & .ics
    const calendarLinks = generateCalendarSyncLinks({
      title: session.meetingTitle,
      description: `Dealflow Meeting Bot session (${session.callScenario.replace("_", " ").toUpperCase()})`,
      meetingUrl: session.meetingUrl,
      startTime: session.startTime,
      durationMinutes: 30,
    });

    // Schedule Reminders
    const targetRecipients = Array.isArray(recipients) && recipients.length > 0
      ? recipients
      : [{ email: "client@example.com", phone: "+15550192831" }];

    const reminders = await scheduleMeetingReminders({
      sessionId: session.sessionId,
      meetingTitle: session.meetingTitle,
      meetingUrl: session.meetingUrl,
      startTime: session.startTime,
      recipients: targetRecipients,
    });

    return NextResponse.json({
      success: true,
      session,
      calendarLinks,
      remindersScheduledCount: reminders.length,
      message: "Meeting bot session scheduled successfully with calendar sync & pre-meeting reminders.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to schedule meeting bot session" }, { status: 500 });
  }
}
