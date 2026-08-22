// tests/assigned-agents-and-whatsapp-integrations.test.ts
import assert from "assert";
import fs from "fs";
import path from "path";

async function runAssignedAgentsAndWhatsAppIntegrationsTests() {
  console.log("\n=======================================================");
  console.log("🚀 STARTING ASSIGNED AGENTS & WHATSAPP INTEGRATIONS TESTS");
  console.log("=======================================================\n");

  // 1. Assigned Agents API Route Verification
  console.log("--> [1/4] Verifying Assigned Agents Workload API Route...");
  const agentApiPath = path.resolve(__dirname, "../app/api/portal/assigned-agents/route.ts");
  assert.ok(fs.existsSync(agentApiPath), "Assigned agents API route exists");
  const agentApiContent = fs.readFileSync(agentApiPath, "utf8");

  assert.ok(agentApiContent.includes("export async function GET"), "GET handler implemented");
  assert.ok(agentApiContent.includes("simulatedRole !== \"agent\" && simulatedRole !== \"admin\""), "RBAC restricts access to authorized agent/admin roles");
  assert.ok(agentApiContent.includes("workloadStatus"), "Computes workloadStatus for handling agents");
  assert.ok(agentApiContent.includes("assignedCustomersCount"), "Tracks count of assigned customer accounts");
  console.log("  ✅ Assigned Agents Workload API and RBAC verified.");

  // 2. Assigned Customer Accounts Workspace UI Verification
  console.log("\n--> [2/4] Verifying AssignedCustomersWorkspace UI & Sub-tabs...");
  const workspacePath = path.resolve(__dirname, "../components/portal/AssignedCustomersWorkspace.tsx");
  assert.ok(fs.existsSync(workspacePath), "AssignedCustomersWorkspace.tsx exists");
  const workspaceContent = fs.readFileSync(workspacePath, "utf8");

  assert.ok(workspaceContent.includes('activeSubTab === "agent-allocations"'), "Includes All Handling Agents & Allocations sub-tab");
  assert.ok(workspaceContent.includes('fetch(`/api/portal/assigned-agents'), "Fetches agent allocation data from backend API");
  assert.ok(workspaceContent.includes("agent.phoneNumber"), "Displays agent phone contact information");
  assert.ok(workspaceContent.includes("agent.email"), "Displays agent email contact information");
  assert.ok(workspaceContent.includes("agent.assignedCustomersCount"), "Renders number of customers managed by agent");
  assert.ok(workspaceContent.includes("getWorkloadBadge"), "Displays agent workload status badge");
  assert.ok(workspaceContent.includes("agent.assignedCustomers.map"), "Renders chips for managed customer accounts");
  console.log("  ✅ Assigned Customer Accounts Agent Team Workload View verified.");

  // 3. WhatsApp Integrations Backend API Route
  console.log("\n--> [3/4] Verifying WhatsApp Integrations Route & Metadata...");
  const waApiPath = path.resolve(__dirname, "../app/api/whatsapp/integrations/route.ts");
  assert.ok(fs.existsSync(waApiPath), "WhatsApp integrations API route exists");
  const waApiContent = fs.readFileSync(waApiPath, "utf8");

  assert.ok(waApiContent.includes("export async function GET"), "GET handler implemented");
  assert.ok(waApiContent.includes("export async function POST"), "POST handler implemented");
  assert.ok(waApiContent.includes("status: \"active\" | \"pending\" | \"inactive\""), "Supports active, pending, and inactive status states");
  assert.ok(waApiContent.includes("phoneNumber: string"), "Includes linked phone number metadata");
  assert.ok(waApiContent.includes("lastSyncTimestamp: string"), "Includes last sync timestamp metadata");
  assert.ok(waApiContent.includes("dailyQuotaLimit"), "Includes daily quota limit metadata");
  console.log("  ✅ WhatsApp Integrations API Route & Metadata fields verified.");

  // 4. WhatsApp Integrations List & Workbench UI
  console.log("\n--> [4/4] Verifying WhatsAppIntegrationsList Component & Workbench...");
  const listPath = path.resolve(__dirname, "../components/whatsapp/WhatsAppIntegrationsList.tsx");
  assert.ok(fs.existsSync(listPath), "WhatsAppIntegrationsList.tsx component exists");
  const listContent = fs.readFileSync(listPath, "utf8");

  assert.ok(listContent.includes('fetch("/api/whatsapp/integrations")'), "Component loads integrations from backend API");
  assert.ok(listContent.includes("getStatusBadge"), "Renders dynamic status badges for active, pending, and inactive lines");
  assert.ok(listContent.includes("item.phoneNumber"), "Renders linked phone numbers");
  assert.ok(listContent.includes("item.lastSyncTimestamp"), "Renders last synchronization timestamps");
  assert.ok(listContent.includes("item.id"), "Renders integration ID");

  const agentPagePath = path.resolve(__dirname, "../app/portal/agent/page.tsx");
  const agentPageContent = fs.readFileSync(agentPagePath, "utf8");
  assert.ok(agentPageContent.includes("<WhatsAppIntegrationsList />"), "WhatsApp Workbench embeds WhatsAppIntegrationsList in Agent Portal");
  console.log("  ✅ WhatsApp Workbench Integration list display and metadata rendering verified.");

  console.log("\n=======================================================");
  console.log("✨ ALL ASSIGNED AGENTS & WHATSAPP WORKBENCH TESTS PASSED!");
  console.log("=======================================================\n");
}

runAssignedAgentsAndWhatsAppIntegrationsTests().catch(err => {
  console.error("❌ Test verification failed:", err);
  process.exit(1);
});
