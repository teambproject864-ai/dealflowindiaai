// tests/dealflow-llm-pipeline.test.ts
import assert from "assert";
import { pipelineManager, DealflowPipelineManager } from "../lib/dealflow-llm/dealflow-pipeline-manager";
import { dealflowLLM } from "../lib/dealflow-llm";

export async function runLLMPipelineTests() {
  console.log("\n=== RUNNING BACKEND DEALFLOW LLM PIPELINE TEST SUITE ===");

  // 1. Data Quality Validation Test
  console.log("--> [1/4] Testing Ingestion Data Quality Checks...");
  const mockSamples = [
    {
      id: "sample-1",
      timestamp: Date.now(),
      prompt: "Optimize RevOps outbound pipeline and calculate customer LTV",
      baselineOutputs: { "llama-3.1-8b": "Sample LTV output text" } as Record<string, string>,
      referenceContent: "High converting B2B campaign strategy reference content."
    },
    {
      id: "sample-2",
      timestamp: Date.now(),
      prompt: "Generate B2B SaaS cold email sequence",
      baselineOutputs: { "mistral-7b": "Cold email copy sample" } as Record<string, string>,
      referenceContent: "Cold email reference template."
    }
  ];

  const qualityReport = pipelineManager.validateDataQuality(mockSamples);
  assert.strictEqual(qualityReport.passedQualityCheck, true, "Data quality check passed for valid samples");
  assert.strictEqual(qualityReport.validSamples, 2, "2 valid samples detected");
  console.log("  ✅ Ingestion Data Quality Validation passed (Score: 100%)");

  // 2. Standardized Post-Training Benchmarking Test
  console.log("--> [2/4] Testing Post-Training Benchmarking Suite...");
  const mockEval = {
    modelName: "dealflow-llm",
    metrics: {
      perplexity: 18.5,
      bleuScore: 0.82,
      rouge1: 0.85,
      rouge2: 0.79,
      rougeL: 0.84,
      domainRelevance: 0.94,
      engagementScore: 0.91,
      overallScore: 0.92
    },
    timestamp: Date.now(),
    contentSample: "Dealflow LLM generated strategy sample",
    passesThresholds: true
  };

  const benchmark = pipelineManager.benchmarkModel(
    "dealflow-llm-v1",
    "Dealflow LLM (Dealflow AI Core v1)",
    "v1.0.0-prod",
    true,
    mockEval,
    38,
    90
  );

  assert.strictEqual(benchmark.passesThresholds, true, "Model benchmark passed thresholds");
  assert.ok(benchmark.metrics.accuracy >= 0.90, "Accuracy metric above 90%");
  assert.strictEqual(benchmark.metrics.latencyMs, 38, "Inference latency recorded");
  console.log(`  ✅ Post-Training Benchmark passed (Accuracy: ${Math.round(benchmark.metrics.accuracy * 100)}%, Latency: ${benchmark.metrics.latencyMs}ms)`);

  // 3. Side-by-Side Model Comparison Test
  console.log("--> [3/4] Testing Side-by-Side Model Comparison Module...");
  const mockCandidateEval = {
    modelName: "dealflow-llm-v2",
    metrics: {
      perplexity: 15.2,
      bleuScore: 0.88,
      rouge1: 0.89,
      rouge2: 0.84,
      rougeL: 0.88,
      domainRelevance: 0.96,
      engagementScore: 0.94,
      overallScore: 0.95
    },
    timestamp: Date.now(),
    contentSample: "Candidate model superior output",
    passesThresholds: true
  };

  const candidateBenchmark = pipelineManager.benchmarkModel(
    "dealflow-llm-v2-candidate",
    "Dealflow LLM (v2 Candidate)",
    "v1.1.0-candidate",
    false,
    mockCandidateEval,
    35,
    95
  );

  const comparisonReport = pipelineManager.compareModels(benchmark, candidateBenchmark);
  assert.strictEqual(comparisonReport.recommendedAction, "promote_candidate", "Recommended action is promote_candidate");
  assert.strictEqual(comparisonReport.winnerModelId, "dealflow-llm-v2-candidate", "Candidate model won comparison");
  console.log("  ✅ Side-by-Side Model Comparison passed (Candidate promoted)");

  // 4. Automated Rollback & Telemetry Test
  console.log("--> [4/4] Testing Automated Rollback & Telemetry...");
  const rollbackResult = pipelineManager.executeRollback();
  assert.strictEqual(rollbackResult.success, true, "Rollback executed successfully");
  assert.strictEqual(rollbackResult.activeVersion, "v1.0.0-prod", "Reverted to stable v1.0.0-prod");

  const status = pipelineManager.getPipelineStatus();
  assert.ok(status.logs.length >= 4, "Execution audit logs recorded");
  console.log("  ✅ Automated Rollback & Pipeline Telemetry verified");

  console.log("\n============================================================");
  console.log("🎉 ALL DEALFLOW LLM PIPELINE TESTS PASSED!");
  console.log("============================================================\n");
}

if (require.main === module) {
  runLLMPipelineTests().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
}
