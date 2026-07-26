// app/api/portal/customer/bot-invite/route.ts
import { NextResponse } from "next/server";
import { DealflowMeetingBot, CallScenario } from "@/lib/dealflow-llm/dealflow-meeting-bot";

const invitedBotSessions: any[] = [];

export async function GET() {
  return NextResponse.json({
    success: true,
    invitations: invitedBotSessions,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { meetingTitle, meetingUrl, callScenario = "client_sales", scheduledTime, participantEmails, customizations } = body;

    if (!meetingUrl) {
      return NextResponse.json({ success: false, error: "meetingUrl is required" }, { status: 400 });
    }

    const botId = `bot-inv-${Date.now()}`;
    const bot = new DealflowMeetingBot(botId, meetingUrl, callScenario as CallScenario, customizations);

    const invitation = {
      botId,
      meetingTitle: meetingTitle || "Enterprise Client Meeting",
      meetingUrl,
      callScenario,
      scheduledTime: scheduledTime || new Date().toISOString(),
      participantEmails: participantEmails || [],
      status: "bot_dispatched",
      createdAt: new Date().toISOString(),
    };

    invitedBotSessions.unshift(invitation);

    return NextResponse.json({
      success: true,
      invitation,
      message: `Dealflow Meeting Bot successfully invited to '${invitation.meetingTitle}'. Bot is dispatched to join.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed to invite bot" }, { status: 500 });
  }
}
