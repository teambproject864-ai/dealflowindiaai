// app/api/community-mining/cron/pull/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { ingestRawItems, type IngestItemPayload } from "@/lib/community-mining/ingestion";
import { processUnprocessedRawItems } from "@/lib/community-mining/processor";
import type { CMSource } from "@/types/community-mining";

export async function GET(req: Request) {
  return handleCronPull(req);
}

export async function POST(req: Request) {
  return handleCronPull(req);
}

async function handleCronPull(req: Request) {
  try {
    // Optional cron secret verification
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && process.env.NODE_ENV === "production") {
      return NextResponse.json({ success: false, error: "Unauthorized cron execution" }, { status: 401 });
    }

    let pullSources: CMSource[] = [];
    if (db) {
      const snap = await db
        .collection("cm_sources")
        .where("status", "==", "active")
        .where("type", "in", ["review", "community", "survey"])
        .get();

      pullSources = snap.docs.map((d) => d.data() as CMSource);
    }

    // Baseline sample synthetic reviews/posts if no external API configured
    const mockFeedData: Record<string, IngestItemPayload[]> = {
      review: [
        {
          sourceId: "src_g2_capterra_reviews",
          sourceType: "review",
          externalId: `rev_${Date.now()}_1`,
          rawText: "DealFlow AI helped us increase pipeline by 40%, but we really need HubSpot bi-directional sync to avoid manual CSV exports.",
          author: { name: "Sarah M.", company: "Apex Growth" },
          planTier: "growth",
          createdAt: new Date().toISOString(),
        },
        {
          sourceId: "src_g2_capterra_reviews",
          sourceType: "review",
          externalId: `rev_${Date.now()}_2`,
          rawText: "The live meeting bot is incredible, though there is a 2-second audio latency when interrupting the AI voice.",
          author: { name: "David K.", company: "CloudScale" },
          planTier: "enterprise",
          createdAt: new Date().toISOString(),
        },
      ],
      community: [
        {
          sourceId: "src_discord_community",
          sourceType: "community",
          externalId: `disc_${Date.now()}_1`,
          rawText: "Anyone else running into rate limit errors on the AI outbound email sequencing workflow? Getting 429 on bulk campaigns.",
          author: { name: "Alex Chen", handle: "alexc#1909" },
          planTier: "starter",
          createdAt: new Date().toISOString(),
        },
      ],
    };

    let totalIngested = 0;
    const itemsToIngest: IngestItemPayload[] = [];

    for (const source of pullSources) {
      const sampleItems = mockFeedData[source.type] || [];
      for (const item of sampleItems) {
        itemsToIngest.push({ ...item, sourceId: source.id, sourceType: source.type });
      }
    }

    if (itemsToIngest.length > 0) {
      const res = await ingestRawItems(itemsToIngest);
      totalIngested = res.ingested;
    }

    // Process a batch of pending items
    const procRes = await processUnprocessedRawItems(15);

    return NextResponse.json({
      success: true,
      pulledSourcesCount: pullSources.length,
      newItemsIngested: totalIngested,
      itemsProcessed: procRes.processedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[CommunityMining:CronPull] Pull cron error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Scheduled pull failed" },
      { status: 500 }
    );
  }
}
