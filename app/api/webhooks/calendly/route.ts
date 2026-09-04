// app/api/webhooks/calendly/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase-admin";
import { createMeetingBot } from "@/lib/recall";
import { scheduleMeetingBotSession } from "@/lib/call-bot/meeting-bot-controller";
import { computeJoinAtIso } from "@/lib/call-bot";

/**
 * Validates Calendly Webhook signature (HMAC SHA-256)
 * Format: t=timestamp,v1=signature
 */
function verifyCalendlySignature(header: string | null, rawBody: string, signingKey: string): boolean {
  if (!header || !signingKey) return false;

  try {
    const parts = header.split(",");
    let t = "";
    let v1 = "";
    for (const part of parts) {
      const [k, v] = part.split("=");
      if (k === "t") t = v;
      if (k === "v1") v1 = v;
    }

    if (!t || !v1) return false;

    // Reject signatures older than 5 minutes
    const timeMs = parseInt(t, 10) * 1000;
    if (Math.abs(Date.now() - timeMs) > 5 * 60 * 1000) {
      return false;
    }

    const payloadToSign = `${t}.${rawBody}`;
    const expectedSig = crypto.createHmac("sha256", signingKey).update(payloadToSign).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expectedSig));
  } catch {
    return false;
  }
}

/**
 * Health check endpoint for Calendly webhook configuration
 */
export async function GET() {
  return NextResponse.json({
    status: "active",
    service: "DealFlow AI Calendly Webhook Receiver",
    timestamp: new Date().toISOString(),
    supportedEvents: ["invitee.created", "invitee.canceled"],
  });
}

/**
 * Main Webhook Receiver for Calendly Events
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY?.trim();

    // Verify signature if signing key is provided
    if (signingKey) {
      const signatureHeader = req.headers.get("Calendly-Webhook-Signature") || req.headers.get("calendly-webhook-signature");
      const isValid = verifyCalendlySignature(signatureHeader, rawBody, signingKey);
      if (!isValid) {
        console.warn("[CalendlyWebhook] Invalid signature detected.");
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody || "{}");
    const { event, payload } = body;

    console.log(`[CalendlyWebhook] Received event: ${event}`);

    // -------------------------------------------------------------------------
    // EVENT: INVITEE CREATED (Meeting Booked)
    // -------------------------------------------------------------------------
    if (event === "invitee.created" || event === "booking_scheduled") {
      const scheduledEvent = payload?.scheduled_event || payload;
      const inviteeName = payload?.name || payload?.first_name ? `${payload?.first_name || ""} ${payload?.last_name || ""}`.trim() : "Prospective Client";
      const inviteeEmail = payload?.email || "client@example.com";
      const meetingTitle = scheduledEvent?.name || "Dealflow AI Strategy Review";
      const startTime = scheduledEvent?.start_time || payload?.start_time || new Date(Date.now() + 15 * 60 * 1000).toISOString();

      // Extract Meeting URL (Google Meet, Zoom, Teams)
      const location = scheduledEvent?.location || payload?.location || {};
      const meetingUrl =
        location.join_url ||
        location.location ||
        (typeof location === "string" && location.startsWith("http") ? location : "") ||
        "";

      console.log(`[CalendlyWebhook] Processing booking for ${inviteeName} (${inviteeEmail}) at ${startTime}`);
      console.log(`[CalendlyWebhook] Extracted Meeting URL: ${meetingUrl || "None provided"}`);

      // Calculate pre-call buffer (60 seconds early)
      const scheduledDate = new Date(startTime);
      const joinAtIso = computeJoinAtIso({
        scheduledAt: scheduledDate,
        joinEarlySeconds: 60,
        now: new Date(),
      });

      console.log(`[CalendlyWebhook] Target bot join timestamp (with 60s buffer): ${joinAtIso}`);

      // Register session in Dealflow Meeting Bot Controller
      const session = await scheduleMeetingBotSession({
        meetingTitle,
        meetingUrl: meetingUrl || "https://meet.google.com/pending-assignment",
        startTime,
        callScenario: "client_sales",
        scheduledByUserId: "calendly-booking",
        scheduledByUserRole: "customer",
        recipients: [
          { email: inviteeEmail, name: inviteeName },
          { email: "buradapraneeth@gmail.com", name: "Praneeth Burada" },
        ],
        remindersEnabled: true,
      });

      let recallBotId: string | undefined = undefined;

      // If valid conference room URL exists, dispatch Recall bot with join_at
      if (meetingUrl && (meetingUrl.includes("meet.google.com") || meetingUrl.includes("zoom.us") || meetingUrl.includes("teams."))) {
        try {
          const botResult = await createMeetingBot(
            meetingUrl,
            "DealFlow AI Live Assistant",
            session.sessionId,
            joinAtIso
          );
          recallBotId = botResult?.id;
          session.recallBotId = recallBotId;
          session.botId = recallBotId;
          console.log(`[CalendlyWebhook] ✓ Successfully dispatched/queued Recall bot: ${recallBotId}`);
        } catch (botErr: any) {
          console.error(`[CalendlyWebhook] Failed to dispatch Recall bot:`, botErr?.message || botErr);
        }
      } else {
        console.warn(`[CalendlyWebhook] Note: No video conference URL found in Calendly event. Ensure Google Meet is set as Location in Calendly.`);
      }

      // Persist call record in Firestore
      if (db) {
        try {
          await db.collection("calls").doc(session.sessionId).set({
            callId: session.sessionId,
            meetingTitle,
            meetingUrl,
            scheduledAt: startTime,
            botJoinAt: joinAtIso,
            recallBotId: recallBotId || null,
            agentPersona: "praneeth_assist",
            status: "scheduled",
            callMode: "calendar",
            source: "calendly",
            leadEmail: inviteeEmail,
            leadName: inviteeName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        } catch (dbErr: any) {
          console.warn(`[CalendlyWebhook] Firestore sync notice:`, dbErr?.message || dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Calendly booking scheduled with DealFlow Meeting Bot",
        sessionId: session.sessionId,
        botId: recallBotId,
        joinAt: joinAtIso,
        meetingUrl,
      });
    }

    // -------------------------------------------------------------------------
    // EVENT: INVITEE CANCELED
    // -------------------------------------------------------------------------
    if (event === "invitee.canceled") {
      const inviteeEmail = payload?.email;
      console.log(`[CalendlyWebhook] Booking canceled for invitee: ${inviteeEmail}`);

      if (db && inviteeEmail) {
        try {
          const snap = await db.collection("calls").where("leadEmail", "==", inviteeEmail).where("status", "==", "scheduled").get();
          for (const doc of snap.docs) {
            await doc.ref.update({
              status: "canceled",
              canceledAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (cancelErr: any) {
          console.warn("[CalendlyWebhook] Error updating canceled status:", cancelErr.message);
        }
      }

      return NextResponse.json({ success: true, message: "Cancellation recorded" });
    }

    return NextResponse.json({ received: true, ignored: `Unsupported event type: ${event}` });
  } catch (error: any) {
    console.error("[CalendlyWebhook] Unhandled error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
