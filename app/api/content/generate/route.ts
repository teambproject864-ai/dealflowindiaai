import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { 
  getModelById, 
  isModelAllowedForRole, 
  getDefaultModelForRole, 
  logModelInvocation 
} from "@/lib/model-registry";
import { dealflowLLM } from "@/lib/dealflow-llm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ContentGenerateSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  systemPrompt: z.string().optional(),
  modelId: z.string().optional(),
  context: z.record(z.any()).optional()
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    
    // Determine user role (fallback to header or default 'customer')
    const roleHeader = request.headers.get("x-user-role");
    const userRole = user?.role || (roleHeader === "agent" || roleHeader === "admin" ? roleHeader : "customer");
    const userId = user?.id || user?.email || "anonymous_user";

    const body = await request.json();
    const parsed = ContentGenerateSchema.parse(body);

    // If modelId is not provided, use default for role
    const requestedModelId = parsed.modelId || getDefaultModelForRole(userRole).id;
    const modelConfig = getModelById(requestedModelId);

    if (!modelConfig) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid model ID '${requestedModelId}'. Please select a valid AI model.` 
        },
        { status: 400 }
      );
    }

    // Role-based Model Access Control Check
    const isAllowed = isModelAllowedForRole(requestedModelId, userRole);
    if (!isAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Model '${modelConfig.name}' requires elevated access permissions. The role '${userRole}' is not authorized to select this model.`,
          requiredRole: modelConfig.allowedRoles
        },
        { status: 403 }
      );
    }

    const startTime = Date.now();
    const systemPrompt = parsed.systemPrompt || "You are an expert AI content generator for B2B dealflow strategy.";

    // Check for Customer-Saved Active API Key
    let customApiKey: string | null = null;
    if (user?.id) {
      const provider = modelConfig.provider === "huggingface" ? "huggingface" : "openai";
      const { getActiveDecryptedKey } = await import("@/lib/customer-api-keys");
      customApiKey = await getActiveDecryptedKey(user.id, provider as any);
    }

    // Perform content generation based on provider
    let fusedOutput: string;
    let confidence: number = 0.95;

    if (modelConfig.provider.toLowerCase().includes("kimi") || requestedModelId.startsWith("moonshot-") || requestedModelId === "kimi-v1") {
      const { kimiInfer } = await import("@/lib/kimi");
      fusedOutput = await kimiInfer(parsed.prompt, systemPrompt, { model: requestedModelId });
    } else {
      const llmResult = await dealflowLLM.infer(parsed.prompt, systemPrompt, {
        modelId: modelConfig.id,
        apiKey: customApiKey || undefined
      });
      fusedOutput = llmResult.fusedOutput;
      confidence = llmResult.confidence;
    }





    const latencyMs = Date.now() - startTime;

    // Log model usage telemetry
    await logModelInvocation({
      user: userId,
      modelId: modelConfig.id,
      tokensIn: Math.ceil(parsed.prompt.length / 4),
      tokensOut: Math.ceil(fusedOutput.length / 4),
      latency: latencyMs,
      gpuId: modelConfig.gpuModel,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      content: fusedOutput,
      model: {
        id: modelConfig.id,
        name: modelConfig.name,
        badge: modelConfig.badge,
        provider: modelConfig.provider,
        performance: modelConfig.performanceProfile
      },
      telemetry: {
        latencyMs,
        tokensGenerated: Math.ceil(fusedOutput.length / 4),
        confidence: confidence
      }
    });


  } catch (error) {
    console.error("[api/content/generate] Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to generate content" 
      },
      { status: 500 }
    );
  }
}
