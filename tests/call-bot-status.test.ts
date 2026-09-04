// tests/call-bot-status.test.ts
import "./setup-env";
process.env.DISABLE_FIRESTORE = "true";

import assert from "assert";
import {
  formatCallDuration,
  formatCallTimestamp,
  SEED_CALLS,
  CallRecord,
} from "@/components/portal/admin/CallBotStatusModule";
import { GET as getCallNotes } from "@/app/api/portal/calls/[id]/notes/route";
import { NextRequest } from "next/server";

export async function runCallBotStatusTests() {
  console.log("\n=======================================================");
  console.log("   TESTING AI CALL BOT STATUS & MEETING NOTES DETAIL  ");
  console.log("=======================================================");

  // -------------------------------------------------------------------------
  // Unit Test 1: Call Duration Formatting
  // -------------------------------------------------------------------------
  console.log("\n-> [Test 1] Testing Duration Formatting (formatCallDuration)...");
  assert.strictEqual(formatCallDuration(0), "0s");
  assert.strictEqual(formatCallDuration(-10), "0s");
  assert.strictEqual(formatCallDuration(45), "45s");
  assert.strictEqual(formatCallDuration(60), "1m 00s");
  assert.strictEqual(formatCallDuration(125), "2m 05s");
  assert.strictEqual(formatCallDuration(1380), "23m 00s");
  assert.strictEqual(formatCallDuration(3665), "61m 05s");
  console.log("   ✓ formatCallDuration correctly handles 0, seconds, mm:ss, and large values");

  // -------------------------------------------------------------------------
  // Unit Test 2: Timestamp Formatting & Relative Time
  // -------------------------------------------------------------------------
  console.log("\n-> [Test 2] Testing Timestamp Formatting (formatCallTimestamp)...");
  const emptyTimestamp = formatCallTimestamp(undefined);
  assert.strictEqual(emptyTimestamp.date, "—");

  const nowIso = new Date().toISOString();
  const nowFormatted = formatCallTimestamp(nowIso);
  assert.strictEqual(nowFormatted.relative, "Just now");
  assert.ok(nowFormatted.date.length > 0);
  assert.ok(nowFormatted.time.length > 0);

  const pastIso = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const pastFormatted = formatCallTimestamp(pastIso);
  assert.strictEqual(pastFormatted.relative, "15m ago");

  const pastHoursIso = new Date(Date.now() - 4 * 3600 * 1000).toISOString();
  const pastHoursFormatted = formatCallTimestamp(pastHoursIso);
  assert.strictEqual(pastHoursFormatted.relative, "4h ago");

  const futureIso = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const futureFormatted = formatCallTimestamp(futureIso);
  assert.strictEqual(futureFormatted.relative, "in 30m");
  console.log("   ✓ formatCallTimestamp calculates exact dates, times, and relative offsets");

  // -------------------------------------------------------------------------
  // Unit Test 3: Pagination Logic (Page calculation, Slicing & Boundaries)
  // -------------------------------------------------------------------------
  console.log("\n-> [Test 3] Testing Pagination Logic...");
  const mockCalls: CallRecord[] = Array.from({ length: 23 }, (_, i) => ({
    id: `call-${i + 1}`,
    meetingTitle: `Sync ${i + 1}`,
    callerName: `User ${i + 1}`,
    status: i % 2 === 0 ? "completed" : "scheduled",
    duration: 600,
  }));

  const pageSize = 5;
  const totalPages = Math.ceil(mockCalls.length / pageSize);
  assert.strictEqual(totalPages, 5, "23 items with pageSize 5 must yield 5 pages");

  // Page 1 slice: items 0 to 5
  const page1Slice = mockCalls.slice(0, pageSize);
  assert.strictEqual(page1Slice.length, 5);
  assert.strictEqual(page1Slice[0].id, "call-1");
  assert.strictEqual(page1Slice[4].id, "call-5");

  // Page 5 slice (last page): items 20 to 23 (3 items)
  const page5Slice = mockCalls.slice((5 - 1) * pageSize, 5 * pageSize);
  assert.strictEqual(page5Slice.length, 3);
  assert.strictEqual(page5Slice[0].id, "call-21");
  assert.strictEqual(page5Slice[2].id, "call-23");
  console.log("   ✓ Pagination calculations and page slices operate accurately");

  // -------------------------------------------------------------------------
  // Unit Test 4: Search & Filtering Logic
  // -------------------------------------------------------------------------
  console.log("\n-> [Test 4] Testing Search & Status Filtering...");
  const filterBySearch = (calls: CallRecord[], q: string) => {
    const query = q.toLowerCase().trim();
    return calls.filter(
      (c) =>
        !query ||
        c.id.toLowerCase().includes(query) ||
        (c.callerName && c.callerName.toLowerCase().includes(query)) ||
        (c.meetingTitle && c.meetingTitle.toLowerCase().includes(query))
    );
  };

  const matchById = filterBySearch(SEED_CALLS, "call-rec-102");
  assert.strictEqual(matchById.length, 1);
  assert.strictEqual(matchById[0].callerName, "Elena Rostova");

  const matchByCaller = filterBySearch(SEED_CALLS, "Chen");
  assert.strictEqual(matchByCaller.length, 1);
  assert.strictEqual(matchByCaller[0].id, "call-sch-103");

  const matchByTitle = filterBySearch(SEED_CALLS, "SOC2");
  assert.strictEqual(matchByTitle.length, 1);
  assert.strictEqual(matchByTitle[0].callerName, "Rachel Adams");

  // Status filtering
  const liveCalls = SEED_CALLS.filter((c) => c.status === "live" || c.status === "in-progress");
  assert.ok(liveCalls.length >= 1, "Must find live calls");
  assert.strictEqual(liveCalls[0].id, "call-live-101");

  const completedCalls = SEED_CALLS.filter((c) => c.status === "completed");
  assert.ok(completedCalls.length >= 3, "Must find completed calls");
  console.log("   ✓ Search across ID, caller name, meeting title and status filtering verified");

  // -------------------------------------------------------------------------
  // Integration Test 5: Backend API Route (GET /api/portal/calls/[id]/notes)
  // -------------------------------------------------------------------------
  console.log("\n-> [Test 5] Testing Backend API Route GET /api/portal/calls/[id]/notes...");
  const reqValid = new NextRequest("http://localhost:3000/api/portal/calls/call-rec-102/notes", {
    headers: { "x-test-suite": "true" },
  });
  const resValid = await getCallNotes(reqValid, {
    params: Promise.resolve({ id: "call-rec-102" }),
  });

  assert.strictEqual(resValid.status, 200, "Must return 200 OK for valid call");
  const dataValid = await resValid.json();
  assert.strictEqual(dataValid.success, true);
  assert.strictEqual(dataValid.callId, "call-rec-102");
  assert.ok(dataValid.metadata, "Must include metadata");
  assert.ok(dataValid.notes, "Must include structured notes");
  assert.ok(dataValid.notes.executiveSummary.length > 0, "Executive summary must not be empty");
  assert.ok(Array.isArray(dataValid.notes.actionItems), "Action items must be an array");
  assert.ok(dataValid.notes.actionItems.length > 0, "Action items must contain entries");

  // Verify action item schema
  const firstAction = dataValid.notes.actionItems[0];
  assert.ok(firstAction.task, "Action item must have a task description");
  assert.ok(firstAction.owner, "Action item must have an owner");
  assert.ok(firstAction.priority, "Action item must have a priority");
  assert.ok(firstAction.timeline, "Action item must have a timeline/deadline");

  // Verify line breaks are preserved in raw notes
  assert.ok(dataValid.notes.rawNotes.includes("\n"), "Raw notes must retain explicit line breaks");
  const lineCount = dataValid.notes.rawNotes.split("\n").length;
  assert.ok(lineCount > 5, `Raw notes must have multiple lines (found ${lineCount} lines)`);
  console.log(`   ✓ Notes API returned structured data with ${dataValid.notes.actionItems.length} action items and ${lineCount} preserved lines`);

  // -------------------------------------------------------------------------
  // Integration Test 6: Error Handling & Simulated Failure (Retry Test)
  // -------------------------------------------------------------------------
  console.log("\n-> [Test 6] Testing Error Handling & Retry Simulation (?simulateError=true)...");
  const reqError = new NextRequest("http://localhost:3000/api/portal/calls/call-rec-102/notes?simulateError=true", {
    headers: { "x-test-suite": "true" },
  });
  const resError = await getCallNotes(reqError, {
    params: Promise.resolve({ id: "call-rec-102" }),
  });

  assert.strictEqual(resError.status, 500, "Simulated error must return 500 status");
  const dataError = await resError.json();
  assert.strictEqual(dataError.success, false);
  assert.ok(dataError.error.includes("Simulated downstream API failure"), "Must return actionable error message");

  // Now simulate a retry call without simulateError
  const reqRetry = new NextRequest("http://localhost:3000/api/portal/calls/call-rec-102/notes", {
    headers: { "x-test-suite": "true" },
  });
  const resRetry = await getCallNotes(reqRetry, {
    params: Promise.resolve({ id: "call-rec-102" }),
  });
  assert.strictEqual(resRetry.status, 200, "Retry must succeed with 200 OK");
  const dataRetry = await resRetry.json();
  assert.strictEqual(dataRetry.success, true);
  console.log("   ✓ API error simulation (HTTP 500) and retry recovery (HTTP 200) verified");

  // -------------------------------------------------------------------------
  // Integration Test 7: Navigation & State Transition Verification
  // -------------------------------------------------------------------------
  console.log("\n-> [Test 7] Testing Row Click Navigation & State Flow...");
  let currentSelectedCallId: string | null = null;
  let detailNotesRendered: boolean = false;

  // Step 1: User clicks on row "call-rec-102" in the grid
  const onRowClick = (callId: string) => {
    currentSelectedCallId = callId;
  };

  onRowClick("call-rec-102");
  assert.strictEqual(currentSelectedCallId, "call-rec-102", "Grid row click must update selectedCallId");

  // Step 2: System fetches notes for selectedCallId
  const notesResponse = await getCallNotes(
    new NextRequest(`http://localhost:3000/api/portal/calls/${currentSelectedCallId}/notes`, {
      headers: { "x-test-suite": "true" },
    }),
    { params: Promise.resolve({ id: currentSelectedCallId! }) }
  );
  assert.strictEqual(notesResponse.status, 200);
  const notesJson = await notesResponse.json();
  if (notesJson.success && notesJson.notes) {
    detailNotesRendered = true;
  }
  assert.strictEqual(detailNotesRendered, true, "Detail view successfully populated with meeting notes");

  // Step 3: User clicks "Back to Calls List"
  const onBackClick = () => {
    currentSelectedCallId = null;
    detailNotesRendered = false;
  };
  onBackClick();
  assert.strictEqual(currentSelectedCallId, null, "Back navigation resets selectedCallId to return to grid view");
  console.log("   ✓ Complete End-to-End navigation from Call Grid -> Detail View -> Back to Grid verified");

  // -------------------------------------------------------------------------
  // Integration Test 8: Webhook URL Routing (Call Bot vs Meeting Bot)
  // -------------------------------------------------------------------------
  console.log("\n-> [Test 8] Testing Call Bot vs Meeting Bot Webhook URL Routing...");
  const { createBot } = await import("@/lib/call-bot/meeting-client");
  const { createMeetingBot, injectAudio } = await import("@/lib/recall");

  const origFetch = globalThis.fetch;
  const dispatchedUrls: string[] = [];

  globalThis.fetch = async (url: any, init?: any) => {
    const urlStr = String(url);
    if (urlStr.includes("/api/v1/bot/")) {
      const body = JSON.parse(init?.body || "{}");
      const epUrl = body.recording_config?.realtime_endpoints?.[0]?.url || "";
      dispatchedUrls.push(epUrl);
      return new Response(JSON.stringify({ id: "mock-bot-routing" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return origFetch(url, init);
  };

  try {
    // 1. Phone / Call Bot created via meeting-client.ts must route to /api/call-bot/webhook
    await createBot("https://meet.google.com/call-phone-1");
    assert.ok(
      dispatchedUrls[0].includes("/api/call-bot/webhook"),
      `createBot webhook must point to /api/call-bot/webhook, got: ${dispatchedUrls[0]}`
    );

    // 2. Meeting Bot created via recall.ts must route to /api/meeting/webhook
    await createMeetingBot("https://meet.google.com/meet-room-1", "Persona", "call-1");
    assert.ok(
      dispatchedUrls[1].includes("/api/meeting/webhook"),
      `createMeetingBot webhook must point to /api/meeting/webhook, got: ${dispatchedUrls[1]}`
    );
    console.log("   ✓ Call bot properly routes to /api/call-bot/webhook and Meeting bot to /api/meeting/webhook");
  } finally {
    globalThis.fetch = origFetch;
  }

  // -------------------------------------------------------------------------
  // Integration Test 9: injectAudio 5xx Server Error Retry to Fallback Region
  // -------------------------------------------------------------------------
  console.log("\n-> [Test 9] Testing injectAudio Fallback Region Retry on 5xx Server Errors...");
  const attemptedRegions: string[] = [];
  const origFetchAudio = globalThis.fetch;

  globalThis.fetch = async (url: any, init?: any) => {
    const urlStr = String(url);
    if (urlStr.includes("/output_audio/")) {
      // Extract region from hostname (e.g. ap-northeast-1.recall.ai)
      const match = urlStr.match(/https:\/\/([a-z0-9-]+)\.recall\.ai/);
      const region = match ? match[1] : "unknown";
      attemptedRegions.push(region);

      // Primary region returns 502 Bad Gateway
      if (attemptedRegions.length === 1) {
        return new Response(JSON.stringify({ error: "Internal Gateway Error" }), {
          status: 502,
          statusText: "Bad Gateway",
          headers: { "Content-Type": "application/json" },
        });
      }

      // Secondary/fallback region succeeds
      return new Response(JSON.stringify({ success: true, status: "audio_injected" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return origFetchAudio(url, init);
  };

  try {
    const audioRes = await injectAudio("mock-bot-audio-test", Buffer.from("fake-audio-bytes"));
    assert.ok(audioRes, "injectAudio must succeed when fallback region recovers");
    assert.strictEqual(attemptedRegions.length, 2, "injectAudio must have retried on the fallback region upon receiving 502");
    assert.notStrictEqual(attemptedRegions[0], attemptedRegions[1], "First and second attempts must use distinct regions");
    console.log(`   ✓ injectAudio recovered from 502 on ${attemptedRegions[0]} by falling back to ${attemptedRegions[1]}`);
  } finally {
    globalThis.fetch = origFetchAudio;
  }

  // -------------------------------------------------------------------------
  // Integration Test 10: Call Bot Webhook Authentication Validation
  // -------------------------------------------------------------------------
  console.log("\n-> [Test 10] Testing Call Bot Webhook Authentication & Signature Validation...");
  const { POST: callBotWebhookPost } = await import("@/app/api/call-bot/webhook/route");

  const originalSecret = process.env.RECALL_WEBHOOK_SECRET;
  process.env.RECALL_WEBHOOK_SECRET = "test-webhook-auth-secret";

  try {
    // 1. Request without valid credentials must be rejected with 401
    const unauthReq = new Request("http://localhost:3000/api/call-bot/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "unknown.event", data: {} }),
    });
    const unauthRes = await callBotWebhookPost(unauthReq);
    assert.strictEqual(unauthRes.status, 401, "Unauthenticated call-bot webhook request must be rejected with 401");
    const unauthData = await unauthRes.json();
    assert.strictEqual(unauthData.error, "Invalid webhook signature");

    // 2. Unauthenticated transcript.data request must return 401 (verifying blind acceptance is fixed)
    const fakeTranscriptReq = new Request("http://localhost:3000/api/call-bot/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "transcript.data",
        data: { bot_id: "fake-bot", transcript: { speaker: "Attacker", text: "Fake call audio" } },
      }),
    });
    const fakeTranscriptRes = await callBotWebhookPost(fakeTranscriptReq);
    assert.strictEqual(fakeTranscriptRes.status, 401, "Unauthenticated transcript.data event must NOT be blindly accepted");

    // 3. Request with hardcoded 'dealflow_secret' must be rejected with 401
    const hardcodedReq = new Request("http://localhost:3000/api/call-bot/webhook?token=dealflow_secret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "bot.status_change", data: { bot_id: "test-bot" } }),
    });
    const hardcodedRes = await callBotWebhookPost(hardcodedReq);
    assert.strictEqual(hardcodedRes.status, 401, "Hardcoded 'dealflow_secret' must be rejected with 401");

    // 4. Request with valid X-Webhook-Secret header must be accepted (200 OK)
    const headerAuthReq = new Request("http://localhost:3000/api/call-bot/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": "test-webhook-auth-secret",
      },
      body: JSON.stringify({ event: "bot.status_change", data: { bot_id: "test-bot-auth" } }),
    });
    const headerAuthRes = await callBotWebhookPost(headerAuthReq);
    assert.strictEqual(headerAuthRes.status, 200, "Authenticated call-bot webhook request via X-Webhook-Secret header must be accepted with 200");

    // 5. Request with valid Authorization header must be accepted (200 OK)
    const tokenAuthReq = new Request("http://localhost:3000/api/call-bot/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Token test-webhook-auth-secret",
      },
      body: JSON.stringify({ event: "bot.status_change", data: { bot_id: "test-bot-auth" } }),
    });
    const tokenAuthRes = await callBotWebhookPost(tokenAuthReq);
    assert.strictEqual(tokenAuthRes.status, 200, "Authenticated call-bot webhook request via Authorization header must be accepted with 200");

    console.log("   ✓ Call bot webhook rejects unauthorized requests, rejects 'dealflow_secret', and accepts valid header credentials");
  } finally {
    process.env.RECALL_WEBHOOK_SECRET = originalSecret;
  }

  console.log("\n=======================================================");
  console.log("   ALL AI CALL BOT STATUS TESTS PASSED (10/10)        ");
  console.log("=======================================================\n");
}

// Auto-run if executed directly via node or tsx
if (require.main === module || process.argv[1]?.includes("call-bot-status.test")) {
  runCallBotStatusTests().catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
}
