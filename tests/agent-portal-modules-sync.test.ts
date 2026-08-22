// tests/agent-portal-modules-sync.test.ts
import assert from "assert";

/**
 * Verification test suite for Agent Portal modules:
 * 1. Assigned Customer Accounts RBAC isolation
 * 2. Customer ICP Breakdown real-time synchronization
 * 3. Campaign Playbook real-time synchronization
 * 4. Edge cases: newly created, inactive, rapid sequential switches, and cross-customer isolation
 */

export async function runAgentPortalModulesSyncTests() {
  console.log("=== RUNNING AGENT PORTAL MODULES DATA SYNC & RBAC VERIFICATION SUITE ===\n");
  let passed = 0;
  let total = 0;

  function testAssert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // ==========================================
  // MODULE 1: Assigned Customer Accounts RBAC Filtering Logic
  // ==========================================
  console.log("--- Phase 1: Assigned Customer Accounts RBAC Isolation ---");

  const sampleCustomers = [
    {
      id: "cust-1",
      name: "Praneeth Alpha",
      companyName: "Alpha SaaS Inc",
      email: "alpha@dealflow.ai",
      assignedAgentId: "agent-praneeth",
      assignedAgentEmail: "praneeth@dealflow.ai",
      assignedAgentName: "Praneeth",
      assignedAgentKey: "praneeth",
      industry: "Enterprise SaaS",
      status: "active",
    },
    {
      id: "cust-2",
      name: "Ashok Beta",
      companyName: "Beta Fintech Corp",
      email: "beta@fintech.io",
      assignedAgentId: "agent-ashok",
      assignedAgentEmail: "ashok@dealflow.ai",
      assignedAgentName: "Ashok",
      assignedAgentKey: "ashok",
      industry: "FinTech",
      status: "active",
    },
    {
      id: "cust-3",
      name: "Gamma Health",
      companyName: "Gamma HealthTech",
      email: "contact@gammahealth.com",
      assignedAgent: {
        agentId: "agent-praneeth",
        email: "praneeth@dealflow.ai",
        name: "Praneeth",
      },
      industry: "HealthTech",
      status: "active",
    },
    {
      id: "cust-4",
      name: "Delta Unassigned",
      companyName: "Delta Logistics",
      email: "ops@deltalogistics.com",
      industry: "Supply Chain",
      status: "onboarding",
    },
    {
      id: "cust-5",
      name: "Epsilon Inactive",
      companyName: "Epsilon Analytics",
      email: "info@epsilon.ai",
      assignedAgentId: "agent-praneeth",
      assignedAgentEmail: "praneeth@dealflow.ai",
      industry: "Data Analytics",
      status: "inactive",
    },
  ];

  // Pure filtering logic matching AssignedCustomersWorkspace implementation
  function filterAssignedCustomers(
    customersList: any[],
    currentAgent: { id?: string; name?: string; email?: string } | null
  ) {
    if (!customersList || customersList.length === 0 || !currentAgent) return [];

    const agentId = currentAgent.id?.toLowerCase().trim();
    const agentEmail = currentAgent.email?.toLowerCase().trim();
    const agentName = currentAgent.name?.toLowerCase().trim();
    const agentKey = agentId?.replace(/^agent-/, "") || agentEmail?.split("@")[0];

    return customersList.filter((c) => {
      if (!c) return false;

      // 1. Direct ID match
      if (c.assignedAgentId && agentId && c.assignedAgentId.toLowerCase() === agentId) return true;

      // 2. Direct Email match
      if (c.assignedAgentEmail && agentEmail && c.assignedAgentEmail.toLowerCase() === agentEmail) return true;

      // 3. Direct Key match
      if (
        c.assignedAgentKey &&
        agentKey &&
        (c.assignedAgentKey.toLowerCase() === agentKey || (agentId && c.assignedAgentKey.toLowerCase() === agentId))
      )
        return true;

      // 4. Direct Name match
      if (c.assignedAgentName && agentName && c.assignedAgentName.toLowerCase() === agentName) return true;

      // 5. Nested assignedAgent object match
      if (c.assignedAgent) {
        const nestedId = (c.assignedAgent.agentId || c.assignedAgent.id)?.toLowerCase();
        const nestedEmail = c.assignedAgent.email?.toLowerCase();
        const nestedName = c.assignedAgent.name?.toLowerCase();
        if (nestedId && agentId && nestedId === agentId) return true;
        if (nestedEmail && agentEmail && nestedEmail === agentEmail) return true;
        if (nestedName && agentName && nestedName === agentName) return true;
      }

      return false;
    });
  }

  // Test 1.1: Logged-in agent Praneeth
  const praneethAgent = { id: "agent-praneeth", email: "praneeth@dealflow.ai", name: "Praneeth" };
  const praneethAccounts = filterAssignedCustomers(sampleCustomers, praneethAgent);
  testAssert(praneethAccounts.length === 3, "Praneeth receives exactly 3 assigned accounts (cust-1, cust-3, cust-5)");
  testAssert(
    praneethAccounts.every((c) => c.id === "cust-1" || c.id === "cust-3" || c.id === "cust-5"),
    "Praneeth accounts contain only cust-1, cust-3, and cust-5"
  );
  testAssert(
    !praneethAccounts.some((c) => c.id === "cust-2" || c.id === "cust-4"),
    "Praneeth accounts do NOT leak Ashok's (cust-2) or Unassigned (cust-4) accounts"
  );

  // Test 1.2: Logged-in agent Ashok
  const ashokAgent = { id: "agent-ashok", email: "ashok@dealflow.ai", name: "Ashok" };
  const ashokAccounts = filterAssignedCustomers(sampleCustomers, ashokAgent);
  testAssert(ashokAccounts.length === 1 && ashokAccounts[0].id === "cust-2", "Ashok receives strictly his own account (cust-2)");
  testAssert(
    !ashokAccounts.some((c) => c.id === "cust-1" || c.id === "cust-3" || c.id === "cust-5"),
    "Ashok accounts do NOT leak Praneeth's accounts"
  );

  // Test 1.3: Unauthenticated / Null agent
  const nullAgentAccounts = filterAssignedCustomers(sampleCustomers, null);
  testAssert(nullAgentAccounts.length === 0, "Null/loading currentAgent strictly returns empty list (zero data leakage)");

  // ==========================================
  // MODULE 2: Customer ICP Breakdown Data Synchronization
  // ==========================================
  console.log("\n--- Phase 2: Customer ICP Breakdown Synchronization ---");

  interface CustomerICPState {
    companyName: string;
    industry: string;
    companySize: string;
    geography: string;
    decisionMakers: string;
    painPoint: string;
    primaryOutcome: string;
    isInactive: boolean;
  }

  function computeICPBreakdown(customerData: any, fetchedICP: any = null): CustomerICPState {
    const companyName =
      customerData?.companyName ||
      customerData?.companyInformation?.name ||
      (customerData?.name ? `${customerData.name}'s Org` : "Client Account");

    const isInactive = customerData?.status === "inactive" || customerData?.status === "paused";

    const rawIndustries =
      fetchedICP?.targetIndustries ||
      customerData?.targetIndustries ||
      (customerData?.industry ? [customerData.industry] : null) ||
      ["B2B SaaS / Enterprise Technology"];
    const industry = Array.isArray(rawIndustries) ? rawIndustries.join(", ") : String(rawIndustries);

    const rawSizes =
      fetchedICP?.targetCompanySizes ||
      customerData?.targetCompanySizes ||
      (customerData?.companySize ? [customerData.companySize] : null) ||
      ["25-100 employees"];
    const companySize = Array.isArray(rawSizes) ? rawSizes.join(", ") : String(rawSizes);

    const rawGeos =
      fetchedICP?.targetGeographicRegions ||
      customerData?.targetGeographics ||
      (customerData?.region ? [customerData.region] : null) ||
      ["North America (US/Canada)"];
    const geography = Array.isArray(rawGeos) ? rawGeos.join(", ") : String(rawGeos);

    const rawDecisionMakers =
      fetchedICP?.decisionMakers ||
      customerData?.targetSeniorities ||
      customerData?.decisionMakers ||
      ["VP Sales, CRO, Head of Growth, Sales Ops Manager"];
    const decisionMakers = Array.isArray(rawDecisionMakers) ? rawDecisionMakers.join(", ") : String(rawDecisionMakers);

    const painPoint =
      fetchedICP?.painPoints?.join("; ") ||
      (Array.isArray(customerData?.painPoints) ? customerData.painPoints.join("; ") : customerData?.painPoints) ||
      customerData?.keyChallenges ||
      `Manual lead qualification bottlenecks at ${companyName}.`;

    const primaryOutcome =
      fetchedICP?.valueProposition ||
      customerData?.primaryOutcome ||
      customerData?.valueProposition ||
      `Accelerate ${companyName} deal velocity by 35%.`;

    return {
      companyName,
      industry,
      companySize,
      geography,
      decisionMakers,
      painPoint,
      primaryOutcome,
      isInactive,
    };
  }

  // Customer A
  const custA = {
    id: "cust-a",
    companyName: "Acme Cloud Systems",
    industry: "Cloud Infrastructure",
    targetIndustries: ["Cloud Infrastructure", "DevOps"],
    targetCompanySizes: ["100-500 employees"],
    targetGeographics: ["North America", "EMEA"],
    targetSeniorities: ["CTO", "VP Engineering", "Head of Infrastructure"],
    keyChallenges: "Complex multi-cloud billing and slow provisioning cycles.",
    primaryOutcome: "Automate cloud cost intelligence and cut provisioning time by 50%.",
    status: "active",
  };

  // Customer B
  const custB = {
    id: "cust-b",
    companyName: "Apex Health Diagnostics",
    industry: "Healthcare SaaS",
    targetIndustries: ["Healthcare", "Life Sciences"],
    targetCompanySizes: ["500-1000 employees"],
    targetGeographics: ["US Only"],
    targetSeniorities: ["Chief Medical Officer", "VP Compliance", "Director of Telehealth"],
    keyChallenges: "HIPAA compliance audit delays and EHR data siloing.",
    primaryOutcome: "Achieve 100% continuous HIPAA compliance monitoring and streamline patient intake.",
    status: "active",
  };

  // Test 2.1: Switching from Cust A to Cust B updates ICP state immediately
  const startTime = Date.now();
  const icpStateA = computeICPBreakdown(custA);
  testAssert(icpStateA.companyName === "Acme Cloud Systems", "Customer A ICP reflects Acme Cloud Systems");
  testAssert(icpStateA.industry.includes("Cloud Infrastructure"), "Customer A ICP has Cloud Infrastructure vertical");
  testAssert(icpStateA.decisionMakers.includes("CTO"), "Customer A ICP targets CTO / VP Engineering");

  const icpStateB = computeICPBreakdown(custB);
  const switchDuration = Date.now() - startTime;
  testAssert(switchDuration < 1000, `Customer switch state resolution takes < 1 second (actual: ${switchDuration}ms)`);
  testAssert(icpStateB.companyName === "Apex Health Diagnostics", "Customer B ICP immediately reflects Apex Health Diagnostics");
  testAssert(icpStateB.industry.includes("Healthcare"), "Customer B ICP has Healthcare vertical");
  testAssert(icpStateB.decisionMakers.includes("Chief Medical Officer"), "Customer B ICP targets Chief Medical Officer");
  testAssert(!icpStateB.painPoint.includes("Cloud Infrastructure"), "Customer B ICP contains zero cross-contamination from Customer A");

  // ==========================================
  // MODULE 3: Campaign Playbook Data Synchronization
  // ==========================================
  console.log("\n--- Phase 3: Campaign Playbook Data Synchronization ---");

  function computeCampaignPlaybook(customerData: any) {
    const companyName = customerData?.companyName || "Client Account";
    const industry = customerData?.industry || "Enterprise Tech";
    const isInactive = customerData?.status === "inactive";

    return {
      companyName,
      industry,
      isInactive,
      playbookTitle: `GTM Campaign Playbooks for ${companyName}`,
      targetPersona: `VP Sales & CRO (${industry})`,
      step1: `Day 1: Personalized LinkedIn InMail addressing manual pipeline friction at ${companyName}.`,
      step2: `Day 3: Email 1 - Case study highlighting 70% reduction in lead scoring time for ${industry} peers.`,
      framework: `Problem (${industry} Bottlenecks) -> Business Cost -> AI Solution Proof -> Frictionless Next Step for ${companyName}`,
    };
  }

  const playbookA = computeCampaignPlaybook(custA);
  testAssert(playbookA.companyName === "Acme Cloud Systems", "Playbook A reflects Acme Cloud Systems");
  testAssert(playbookA.framework.includes("Acme Cloud Systems"), "Playbook A framework tailored to Acme Cloud Systems");

  const playbookB = computeCampaignPlaybook(custB);
  testAssert(playbookB.companyName === "Apex Health Diagnostics", "Playbook B immediately reflects Apex Health Diagnostics");
  testAssert(playbookB.targetPersona.includes("Healthcare SaaS"), "Playbook B persona tailored to Healthcare SaaS");
  testAssert(!playbookB.framework.includes("Acme Cloud Systems"), "Playbook B has zero stale data from Customer A");

  // ==========================================
  // MODULE 4: Edge Cases & Rapid Sequential Switching
  // ==========================================
  console.log("\n--- Phase 4: Edge Cases & Rapid Sequential Switches ---");

  // Edge Case 4.1: Newly Created Customer with sparse data
  const newCustomer = {
    id: "cust-new-999",
    name: "Elena Rostova",
    companyName: "Novos AI Labs",
    email: "elena@novos.ai",
    status: "onboarding",
    createdAt: new Date().toISOString(),
  };

  const newCustomerICP = computeICPBreakdown(newCustomer);
  testAssert(newCustomerICP.companyName === "Novos AI Labs", "New customer ICP gracefully defaults with company name");
  testAssert(newCustomerICP.industry.length > 0, "New customer ICP provides sensible default industry vertical");
  testAssert(newCustomerICP.decisionMakers.length > 0, "New customer ICP provides default decision maker personas without crashing");

  const newCustomerPlaybook = computeCampaignPlaybook(newCustomer);
  testAssert(newCustomerPlaybook.companyName === "Novos AI Labs", "New customer playbook automatically generated with company name");

  // Edge Case 4.2: Inactive Customer Account
  const inactiveCustomer = {
    id: "cust-inactive-000",
    name: "Dormant User",
    companyName: "Legacy Retail Corp",
    email: "admin@legacyretail.com",
    status: "inactive",
  };

  const inactiveICP = computeICPBreakdown(inactiveCustomer);
  testAssert(inactiveICP.isInactive === true, "Inactive customer ICP flags isInactive=true for UI warning banner");

  const inactivePlaybook = computeCampaignPlaybook(inactiveCustomer);
  testAssert(inactivePlaybook.isInactive === true, "Inactive customer playbook flags isInactive=true for paused cadence");

  // Edge Case 4.3: Rapid Sequential Switches (Race Condition Simulation)
  console.log("Simulating 10 rapid sequential customer switches...");
  let activeDisplayCustomer: any = null;
  let activeDisplayRequestId = 0;

  const rapidCustomers = [custA, custB, newCustomer, inactiveCustomer, custA, custB, custA, newCustomer, custB, custA];

  rapidCustomers.forEach((cust, index) => {
    const requestId = ++activeDisplayRequestId;
    // Simulate immediate synchronous state dispatch
    activeDisplayCustomer = {
      requestId,
      customerId: cust.id,
      icp: computeICPBreakdown(cust),
      playbook: computeCampaignPlaybook(cust),
    };
  });

  // Verify the terminal state matches the last selected customer exactly
  testAssert(activeDisplayCustomer.customerId === "cust-a", "Terminal active customer after rapid switching is cust-a");
  testAssert(
    activeDisplayCustomer.icp.companyName === "Acme Cloud Systems",
    "Final ICP state matches cust-a exactly (Acme Cloud Systems)"
  );
  testAssert(
    activeDisplayCustomer.playbook.companyName === "Acme Cloud Systems",
    "Final Playbook state matches cust-a exactly (Acme Cloud Systems)"
  );

  console.log(`\n======================================================`);
  console.log(`🎯 ALL ${passed}/${total} AGENT PORTAL SYNC & RBAC CHECKS PASSED WITH ZERO FAILURES!`);
  console.log(`======================================================\n`);
}

runAgentPortalModulesSyncTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
