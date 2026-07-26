// lib/calendar-sync.ts

export interface CalendarEventDetails {
  title: string;
  description: string;
  meetingUrl: string;
  startTime: string; // ISO String
  durationMinutes?: number;
  location?: string;
  organizerEmail?: string;
}

/**
 * Formats a Date into UTC string required for iCal/Google Calendar (YYYYMMDDTHHmmssZ).
 */
function formatToICalDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Generates RFC 5545 compliant .ics (iCalendar) file content.
 */
export function generateICalFileContent(event: CalendarEventDetails): string {
  const dtStart = formatToICalDateTime(event.startTime);
  const durationMs = (event.durationMinutes || 30) * 60 * 1000;
  const dtEnd = formatToICalDateTime(new Date(new Date(event.startTime).getTime() + durationMs).toISOString());
  const dtStamp = formatToICalDateTime(new Date().toISOString());

  const cleanDescription = (event.description || "")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DealFlow.AI//Meeting Bot Calendar Sync//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:dealflow-event-${dtStart}-${Math.random().toString(36).substring(2, 7)}@dealflows.ai`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${cleanDescription}\\n\\nJoin Meeting: ${event.meetingUrl}\\n\\nDealflow Meeting Bot Auto-Invited.`,
    `LOCATION:${event.meetingUrl}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

/**
 * Generates direct Web links for Google Calendar, Outlook Web, and Yahoo Calendar.
 */
export function generateCalendarSyncLinks(event: CalendarEventDetails): {
  googleCalendarUrl: string;
  outlookUrl: string;
  iCalDataUrl: string;
} {
  const dtStart = formatToICalDateTime(event.startTime);
  const durationMs = (event.durationMinutes || 30) * 60 * 1000;
  const dtEnd = formatToICalDateTime(new Date(new Date(event.startTime).getTime() + durationMs).toISOString());

  const detailsText = `${event.description}\n\nMeeting Link: ${event.meetingUrl}\n\nDealflow AI Meeting Bot will join automatically.`;

  // Google Calendar URL
  const googleParams = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${dtStart}/${dtEnd}`,
    details: detailsText,
    location: event.meetingUrl,
  });
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?${googleParams.toString()}`;

  // Outlook Web URL
  const outlookParams = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: event.startTime,
    enddt: new Date(new Date(event.startTime).getTime() + durationMs).toISOString(),
    body: detailsText,
    location: event.meetingUrl,
  });
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?${outlookParams.toString()}`;

  // Data URL for instant .ics file download in browser
  const icalContent = generateICalFileContent(event);
  const iCalDataUrl = `data:text/calendar;charset=utf8,${encodeURIComponent(icalContent)}`;

  return { googleCalendarUrl, outlookUrl, iCalDataUrl };
}
