import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { kimiContentOrchestrator } from "@/lib/kimi/content-orchestrator";
import { handleKimiError } from "@/lib/kimi/error-handler";
import { logModelInvocation } from "@/lib/model-registry";
import { z } from "zod";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `req-vid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  try {
    const user = await getAuthenticatedUser(request);
    const userId = user?.id || user?.email || "anonymous_user";

    const body = await request.json();

    const headersRecord: Record<string, string> = {};
    request.headers.forEach((val, key) => {
      headersRecord[key] = val;
    });

    const videoOutput = await kimiContentOrchestrator.generateVideoBlueprint(body, headersRecord);
    const latencyMs = Date.now() - startTime;

    await logModelInvocation({
      user: userId,
      modelId: "moonshot-v1-8k",
      tokensIn: Math.ceil(JSON.stringify(body).length / 4),
      tokensOut: Math.ceil(JSON.stringify(videoOutput).length / 4),
      latency: latencyMs,
      gpuId: "Kimi Cluster",
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: videoOutput,
      model: {
        id: "moonshot-v1-8k",
        name: "Kimi (Moonshot v1 8K)",
        provider: "Kimi / Moonshot AI",
        badge: "High-Precision"
      },
      telemetry: {
        requestId,
        latencyMs,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("[api/kimi/generate-video-blueprint] Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT_SCHEMA",
            message: "Validation failed for video blueprint parameters",
            details: error.errors,
            requestId
          }
        },
        { status: 400 }
      );
    }

    const unifiedErr = handleKimiError(error, { requestId, endpoint: "/api/kimi/generate-video-blueprint" });
    return NextResponse.json(unifiedErr, { status: unifiedErr.error.code === "KIMI_AUTHENTICATION_FAILED" ? 401 : 500 });
  }
}
