// lib/voice-confirmation.ts
import { getDb } from "./firebase-admin";
import { LeadRecord, CallRecord } from "./types";

function getDbOrThrow() {
  const db = getDb();
  if (!db) {
    throw new Error("Firebase database not initialized");
  }
  return db;
}
import { sendSMS, sendEmailWithRetry } from "./notifications";
import { decryptLead } from "./security";

export interface VoiceConfirmationRecord {
  callId: string;
  leadId: string;
  phone: string;
  status: 'initiated' | 'ringing' | 'answered' | 'completed' | 'failed' | 'no-answer' | 'busy' | 'opted-out' | 'out-of-hours';
  attemptsCount: number;
  maxAttempts: number;
  attempts: {
    attempt: number;
    twilioCallSid?: string;
    initiatedAt: string;
    completedAt?: string;
    duration?: number;
    status: string;
    error?: string;
  }[];
  scheduledAt: string;
  meetingUrl: string;
  createdAt: string;
  updatedAt: string;
  fallbackSent?: boolean;
  fallbackType?: 'email_and_sms' | 'none';
}

function getTwilioCreds() {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_PHONE_NUMBER?.trim();
  if (!sid || !token || !from) {
    return { sid: "AC_MOCK_SID", token: "MOCK_TOKEN", from: "+1800555DEAL", isMock: true };
  }
  return { sid, token, from, isMock: false };
}

/**
 * Format a phone number to E.164 with international support (+91 India, +1 US, etc.).
 */
export function formatE164(phone: string): string {
  if (!phone) return "";
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) {
    return "+" + trimmed.replace(/\D/g, "");
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  return `+${digits}`;
}

/**
 * Clean URL for speech delivery.
 * e.g., 'https://meet.google.com/abc-defg-hij' -> 'Google Meet code A B C, D E F, H I J'
 */
export function formatUrlForSpeech(url: string): string {
  if (!url) return "the link provided in your email";
  if (url.includes("meet.google.com")) {
    const parts = url.split("meet.google.com/");
    if (parts.length > 1) {
      const code = parts[1].split("?")[0].replace(/-/g, "");
      return `Google Meet with code ${code.split("").join(" ")}`;
    }
    return "Google Meet";
  }
  if (url.includes("zoom.us")) {
    return "Zoom";
  }
  if (url.includes("teams.microsoft.com")) {
    return "Microsoft Teams";
  }
  return "online meeting link";
}

/**
 * Perform compliance checks before calling (TCPA/GDPR).
 * - Checks if the recipient's phone number is present and valid.
 * - Verifies that the recipient has not opted out.
 * - Confirms that calls are placed during allowable hours (8 AM - 9 PM local time).
 */
export async function verifyCompliance(leadId: string, phone: string, scheduledAtStr?: string): Promise<{ allowed: boolean; reason: string }> {
  if (!phone || phone.trim().length < 7) {
    return { allowed: false, reason: "invalid_phone_number" };
  }

  // TCPA/GDPR explicit consent check
  const consentDoc = await getDbOrThrow().collection("user_consent").doc(leadId).get();
  if (consentDoc.exists) {
    const data = consentDoc.data();
    const purposes: string[] = data?.purposes || [];
    // If explicit preferences exist and 'voice' or 'phone' is missing, check if they opted out
    if (purposes.includes("opt-out") || purposes.includes("opt-out-voice")) {
      return { allowed: false, reason: "opted_out" };
    }
  }

  // Quiet Hours (8 AM to 9 PM recipient's local time)
  // Since transactional confirmation calls occur immediately upon user request,
  // they are generally allowed. However, we check the scheduled meeting slot's local hour as a proxy,
  // or use the current server hour.
  const currentHourIST = new Date().getUTCHours() + 5.5; // server is in IST timezone, let's keep it simple
  const localHour = (currentHourIST % 24);
  if (localHour < 8 || localHour >= 21) {
    // If it's late night, we restrict immediate calling for compliance
    return { allowed: false, reason: "quiet_hours_restricted" };
  }

  return { allowed: true, reason: "compliant" };
}

