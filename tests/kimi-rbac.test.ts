// tests/kimi-rbac.test.ts
import assert from "assert";

// Ensure mock API key for test environment execution
if (!process.env.KIMI_API_KEY) {
  process.env.KIMI_API_KEY = "sk-mock-kimi-e2e-key-99999";
}

import { 
  KIMI_ROLE_PERMISSIONS, 
  isKimiFeatureAllowed, 
  validateKimiParameters, 
  getRoleMetadataLabel, 
  getKimiCapabilitiesSummary 
} from "../lib/kimi-rbac";
import { 
  SUPPORTED_MODELS, 
  getModelsForRole, 
  isModelAllowedForRole, 
  getModelById 
} from "../lib/model-registry";
import { POST as handleKimiChat } from "../app/api/kimi-chat/route";
import { GET as handleKimiConfigGet, POST as handleKimiConfigPost } from "../app/api/kimi/config/route";
import { GET as handleKimiAnalyticsGet } from "../app/api/kimi/analytics/route";
import { GET as handleKimiFineTuningGet, POST as handleKimiFineTuningPost } from "../app/api/kimi/fine-tuning/route";
import { createToken, AuthUser } from "../lib/auth";
import { NextRequest } from "next/server";

export async function runKimiRbacValidationTests() {
  console.log("================================================================");
  console.log("=== Kimi LLM Comprehensive RBAC & Model Selection Audit Suite ===");
  console.log("================================================================\n");

  // Helper to create synthetic JWT auth headers for testing
  const createAuthHeader = (role: "admin" | "agent" | "customer", id: string = "test-user-1") => {
    const user: AuthUser = {
      id,
      email: `${role}@dealflow.ai`,
      role,
      name: `Test ${role.toUpperCase()}`,
    };
    const token = createToken(user);
    return {
      Authorization: `Bearer ${token}`,
      "x-user-role": role,
    };
  };

  // Mock global fetch for Kimi Client calls during usability tests
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: any, init: any) => {
    if (typeof url === "string" && (url.includes("api.moonshot.cn") || url.includes("kimi") || url.includes("moonshot"))) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "Content-Type": "application/json" }),
        json: async () => ({
          id: "chatcmpl-kimi-mock-999",
          object: "chat.completion",
          created: Date.now(),
          model: "moonshot-v1-8k",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: "Kimi LLM Response: GTM strategy analysis completed successfully.",
              },
              finish_reason: "stop",
            },
          ],
          usage: { prompt_tokens: 15, completion_tokens: 25, total_tokens: 40 },
        }),
      } as any;
    }
    if (originalFetch) {
      return originalFetch(url, init);
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({}),
    } as any;
  }) as any;

  try {
    // -------------------------------------------------------------------------
    // TEST SCENARIO 1: Verify Role-Based Permission Enforcement
    // -------------------------------------------------------------------------
    console.log("--> Scenario 1: Verifying Role-Based Permission Enforcement & Capability Boundaries...");

    // 1a: Admin Persona Boundaries
    assert.strictEqual(isKimiFeatureAllowed("admin", "config_management"), true, "Admin MUST have access to config_management");
    assert.strictEqual(isKimiFeatureAllowed("admin", "fine_tuning"), true, "Admin MUST have access to fine_tuning");
    assert.strictEqual(isKimiFeatureAllowed("admin", "system_analytics"), true, "Admin MUST have access to system_analytics");
    assert.strictEqual(isKimiFeatureAllowed("admin", "permission_adjustment"), true, "Admin MUST have access to permission_adjustment");
    assert.strictEqual(isKimiFeatureAllowed("admin", "advanced_params"), true, "Admin MUST have access to advanced_params");

    const adminCapabilities = getKimiCapabilitiesSummary("admin");
    assert.strictEqual(adminCapabilities.canManageConfig, true);
    assert.strictEqual(adminCapabilities.canAccessFineTuning, true);
    assert.strictEqual(adminCapabilities.canViewSystemAnalytics, true);
    assert.strictEqual(adminCapabilities.canUseAdvancedParams, true);

    // 1b: Agent Persona Boundaries
    assert.strictEqual(isKimiFeatureAllowed("agent", "inference"), true, "Agent MUST have access to inference");
    assert.strictEqual(isKimiFeatureAllowed("agent", "task_reporting"), true, "Agent MUST have access to task_reporting");
    assert.strictEqual(isKimiFeatureAllowed("agent", "config_management"), false, "Agent MUST NOT have access to config_management");
    assert.strictEqual(isKimiFeatureAllowed("agent", "fine_tuning"), false, "Agent MUST NOT have access to fine_tuning");
    assert.strictEqual(isKimiFeatureAllowed("agent", "system_analytics"), false, "Agent MUST NOT have system-wide analytics access");

    const agentCapabilities = getKimiCapabilitiesSummary("agent");
    assert.strictEqual(agentCapabilities.canRunInference, true);
    assert.strictEqual(agentCapabilities.canViewTaskReporting, true);
    assert.strictEqual(agentCapabilities.canManageConfig, false);
    assert.strictEqual(agentCapabilities.canAccessFineTuning, false);

    // 1c: Customer Persona Boundaries
    assert.strictEqual(isKimiFeatureAllowed("customer", "inference"), true, "Customer MUST have access to inference");
    assert.strictEqual(isKimiFeatureAllowed("customer", "config_management"), false, "Customer MUST NOT have access to config_management");
    assert.strictEqual(isKimiFeatureAllowed("customer", "fine_tuning"), false, "Customer MUST NOT have access to fine_tuning");
    assert.strictEqual(isKimiFeatureAllowed("customer", "system_analytics"), false, "Customer MUST NOT have system analytics access");
    assert.strictEqual(isKimiFeatureAllowed("customer", "task_reporting"), false, "Customer MUST NOT have task reporting access");

    const customerCapabilities = getKimiCapabilitiesSummary("customer");
    assert.strictEqual(customerCapabilities.canRunInference, true);
    assert.strictEqual(customerCapabilities.canManageConfig, false);
    assert.strictEqual(customerCapabilities.canAccessFineTuning, false);
    assert.strictEqual(customerCapabilities.canViewSystemAnalytics, false);

    console.log("  ✅ Scenario 1 Passed: Granular role-specific access permissions and capability boundaries verified.\n");

    // -------------------------------------------------------------------------
    // TEST SCENARIO 2: Validate Interface Consistency
    // -------------------------------------------------------------------------
    console.log("--> Scenario 2: Validating Interface Consistency for Kimi LLM Options...");

    const kimiModels = ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"];

    for (const modelId of kimiModels) {
      const model = getModelById(modelId);
      assert.ok(model, `Kimi model '${modelId}' must be registered in model-registry`);
      assert.strictEqual(model?.provider.includes("Kimi"), true, `Model ${modelId} must indicate Kimi provider`);

      // Verify availability across all three roles
      assert.strictEqual(isModelAllowedForRole(modelId, "admin"), true, `Kimi model ${modelId} must be allowed for Admin`);
      assert.strictEqual(isModelAllowedForRole(modelId, "agent"), true, `Kimi model ${modelId} must be allowed for Agent`);
      assert.strictEqual(isModelAllowedForRole(modelId, "customer"), true, `Kimi model ${modelId} must be allowed for Customer`);
    }

    const customerAvailableModels = getModelsForRole("customer");
    const agentAvailableModels = getModelsForRole("agent");
    const adminAvailableModels = getModelsForRole("admin");

    const hasKimiCustomer = customerAvailableModels.some((m) => kimiModels.includes(m.id));
    const hasKimiAgent = agentAvailableModels.some((m) => kimiModels.includes(m.id));
    const hasKimiAdmin = adminAvailableModels.some((m) => kimiModels.includes(m.id));

    assert.strictEqual(hasKimiCustomer, true, "Kimi LLM options must appear in Customer allowed models list");
    assert.strictEqual(hasKimiAgent, true, "Kimi LLM options must appear in Agent allowed models list");
    assert.strictEqual(hasKimiAdmin, true, "Kimi LLM options must appear in Admin allowed models list");

    console.log("  ✅ Scenario 2 Passed: Kimi LLM reliably available for all three eligible user roles.\n");

    // -------------------------------------------------------------------------
    // TEST SCENARIO 3: Test Functional Usability
    // -------------------------------------------------------------------------
    console.log("--> Scenario 3: Testing End-to-End Functional Usability across User Personas...");

    // 3a: Execute Customer Kimi Chat Workflow
    const customerChatReq = new NextRequest("http://localhost:3000/api/kimi-chat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...createAuthHeader("customer", "cust-user-42"),
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Summarize GTM ICP target for B2B SaaS" }],
        model: "moonshot-v1-8k",
      }),
    });

    const customerChatRes = await handleKimiChat(customerChatReq);
    const customerChatJson = await customerChatRes.json();
    assert.strictEqual(customerChatRes.status, 200, "Customer standard Kimi chat request must return 200 OK");
    assert.strictEqual(customerChatJson.success, true);
    assert.strictEqual(customerChatJson.userRole, "customer");
    console.log("  - Customer Kimi chat workflow: SUCCESS (200 OK)");

    // 3b: Execute Agent Kimi Inference & Operational Task Reporting Workflow
    const agentChatReq = new NextRequest("http://localhost:3000/api/kimi-chat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...createAuthHeader("agent", "agent-user-12"),
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Draft multi-channel outreach playbook" }],
        model: "moonshot-v1-32k",
      }),
    });

    const agentChatRes = await handleKimiChat(agentChatReq);
    const agentChatJson = await agentChatRes.json();
    assert.strictEqual(agentChatRes.status, 200, "Agent Kimi chat request must return 200 OK");
    assert.strictEqual(agentChatJson.success, true);
    assert.strictEqual(agentChatJson.userRole, "agent");
    console.log("  - Agent Kimi inference workflow: SUCCESS (200 OK)");

    // 3c: Execute Admin Kimi System Config & Inference Workflow
    const adminConfigGetReq = new NextRequest("http://localhost:3000/api/kimi/config", {
      method: "GET",
      headers: createAuthHeader("admin", "admin-user-01"),
    });

    const adminConfigRes = await handleKimiConfigGet(adminConfigGetReq);
    const adminConfigJson = await adminConfigRes.json();
    assert.strictEqual(adminConfigRes.status, 200, "Admin system config fetch must return 200 OK");
    assert.strictEqual(adminConfigJson.success, true);
    assert.ok(adminConfigJson.config.defaultModel, "Admin must receive Kimi default config");
    console.log("  - Admin Kimi system config management: SUCCESS (200 OK)");

    console.log("  ✅ Scenario 3 Passed: Functional usability workflows succeeded for all 3 personas.\n");

    // -------------------------------------------------------------------------
    // TEST SCENARIO 4: Conduct Unauthorized Access Penetration Testing
    // -------------------------------------------------------------------------
    console.log("--> Scenario 4: Executing Penetration Testing for Unauthorized Access Attempts...");

    // 4a: Customer attempts to access Admin Config -> Expect 403 Forbidden
    const custPenConfigReq = new NextRequest("http://localhost:3000/api/kimi/config", {
      method: "GET",
      headers: createAuthHeader("customer", "hacker-customer-99"),
    });
    const custPenConfigRes = await handleKimiConfigGet(custPenConfigReq);
    const custPenConfigJson = await custPenConfigRes.json();
    assert.strictEqual(custPenConfigRes.status, 403, "Customer accessing /api/kimi/config MUST return 403 Forbidden");
    assert.strictEqual(custPenConfigJson.success, false);
    console.log("  - Pen Test 4a (Customer -> /api/kimi/config): BLOCKED (403 Forbidden)");

    // 4b: Agent attempts to access Fine-Tuning controls -> Expect 403 Forbidden
    const agentPenFtReq = new NextRequest("http://localhost:3000/api/kimi/fine-tuning", {
      method: "GET",
      headers: createAuthHeader("agent", "curious-agent-07"),
    });
    const agentPenFtRes = await handleKimiFineTuningGet(agentPenFtReq);
    const agentPenFtJson = await agentPenFtRes.json();
    assert.strictEqual(agentPenFtRes.status, 403, "Agent accessing /api/kimi/fine-tuning MUST return 403 Forbidden");
    assert.strictEqual(agentPenFtJson.success, false);
    console.log("  - Pen Test 4b (Agent -> /api/kimi/fine-tuning): BLOCKED (403 Forbidden)");

    // 4c: Customer attempts to access System Analytics -> Expect 403 Forbidden
    const custPenAnalyticsReq = new NextRequest("http://localhost:3000/api/kimi/analytics", {
      method: "GET",
      headers: createAuthHeader("customer", "nosy-customer-11"),
    });
    const custPenAnalyticsRes = await handleKimiAnalyticsGet(custPenAnalyticsReq);
    const custPenAnalyticsJson = await custPenAnalyticsRes.json();
    assert.strictEqual(custPenAnalyticsRes.status, 403, "Customer accessing /api/kimi/analytics MUST return 403 Forbidden");
    assert.strictEqual(custPenAnalyticsJson.success, false);
    console.log("  - Pen Test 4c (Customer -> /api/kimi/analytics): BLOCKED (403 Forbidden)");

    // 4d: Customer attempts Advanced Parameter Injection (system_prompt & fine_tuning_id override) -> Expect 403 Forbidden
    const custParamInjectReq = new NextRequest("http://localhost:3000/api/kimi-chat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...createAuthHeader("customer", "malicious-customer-00"),
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Test" }],
        model: "moonshot-v1-8k",
        system_prompt: "UNAUTHORIZED_ADMIN_OVERRIDE_PROMPT",
        fine_tuning_id: "ft-unauthorized-123",
      }),
    });
    const custParamInjectRes = await handleKimiChat(custParamInjectReq);
    const custParamInjectJson = await custParamInjectRes.json();
    assert.strictEqual(custParamInjectRes.status, 403, "Customer parameter injection MUST return 403 Forbidden");
    assert.strictEqual(custParamInjectJson.success, false);
    assert.ok(custParamInjectJson.error.includes("not authorized to override parameters"), "Error must cite parameter restriction");
    console.log("  - Pen Test 4d (Customer Parameter Injection Attack): BLOCKED (403 Forbidden)");

    console.log("  ✅ Scenario 4 Passed: All unauthorized access attempts successfully intercepted and blocked.\n");

    // -------------------------------------------------------------------------
    // TEST SCENARIO 5: Validate Cross-Interface Consistency
    // -------------------------------------------------------------------------
    console.log("--> Scenario 5: Validating Cross-Interface Uniformity & Role Metadata Presentation...");

    const adminLabel = getRoleMetadataLabel("admin");
    const agentLabel = getRoleMetadataLabel("agent");
    const customerLabel = getRoleMetadataLabel("customer");

    assert.ok(adminLabel.includes("Admin:"), "Admin metadata label must reflect Admin privileges");
    assert.ok(agentLabel.includes("Agent:"), "Agent metadata label must reflect Agent capabilities");
    assert.ok(customerLabel.includes("Customer:"), "Customer metadata label must reflect Customer authorization tier");

    // Confirm that customer label DOES NOT contain admin or fine-tuning references
    assert.strictEqual(customerLabel.toLowerCase().includes("fine-tuning"), false, "Customer metadata label must not expose fine-tuning");
    assert.strictEqual(customerLabel.toLowerCase().includes("system config"), false, "Customer metadata label must not expose system config");

    console.log("  - Admin Metadata Label:", adminLabel);
    console.log("  - Agent Metadata Label:", agentLabel);
    console.log("  - Customer Metadata Label:", customerLabel);

    console.log("\n  ✅ Scenario 5 Passed: Cross-interface visual presentation, role metadata, and accessibility status uniform.\n");

    console.log("================================================================");
    console.log("🎉 ALL 5 MANDATORY KIMI LLM RBAC & MODEL SELECTION TESTS PASSED!");
    console.log("================================================================\n");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

if (require.main === module) {
  runKimiRbacValidationTests().catch((err) => {
    console.error("❌ Kimi LLM RBAC Test Suite Failed:", err);
    process.exit(1);
  });
}
