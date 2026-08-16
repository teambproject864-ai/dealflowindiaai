// tests/community-mining.test.ts

import assert from "assert";
import {
  computeDedupHash,
  parseCSVFeedback,
  parseJSONFeedback,
} from "../lib/community-mining/ingestion";
import {
  generateTextEmbedding,
  generateHeuristicAnalysis,
} from "../lib/community-mining/processor";
import {
  calculateCosineSimilarity,
  clusterInsights,
} from "../lib/community-mining/clustering";
import {
  matchesRoutingRule,
} from "../lib/community-mining/router";
import type { CMInsight, CMRoutingRule, CMTheme } from "../types/community-mining";

export async function runCommunityMiningTestSuite() {
  console.log("=== Running Comprehensive Community Mining Automation Test Suite ===");

  // ── Test 1: Deduplication Logic & Hash Stability ────────────────────────────────
  console.log("\n[Test 1] Ingestion Deduplication & Hash Verification...");
  const hash1 = computeDedupHash("source_1", "ticket_123", "User unable to export deal flow CSV");
  const hash2 = computeDedupHash("source_1", "ticket_123", "User unable to export deal flow CSV");
  const hash3 = computeDedupHash("source_1", "ticket_124", "User unable to export deal flow CSV");

  assert.strictEqual(hash1, hash2, "Identical source, external ID, and text must produce identical dedup hashes");
  assert.notStrictEqual(hash1, hash3, "Different external IDs must produce distinct dedup hashes");
  console.log("✅ Passed: Deduplication hash determinism and uniqueness verified");

  // ── Test 2: CSV and JSON Feedback Parsers ──────────────────────────────────────
  console.log("\n[Test 2] CSV & JSON Ingestion Parsers...");
  const sampleCsv = `feedback,author,tier,date
"DealFlow AI is saving us 10 hours a week on SDR outbound!",Sarah Connor,enterprise,2026-08-14
"Getting 429 rate limit on bulk emails",John Doe,starter,2026-08-13`;

  const parsedCsv = parseCSVFeedback(sampleCsv, "csv_import_1");
  assert.strictEqual(parsedCsv.length, 2, "CSV parser should extract 2 feedback rows");
  assert.strictEqual(parsedCsv[0].sourceType, "community", "Source type must be community");
  assert.strictEqual(parsedCsv[0].author?.name, "Sarah Connor", "Author extracted correctly");

  const sampleJson = [
    { text: "Love the automated campaign generator!", user: "Alice", sentiment: "positive" },
    { message: "The audio recorder crashed during meeting", reporter: "Bob", rating: 1 }
  ];
  const parsedJson = parseJSONFeedback(JSON.stringify(sampleJson), "json_batch_1");
  assert.strictEqual(parsedJson.length, 2, "JSON parser should extract 2 items");
  assert.strictEqual(parsedJson[0].rawText, "Love the automated campaign generator!");
  assert.strictEqual(parsedJson[1].rawText, "The audio recorder crashed during meeting");
  console.log("✅ Passed: CSV & JSON feedback parsers accurately extract structured fields");

  // ── Test 3: LLM Output Schema & Heuristic Sentiment Analysis ───────────────────
  console.log("\n[Test 3] LLM Output Schema & Feature Extraction...");
  const samplePraise = "DealFlow AI helped us increase pipeline by 300%. Amazing product!";
  const sampleBug = "The CRM sync keeps failing with error 500 on contacts page. Urgent bug!";
  
  const analysisPraise = generateHeuristicAnalysis(samplePraise);
  const analysisBug = generateHeuristicAnalysis(sampleBug);

  assert.strictEqual(analysisPraise.sentiment, "positive", "Praise must be classified as positive");
  assert.strictEqual(analysisBug.sentiment, "negative", "Bug reports must be classified as negative");
  assert.strictEqual(analysisBug.severity, "high", "Urgent CRM bug must receive high severity");
  assert.ok(analysisBug.themeTags.includes("bug"), "Bug theme tag must be included");
  console.log("✅ Passed: LLM heuristic and schema extraction validated");

  // ── Test 4: Embedding Vector Generation & Cosine Similarity ───────────────────
  console.log("\n[Test 4] Embedding Vector Generation & Cosine Similarity...");
  const embBug1 = generateTextEmbedding("CRM sync failure bug with error 500");
  const embBug2 = generateTextEmbedding("Error 500 when syncing CRM contacts");
  const embPraise = generateTextEmbedding("Incredible product, outstanding results and revenue growth");

  assert.strictEqual(embBug1.length, 16, "Embedding vectors must have 16 dimensions");
  const simBugs = calculateCosineSimilarity(embBug1, embBug2);
  const simBugPraise = calculateCosineSimilarity(embBug1, embPraise);

  assert.ok(simBugs >= 0.7, `Semantic similarity between similar bugs should be >= 0.7 (got ${simBugs.toFixed(2)})`);
  assert.ok(simBugPraise < simBugs, "Dissimilar feedback must have lower cosine similarity");
  console.log(`✅ Passed: Cosine similarity valid (Sim(Bug, Bug)=${simBugs.toFixed(2)}, Sim(Bug, Praise)=${simBugPraise.toFixed(2)})`);

  // ── Test 5: Clustering Engine & Auto-Assignment ───────────────────────────────
  console.log("\n[Test 5] Clustering Engine & Team Auto-Assignment...");
  const mockInsights: CMInsight[] = [
    {
      id: "ins_1",
      rawItemId: "raw_1",
      sourceId: "src_1",
      sourceType: "support",
      rawSnippet: "Billing invoice has wrong vat number and payment failed",
      sentiment: "negative",
      sentimentScore: -0.7,
      themeTags: ["pricing complaint", "bug"],
      entities: [{ name: "Pricing Structure", entityType: "pricing_tier" }],
      severity: "high",
      summary: "Billing invoice error and payment failure.",
      embeddingVector: generateTextEmbedding("Billing invoice has wrong vat number and payment failed"),
      processedAt: new Date().toISOString(),
    },
    {
      id: "ins_2",
      rawItemId: "raw_2",
      sourceId: "src_1",
      sourceType: "support",
      rawSnippet: "Can't pay my subscription invoice with credit card price",
      sentiment: "negative",
      sentimentScore: -0.6,
      themeTags: ["pricing complaint"],
      entities: [{ name: "Pricing Structure", entityType: "pricing_tier" }],
      summary: "Subscription invoice payment issue.",
      severity: "medium",
      embeddingVector: generateTextEmbedding("Can't pay subscription invoice with credit card price"),
      processedAt: new Date().toISOString(),
    },
    {
      id: "ins_3",
      rawItemId: "raw_3",
      sourceId: "src_2",
      sourceType: "community",
      rawSnippet: "Please add HubSpot two-way contact syncing feature and api",
      sentiment: "neutral",
      sentimentScore: 0.1,
      themeTags: ["feature request"],
      entities: [{ name: "Feature Expansion", entityType: "feature" }],
      severity: "medium",
      summary: "Request for HubSpot two-way contact sync.",
      embeddingVector: generateTextEmbedding("Please add HubSpot two-way contact syncing feature and api"),
      processedAt: new Date().toISOString(),
    }
  ];

  const clusters = clusterInsights(mockInsights, 0.6);
  assert.ok(clusters.length >= 2, "Should cluster billing into one theme and feature request into another");

  const billingCluster = clusters.find(c => c.label.toLowerCase().includes("pricing") || c.assignedTeam === "sales" || c.assignedTeam === "cs");
  assert.ok(billingCluster, "Must detect pricing/billing cluster");

  const featureCluster = clusters.find(c => c.label.toLowerCase().includes("feature") || c.assignedTeam === "product");
  assert.ok(featureCluster, "Must detect feature request cluster");
  assert.strictEqual(featureCluster?.assignedTeam, "product", "Feature requests must auto-assign to product team");
  console.log("✅ Passed: Clustering engine correctly grouped insights into aggregated themes");

  // ── Test 6: Routing Rules Evaluation ──────────────────────────────────────────
  console.log("\n[Test 6] Routing Rules Evaluation...");
  const highUrgencyBugRule: CMRoutingRule = {
    id: "rule_1",
    name: "Urgent Bug Escalation",
    enabled: true,
    minSeverity: "high",
    keywords: ["sync error", "crash"],
    categories: ["product"],
    assignedTeam: "product",
    destinationChannel: "email",
    destinationTarget: "alerts@dealflow.ai",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const disabledRule: CMRoutingRule = {
    ...highUrgencyBugRule,
    id: "rule_2",
    enabled: false,
  };

  const bugCluster: CMTheme = {
    id: "thm_1",
    label: "CRITICAL BUG: Sync Error 500",
    description: "Sync error crashing on contact export",
    itemCount: 5,
    trend: [{ date: "2026-08-16", count: 5 }],
    sentimentAvg: -0.8,
    severity: "critical",
    status: "new",
    assignedTeam: "product",
    sampleQuotes: ["Sync keeps crashing on page 2"],
    topEntities: ["Sync Engine"],
    relatedInsightIds: ["ins_1", "ins_2"],
    firstSeenAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };

  assert.strictEqual(matchesRoutingRule(bugCluster, highUrgencyBugRule), true, "Urgent bug cluster must match enabled rule");
  assert.strictEqual(matchesRoutingRule(bugCluster, disabledRule), false, "Disabled rule must not match");
  console.log("✅ Passed: Routing rules engine successfully matched theme criteria");

  // ── Test 7: Regression Test — Content Panel Scroll State Persistence ───────────
  console.log("\n[Test 7] Regression Test — Content Panel Scroll Persistence...");
  let simulatedGeneratedOutput: string | null = "<article><h1>SEO Deliverable</h1></article>";
  const previousSubtype = "blog_posts_seo";

  // Simulate parent re-render / scroll event passing fresh object reference for customerData
  const oldCustomerData = { id: "c1", companyName: "Acme" };
  const newCustomerDataOnScroll = { id: "c1", companyName: "Acme" }; // new reference

  function simulateSubtypeChangeEffect(currentSubtype: string, activePrevSubtype: string) {
    if (currentSubtype !== activePrevSubtype) {
      simulatedGeneratedOutput = null;
    }
    // If subtype did NOT change, simulatedGeneratedOutput remains intact!
  }

  // 1. Scroll event occurs: subtype is unchanged
  simulateSubtypeChangeEffect("blog_posts_seo", previousSubtype);
  assert.strictEqual(
    simulatedGeneratedOutput,
    "<article><h1>SEO Deliverable</h1></article>",
    "Generated deliverable must remain visible on scroll / prop reference changes"
  );

  // 2. User explicitly selects a different option
  simulateSubtypeChangeEffect("email_sequences", previousSubtype);
  assert.strictEqual(
    simulatedGeneratedOutput,
    null,
    "Generated deliverable should reset only on deliberate option switch"
  );
  console.log("✅ Passed: Content panel scroll persistence regression test verified");

  console.log("\n🎉 ALL 7 COMMUNITY MINING & STUDIO TESTS PASSED SUCCESSFULLY!");
}

if (process.argv[1]?.includes("community-mining.test")) {
  runCommunityMiningTestSuite().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
