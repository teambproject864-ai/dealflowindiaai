// app/api/kimi/fine-tuning/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isKimiFeatureAllowed } from "@/lib/kimi-rbac";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

let FINE_TUNING_JOBS = [
  {
    jobId: "ft-kimi-b2b-saas-v1",
    baseModel: "moonshot-v1-8k",
    status: "succeeded",
    dataset: "dealflow-b2b-playbooks-2026.jsonl",
    trainedTokens: 1250000,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 2.8).toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth(request, ["admin"]);
    if (errorResponse) {
      return errorResponse;
    }

    if (!isKimiFeatureAllowed(user!.role, "fine_tuning")) {
      return NextResponse.json(
        { success: false, error: "Access Denied: Kimi LLM fine-tuning controls require Admin authorization" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      jobs: FINE_TUNING_JOBS,
      userRole: user!.role,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch fine-tuning jobs";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth(request, ["admin"]);
    if (errorResponse) {
      return errorResponse;
    }

    if (!isKimiFeatureAllowed(user!.role, "fine_tuning")) {
      return NextResponse.json(
        { success: false, error: "Access Denied: Kimi LLM fine-tuning controls require Admin authorization" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const newJob = {
      jobId: `ft-kimi-${Date.now()}`,
      baseModel: body.baseModel || "moonshot-v1-8k",
      status: "running",
      dataset: body.dataset || "custom-dataset.jsonl",
      trainedTokens: 0,
      createdAt: new Date().toISOString(),
    };

    FINE_TUNING_JOBS.push(newJob);

    return NextResponse.json({
      success: true,
      message: "Fine-tuning job submitted successfully",
      job: newJob,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit fine-tuning job";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
