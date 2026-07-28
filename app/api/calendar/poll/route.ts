import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase-admin";
import {
  checkMeetingUrlReachable,
  computeJoinKey,
  fetchGoogleCalendarEvents,
  fetchIcsCalendarEvents,
  selectJoinCandidates,
} from "@/lib/calendar-events";
import { createMeetingBot } from "@/lib/recall";
import { PERSONAS } from "@/prompts/personas";

function envNum(name: string, fallback: number) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function envStr(name: string) {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : null;
}

function redactUrl(url: string) {
  try {
    const u = new URL(url);
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return url;
  }
}

async function audit(entry: any) {
  const payload = { ...entry, createdAt: new Date().toISOString() };
  console.log(JSON.stringify(payload));
  try {
    if (!db) return;
    await db.collection("audit_logs").add(payload);
  } catch (e) {
    console.error("audit_log_failed", e);
  }
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID?.() || crypto.randomBytes(16).toString("hex");
  const now = new Date();
  try {
    if (!db) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }
    const body = await req.json().catch(() => ({}));
    const calendarId = (body.calendarId || envStr("CALENDAR_ID")) as string | null;
    const icsUrl = (body.icsUrl || envStr("CALENDAR_ICS_URL")) as string | null;

    if (!calendarId) {
      return NextResponse.json({ success: false, error: "Missing CALENDAR_ID" }, { status: 400 });
    }

    const lookAheadMinutes = envNum("CALENDAR_POLL_LOOKAHEAD_MIN", 30);
    const joinEarlySeconds = envNum("CALENDAR_JOIN_EARLY_SEC", 90);
    const joinLateSeconds = envNum("CALENDAR_JOIN_LATE_SEC", 300);

    await audit({ requestId, type: "calendar_poll_start", calendarId, icsUrl: icsUrl ? "set" : "unset" });

    let events = [] as any[];
    let source: "ics" | "google" = "google";
    let icsError: string | null = null;

    if (icsUrl) {
      try {
        events = await fetchIcsCalendarEvents({
          calendarId,
          icsUrl,
          now,
          lookAheadMinutes,
        });
        source = "ics";
      } catch (e: any) {
        icsError = e?.message || "ics_failed";
        await audit({ requestId, type: "calendar_poll_ics_failed", calendarId, error: icsError });
      }
    }

    if (!events.length) {
      events = await fetchGoogleCalendarEvents({ calendarId, now, lookAheadMinutes });
      source = "google";
    }

    const candidates = selectJoinCandidates(events, now, joinEarlySeconds, joinLateSeconds);
    await audit({
      requestId,
      type: "calendar_poll_events",
      calendarId,
      source,
      total: events.length,
      candidates: candidates.length,
      icsError,
    });

    const personaKey = envStr("CALENDAR_AGENT_PERSONA") || "praneeth_assist";
    const persona = (PERSONAS as any)[personaKey] || PERSONAS.praneeth_assist;

    const results: any[] = [];

    for (const ev of candidates) {
      const joinKey = computeJoinKey(ev);
      const joinRef = db.collection("calendar_event_joins").doc(joinKey);
      const joinDoc = await joinRef.get();
      const joinData = joinDoc.exists ? (joinDoc.data() as any) : null;

      if (joinData?.status === "joined") {
        results.push({ eventId: ev.eventId, skipped: "already_joined" });
        continue;
      }

      const lastAttemptMs = joinData?.lastAttemptAtMs ? Number(joinData.lastAttemptAtMs) : 0;
      if (lastAttemptMs && Date.now() - lastAttemptMs < 60_000) {
        results.push({ eventId: ev.eventId, skipped: "recent_attempt" });
        continue;
      }

      if (!ev.meetingUrl) {
        await joinRef.set(
          {
            calendarId,
            eventId: ev.eventId,
            uid: ev.uid || null,
            title: ev.title,
            start: ev.start.toISOString(),
            end: ev.end.toISOString(),
            status: "skipped_no_meeting_url",
            lastAttemptAt: new Date().toISOString(),
            lastAttemptAtMs: Date.now(),
          },
          { merge: true }
        );
        await audit({
          requestId,
          type: "calendar_join_skip",
          calendarId,
          eventId: ev.eventId,
          reason: "no_meeting_url",
        });
        results.push({ eventId: ev.eventId, skipped: "no_meeting_url" });
        continue;
      }

      const reach = await checkMeetingUrlReachable(ev.meetingUrl);
      await audit({
        requestId,
        type: "calendar_join_url_check",
        calendarId,
        eventId: ev.eventId,
        meetingUrl: redactUrl(ev.meetingUrl),
        ok: reach.ok,
        status: reach.status,
        error: reach.error,
      });

      const callRef = await db.collection("calls").add({
        leadId: null,
        analysisId: null,
        meetingUrl: ev.meetingUrl,
        scheduledAt: ev.start,
        status: "scheduled",
        callMode: "calendar",
        calendarId,
        calendarEventId: ev.eventId,
        calendarEventUid: ev.uid || null,
        calendarEventTitle: ev.title,
        agentPersona: personaKey,
        dealStatus: "interested",
        createdAt: new Date(),
        updatedAt: new Date().toISOString(),
        updatedAtMs: Date.now(),
      });

      const callId = callRef.id;
      const joinAt = new Date(ev.start.getTime() - Math.max(0, joinEarlySeconds) * 1000).toISOString();

      try {
        const bot = await createMeetingBot(ev.meetingUrl, persona.name, callId, joinAt);
        await callRef.update({
          recallBotId: bot.id,
          joinAt,
          updatedAt: new Date().toISOString(),
          updatedAtMs: Date.now(),
        });

        await joinRef.set(
          {
            calendarId,
            eventId: ev.eventId,
            uid: ev.uid || null,
            title: ev.title,
            start: ev.start.toISOString(),
            end: ev.end.toISOString(),
            meetingUrl: ev.meetingUrl,
            callId,
            recallBotId: bot.id,
            status: "joined",
            joinedAt: new Date().toISOString(),
            joinedAtMs: Date.now(),
            lastAttemptAt: new Date().toISOString(),
            lastAttemptAtMs: Date.now(),
          },
          { merge: true }
        );

        await audit({
          requestId,
          type: "calendar_join_success",
          calendarId,
          eventId: ev.eventId,
          callId,
          recallBotId: bot.id,
          meetingUrl: redactUrl(ev.meetingUrl),
        });
        results.push({ eventId: ev.eventId, callId, recallBotId: bot.id, joined: true });
      } catch (e: any) {
        const err = e?.message || "join_failed";
        await joinRef.set(
          {
            calendarId,
            eventId: ev.eventId,
            uid: ev.uid || null,
            title: ev.title,
            start: ev.start.toISOString(),
            end: ev.end.toISOString(),
            meetingUrl: ev.meetingUrl,
            callId,
            status: "failed",
            error: err,
            lastAttemptAt: new Date().toISOString(),
            lastAttemptAtMs: Date.now(),
          },
          { merge: true }
        );
        await callRef.update({
          status: "failed",
          error: err,
          updatedAt: new Date().toISOString(),
          updatedAtMs: Date.now(),
        });
        await audit({
          requestId,
          type: "calendar_join_failed",
          calendarId,
          eventId: ev.eventId,
          callId,
          meetingUrl: redactUrl(ev.meetingUrl),
          error: err,
        });
        results.push({ eventId: ev.eventId, callId, joined: false, error: err });
      }
    }

    return NextResponse.json({
      success: true,
      requestId,
      calendarId,
      source,
      totalEvents: events.length,
      candidateEvents: candidates.length,
      results,
    });
  } catch (e: any) {
    const msg = e?.message || "calendar_poll_failed";
    await audit({ requestId, type: "calendar_poll_error", error: msg });
    return NextResponse.json({ success: false, requestId, error: msg }, { status: 500 });
  }
}

