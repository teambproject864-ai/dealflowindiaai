// app/api/community-mining/webhook/route.ts

import { NextResponse } from "next/server";
import { ingestRawItems, type IngestItemPayload } from "@/lib/community-mining/ingestion";
import { processUnprocessedRawItems } from "@/lib/community-mining/processor";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Support single item or batch array payload
    const rawItems: any[] = Array.isArray(body) ? body : (body.items || [body]);

    if (rawItems.length === 0) {
      return NextResponse.json({ success: false, error: "Empty payload received" }, { status: 400 });
    }

    const payloads: IngestItemPayload[] = rawItems.map((item, idx) => ({
      sourceId: item.sourceId || "webhook_push",
      sourceType: item.sourceType || "support",
      externalId: String(item.externalId || item.id || item.ticketId || `ext_${Date.now()}_${idx}`),
      rawText: String(item.rawText || item.text || item.feedback || item.content || item.comment || ""),
      author: {
        name: item.author?.name || item.name || item.author,
        email: item.author?.email || item.email,
        company: item.author?.company || item.company,
      },
      segment: item.segment || "general",
      planTier: item.planTier || item.tier || "growth",
      metadata: item.metadata || {},
      createdAt: item.createdAt || new Date().toISOString(),
    })).filter((it) => it.rawText.trim().length > 0);

    if (payloads.length === 0) {
      return NextResponse.json({ success: false, error: "No valid text found in payload" }, { status: 400 });
    }

    // Ingest with deduplication
    const result = await ingestRawItems(payloads);

    // Optionally trigger background processing for the batch
    const autoProcess = req.headers.get("x-auto-process") === "true" || body.autoProcess === true;
    let processResult = null;
    if (autoProcess && result.ingested > 0) {
      processResult = await processUnprocessedRawItems(result.ingested);
    }

    return NextResponse.json({
      success: true,
      received: result.received,
      ingested: result.ingested,
      deduped: result.deduped,
      logId: result.logId,
      processed: processResult?.processedCount || 0,
    });
  } catch (error: any) {
    console.error("[CommunityMining:Webhook] Ingestion error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal webhook processing error" },
      { status: 500 }
    );
  }
}
