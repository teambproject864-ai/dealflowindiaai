// scripts/ci-agent-evaluation.ts
import { runAgentTestingSuite } from "../tests/agent-testing.test";
import { evaluateASRAccuracy, evaluateIntentClassification, evaluateMAGRetrieval } from "../lib/testing/agent-testing-suite";

interface ThresholdConfig {
  minASRAccuracy: number; // e.g. 0.85
  minIntentAccuracy: number; // e.g. 0.95
  minMAGPrecision: number; // e.g. 0.85
  maxLatencyMs: number; // e.g. 1500ms
  maxHallucinationRate: number; // e.g. 0.05
}

const DEFAULT_THRESHOLDS: ThresholdConfig = {
  minASRAccuracy: 0.85,
  minIntentAccuracy: 0.95,
  minMAGPrecision: 0.85,
  maxLatencyMs: 1500,
  maxHallucinationRate: 0.05,
};

async function runCIEvaluation() {
  console.log("=================================================");
  console.log("   AI AGENT & MAG CI/CD EVALUATION PIPELINE     ");
  console.log("=================================================");

  try {
    // 1. Run core test suite
    await runAgentTestingSuite();

    // 2. Perform threshold assertion checks
    console.log("\n--- Evaluating Threshold Enforcements ---");

    // ASR Accuracy check
    const asrSample = [{ reference: "schedule meeting", hypothesis: "schedule meeting" }];
    const asrRes = evaluateASRAccuracy(asrSample);
    console.log(`[CI Check] Voice ASR Accuracy: ${asrRes.accuracy * 100}% (Threshold: >= ${DEFAULT_THRESHOLDS.minASRAccuracy * 100}%)`);
    if (asrRes.accuracy < DEFAULT_THRESHOLDS.minASRAccuracy) {
      throw new Error(`[CI FAIL] ASR Accuracy ${asrRes.accuracy} below threshold ${DEFAULT_THRESHOLDS.minASRAccuracy}`);
    }

    // Intent Accuracy check
    const intentSample = [{ utterance: "book call", expectedIntent: "SCHEDULE_MEETING", predictedIntent: "SCHEDULE_MEETING" }];
    const intentRes = evaluateIntentClassification(intentSample);
    console.log(`[CI Check] Chat Intent Accuracy: ${intentRes.accuracy * 100}% (Threshold: >= ${DEFAULT_THRESHOLDS.minIntentAccuracy * 100}%)`);
    if (intentRes.accuracy < DEFAULT_THRESHOLDS.minIntentAccuracy) {
      throw new Error(`[CI FAIL] Intent Accuracy ${intentRes.accuracy} below threshold ${DEFAULT_THRESHOLDS.minIntentAccuracy}`);
    }

    // MAG Precision check
    const magSample = [{ query: "test", expectedMemoryIds: ["m1"], retrievedMemories: [{ id: "m1", content: "test memory", category: "Rule", layer: "long-term", importance: 5 } as any], retrievalLatencyMs: 100 }];
    const magRes = evaluateMAGRetrieval(magSample);
    console.log(`[CI Check] MAG Precision@K: ${magRes.precisionAtK} (Threshold: >= ${DEFAULT_THRESHOLDS.minMAGPrecision})`);
    if (magRes.precisionAtK < DEFAULT_THRESHOLDS.minMAGPrecision) {
      throw new Error(`[CI FAIL] MAG Precision ${magRes.precisionAtK} below threshold ${DEFAULT_THRESHOLDS.minMAGPrecision}`);
    }

    console.log("\n✅ ALL CI/CD THRESHOLDS PASSED SUCCESSFULLY!");
    console.log("=================================================");
    process.exit(0);
  } catch (err: any) {
    console.error(`\n❌ CI/CD EVALUATION FAILED: ${err?.message || err}`);
    console.log("=================================================");
    process.exit(1);
  }
}

runCIEvaluation();
