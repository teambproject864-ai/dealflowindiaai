// app/api/kimi/analytics/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isKimiFeatureAllowed } from "@/lib/kimi-rbac";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth(request);
    if (errorResponse) {
      return errorResponse;
    }

    const role = user!.role;

    // Check if user has permission for either system analytics or task reporting
    const canSystemAnalytics = isKimiFeatureAllowed(role, "system_analytics");
    const canTaskReporting = isKimiFeatureAllowed(role, "task_reporting");

    if (!canSystemAnalytics && !canTaskReporting) {
      return NextResponse.json(
        { success: false, error: "Access Denied: Customer role is not authorized to access Kimi analytics dashboards" },
        { status: 403 }
      );
    }

    if (role === "admin") {
      // Full System-Wide Analytics Dashboard for Admin
      return NextResponse.json({
        success: true,
        scope: "system_wide",
        analytics: {
          totalInvocations: 1420,
          totalPromptTokens: 854000,
          totalCompletionTokens: 620000,
          averageLatencyMs: 42,
          activeModels: [
            { id: "moonshot-v1-8k", calls: 920, errorRate: "0.1%" },
            { id: "moonshot-v1-32k", calls: 380, errorRate: "0.2%" },
            { id: "moonshot-v1-128k", calls: 120, errorRate: "0.0%" },
          ],
          costEstimateUSD: 14.82,
          recentInvocations: [
            { id: "inv-101", user: "agent@dealflow.ai", modelId: "moonshot-v1-8k", latency: 38, timestamp: new Date().toISOString() },
            { id: "inv-102", user: "admin@dealflow.ai", modelId: "moonshot-v1-32k", latency: 45, timestamp: new Date().toISOString() },
          ]
        },
        permissions: {
          configManagement: true,
          fineTuningControls: true,
          permissionAdjustments: true,
        }
      });
    } else if (role === "agent") {
      // Limited Task Reporting for Agent
      return NextResponse.json({
        success: true,
        scope: "task_reporting",
        analytics: {
          assignedTaskInvocations: 145,
          assignedTaskTokens: 112000,
          averageLatencyMs: 39,
          assignedWorkflows: ["GTM Strategy Blueprinting", "Outbound Email Synthesis"],
          recentTasks: [
            { taskId: "task-881", workflow: "GTM Report", status: "completed", latencyMs: 39, timestamp: new Date().toISOString() },
            { taskId: "task-882", workflow: "Video Script Blueprint", status: "completed", latencyMs: 44, timestamp: new Date().toISOString() },
          ]
        },
        permissions: {
          configManagement: false,
          fineTuningControls: false,
          permissionAdjustments: false,
        }
      });
    }

    return NextResponse.json(
      { success: false, error: "Forbidden: Unauthorized persona for analytics" },
      { status: 403 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch Kimi analytics";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
