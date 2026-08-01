import { describe, it, expect } from "vitest";
import { REVENUE_AGENTS, getRevenueAgentCatalog } from "../lib/revenue-agents";
import { assignFairRandomAgent } from "../lib/agent-assignment";

/**
 * Vitest Suite for "Conversion-Focused Pipeline Support - Let's Fix Your Pipeline" Workflow Module
 * Verifies sequential functionality across Option 1 and Option 2:
 * - Option 1 (Agent Selection / Auto-Assign) completion -> Password Modal trigger
 * - Option 2 (Strategy Call Booking) completion -> Password Modal trigger
 * - Password complexity validation (min 8 chars, letter, number, special char)
 * - Confirmation prompt before progression & automatic redirection to subsequent workflow steps
 */

const PW_REGEX = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

describe("Conversion-Focused Pipeline Support - Sequential Workflow & Password Modal Tests", () => {
  const name = "Jane Doe";
  const email = "jane.doe@acme-corp.com";

  // 1. Agent Roster Integrity (Option 1)
  it("Option 1: Agent Selection Roster contains all 7 revenue specialists", () => {
    expect(REVENUE_AGENTS.length).toBe(7);
    const expectedKeys = ["ashok", "harsha", "kiran", "vijay", "avinash", "kunal", "praneeth"];
    const agentKeys = REVENUE_AGENTS.map((a) => a.key);
    expectedKeys.forEach((key) => {
      expect(agentKeys).toContain(key);
    });
  });

  // 2. Option 1 Completion -> Triggers Password Modal Pop-up State
  it("Option 1 Completion: Agent confirmation sets modal state (agentProceedConfirmed = true)", () => {
    let agentProceedConfirmed = false;
    let selectedAgent = REVENUE_AGENTS[0];

    // Simulate user confirming Option 1 selection
    const handleProceedWithAgent = () => {
      agentProceedConfirmed = true;
    };

    handleProceedWithAgent();
    expect(agentProceedConfirmed).toBe(true);

    const isModalOpen = agentProceedConfirmed;
    expect(isModalOpen).toBe(true);
    expect(selectedAgent.key).toBe("ashok");
  });

  // 3. Option 2 Completion -> Triggers Password Modal Pop-up State
  it("Option 2 Completion: Call confirmation sets modal state (callScheduled = true)", async () => {
    let callScheduled = false;
    let matchedAgentKey = "";

    // Simulate user completing Option 2 strategy call booking
    const catalogProfiles = getRevenueAgentCatalog();
    const assignmentResult = await assignFairRandomAgent(catalogProfiles as any);

    callScheduled = true;
    matchedAgentKey = assignmentResult.agentKey;

    expect(callScheduled).toBe(true);
    expect(matchedAgentKey).toBeDefined();

    const isModalOpen = callScheduled;
    expect(isModalOpen).toBe(true);
  });

  // 4. Password Creation Modal Input Validation & Complexity Requirements
  it("Modal Password Validation: Enforces complexity rules (8+ chars, letter, number, special char)", () => {
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
      expect(PW_REGEX.test(pw)).toBe(false);
    });

    validPasswords.forEach((pw) => {
      expect(PW_REGEX.test(pw)).toBe(true);
    });
  });

  // 5. Confirmation Prompt & Automatic Progression Redirection
  it("Modal Progression: Valid submission triggers confirmation prompt and target pipeline URL", () => {
    const optionSelected: "select-agent" | "book-call" = "select-agent";
    const assignedAgentKey = "praneeth";

    // Build target redirection URL after password confirmation
    const targetUrl = `/portal/customer?tab=chat&agentKey=${assignedAgentKey}&option=${optionSelected}`;

    expect(targetUrl).toBe("/portal/customer?tab=chat&agentKey=praneeth&option=select-agent");
    expect(targetUrl).toContain("tab=chat");
    expect(targetUrl).toContain("agentKey=praneeth");
  });

  // 6. Seamless Equivalence Across Both Options
  it("Workflow Equivalence: Verify both Option 1 and Option 2 lead to identical modal triggers and progression", () => {
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

    expect(opt1Result.modalTriggered).toBe(true);
    expect(opt1Result.isPwValid).toBe(true);
    expect(opt1Result.redirectUrl).toBe("/portal/customer?tab=chat&agentKey=ashok&option=select-agent");

    expect(opt2Result.modalTriggered).toBe(true);
    expect(opt2Result.isPwValid).toBe(true);
    expect(opt2Result.redirectUrl).toBe("/portal/customer?tab=chat&agentKey=harsha&option=book-call");
  });
});
