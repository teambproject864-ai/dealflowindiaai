import { CallRecord } from "./types";

type RetryOptions = {
  attempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

export type EnsureBotResult =
  | { ok: true; botId: string; joinAtIso?: string; created: boolean }
  | { ok: false; error: string };

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function computeJoinAtIso(args: {
  callMode?: string;
  status?: string;
  scheduledAt?: Date | null;
  now?: Date;
  joinEarlySeconds?: number;
  forceJoinNow?: boolean;
}): string | undefined {
  const now = args.now || new Date();
  const joinEarlySeconds = args.joinEarlySeconds ?? 60;
  const soon = new Date(now.getTime() + 2000);

  if (args.forceJoinNow || args.callMode === "immediate" || args.status === "in-progress") {
    return soon.toISOString();
  }

  if (args.scheduledAt instanceof Date && Number.isFinite(args.scheduledAt.getTime())) {
    const desired = new Date(args.scheduledAt.getTime() - Math.max(0, joinEarlySeconds) * 1000);
    return (desired.getTime() < soon.getTime() ? soon : desired).toISOString();
  }

  return soon.toISOString();
}

function parseFirestoreDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === "function") return v.toDate();
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
}

async function audit(type: string, payload: Record<string, any>) {
  try {
    const { db } = await import("@/lib/firebase-admin");
    if (!db) return;
    await db.collection("audit_logs").add({
      type,
      ...payload,
      createdAt: new Date().toISOString(),
      createdAtMs: Date.now(),
    });
  } catch (err: any) {
    console.error(`[Audit] Failed to log ${type}:`, err.message);
  }
}

async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  let lastErr: Error | null = null;
  for (let i = 0; i < opts.attempts; i += 1) {
    try {
      return await fn();
    } catch (e: any) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      const backoff = Math.min(opts.maxDelayMs, Math.round(opts.baseDelayMs * Math.pow(2, i)));
      if (i < opts.attempts - 1) await sleep(backoff);
    }
  }
  throw lastErr || new Error("Retry failed");
}

export async function ensureBotForCall(args: {
  callId: string;
  meetingUrl?: string;
  personaKey?: string;
  forceJoinNow?: boolean;
  reason?: string;
}): Promise<EnsureBotResult> {
  const { db } = await import("@/lib/firebase-admin");
  if (!db) return { ok: false, error: "database_not_configured" };
  const { createMeetingBot } = await import("@/lib/recall");
  const { PERSONAS } = await import("@/prompts/personas");
  const callId = args.callId;
  const callRef = db.collection("calls").doc(callId);
  const callDoc = await callRef.get();
  if (!callDoc.exists) return { ok: false, error: "call_not_found" };

  const call = (callDoc.data() || {}) as CallRecord;
  if (call.recallBotId) return { ok: true, botId: call.recallBotId, created: false };

  const meetingUrl = (args.meetingUrl || call.meetingUrl || "").trim();
  if (!meetingUrl) {
    await audit("bot_join_skip", { callId, reason: "missing_meeting_url", trigger: args.reason || "unknown" });
    return { ok: false, error: "missing_meeting_url" };
  }

  const personaKey = args.personaKey || call.agentPersona || "praneeth_assist";
  const persona = (PERSONAS as any)[personaKey] || PERSONAS.praneeth_assist;

  const scheduledAt = parseFirestoreDate(call.scheduledAt);
  const joinAtIso = computeJoinAtIso({
    callMode: call.callMode,
    status: call.status,
    scheduledAt,
    forceJoinNow: args.forceJoinNow,
  });

  await audit("bot_join_attempt", {
    callId,
    meetingUrl,
    personaKey,
    joinAtIso,
    trigger: args.reason || "unknown",
  });

  try {
    const bot = await withRetry(
      () => createMeetingBot(meetingUrl, persona.name, callId, joinAtIso),
      { attempts: 3, baseDelayMs: 250, maxDelayMs: 1500 }
    );

    await callRef.set(
      {
        recallBotId: bot.id,
        agentPersona: personaKey,
        meetingUrl,
        botJoinAt: joinAtIso || null,
        botCreatedAt: new Date().toISOString(),
        botCreatedAtMs: Date.now(),
        botRestartCount: (call as any).botRestartCount || 0,
        updatedAt: new Date().toISOString(),
        updatedAtMs: Date.now(),
      },
      { merge: true }
    );

    await audit("bot_join_success", {
      callId,
      recallBotId: bot.id,
      personaKey,
      joinAtIso,
    });

    return { ok: true, botId: bot.id, joinAtIso, created: true };
  } catch (e: any) {
    await audit("bot_join_failed", { callId, error: e?.message || "failed", trigger: args.reason || "unknown" });
    return { ok: false, error: e?.message || "bot_join_failed" };
  }
}

function shouldRestart(status: string | null | undefined) {
  const s = (status || "").toLowerCase();
  return ["failed", "done", "left_call", "ended", "error"].includes(s);
}

export function isUnhealthyBotStatus(status: string | null | undefined) {
  return shouldRestart(status);
}

export async function ensureBotHealthy(args: { callId: string; reason?: string }): Promise<EnsureBotResult> {
  const { db } = await import("@/lib/firebase-admin");
  if (!db) return { ok: false, error: "database_not_configured" };
  const { getBotStatus } = await import("@/lib/recall");
  const callId = args.callId;
  const callRef = db.collection("calls").doc(callId);
  const callDoc = await callRef.get();
  if (!callDoc.exists) return { ok: false, error: "call_not_found" };
  const call = (callDoc.data() || {}) as CallRecord;
  const botId = call.recallBotId;
  if (!botId) return ensureBotForCall({ callId, reason: args.reason || "health_missing_bot" });

  let status: any = null;
  try {
    status = await getBotStatus(botId);
  } catch (e: any) {
    await audit("bot_health_status_failed", { callId, recallBotId: botId, error: e?.message || "failed" });
  }

  const botStatus = status?.status as string | undefined;
  if (call.status === "in-progress" && shouldRestart(botStatus)) {
    const restartCount = Math.min(10, ((call as any).botRestartCount || 0) + 1);
    await callRef.set({ botRestartCount: restartCount, updatedAt: new Date().toISOString(), updatedAtMs: Date.now() }, { merge: true });
    if (restartCount <= 2) {
      return ensureBotForCall({ callId, forceJoinNow: true, reason: args.reason || "health_restart" });
    }
  }

  return { ok: true, botId, created: false };
}
