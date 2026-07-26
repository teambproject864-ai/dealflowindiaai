// lib/meeting-reminders.ts
import { sendEmailWithRetry } from "./notifications";

export interface ScheduledReminderAlert {
  reminderId: string;
  sessionId: string;
  meetingTitle: string;
  meetingUrl: string;
  recipientEmail: string;
  recipientPhone?: string;
  scheduledTime: string;
  reminderType: "15min_before" | "5min_before" | "mom_after";
  status: "pending" | "sent" | "failed";
  createdAt: string;
}

const inMemoryReminders = new Map<string, ScheduledReminderAlert>();

/**
 * Creates pre-meeting reminder alerts for a meeting session.
 */
export async function scheduleMeetingReminders(params: {
  sessionId: string;
  meetingTitle: string;
  meetingUrl: string;
  startTime: string; // ISO String
  recipients: Array<{ email: string; phone?: string }>;
}): Promise<ScheduledReminderAlert[]> {
  const startMs = new Date(params.startTime).getTime();
  const created: ScheduledReminderAlert[] = [];

  for (const recipient of params.recipients) {
    // 15-minute before reminder
    const r15Id = `rem-15m-${params.sessionId}-${recipient.email.replace(/[^a-zA-Z0-9]/g, "")}`;
    const r15: ScheduledReminderAlert = {
      reminderId: r15Id,
      sessionId: params.sessionId,
      meetingTitle: params.meetingTitle,
      meetingUrl: params.meetingUrl,
      recipientEmail: recipient.email,
      recipientPhone: recipient.phone,
      scheduledTime: new Date(Math.max(Date.now(), startMs - 15 * 60 * 1000)).toISOString(),
      reminderType: "15min_before",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // 5-minute before reminder
    const r5Id = `rem-5m-${params.sessionId}-${recipient.email.replace(/[^a-zA-Z0-9]/g, "")}`;
    const r5: ScheduledReminderAlert = {
      reminderId: r5Id,
      sessionId: params.sessionId,
      meetingTitle: params.meetingTitle,
      meetingUrl: params.meetingUrl,
      recipientEmail: recipient.email,
      recipientPhone: recipient.phone,
      scheduledTime: new Date(Math.max(Date.now(), startMs - 5 * 60 * 1000)).toISOString(),
      reminderType: "5min_before",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    inMemoryReminders.set(r15Id, r15);
    inMemoryReminders.set(r5Id, r5);
    created.push(r15, r5);
  }

  return created;
}

/**
 * Triggers dispatch for a reminder alert immediately.
 */
export async function dispatchMeetingReminderNow(reminderId: string): Promise<boolean> {
  const reminder = inMemoryReminders.get(reminderId);
  if (!reminder) return false;

  const subject = reminder.reminderType === "15min_before"
    ? `[Reminder - 15 Mins] ${reminder.meetingTitle}`
    : `[Reminder - Starting Soon] ${reminder.meetingTitle}`;

  const body = `Hi,\n\nYour upcoming meeting "${reminder.meetingTitle}" with Dealflow Meeting Bot is starting soon.\n\nJoin Meeting: ${reminder.meetingUrl}\n\nDealflow AI Assistant`;

  try {
    await sendEmailWithRetry({ to: reminder.recipientEmail, subject, body });

    // Optional WhatsApp dispatch if phone provided
    if (reminder.recipientPhone) {
      try {
        const { sendWhatsAppMessage } = await import("@/lib/whatsapp/evolution-whatsapp-client");
        await sendWhatsAppMessage({
          toPhone: reminder.recipientPhone,
          content: `⏰ *Meeting Reminder*\nYour meeting *${reminder.meetingTitle}* starts soon.\n\nJoin URL: ${reminder.meetingUrl}`,
          senderRole: "admin",
          triggerType: "meeting_reminder",
        });
      } catch (waErr: any) {
        console.warn("[MeetingReminders] WhatsApp dispatch skipped:", waErr?.message);
      }
    }

    reminder.status = "sent";
    inMemoryReminders.set(reminderId, reminder);
    return true;
  } catch (err: any) {
    console.error("[MeetingReminders] Failed to dispatch reminder:", err?.message || err);
    reminder.status = "failed";
    inMemoryReminders.set(reminderId, reminder);
    return false;
  }
}

/**
 * Returns all active scheduled reminders.
 */
export function getActiveScheduledReminders(): ScheduledReminderAlert[] {
  return Array.from(inMemoryReminders.values());
}