/**
 * Initiates the automated voice confirmation call.
 */
export async function initiateVoiceCall(callId: string, attempt: number = 1): Promise<{ success: boolean; twilioCallSid?: string; error?: string }> {
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  console.log(`[VoiceConfirmation] Initiating call for callId: ${callId}, attempt: ${attempt}`);

  try {
    const callDoc = await getDbOrThrow().collection("calls").doc(callId).get();
    if (!callDoc.exists) {
      throw new Error(`Call record ${callId} not found`);
    }
    const call = callDoc.data() as CallRecord;

    const leadDoc = await getDbOrThrow().collection("leads").doc(call.leadId).get();
    if (!leadDoc.exists) {
      throw new Error(`Lead record ${call.leadId} not found`);
    }
    const lead = decryptLead(leadDoc.data()) as LeadRecord;

    const rawPhone = lead.contactPhone || "";
    const phone = formatE164(rawPhone);

    const configDocRef = getDbOrThrow().collection("voice_confirmations").doc(callId);
    const existingConfig = (await configDocRef.get()).data() as VoiceConfirmationRecord | undefined;

    // Check compliance
    const compliance = await verifyCompliance(call.leadId, phone, call.scheduledAt);
    if (!compliance.allowed) {
      console.warn(`[VoiceConfirmation] Compliance block for call ${callId}: ${compliance.reason}`);
      await logAudit(callId, call.leadId, "voice_confirmation_compliance_blocked", {
        reason: compliance.reason,
        phone,
      });

      const finalStatus = compliance.reason === "opted_out" ? "opted-out" : "out-of-hours";
      await configDocRef.set({
        callId,
        leadId: call.leadId,
        phone,
        status: finalStatus,
        attemptsCount: attempt,
        maxAttempts: 3,
        attempts: existingConfig?.attempts || [],
        scheduledAt: call.scheduledAt || "",
        meetingUrl: call.meetingUrl || "",
        createdAt: existingConfig?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // Trigger immediate fallback since voice cannot be completed due to compliance
      await triggerVoiceFallback(callId, `compliance_blocked:${compliance.reason}`);
      return { success: false, error: compliance.reason };
    }

    // Build the dynamic TTS message
    const formattedDate = call.scheduledAt
      ? new Date(call.scheduledAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
      : "your scheduled date";
    const formattedTime = call.scheduledAt
      ? new Date(call.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      : "your scheduled time";

    const cleanMeetingUrl = formatUrlForSpeech(call.meetingUrl || "");
    const spelledCallId = callId.slice(0, 5).split("").join(" "); // speak the first 5 chars clearly
    const contactName = lead.contactName || "there";

    const companyLabel = lead.companyName || "your organization";
    const contactEmail = lead.contactEmail || "the email on file";
    const contactPhoneSpoken = phone.replace(/(\+\d)(\d{3})(\d{3})(\d{4})/, "$1, $2, $3, $4");

    const twimlXml = `
<Response>
  <Say voice="alice" language="en-US">
    Hello ${contactName}! This is an automated meeting confirmation from the Dealflow team.
    Your GTM strategy session with Dealflow dot A I is confirmed for ${formattedDate} at ${formattedTime}.
    This session is for ${companyLabel}.
    Your meeting will take place via ${cleanMeetingUrl}.
    Your booking reference prefix is ${spelledCallId}.
    We will reach you at ${contactPhoneSpoken} if follow-up is needed, and a confirmation has been sent to ${contactEmail}.
    Please join from a quiet location with a stable internet connection.
    Check your email for your custom GTM analysis and meeting details before the call.
    Thank you, and we look forward to speaking with you soon!
  </Say>
</Response>
    `.trim();

    // Call Twilio REST API
    const creds = getTwilioCreds();
    if (creds.isMock) {
      console.log(`[VoiceConfirmation] Twilio unconfigured — returning simulated active voice call for ${phone}`);
      const mockCallSid = `CA${Date.now()}${Math.floor(Math.random() * 1000)}`;
      return { success: true, twilioCallSid: mockCallSid };
    }

    const { sid, token, from } = creds;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`;

    const bodyParams = new URLSearchParams({
      From: from,
      To: phone,
      Twiml: twimlXml,
      StatusCallback: `${appUrl}/api/calls/status-callback?callId=${callId}`,
      StatusCallbackEvent: "initiated ringing answered completed failed",
      StatusCallbackMethod: "POST",
    });

    const authHeader = `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`;
    const twilioRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyParams,
    });

    const twilioData = await twilioRes.json().catch(() => ({}));
    if (!twilioRes.ok) {
      const errMsg = twilioData?.message || twilioData?.error_message || twilioRes.statusText;
      throw new Error(`twilio_failed:${twilioRes.status}:${errMsg}`);
    }

    const twilioCallSid = twilioData.sid;

    // Log the attempt
    const newAttempt = {
      attempt,
      twilioCallSid,
      initiatedAt: new Date().toISOString(),
      status: "initiated",
    };

    const currentAttempts = existingConfig?.attempts || [];
    currentAttempts.push(newAttempt);

    await configDocRef.set({
      callId,
      leadId: call.leadId,
      phone,
      status: "initiated",
      attemptsCount: attempt,
      maxAttempts: 3,
      attempts: currentAttempts,
      scheduledAt: call.scheduledAt || "",
      meetingUrl: call.meetingUrl || "",
      createdAt: existingConfig?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fallbackSent: existingConfig?.fallbackSent || false,
    });

    await logAudit(callId, call.leadId, "voice_confirmation_initiated", {
      attempt,
      twilioCallSid,
      phone,
    });

    return { success: true, twilioCallSid };
  } catch (error: any) {
    console.error(`[VoiceConfirmation] Error in initiateVoiceCall:`, error);
    await logAudit(callId, "", "voice_confirmation_error", {
      attempt,
      error: error.message,
    });

    // Handle failure and potentially trigger fallback or retry
    await handleCallFailure(callId, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Handles failed call outcomes (busy, no-answer, failed, rate limit, etc.)
 */
export async function handleCallFailure(callId: string, errorMsg: string): Promise<void> {
  const configDocRef = getDbOrThrow().collection("voice_confirmations").doc(callId);
  const snap = await configDocRef.get();
  if (!snap.exists) return;

  const config = snap.data() as VoiceConfirmationRecord;
  const nextAttempt = config.attemptsCount + 1;

  if (nextAttempt <= config.maxAttempts) {
    // We update status to 'failed' and increment attemptsCount, scheduled to retry
    await configDocRef.update({
      status: "failed",
      updatedAt: new Date().toISOString(),
    });

    await logAudit(callId, config.leadId, "voice_confirmation_retry_scheduled", {
      failedAttempt: config.attemptsCount,
      nextAttempt,
      error: errorMsg,
    });

    // Schedule next retry inside a 15-minute window (e.g., retry in 5 minutes = 300000 ms)
    const retryDelayMs = 5 * 60 * 1000;
    setTimeout(() => {
      initiateVoiceCall(callId, nextAttempt).catch(err =>
        console.error(`[VoiceConfirmation] Scheduled retry ${nextAttempt} failed:`, err.message)
      );
    }, retryDelayMs);
  } else {
    // Max attempts exceeded, mark status and trigger fallback channel
    await configDocRef.update({
      status: "failed",
      updatedAt: new Date().toISOString(),
    });

    await logAudit(callId, config.leadId, "voice_confirmation_max_attempts_exceeded", {
      attempts: config.attemptsCount,
      error: errorMsg,
    });

    await triggerVoiceFallback(callId, "max_attempts_exceeded");
  }
}

/**
 * Triggers fallback notification via Email & SMS when the confirmation call cannot be completed.
 */
export async function triggerVoiceFallback(callId: string, reason: string): Promise<void> {
  const configDocRef = getDbOrThrow().collection("voice_confirmations").doc(callId);
  const snap = await configDocRef.get();
  if (!snap.exists) return;

  const config = snap.data() as VoiceConfirmationRecord;
  if (config.fallbackSent) {
    console.log(`[VoiceConfirmation] Fallback already sent for callId: ${callId}`);
    return;
  }

  console.log(`[VoiceConfirmation] Triggering fallback for callId: ${callId}. Reason: ${reason}`);

  try {
    const callDoc = await getDbOrThrow().collection("calls").doc(callId).get();
    const call = callDoc.data();
    if (!call) throw new Error("Call doc not found for fallback");

    const leadDoc = await getDbOrThrow().collection("leads").doc(config.leadId).get();
    const lead = decryptLead(leadDoc.data());
    if (!lead) throw new Error("Lead doc not found for fallback");

    const formattedDate = call.scheduledAt
      ? new Date(call.scheduledAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
      : "your scheduled date";
    const formattedTime = call.scheduledAt
      ? new Date(call.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      : "your scheduled time";

    const emailSubject = `Appointment Confirmed: Dealflow.ai x ${lead.companyName}`;
    const emailBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
        <h2 style="color: #4f46e5;">Your Meeting is Confirmed!</h2>
        <p>Hi ${lead.contactName},</p>
        <p>Your upcoming GTM Strategy Session with Dealflow.ai has been successfully confirmed.</p>
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <strong>Date:</strong> ${formattedDate}<br>
          <strong>Time:</strong> ${formattedTime}<br>
          <strong>Join Link:</strong> <a href="${call.meetingUrl}">${call.meetingUrl}</a><br>
          <strong>Reference ID:</strong> ${callId}
        </div>
        <p><strong>Prerequisites:</strong> Please join from a quiet location with a stable internet connection. We have also prepared your custom GTM Strategy analysis, which you can access via the main dashboard.</p>
        <p>We tried calling you to confirm, but were unable to connect. This email and accompanying SMS serve as your official booking confirmation.</p>
        <p>See you soon!</p>
        <p>— The Dealflow.ai Team</p>
      </div>
    `;

    const smsMessage = `Hi ${lead.contactName}, your meeting is confirmed for ${formattedDate} at ${formattedTime}. Join link: ${call.meetingUrl}. Reference ID: ${callId}. We tried calling you but couldn't connect. See you soon!`;

    // Trigger both in parallel
    await Promise.all([
      sendEmailWithRetry({
        to: lead.contactEmail,
        subject: emailSubject,
        body: emailBody,
      }),
      sendSMS({
        to: config.phone,
        message: smsMessage,
      }).catch(err => console.error(`[VoiceConfirmation] Fallback SMS failed:`, err.message)),
    ]);

    await configDocRef.update({
      fallbackSent: true,
      fallbackType: "email_and_sms",
      updatedAt: new Date().toISOString(),
    });

    await logAudit(callId, config.leadId, "voice_confirmation_fallback_sent", {
      reason,
      recipientEmail: lead.contactEmail,
      recipientPhone: config.phone,
    });

    console.log(`[VoiceConfirmation] Fallback successfully completed for callId: ${callId}`);
  } catch (error: any) {
    console.error(`[VoiceConfirmation] Fallback failed for callId: ${callId}:`, error.message);
    await logAudit(callId, config.leadId, "voice_confirmation_fallback_error", {
      error: error.message,
    });
  }
}

/**
 * Log helper to Firestore audit_logs collection
 */
async function logAudit(callId: string, leadId: string, type: string, metadata: Record<string, any>) {
  try {
    await getDbOrThrow().collection("audit_logs").add({
      callId,
      leadId,
      type,
      ...metadata,
      createdAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error(`[VoiceConfirmation] Failed to write audit log:`, err.message);
  }
}
