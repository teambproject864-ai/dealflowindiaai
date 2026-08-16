// tests/keyword-studio-enhanced.test.ts

import assert from "assert";
import { 
  KeywordStudioEngine, 
  DiscoveredKeywordSet, 
  KeywordStudioConfig,
  GroundingInputContext 
} from "../lib/keyword-studio-engine";
import { COMPLETE_CAMPAIGN_SCHEMA, getTaxonomyMetrics } from "../lib/campaign-options-schema";

export async function runKeywordStudioEnhancedTests() {
  console.log("\n============================================================");
  console.log("🚀 RUNNING ENHANCED SEO & GEO KEYWORD STUDIO TEST SUITE");
  console.log("============================================================\n");

  const sampleCustomerProfile = {
    companyName: "HyperScale Analytics Inc",
    industry: "Enterprise AI & Revenue Intelligence",
    targetAudience: "Chief Revenue Officers & VPs of Sales",
    businessGoals: "Double outbound pipeline conversion and automate SDR workflows",
    keywords: "AI sales agent, pipeline velocity automation, revops intelligence",
    geographicMarkets: "North America & EMEA",
    brandTone: "Authoritative, High-Energy, ROI-Focused",
    companyInformation: {
      websiteUrl: "https://hyperscaleanalytics.ai",
      headquarters: { city: "San Francisco", country: "United States" }
    }
  };

  // -------------------------------------------------------------
  // TEST 1: Automated Grounded SEO & GEO Keyword Extraction
  // -------------------------------------------------------------
  console.log("--> [1/6] Testing Automated Grounded SEO & GEO Keyword Discovery...");
  
  const context: GroundingInputContext = {
    customerProfile: sampleCustomerProfile,
    customerName: sampleCustomerProfile.companyName,
    industry: sampleCustomerProfile.industry,
    categoryTitle: "Written Content",
    subTypeTitle: "SEO Optimized Blog Post",
    badge: "SEO-1",
    formValues: {
      openingHook: "Legacy sales development is broken. AI deal flow is the antidote.",
      targetPersona: "Chief Revenue Officers",
      primaryKeyword: "Autonomous Sales Pipeline",
      callToAction: "Book a 15-Minute Strategy Demo"
    }
  };

  const initialKeywordSet = KeywordStudioEngine.extractGroundedKeywords(context, {
    expansionDepth: "standard"
  });

  assert.ok(initialKeywordSet.seoKeywords.length >= 6, "Extracted at least 6 SEO keywords");
  assert.ok(initialKeywordSet.geoKeywords.length >= 5, "Extracted at least 5 GEO query triggers");

  // Verify dynamic grounding from customer profile and project requirements
  const seoKeywordsText = initialKeywordSet.seoKeywords.map(k => k.keyword.toLowerCase()).join(" ");
  assert.ok(
    seoKeywordsText.includes("ai sales agent") || 
    seoKeywordsText.includes("hyperscale analytics") || 
    seoKeywordsText.includes("enterprise ai") ||
    seoKeywordsText.includes("sales"),
    "SEO keywords dynamically ground in customer profile intake tokens"
  );

  // Verify search intent classification
  const intents = new Set(initialKeywordSet.seoKeywords.map(k => k.intent));
  assert.ok(intents.has("commercial") || intents.has("informational") || intents.has("transactional"), "Intents classified");

  // Verify GEO targets include major AI engines
  const geoEngines = new Set(initialKeywordSet.geoKeywords.map(g => g.engineTarget));
  assert.ok(geoEngines.has("ChatGPT / SearchGPT") || geoEngines.has("Perplexity AI") || geoEngines.has("Google AI Overviews (SGE)"), "GEO queries target generative AI engines");

  console.log(`  ✅ Grounded SEO (${initialKeywordSet.seoKeywords.length}) & GEO (${initialKeywordSet.geoKeywords.length}) keywords successfully synthesized`);

  // -------------------------------------------------------------
  // TEST 2: Dedicated Configuration Options & Intent Filtering
  // -------------------------------------------------------------
  console.log("--> [2/6] Testing Dedicated Configuration Options (Depth, Intent Filters, Engine Target)...");

  const deepConfig: KeywordStudioConfig = {
    autoGenerateSeo: true,
    autoGenerateGeo: true,
    targetEngines: ["ChatGPT / SearchGPT", "Perplexity AI", "Claude"],
    intentFilters: ["commercial", "transactional"],
    expansionDepth: "deep",
    autoSyncPreview: true
  };

  const deepFilteredSet = KeywordStudioEngine.extractGroundedKeywords(context, deepConfig);

  // Ensure only commercial and transactional keywords are present
  deepFilteredSet.seoKeywords.forEach(k => {
    assert.ok(
      k.intent === "commercial" || k.intent === "transactional",
      `Filtered keyword ${k.keyword} matches intent filter (${k.intent})`
    );
  });

  assert.ok(deepFilteredSet.seoKeywords.length > 0, "Intent-filtered keyword list populated");
  console.log(`  ✅ Configuration filtering verified: ${deepFilteredSet.seoKeywords.length} commercial/transactional keywords`);

  // -------------------------------------------------------------
  // TEST 3: Dynamic Live Keyword Search & Ad-Hoc Parameter Injection
  // -------------------------------------------------------------
  console.log("--> [3/6] Testing Live Keyword Search & Ad-Hoc Query Matching...");

  const searchResults = KeywordStudioEngine.searchKeywords(
    initialKeywordSet,
    "pipeline velocity",
    context
  );

  assert.ok(searchResults.seoKeywords.length > 0, "Search returns matched or suggested SEO keywords");
  assert.ok(searchResults.geoKeywords.length > 0, "Search returns matched or suggested GEO query targets");
  console.log(`  ✅ Keyword search engine verified with query 'pipeline velocity'`);

  // -------------------------------------------------------------
  // TEST 4: Intelligent Keyword Rewriting Engine
  // -------------------------------------------------------------
  console.log("--> [4/6] Testing Intelligent Keyword Rewriting & Expansion...");

  const rewrittenSet = KeywordStudioEngine.intelligentlyRewriteKeywords(
    initialKeywordSet,
    context,
    "high_conversion"
  );

  assert.ok(rewrittenSet.seoKeywords.length >= initialKeywordSet.seoKeywords.length, "Rewritten set contains full matrix");
  assert.ok(rewrittenSet.geoKeywords.some(g => g.query.includes("verified")), "GEO queries enhanced with citation verification hooks");
  console.log("  ✅ Intelligent keyword rewrite verified with conversion optimizations");

  // -------------------------------------------------------------
  // TEST 5: Fully Formatted Semantic HTML Generation Engine
  // -------------------------------------------------------------
  console.log("--> [5/6] Testing Production-Ready Semantic HTML Output Generation...");

  const generatedHtml = KeywordStudioEngine.buildSemanticHtmlDeliverable({
    categoryTitle: "Written Content",
    subTypeTitle: "SEO Optimized Blog Post",
    badge: "SEO-1",
    customerName: sampleCustomerProfile.companyName,
    formValues: context.formValues!,
    keywordSet: rewrittenSet,
    isRewrite: false,
    customerProfile: sampleCustomerProfile
  });

  // Verify critical semantic tags
  assert.ok(generatedHtml.includes("<article"), "Contains <article> root semantic container");
  assert.ok(generatedHtml.includes("<header"), "Contains <header> metadata section");
  assert.ok(generatedHtml.includes("<blockquote"), "Contains executive hook narrative blockquote");
  assert.ok(generatedHtml.includes("application/ld+json"), "Contains structured JSON-LD SEO/GEO schema");
  assert.ok(generatedHtml.includes("Embedded Optimization Target Matrix"), "Contains embedded SEO & GEO matrix card");
  assert.ok(generatedHtml.includes("Call to Action Trigger"), "Contains conversion CTA block");
  assert.ok(generatedHtml.includes(sampleCustomerProfile.companyName), "Contains grounded customer brand name");

  console.log("  ✅ Fully formatted semantic HTML generation verified with JSON-LD and SEO/GEO matrix");

  // -------------------------------------------------------------
  // TEST 6: Real-Time Preview Synchronization Across Taxonomy
  // -------------------------------------------------------------
  console.log("--> [6/6] Testing Real-Time Preview Synchronization Across Taxonomy Sub-Types...");

  const taxonomyMetrics = getTaxonomyMetrics();
  assert.strictEqual(taxonomyMetrics.totalCategories, 20, "All 20 taxonomy categories verified");
  assert.ok(taxonomyMetrics.totalOptions >= 180, `Expected at least 180 options, got ${taxonomyMetrics.totalOptions}`);

  // Test across multiple distinct taxonomy categories
  const testSubTypes = [
    { catId: "social_media_content", subId: "linkedin_thought_leadership", title: "LinkedIn Thought Leadership" },
    { catId: "outreach_tactics", subId: "cold_email_sequences", title: "Cold Email Sequence" },
    { catId: "seo_tactics", subId: "programmatic_seo", title: "Programmatic SEO Matrix" },
    { catId: "paid_marketing_tactics", subId: "google_search_ads", title: "Google Search Ads Campaign" }
  ];

  for (const item of testSubTypes) {
    const subContext: GroundingInputContext = {
      customerProfile: sampleCustomerProfile,
      customerName: sampleCustomerProfile.companyName,
      categoryTitle: item.catId,
      subTypeTitle: item.title,
      formValues: {
        openingHook: `Driving exponential growth with ${item.title}`,
        primaryKeyword: `${item.title} B2B`
      }
    };

    const subKeywords = KeywordStudioEngine.extractGroundedKeywords(subContext);
    const subHtml = KeywordStudioEngine.buildSemanticHtmlDeliverable({
      categoryTitle: item.catId,
      subTypeTitle: item.title,
      badge: "ACTIVE",
      customerName: sampleCustomerProfile.companyName,
      formValues: subContext.formValues!,
      keywordSet: subKeywords,
      customerProfile: sampleCustomerProfile
    });

    assert.ok(subHtml.includes(item.title), `HTML generated successfully for ${item.title}`);
    assert.ok(subHtml.includes("dealflow-deliverable-article"), `Valid article styling for ${item.title}`);
  }

  console.log("  ✅ Real-time deliverable generation verified across all tested taxonomy workflows");

  console.log("\n============================================================");
  console.log("🎉 ALL ENHANCED KEYWORD STUDIO TESTS PASSED (6/6)!");
  console.log("============================================================\n");
}

if (require.main === module) {
  runKeywordStudioEnhancedTests().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
}
