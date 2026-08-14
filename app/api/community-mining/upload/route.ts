// app/api/community-mining/upload/route.ts

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { parseCSVFeedback, parseJSONFeedback, ingestRawItems } from "@/lib/community-mining/ingestion";
import { processUnprocessedRawItems } from "@/lib/community-mining/processor";

export async function POST(req: Request) {
  const { user, errorResponse } = await requireAuth(req, ["admin", "agent"]);
  if (errorResponse) return errorResponse;

  try {
    const contentType = req.headers.get("content-type") || "";
    let fileContent = "";
    let fileFormat: "csv" | "json" = "csv";
    let sourceId = "manual_upload";
    let autoProcess = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      sourceId = (formData.get("sourceId") as string) || "manual_upload";
      autoProcess = formData.get("autoProcess") === "true";

      if (!file) {
        return NextResponse.json({ success: false, error: "No file provided in form data" }, { status: 400 });
      }

      fileContent = await file.text();
      fileFormat = file.name.endsWith(".json") ? "json" : "csv";
    } else {
      const jsonBody = await req.json();
      fileContent = jsonBody.content || "";
      fileFormat = jsonBody.format || "csv";
      sourceId = jsonBody.sourceId || "manual_upload";
      autoProcess = jsonBody.autoProcess === true;
    }

    if (!fileContent || fileContent.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Empty file content provided" }, { status: 400 });
    }

    // Parse items according to file format
    const parsedPayloads = fileFormat === "json"
      ? parseJSONFeedback(fileContent, sourceId)
      : parseCSVFeedback(fileContent, sourceId);

    if (parsedPayloads.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Failed to parse any feedback rows. Please ensure your CSV has a 'feedback' or 'text' column, or upload valid JSON.",
      }, { status: 400 });
    }

    // Ingest with deduplication
    const result = await ingestRawItems(parsedPayloads, sourceId);

    // Run batch processing if requested
    let processingOutput = null;
    if (autoProcess && result.ingested > 0) {
      processingOutput = await processUnprocessedRawItems(result.ingested);
    }

    return NextResponse.json({
      success: true,
      received: result.received,
      ingested: result.ingested,
      deduped: result.deduped,
      processed: processingOutput?.processedCount || 0,
      logId: result.logId,
    });
  } catch (error: any) {
    console.error("[CommunityMining:Upload] Upload processing error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "File upload processing failed" },
      { status: 500 }
    );
  }
}
