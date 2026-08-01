import { NextResponse } from "next/server";
import { getKimiClient } from "@/lib/instances";
import { getAuthenticatedUser } from "@/lib/auth";
import { isKimiFeatureAllowed, validateKimiParameters } from "@/lib/kimi-rbac";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const userRole = user?.role || (req.headers.get("x-user-role") as any) || "customer";

    // 1. Feature permission check
    if (!isKimiFeatureAllowed(userRole, "inference")) {
      return NextResponse.json(
        { success: false, error: "Access Denied: Kimi LLM inference is not authorized for your role" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // 2. Role-based parameter validation & sanitization
    const paramValidation = validateKimiParameters(userRole, body);
    if (!paramValidation.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Access Denied: ${paramValidation.reason}`,
          unauthorizedParams: paramValidation.unauthorizedParams,
        },
        { status: 403 }
      );
    }

    const { messages, model } = paramValidation.sanitizedParams;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: "Messages array is required" },
        { status: 400 }
      );
    }

    const kimiClient = getKimiClient();
    const response = await kimiClient.chatCompletion({
      model: model || process.env.KIMI_MODEL || "moonshot-v1-8k",
      messages,
    });

    return NextResponse.json({
      success: true,
      response,
      userRole,
      telemetry: {
        timestamp: new Date().toISOString(),
        modelUsed: model || "moonshot-v1-8k",
      },
    });
  } catch (error) {
    console.error("Error in Kimi chat:", error);
    const message = error instanceof Error ? error.message : "Kimi chat failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
