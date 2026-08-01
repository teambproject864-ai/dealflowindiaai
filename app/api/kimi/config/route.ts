// app/api/kimi/config/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isKimiFeatureAllowed } from "@/lib/kimi-rbac";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

// In-memory active configuration store for Kimi LLM
let KIMI_CONFIG_STORE = {
  defaultModel: "moonshot-v1-8k",
  defaultTemperature: 0.2,
  defaultTopP: 0.95,
  maxTokensLimit: 4096,
  fineTuningEnabled: true,
  providerFallbackRouting: true,
  systemPromptPreset: "Dealflow AI Enterprise CSO (Kimi Engine)",
  updatedAt: new Date().toISOString(),
  updatedBy: "admin-1",
};

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth(request, ["admin"]);
    if (errorResponse) {
      return errorResponse;
    }

    if (!isKimiFeatureAllowed(user!.role, "config_management")) {
      return NextResponse.json(
        { success: false, error: "Access Denied: Kimi configuration management requires Admin privileges" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      config: KIMI_CONFIG_STORE,
      userRole: user!.role,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch Kimi configuration";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth(request, ["admin"]);
    if (errorResponse) {
      return errorResponse;
    }

    if (!isKimiFeatureAllowed(user!.role, "config_management")) {
      return NextResponse.json(
        { success: false, error: "Access Denied: Kimi configuration management requires Admin privileges" },
        { status: 403 }
      );
    }

    const body = await request.json();

    KIMI_CONFIG_STORE = {
      ...KIMI_CONFIG_STORE,
      ...body,
      updatedAt: new Date().toISOString(),
      updatedBy: user!.email || user!.id,
    };

    return NextResponse.json({
      success: true,
      message: "Kimi LLM system configuration updated successfully",
      config: KIMI_CONFIG_STORE,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update Kimi configuration";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
