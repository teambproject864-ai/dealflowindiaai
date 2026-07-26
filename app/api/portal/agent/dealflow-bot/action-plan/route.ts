// app/api/portal/agent/dealflow-bot/action-plan/route.ts
import { NextResponse } from "next/server";
import { DealflowMeetingBot, CallScenario } from "@/lib/dealflow-llm/dealflow-meeting-bot";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { callId, companyName, callScenario = "client_sales" } = body;

    const bot = new DealflowMeetingBot(callId || `bot-${Date.now()}`, "https://meet.google.com/demo", callScenario as CallScenario, {
      companyName: companyName || "Acme Enterprise",
    });

    await bot.ingestTranscriptChunk({
      speaker: "Client Lead",
      text: "We like the pipeline analytics, but we need clear ROI projections before committing to annual contract.",
      timestamp: new Date().toISOString(),
    });

    const actionPlan = await bot.generateDataDrivenActionPlan();

    return NextResponse.json({
      success: true,
      actionPlan,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed to generate action plan" }, { status: 500 });
  }
}
