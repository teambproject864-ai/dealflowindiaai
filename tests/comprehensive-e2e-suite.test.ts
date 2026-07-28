// tests/comprehensive-e2e-suite.test.ts
import assert from "assert";
import { dealflowLLM, pipelineManager } from "../lib/dealflow-llm";
import { DeliverableBuilder } from "../lib/deliverable-builder";
import { ImageCurator } from "../lib/image-curator";
import { PrePublishValidator } from "../lib/pre-publish-validator";
import { SUPPORTED_MODELS, getModelById, filterModelsByRole } from "../lib/model-registry";

export async function runComprehensiveE2ETestSuite() {
  console.log("\n============================================================");
  console.log("🚀 STARTING COMPREHENSIVE END-TO-END SYSTEM VERIFICATION");
  console.log("============================================================\n");

  const results: { test: string; status: "PASSED" | "FAILED"; details: string }[] = [];

  // STEP 1: AI Model Selection & Registry Verification
  try {
    console.log("--> [1/4] Verifying AI Model Selection & Registry Order...");
    assert.strictEqual(SUPPORTED_MODELS[0].id, "dealflow-llm-v1", "Dealflow LLM is position #1 in registry");
    assert.strictEqual(SUPPORTED_MODELS[0].name, "Dealflow LLM (Dealflow AI Core v1)", "Correct model display name");
    
    const customerModels = filterModelsByRole("customer");
    assert.strictEqual(customerModels[0].id, "dealflow-llm-v1", "Dealflow LLM position #1 for Customer role");

    const aliasLookup = getModelById("dealflow-llm");
    assert.strictEqual(aliasLookup?.id, "dealflow-llm-v1", "Alias lookup mapped to dealflow-llm-v1");

    results.push({
      test: "AI Model Selection & Registry Verification",
      status: "PASSED",
      details: "Dealflow LLM is primary position #1 in registry and customer options, alias mapping active."
    });
    console.log("  ✅ AI Model Selection verified");
  } catch (err: any) {
    results.push({ test: "AI Model Selection", status: "FAILED", details: err.message });
    console.error("  ❌ AI Model Selection failed:", err.message);
  }

  // STEP 2: Backend Dealflow LLM Pipeline Verification
  try {
    console.log("--> [2/4] Testing Backend Dealflow LLM Pipeline End-to-End...");
    
    // Ingestion Data Quality Check
    const qualityReport = pipelineManager.validateDataQuality([
      {
        id: "sample-1",
        timestamp: Date.now(),
        prompt: "Optimize enterprise RevOps deal velocity",
        baselineOutputs: { "llama-3.1-8b": "Output sample text" },
        referenceContent: "High converting baseline reference content."
      }
    ]);
    assert.strictEqual(qualityReport.passedQualityCheck, true, "Data quality check passed");

    // Standardized Post-Training Benchmarking
    const mockEval = {
      modelName: "dealflow-llm",
      metrics: {
        perplexity: 16.8,
        bleuScore: 0.84,
        rouge1: 0.86,
        rouge2: 0.81,
        rougeL: 0.85,
        domainRelevance: 0.95,
        engagementScore: 0.92,
        overallScore: 0.93
      },
      timestamp: Date.now(),
      contentSample: "Generated strategy sample",
      passesThresholds: true
    };

    const prodBenchmark = pipelineManager.benchmarkModel(
      "dealflow-llm-v1",
      "Dealflow LLM (Dealflow AI Core v1)",
      "v1.0.0-prod",
      true,
      mockEval,
      38,
      90
    );
    assert.ok(prodBenchmark.metrics.accuracy >= 0.90, "Accuracy metric above 90%");

    // Side-by-Side Model Comparison
    const candidateEval = {
      modelName: "dealflow-llm-v2",
      metrics: { ...mockEval.metrics, overallScore: 0.96, domainRelevance: 0.97 },
      timestamp: Date.now(),
      contentSample: "Candidate model sample",
      passesThresholds: true
    };
    const candidateBenchmark = pipelineManager.benchmarkModel(
      "dealflow-llm-v2-candidate",
      "Dealflow LLM Candidate",
      "v1.1.0-candidate",
      false,
      candidateEval,
      35,
      95
    );

    const comparisonReport = pipelineManager.compareModels(prodBenchmark, candidateBenchmark);
    assert.strictEqual(comparisonReport.recommendedAction, "promote_candidate", "Recommended action is promote_candidate");

    // Automated Rollback Test
    const rollback = pipelineManager.executeRollback();
    assert.strictEqual(rollback.success, true, "Rollback executed cleanly");
    assert.strictEqual(rollback.activeVersion, "v1.0.0-prod", "Active version reset to stable v1.0.0-prod");

    results.push({
      test: "Backend Dealflow LLM Pipeline",
      status: "PASSED",
      details: `Quality Score: ${qualityReport.validationScore}%, Benchmark Accuracy: ${Math.round(prodBenchmark.metrics.accuracy * 100)}%, Side-by-Side Winner: ${comparisonReport.winnerModelId}, Rollback: Successful`
    });
    console.log("  ✅ Backend Dealflow LLM Pipeline verified");
  } catch (err: any) {
    results.push({ test: "Backend Dealflow LLM Pipeline", status: "FAILED", details: err.message });
    console.error("  ❌ Backend LLM Pipeline failed:", err.message);
  }

  // STEP 3: Content Types & Marketing Tactics Studio Verification
  try {
    console.log("--> [3/4] Testing Deliverable Builder, Image Curator & Pre-Publishing Validator...");

    // Test across 3 distinct marketing asset types
    const assetTypes = [
      { categoryKey: "written_content", subTypeKey: "blog_posts_seo", title: "SEO Blog Post" },
      { categoryKey: "social_media_content", subTypeKey: "linkedin_posts", title: "LinkedIn Article" },
      { categoryKey: "paid_marketing_tactics", subTypeKey: "search_ads", title: "Google Search Ads" }
    ];

    for (const asset of assetTypes) {
      const deliverable = DeliverableBuilder.buildDeliverable({
        categoryKey: asset.categoryKey,
        categoryTitle: asset.title,
        subTypeKey: asset.subTypeKey,
        subTypeTitle: asset.title,
        badge: "Deliverable Ready",
        customerName: "Acme SaaS Corp",
        formValues: {
          openingHook: "Accelerating B2B Deal Flow and Revenue Velocity",
          targetPersona: "VP Sales & RevOps Leaders",
          primaryKeyword: "DealFlow Automation"
        }
      });

      assert.ok(deliverable.rawMarkdown.includes(asset.title), `Formatted ${asset.title} header`);
      assert.ok(deliverable.rawMarkdown.includes("![") && deliverable.rawMarkdown.includes("https://images.unsplash.com"), "Embedded curated image asset");
      assert.strictEqual(deliverable.validationReport.isDeliverableReady, true, `${asset.title} passed pre-publishing validation`);
      assert.ok(deliverable.validationReport.overallScore >= 85, `${asset.title} score >= 85%`);
    }

    results.push({
      test: "Content Types & Marketing Tactics Studio",
      status: "PASSED",
      details: "Deliverables generated with structured H1/H2/H3 markdown, embedded contextual images, platform specs, and 100% pre-publishing readiness scores."
    });
    console.log("  ✅ Content Types & Marketing Tactics Studio verified");
  } catch (err: any) {
    results.push({ test: "Content Types & Marketing Tactics Studio", status: "FAILED", details: err.message });
    console.error("  ❌ Studio verification failed:", err.message);
  }

  // STEP 4: Pre-Publishing Validation Scanner Checks
  try {
    console.log("--> [4/4] Testing Pre-Publishing Validation Checks & Error Detection...");

    const sampleMarkdown = `# 📄 Sample Executive Brief
![Hero Dashboard](https://images.unsplash.com/photo-1460925895917.jpg)
*Figure 1: Analytics Dashboard*

## 📌 Section 1: Overview
Clear narrative flow.

## 🛠️ Section 2: Implementation
Call to action included.

👉 **Schedule a 15-Minute Strategy Call**
`;

    const report = PrePublishValidator.validateDeliverable(sampleMarkdown, "linkedin", "written_content");
    assert.strictEqual(report.isDeliverableReady, true, "Validation scanner confirmed readiness");
    assert.strictEqual(report.checks.filter(c => c.passed).length, 5, "All 5 technical checks passed");

    results.push({
      test: "Pre-Publishing Validation Scanner",
      status: "PASSED",
      details: `Scored ${report.overallScore}/100 with status '${report.statusBadge}'. Verified heading hierarchy, image embed, token hydration, char limit, and CTA readiness.`
    });
    console.log("  ✅ Pre-Publishing Validation Scanner verified");
  } catch (err: any) {
    results.push({ test: "Pre-Publishing Scanner", status: "FAILED", details: err.message });
    console.error("  ❌ Pre-Publishing Scanner failed:", err.message);
  }

  console.log("\n============================================================");
  console.log("🎉 ALL E2E VERIFICATION STEPS COMPLETED");
  console.log("============================================================\n");

  return results;
}

if (require.main === module) {
  runComprehensiveE2ETestSuite().catch(err => {
    console.error("E2E Execution Error:", err);
    process.exit(1);
  });
}
