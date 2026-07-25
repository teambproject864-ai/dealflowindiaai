// tests/call-bot.test.ts

import assert from "assert";
import { 
  getCallTypeConfig, 
  isPricingAllowed, 
  isObjectionHandlingEnabled, 
  CALL_TYPE_CONFIGS 
} from "@/lib/call-bot/call-router";
import { 
  buildSystemPrompt, 
  formatIntakeFormMarkdown 
} from "@/lib/call-bot/prompt-builder";
import { isCallBotEnabled } from "@/lib/call-bot/config";

export async function runCallRouterTests() {
  console.log("Running Call Router Tests...");

  // Test discovery call type config
  const discoveryConfig = getCallTypeConfig("discovery");
  assert.strictEqual(discoveryConfig.callType, "discovery");
  assert.strictEqual(discoveryConfig.allowPricingDiscussion, true);
  assert.strictEqual(discoveryConfig.objectionHandlingEnabled, true);
  assert.strictEqual(discoveryConfig.maxTurnLengthTokens, 250);

  // Test onboarding call type config
  const onboardingConfig = getCallTypeConfig("onboarding");
  assert.strictEqual(onboardingConfig.callType, "onboarding");
  assert.strictEqual(onboardingConfig.allowPricingDiscussion, false);
  assert.strictEqual(onboardingConfig.objectionHandlingEnabled, false);
  assert.strictEqual(onboardingConfig.maxTurnLengthTokens, 200);

  // Test standup call type config
  const standupConfig = getCallTypeConfig("standup");
  assert.strictEqual(standupConfig.callType, "standup");
  assert.strictEqual(standupConfig.maxTurnLengthTokens, 120);

  // Test fallback for unknown call type
  const unknownConfig = getCallTypeConfig("invalid_type_name");
  assert.strictEqual(unknownConfig.callType, "discovery");

  // Test helper functions
  assert.strictEqual(isPricingAllowed("discovery"), true);
  assert.strictEqual(isPricingAllowed("onboarding"), false);
  assert.strictEqual(isObjectionHandlingEnabled("discovery"), true);
  assert.strictEqual(isObjectionHandlingEnabled("onboarding"), false);

  console.log("Call Router Tests passed successfully.");
}

export async function runPromptBuilderTests() {
  console.log("Running Prompt Builder Tests...");

  // Test formatting null/empty intake form
  const emptyFormatted = formatIntakeFormMarkdown(null);
  assert.ok(emptyFormatted.includes("No intake form data provided"));

  // Test formatting valid intake form dictionary
  const sampleData = {
    companyName: "Acme SaaS",
    contactName: "John Doe",
    contactEmail: "john@acme.com",
    industry: "Financial Services",
    employeeCount: "100-250",
    painPoints: ["Manual CRM logging", "Slow outreach response times"],
    goals: "Automate GTM outbound pipeline"
  };

  const formatted = formatIntakeFormMarkdown(sampleData);
  assert.ok(formatted.includes("Acme SaaS"));
  assert.ok(formatted.includes("John Doe"));
  assert.ok(formatted.includes("Financial Services"));
  assert.ok(formatted.includes("Manual CRM logging, Slow outreach response times"));

  // Test buildSystemPrompt for discovery call
  const promptDiscovery = await buildSystemPrompt("discovery");
  assert.ok(promptDiscovery.includes("Praneeth Assist"));
  assert.ok(promptDiscovery.includes("Discovery / Sales Call"));
  assert.ok(promptDiscovery.includes("Pricing Discussion Allowed") && promptDiscovery.includes("Yes"));

  // Test buildSystemPrompt for onboarding call
  const promptOnboarding = await buildSystemPrompt("onboarding");
  assert.ok(promptOnboarding.includes("Customer Onboarding Call"));
  assert.ok(promptOnboarding.includes("Pricing Discussion Allowed") && promptOnboarding.includes("No"));

  console.log("Prompt Builder Tests passed successfully.");
}

export async function runCallBotFeatureFlagTests() {
  console.log("Running Call Bot Feature Flag Tests...");

  const origEnv = process.env.ENABLE_CALL_BOT;

  delete process.env.ENABLE_CALL_BOT;
  assert.strictEqual(isCallBotEnabled(), true, "Should default to true when env var is omitted");

  process.env.ENABLE_CALL_BOT = "true";
  assert.strictEqual(isCallBotEnabled(), true, "Should return true when ENABLE_CALL_BOT='true'");

  process.env.ENABLE_CALL_BOT = "false";
  assert.strictEqual(isCallBotEnabled(), false, "Should return false when ENABLE_CALL_BOT='false'");

  process.env.ENABLE_CALL_BOT = "0";
  assert.strictEqual(isCallBotEnabled(), false, "Should return false when ENABLE_CALL_BOT='0'");

  // Restore original env
  if (origEnv !== undefined) {
    process.env.ENABLE_CALL_BOT = origEnv;
  } else {
    delete process.env.ENABLE_CALL_BOT;
  }

  console.log("Call Bot Feature Flag Tests passed successfully.");
}

export async function runCallBotTestSuite() {
  await runCallRouterTests();
  await runPromptBuilderTests();
  await runCallBotFeatureFlagTests();
}
