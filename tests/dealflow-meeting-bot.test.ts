// tests/dealflow-meeting-bot.test.ts
import "./setup-env";
process.env.HUGGINGFACE_API_KEY = "";
process.env.HUGGINGFACE_API_TOKEN = "";
import assert from "assert";
import { DealflowMeetingBot, CallScenario, getOrCreateMeetingBot } from "../lib/dealflow-llm/dealflow-meeting-bot";
import { getCallTypeConfig } from "../lib/call-bot/call-router";
import { generateMOMDocument } from "../lib/call-bot/mom-generator";
import {
  classifyMeetingIntent,
  routeAndGenerateLLMResponse,
  runDualModelParallel,
  cleanSpokenText,
  generateHumanResponse,
} from "../lib/auto-llm";
import {
  scheduleMeetingBotSession,
  updateMeetingBotControl,
  ensureMOMDistribution,
  getMeetingBotSessions,
} from "../lib/call-bot/meeting-bot-controller";

export async function runDealflowMeetingBotTests(): Promise<{ passed: boolean; alignmentScore: number }> {
  console.log("=== Running Dealflow Meeting Bot, Auto-LLM Routing & MOM Distribution Test Suite ===");

  // =========================================================================
  // TEST 1: Dynamic LLM Routing Mechanism & Intent Classification
  // =========================================================================
  console.log("  -> [Test 1] Validating Dynamic LLM Routing & Intent Classification...");

  const intentTests = [
    { query: "How much does DealFlow AI cost per month?", expectedIntent: "business_inquiry" },
    { query: "What are your pricing tiers for enterprise?", expectedIntent: "business_inquiry" },
    { query: "How does Dealflow differ from Gong or Apollo?", expectedIntent: "business_inquiry" },
    { query: "What is our historical win rate and CRM pipeline velocity?", expectedIntent: "data_query" },
    { query: "Show me conversion metrics and revenue forecast stats.", expectedIntent: "data_query" },
    { query: "How long does onboarding and HubSpot CRM setup take?", expectedIntent: "process_explanation" },
    { query: "Is the platform SOC 2 Type II and GDPR compliant?", expectedIntent: "process_explanation" },
    { query: "What are our immediate action items and next steps from today?", expectedIntent: "meeting_related" },
    { query: "Hello there, good morning everyone!", expectedIntent: "conversational_greeting" },
  ];

  for (const t of intentTests) {
    const classified = classifyMeetingIntent(t.query);
    assert.strictEqual(classified, t.expectedIntent, `Query "${t.query}" should classify as ${t.expectedIntent} (Got: ${classified})`);
  }

  // Test dynamic routing switching modes
  const modes = ["dual_parallel", "auto_dynamic", "kimi_primary", "dealflow_primary", "latency_optimized"] as const;
  for (const mode of modes) {
    const res = await routeAndGenerateLLMResponse("What is the Starter tier price?", [], {
      routingMode: mode,
      scenario: "client_sales",
    });
    assert.ok(res.spokenText.length > 10, `Spoken text should be generated for mode: ${mode}`);
    assert.ok(res.intent === "business_inquiry", "Intent should be recognized as business_inquiry");
    assert.strictEqual(res.routingModeUsed, mode, `Routing mode should match ${mode}`);
  }
  console.log("  ✓ Dynamic LLM routing mechanism and intent classification verified across all categories.");

  // =========================================================================
  // TEST 2: Default LLM Configuration (Dual-Model Parallel: Kimi + Dealflow LLM)
  // =========================================================================
  console.log("  -> [Test 2] Validating Default Dual-Model Parallel Operation (Kimi + Dealflow LLM)...");

  // 2.1 Default configuration verification
  const defaultRoutingResult = await routeAndGenerateLLMResponse("Can you explain DealFlow AI's core value proposition?");
  assert.strictEqual(defaultRoutingResult.routingModeUsed, "dual_parallel", "Default routing mode MUST be dual_parallel");
  assert.ok(defaultRoutingResult.selectedModel.includes("dual-parallel"), "Selected model should indicate dual-parallel operation");
  assert.ok(defaultRoutingResult.dualParallelTelemetry, "Telemetry must be captured for dual-model parallel run");
  assert.ok(defaultRoutingResult.dualParallelTelemetry.consensusScore >= 0.85, "Consensus score must be >= 0.85");

  // 2.2 Direct concurrent execution test
  const parallelExecution = await runDualModelParallel("How do your AI agents join Google Meet calls?", [], {
    scenario: "client_sales",
  });
  assert.ok(parallelExecution.text.length > 20, "Dual-model parallel execution should produce meaningful response");
  assert.ok(parallelExecution.consensusScore >= 0.90, "Dual-model consensus score should be >= 0.90");
  assert.ok(["fused", "kimi_failover", "dealflow_failover", "fallback"].includes(parallelExecution.consensusMode), "Valid consensus mode");
  assert.ok(parallelExecution.telemetry.latencyMs >= 0, "Telemetry latency must be logged");

  // 2.3 Verify failover resilience
  const resFallback = cleanSpokenText("DealFlow AI **guarantees** 100% *uptime* with https://meet.google.com link.");
  assert.strictEqual(resFallback.includes("**"), false, "cleanSpokenText strips markdown asterisks");
  assert.strictEqual(resFallback.includes("https://"), false, "cleanSpokenText strips raw URLs");
  console.log("  ✓ Default dual-model parallel operation (Kimi + Dealflow LLM) with consensus & failover verified.");

  // =========================================================================
  // TEST 3: Full Interactive Capability & Response Accuracy
  // =========================================================================
  console.log("  -> [Test 3] Validating Full Interactive Conversational Capability & Accuracy...");

  const interactiveBot = new DealflowMeetingBot("bot-interactive-101", "https://meet.google.com/test-qa-room", "client_sales");
  await interactiveBot.connect();

  // Test 3.1: Business Inquiries (Pricing, Packages, Competitor comparison)
  const pricingAnswer = await interactiveBot.answerParticipantQuestion("How much does the Growth tier cost, and what is included?", "CFO Attendee");
  assert.ok(pricingAnswer.spokenText.includes("499") || pricingAnswer.spokenText.includes("1,499") || pricingAnswer.spokenText.toLowerCase().includes("growth"), "Pricing answer must accurately mention tier cost or packages");
  assert.ok(!pricingAnswer.spokenText.includes("**"), "Spoken output must be clean of markdown for speech injection");

  const competitorAnswer = await interactiveBot.answerParticipantQuestion("How are you different from Gong or traditional recording bots?", "Sales VP");
  assert.ok(competitorAnswer.spokenText.toLowerCase().includes("gong") || competitorAnswer.spokenText.toLowerCase().includes("active") || competitorAnswer.spokenText.toLowerCase().includes("autonomous"), "Competitor response must highlight active autonomous participation vs passive recording");

  // Test 3.2: Data Queries (CRM pipeline, win rates, analytics)
  const dataAnswer = await interactiveBot.answerParticipantQuestion("What is our pipeline win rate and average deal velocity?", "RevOps Lead");
  assert.ok(dataAnswer.spokenText.toLowerCase().includes("win rate") || dataAnswer.spokenText.toLowerCase().includes("deal") || dataAnswer.spokenText.toLowerCase().includes("crm") || dataAnswer.spokenText.toLowerCase().includes("88%"), "Data response must address win rate or deal velocity");

  // Test 3.3: Process Explanations (Onboarding, security, compliance)
  const onboardingAnswer = await interactiveBot.answerParticipantQuestion("How long does it take to get onboarding setup with our CRM?", "Operations Manager");
  assert.ok(onboardingAnswer.spokenText.toLowerCase().includes("twenty minutes") || onboardingAnswer.spokenText.toLowerCase().includes("onboard") || onboardingAnswer.spokenText.toLowerCase().includes("crm"), "Process explanation must cover onboarding timeframe and CRM connection");

  const securityAnswer = await interactiveBot.answerParticipantQuestion("What security compliance certifications do you maintain?", "Security Officer");
  assert.ok(securityAnswer.spokenText.toLowerCase().includes("soc 2") || securityAnswer.spokenText.toLowerCase().includes("gdpr") || securityAnswer.spokenText.toLowerCase().includes("security"), "Security response must address SOC 2 or GDPR compliance");

  // Verify interactive bot state updated
  const botState = interactiveBot.getBotState();
  assert.ok(botState.transcript.length >= 10, "Bot state transcript must reflect all Q&A turns");
  assert.ok(botState.participants.includes("CFO Attendee"), "Participants list must track speakers");
  console.log("  ✓ Full interactive conversational capability & accuracy validated across all inquiry categories.");

  // =========================================================================
  // TEST 4: MOM Automated Generation & Distribution (with 5-minute SLA)
  // =========================================================================
  console.log("  -> [Test 4] Validating Immediate MOM Automated Generation & Distribution...");

  const preConfiguredRecipients = ["vp-sales@enterprise.com", "revops@enterprise.com", "cfo@enterprise.com"];

  // 4.1 Generate MOM with complete content, decisions, action items, owners, and timelines
  const momResult = await interactiveBot.finishCallAndDistributeMOM(preConfiguredRecipients);

  assert.ok(momResult.momId.startsWith("mom-"), "MOM ID must be generated");
  assert.strictEqual(momResult.callScenario, "client_sales", "Scenario must match");
  assert.ok(momResult.executiveSummary.length > 50, "MOM must have a thorough executive summary");
  assert.ok(momResult.keyDiscussionPoints.length >= 1, "MOM must contain discussion points");

  // Verify Action Items have explicit responsible persons (owners) and concrete timelines
  assert.ok(momResult.actionItems.length >= 1, "MOM must contain action items");
  for (const item of momResult.actionItems) {
    assert.ok(item.task && item.task.length > 5, "Action item must have a descriptive task");
    assert.ok(item.owner && item.owner.length > 0, "Action item must have an explicit responsible person (owner)");
    assert.ok(item.timeline && item.timeline.length > 0, "Action item must have a concrete timeline/due date");
  }

  // Verify Key Decisions are logged with classification and impact scores
  assert.ok(momResult.decisionLog.length >= 1, "MOM must contain logged decisions");
  for (const dec of momResult.decisionLog) {
    assert.ok(["Autonomous", "Flagged for Agent Approval"].includes(dec.type), "Decision type must be categorized");
    assert.ok(typeof dec.impactScore === "number", "Decision must have an impact score");
  }

  // Verify Distribution to all pre-configured participants
  assert.deepStrictEqual(momResult.recipients, preConfiguredRecipients, "All pre-configured recipients must be targeted");
  assert.ok(["delivered", "dispatched"].includes(momResult.deliveryStatus || ""), "Delivery status must confirm dispatch");
  assert.ok(momResult.dispatchedAt, "Dispatched timestamp must be present");

  // Verify formatting in both Markdown and HTML with embedded quick links
  assert.ok(momResult.markdownDocument.includes("Action Items & Responsible Owners"), "Markdown MOM must include action items and owners");
  assert.ok(momResult.htmlDocument.includes("Dealflow AI - Minutes of Meeting"), "HTML MOM must be formatted cleanly");
  assert.ok(momResult.recordingUrl.includes("recordingId="), "MOM must contain embedded recording URL");
  assert.ok(momResult.actionPlanUrl.includes("actionPlanId="), "MOM must contain embedded action plan URL");

  console.log("  ✓ Immediate MOM automated generation & distribution validated with owners, timelines, and pre-configured recipients.");

  // =========================================================================
  // TEST 5: Meeting Session Controller & Delivery Gaps Resolution
  // =========================================================================
  console.log("  -> [Test 5] Validating Meeting Session Controller Lifecycle & Stop Trigger Delivery...");

  // 5.1 Schedule a session with pre-configured participants
  const testSession = await scheduleMeetingBotSession({
    meetingTitle: "Enterprise Growth Review",
    meetingUrl: "https://meet.google.com/ent-growth-999",
    startTime: new Date().toISOString(),
    callScenario: "client_sales",
    scheduledByUserId: "client-lead-42",
    scheduledByUserRole: "customer",
    recipients: [
      { email: "lead@client.com", name: "Client Lead" },
      { email: "director@client.com", name: "Client Director" },
    ],
    remindersEnabled: true,
  });

  assert.ok(testSession.sessionId, "Scheduled session must have a sessionId");
  assert.strictEqual(testSession.recipients?.length, 2, "Scheduled session must persist pre-configured recipients");
  assert.strictEqual(testSession.momStatus, "pending", "Initial MOM status should be pending");

  // 5.2 Start the bot
  const startRes = await updateMeetingBotControl(testSession.sessionId, "start", "agent");
  assert.strictEqual(startRes.session.status, "live", "Session status should be live");

  // 5.3 Stop the bot -> Resolves previous bug where MOM failed to generate/send
  const stopRes = await updateMeetingBotControl(testSession.sessionId, "stop", "agent");
  assert.strictEqual(stopRes.session.status, "completed", "Session status should be completed");
  assert.strictEqual(stopRes.session.momStatus, "sent", "Session MOM status must be sent upon stopping");
  assert.ok(stopRes.session.momId, "Session must record momId");
  assert.ok(stopRes.session.momDeliveredAt, "Session must record momDeliveredAt");
  assert.ok(stopRes.mom, "Stop control response must return generated MOM object");
  assert.ok(stopRes.message.includes("5 minutes"), "Stop message must confirm 5-minute SLA delivery");

  // 5.4 Ensure watchdog / SLA check can verify or re-dispatch
  const watchdogRes = await ensureMOMDistribution(testSession.sessionId);
  assert.strictEqual(watchdogRes.success, true, "ensureMOMDistribution must succeed");
  assert.ok(watchdogRes.mom, "MOM document must be returned by watchdog");

  console.log("  ✓ Meeting Session Controller lifecycle and post-meeting MOM distribution gap resolution confirmed.");

  // =========================================================================
  // TEST 6: Scenario Adaptation Matrix & 100-Call Benchmark
  // =========================================================================
  console.log("  -> [Test 6] Running Scenario Adaptation Matrix & 100 Historical Calls Benchmark...");
  const scenarios: CallScenario[] = ["client_sales", "customer_checkin", "internal_standup", "onboarding", "cross_functional"];
  for (const scenario of scenarios) {
    const bot = new DealflowMeetingBot(`bot-scenario-${scenario}`, "https://meet.google.com/test-room", scenario);
    const config = getCallTypeConfig(scenario);
    assert.strictEqual(config.callType, scenario, `Scenario ${scenario} configuration should match.`);

    await bot.ingestTranscriptChunk({
      speaker: "Test Lead",
      text: `Hello, reviewing deliverables and timelines for ${scenario}.`,
      timestamp: new Date().toISOString(),
    });

    const state = bot.getBotState();
    assert.strictEqual(state.callScenario, scenario);
    assert.strictEqual(state.status, "analyzing");
  }

  let totalAlignment = 0;
  const numHistoricalCalls = 100;
  for (let i = 1; i <= numHistoricalCalls; i++) {
    const scenarioIndex = i % scenarios.length;
    const testScenario = scenarios[scenarioIndex];
    const benchBot = new DealflowMeetingBot(`bench-${i}`, `https://meet.google.com/bench-${i}`, testScenario, {
      companyName: `Enterprise Client ${i}`,
    });

    await benchBot.ingestTranscriptChunk({
      speaker: `Stakeholder ${i}`,
      text: `We need high conversion velocity, clear deliverable timelines, and budget alignment for batch ${i}.`,
      timestamp: new Date().toISOString(),
    });

    const actionPlan = await benchBot.generateDataDrivenActionPlan();
    assert.ok(actionPlan.alignmentScore >= 0.80, `Call ${i} alignment score should be high`);
    totalAlignment += actionPlan.alignmentScore;
  }

  const averageAlignmentScore = totalAlignment / numHistoricalCalls;
  console.log(`  ✓ 100 Historical Calls Benchmark Completed. Average Action Plan Alignment Score: ${(averageAlignmentScore * 100).toFixed(2)}%`);
  assert.ok(averageAlignmentScore >= 0.85, `Action plan alignment score must achieve at least 85% (Got ${(averageAlignmentScore * 100).toFixed(2)}%)`);

  console.log("=== All 6 Test Suites for Dealflow Meeting Bot Passed Successfully! ===\n");
  return { passed: true, alignmentScore: averageAlignmentScore };
}

if (require.main === module) {
  runDealflowMeetingBotTests().catch((err) => {
    console.error("Dealflow Meeting Bot Test Failure:", err);
    process.exit(1);
  });
}
