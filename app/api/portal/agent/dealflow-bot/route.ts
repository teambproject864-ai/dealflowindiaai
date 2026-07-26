// app/api/portal/agent/dealflow-bot/route.ts
import { NextResponse } from "next/server";
import { DealflowMeetingBot } from "@/lib/dealflow-llm/dealflow-meeting-bot";

// Demo in-memory session cache for agent portal monitoring
const demoActiveSessions = [
  {
    botId: "bot-live-101",
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    callScenario: "client_sales",
    status: "analyzing",
    participants: ["Ashok (AE)", "Sarah Jenkins (VP Buying)", "Dealflow Bot"],
    sentimentScore: 0.88,
    sentimentRating: "Positive",
    extractedActionItems: [
      { task: "Deliver GTM ROI spreadsheet with tier 2 discounts", owner: "Ashok (AE)", priority: "high" },
      { task: "Schedule Security SLA review with Legal", owner: "Sarah Jenkins", priority: "medium" },
    ],
    detectedObjections: [
      { objection: "Custom SLA & SOC2 Compliance", suggestedResolution: "Provide enterprise SOC2 Type II package and 99.99% uptime guarantee", confidence: 0.94 }
    ],
    decisions: [
      {
        id: "dec-1",
        timestamp: new Date().toISOString(),
        title: "20% Custom Discount Request",
        description: "Customer VP requested 20% discount on annual plan (Threshold: 15%)",
        riskLevel: "high",
        requiresAgentApproval: true,
        status: "pending_agent_review",
        proposedAction: "Requires Agent Portal Approval to override standard 15% discount limit",
        impactScore: 0.89,
      },
      {
        id: "dec-2",
        timestamp: new Date().toISOString(),
        title: "Auto-schedule Product Technical Demo",
        description: "Customer asked for technical Deep-dive next Tuesday",
        riskLevel: "low",
        requiresAgentApproval: false,
        status: "autonomous_executed",
        proposedAction: "Autonomous execution: Calendar invite created for next Tuesday 2 PM EST",
        impactScore: 0.4,
      }
    ],
    startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  }
];

export async function GET() {
  return NextResponse.json({
    success: true,
    activeSessions: demoActiveSessions,
    kpi: {
      totalCallsHandled: 142,
      autonomousDecisions: 89,
      flaggedPendingReview: 1,
      actionPlanAlignmentRate: "91.4%",
      averageCallCSAT: "4.8/5.0",
    }
  });
}
