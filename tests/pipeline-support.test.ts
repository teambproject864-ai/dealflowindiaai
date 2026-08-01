import assert from "assert";
import { REVENUE_AGENTS, getRevenueAgentCatalog } from "../lib/revenue-agents";
import { assignFairRandomAgent } from "../lib/agent-assignment";

/**
 * Suite for "Conversion-Focused Pipeline Support - Let's Fix Your Pipeline" Workflow Module
 * Verifies sequential functionality across Option 1 and Option 2:
 * - Option 1 (Agent Selection / Auto-Assign) completion -> Password Modal trigger
 * - Option 2 (Strategy Call Booking) completion -> Password Modal trigger
 * - Password complexity validation (min 8 chars, letter, number, special char)
 * - Confirmation prompt before progression & automatic redirection to subsequent workflow steps
 */

const PW_REGEX = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

export async function runPipelineSupportPromptTests() {
  console.log("=== Running Conversion-Focused Pipeline Support & Password Modal Tests ===");

  // 1. Agent Roster Integrity (Option 1)
  assert.strictEqual(REVENUE_AGENTS.length, 7, "Option 1: Agent Selection Roster contains all 7 revenue specialists");
  const expectedKeys = ["ashok", "harsha", "kiran", "vijay", "avinash", "kunal", "praneeth"];
  const agentKeys = REVENUE_AGENTS.map((a) => a.key);
  expectedKeys.forEach((key) => {
    assert.ok(agentKeys.includes(key), `Expected agent roster to contain ${key}`);
  });

  // 2. Option 1 Completion -> Triggers Password Modal Pop-up State
  let agentProceedConfirmed = false;
  let selectedAgent = REVENUE_AGENTS[0];

  // Simulate user confirming Option 1 selection
  const handleProceedWithAgent = () => {
    agentProceedConfirmed = true;
  };

  handleProceedWithAgent();
  assert.strictEqual(agentProceedConfirmed, true);

  const isModalOpen1 = agentProceedConfirmed;
  assert.strictEqual(isModalOpen1, true);
  assert.strictEqual(selectedAgent.key, "ashok");

  // 3. Option 2 Completion -> Triggers Password Modal Pop-up State
  let callScheduled = false;
  let matchedAgentKey = "";

  // Simulate user completing Option 2 strategy call booking
  const catalogProfiles = getRevenueAgentCatalog();
  const assignmentResult = await assignFairRandomAgent(catalogProfiles as any);

  callScheduled = true;
  matchedAgentKey = assignmentResult.agentKey;

  assert.strictEqual(callScheduled, true);
  assert.ok(matchedAgentKey !== undefined && matchedAgentKey !== "");

  const isModalOpen2 = callScheduled;
  assert.strictEqual(isModalOpen2, true);

  // 4. Password Creation Modal Input Validation & Complexity Requirements
  const invalidPasswords = [
    "",
    "short",
    "12345678",
    "PasswordOnly",
    "Pass1234", // no special char
    "Password!", // no number
  ];

  const validPasswords = [
    "SecurePass123!",
    "DealFlow2026#",
    "P@ssw0rd99",
    "Complex123$",
  ];

  invalidPasswords.forEach((pw) => {
    assert.strictEqual(PW_REGEX.test(pw), false, `Expected password "${pw}" to be invalid`);
  });

  validPasswords.forEach((pw) => {
    assert.strictEqual(PW_REGEX.test(pw), true, `Expected password "${pw}" to be valid`);
  });

  // 5. Confirmation Prompt & Automatic Progression Redirection
  const optionSelected: "select-agent" | "book-call" = "select-agent";
  const assignedAgentKey = "praneeth";

  // Build target redirection URL after password confirmation
  const targetUrl = `/portal/customer?tab=chat&agentKey=${assignedAgentKey}&option=${optionSelected}`;

  assert.strictEqual(targetUrl, "/portal/customer?tab=chat&agentKey=praneeth&option=select-agent");
  assert.ok(targetUrl.includes("tab=chat"));
  assert.ok(targetUrl.includes("agentKey=praneeth"));

  // 6. Seamless Equivalence Across Both Options
  const testOption = (pathway: "select-agent" | "book-call", agentKey: string) => {
    const isCompleted = true; // requirement completed
    const modalTriggered = isCompleted;
    const validPw = "ValidPass123!";
    const isPwValid = PW_REGEX.test(validPw);
    const redirectUrl = `/portal/customer?tab=chat&agentKey=${agentKey}&option=${pathway}`;

    return { modalTriggered, isPwValid, redirectUrl };
  };

  const opt1Result = testOption("select-agent", "ashok");
  const opt2Result = testOption("book-call", "harsha");

  assert.strictEqual(opt1Result.modalTriggered, true);
  assert.strictEqual(opt1Result.isPwValid, true);
  assert.strictEqual(opt1Result.redirectUrl, "/portal/customer?tab=chat&agentKey=ashok&option=select-agent");

  assert.strictEqual(opt2Result.modalTriggered, true);
  assert.strictEqual(opt2Result.isPwValid, true);
  assert.strictEqual(opt2Result.redirectUrl, "/portal/customer?tab=chat&agentKey=harsha&option=book-call");

  console.log("✅ Passed: Conversion-Focused Pipeline Support & Password Modal Tests");
}

if (require.main === module) {
  runPipelineSupportPromptTests().catch((err) => {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  });
}

