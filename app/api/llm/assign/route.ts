// app/api/llm/assign/route.ts
import { NextResponse } from "next/server";
import { assignOptimalLLM } from "@/lib/llm-router/auto-llm-assigner";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, userContext } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Missing required 'content' string" },
        { status: 400 }
      );
    }

    const decision = assignOptimalLLM(content, userContext);

    return NextResponse.json({
      success: true,
      decision,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to assign LLM" },
      { status: 500 }
    );
  }
}
