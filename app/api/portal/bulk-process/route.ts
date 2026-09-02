// app/api/portal/bulk-process/route.ts

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  parseCsv,
  loadCsvSource,
  appendCsvData,
  processBulkInputs,
  normalizeSpreadsheetUrl,
  fetchSpreadsheetCsv,
  InvalidCsvFormatError,
  MissingSourceFileError,
  SpreadsheetConnectionError,
} from "@/lib/bulk-csv-processor";
import { FormValidator } from "@/lib/form-validator";

export async function POST(req: Request) {
  const { user, errorResponse } = await requireAuth(req, ["admin", "agent", "customer"]);
  if (errorResponse) return errorResponse;

  try {
    const contentType = req.headers.get("content-type") || "";
    let rawContent = "";
    let sourceType: "file" | "url" | "raw" = "raw";
    let spreadsheetUrl = "";
    let autoAppend = true;
    let targetDestination = "";
    let concurrency = 15;
    let processorType: "feedback" | "keywords" | "leads" | "generic" = "generic";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      spreadsheetUrl = (formData.get("spreadsheetUrl") as string) || "";
      autoAppend = formData.get("autoAppend") !== "false";
      targetDestination = (formData.get("targetDestination") as string) || "";
      concurrency = Number(formData.get("concurrency") || 15);
      processorType = (formData.get("processorType") as any) || "generic";

      if (file) {
        rawContent = await file.text();
        sourceType = "raw";
      } else if (spreadsheetUrl) {
        rawContent = spreadsheetUrl;
        sourceType = "url";
      } else {
        return NextResponse.json(
          { success: false, error: "Please provide either a CSV file or an external spreadsheet URL." },
          { status: 400 }
        );
      }
    } else {
      const jsonBody = await req.json();
      rawContent = jsonBody.content || jsonBody.spreadsheetUrl || jsonBody.source || "";
      sourceType = jsonBody.sourceType || (jsonBody.spreadsheetUrl ? "url" : "raw");
      spreadsheetUrl = jsonBody.spreadsheetUrl || "";
      autoAppend = jsonBody.autoAppend !== false;
      targetDestination = jsonBody.targetDestination || "";
      concurrency = Number(jsonBody.concurrency || 15);
      processorType = jsonBody.processorType || "generic";
    }

    if (!rawContent || !rawContent.trim()) {
      return NextResponse.json(
        { success: false, error: "No input data provided in CSV content or spreadsheet URL." },
        { status: 400 }
      );
    }

    // Process bulk inputs using the high-throughput engine
    const bulkResult = await processBulkInputs(
      {
        source: rawContent,
        sourceType,
        targetDestination: targetDestination || (sourceType === "url" ? spreadsheetUrl : undefined),
        autoAppend: autoAppend && Boolean(targetDestination || sourceType === "url"),
        concurrency,
      },
      async (item: Record<string, string>, index: number) => {
        // Enriched processing based on type
        const timestamp = new Date().toISOString();
        const primaryText = item.feedback || item.text || item.keyword || item.prompt || item.company || Object.values(item)[0] || "";

        if (processorType === "keywords") {
          const validationErr = FormValidator.validateKeyword(primaryText);
          return {
            ...item,
            processedStatus: validationErr ? "INVALID" : "VALID",
            validationMessage: validationErr || "Keyword is valid and optimized",
            characterCount: primaryText.length,
            processedAt: timestamp,
          };
        }

        if (processorType === "leads") {
          const email = item.email || item.contactEmail || "";
          const company = item.company || item.companyName || "Unknown";
          return {
            ...item,
            leadQualityScore: email.includes("@") ? 92 : 65,
            pipelineStage: "Qualified_Lead",
            enrichmentStatus: "COMPLETED",
            processedAt: timestamp,
          };
        }

        // Generic / Feedback
        const sentiment = /(love|great|amazing|excellent|good|fast)/i.test(primaryText)
          ? "positive"
          : /(bug|error|slow|crash|fail|broken)/i.test(primaryText)
          ? "negative"
          : "neutral";

        return {
          ...item,
          analysisSentiment: sentiment,
          wordCount: primaryText.split(/\s+/).length,
          processedStatus: "SUCCESS",
          processedAt: timestamp,
        };
      }
    );

    return NextResponse.json({
      success: true,
      totalInputs: bulkResult.totalInputs,
      processedCount: bulkResult.processedCount,
      successCount: bulkResult.successCount,
      failureCount: bulkResult.failureCount,
      results: bulkResult.results,
      appended: bulkResult.appended,
      destination: bulkResult.destination,
      preservedRowCount: bulkResult.preservedRowCount,
      totalFinalRowCount: bulkResult.totalFinalRowCount,
      errors: bulkResult.errors,
    });
  } catch (err: any) {
    if (err instanceof InvalidCsvFormatError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code, details: err.details },
        { status: 422 }
      );
    }
    if (err instanceof MissingSourceFileError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code, details: err.details },
        { status: 404 }
      );
    }
    if (err instanceof SpreadsheetConnectionError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code, details: err.details },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { success: false, error: err?.message || "An unexpected error occurred during bulk processing." },
      { status: 500 }
    );
  }
}
