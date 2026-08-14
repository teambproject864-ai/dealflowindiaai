// app/api/community-mining/process/route.ts

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { processUnprocessedRawItems } from "@/lib/community-mining/processor";
import { runDailyClusteringJob } from "@/lib/community-mining/clustering";
import { evaluateAndRouteThemes } from "@/lib/community-mining/router";

export async function POST(req: Request) {
  const { user, errorResponse } = await requireAuth(req, ["admin", "agent"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(50, Math.max(1, Number(body.batchSize) || 25));
    const triggerClustering = body.triggerClustering === true;

    // 1. Process Raw Items with LLM
    const processResult = await processUnprocessedRawItems(batchSize);

    // 2. Optional instant clustering and routing trigger
    let clusterResult = null;
    let routingResult = null;

    if (triggerClustering || processResult.processedCount > 0) {
      clusterResult = await runDailyClusteringJob();
      if (clusterResult.themes.length > 0) {
        routingResult = await evaluateAndRouteThemes(clusterResult.themes);
      }
    }

    return NextResponse.json({
      success: true,
      processedItems: processResult.processedCount,
      totalTokens: processResult.totalTokens,
      estimatedCostUsd: processResult.estimatedCostUsd,
      themesGenerated: clusterResult?.themeCount || 0,
      notificationsDispatched: routingResult?.dispatched || 0,
    });
  } catch (error: any) {
    console.error("[CommunityMining:Process] Processing error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process raw items" },
      { status: 500 }
    );
  }
}
