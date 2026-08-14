// app/api/community-mining/cron/cluster/route.ts

import { NextResponse } from "next/server";
import { runDailyClusteringJob } from "@/lib/community-mining/clustering";
import { evaluateAndRouteThemes } from "@/lib/community-mining/router";

export async function GET(req: Request) {
  return handleCronCluster(req);
}

export async function POST(req: Request) {
  return handleCronCluster(req);
}

async function handleCronCluster(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && process.env.NODE_ENV === "production") {
      return NextResponse.json({ success: false, error: "Unauthorized cron execution" }, { status: 401 });
    }

    // 1. Run clustering on all processed insights
    const clusterResult = await runDailyClusteringJob();

    // 2. Evaluate routing rules & dispatch threshold alerts
    let routeResult = { dispatched: 0, notifications: [] as any[] };
    if (clusterResult.themes.length > 0) {
      routeResult = await evaluateAndRouteThemes(clusterResult.themes);
    }

    return NextResponse.json({
      success: true,
      clusteredThemesCount: clusterResult.themeCount,
      notificationsDispatched: routeResult.dispatched,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[CommunityMining:CronCluster] Clustering cron error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Scheduled clustering failed" },
      { status: 500 }
    );
  }
}
