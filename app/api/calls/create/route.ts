import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
import { createGoogleMeetLink } from "@/lib/google-meet";
import { sendEmailWithRetry } from "@/lib/notifications";
import { ensureBotForCall } from "@/lib/call-bot";
import { createCallSchema, CallRecord, LeadRecord } from "@/lib/types";
import { loadServiceAccount } from "@/lib/service-account";
import { decryptLead } from "@/lib/security";
import { requireAuth } from "@/lib/auth";
import { validateSafeExternalUrl } from "@/lib/ssrf-guard";

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(req, ["admin", "agent"]);
    if (authResult.errorResponse) return authResult.errorResponse;

    if (!loadServiceAccount()) {
      return NextResponse.json(
        {
          success: false,
          error: "Firebase Admin SDK is not configured.",
          message:
            "Set FIREBASE_SERVICE_ACCOUNT_PATH=./dealflow_firebase.json in .env.local and restart the dev server.",
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const validated = createCallSchema.safeParse(body);
    
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request body", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { leadId, analysisId, meetingUrl, scheduledAt, guests } = validated.data;

    if (meetingUrl) {
      const urlCheck = validateSafeExternalUrl(meetingUrl);
      if (!urlCheck.valid) {
        return NextResponse.json(
          { success: false, error: `Invalid meetingUrl: ${urlCheck.error}` },
          { status: 400 }
        );
      }
    }
    
    const callData: CallRecord = {
      leadId,
      analysisId,
      meetingUrl,
      scheduledAt,
      guests: guests || [],
      status: 'scheduled',
      callMode: 'calendar',
      agentPersona: 'praneeth_assist',
      dealStatus: 'interested',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedAtMs: Date.now(),
    };

    const db = getDb();
    if (!db) {
      return NextResponse.json({ success: false, error: "Database not configured." }, { status: 500 });
    }
    const callRef = await db.collection("calls").add(callData);
    const callId = callRef.id;

    // Use environment variable for notification recipient
    const recipient = process.env.ADMIN_NOTIFICATION_EMAIL || "praneethburada@gmail.com";

    if (meetingUrl) {
      void ensureBotForCall({
        callId,
        meetingUrl,
        personaKey: "praneeth_assist",
        forceJoinNow: true,
        reason: "scheduled_call_with_meeting_url",
      });
    }

    // Background process for Meet link and notifications
    void (async () => {
      try {
        const leadDoc = await db.collection("leads").doc(leadId).get();
        const lead = decryptLead(leadDoc.data()) as LeadRecord | undefined;
        const companyName = lead?.companyName || "a prospect";
        const leadEmail = String(lead?.contactEmail || "").trim();
        const canNotifyLead = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadEmail);

        const start = new Date(scheduledAt);
        const end = new Date(start.getTime() + 30 * 60 * 1000);
        const title = `Demo Call — ${companyName} x Dealflow.ai`;
        const descriptionHtml = [
          `<p><strong>Scheduled Demo</strong></p>`,
          `<p>Call ID: <strong>${callId}</strong></p>`,
        ].join("");

        let finalMeetingUrl = (meetingUrl || "").trim();
        let meetingProvider: string | null = null;
        let meetingEventId: string | null = null;
        let meetingCreatedAt: string | null = null;

        if (!finalMeetingUrl) {
          const created = await createGoogleMeetLink({
            title,
            descriptionHtml,
            start,
            end,
          });

          finalMeetingUrl = (created.meetLink || "").trim();
          meetingProvider = "google_meet";
          meetingEventId = created.eventId;
          meetingCreatedAt = new Date().toISOString();
        } else {
          meetingProvider = "external";
        }

        await db.collection("calls").doc(callId).update({
          ...(finalMeetingUrl ? { meetingUrl: finalMeetingUrl } : {}),
          ...(meetingProvider ? { meetingProvider } : {}),
          ...(meetingEventId ? { meetingEventId } : {}),
          ...(meetingCreatedAt ? { meetingCreatedAt } : {}),
          updatedAt: new Date().toISOString(),
          updatedAtMs: Date.now(),
        });

        if (finalMeetingUrl) {
          void ensureBotForCall({
            callId,
            meetingUrl: finalMeetingUrl,
            personaKey: "praneeth_assist",
            reason: "scheduled_call_meeting_url_ready",
          });
        }

        const emailBody = [
          `<p>Hi Praneeth,</p>`,
          `<p>A demo call has been scheduled.</p>`,
          `<p><strong>Title:</strong> ${title}</p>`,
          `<p><strong>Date/Time:</strong> ${start.toLocaleString()}</p>`,
          `<p><strong>Join:</strong> <a href="${finalMeetingUrl}">${finalMeetingUrl}</a></p>`,
          `<p><strong>Instructions:</strong> Click the link to join. Call ID: <strong>${callId}</strong>.</p>`,
        ].join("");

        await sendEmailWithRetry({
          to: recipient,
          subject: `Scheduled Demo Link — ${companyName}`,
          body: emailBody,
        });

        await db.collection("calls").doc(callId).update({
          meetingEmailTo: recipient,
          meetingEmailSentAt: new Date().toISOString(),
          meetingEmailStatus: "sent",
          updatedAt: new Date().toISOString(),
          updatedAtMs: Date.now(),
        });

        await db.collection("audit_logs").add({
          type: "scheduled_call_meeting_link",
          callId,
          leadId,
          analysisId,
          provider: "google_meet",
          status: "sent",
          recipient,
          meetLink: finalMeetingUrl,
          createdAt: new Date().toISOString(),
        });

        // Trigger pre-call notification (email/SMS) to the LEAD
        const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
        if (appUrl && canNotifyLead) {
          fetch(`${appUrl}/api/notifications/pre-call`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ callId }),
          }).catch(err => console.error("[Background] Pre-call notification trigger failed:", err.message));
        }

        // Trigger voice call confirmation post-booking webhook
        if (appUrl && canNotifyLead) {
          fetch(`${appUrl}/api/bookings/webhook`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ callId, event: "booking_confirmed" }),
          }).catch(err => console.error("[Background] Voice confirmation webhook trigger failed:", err.message));
        }
      } catch (e: any) {
        console.error(`[Background] Error finalizing call ${callId}:`, e.message);
        await db.collection("calls").doc(callId).update({
          meetingEmailTo: recipient,
          meetingEmailStatus: "failed",
          meetingEmailError: e?.message || "failed",
          updatedAt: new Date().toISOString(),
          updatedAtMs: Date.now(),
        });
        await db.collection("audit_logs").add({
          type: "scheduled_call_meeting_link",
          callId,
          leadId,
          analysisId,
          provider: "google_meet",
          status: "failed",
          recipient,
          error: e?.message || "failed",
          createdAt: new Date().toISOString(),
        });
      }
    })();

    return NextResponse.json({ 
      success: true, 
      callId 
    });
  } catch (error: any) {
    console.error("Error creating call:", error.message);
    const sa = loadServiceAccount();
    const isCredentialsError = 
      !sa || 
      error.message?.includes("Google credentials missing") || 
      error.message?.includes("Unable to detect a Project Id") ||
      error.message?.includes("Could not load the default credentials");

    if (isCredentialsError) {
      return NextResponse.json(
        {
          success: false,
          error: "Firebase/Google Service Account credentials are missing or misconfigured.",
          message: error.message,
          instructions: {
            title: "How to configure Firebase Service Account Credentials",
            steps: [
              "1. Go to the Firebase Console: https://console.firebase.google.com/",
              "2. Select your project: dealflow-ai-651cb",
              "3. Navigate to Project Settings > Service Accounts.",
              "4. Click 'Generate new private key' and download the JSON file.",
              "5. Save the downloaded JSON file to your project root folder as 'service-account.json'. (Do not overwrite your existing 'firebase.json' hosting configuration file).",
              "6. Open your .env.local file and update FIREBASE_SERVICE_ACCOUNT_PATH to point to it: FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json"
            ]
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create call", message: error.message }, 
      { status: 500 }
    );
  }
}
