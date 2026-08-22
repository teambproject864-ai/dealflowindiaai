// app/api/llm/metrics/route.ts
import { NextResponse } from "next/server";
import { getAssignmentTelemetryMetrics } from "@/lib/llm-router/assignment-telemetry";

export async function GET() {
  try {
    const metrics = getAssignmentTelemetryMetrics();
    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve LLM metrics" },
      { status: 500 }
    );
  }
}
