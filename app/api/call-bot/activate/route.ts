// app/api/call-bot/activate/route.ts
import { NextResponse } from "next/server";
import { DealflowMeetingBot, CallScenario } from "@/lib/dealflow-llm/dealflow-meeting-bot";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { meetingUrl, callScenario = "client_sales", customizations, recipientEmails } = body;

    if (!meetingUrl) {
      return NextResponse.json({ success: false, error: "meetingUrl is required" }, { status: 400 });
    }

    const botId = `bot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const bot = new DealflowMeetingBot(botId, meetingUrl, callScenario as CallScenario, customizations);

    await bot.connect();

    // Ingest initial greeting context
    await bot.ingestTranscriptChunk({
      speaker: "Dealflow AI Bot",
      text: `Hello everyone, Dealflow Meeting Bot joined the ${callScenario} call. I am here to capture notes, record key commitments, and assist in deal execution.`,
      timestamp: new Date().toISOString(),
    });

    const botState = bot.getBotState();

    return NextResponse.json({
      success: true,
      message: "Dealflow Meeting Bot activated and joined call successfully.",
      botId,
      botState,
    });
  } catch (error: any) {
    console.error("[API:CallBotActivate] Error activating bot:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to activate bot" }, { status: 500 });
  }
}
