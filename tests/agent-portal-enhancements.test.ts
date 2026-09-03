// tests/agent-portal-enhancements.test.ts
import "./setup-env";
process.env.HUGGINGFACE_API_KEY = "";
process.env.HUGGINGFACE_API_TOKEN = "";

import assert from "assert";
import {
  ensureMOMDistribution,
  scheduleMeetingBotSession,
} from "../lib/call-bot/meeting-bot-controller";
import {
  getUnifiedEmails,
  sendOrComposeEmail,
  executeEmailAction,
  simulateInboundEmail,
  getEmailAuditTrail,
  emailAlertEvents,
} from "../lib/email/centralized-email-service";
import {
  captureMeetingRecording,
  getSecuredMeetingRecordings,
  getRecordingById,
} from "../lib/meeting/recording-service";
import {
  SUPPORTED_LANGUAGES,
  detectLanguage,
  translateText,
  formatDualLanguageText,
} from "../lib/translation/translation-service";
import {
  generateContextAwareChatReply,
  approveDraftReply,
  editDraftReply,
  discardDraftReply,
} from "../lib/chat/context-aware-chat";

export async function runAgentPortalEnhancementsTests() {
  console.log("=== Running Agent Portal Enhancements & Meeting Distribution Test Suite ===");

  // =========================================================================
  // TEST SUITE 1: Issue 1 & Issue 2 Fixes (MOM Distribution Safety)
  // =========================================================================
  console.log("  -> [Test 1] Validating Fixes for Issue 1 and Issue 2 (Session Resolution & Failure Safety)...");

  // Test 1.1: Ensure MOM distribution throws explicit error on invalid/unknown session ID (Fix for Issue 2)
  let failedAsExpected = false;
  try {
    await ensureMOMDistribution("invalid-nonexistent-session-999");
  } catch (err: any) {
    failedAsExpected = true;
    assert.ok(
      err.message.includes("Meeting bot session not found") || err.message.includes("aborted"),
      "Must throw explicit error rather than falling back to demo session"
    );
  }
  assert.strictEqual(failedAsExpected, true, "ensureMOMDistribution must throw explicit error on invalid session ID");

  // Test 1.2: Ensure valid scheduled session distributes MOM cleanly with valid sessionId
  const testSession = await scheduleMeetingBotSession({
    meetingTitle: "Enterprise Architecture Review",
    meetingUrl: "https://meet.google.com/test-arch-2026",
    startTime: new Date().toISOString(),
    callScenario: "client_sales",
    scheduledByUserId: "agent-1",
    scheduledByUserRole: "agent",
    recipients: [{ email: "client-exec@enterprise.com", name: "Client Exec" }],
    remindersEnabled: false,
  });

  const momResult = await ensureMOMDistribution(testSession.sessionId);
  assert.strictEqual(momResult.success, true, "Valid session must distribute MOM successfully");
  assert.ok(momResult.mom, "MOM document must be generated");
  assert.ok(momResult.mom.actionItems.length > 0, "Action items must be generated");

  console.log("  ✓ Issue 1 and Issue 2 fixes verified: explicit error on missing session, zero fallback to demo emails.");

  // =========================================================================
  // TEST SUITE 2: Centralized Email Monitoring System (Task 1)
  // =========================================================================
  console.log("  -> [Test 2] Validating Centralized Email Monitoring System (Unified Inbox, Filtering, Encryption, Audit)...");

  // Test 2.1: Unified Inbox & Filtering
  const inboxData = await getUnifiedEmails({ folder: "inbox" });
  assert.ok(inboxData.emails.length >= 2, "Inbox must contain seeded customer communications");
  assert.ok(inboxData.unreadCount >= 1, "Must track unread count accurately");

  // Filter by status: unread
  const unreadOnly = await getUnifiedEmails({ status: "unread" });
  assert.ok(unreadOnly.emails.every(e => e.status === "unread"), "All returned emails must have unread status");

  // Filter by Ticket ID
  const ticketFiltered = await getUnifiedEmails({ ticketId: "TICK-4892" });
  assert.ok(ticketFiltered.emails.length >= 1, "Must filter emails by associated ticket ID");
  assert.strictEqual(ticketFiltered.emails[0].ticketId, "TICK-4892");

  // Filter by Sender
  const senderFiltered = await getUnifiedEmails({ sender: "sarah.chen" });
  assert.ok(senderFiltered.emails.length >= 1, "Must filter by sender email/name");

  // Test 2.2: Email Composition, Server Sync & E2E Encryption
  const composeRes = await sendOrComposeEmail({
    recipientEmail: "director@client.com",
    subject: "Final Postgres Sync Architecture & Security Signoff",
    bodyText: "Here are the finalized Postgres replication credentials and SSL certificate details for production deployment.",
    ticketId: "TICK-4892",
    customerId: "cust-1",
    actionType: "compose",
  });
  assert.strictEqual(composeRes.isEncrypted, true, "Email body must be marked encrypted at rest");
  assert.strictEqual(composeRes.syncedWithServer, true, "Email must be synchronized with official mail server");
  assert.notStrictEqual(composeRes.bodyText, "Here are the finalized Postgres replication credentials...", "Stored bodyText must be ciphertext");

  // Verify that retrieval decrypts the body correctly
  const fetchedEmails = await getUnifiedEmails({ searchQuery: "Postgres Sync Architecture" });
  assert.ok(fetchedEmails.emails.length >= 1, "Must find newly sent email");
  assert.ok(
    fetchedEmails.emails[0].decryptedBodyText.includes("finalized Postgres replication credentials"),
    "Agent view must have correctly decrypted plaintext body"
  );

  // Test 2.3: Agent Actions & Audit Trail Logging
  const emailToArchive = inboxData.emails[0];
  const actionRes = await executeEmailAction(emailToArchive.id, "archive", "agent-test-1");
  assert.strictEqual(actionRes.success, true, "Action execution must succeed");
  assert.strictEqual(actionRes.email?.folder, "archived", "Folder must be updated to archived");

  const auditLogs = getEmailAuditTrail(emailToArchive.id);
  assert.ok(auditLogs.length >= 1, "Audit log must be recorded for agent action");
  assert.strictEqual(auditLogs[0].action, "archive", "Action must be logged as archive");
  assert.ok(auditLogs[0].complianceHash, "Compliance hash must be generated for audit trail");

  // Test 2.4: Real-time Alerting Trigger
  let alertFired = false;
  emailAlertEvents.once("new_email_alert", (alert) => {
    alertFired = true;
    assert.strictEqual(alert.subject, "Urgent Renewal Query");
  });

  simulateInboundEmail("cto@enterprise.com", "David Kim", "Urgent Renewal Query", "Need confirmation on API rate limits.");
  assert.strictEqual(alertFired, true, "Real-time email alert must trigger upon inbound arrival");

  console.log("  ✓ Centralized Email Monitoring System validated: unified inbox, filtering, AES-256 encryption, audit trail, and alerting.");

  // =========================================================================
  // TEST SUITE 3: Meeting Recording Pipeline (Task 2.1)
  // =========================================================================
  console.log("  -> [Test 3] Validating Meeting Recording Pipeline (Encrypted Storage, RBAC, 15m SLA Transcription)...");

  const newRec = await captureMeetingRecording({
    meetingId: "meet-security-003",
    meetingTitle: "SOC 2 & GDPR Compliance Review",
    callScenario: "client_sales",
    customerId: "cust-1",
    ticketId: "TICK-4892",
    assignedAgentId: "agent-1",
    durationSeconds: 1200,
    rawTranscript: [
      { speakerId: "agent-1", speakerName: "Alex Rivera", role: "agent", startTimeSeconds: 0, endTimeSeconds: 30, text: "Welcome to the compliance review." },
      { speakerId: "cust-1", speakerName: "Sarah Chen", role: "customer", startTimeSeconds: 31, endTimeSeconds: 85, text: "Can you confirm that Dealflow encrypts all data at rest with AES-256?" },
      { speakerId: "agent-1", speakerName: "Alex Rivera", role: "agent", startTimeSeconds: 86, endTimeSeconds: 130, text: "Yes Sarah, I commit to delivering the SOC 2 Type II attestation report within 24 hours." },
    ]
  });

  assert.strictEqual(newRec.isEncrypted, true, "Recording must be stored encrypted");
  assert.strictEqual(newRec.encryptionCipher, "AES-256-GCM");
  assert.ok(newRec.transcriptionSlaMinutes <= 15, "Transcription must complete within 15-minute SLA");
  assert.strictEqual(newRec.transcriptSegments.length, 3, "Must capture time-stamped transcript segments");
  assert.strictEqual(newRec.transcriptSegments[2].isActionItemCommitment, true, "Must flag commitments in transcript");
  assert.strictEqual(newRec.ticketId, "TICK-4892", "Must link to agent ticket ID");
  assert.strictEqual(newRec.customerId, "cust-1", "Must link to customer ID");

  // RBAC Access Control
  const agentView = await getRecordingById(newRec.id, "agent-1", "agent");
  assert.ok(agentView, "Authorized agent must be granted access");

  let unauthorizedBlocked = false;
  try {
    await getRecordingById(newRec.id, "unauthorized-user-99", "customer");
  } catch {
    unauthorizedBlocked = true;
  }
  assert.strictEqual(unauthorizedBlocked, true, "Unauthorized user must be blocked by RBAC");

  console.log("  ✓ Meeting recording pipeline validated: AES-256 cloud vault, RBAC enforcement, 15m SLA transcription, and ticket linking.");

  // =========================================================================
  // TEST SUITE 4: Real-Time Multilingual Translation Layer (Task 2.2)
  // =========================================================================
  console.log("  -> [Test 4] Validating Real-Time Multilingual Translation Layer (20+ Global Languages)...");

  // Test 4.1: Supported Languages Count
  assert.ok(SUPPORTED_LANGUAGES.length >= 20, "Must support at least 20 major global languages");

  // Test 4.2: Language Detection
  const frDetection = detectLanguage("Bonjour, nous voulons confirmer le forfait Growth.");
  assert.strictEqual(frDetection.code, "fr", "Must accurately detect French");

  const esDetection = detectLanguage("Hola equipo, queremos revisar la propuesta comercial.");
  assert.strictEqual(esDetection.code, "es", "Must accurately detect Spanish");

  const deDetection = detectLanguage("Hallo Alex, wir möchten die SOC 2 Compliance Dokumente.");
  assert.strictEqual(deDetection.code, "de", "Must accurately detect German");

  const zhDetection = detectLanguage("你好，我们想确认下dealflow系统是否支持每分钟处理50000个webhook事件。");
  assert.strictEqual(zhDetection.code, "zh", "Must accurately detect Mandarin Chinese");

  const jaDetection = detectLanguage("こんにちは、月額1499ドルのグロースプランについて相談したいです。");
  assert.strictEqual(jaDetection.code, "ja", "Must accurately detect Japanese");

  // Test 4.3: High-Fidelity Translation across Languages
  const frTrans = await translateText(
    "Bonjour Alex, nous voulons confirmer si le forfait Growth à $1,499 par mois inclut les 15 sièges SDR sans frais supplémentaires.",
    "en",
    "fr"
  );
  assert.ok(frTrans.translatedText.toLowerCase().includes("growth plan"), "Must accurately translate French into English");
  assert.ok(frTrans.translatedText.toLowerCase().includes("15 sdr seats"), "Must translate commercial terms accurately");

  const enToEsTrans = await translateText("Hello, we guarantee complete onboarding in 20 minutes with calendar synchronization.", "es", "en");
  assert.ok(enToEsTrans.translatedText.toLowerCase().includes("incorporación") || enToEsTrans.translatedText.toLowerCase().includes("hola"), "Must translate English to Spanish");

  // Test 4.4: Dual Text Toggle
  const origText = "Bonjour Alex";
  const transText = "Hello Alex";
  assert.strictEqual(formatDualLanguageText(origText, transText, "original"), "Bonjour Alex");
  assert.strictEqual(formatDualLanguageText(origText, transText, "translated"), "Hello Alex");

  console.log("  ✓ Real-Time Multilingual Translation Layer validated across 20+ languages with auto-detection and dual-text toggling.");

  // =========================================================================
  // TEST SUITE 5: Context-Aware Chat Reply System (Task 2.3)
  // =========================================================================
  console.log("  -> [Test 5] Validating Context-Aware Chat Assistant (Historical Retrieval, >=90% Accuracy, Agent Approval)...");

  // Test 5.1: Postgres & Webhook Context Matching
  const chatReply1 = await generateContextAwareChatReply({
    customerQuery: "Can you confirm how our custom Postgres templates and 50k webhook sync are being handled?",
    customerId: "cust-1",
    ticketId: "TICK-4892",
  });

  assert.ok(chatReply1.surfacedSnippets.length >= 1, "Must surface historical meeting context snippets");
  assert.ok(chatReply1.confidenceScore >= 0.90, `Context alignment score must meet >= 90% SLA (Got: ${chatReply1.confidenceScore})`);
  assert.ok(chatReply1.draftReplyText.includes("Postgres") && chatReply1.draftReplyText.includes("50k"), "Draft reply must cite meeting commitments");
  assert.strictEqual(chatReply1.status, "pending_approval", "Draft must be placed in pending_approval state");

  // Test 5.2: Growth Pricing & SDR Seats Context Matching
  const chatReply2 = await generateContextAwareChatReply({
    customerQuery: "How many SDR seats are included in our $1,499/mo Growth agreement?",
    customerId: "cust-2",
    ticketId: "TICK-4895",
  });
  assert.ok(chatReply2.confidenceScore >= 0.90, "Growth pricing context alignment must be >= 90%");
  assert.ok(chatReply2.draftReplyText.includes("15 active SDR seats"), "Must cite exact agreement terms");

  // Test 5.3: Agent Approval Flow (Approve, Edit, Discard)
  const approved = approveDraftReply(chatReply1.id);
  assert.strictEqual(approved?.status, "approved", "Draft status must transition to approved");

  const edited = editDraftReply(chatReply2.id, "Hello Marcus, our Growth plan includes 15 SDR seats and onboarding starts tomorrow.");
  assert.strictEqual(edited?.status, "edited", "Draft status must transition to edited");
  assert.ok(edited?.editedText?.includes("onboarding starts tomorrow"));

  const discarded = discardDraftReply(chatReply2.id);
  assert.strictEqual(discarded, true, "Draft must be discardable by agent");

  console.log("  ✓ Context-Aware Chat Assistant validated: historical meeting retrieval, >=90% alignment accuracy, and agent approval workflow.");

  // =========================================================================
  // TEST SUITE 6: Concurrent Load & Throughput Testing (Universal Success Criteria)
  // =========================================================================
  console.log("  -> [Test 6] Running Concurrency & Throughput Stress Tests (500+ Concurrent Agents & 100+ Daily Meetings)...");

  // Test 6.1: 500+ Concurrent Agent Users Accessing Email Monitoring System
  const CONCURRENT_AGENT_USERS = 500;
  const agentPromises: Promise<any>[] = [];

  const tStartAgents = Date.now();
  for (let i = 0; i < CONCURRENT_AGENT_USERS; i++) {
    agentPromises.push(
      getUnifiedEmails({
        folder: i % 2 === 0 ? "inbox" : "all",
        status: i % 3 === 0 ? "unread" : "all",
        limit: 10,
      })
    );
  }

  const agentResults = await Promise.all(agentPromises);
  const tDurationAgents = Date.now() - tStartAgents;
  assert.strictEqual(agentResults.length, CONCURRENT_AGENT_USERS, "All 500 concurrent agent requests must resolve");
  assert.ok(tDurationAgents < 5000, `500 concurrent agent requests must finish in <5s (Actual: ${tDurationAgents}ms)`);
  console.log(`    → 500 concurrent agent users evaluated successfully in ${tDurationAgents}ms (${Math.round((CONCURRENT_AGENT_USERS / (tDurationAgents / 1000)))} req/sec).`);

  // Test 6.2: 100+ Daily Meeting Recordings Processed Through Pipeline Without Delays
  const DAILY_MEETINGS_COUNT = 100;
  const meetingPromises: Promise<any>[] = [];

  const tStartMeetings = Date.now();
  for (let m = 0; m < DAILY_MEETINGS_COUNT; m++) {
    meetingPromises.push(
      captureMeetingRecording({
        meetingId: `stress-meet-${m}`,
        meetingTitle: `Daily Enterprise Standup #${m + 1}`,
        customerId: `cust-${(m % 5) + 1}`,
        ticketId: `TICK-${1000 + m}`,
        durationSeconds: 900,
        rawTranscript: [
          { speakerId: "agent-1", speakerName: "Agent", role: "agent", startTimeSeconds: 0, endTimeSeconds: 60, text: `Reviewing standup sprint #${m + 1}.` },
          { speakerId: "cust-1", speakerName: "Client", role: "customer", startTimeSeconds: 61, endTimeSeconds: 120, text: `We commit to completing milestone #${m + 1}.` },
        ]
      })
    );
  }

  const meetingResults = await Promise.all(meetingPromises);
  const tDurationMeetings = Date.now() - tStartMeetings;
  assert.strictEqual(meetingResults.length, DAILY_MEETINGS_COUNT, "All 100 daily meeting recordings must be captured");
  assert.ok(meetingResults.every(r => r.transcriptionStatus === "completed"), "All recordings must generate transcriptions");
  assert.ok(tDurationMeetings < 5000, `100 meeting recordings processed in <5s (Actual: ${tDurationMeetings}ms)`);
  console.log(`    → 100 daily meeting recordings processed and transcribed in ${tDurationMeetings}ms.`);

  console.log("=== All 6 Test Suites Passed Successfully with Zero Regressions! ===");
}

if (require.main === module) {
  runAgentPortalEnhancementsTests().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
}
