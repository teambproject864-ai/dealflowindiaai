// tests/auto-llm-assignment.test.ts
import assert from "assert";
import { analyzeTaskContent } from "../lib/llm-router/content-analyzer";
import { assignOptimalLLM } from "../lib/llm-router/auto-llm-assigner";
import { getAssignmentTelemetryMetrics } from "../lib/llm-router/assignment-telemetry";

async function runAutoLLMAssignmentTests() {
  console.log("\n=======================================================");
  console.log("🚀 STARTING AUTOMATED LLM ASSIGNMENT SYSTEM TEST SUITE");
  console.log("=======================================================\n");

  // 1. Content Analysis Test
  console.log("--> [1/4] Testing Content Analyzer across types, domains & complexity...");
  const negotiationText = "Client is requesting a 12% discount on our annual enterprise SaaS contract with Net 30 payment terms.";
  const negotiationAnalysis = analyzeTaskContent(negotiationText);
  assert.strictEqual(negotiationAnalysis.contentType, "sales_negotiation");
  assert.strictEqual(negotiationAnalysis.domain, "b2b_saas");
  assert.ok(negotiationAnalysis.complexityScore >= 5, "Complexity score evaluated");
  console.log("  ✅ Sales negotiation & B2B SaaS domain accurately detected.");

  const codeText = "Write a TypeScript function to calculate SHA-256 HMAC hash for WhatsApp webhooks: function computeHash(payload: string) { ... }";
  const codeAnalysis = analyzeTaskContent(codeText);
  assert.strictEqual(codeAnalysis.contentType, "code");
  console.log("  ✅ Code task accurately classified.");

  const multilingualText = "Por favor traduce este resumen de reunión y envía el mensaje por WhatsApp a los ejecutivos.";
  const multiAnalysis = analyzeTaskContent(multilingualText);
  assert.strictEqual(multiAnalysis.isMultilingual, true);
  console.log("  ✅ Multilingual requirement accurately identified.");

  // 2. Intelligent Model Assignment & Rules Execution
  console.log("\n--> [2/4] Testing Automated LLM Assignment Decisions...");
  
  // Case A: Sales Negotiation -> Dealflow Domain LLM
  const decisionA = assignOptimalLLM("Evaluate concession boundaries for 10% discount request on SaaS pipeline deal-101.");
  assert.strictEqual(decisionA.assignedModelId, "dealflow-domain-llm");
  assert.strictEqual(decisionA.modelProfile.provider, "dealflow-llm");
  assert.ok(decisionA.confidenceScore >= 0.9, "High confidence score");
  console.log("  ✅ Sales negotiation assigned to 'dealflow-domain-llm'.");

  // Case B: Enterprise Tier Ultra-Complexity -> NVIDIA Nemotron
  const decisionB = assignOptimalLLM(
    "Perform a deep financial EBITDA margin audit and multi-scenario risk analysis for an enterprise acquisition.",
    { tierLevel: "enterprise" }
  );
  assert.strictEqual(decisionB.assignedModelId, "nvidia-nemotron");
  assert.strictEqual(decisionB.modelProfile.provider, "nvidia");
  console.log("  ✅ Enterprise ultra-complexity assigned to 'nvidia-nemotron'.");

  // Case C: Multilingual Long Extraction -> Kimi K1.5
  const decisionC = assignOptimalLLM("Extraer todas las cláusulas de indemnización y cumplimiento normativo de este contrato de 50 páginas.");
  assert.strictEqual(decisionC.assignedModelId, "kimi-k1.5");
  assert.strictEqual(decisionC.modelProfile.provider, "kimi");
  console.log("  ✅ Multilingual contract extraction assigned to 'kimi-k1.5'.");

  // Case D: Simple Chat -> Cost-Optimized Mistral
  const decisionD = assignOptimalLLM("Hello, what time is the team standup today?");
  assert.strictEqual(decisionD.assignedModelId, "huggingface-mistral");
  console.log("  ✅ Simple chat assigned to 'huggingface-mistral'.");

  // 3. Fallback Chains & Cost Estimations
  console.log("\n--> [3/4] Testing Fallback Chains & Cost Calculation...");
  assert.ok(decisionA.fallbackChain.length > 0, "Fallback chain present");
  assert.ok(decisionA.estimatedCostCents >= 0, "Cost estimate calculated");
  console.log(`  ✅ Fallback chain verified: [${decisionA.fallbackChain.join(" -> ")}] | Cost: ${decisionA.estimatedCostCents}¢`);

  // 4. Telemetry Logging & Performance Metrics
  console.log("\n--> [4/4] Verifying Assignment Telemetry & Monitoring Metrics...");
  const metrics = getAssignmentTelemetryMetrics();
  assert.ok(metrics.totalAssignments >= 4, "Telemetry logs recorded");
  assert.ok(metrics.successRatePercent > 90, "Success rate metric verified");
  assert.ok(metrics.avgConfidenceScore > 0.8, "Average confidence metric verified");
  assert.ok(metrics.providerDistribution["dealflow-llm"] > 0, "Provider distribution tracked");
  console.log(`  ✅ Telemetry aggregated: ${metrics.totalAssignments} total assignments | ${metrics.successRatePercent}% success rate | ${metrics.avgConfidenceScore} avg confidence.`);

  console.log("\n=======================================================");
  console.log("✨ ALL AUTOMATED LLM ASSIGNMENT TESTS PASSED!");
  console.log("=======================================================\n");
}

runAutoLLMAssignmentTests().catch(err => {
  console.error("❌ Auto LLM Assignment Test Failed:", err);
  process.exit(1);
});
