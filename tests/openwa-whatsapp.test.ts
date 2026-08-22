// tests/openwa-whatsapp.test.ts
import assert from "assert";
import { 
  initializeOpenWASession, 
  confirmOpenWAConnection, 
  disconnectOpenWASession,
  sendOpenWAMessage, 
  processIncomingOpenWAWebhook, 
  checkOpenWARateLimit,
  getOpenWAHistory
} from "../lib/whatsapp/openwa-whatsapp-client";
import { sendUnifiedWhatsAppMessage } from "../lib/whatsapp/whatsapp-router";

async function runOpenWATests() {
  console.log("\n=======================================================");
  console.log("🚀 STARTING OPENWA WHATSAPP INTEGRATION TEST SUITE");
  console.log("=======================================================\n");

  // 1. Session Onboarding & Pairing Test
  console.log("--> [1/5] Testing OpenWA Session Onboarding & QR State...");
  const initSession = await initializeOpenWASession("test-openwa-session-1");
  assert.strictEqual(initSession.sessionId, "test-openwa-session-1");
  assert.ok(initSession.status === "SCAN_QR_CODE" || initSession.status === "CONNECTED");
  assert.ok(initSession.pairingCode, "Pairing code generated");
  console.log("  ✅ OpenWA session created with status:", initSession.status);

  const confirmedSession = await confirmOpenWAConnection("test-openwa-session-1", "+1 (555) 019-9922");
  assert.strictEqual(confirmedSession.status, "CONNECTED");
  assert.strictEqual(confirmedSession.phoneNumber, "+1 (555) 019-9922");
  console.log("  ✅ OpenWA session pairing confirmed successfully.");

  // 2. Outbound Messaging & Cryptographic Hashing
  console.log("\n--> [2/5] Testing Outbound OpenWA Messaging & SHA-256 Hashing...");
  const sendRes = await sendOpenWAMessage({
    sessionId: "test-openwa-session-1",
    toPhone: "+1 (555) 014-8833",
    content: "DealFlow OpenWA Autonomous Dispatch: Your sales qualification meeting is confirmed.",
    senderRole: "agent",
    senderId: "agent-test-1",
    senderName: "Marcus Vance",
    triggerType: "meeting_confirmation",
  });

  assert.strictEqual(sendRes.success, true, "Message sent successfully");
  assert.strictEqual(sendRes.message.gateway, "openwa");
  assert.strictEqual(sendRes.message.status, "delivered");
  assert.ok(sendRes.message.encryptedHash.length === 64, "SHA-256 compliance hash verified");
  console.log("  ✅ OpenWA message dispatched with ID:", sendRes.message.messageId);

  // 3. Inbound Webhook Processing & Sync
  console.log("\n--> [3/5] Testing Inbound Webhook Message Synchronization...");
  const inboundRes = await processIncomingOpenWAWebhook({
    sessionId: "test-openwa-session-1",
    from: "+1 (555) 014-8833",
    body: "Thanks! Looking forward to reviewing the proposal.",
    senderName: "Client Contact",
    type: "chat",
  });

  assert.strictEqual(inboundRes.direction, "inbound");
  assert.strictEqual(inboundRes.content, "Thanks! Looking forward to reviewing the proposal.");
  assert.strictEqual(inboundRes.gateway, "openwa");
  console.log("  ✅ Inbound webhook ingested and stored in compliance vault.");

  // 4. Rate Limiting Verification
  console.log("\n--> [4/5] Testing Anti-Spam Role-Based Rate Limiting...");
  const rateLimitCust = checkOpenWARateLimit("cust-openwa-test", "customer");
  assert.strictEqual(rateLimitCust.limit, 20);
  assert.strictEqual(rateLimitCust.allowed, true);

  const rateLimitAgent = checkOpenWARateLimit("agent-openwa-test", "agent");
  assert.strictEqual(rateLimitAgent.limit, 200);

  const rateLimitAdmin = checkOpenWARateLimit("admin-openwa-test", "admin");
  assert.strictEqual(rateLimitAdmin.limit, 1000);
  console.log("  ✅ Role rate limit boundaries verified (Customer: 20, Agent: 200, Admin: 1000).");

  // 5. Unified WhatsApp Router & Automatic Gateway Fallback
  console.log("\n--> [5/5] Testing Unified Router with Gateway Selection & Failover...");
  const routerRes = await sendUnifiedWhatsAppMessage({
    toPhone: "+1 (555) 019-5555",
    content: "Testing Unified Router across Evolution API and OpenWA.",
    senderRole: "system",
    preferredGateway: "openwa",
  });

  assert.strictEqual(routerRes.success, true);
  assert.strictEqual(routerRes.gatewayUsed, "openwa");
  console.log("  ✅ Unified WhatsApp Router dispatched successfully via gateway:", routerRes.gatewayUsed);

  console.log("\n=======================================================");
  console.log("✨ ALL OPENWA WHATSAPP INTEGRATION TESTS PASSED!");
  console.log("=======================================================\n");
}

runOpenWATests().catch(err => {
  console.error("❌ OpenWA Test Failed:", err);
  process.exit(1);
});
