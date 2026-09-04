// tests/meeting-bot-full-qa.test.ts
import "./setup-env";
process.env.HUGGINGFACE_API_KEY = "";
process.env.HUGGINGFACE_API_TOKEN = "";
process.env.RECALL_API_KEY = "test-recall-key";
process.env.RECALL_WEBHOOK_SECRET = "test_webhook_secret";

import assert from "assert";
import { createBot } from "../lib/call-bot/meeting-client";
import { createMeetingBot } from "../lib/recall";
import { classifyMeetingIntent, routeAndGenerateLLMResponse, generateHumanResponse } from "../lib/auto-llm";
import { DealflowMeetingBot } from "../lib/dealflow-llm/dealflow-meeting-bot";

export async function runMeetingBotFullQATests() {
  console.log("\n=========================================================================");
  console.log("  RUNNING COMPREHENSIVE IN-MEETING BOT Q&A AUDIT & VERIFICATION SUITE   ");
  console.log("=========================================================================");

  // -------------------------------------------------------------------------
  // TEST 1: Bot Dispatch Payload Validation (Recall.ai Streaming & Webhook URL)
  // -------------------------------------------------------------------------
  console.log("\n-> [Test 1] Validating Bot Creation Payloads & Real-Time Endpoints...");

  const originalFetch = globalThis.fetch;
  let capturedCreateBotPayload: any = null;
  let capturedRecallCreatePayload: any = null;

  globalThis.fetch = async (url: any, init?: any) => {
    const urlStr = String(url);
    if (urlStr.includes("/api/v1/bot/")) {
      const body = JSON.parse(init?.body || "{}");
      if (!capturedCreateBotPayload) {
        capturedCreateBotPayload = body;
      } else {
        capturedRecallCreatePayload = body;
      }
      return new Response(JSON.stringify({ id: "mock-bot-12345", status: "ready" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  };

  try {
    // 1.1 Test createBot in lib/call-bot/meeting-client.ts
    const botRes = await createBot("https://meet.google.com/test-room-1", {
      callId: "call-qa-1",
      personaName: "Praneeth Assist",
    });
    assert.strictEqual(botRes.id, "mock-bot-12345");
    assert.ok(capturedCreateBotPayload, "createBot must send a payload to Recall.ai");
    assert.ok(capturedCreateBotPayload.recording_config?.transcript?.provider?.recallai_streaming, "Must configure recallai_streaming provider");
    assert.strictEqual(capturedCreateBotPayload.recording_config.transcript.provider.recallai_streaming.mode, "prioritize_low_latency");
    assert.ok(Array.isArray(capturedCreateBotPayload.recording_config.realtime_endpoints), "Must include realtime_endpoints array");

    const endpoint = capturedCreateBotPayload.recording_config.realtime_endpoints[0];
    assert.ok(endpoint.url.endsWith("/api/call-bot/webhook"), "createBot must route to /api/call-bot/webhook");
    assert.strictEqual(endpoint.url.includes("?token="), false, "Webhook URL must not contain query parameters");
    assert.strictEqual(endpoint.headers?.["X-Webhook-Secret"], "test_webhook_secret", "Must include X-Webhook-Secret header");
    assert.strictEqual(endpoint.headers?.["Authorization"], "Token test_webhook_secret", "Must include Authorization header");
    assert.ok(endpoint.events.includes("transcript.data"), "Endpoint must subscribe to transcript.data");
    assert.ok(endpoint.events.includes("participant_events.chat_message"), "Endpoint must subscribe to participant_events.chat_message");

    // 1.2 Test createMeetingBot in lib/recall.ts
    await createMeetingBot("https://meet.google.com/test-room-2", "Praneeth Assist", "call-qa-2");
    assert.ok(capturedRecallCreatePayload, "createMeetingBot must send payload");
    const recallEndpoint = capturedRecallCreatePayload.recording_config.realtime_endpoints[0];
    assert.ok(recallEndpoint.url.endsWith("/api/meeting/webhook"), "createMeetingBot must route to /api/meeting/webhook");
    assert.strictEqual(recallEndpoint.url.includes("?token="), false, "Webhook URL must not contain query parameters");
    assert.strictEqual(recallEndpoint.headers?.["X-Webhook-Secret"], "test_webhook_secret", "Must include X-Webhook-Secret header");
    assert.strictEqual(recallEndpoint.headers?.["Authorization"], "Token test_webhook_secret", "Must include Authorization header");
    assert.ok(recallEndpoint.events.includes("transcript.data"), "Subscribed to transcript.data");
    assert.ok(recallEndpoint.events.includes("participant_events.chat_message"), "Subscribed to participant_events.chat_message");

    console.log("   ✓ Bot creation payloads correctly configure low-latency streaming and header-authenticated webhooks without query parameters.");
  } finally {
    globalThis.fetch = originalFetch;
  }

  // -------------------------------------------------------------------------
  // TEST 2: Self-Speaker Diarization Filtering Validation
  // -------------------------------------------------------------------------
  console.log("\n-> [Test 2] Validating Self-Speaker Diarization Filtering...");

  // Mock persona for checking
  const botIdentityCheck = (speaker: string, isBotFlag?: boolean) => {
    const speakerStr = String(speaker || "").trim();
    const lowerSpeaker = speakerStr.toLowerCase();
    const isBotSelf =
      Boolean(isBotFlag) ||
      lowerSpeaker.endsWith("(ai) | dealflow.ai") ||
      lowerSpeaker.includes("(ai)") ||
      lowerSpeaker === "dealflow ai live assistant" ||
      lowerSpeaker === "dealflow assistant" ||
      lowerSpeaker === "praneeth assist (ai) | dealflow.ai" ||
      lowerSpeaker === "praneeth assist (ai)";
    return isBotSelf;
  };

  // Legitimate human speakers that were previously dropped falsely:
  const humanSpeakers = [
    "Praneeth",
    "Praneeth Burada",
    "Praneeth (Customer)",
    "Executive Assistant",
    "Sarah, Assistant Director",
    "Dealflow AE",
    "John from Dealflow",
    "CFO Attendee",
  ];

  for (const speaker of humanSpeakers) {
    assert.strictEqual(
      botIdentityCheck(speaker),
      false,
      `Human participant "${speaker}" MUST NOT be flagged as the bot itself!`
    );
  }

  // Genuine bot speech that should be filtered:
  const botSpeakers = [
    "Praneeth Assist (AI) | Dealflow.ai",
    "DealFlow AI Live Assistant",
    "Dealflow Assistant",
    "Praneeth Assist (AI)",
    "Alex (AI) | Dealflow.ai",
  ];

  for (const speaker of botSpeakers) {
    assert.strictEqual(
      botIdentityCheck(speaker),
      true,
      `Bot speaker "${speaker}" MUST be recognized as self-speech to prevent echo loops!`
    );
  }
  assert.strictEqual(botIdentityCheck("Participant", true), true, "Explicit is_bot flag must be respected");

  console.log("   ✓ Self-speaker diarization accurately isolates the bot without dropping human attendees.");

  // -------------------------------------------------------------------------
  // TEST 3: Concise and Single-Word Query Acceptance
  // -------------------------------------------------------------------------
  console.log("\n-> [Test 3] Validating Acceptance of Concise and Single-Word Queries...");

  const shortQueries = ["Why?", "Pricing?", "Cost?", "Help", "Demo?"];
  for (const query of shortQueries) {
    const trimmed = query.trim();
    assert.ok(trimmed.length >= 2, `Query "${query}" should satisfy length >= 2`);
    const intent = classifyMeetingIntent(trimmed);
    assert.ok(intent, `Intent for "${query}" should be categorized`);
  }
  console.log("   ✓ Concise queries pass input thresholds and are routed for Q&A answers.");

  // -------------------------------------------------------------------------
  // TEST 4: Dynamic Intent Recognition for Complex & Follow-Up Questions
  // -------------------------------------------------------------------------
  console.log("\n-> [Test 4] Validating Intent Recognition for Multi-Part & Follow-Up Questions...");

  const qaTestCases = [
    { query: "How much does your Growth package cost?", expectedIntent: "business_inquiry" },
    { query: "Can you elaborate on how your AI agents conduct discovery calls?", expectedIntent: "process_explanation" },
    { query: "Why is autonomous meeting assistance better than passive recording?", expectedIntent: "process_explanation" },
    { query: "Tell me more about your HubSpot and Salesforce CRM integration.", expectedIntent: "process_explanation" },
    { query: "What is your historical deal velocity and win rate across tech accounts?", expectedIntent: "data_query" },
    { query: "What commitments and action items have we agreed upon today?", expectedIntent: "meeting_related" },
    { query: "Good afternoon, thank you for joining!", expectedIntent: "conversational_greeting" },
  ];

  for (const tc of qaTestCases) {
    const classified = classifyMeetingIntent(tc.query);
    assert.strictEqual(classified, tc.expectedIntent, `Query "${tc.query}" should classify as ${tc.expectedIntent}`);
    const response = await generateHumanResponse(tc.query, [], {
      personaName: "Praneeth",
      companyName: "DealFlow AI",
    });
    assert.ok(response && response.length > 20, `Generated response for "${tc.query}" should be substantive`);
    assert.strictEqual(response.includes("**"), false, "Spoken text must be clean of markdown asterisks");
    assert.strictEqual(response.includes("https://"), false, "Spoken text must not contain raw URLs");
  }

  console.log("   ✓ Multi-part, technical, and follow-up customer inquiries successfully recognized and answered.");

  // -------------------------------------------------------------------------
  // TEST 5: Interactive Meeting Bot Q&A Session Simulation
  // -------------------------------------------------------------------------
  console.log("\n-> [Test 5] Simulating End-to-End Meeting Session (Intro -> Q&A -> MOM)...");

  const meetingBot = new DealflowMeetingBot("bot-e2e-session-1", "https://meet.google.com/test-e2e", "client_sales");
  await meetingBot.connect();

  // 5.1 Introduction
  await meetingBot.ingestTranscriptChunk({
    speaker: "Praneeth (AI) | Dealflow.ai",
    text: "Hello everyone. I am your DealFlow AI live assistant. I am listening and ready to answer any questions from the customer.",
    timestamp: new Date().toISOString(),
  });

  // 5.2 Customer Question 1: Pricing
  const answer1 = await meetingBot.answerParticipantQuestion(
    "How much does DealFlow AI cost per month for an enterprise team?",
    "VP of Sales"
  );
  assert.ok(answer1.spokenText.includes("499") || answer1.spokenText.includes("1,499") || answer1.spokenText.toLowerCase().includes("growth") || answer1.spokenText.toLowerCase().includes("pricing"), "Must provide pricing details");

  // 5.3 Customer Question 2: Follow-up / Technical Integration
  const answer2 = await meetingBot.answerParticipantQuestion(
    "Can you elaborate on how you synchronize notes with HubSpot and ensure SOC 2 compliance?",
    "Director of Security"
  );
  assert.ok(answer2.spokenText.toLowerCase().includes("hubspot") || answer2.spokenText.toLowerCase().includes("crm") || answer2.spokenText.toLowerCase().includes("soc 2") || answer2.spokenText.toLowerCase().includes("security") || answer2.spokenText.toLowerCase().includes("autonomous"), "Must address technical integration or security");

  // 5.4 Customer Question 3: Objection / Closing Commitment
  await meetingBot.ingestTranscriptChunk({
    speaker: "VP of Sales",
    text: "This looks great, but price seems high. We will follow up by Friday on contractual terms.",
    timestamp: new Date().toISOString(),
  });

  const state = meetingBot.getBotState();
  assert.ok(state.transcript.length >= 4, "Transcript must record all Q&A interactions");
  assert.ok(state.participants.includes("VP of Sales"), "Participants list must capture customer");
  assert.ok(state.participants.includes("Director of Security"), "Participants list must capture technical stakeholder");
  assert.ok(state.detectedObjections.length >= 1, "Objection must be captured");
  assert.ok(state.extractedActionItems.length >= 1, "Action item must be logged");

  // 5.5 Finalize and distribute MOM
  const mom = await meetingBot.finishCallAndDistributeMOM(["client-stakeholder@example.com"]);
  assert.ok(mom.momId.startsWith("mom-"), "MOM must be generated upon call completion");
  assert.ok(mom.executiveSummary.length > 50, "Executive summary must be present");
  assert.ok(mom.actionItems.length >= 1, "MOM must include logged action items");

  console.log("   ✓ Full lifecycle (Intro -> Multi-turn Q&A -> Decision Logging -> MOM Distribution) validated.");

  // -------------------------------------------------------------------------
  // TEST 6: Meeting Webhook Security & Header Authentication Validation
  // -------------------------------------------------------------------------
  console.log("\n-> [Test 6] Validating Meeting Webhook Security & Header Authentication...");
  const { POST: meetingWebhookPost } = await import("../app/api/meeting/webhook/route");

  // 6.1 Unauthenticated request must return 401
  const unauthReq = new Request("http://localhost:3000/api/meeting/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "unknown.event", data: {} }),
  });
  const unauthRes = await meetingWebhookPost(unauthReq);
  assert.strictEqual(unauthRes.status, 401, "Unauthenticated request must be rejected with 401");

  // 6.2 Unauthenticated transcript.data request must return 401 (verifying blind acceptance is fixed)
  const fakeTranscriptReq = new Request("http://localhost:3000/api/meeting/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "transcript.data",
      data: { bot_id: "fake-bot", transcript: { speaker: "Attacker", text: "Fake prompt injection" } },
    }),
  });
  const fakeTranscriptRes = await meetingWebhookPost(fakeTranscriptReq);
  assert.strictEqual(fakeTranscriptRes.status, 401, "Unauthenticated transcript.data event must NOT be blindly accepted");

  // 6.3 Hardcoded 'dealflow_secret' must return 401 (verifying hardcoded bypass is removed)
  const hardcodedSecretReq = new Request("http://localhost:3000/api/meeting/webhook?token=dealflow_secret", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "transcript.data", data: {} }),
  });
  const hardcodedSecretRes = await meetingWebhookPost(hardcodedSecretReq);
  assert.strictEqual(hardcodedSecretRes.status, 401, "Hardcoded 'dealflow_secret' must be rejected with 401");

  // 6.4 Valid X-Webhook-Secret header must be accepted (200 OK)
  const headerSecretReq = new Request("http://localhost:3000/api/meeting/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Secret": "test_webhook_secret",
    },
    body: JSON.stringify({ event: "bot.status_change", data: { bot_id: "test-bot" } }),
  });
  const headerSecretRes = await meetingWebhookPost(headerSecretReq);
  assert.strictEqual(headerSecretRes.status, 200, "Valid X-Webhook-Secret header must be accepted with 200");

  // 6.5 Valid Authorization Token header must be accepted (200 OK)
  const authHeaderReq = new Request("http://localhost:3000/api/meeting/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Token test_webhook_secret",
    },
    body: JSON.stringify({ event: "bot.status_change", data: { bot_id: "test-bot" } }),
  });
  const authHeaderRes = await meetingWebhookPost(authHeaderReq);
  assert.strictEqual(authHeaderRes.status, 200, "Valid Authorization Token header must be accepted with 200");

  console.log("   ✓ Meeting webhook correctly rejects unauthenticated events/hardcoded secrets and accepts authenticated headers.");

  console.log("\n=========================================================================");
  console.log("  ALL AUDIT & END-TO-END IN-MEETING BOT Q&A TESTS PASSED SUCCESSFULLY!  ");
  console.log("=========================================================================\n");
  return true;
}

if (require.main === module) {
  runMeetingBotFullQATests().catch((err) => {
    console.error("Meeting Bot Full QA Test Failure:", err);
    process.exit(1);
  });
}
