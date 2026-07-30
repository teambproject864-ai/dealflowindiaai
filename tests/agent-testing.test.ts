// tests/agent-testing.test.ts
import assert from "assert";
import {
  evaluateASRAccuracy,
  evaluateIntentClassification,
  evaluateMAGRetrieval,
  evaluateUserJourney
} from "../lib/testing/agent-testing-suite";
import { ALMAMemory, evaluateContextRelevance, detectMemoryHallucination } from "../lib/alma";

export async function runAgentTestingSuite() {
  console.log("=== Running Comprehensive Agent & MAG Testing Suite ===");

  // 1. Voice Recognition Accuracy (ASR) Unit Test
  console.log("--- 1. Testing Voice Recognition Accuracy (ASR) ---");
  const asrSamples = [
    { reference: "schedule a meeting for tomorrow at ten am", hypothesis: "schedule a meeting for tomorrow at 10 am" },
    { reference: "what is the status of our dealflow pipeline", hypothesis: "what is the status of our deal flow pipeline" },
    { reference: "confirm appointment with john doe", hypothesis: "confirm appointment with john doe" }
  ];
  const asrResult = evaluateASRAccuracy(asrSamples);
  console.log(`ASR Accuracy: ${asrResult.accuracy * 100}% | WER: ${asrResult.wordErrorRate}`);
  assert.ok(asrResult.accuracy >= 0.85, "ASR accuracy should be at least 85%");

  // 2. Chat Intent Classification Unit Test
  console.log("--- 2. Testing Chat Intent Classification ---");
  const intentSamples = [
    { utterance: "Book a call for Friday 3pm", expectedIntent: "SCHEDULE_MEETING", predictedIntent: "SCHEDULE_MEETING" },
    { utterance: "Can you change my account details?", expectedIntent: "UPDATE_ACCOUNT", predictedIntent: "UPDATE_ACCOUNT" },
    { utterance: "What is your pricing model?", expectedIntent: "INQUIRE_PRICING", predictedIntent: "INQUIRE_PRICING" },
    { utterance: "Cancel my appointment", expectedIntent: "CANCEL_MEETING", predictedIntent: "CANCEL_MEETING" }
  ];
  const intentResult = evaluateIntentClassification(intentSamples);
  console.log(`Intent Accuracy: ${intentResult.accuracy * 100}% | F1 Score: ${intentResult.f1Score}`);
  assert.equal(intentResult.accuracy, 1.0, "Intent classification accuracy should be 100% on standard dataset");

  // 3. MAG Memory Retrieval & Context Recall Unit & Specialized Test
  console.log("--- 3. Testing MAG Memory Retrieval & Context Recall ---");
  const sampleMemories: ALMAMemory[] = [
    {
      id: "mem_101",
      leadId: "lead_alpha",
      agentName: "TestAgent",
      content: "Client has a budget limit of $100,000 for Q3 marketing software.",
      category: "Objection",
      importance: 9,
      layer: "long-term",
      keywords: ["budget", "pricing", "q3"],
      createdAt: new Date().toISOString(),
      accessCount: 1,
      lastAccessed: new Date().toISOString()
    },
    {
      id: "mem_102",
      leadId: "lead_alpha",
      agentName: "TestAgent",
      content: "Client strictly requires SOC2 Type II compliance and data encryption.",
      category: "Rule",
      importance: 8,
      layer: "long-term",
      keywords: ["security", "compliance", "soc2"],
      createdAt: new Date().toISOString(),
      accessCount: 1,
      lastAccessed: new Date().toISOString()
    }
  ];

  const magSamples = [
    {
      query: "What is the budget constraint for Q3?",
      expectedMemoryIds: ["mem_101"],
      retrievedMemories: [sampleMemories[0]],
      retrievalLatencyMs: 120
    },
    {
      query: "Does the client have security compliance requirements?",
      expectedMemoryIds: ["mem_102"],
      retrievedMemories: [sampleMemories[1]],
      retrievalLatencyMs: 140
    }
  ];

  const magResult = evaluateMAGRetrieval(magSamples);
  console.log(`MAG Precision@K: ${magResult.precisionAtK} | Recall@K: ${magResult.recallAtK} | Avg Latency: ${magResult.averageLatencyMs}ms`);
  assert.equal(magResult.precisionAtK, 1.0, "MAG Retrieval Precision should be 1.0");
  assert.equal(magResult.recallAtK, 1.0, "MAG Retrieval Recall should be 1.0");

  // 4. Memory Hallucination Prevention Test
  console.log("--- 4. Testing Memory Hallucination Prevention ---");
  const groundedResponse = "Based on our records, your team has a budget limit of $100,000 for Q3 and requires SOC2 Type II compliance.";
  const hallucinatedResponse = "Your contract includes free unlimited global flights and a guaranteed 500% ROI within two days.";

  const groundedEval = detectMemoryHallucination(groundedResponse, sampleMemories);
  const hallucinatedEval = detectMemoryHallucination(hallucinatedResponse, sampleMemories);

  console.log(`Grounded Response Hallucination Score: ${groundedEval.hallucinationScore} (isHallucination: ${groundedEval.isHallucination})`);
  console.log(`Hallucinated Response Hallucination Score: ${hallucinatedEval.hallucinationScore} (isHallucination: ${hallucinatedEval.isHallucination})`);

  assert.equal(groundedEval.isHallucination, false, "Grounded response must not be flagged as hallucination");
  assert.equal(hallucinatedEval.isHallucination, true, "Unbacked claims must be flagged as hallucination");

  // 5. End-to-End User Journey Test
  console.log("--- 5. Testing End-to-End User Journey ---");
  const journeySteps = [
    {
      userTurnText: "Hello, can we review our security requirements?",
      agentResponseText: "Hello! Absolutely, we have logged your requirement for SOC2 Type II compliance and data encryption.",
      expectedKeywords: ["SOC2", "compliance", "encryption"],
      latencyMs: 450,
      retrievedMemories: [sampleMemories[1]]
    },
    {
      userTurnText: "Great, and what about our Q3 software budget?",
      agentResponseText: "Your allocated Q3 software budget is $100,000.",
      expectedKeywords: ["budget", "100,000"],
      latencyMs: 380,
      retrievedMemories: [sampleMemories[0]]
    }
  ];

  const journeyResult = evaluateUserJourney(journeySteps);
  console.log(`User Journey Coherence: ${journeyResult.overallCoherenceScore} | Avg Latency: ${journeyResult.averageTurnLatencyMs}ms | Success: ${journeyResult.successStatus}`);
  assert.ok(journeyResult.successStatus, "User journey evaluation should pass successfully");

  console.log("=== Comprehensive Agent & MAG Testing Suite Passed Successfully ===");
}

runAgentTestingSuite().catch((err) => {
  console.error("Agent testing suite failed:", err);
  process.exit(1);
});

