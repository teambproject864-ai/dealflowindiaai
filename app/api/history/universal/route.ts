// app/api/history/universal/route.ts
import { NextResponse } from "next/server";
import { queryUniversalHistory, UniversalHistoryCategory } from "@/lib/history/universal-history-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Mock role from header or query param for RBAC
    const userRole = (request.headers.get("x-user-role") || searchParams.get("role") || "admin") as "customer" | "agent" | "admin";
    const userId = request.headers.get("x-user-id") || searchParams.get("userId") || "user-1";
    const userOrgId = request.headers.get("x-org-id") || searchParams.get("orgId") || "org-acme";

    const searchQuery = searchParams.get("q") || undefined;
    const category = (searchParams.get("category") || "all") as UniversalHistoryCategory | "all";
    const status = searchParams.get("status") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;

    const result = await queryUniversalHistory({
      userRole,
      userId,
      userOrgId,
      searchQuery,
      category,
      status,
      startDate,
      endDate,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to query history" },
      { status: 500 }
    );
  }
}
