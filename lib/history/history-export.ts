// lib/history/history-export.ts
import crypto from "crypto";
import { UniversalHistoryItem } from "./universal-history-service";

export type ExportFormat = "csv" | "json";

export interface ExportResult {
  format: ExportFormat;
  mimeType: string;
  filename: string;
  data: string;
  recordCount: number;
  manifestHash: string;
  exportedAt: string;
}

/**
 * Exports Universal History items to formatted CSV string
 */
export function exportHistoryToCSV(items: UniversalHistoryItem[]): string {
  const headers = [
    "ID",
    "Timestamp",
    "Category",
    "Title",
    "Description",
    "Actor",
    "Actor Role",
    "Organization",
    "Target Entity",
    "Status",
    "Compliance Hash"
  ];

  const escapeCSV = (str?: string) => {
    if (!str) return '""';
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const rows = items.map(item => [
    escapeCSV(item.id),
    escapeCSV(item.timestamp),
    escapeCSV(item.category),
    escapeCSV(item.title),
    escapeCSV(item.description),
    escapeCSV(item.actorName),
    escapeCSV(item.actorRole),
    escapeCSV(item.organizationName),
    escapeCSV(item.targetEntityId || ""),
    escapeCSV(item.status),
    escapeCSV(item.complianceHash)
  ].join(","));

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Generates structured export package in CSV or JSON format
 */
export function generateHistoryExport(items: UniversalHistoryItem[], format: ExportFormat = "csv"): ExportResult {
  const now = new Date().toISOString();
  let data = "";
  let mimeType = "";
  let filename = `dealflow-history-export-${Date.now()}`;

  if (format === "json") {
    mimeType = "application/json";
    filename += ".json";
    data = JSON.stringify({
      manifest: {
        exportVersion: "1.0.0",
        exportedAt: now,
        recordCount: items.length,
        system: "DealFlow.AI Universal Access History",
      },
      records: items,
    }, null, 2);
  } else {
    mimeType = "text/csv;charset=utf-8;";
    filename += ".csv";
    data = exportHistoryToCSV(items);
  }

  const manifestHash = crypto.createHash("sha256").update(data).digest("hex");

  return {
    format,
    mimeType,
    filename,
    data,
    recordCount: items.length,
    manifestHash,
    exportedAt: now,
  };
}
