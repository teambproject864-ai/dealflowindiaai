// lib/community-mining/processor.ts

import { db } from "@/lib/firebase-admin";
import { hfInferJSON } from "@/lib/huggingface";
import { dealflowLLM } from "@/lib/dealflow-llm";
import type {
  CMRawItem,
  CMInsight,
  CMSentiment,
  CMSeverity,
  CMEntity,
  CMProcessingLog,
} from "@/types/community-mining";

export interface LLMAnalysisOutput {
  sentiment: CMSentiment;
  sentimentScore: number;
  themeTags: string[];
  entities: CMEntity[];
  severity: CMSeverity;
  summary: string;
}

/**
 * Generates a lightweight normalized 16-dimensional embedding vector for clustering.
 */
export function generateTextEmbedding(text: string): number[] {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const words = clean.split(/\s+/).filter((w) => w.length > 2);
  
  // 16 key semantic dimensions for community feedback
  const dimensionKeywords: string[][] = [
    ["bug", "error", "broken", "crash", "failure", "issue", "freeze"],
    ["feature", "request", "add", "need", "wish", "want", "support", "roadmap"],
    ["price", "pricing", "cost", "expensive", "subscription", "discount", "bill", "plan"],
    ["churn", "cancel", "leaving", "switch", "alternative", "quit", "competitor"],
    ["integration", "api", "webhook", "zapier", "slack", "hubspot", "salesforce"],
    ["speed", "slow", "latency", "performance", "fast", "responsive", "lag"],
    ["ui", "ux", "design", "layout", "confusing", "intuitive", "navigation", "button"],
    ["love", "great", "amazing", "best", "awesome", "helpful", "good", "praise"],
    ["email", "campaign", "deliverability", "bounce", "spam", "outreach", "sequence"],
    ["call", "meeting", "bot", "voice", "audio", "transcript", "recording"],
    ["lead", "crm", "pipeline", "deals", "contact", "sales", "prospect"],
    ["security", "auth", "login", "sso", "gdpr", "permission", "password"],
    ["support", "help", "agent", "service", "ticket", "response", "docs"],
    ["workflow", "automation", "trigger", "action", "n8n", "playbook"],
    ["analytics", "metric", "report", "dashboard", "roi", "stats", "graph"],
    ["onboarding", "setup", "tutorial", "start", "guide", "friction", "first"],
  ];

  const vector = new Array(16).fill(0);
  for (let i = 0; i < dimensionKeywords.length; i++) {
    const keywords = dimensionKeywords[i];
    let hits = 0;
    for (const kw of keywords) {
      hits += words.filter((w) => w === kw || w.includes(kw)).length;
    }
    vector[i] = hits;
  }

  // Normalize vector to unit length
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    return vector.map((v) => Number((v / magnitude).toFixed(4)));
  }

  // Fallback hash embedding
  return vector.map((_, i) => Number(((text.charCodeAt(i % text.length) || 1) / 255).toFixed(4)));
}

/**
 * Invokes the Anthropic API (or multi-provider fallback) to perform structured feedback analysis.
 */
export async function analyzeItemWithLLM(rawText: string, context?: { source?: string; tier?: string }): Promise<{ analysis: LLMAnalysisOutput; tokens: number; model: string; provider: string }> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();

  const systemPrompt = `You are an expert AI customer feedback intelligence engine for DealFlow AI.
Analyze the provided unstructured feedback item and return ONLY valid JSON matching this exact JSON schema:

{
  "sentiment": "positive" | "neutral" | "negative" | "mixed",
  "sentimentScore": -1.0 to 1.0 (float),
  "themeTags": ["feature request" | "bug" | "pricing complaint" | "churn risk" | "competitor mention" | "UX friction" | "praise" | other relevant tag],
  "entities": [
    {
      "name": "Entity Name",
      "entityType": "feature" | "competitor" | "error" | "pricing_tier" | "integration" | "general",
      "featureName": "specific feature if applicable",
      "competitorName": "competitor if mentioned",
      "errorType": "error description if applicable"
    }
  ],
  "severity": "low" | "medium" | "high" | "critical",
  "summary": "1 concise sentence summarizing the core feedback point."
}`;

  const userPrompt = `Source Context: ${context?.source || "Community Feedback"} | Plan Tier: ${context?.tier || "Growth"}\nRaw Feedback Content:\n"${rawText.replace(/"/g, '\\"')}"`;

  // 1. Try Anthropic API if key is configured
  if (anthropicKey) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.content?.[0]?.text || "";
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            analysis: sanitizeAnalysisOutput(parsed, rawText),
            tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
            model: "claude-3-haiku-20240307",
            provider: "anthropic",
          };
        }
      }
    } catch (anthropicErr) {
      console.warn("[CommunityMining:LLM] Anthropic API attempt failed, switching to backup provider:", anthropicErr);
    }
  }

  // 2. Try Hugging Face / Native DealflowLLM JSON inference
  try {
    const parsed = (await hfInferJSON(userPrompt, systemPrompt)) as any;
    if (parsed && typeof parsed === "object" && parsed.sentiment) {
      return {
        analysis: sanitizeAnalysisOutput(parsed, rawText),
        tokens: Math.ceil(rawText.length / 4) + 120,
        model: "dealflow-hf-instruct",
        provider: "huggingface",
      };
    }
  } catch (hfErr) {
    // Continue to heuristic analysis fallback
  }

  // 3. Fallback deterministic heuristic parser
  const heuristic = generateHeuristicAnalysis(rawText);
  return {
    analysis: heuristic,
    tokens: 100,
    model: "heuristic-rule-engine",
    provider: "dealflow-local",
  };
}

