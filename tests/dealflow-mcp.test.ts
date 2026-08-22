// tests/dealflow-mcp.test.ts
import assert from "assert";
import { 
  DealflowMCPServer, 
  DealflowMCPClient, 
  LocalTransport,
  DEALFLOW_STANDARD_TOOLS 
} from "../lib/mcp";

async function runDealflowMCPTests() {
  console.log("\n=======================================================");
  console.log("🚀 STARTING DEALFLOW MCP COMPLIANCE & FRAMEWORK TEST SUITE");
  console.log("=======================================================\n");

  const server = new DealflowMCPServer("Dealflow Production MCP Server", "2.0.0");
  const transport = new LocalTransport();
  transport.connect(server);
  const client = new DealflowMCPClient(transport);

  // 1. Initialization
  console.log("--> [1/5] Testing Dealflow MCP Handshake & Protocol Initialization...");
  const initResult = await client.initialize();
  assert.strictEqual(initResult.serverInfo.name, "Dealflow Production MCP Server");
  assert.strictEqual(initResult.serverInfo.version, "2.0.0");
  assert.strictEqual(initResult.capabilities.tools?.listChanged, true);
  assert.strictEqual(initResult.capabilities.resources?.listChanged, true);
  console.log("  ✅ Dealflow MCP Protocol 2.0 handshake succeeded.");

  // 2. Tools List & Standard Tools Registration
  console.log("\n--> [2/5] Verifying Standardized Dealflow Workflow Tools...");
  const toolsList = await client.listTools();
  const toolNames = toolsList.map((t: any) => t.name);
  assert.ok(toolNames.includes("dealflow_route_deal"), "dealflow_route_deal tool registered");
  assert.ok(toolNames.includes("dealflow_update_stage"), "dealflow_update_stage tool registered");
  assert.ok(toolNames.includes("dealflow_evaluate_negotiation"), "dealflow_evaluate_negotiation tool registered");
  assert.ok(toolNames.includes("dealflow_generate_mom"), "dealflow_generate_mom tool registered");
  assert.ok(toolNames.includes("dealflow_sync_context"), "dealflow_sync_context tool registered");
  console.log(`  ✅ ${toolsList.length} Dealflow MCP tools available.`);

  // 3. Resource Reading (dealflow://deal/deal-101)
  console.log("\n--> [3/5] Testing Standard Resource Provider URIs...");
  const dealContext = await client.getDealContext("deal-101");
  assert.ok(dealContext, "Deal context retrieved");
  assert.strictEqual(dealContext?.dealId, "deal-101");
  assert.strictEqual(dealContext?.clientName, "Acme Corporation");
  assert.strictEqual(dealContext?.stage, "negotiation");

  const leadProfile = await client.getLeadProfile("lead-201");
  assert.ok(leadProfile, "Lead profile retrieved");
  assert.strictEqual(leadProfile?.companyName, "Acme Corporation");
  assert.strictEqual(leadProfile?.icpFitScore, 96);
  console.log("  ✅ Standard deal & lead context resources resolved.");

  // 4. Concession Boundary Evaluation Tool Execution
  console.log("\n--> [4/5] Testing 'dealflow_evaluate_negotiation' Tool Execution...");
  const approvedEval = await client.evaluateNegotiation({
    dealId: "deal-101",
    requestedDiscount: 10,
    requestedPaymentTerms: "Net 30",
  });
  assert.strictEqual(approvedEval.decision, "APPROVED");
  assert.strictEqual(approvedEval.withinBoundary, true);

  const rejectedEval = await client.evaluateNegotiation({
    dealId: "deal-101",
    requestedDiscount: 25,
  });
  assert.strictEqual(rejectedEval.decision, "REQUIRES_HUMAN_OVERRIDE");
  assert.strictEqual(rejectedEval.withinBoundary, false);
  console.log("  ✅ Autonomous concession boundary evaluation verified.");

  // 5. Deal Routing & MOM Generation Execution
  console.log("\n--> [5/5] Testing Deal Routing & MOM Generation Tools...");
  const routeRes = await client.routeDeal({
    dealId: "deal-101",
    urgency: "critical",
  });
  assert.strictEqual(routeRes.status, "success");
  assert.strictEqual(routeRes.routedTo, "Executive Deal Closer Agent");

  const momRes = await client.generateMOM({
    dealId: "deal-101",
    transcript: "Client: We need OpenWA WhatsApp integration and custom CRM sync within 2 weeks. Agent: Confirmed.",
  });
  assert.strictEqual(momRes.dealId, "deal-101");
  assert.ok(momRes.actionItems.length > 0, "Action items generated");
  console.log("  ✅ Deal routing and MOM generation tools passed successfully.");

  console.log("\n=======================================================");
  console.log("✨ ALL DEALFLOW MCP TESTS PASSED!");
  console.log("=======================================================\n");
}

runDealflowMCPTests().catch(err => {
  console.error("❌ Dealflow MCP Test Failed:", err);
  process.exit(1);
});
