// Notification service for emails and alerts
import { z } from "zod";
import { identifyMeetingPlatform } from "./meeting-utils";

const DEFAULT_RECIPIENTS = [
  "praneethb1909@gmail.com", // Main default recipient
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: { retries?: number; baseDelayMs?: number; timeoutMs?: number }
): Promise<T> {
  const retries = opts?.retries ?? 3;
  const baseDelayMs = opts?.baseDelayMs ?? 600;
  const timeoutMs = opts?.timeoutMs ?? 15000;

  let lastErr: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await Promise.race([
        fn(),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), timeoutMs)
        ),
      ]);
      return res;
    } catch (e) {
      lastErr = e;
      const backoff = Math.min(8000, baseDelayMs * Math.pow(2, attempt));
      const jitter = Math.floor(Math.random() * 200);
      await sleep(backoff + jitter);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("retry_failed");
}

function getResendApiKey() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) throw new Error("RESEND_API_KEY is missing");
  return key;
}

async function resendSendEmail(args: { to: string | string[]; subject: string; html: string }) {
  const apiKey = getResendApiKey();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Dealflow.ai <noreply@dealflow.ai>",
      to: args.to,
      subject: args.subject,
      html: args.html,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as any)?.message || (data as any)?.error || res.statusText;
    throw new Error(`resend_failed:${res.status}:${msg}`);
  }
  return data;
}

export async function sendEmail(options: { to: string | string[]; subject: string; body: string }) {
  console.log(`Sending email to ${options.to}: ${options.subject}`);
  return resendSendEmail({ to: options.to, subject: options.subject, html: options.body });
}

export async function sendEmailWithRetry(options: { to: string | string[]; subject: string; body: string }) {
  const emailSchema = z.union([z.string().email(), z.array(z.string().email())]);
  const parsed = emailSchema.safeParse(options.to);
  if (!parsed.success) {
    throw new Error("invalid_email");
  }

  return withRetry(
    () => resendSendEmail({ to: options.to, subject: options.subject, html: options.body }),
    { retries: 3, baseDelayMs: 800, timeoutMs: 15000 }
  );
}

/**
 * Sends an automated notification when a meeting agent is activated.
 */
