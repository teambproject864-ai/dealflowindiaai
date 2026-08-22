// lib/llm-router/content-analyzer.ts

export type ContentType = 
  | "sales_negotiation" 
  | "gtm_strategy" 
  | "extraction" 
  | "conversational" 
  | "code" 
  | "financial_audit" 
  | "compliance";

export type DomainType = 
  | "b2b_saas" 
  | "fintech" 
  | "healthcare" 
  | "legal_compliance" 
  | "general";

export interface ContentAnalysisResult {
  contentType: ContentType;
  complexityScore: number; // 1 to 10
  complexityTier: "low" | "medium" | "high" | "ultra";
  detectedLanguage: string;
  isMultilingual: boolean;
  domain: DomainType;
  entityDensity: number;
  reasoningRequired: boolean;
  tokenEstimate: number;
  keywords: string[];
}

/**
 * Analyzes prompt/task content across type, complexity, language, and domain specificity.
 */
export function analyzeTaskContent(content: string, contextMetadata?: Record<string, any>): ContentAnalysisResult {
  const text = content.toLowerCase();
  const wordCount = content.trim().split(/\s+/).length;
  const tokenEstimate = Math.ceil(wordCount * 1.33);

  // 1. Content Type Detection
  let contentType: ContentType = "conversational";
  if (
    text.includes("discount") || 
    text.includes("pricing") || 
    text.includes("terms") || 
    text.includes("concession") || 
    text.includes("counteroffer") ||
    text.includes("close deal")
  ) {
    contentType = "sales_negotiation";
  } else if (
    text.includes("gtm") || 
    text.includes("go-to-market") || 
    text.includes("playbook") || 
    text.includes("icp") || 
    text.includes("battlecard") ||
    text.includes("positioning")
  ) {
    contentType = "gtm_strategy";
  } else if (
    text.includes("function") || 
    text.includes("const ") || 
    text.includes("import ") || 
    text.includes("class ") || 
    text.includes("sql") ||
    text.includes("json")
  ) {
    contentType = "code";
  } else if (
    text.includes("extract") || 
    text.includes("parse") || 
    text.includes("entities") || 
    text.includes("structured data")
  ) {
    contentType = "extraction";
  } else if (
    text.includes("audit") || 
    text.includes("revenue") || 
    text.includes("ebitda") || 
    text.includes("margin") || 
    text.includes("balance sheet")
  ) {
    contentType = "financial_audit";
  } else if (
    text.includes("compliance") || 
    text.includes("gdpr") || 
    text.includes("hipaa") || 
    text.includes("soc2") || 
    text.includes("disclaimer")
  ) {
    contentType = "compliance";
  }

  // Override by explicit metadata if provided
  if (contextMetadata?.requestType) {
    if (contextMetadata.requestType.startsWith("gtm-")) contentType = "gtm_strategy";
    if (contextMetadata.requestType === "negotiation") contentType = "sales_negotiation";
  }

  // 2. Domain Specificity
  let domain: DomainType = "general";
  if (text.includes("saas") || text.includes("arr") || text.includes("cac") || text.includes("churn") || text.includes("mrr") || text.includes("b2b")) {
    domain = "b2b_saas";
  } else if (text.includes("payment") || text.includes("fintech") || text.includes("wire") || text.includes("interest rate") || text.includes("banking")) {
    domain = "fintech";
  } else if (text.includes("patient") || text.includes("clinical") || text.includes("hipaa") || text.includes("medical") || text.includes("diagnosis")) {
    domain = "healthcare";
  } else if (text.includes("contract") || text.includes("liability") || text.includes("indemnity") || text.includes("clause") || text.includes("jurisdiction")) {
    domain = "legal_compliance";
  }

  // 3. Language & Multi-Lingual Detection
  const nonEnglishMatches = content.match(/[\u0600-\u06FF\u0750-\u077F\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\u0400-\u04FF\u0900-\u097F]/g);
  const detectedLanguage = nonEnglishMatches && nonEnglishMatches.length > 5 ? "multilingual" : "en";
  const isMultilingual = detectedLanguage !== "en" || text.includes("translate") || text.includes("español") || text.includes("français");

  // 4. Complexity Scoring (1-10)
  let score = 2; // base simple score

  // Length weight
  if (tokenEstimate > 1500) score += 3;
  else if (tokenEstimate > 500) score += 2;
  else if (tokenEstimate > 150) score += 1;

  // Domain & Type weight
  if (contentType === "sales_negotiation" || contentType === "financial_audit") score += 2;
  if (contentType === "gtm_strategy" || contentType === "code") score += 2;
  if (domain !== "general") score += 1;
  if (isMultilingual) score += 1;

  // Reasoning requirement triggers
  const reasoningTriggers = ["step by step", "analyze", "evaluate", "compare", "justify", "pros and cons", "trade-offs", "multi-tenant"];
  const hasReasoning = reasoningTriggers.some(t => text.includes(t));
  if (hasReasoning) score += 2;

  // Cap between 1 and 10
  const finalComplexity = Math.max(1, Math.min(10, score));
  let complexityTier: "low" | "medium" | "high" | "ultra" = "low";
  if (finalComplexity >= 9) complexityTier = "ultra";
  else if (finalComplexity >= 7) complexityTier = "high";
  else if (finalComplexity >= 4) complexityTier = "medium";

  // Entity density estimation
  const entityMatches = content.match(/([A-Z][a-z]+(\s+[A-Z][a-z]+)*|\$\d+(\.\d+)?|\d+%\s*)/g) || [];
  const entityDensity = Number((entityMatches.length / Math.max(1, wordCount)).toFixed(3));

  // Extract key phrases
  const keywords = Array.from(new Set(
    (content.match(/\b[A-Za-z]{4,}\b/g) || [])
      .map(w => w.toLowerCase())
      .filter(w => !["this", "that", "with", "have", "from", "they", "will", "what", "when", "your"].includes(w))
  )).slice(0, 8);

  return {
    contentType,
    complexityScore: finalComplexity,
    complexityTier,
    detectedLanguage,
    isMultilingual,
    domain,
    entityDensity,
    reasoningRequired: hasReasoning || finalComplexity >= 7,
    tokenEstimate,
    keywords,
  };
}
