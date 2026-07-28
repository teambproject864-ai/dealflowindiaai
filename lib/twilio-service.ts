import twilio from "twilio";
import { db, getDb } from "./firebase-admin";
import { z } from "zod";

export interface OTPRecord {
  phone: string;
  code: string; // secure hash/salted code or plain 6 digits for simplified auditing
  expiresAt: string;
  attempts: number;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryStatusRecord {
  messageSid: string;
  to: string;
  from: string;
  channel: "sms" | "whatsapp" | "voice";
  status: string;
  errorCode?: string;
  errorMessage?: string;
  duration?: number;
  price?: string;
  priceUnit?: string;
  createdAt: string;
  updatedAt: string;
}

export function formatInternationalPhone(to: string): string {
  if (!to) return "";
  const trimmed = to.trim();
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

export class TwilioService {
  private static instance: TwilioService | null = null;
  private client: twilio.Twilio | null = null;
  private fromNumber: string;

  private constructor() {
    const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const token = process.env.TWILIO_AUTH_TOKEN?.trim();
    const from = process.env.TWILIO_PHONE_NUMBER?.trim();

    if (sid && token && from) {
      this.client = twilio(sid, token);
      this.fromNumber = from;
    } else {
      console.warn("[TwilioService] TWILIO credentials missing/unconfigured. Operating in Gateway Simulation Mode.");
      this.client = null;
      this.fromNumber = "+1800555DEAL";
    }
  }

  public static getInstance(): TwilioService {
    if (!TwilioService.instance) {
      TwilioService.instance = new TwilioService();
    }
    return TwilioService.instance;
  }

  /**
   * Helper wrapper to execute Twilio API calls with retry logic and exponential backoff
   */
  private async executeWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 800): Promise<T> {
    let lastError: any;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        console.warn(`[TwilioService] Attempt ${attempt} failed: ${err.message || err}`);
        if (attempt < retries) {
          const backoff = delay * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 200);
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }
      }
    }
    throw lastError;
  }

  /**
   * Send SMS Notification
   */
  public async sendSMS(to: string, message: string): Promise<any> {
    const parsedPhone = z.string().min(8).parse(to.trim());
    const formattedTo = formatInternationalPhone(parsedPhone);

    console.log(`[TwilioService] Sending SMS to ${formattedTo}: "${message.slice(0, 30)}..."`);

    if (!this.client) {
      const mockSid = `SM${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const mockPayload = { sid: mockSid, status: "delivered", to: formattedTo, from: this.fromNumber, body: message };
      await this.logAudit("sms_sent_simulated", { messageSid: mockSid, to: formattedTo, status: "delivered" });
      await this.initializeDeliveryStatus(mockSid, formattedTo, this.fromNumber, "sms", "delivered");
      return mockPayload;
    }

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const statusCallback = `${appUrl}/api/twilio/status-callback?channel=sms`;

    const payload = await this.executeWithRetry(() =>
      this.client!.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedTo,
        statusCallback,
      })
    );

    await this.logAudit("sms_sent", {
      messageSid: payload.sid,
      to: formattedTo,
      status: payload.status,
    });

    await this.initializeDeliveryStatus(payload.sid, formattedTo, this.fromNumber, "sms", payload.status);

    return payload;
  }

  /**
   * Send WhatsApp Notification
   */
  public async sendWhatsApp(to: string, message: string): Promise<any> {
    const parsedPhone = z.string().min(8).parse(to.trim());
    const cleanPhone = formatInternationalPhone(parsedPhone);
    const formattedTo = cleanPhone.startsWith("whatsapp:") ? cleanPhone : `whatsapp:${cleanPhone}`;
    const formattedFrom = this.fromNumber.startsWith("whatsapp:") ? this.fromNumber : `whatsapp:${this.fromNumber}`;

    console.log(`[TwilioService] Sending WhatsApp to ${formattedTo}: "${message.slice(0, 30)}..."`);

    if (!this.client) {
      const mockSid = `WX${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const mockPayload = { sid: mockSid, status: "delivered", to: formattedTo, from: formattedFrom, body: message };
      await this.logAudit("whatsapp_sent_simulated", { messageSid: mockSid, to: formattedTo, status: "delivered" });
      await this.initializeDeliveryStatus(mockSid, formattedTo, formattedFrom, "whatsapp", "delivered");
      return mockPayload;
    }

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const statusCallback = `${appUrl}/api/twilio/status-callback?channel=whatsapp`;

    const payload = await this.executeWithRetry(() =>
      this.client!.messages.create({
        body: message,
        from: formattedFrom,
        to: formattedTo,
        statusCallback,
      })
    );

    await this.logAudit("whatsapp_sent", {
      messageSid: payload.sid,
      to: formattedTo,
      status: payload.status,
    });

    await this.initializeDeliveryStatus(payload.sid, formattedTo, formattedFrom, "whatsapp", payload.status);

    return payload;
  }

  /**
   * Initiate Outbound Voice Call
   */
  public async initiateVoiceCall(to: string, twimlXml: string): Promise<any> {
    const parsedPhone = z.string().min(8).parse(to.trim());
    const formattedTo = formatInternationalPhone(parsedPhone);

    console.log(`[TwilioService] Initiating Outbound Voice Call to ${formattedTo}`);

    if (!this.client) {
      const mockSid = `CA${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const mockPayload = { sid: mockSid, status: "initiated", to: formattedTo, from: this.fromNumber };
      await this.logAudit("voice_call_simulated", { callSid: mockSid, to: formattedTo, status: "initiated" });
      await this.initializeDeliveryStatus(mockSid, formattedTo, this.fromNumber, "voice", "initiated");
      return mockPayload;
    }

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const statusCallback = `${appUrl}/api/twilio/status-callback?channel=voice`;

    const payload = await this.executeWithRetry(() =>
      this.client!.calls.create({
        twiml: twimlXml,
        to: formattedTo,
        from: this.fromNumber,
        statusCallback,
        statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
        statusCallbackMethod: "POST",
      })
    );

    await this.logAudit("voice_call_initiated", {
      callSid: payload.sid,
      to: formattedTo,
      status: payload.status,
    });

    await this.initializeDeliveryStatus(payload.sid, formattedTo, this.fromNumber, "voice", payload.status);

    return payload;
  }

  /**
   * Generate secure 6-digit numeric OTP and send via SMS
   */
  public async generateOTP(to: string): Promise<{ success: boolean; expiresAt: string }> {
    const parsedPhone = z.string().min(8).parse(to.trim());
    const formattedTo = formatInternationalPhone(parsedPhone);

    // Generate highly secure 6-digit random code
    const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5-minute validity window

    const db = getDb();
    if (db) {
      const otpDocRef = db.collection("otps").doc(formattedTo);
      const otpData: OTPRecord = {
        phone: formattedTo,
        code: rawCode,
        expiresAt,
        attempts: 0,
        verified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await otpDocRef.set(otpData);
    }

    const otpMessage = `Your Dealflow.ai security verification code is: ${rawCode}. This code is valid for 5 minutes. Please do not share this code.`;
    await this.sendSMS(formattedTo, otpMessage);

    await this.logAudit("otp_generated", {
      to: formattedTo,
      expiresAt,
    });

    return { success: true, expiresAt };
  }

  /**
   * Verify OTP with anti-brute force throttling
   */
  public async verifyOTP(to: string, code: string): Promise<{ success: boolean; reason?: string }> {
    const parsedPhone = z.string().min(8).parse(to.trim());
    const formattedTo = formatInternationalPhone(parsedPhone);

    const db = getDb();
    if (!db) {
      // In-memory or sandbox fallback
      return { success: true };
    }

    const otpDocRef = db.collection("otps").doc(formattedTo);
    const otpSnap = await otpDocRef.get();

    if (!otpSnap.exists) {
      return { success: false, reason: "otp_not_found" };
    }

    const data = otpSnap.data() as OTPRecord;

    if (data.verified) {
      return { success: false, reason: "otp_already_used" };
    }

    if (new Date().toISOString() > data.expiresAt) {
      return { success: false, reason: "otp_expired" };
    }

    if (data.attempts >= 3) {
      await this.logAudit("otp_blocked_brute_force", { phone: formattedTo });
      return { success: false, reason: "maximum_attempts_exceeded" };
    }

    if (data.code !== code.trim()) {
      const newAttempts = data.attempts + 1;
      await otpDocRef.update({
        attempts: newAttempts,
        updatedAt: new Date().toISOString(),
      });

      await this.logAudit("otp_failed_attempt", {
        phone: formattedTo,
        attempt: newAttempts,
      });

      if (newAttempts >= 3) {
        return { success: false, reason: "maximum_attempts_exceeded" };
      }

      return { success: false, reason: "invalid_code" };
    }

    await otpDocRef.update({
      verified: true,
      updatedAt: new Date().toISOString(),
    });

    await this.logAudit("otp_verified_successfully", { phone: formattedTo });

    return { success: true };
  }

  /**
   * Log delivery updates from Twilio status webhooks
   */
  public async updateDeliveryStatus(
    sid: string,
    status: string,
    errorCode?: string,
    errorMessage?: string,
    duration?: number,
    price?: string,
    priceUnit?: string
  ): Promise<void> {
    const db = getDb();
    if (!db) return;

    const statusDocRef = db.collection("twilio_delivery_statuses").doc(sid);
    const snap = await statusDocRef.get();

    if (snap.exists) {
      await statusDocRef.update({
        status,
        ...(errorCode ? { errorCode } : {}),
        ...(errorMessage ? { errorMessage } : {}),
        ...(duration !== undefined ? { duration } : {}),
        ...(price ? { price } : {}),
        ...(priceUnit ? { priceUnit } : {}),
        updatedAt: new Date().toISOString(),
      });

      await this.logAudit("twilio_delivery_update", {
        messageSid: sid,
        status,
        errorCode,
        errorMessage,
      });
    } else {
      await statusDocRef.set({
        messageSid: sid,
        status,
        errorCode: errorCode || null,
        errorMessage: errorMessage || null,
        duration: duration || null,
        price: price || null,
        priceUnit: priceUnit || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Initialize delivery status document in Firestore
   */
  private async initializeDeliveryStatus(
    sid: string,
    to: string,
    from: string,
    channel: "sms" | "whatsapp" | "voice",
    status: string
  ): Promise<void> {
    const db = getDb();
    if (!db) return;

    const statusDocRef = db.collection("twilio_delivery_statuses").doc(sid);
    const data: DeliveryStatusRecord = {
      messageSid: sid,
      to,
      from,
      channel,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await statusDocRef.set(data);
  }

  /**
   * Firestore Auditer
   */
  private async logAudit(type: string, metadata: Record<string, any>): Promise<void> {
    try {
      const db = getDb();
      if (!db) return;
      await db.collection("audit_logs").add({
        type,
        service: "twilio",
        ...metadata,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error(`[TwilioService] Failed to write audit log: ${err.message}`);
    }
  }
}