export async function sendMeetingActivationNotification(args: {
  meetingUrl: string;
  leadName: string;
  companyName: string;
  persona: string;
  callId: string;
}) {
  const { meetingUrl, leadName, companyName, persona, callId } = args;
  const platform = identifyMeetingPlatform(meetingUrl);
  const { db } = await import("@/lib/firebase-admin");

  const platformDisplay = {
    zoom: "Zoom",
    google_meet: "Google Meet",
    microsoft_teams: "Microsoft Teams",
    calendly: "Calendly",
    other: "External Meeting Link",
  }[platform];

  const subject = `AI Agent Activated: Meeting with ${leadName} (${companyName})`;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #4f46e5; padding: 24px; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px;">Meeting Agent Activated</h1>
      </div>
      
      <div style="padding: 24px;">
        <p style="font-size: 16px; color: #374151;">An AI meeting agent has been successfully configured and activated for a new call.</p>
        
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <h2 style="font-size: 18px; margin-top: 0; color: #111827;">Meeting Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 120px;">Platform:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: bold;">${platformDisplay}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Lead:</td>
              <td style="padding: 8px 0; color: #111827;">${leadName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Company:</td>
              <td style="padding: 8px 0; color: #111827;">${companyName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Persona:</td>
              <td style="padding: 8px 0; color: #111827; text-transform: capitalize;">${persona}</td>
            </tr>
          </table>
        </div>
        
        <div style="margin-top: 24px;">
          <a href="${meetingUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Join Meeting</a>
          <p style="font-size: 12px; color: #6b7280; margin-top: 12px;">Link: ${meetingUrl}</p>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        
        <p style="font-size: 14px; color: #9ca3af;">
          Call ID: ${callId}<br>
          Generated by Dealflow.ai Notification System
        </p>
      </div>
    </div>
  `;

  // Log to Firestore
  const logRef = db ? db.collection("meeting_activation_logs").doc() : null;
  const logData = {
    callId,
    meetingUrl,
    platform,
    leadName,
    companyName,
    persona,
    recipients: DEFAULT_RECIPIENTS,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  if (logRef) await logRef.set(logData);

  try {
    await sendEmailWithRetry({
      to: DEFAULT_RECIPIENTS,
      subject,
      body: html,
    });

    if (logRef) {
      await logRef.update({
        status: "success",
        sentAt: new Date().toISOString(),
      });
    }

    console.log(`[Notification] Meeting activation email sent for call ${callId}`);
    return { success: true };
  } catch (error: any) {
    console.error(`[Notification] Meeting activation email failed for call ${callId}:`, error.message);
    
    if (logRef) {
      await logRef.update({
        status: "failed",
        error: error.message,
        lastAttemptAt: new Date().toISOString(),
      });
    }

    throw error;
  }
}

/**
 * Sends a combined notification with meeting details and analysis report.
 * Includes logging for both components.
 */
export async function sendCombinedNotification(args: {
  to: string;
  subject: string;
  meetingLink: string;
  reportHtml: string;
  callId: string;
  leadId: string;
}) {
  const { to, subject, meetingLink, reportHtml, callId, leadId } = args;
  const { db } = await import("@/lib/firebase-admin");

  const fullHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="margin-bottom: 32px; padding: 24px; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
        <h2 style="color: #166534; margin-top: 0;">Your Meeting is Confirmed!</h2>
        <p style="color: #166534; font-size: 16px;">We're excited to speak with you. You can join the meeting using the link below:</p>
        <a href="${meetingLink}" style="display: inline-block; background-color: #166534; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">Join Meeting</a>
        <p style="color: #166534; font-size: 12px; margin-top: 16px;">Meeting Link: <a href="${meetingLink}" style="color: #166534;">${meetingLink}</a></p>
      </div>

      <div style="margin-bottom: 32px;">
        <h2 style="color: #1f2937;">Pre-Meeting Analysis Report</h2>
        <p style="color: #4b5563; line-height: 1.6;">We've prepared a comprehensive analysis of your current GTM strategy to make our call as productive as possible. Please review the details below.</p>
      </div>

      ${reportHtml}
    </div>
  `;

  const logRef = db ? db.collection("notification_logs").doc() : null;
  const logData = {
    callId,
    leadId,
    recipient: to,
    type: "combined_pre_call",
    status: "pending",
    meetingLinkSent: false,
    reportSent: false,
    attempts: 0,
    createdAt: new Date().toISOString(),
  };

  const activeLogRef = logRef;
  if (activeLogRef) await activeLogRef.set(logData);

  try {
    await withRetry(
      async () => {
        logData.attempts++;
        await resendSendEmail({ to, subject, html: fullHtml });
      },
      { retries: 3, baseDelayMs: 1000 }
    );

    if (activeLogRef) {
      await activeLogRef.update({
        status: "success",
        meetingLinkSent: true,
        reportSent: true,
        sentAt: new Date().toISOString(),
        attempts: logData.attempts,
      });
    }

    console.log(`[Notification] Combined email sent successfully to ${to} for call ${callId}`);
    return { success: true };
  } catch (error: any) {
    console.error(`[Notification] Combined email failed for call ${callId}:`, error.message);
    if (activeLogRef) {
      await activeLogRef.update({
        status: "failed",
        error: error.message,
        attempts: logData.attempts,
        lastAttemptAt: new Date().toISOString(),
      });
    }
    throw error;
  }
}

function getTwilioCreds() {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_PHONE_NUMBER?.trim();
  if (!sid || !token || !from) throw new Error("TWILIO credentials missing");
  return { sid, token, from };
}

export async function sendSMS(options: { to: string; message: string }) {
  console.log(`Sending SMS to ${options.to}: ${options.message}`);
  const parsed = z.string().min(5).safeParse(options.to);
  if (!parsed.success) throw new Error("invalid_phone");

  const { sid, token, from } = getTwilioCreds();
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;

  const bodyParams: Record<string, string> = {
    To: options.to,
    Body: options.message,
  };

  if (messagingServiceSid) {
    bodyParams.MessagingServiceSid = messagingServiceSid;
  } else {
    bodyParams.From = from;
  }

  const body = new URLSearchParams(bodyParams);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as any)?.message || (data as any)?.error_message || res.statusText;
    throw new Error(`twilio_failed:${res.status}:${msg}`);
  }
  return data;
}
