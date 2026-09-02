// tests/bulk-csv-processor.test.ts

import assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  parseCsv,
  serializeCsv,
  loadCsvSource,
  appendCsvData,
  processBulkInputs,
  normalizeSpreadsheetUrl,
  fetchSpreadsheetCsv,
  InvalidCsvFormatError,
  MissingSourceFileError,
  SpreadsheetConnectionError,
} from "../lib/bulk-csv-processor";
import { FormValidator } from "../lib/form-validator";
import { parseCSVFeedback, ingestBulkCSVFeedbackAndAppend } from "../lib/community-mining/ingestion";

export async function runBulkCsvProcessorTests() {
  console.log("\n============================================================");
  console.log("🚀 RUNNING BULK CSV & SPREADSHEET PROCESSOR TEST SUITE");
  console.log("============================================================\n");

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dealflow-bulk-csv-test-"));

  try {
    // -------------------------------------------------------------
    // TEST 1: RFC 4180 Multi-line CSV Parsing (Newlines, Quotes, Commas)
    // -------------------------------------------------------------
    console.log("--> [1/6] Testing Multi-line RFC 4180 CSV Parsing with Embedded Newlines & Quotes...");

    const multiLineCsv = `id,name,description,notes,tier
1,Lead Alpha,"Line 1
Line 2 with ""quoted content""
Line 3",Standard entry,enterprise
2,Lead Beta,"Simple comma, separated description","Notes with ""double quotes"" and, commas",growth
3,Lead Gamma,"Third item with
multiple lines
and special characters: € & @",Final note,starter`;

    const parsed = parseCsv<{ id: string; name: string; description: string; notes: string; tier: string }>(
      multiLineCsv
    );

    assert.strictEqual(parsed.headers.length, 5, "Must extract 5 headers");
    assert.deepStrictEqual(parsed.headers, ["id", "name", "description", "notes", "tier"]);
    assert.strictEqual(parsed.rows.length, 3, "Must extract exactly 3 rows despite internal newlines");

    // Verify row 1 with embedded multi-line string and escaped quotes
    assert.strictEqual(parsed.rows[0].id, "1");
    assert.strictEqual(parsed.rows[0].name, "Lead Alpha");
    assert.ok(parsed.rows[0].description.includes("Line 1\nLine 2 with \"quoted content\"\nLine 3"));
    assert.strictEqual(parsed.rows[0].tier, "enterprise");

    // Verify row 2 with embedded commas and quotes
    assert.strictEqual(parsed.rows[1].description, "Simple comma, separated description");
    assert.strictEqual(parsed.rows[1].notes, 'Notes with "double quotes" and, commas');

    // Verify row 3
    assert.ok(parsed.rows[2].description.includes("Third item with\nmultiple lines"));
    assert.strictEqual(parsed.rows[2].tier, "starter");

    console.log("  ✅ Successfully parsed complex multi-line CSV entries preserving internal newlines and quotes");

    // -------------------------------------------------------------
    // TEST 2: Local CSV File Preservation and Sequential Appending
    // -------------------------------------------------------------
    console.log("--> [2/6] Testing Local CSV File Existing Data Preservation & Sequential Appending...");

    const localCsvPath = path.join(tempDir, "source_leads.csv");
    const initialContent = `leadId,company,status,contactEmail
L-001,Acme Corp,active,contact@acme.com
L-002,Global Industries,pending,info@global.com`;

    fs.writeFileSync(localCsvPath, initialContent, "utf-8");

    // New entries to append
    const newEntries = [
      {
        leadId: "L-003",
        company: "Stark Tech",
        status: "qualified",
        contactEmail: "tony@stark.com",
        dealScore: "95",
        processedAt: "2026-09-01T10:00:00Z",
      },
      {
        leadId: "L-004",
        company: "Wayne Enterprises",
        status: "negotiation",
        contactEmail: "bruce@wayne.com",
        dealScore: "98",
        processedAt: "2026-09-01T10:01:00Z",
      },
    ];

    const appendResult = await appendCsvData(localCsvPath, newEntries, { createIfMissing: false });

    assert.strictEqual(appendResult.success, true, "Append operation must succeed");
    assert.strictEqual(appendResult.preservedRowCount, 2, "Must preserve exactly 2 existing rows");
    assert.strictEqual(appendResult.appendedRowCount, 2, "Must append 2 new rows");
    assert.strictEqual(appendResult.totalRowCount, 4, "Total row count must be 4");

    // Read back and verify all original data is preserved intact
    const updatedContent = fs.readFileSync(localCsvPath, "utf-8");
    const reParsed = parseCsv<Record<string, string>>(updatedContent);

    assert.strictEqual(reParsed.rows.length, 4, "Must contain all 4 rows in strict sequence");
    assert.strictEqual(reParsed.rows[0].leadId, "L-001");
    assert.strictEqual(reParsed.rows[0].company, "Acme Corp");
    assert.strictEqual(reParsed.rows[1].leadId, "L-002");
    assert.strictEqual(reParsed.rows[1].company, "Global Industries");
    assert.strictEqual(reParsed.rows[2].leadId, "L-003");
    assert.strictEqual(reParsed.rows[2].dealScore, "95");
    assert.strictEqual(reParsed.rows[3].leadId, "L-004");
    assert.strictEqual(reParsed.rows[3].dealScore, "98");

    // Verify header extension with preserved original columns
    assert.ok(reParsed.headers.includes("leadId"));
    assert.ok(reParsed.headers.includes("company"));
    assert.ok(reParsed.headers.includes("dealScore"));
    assert.ok(reParsed.headers.includes("processedAt"));

    console.log("  ✅ Existing data 100% preserved and new entries added sequentially without overwriting");

    // -------------------------------------------------------------
    // TEST 3: Bulk Processing of 100+ Input Entries with Auto-Append
    // -------------------------------------------------------------
    console.log("--> [3/6] Testing Large-Scale Bulk Processing with 100+ Entries...");

    const batchCount = 125;
    const bulkCsvPath = path.join(tempDir, "bulk_dataset_125.csv");

    // Generate 125 entries in CSV format
    const generatedRows: string[] = ["recordId,prompt,priority,category"];
    for (let i = 1; i <= batchCount; i++) {
      const isMultiLine = i % 5 === 0;
      const promptText = isMultiLine
        ? `"Generate personalized cold outreach sequence for Account #${i}
Focus on AI pipeline automation & ROI
Include 3-touch cadence"`
        : `"High-value SDR lead inquiry for Account #${i}"`;

      generatedRows.push(`REC-${String(i).padStart(4, "0")},${promptText},${i % 2 === 0 ? "high" : "normal"},SaaS-Outreach`);
    }

    fs.writeFileSync(bulkCsvPath, generatedRows.join("\n"), "utf-8");

    // Run bulk processor
    const bulkResult = await processBulkInputs<{ recordId: string; prompt: string; priority: string; category: string }>(
      {
        source: bulkCsvPath,
        sourceType: "file",
        autoAppend: true,
        concurrency: 15,
      },
      async (input, idx) => {
        // Processing logic simulating AI analysis/enrichment
        const wordCount = input.prompt.split(/\s+/).length;
        const estimatedTokens = wordCount * 2;
        return {
          recordId: input.recordId,
          prompt: input.prompt,
          priority: input.priority,
          category: input.category,
          processedStatus: "SUCCESS",
          tokenEstimate: String(estimatedTokens),
          confidenceScore: (0.85 + (idx % 15) * 0.01).toFixed(2),
          processedAt: new Date().toISOString(),
        };
      }
    );

    assert.strictEqual(bulkResult.totalInputs, batchCount, `Must process all ${batchCount} inputs`);
    assert.strictEqual(bulkResult.successCount, batchCount, "All 125 items must succeed");
    assert.strictEqual(bulkResult.failureCount, 0, "Zero failures expected");
    assert.strictEqual(bulkResult.appended, true, "Must auto-append results to source file");
    assert.strictEqual(bulkResult.results.length, batchCount, "Must have 125 result items");

    // Verify resulting CSV file has no corruption or lost data
    const finalBulkContent = fs.readFileSync(bulkCsvPath, "utf-8");
    const verifiedFinalParsed = parseCsv<Record<string, string>>(finalBulkContent);

    // Initial rows (125) + appended processed rows (125) = 250 total rows
    assert.strictEqual(verifiedFinalParsed.rows.length, batchCount * 2, "Must contain original + appended rows (250 total)");
    // Check first original row and last appended row
    assert.strictEqual(verifiedFinalParsed.rows[0].recordId, "REC-0001");
    assert.strictEqual(verifiedFinalParsed.rows[batchCount * 2 - 1].recordId, `REC-${String(batchCount).padStart(4, "0")}`);
    assert.strictEqual(verifiedFinalParsed.rows[batchCount * 2 - 1].processedStatus, "SUCCESS");

    console.log(`  ✅ Successfully processed and appended ${batchCount} entries (verified 250 total rows in storage with zero data loss)`);

    // -------------------------------------------------------------
    // TEST 4: External Spreadsheet URL Handling & Google Sheets Normalization
    // -------------------------------------------------------------
    console.log("--> [4/6] Testing External Spreadsheet URL Normalization & Remote Ingestion...");

    // Test Google Sheets URL conversion
    const rawGoogleSheetsUrl = "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=123456";
    const normalized = normalizeSpreadsheetUrl(rawGoogleSheetsUrl);
    assert.strictEqual(
      normalized,
      "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/export?format=csv&gid=123456",
      "Must correctly convert Google Sheet edit URL into direct CSV export URL"
    );

    // Mock fetch for spreadsheet URL testing
    const mockRemoteCsv = `customer,monthlySpend,plan,status
"Acme B2B Corp",5000,enterprise,active
"Initech LLC",1200,growth,active`;

    const mockFetcher = (async (url: string) => {
      if (url.includes("valid-sheet")) {
        return {
          ok: true,
          status: 200,
          text: async () => mockRemoteCsv,
        } as any;
      }
      if (url.includes("404-sheet")) {
        return {
          ok: false,
          status: 404,
          statusText: "Not Found",
        } as any;
      }
      throw new Error("DNS resolution failure for host spreadsheet.invalid");
    }) as unknown as typeof fetch;

    const fetchedContent = await fetchSpreadsheetCsv("https://sheets.example.com/valid-sheet", {
      fetcher: mockFetcher,
    });
    assert.strictEqual(fetchedContent, mockRemoteCsv, "Must correctly retrieve spreadsheet content via fetcher");

    // Test remote append callback
    let remoteAppendedPayload: any = null;
    const remoteAppender = async (url: string, newRows: Array<Record<string, any>>, headers: string[]) => {
      remoteAppendedPayload = { url, rowCount: newRows.length, headers };
      return true;
    };

    const remoteProcessResult = await processBulkInputs(
      {
        source: "https://sheets.example.com/valid-sheet",
        sourceType: "url",
        fetcher: mockFetcher,
        spreadsheetAppender: remoteAppender,
      },
      async (row) => ({
        ...row,
        tierScore: row.plan === "enterprise" ? "A+" : "B",
      })
    );

    assert.strictEqual(remoteProcessResult.totalInputs, 2);
    assert.strictEqual(remoteProcessResult.appended, true);
    assert.ok(remoteAppendedPayload);
    assert.strictEqual(remoteAppendedPayload.rowCount, 2);

    console.log("  ✅ Spreadsheet URL normalization, remote CSV ingestion, and sync callback validated");

    // -------------------------------------------------------------
    // TEST 5: Error Handling (Invalid CSV Format, Missing Files, Failed URLs)
    // -------------------------------------------------------------
    console.log("--> [5/6] Testing Error Handling for Invalid CSV, Missing Files & Failed Spreadsheet Connections...");

    // 5a. Invalid CSV Formatting (Unclosed Quote)
    let invalidCsvCaught = false;
    try {
      parseCsv('id,text\n1,"Unclosed quote string without closing delimiter');
    } catch (err: any) {
      if (err instanceof InvalidCsvFormatError) {
        invalidCsvCaught = true;
        assert.strictEqual(err.code, "INVALID_CSV_FORMAT");
        assert.ok(err.message.includes("Unclosed quote"));
      }
    }
    assert.strictEqual(invalidCsvCaught, true, "Must throw InvalidCsvFormatError on unclosed quote");

    // 5b. Missing Local Source File
    let missingFileCaught = false;
    try {
      await loadCsvSource(path.join(tempDir, "non_existent_file_9999.csv"), "file");
    } catch (err: any) {
      if (err instanceof MissingSourceFileError) {
        missingFileCaught = true;
        assert.strictEqual(err.code, "MISSING_SOURCE_FILE");
        assert.ok(err.message.includes("not found"));
      }
    }
    assert.strictEqual(missingFileCaught, true, "Must throw MissingSourceFileError for missing file path");

    // 5c. Failed Spreadsheet URL (404 and Network Error)
    let http404Caught = false;
    try {
      await fetchSpreadsheetCsv("https://sheets.example.com/404-sheet", { fetcher: mockFetcher });
    } catch (err: any) {
      if (err instanceof SpreadsheetConnectionError) {
        http404Caught = true;
        assert.strictEqual(err.code, "SPREADSHEET_CONNECTION_FAILED");
        assert.ok(err.message.includes("404"));
      }
    }
    assert.strictEqual(http404Caught, true, "Must throw SpreadsheetConnectionError on HTTP 404");

    let networkErrCaught = false;
    try {
      await fetchSpreadsheetCsv("https://sheets.invalid/unreachable", { fetcher: mockFetcher });
    } catch (err: any) {
      if (err instanceof SpreadsheetConnectionError) {
        networkErrCaught = true;
        assert.strictEqual(err.code, "SPREADSHEET_CONNECTION_FAILED");
        assert.ok(err.message.includes("DNS resolution failure"));
      }
    }
    assert.strictEqual(networkErrCaught, true, "Must throw SpreadsheetConnectionError on network error");

    console.log("  ✅ Error handling validated for invalid format, missing files, and connection failures");

    // -------------------------------------------------------------
    // TEST 6: Integration with FormValidator and Community Mining Pipelines
    // -------------------------------------------------------------
    console.log("--> [6/6] Testing FormValidator and Community Mining Bulk CSV Integrations...");

    // FormValidator multi-line CSV keywords
    const complexKeywordsCsv = `"deal flow automation", "autonomous SDR agents", "pipeline intelligence", "revenue operations"`;
    const parsedKeywords = FormValidator.parseCsvKeywords(complexKeywordsCsv);
    assert.strictEqual(parsedKeywords.isValid, true);
    assert.strictEqual(parsedKeywords.keywords.length, 4);

    // FormValidator Bulk Input Validator
    const bulkValidation = FormValidator.validateBulkInputs(
      [
        { keyword: "ai agents", targetUrl: "https://example.com" },
        { keyword: "", targetUrl: "invalid-url" },
        { keyword: "revenue ops", targetUrl: "https://dealflow.ai" },
      ],
      [
        { id: "keyword", label: "Keyword", required: true, minLength: 2 },
        { id: "targetUrl", label: "Target URL", required: true, type: "url" },
      ]
    );
    assert.strictEqual(bulkValidation.totalRecords, 3);
    assert.strictEqual(bulkValidation.validCount, 2);
    assert.strictEqual(bulkValidation.invalidCount, 1);
    assert.strictEqual(bulkValidation.results[1].isValid, false);

    // Community Mining multi-line feedback
    const multiLineFeedbackCsv = `feedback,author,tier,date
"DealFlow AI is incredible!
Customer support resolved our issue in 5 minutes.",Sarah,enterprise,2026-09-01
"Need darker theme on pipeline board.",Bob,growth,2026-09-01`;

    const feedbackItems = parseCSVFeedback(multiLineFeedbackCsv, "test_source");
    assert.strictEqual(feedbackItems.length, 2);
    assert.ok(feedbackItems[0].rawText.includes("Customer support resolved our issue"));

    console.log("  ✅ FormValidator and Community Mining bulk integration passed");

    console.log("\n============================================================");
    console.log("✨ ALL BULK CSV & SPREADSHEET PROCESSOR TESTS PASSED ✨");
    console.log("============================================================\n");
  } finally {
    // Clean up temporary directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

if (process.argv[1] && process.argv[1].includes("bulk-csv-processor.test")) {
  runBulkCsvProcessorTests().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