/**
 * Ensures strict schema compliance on parsed LLM analysis.
 */
function sanitizeAnalysisOutput(parsed: any, rawText: string): LLMAnalysisOutput {
  const validSentiments: CMSentiment[] = ["positive", "neutral", "negative", "mixed"];
  const validSeverities: CMSeverity[] = ["low", "medium", "high", "critical"];

  const sentiment: CMSentiment = validSentiments.includes(parsed.sentiment) ? parsed.sentiment : "neutral";
  let score = typeof parsed.sentimentScore === "number" ? parsed.sentimentScore : (
    sentiment === "positive" ? 0.8 : sentiment === "negative" ? -0.8 : sentiment === "mixed" ? 0.0 : 0.0
  );
  score = Math.max(-1.0, Math.min(1.0, score));

  const tags = Array.isArray(parsed.themeTags) ? parsed.themeTags.map(String) : ["general feedback"];
  const entities: CMEntity[] = Array.isArray(parsed.entities)
    ? parsed.entities.map((e: any) => ({
        name: String(e.name || e.featureName || e.competitorName || "Unknown"),
        entityType: e.entityType || "general",
        featureName: e.featureName,
        competitorName: e.competitorName,
        errorType: e.errorType,
      }))
    : [];

  const severity: CMSeverity = validSeverities.includes(parsed.severity) ? parsed.severity : (
    tags.includes("churn risk") || tags.includes("bug") ? "high" : "medium"
  );

  const summary = parsed.summary && typeof parsed.summary === "string" && parsed.summary.length > 5
    ? parsed.summary
    : rawText.slice(0, 140) + (rawText.length > 140 ? "..." : "");

  return {
    sentiment,
    sentimentScore: score,
    themeTags: tags,
    entities,
    severity,
    summary,
  };
}

/**
 * Deterministic rule-based analysis used for resilient offline operation & testing.
 */
export function generateHeuristicAnalysis(rawText: string): LLMAnalysisOutput {
  const lower = rawText.toLowerCase();
  const tags: string[] = [];
  const entities: CMEntity[] = [];

  let score = 0;
  let severity: CMSeverity = "low";

  // Bugs & Errors
  if (lower.includes("bug") || lower.includes("error") || lower.includes("crash") || lower.includes("fail") || lower.includes("broken")) {
    tags.push("bug");
    severity = "high";
    score -= 0.6;
    entities.push({ name: "Application Runtime", entityType: "error", errorType: "System Bug/Crash" });
  }

  // Churn Risk
  if (lower.includes("cancel") || lower.includes("leaving") || lower.includes("switch to") || lower.includes("quit") || lower.includes("too expensive")) {
    tags.push("churn risk");
    severity = "critical";
    score -= 0.8;
  }

  // Pricing
  if (lower.includes("price") || lower.includes("pricing") || lower.includes("cost") || lower.includes("expensive") || lower.includes("subscription")) {
    tags.push("pricing complaint");
    if (severity !== "critical") severity = "medium";
    score -= 0.4;
    entities.push({ name: "Pricing Structure", entityType: "pricing_tier" });
  }

  // Feature Request
  if (lower.includes("feature") || lower.includes("would like") || lower.includes("please add") || lower.includes("need support for") || lower.includes("wish there was")) {
    tags.push("feature request");
    if (severity === "low") severity = "medium";
    entities.push({ name: "Feature Expansion", entityType: "feature", featureName: "User Requested Enhancement" });
  }

  // Competitor Mention
  const knownCompetitors = ["hubspot", "salesforce", "outreach", "apollo", "clay", "instantly", "gong"];
  for (const comp of knownCompetitors) {
    if (lower.includes(comp)) {
      tags.push("competitor mention");
      entities.push({ name: comp.toUpperCase(), entityType: "competitor", competitorName: comp });
    }
  }

  // Praise
  if (lower.includes("love") || lower.includes("great") || lower.includes("amazing") || lower.includes("awesome") || lower.includes("best tool")) {
    tags.push("praise");
    score += 0.8;
  }

  // UX Friction
  if (lower.includes("confusing") || lower.includes("hard to use") || lower.includes("friction") || lower.includes("stuck") || lower.includes("can't find")) {
    tags.push("UX friction");
    if (severity === "low") severity = "medium";
    score -= 0.5;
  }

  if (tags.length === 0) {
    tags.push("general feedback");
  }

  const sentiment: CMSentiment = score > 0.3 ? "positive" : score < -0.3 ? "negative" : "neutral";

  return {
    sentiment,
    sentimentScore: Number(score.toFixed(2)),
    themeTags: tags,
    entities,
    severity,
    summary: rawText.slice(0, 120) + (rawText.length > 120 ? "..." : ""),
  };
}

