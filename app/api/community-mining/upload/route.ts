// app/api/community-mining/upload/route.ts

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { parseCSVFeedback, parseJSONFeedback, ingestRawItems } from "@/lib/community-mining/ingestion";
import { processUnprocessedRawItems } from "@/lib/community-mining/processor";
import { fetchSpreadsheetCsv, appendCsvData, SpreadsheetConnectionError, InvalidCsvFormatError } from "@/lib/bulk-csv-processor";

export async function POST(req: Request) {
  const { user, errorResponse } = await requireAuth(req, ["admin", "agent"]);
  if (errorResponse) return errorResponse;

  try {
    const contentType = req.headers.get("content-type") || "";
    let fileContent = "";
    let fileFormat: "csv" | "json" = "csv";
    let sourceId = "manual_upload";
    let autoProcess = false;
    let spreadsheetUrl = "";
    let autoAppend = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      sourceId = (formData.get("sourceId") as string) || "manual_upload";
      autoProcess = formData.get("autoProcess") === "true";
      spreadsheetUrl = (formData.get("spreadsheetUrl") as string) || "";
      autoAppend = formData.get("autoAppend") === "true";

      if (file) {
        fileContent = await file.text();
        fileFormat = file.name.endsWith(".json") ? "json" : "csv";
      } else if (spreadsheetUrl) {
        fileContent = await fetchSpreadsheetCsv(spreadsheetUrl);
        fileFormat = "csv";
      } else {
        return NextResponse.json({ success: false, error: "No file or spreadsheet URL provided." }, { status: 400 });
      }
    } else {
      const jsonBody = await req.json();
      fileContent = jsonBody.content || "";
      fileFormat = jsonBody.format || "csv";
      sourceId = jsonBody.sourceId || "manual_upload";
      autoProcess = jsonBody.autoProcess === true;
      spreadsheetUrl = jsonBody.spreadsheetUrl || "";
      autoAppend = jsonBody.autoAppend === true;

      if (!fileContent && spreadsheetUrl) {
        fileContent = await fetchSpreadsheetCsv(spreadsheetUrl);
        fileFormat = "csv";
      }
    }

    if (!fileContent || fileContent.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Empty file or spreadsheet content provided" }, { status: 400 });
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

    // Auto-append if spreadsheet URL was provided
    let appendStatus = null;
    if (autoAppend && spreadsheetUrl) {
      appendStatus = await appendCsvData(
        spreadsheetUrl,
        parsedPayloads.map((p) => ({
          externalId: p.externalId,
          text: p.rawText,
          author: p.author?.name || "",
          planTier: p.planTier || "",
          ingestionStatus: "SUCCESS",
          ingestedAt: new Date().toISOString(),
        })),
        { destinationType: "url" }
      );
    }

    return NextResponse.json({
      success: true,
      received: result.received,
      ingested: result.ingested,
      deduped: result.deduped,
      processed: processingOutput?.processedCount || 0,
      logId: result.logId,
      appended: appendStatus?.success || false,
    });
  } catch (error: any) {
    if (error instanceof SpreadsheetConnectionError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: 502 });
    }
    if (error instanceof InvalidCsvFormatError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: 422 });
    }
    console.error("[CommunityMining:Upload] Upload processing error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "File upload processing failed" },
      { status: 500 }
    );
  }
}
