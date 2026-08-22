// app/api/history/export/route.ts
import { NextResponse } from "next/server";
import { queryUniversalHistory, UniversalHistoryCategory } from "@/lib/history/universal-history-service";
import { generateHistoryExport, ExportFormat } from "@/lib/history/history-export";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const userRole = (request.headers.get("x-user-role") || searchParams.get("role") || "admin") as "customer" | "agent" | "admin";
    const userOrgId = request.headers.get("x-org-id") || searchParams.get("orgId") || "org-acme";
    const format = (searchParams.get("format") || "csv") as ExportFormat;
    const category = (searchParams.get("category") || "all") as UniversalHistoryCategory | "all";
    const searchQuery = searchParams.get("q") || undefined;

    const { items } = await queryUniversalHistory({
      userRole,
      userOrgId,
      category,
      searchQuery,
      limit: 1000,
    });

    const exportPackage = generateHistoryExport(items, format);

    return new Response(exportPackage.data, {
      status: 200,
      headers: {
        "Content-Type": exportPackage.mimeType,
        "Content-Disposition": `attachment; filename="${exportPackage.filename}"`,
        "x-manifest-hash": exportPackage.manifestHash,
        "x-record-count": exportPackage.recordCount.toString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to export history" },
      { status: 500 }
    );
  }
}