/**
 * Batch processes unprocessed items in `cm_raw_items`.
 */
export async function processUnprocessedRawItems(batchSize = 25): Promise<{
  processedCount: number;
  insights: CMInsight[];
  totalTokens: number;
  estimatedCostUsd: number;
}> {
  let itemsToProcess: CMRawItem[] = [];

  if (db) {
    try {
      const snap = await db
        .collection("cm_raw_items")
        .where("processed", "==", false)
        .limit(batchSize)
        .get();

      itemsToProcess = snap.docs.map((d) => d.data() as CMRawItem);
    } catch (err) {
      console.warn("[CommunityMining:Processor] Firestore read error:", err);
    }
  }

  if (itemsToProcess.length === 0) {
    return { processedCount: 0, insights: [], totalTokens: 0, estimatedCostUsd: 0 };
  }

  const insights: CMInsight[] = [];
  let totalTokens = 0;
  const now = new Date().toISOString();

  for (const rawItem of itemsToProcess) {
    const { analysis, tokens, model, provider } = await analyzeItemWithLLM(rawItem.rawText, {
      source: rawItem.sourceType,
      tier: rawItem.planTier,
    });

    totalTokens += tokens;
    const embedding = generateTextEmbedding(rawItem.rawText);

    const insight: CMInsight = {
      id: `ins_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      rawItemId: rawItem.id,
      sourceId: rawItem.sourceId,
      sourceType: rawItem.sourceType,
      sentiment: analysis.sentiment,
      sentimentScore: analysis.sentimentScore,
      themeTags: analysis.themeTags,
      entities: analysis.entities,
      severity: analysis.severity,
      summary: analysis.summary,
      embeddingVector: embedding,
      planTier: rawItem.planTier,
      authorName: rawItem.author?.name,
      authorEmail: rawItem.author?.email,
      rawSnippet: rawItem.rawText.slice(0, 280),
      processedAt: now,
    };

    insights.push(insight);

    if (db) {
      try {
        await db.collection("cm_insights").doc(insight.id).set(insight);
        await db.collection("cm_raw_items").doc(rawItem.id).update({
          processed: true,
          processedAt: now,
          insightId: insight.id,
        });
      } catch (writeErr) {
        console.error("[CommunityMining:Processor] Firestore insight write error:", writeErr);
      }
    }
  }

  // Cost calculation: Claude Haiku ~$0.25 / 1M input tokens + $1.25 / 1M output tokens
  const estimatedCostUsd = Number(((totalTokens / 1_000_000) * 0.75).toFixed(6));

  // Log to cm_processing_logs
  if (db && itemsToProcess.length > 0) {
    const logId = `proc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const procLog: CMProcessingLog = {
      id: logId,
      sourceId: itemsToProcess[0]?.sourceId || "batch_process",
      itemCount: itemsToProcess.length,
      tokensUsed: totalTokens,
      estimatedCostUsd,
      modelUsed: "claude-3-haiku / dealflow-hf",
      provider: "anthropic",
      status: "success",
      timestamp: now,
    };

    try {
      await db.collection("cm_processing_logs").doc(logId).set(procLog);
    } catch (logErr) {
      // Non-blocking
    }
  }

  return {
    processedCount: insights.length,
    insights,
    totalTokens,
    estimatedCostUsd,
  };
}
