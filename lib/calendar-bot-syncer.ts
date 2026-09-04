// lib/calendar-bot-syncer.ts
import { google } from "googleapis";
import { loadServiceAccount } from "@/lib/service-account";
import { db } from "@/lib/firebase-admin";
import { createMeetingBot } from "@/lib/recall";
import { scheduleMeetingBotSession } from "@/lib/call-bot/meeting-bot-controller";
import { computeJoinAtIso } from "@/lib/call-bot";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

/**
 * Scans Google Calendar (e.g. teambproject864@gmail.com) for any meetings with Google Meet/Zoom links
 * created by Calendly or calendar bookings, and automatically schedules the Meet Bot.
 */
export async function syncUpcomingCalendarMeetings(options?: {
  calendarId?: string;
  lookaheadHours?: number;
}): Promise<{
  checkedEventsCount: number;
  newlyScheduledCount: number;
  scheduledEvents: any[];
}> {
  const sa = loadServiceAccount();
  if (!sa) {
    throw new Error("Google Service Account credentials missing in environment.");
  }

  const auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: [CALENDAR_SCOPE],
  });

  const calendar = google.calendar({ version: "v3", auth });
  const calendarId = options?.calendarId || process.env.GOOGLE_CALENDAR_ID || "teambproject864@gmail.com";
  const lookaheadHours = options?.lookaheadHours || 24;

  const now = new Date();
  // Look from 10 minutes ago (to catch meetings starting right now) up to lookaheadHours
  const timeMin = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
  const timeMax = new Date(now.getTime() + lookaheadHours * 60 * 60 * 1000).toISOString();

  console.log(`[CalendarBotSyncer] Scanning calendar ${calendarId} for events between ${timeMin} and ${timeMax}...`);

  const res = await calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = res.data.items || [];
  console.log(`[CalendarBotSyncer] Found ${events.length} events on calendar.`);

  const scheduledEvents: any[] = [];
  let newlyScheduledCount = 0;

  for (const ev of events) {
    // 1. Extract conference URL (Google Meet, Zoom, Teams)
    const meetUrl =
      ev.hangoutLink ||
      ev.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === "video")?.uri ||
      (ev.location && (ev.location.includes("meet.google.com") || ev.location.includes("zoom.us")) ? ev.location : "");

    if (!meetUrl) {
      continue;
    }

    const startTimeStr = ev.start?.dateTime || ev.start?.date;
    if (!startTimeStr) continue;

    const eventTitle = ev.summary || "Scheduled Video Meeting";
    const startTime = new Date(startTimeStr);

    // 2. Check if a bot has already been scheduled for this calendar event or meeting URL
    let alreadyScheduled = false;
    if (db) {
      try {
        const existingByEvent = await db.collection("calls").where("calendarEventId", "==", ev.id).get();
        if (!existingByEvent.empty) alreadyScheduled = true;

        if (!alreadyScheduled) {
          const existingByUrl = await db.collection("calls").where("meetingUrl", "==", meetUrl).get();
          if (!existingByUrl.empty) alreadyScheduled = true;
        }
      } catch (err) {
        console.error('[CalendarBotSyncer] Failed to check existing bots:', err);
      }
    }

    if (alreadyScheduled) {
      console.log(`[CalendarBotSyncer] Event "${eventTitle}" already has a bot scheduled.`);
      continue;
    }

    // 3. Compute 60-second early join buffer
    const joinAtIso = computeJoinAtIso({
      scheduledAt: startTime,
      joinEarlySeconds: 60,
      now: new Date(),
    });

    console.log(`[CalendarBotSyncer] Scheduling bot for "${eventTitle}" at ${startTimeStr} (Join at: ${joinAtIso})`);

    const attendees = ev.attendees?.map((a) => ({ email: a.email || "", name: a.displayName || a.email || "" })) || [
      { email: "attendee@client.com", name: "Meeting Attendee" },
    ];

    // 4. Register session in Dealflow Meeting Bot Controller
    const session = await scheduleMeetingBotSession({
      meetingTitle: eventTitle,
      meetingUrl: meetUrl,
      startTime: startTime.toISOString(),
      callScenario: "client_sales",
      scheduledByUserId: "calendar-sync",
      scheduledByUserRole: "customer",
      recipients: attendees,
      remindersEnabled: true,
    });

    let botId: string | undefined = undefined;
    try {
      const bot = await createMeetingBot(
        meetUrl,
        "DealFlow AI Live Assistant",
        session.sessionId,
        joinAtIso
      );
      botId = bot?.id;
      session.recallBotId = botId;
      session.botId = botId;
      console.log(`[CalendarBotSyncer] ✓ Dispatched/queued bot ${botId} on Recall.ai`);
    } catch (botErr: any) {
      console.error(`[CalendarBotSyncer] Recall bot dispatch warning:`, botErr.message);
    }

    // 5. Persist to Firestore calls collection
    if (db) {
      try {
        await db.collection("calls").doc(session.sessionId).set(
          {
            callId: session.sessionId,
            calendarEventId: ev.id,
            meetingTitle: eventTitle,
            meetingUrl: meetUrl,
            scheduledAt: startTime.toISOString(),
            botJoinAt: joinAtIso,
            recallBotId: botId || null,
            agentPersona: "praneeth_assist",
            status: "scheduled",
            callMode: "calendar",
            source: "google_calendar_calendly_sync",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('[CalendarBotSyncer] Failed to save call to Firestore:', err);
      }
    }

    newlyScheduledCount += 1;
    scheduledEvents.push({
      calendarEventId: ev.id,
      title: eventTitle,
      meetUrl,
      startTime: startTime.toISOString(),
      joinAt: joinAtIso,
      botId,
    });
  }

  return {
    checkedEventsCount: events.length,
    newlyScheduledCount,
    scheduledEvents,
  };
}
