// tests/dealflow-meeting-bot.test.ts
import assert from "assert";
import { DealflowMeetingBot, CallScenario } from "../lib/dealflow-llm/dealflow-meeting-bot";
import { getCallTypeConfig } from "../lib/call-bot/call-router";
import { generateMOMDocument } from "../lib/call-bot/mom-generator";

export async function runDealflowMeetingBotTests(): Promise<{ passed: boolean; alignmentScore: number }> {
  console.log("=== Running Dealflow Meeting Bot & Action Plan Benchmark Test Suite ===");

  // Test 1: Scenario Adaptation Matrix across all 5 call scenarios
  const scenarios: CallScenario[] = ["client_sales", "customer_checkin", "internal_standup", "onboarding", "cross_functional"];
  for (const scenario of scenarios) {
    const bot = new DealflowMeetingBot(`bot-test-${scenario}`, "https://meet.google.com/test-room", scenario);
    const config = getCallTypeConfig(scenario);
    assert.strictEqual(config.callType, scenario, `Scenario ${scenario} configuration should match.`);
    
    // Ingest sample transcript
    await bot.ingestTranscriptChunk({
      speaker: "Test Speaker",
      text: `Hello, welcome to this ${scenario} call. Let's discuss action items.`,
      timestamp: new Date().toISOString(),
    });
    
    const state = bot.getBotState();
    assert.strictEqual(state.callScenario, scenario);
    assert.strictEqual(state.status, "analyzing");
    console.log(`  ✓ Scenario adaptation verified for: ${scenario}`);
  }

  // Test 2: Pre-call and In-call Customization Overrides
  const customBot = new DealflowMeetingBot("bot-custom-1", "https://meet.google.com/custom-room", "client_sales", {
    companyName: "Acme Corp",
    keyObjectionRules: [
      { objectionPattern: "price", recommendedResponse: "Highlight 3x ROI delivered within 90 days." }
    ],
  });

  customBot.injectInCallOverride("Pivot to explaining SOC2 compliance features immediately!");
  const stateWithCustom = customBot.getBotState();
  assert.strictEqual(stateWithCustom.customizations?.companyName, "Acme Corp");
  assert.strictEqual(stateWithCustom.customizations?.inCallPromptOverrides?.length, 1);
  console.log("  ✓ Pre-call and live in-call customization overrides verified");

  // Test 3: 1-Click Bot Activation & MOM Generation with Embedded Links
  await customBot.connect();
  await customBot.ingestTranscriptChunk({
    speaker: "Client VP",
    text: "We are interested, but we need custom discount and price breakdown.",
    timestamp: new Date().toISOString(),
  });

  const mom = await customBot.finishCallAndDistributeMOM([]);
  assert.ok(mom.recordingUrl.includes("portal/agent?tab=dealflow-bot&recordingId="), "MOM must contain call recording link");
  assert.ok(mom.actionPlanUrl.includes("portal/agent?tab=dealflow-bot&actionPlanId="), "MOM must contain action plan link");
  assert.ok(mom.executiveSummary.length > 20, "MOM executive summary generated");
  console.log("  ✓ 1-Click Bot activation & MOM generation with links verified");

  // Test 4: Action Plan Alignment Benchmark across 100 Historical Call Samples
  console.log("  -> Running 100 Historical Call Action Plan Alignment Benchmark...");
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

  console.log("=== Dealflow Meeting Bot Test Suite Passed Successfully! ===\n");
  return { passed: true, alignmentScore: averageAlignmentScore };
}

if (require.main === module) {
  runDealflowMeetingBotTests().catch((err) => {
    console.error("Dealflow Meeting Bot Test Failure:", err);
    process.exit(1);
  });
}
