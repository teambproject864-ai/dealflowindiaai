// app/api/community-mining/sources/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";
import type { CMSource } from "@/types/community-mining";

export async function GET(req: Request) {
  const { user, errorResponse } = await requireAuth(req, ["admin", "agent"]);
  if (errorResponse) return errorResponse;

  try {
    let sources: CMSource[] = [];

    if (db) {
      const snap = await db.collection("cm_sources").get();
      sources = snap.docs.map((d) => d.data() as CMSource);
    }

    // If no sources exist yet in DB, return initial baseline sources
    if (sources.length === 0) {
      sources = [
        {
          id: "src_support_zendesk",
          name: "Customer Support (Zendesk / Intercom)",
          type: "support",
          status: "active",
          itemCount: 42,
          config: { platformName: "Zendesk", dailyItemCap: 500 },
          lastSyncedAt: new Date(Date.now() - 3600000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "call_transcript",
          name: "Live Call Bot Transcripts",
          type: "call_transcript",
          status: "active",
          itemCount: 28,
          config: { platformName: "DealFlow Live Meeting Bot" },
          lastSyncedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "src_discord_community",
          name: "Discord & Slack Community Channels",
          type: "community",
          status: "active",
          itemCount: 65,
          config: { platformName: "Discord" },
          lastSyncedAt: new Date(Date.now() - 7200000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "src_g2_capterra_reviews",
          name: "G2 & Capterra Reviews",
          type: "review",
          status: "active",
          itemCount: 19,
          config: { pollingIntervalHours: 12, platformName: "G2 Crowd" },
          lastSyncedAt: new Date(Date.now() - 14400000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    return NextResponse.json({ success: true, sources });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch sources" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { user, errorResponse } = await requireAuth(req, ["admin", "agent"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, type, config, status } = body;

    if (!name || !type) {
      return NextResponse.json({ success: false, error: "Missing required fields: name, type" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const sourceId = `src_${type}_${Date.now().toString(36)}`;

    const newSource: CMSource = {
      id: sourceId,
      name,
      type,
      status: status || "active",
      config: config || {},
      itemCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    if (db) {
      await db.collection("cm_sources").doc(sourceId).set(newSource);
    }

    return NextResponse.json({ success: true, source: newSource });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create source" },
      { status: 500 }
    );
  }
}
