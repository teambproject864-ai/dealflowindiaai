// app/api/community-mining/feedback/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";
import type { CMInsight } from "@/types/community-mining";

export async function GET(req: Request) {
  const { user, errorResponse } = await requireAuth(req, ["admin", "agent"]);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const sourceId = searchParams.get("sourceId");
    const sentiment = searchParams.get("sentiment");
    const planTier = searchParams.get("planTier");
    const themeId = searchParams.get("themeId");
    const query = (searchParams.get("q") || "").toLowerCase();

    let insights: CMInsight[] = [];

    if (db) {
      const snap = await db.collection("cm_insights").orderBy("processedAt", "desc").limit(100).get();
      insights = snap.docs.map((d) => d.data() as CMInsight);
    }

    // Default sample fallback if DB has just been initialized
    if (insights.length === 0) {
      insights = [
        {
          id: "ins_1",
          rawItemId: "raw_1",
          sourceId: "src_support_zendesk",
          sourceType: "support",
          sentiment: "neutral",
          sentimentScore: 0.1,
          themeTags: ["feature request", "integration"],
          entities: [{ name: "HubSpot", entityType: "integration" }, { name: "Salesforce", entityType: "integration" }],
          severity: "high",
          summary: "Customer requested bi-directional real-time sync with HubSpot to auto-update deal stages.",
          rawSnippet: "We really need HubSpot bi-directional sync to automate contact updates instead of manual CSV imports.",
          planTier: "enterprise",
          authorName: "Marcus Vance",
          authorEmail: "marcus@vancecorp.io",
          processedAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "ins_2",
          rawItemId: "raw_2",
          sourceId: "call_transcript",
          sourceType: "call_transcript",
          sentiment: "negative",
          sentimentScore: -0.4,
          themeTags: ["UX friction", "bug"],
          entities: [{ name: "Live Call Bot", entityType: "feature" }, { name: "STT Latency", entityType: "error" }],
          severity: "high",
          summary: "Audio delay and brief clipping detected when the prospect interrupts the AI voice bot.",
          rawSnippet: "Prospect mentioned: The bot's responses are accurate, but when I jump in mid-sentence it takes a second and a half to stop talking.",
          planTier: "growth",
          authorName: "Elena Rostova",
          authorEmail: "elena@novapower.com",
          processedAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: "ins_3",
          rawItemId: "raw_3",
          sourceId: "src_discord_community",
          sourceType: "community",
          sentiment: "negative",
          sentimentScore: -0.6,
          themeTags: ["bug", "pricing complaint"],
          entities: [{ name: "Email Sequencing", entityType: "feature" }, { name: "429 Rate Limit", entityType: "error" }],
          severity: "critical",
          summary: "Encountering rate limits and credit exhaustion during peak email sequence campaigns.",
          rawSnippet: "Anyone else running into 429 rate limit errors on the AI outbound email sequencing workflow? We hit credit cap unexpectedly.",
          planTier: "starter",
          authorName: "Alex Chen",
          authorEmail: "alex@techboost.dev",
          processedAt: new Date(Date.now() - 14400000).toISOString(),
        },
        {
          id: "ins_4",
          rawItemId: "raw_4",
          sourceId: "src_g2_capterra_reviews",
          sourceType: "review",
          sentiment: "positive",
          sentimentScore: 0.95,
          themeTags: ["praise"],
          entities: [{ name: "GTM Playbook Generator", entityType: "feature" }],
          severity: "low",
          summary: "High user praise for the autonomous multi-agent campaign playbook generator.",
          rawSnippet: "The multi-agent playbook generation generated 3 qualified enterprise meetings in our first week. Massive time-saver for our SDRs.",
          planTier: "enterprise",
          authorName: "Samantha Reed",
          authorEmail: "samantha@scalevector.co",
          processedAt: new Date(Date.now() - 28800000).toISOString(),
        },
        {
          id: "ins_5",
          rawItemId: "raw_5",
          sourceId: "src_support_zendesk",
          sourceType: "support",
          sentiment: "negative",
          sentimentScore: -0.85,
          themeTags: ["churn risk", "competitor mention"],
          entities: [{ name: "Instantly", entityType: "competitor" }, { name: "Apollo", entityType: "competitor" }],
          severity: "critical",
          summary: "Customer considering migrating to Instantly due to missing unlimited inbox rotation.",
          rawSnippet: "If inbox warm-up and unlimited rotation aren't added this month, we'll likely cancel and switch to Instantly.",
          planTier: "growth",
          authorName: "Jordan Blake",
          authorEmail: "jordan@blakemedia.com",
          processedAt: new Date(Date.now() - 36000000).toISOString(),
        },
      ];
    }

    let filtered = insights;
    if (sourceId && sourceId !== "all") {
      filtered = filtered.filter((i) => i.sourceId === sourceId || i.sourceType === sourceId);
    }
    if (sentiment && sentiment !== "all") {
      filtered = filtered.filter((i) => i.sentiment === sentiment);
    }
    if (planTier && planTier !== "all") {
      filtered = filtered.filter((i) => i.planTier === planTier);
    }
    if (query) {
      filtered = filtered.filter((i) =>
        i.summary.toLowerCase().includes(query) ||
        i.rawSnippet.toLowerCase().includes(query) ||
        i.themeTags.some((t) => t.toLowerCase().includes(query)) ||
        (i.authorName && i.authorName.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({
      success: true,
      totalCount: filtered.length,
      insights: filtered,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to query feedback feed" },
      { status: 500 }
    );
  }
}
