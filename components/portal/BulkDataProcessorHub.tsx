// components/portal/BulkDataProcessorHub.tsx
"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  Link2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Database,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  FileText,
  Clock,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseCsv, serializeCsv } from "@/lib/bulk-csv-processor";
import { cn } from "@/lib/utils";

export interface BulkDataProcessorHubProps {
  className?: string;
  defaultProcessorType?: "feedback" | "keywords" | "leads" | "generic";
  onComplete?: (results: any[]) => void;
}

export function BulkDataProcessorHub({
  className,
  defaultProcessorType = "leads",
  onComplete,
}: BulkDataProcessorHubProps) {
  const [sourceMode, setSourceMode] = useState<"file" | "url">("file");
  const [file, setFile] = useState<File | null>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [processorType, setProcessorType] = useState<"feedback" | "keywords" | "leads" | "generic">(
    defaultProcessorType
  );
  const [autoAppend, setAutoAppend] = useState(true);
  const [concurrency, setConcurrency] = useState(15);

  // Parsing & Preview State
  const [parsedPreview, setParsedPreview] = useState<{
    headers: string[];
    rows: Array<Record<string, string>>;
    totalRows: number;
  } | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Execution State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [processResult, setProcessResult] = useState<{
    success: boolean;
    totalInputs: number;
    processedCount: number;
    successCount: number;
    failureCount: number;
    results: any[];
    appended: boolean;
    destination?: string;
    preservedRowCount?: number;
    totalFinalRowCount?: number;
    errors?: Array<{ index: number; error: string }>;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setParseError(null);
    setProcessResult(null);
    setIsParsing(true);

    try {
      const text = await selected.text();
      const result = parseCsv<Record<string, string>>(text, {
        hasHeaders: true,
        skipEmptyLines: true,
      });

      setParsedPreview({
        headers: result.headers,
        rows: result.rows.slice(0, 5),
        totalRows: result.rows.length,
      });
    } catch (err: any) {
      setParseError(err.message || "Failed to parse CSV file format.");
      setParsedPreview(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handlePreviewUrl = async () => {
    if (!spreadsheetUrl.trim()) {
      setParseError("Please enter a valid spreadsheet URL.");
      return;
    }

    setParseError(null);
    setProcessResult(null);
    setIsParsing(true);

    try {
      const res = await fetch("/api/portal/bulk-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadsheetUrl,
          sourceType: "url",
          autoAppend: false,
          processorType,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch spreadsheet URL.");
      }

      setProcessResult(data);
      if (data.results && data.results.length > 0) {
        setParsedPreview({
          headers: Object.keys(data.results[0]),
          rows: data.results.slice(0, 5),
          totalRows: data.totalInputs,
        });
      }
    } catch (err: any) {
      setParseError(err.message || "Failed to connect to spreadsheet URL.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleRunBulkProcess = async () => {
    setIsProcessing(true);
    setProcessResult(null);
    setParseError(null);
    setProgressPercent(10);

    try {
      let res: Response;
      if (sourceMode === "file" && file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("autoAppend", autoAppend ? "true" : "false");
        formData.append("concurrency", String(concurrency));
        formData.append("processorType", processorType);

        setProgressPercent(35);
        res = await fetch("/api/portal/bulk-process", {
          method: "POST",
          body: formData,
        });
      } else {
        setProgressPercent(35);
        res = await fetch("/api/portal/bulk-process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spreadsheetUrl,
            sourceType: "url",
            autoAppend,
            concurrency,
            processorType,
          }),
        });
      }

      setProgressPercent(80);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Bulk processing failed.");
      }

      setProgressPercent(100);
      setProcessResult(data);
      if (onComplete) {
        onComplete(data.results);
      }
    } catch (err: any) {
      setParseError(err.message || "Error running bulk processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadExportCsv = () => {
    if (!processResult || !processResult.results || processResult.results.length === 0) return;

    const headers = Object.keys(processResult.results[0]);
    const csvData = serializeCsv(headers, processResult.results);

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dealflow_bulk_processed_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={cn("space-y-6", className)}>
      <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/40 p-6 rounded-3xl space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2.5">
              <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
              <span>Bulk CSV & Linked Spreadsheet Processing Engine</span>
            </h3>
            <p className="text-xs text-slate-400">
              Bulk import 100+ multi-line inputs from local CSVs or external Google Sheets with automatic sequential appending and data preservation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-3.5 w-3.5" /> Zero-Data-Loss Guaranteed
            </span>
          </div>
        </div>

        {/* Ingestion Source Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSourceMode("file")}
            className={cn(
              "flex items-center gap-3 p-4 rounded-2xl border text-left transition-all",
              sourceMode === "file"
                ? "border-emerald-500/60 bg-emerald-500/10 text-white shadow-lg shadow-emerald-500/10"
                : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            )}
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Local CSV File</div>
              <div className="text-[11px] text-slate-400">Upload single or multi-line CSV dataset</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSourceMode("url")}
            className={cn(
              "flex items-center gap-3 p-4 rounded-2xl border text-left transition-all",
              sourceMode === "url"
                ? "border-emerald-500/60 bg-emerald-500/10 text-white shadow-lg shadow-emerald-500/10"
                : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            )}
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Linked Spreadsheet URL</div>
              <div className="text-[11px] text-slate-400">Google Sheets or live published CSV URL</div>
            </div>
          </button>
        </div>

        {/* Source Inputs */}
        {sourceMode === "file" ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950/50 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileSpreadsheet className="h-10 w-10 text-emerald-400 mx-auto" />
            <div>
              <div className="text-sm font-bold text-white">
                {file ? file.name : "Click or drag & drop CSV file to bulk process"}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Supports RFC 4180 multi-line entries, commas inside quotes, and escaped characters
              </div>
            </div>
            {file && (
              <div className="text-[11px] font-mono text-emerald-400">
                {(file.size / 1024).toFixed(1)} KB selected
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-slate-300">Spreadsheet URL (Google Sheets / Web CSV)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://docs.google.com/spreadsheets/d/1Bxi.../edit#gid=0"
                value={spreadsheetUrl}
                onChange={(e) => setSpreadsheetUrl(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs rounded-xl text-white placeholder:text-slate-600 focus:border-emerald-500"
              />
              <ExtrudedButton
                type="button"
                onClick={handlePreviewUrl}
                disabled={isParsing || !spreadsheetUrl.trim()}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 rounded-xl shrink-0"
              >
                {isParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch & Verify"}
              </ExtrudedButton>
            </div>
            <p className="text-[11px] text-slate-500">
              Paste standard Google Sheets link. URL parameters and GID sheets are converted automatically.
            </p>
          </div>
        )}

        {/* Configuration Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-300">Processing Mode</Label>
            <select
              value={processorType}
              onChange={(e) => setProcessorType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-slate-200"
            >
              <option value="leads">Lead & Account Qualification</option>
              <option value="feedback">Feedback & Sentiment Analysis</option>
              <option value="keywords">Keywords & Query Tokenizer</option>
              <option value="generic">Generic Record Enrichment</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-300">Concurrency (Workers)</Label>
            <select
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-slate-200"
            >
              <option value={5}>5 Concurrent Items</option>
              <option value={15}>15 Concurrent Items (Recommended)</option>
              <option value={30}>30 Concurrent Items (High Speed)</option>
              <option value={50}>50 Concurrent Items (Maximum)</option>
            </select>
          </div>

          <div className="flex flex-col justify-end space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-200">
              <input
                type="checkbox"
                checked={autoAppend}
                onChange={(e) => setAutoAppend(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <span className="font-semibold">Auto-Append to Source / Target</span>
            </label>
            <p className="text-[10px] text-slate-500">
              Preserves all existing records and adds processed output sequentially.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {parseError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <strong className="block font-bold">Ingestion Error</strong>
              <span>{parseError}</span>
            </div>
          </div>
        )}

        {/* Parsed Preview Table */}
        {parsedPreview && (
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-850">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-400" />
                Parsed Dataset Preview ({parsedPreview.totalRows} records detected)
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                {parsedPreview.headers.length} columns detected
              </span>
            </div>

            <div className="overflow-x-auto max-h-48 rounded-xl border border-slate-800">
              <table className="w-full text-[11px] text-left text-slate-300">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    {parsedPreview.headers.map((h) => (
                      <th key={h} className="px-3 py-2 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {parsedPreview.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      {parsedPreview.headers.map((h) => (
                        <td key={h} className="px-3 py-2 max-w-xs truncate font-mono">
                          {row[h] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Button */}
        <ExtrudedButton
          type="button"
          onClick={handleRunBulkProcess}
          disabled={isProcessing || (!file && !spreadsheetUrl.trim())}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing Bulk Inputs & Appending Sequential Data ({progressPercent}%)...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Execute Bulk Processing & Auto-Append</span>
            </>
          )}
        </ExtrudedButton>

        {/* Results Banner */}
        {processResult && (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <div>
                  <strong className="text-white font-bold block text-sm">Bulk Processing Completed Successfully</strong>
                  <span className="text-emerald-300 text-[11px]">
                    Processed {processResult.successCount} of {processResult.totalInputs} records sequentially.
                  </span>
                </div>
              </div>

              <ExtrudedButton
                type="button"
                onClick={handleDownloadExportCsv}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3.5 rounded-xl inline-flex items-center gap-1.5 shadow-md"
              >
                <Download className="h-3.5 w-3.5" /> Download Appended CSV
              </ExtrudedButton>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Inputs</span>
                <strong className="text-white text-sm">{processResult.totalInputs}</strong>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Preserved Prior Rows</span>
                <strong className="text-emerald-400 text-sm">{processResult.preservedRowCount || 0}</strong>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Appended Rows</span>
                <strong className="text-emerald-400 text-sm">{processResult.successCount}</strong>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Final Total Rows</span>
                <strong className="text-white text-sm">{processResult.totalFinalRowCount || processResult.totalInputs}</strong>
              </div>
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
