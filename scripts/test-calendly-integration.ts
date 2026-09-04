// scripts/test-calendly-integration.ts
import "../tests/setup-env";
process.env.DISABLE_FIRESTORE = "true";

import assert from "assert";

async function runTests() {
  console.log("\n=======================================================");
  console.log("   TESTING CALENDLY AUTOMATED MEET BOT INTEGRATION    ");
  console.log("=======================================================");

  const { GET, POST } = await import("../app/api/webhooks/calendly/route");

  // -------------------------------------------------------------------------
  // Test 1: Health Check (GET)
  // -------------------------------------------------------------------------
  console.log("\n-> [Test 1] Testing GET Health Check...");
  const healthRes = await GET();
  assert.strictEqual(healthRes.status, 200);
  const healthData = await healthRes.json();
  assert.strictEqual(healthData.status, "active");
  console.log("   ✓ Health check returned 200 OK (Status: active)");

  // -------------------------------------------------------------------------
  // Test 2: invitee.created with future start time (60s pre-call buffer)
  // -------------------------------------------------------------------------
  console.log("\n-> [Test 2] Testing 'invitee.created' with 60s pre-call buffer...");

  // Meeting 15 minutes from now
  const scheduledStartTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const testPayload = {
    event: "invitee.created",
    payload: {
      name: "Enterprise Client",
      email: "enterprise@client.com",
      scheduled_event: {
        name: "30 Minute AI Discovery",
        start_time: scheduledStartTime,
        location: {
          type: "google_conference",
          join_url: "https://meet.google.com/abc-test-meet",
        },
      },
    },
  };

  const req1 = new Request("https://dealsflowai.vercel.app/api/webhooks/calendly", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testPayload),
  });

  const res1 = await POST(req1);
  assert.strictEqual(res1.status, 200);
  const data1 = await res1.json();
  assert.strictEqual(data1.success, true);
  assert.ok(data1.sessionId, "Must return a generated sessionId");
  assert.ok(data1.joinAt, "Must compute a joinAt timestamp");

  const expectedJoinTimeMs = new Date(scheduledStartTime).getTime() - 60 * 1000;
  const actualJoinTimeMs = new Date(data1.joinAt).getTime();
  assert.strictEqual(
    actualJoinTimeMs,
    expectedJoinTimeMs,
    "joinAt timestamp must be exactly 60 seconds before scheduled start time"
  );
  console.log(`   ✓ Scheduled At: ${scheduledStartTime}`);
  console.log(`   ✓ Bot Join At : ${data1.joinAt} (Exact 60s early buffer verified!)`);

  // -------------------------------------------------------------------------
  // Test 3: invitee.created with immediate start time (< 60 seconds)
  // -------------------------------------------------------------------------
  console.log("\n-> [Test 3] Testing immediate start time edge case...");
  const immediateStartTime = new Date(Date.now() + 30 * 1000).toISOString(); // 30s away
  const immediatePayload = {
    event: "invitee.created",
    payload: {
      name: "Urgent Meeting Client",
      email: "urgent@client.com",
      scheduled_event: {
        name: "Immediate Discovery",
        start_time: immediateStartTime,
        location: {
          type: "google_conference",
          join_url: "https://meet.google.com/urg-fast-call",
        },
      },
    },
  };

  const req2 = new Request("https://dealsflowai.vercel.app/api/webhooks/calendly", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(immediatePayload),
  });

  const res2 = await POST(req2);
  assert.strictEqual(res2.status, 200);
  const data2 = await res2.json();
  assert.strictEqual(data2.success, true);
  console.log(`   ✓ Immediate join time handled smoothly: ${data2.joinAt}`);

  // -------------------------------------------------------------------------
  // Test 4: invitee.canceled
  // -------------------------------------------------------------------------
  console.log("\n-> [Test 4] Testing 'invitee.canceled'...");
  const cancelPayload = {
    event: "invitee.canceled",
    payload: {
      email: "enterprise@client.com",
    },
  };

  const req3 = new Request("https://dealsflowai.vercel.app/api/webhooks/calendly", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cancelPayload),
  });

  const res3 = await POST(req3);
  assert.strictEqual(res3.status, 200);
  const data3 = await res3.json();
  assert.strictEqual(data3.success, true);
  console.log("   ✓ Cancellation event acknowledged and recorded.");

  console.log("\n=======================================================");
  console.log("  ALL CALENDLY AUTOMATION TESTS PASSED SUCCESSFULLY!  ");
  console.log("=======================================================\n");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
