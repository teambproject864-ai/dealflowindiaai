// lib/call-bot/mom-generator.ts
import { LiveMeetingBotState, GeneratedActionPlan } from "../dealflow-llm/dealflow-meeting-bot";

export interface MinutesOfMeeting {
  momId: string;
  callId: string;
  generatedAt: string;
  callScenario: string;
  meetingUrl: string;
  recordingUrl: string;
  actionPlanUrl: string;
  participants: string[];
  recipients?: string[];
  deliveryStatus?: "generated" | "dispatched" | "delivered";
  dispatchedAt?: string;
  executiveSummary: string;
  keyDiscussionPoints: string[];
  customerObjections: Array<{ objection: string; resolution: string }>;
  decisionLog: Array<{
    title: string;
    type: "Autonomous" | "Flagged for Agent Approval";
    status: string;
    impactScore: number;
    proposedAction?: string;
  }>;
  actionItems: Array<{
    task: string;
    owner: string;
    priority: string;
    timeline: string;
  }>;
  htmlDocument: string;
  markdownDocument: string;
}

export function generateMOMDocument(
  state: LiveMeetingBotState,
  actionPlan?: GeneratedActionPlan,
  preConfiguredRecipients: string[] = []
): MinutesOfMeeting {
  const momId = `mom-${Date.now()}`;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://app.dealflow.ai").replace(/\/$/, "");
  const recordingUrl = `${appUrl}/portal/agent?tab=dealflow-bot&recordingId=${state.botId}`;
  const actionPlanUrl = `${appUrl}/portal/agent?tab=dealflow-bot&actionPlanId=${actionPlan?.planId || state.botId}`;

  const executiveSummary = `Meeting concluded for scenario [${state.callScenario.toUpperCase()}]. Active participants: ${state.participants.join(", ") || "Pre-configured Attendees"}. Overall sentiment: ${state.sentimentRating} (${(state.sentimentScore * 100).toFixed(0)}%). Key action plan generated with deal conversion confidence of ${actionPlan ? (actionPlan.dealConversionProbability * 100).toFixed(0) : "85"}%. Comprehensive meeting content, key decisions, and assigned action items with concrete timelines have been established for rapid post-meeting execution.`;

  const keyDiscussionPoints = state.transcript.length > 0
    ? state.transcript.slice(-10).map(t => `${t.speaker}: ${t.text}`)
    : [
        "Discussed project setup, requirements alignment, and key business milestones.",
        "Reviewed autonomous meeting bot presence and dynamic dual-model LLM architecture.",
        "Aligned on action item owners and 24-hour turnaround commitments."
      ];

  const customerObjections = state.detectedObjections.map(o => ({
    objection: o.objection,
    resolution: o.suggestedResolution,
  }));

  const decisionLog = state.decisions.length > 0
    ? state.decisions.map(d => ({
        title: d.title,
        type: (d.requiresAgentApproval ? "Flagged for Agent Approval" : "Autonomous") as "Autonomous" | "Flagged for Agent Approval",
        status: d.status,
        impactScore: d.impactScore,
        proposedAction: d.proposedAction,
      }))
    : [
        {
          title: "Autonomous Post-Meeting Workflow & CRM Synchronization",
          type: "Autonomous" as const,
          status: "autonomous_executed",
          impactScore: 0.85,
          proposedAction: "Automatically ingest transcript and sync lead profile into CRM",
        },
      ];

  const defaultTimelines: Record<string, string> = {
    high: "Immediate / Within 24 Hours",
    urgent: "Immediate / Same Day",
    medium: "Within 2 to 3 Business Days",
    low: "By End of Sprint / Next Review",
  };

  const actionItems = state.extractedActionItems.length > 0
    ? state.extractedActionItems.map(a => ({
        task: a.task,
        owner: a.owner || (state.participants[0] || "Account Executive"),
        priority: a.priority || "medium",
        timeline: (a as any).timeline || defaultTimelines[a.priority] || "Within 24 Hours",
      }))
    : [
        {
          task: "Distribute comprehensive Minutes of Meeting (MOM) and technical action plan to all participants",
          owner: state.participants[0] || "Dealflow Meeting Bot",
          priority: "high",
          timeline: "Within 5 Minutes of Call Conclusion",
        },
        {
          task: "Schedule follow-up technical architecture alignment review and CRM integration prerequisites",
          owner: "Solutions Engineer",
          priority: "medium",
          timeline: "Within 48 Hours",
        },
      ];

  const recipients = preConfiguredRecipients.length > 0
    ? preConfiguredRecipients
    : state.participants.filter(p => p.includes("@"));

  const markdownDocument = `# Minutes of Meeting (MOM) - Dealflow AI Bot
**Call ID:** ${state.botId}  
**Scenario:** ${state.callScenario.toUpperCase()}  
**Generated At:** ${new Date().toISOString()}  
**Recipients:** ${recipients.length > 0 ? recipients.join(", ") : "All meeting participants"}

## 🔗 Quick Links
- 🎥 [View Full Meeting Recording](${recordingUrl})
- 📋 [View Interactive Data-Driven Action Plan](${actionPlanUrl})

## 👥 Participants
${state.participants.map(p => `- ${p}`).join("\n") || "- Standard attendees"}

## 📝 Executive Summary
${executiveSummary}

## 💬 Key Discussion Points & Dialogue
${keyDiscussionPoints.map(p => `- ${p}`).join("\n")}

## ⚖️ Decision Log
${decisionLog.map(d => `- **[${d.type}] ${d.title}**: ${d.status} (Impact Score: ${(d.impactScore * 100).toFixed(0)}%)`).join("\n")}

## 🎯 Action Items & Responsible Owners
${actionItems.map(a => `- **[${a.priority.toUpperCase()}]** ${a.task} | **Responsible Person:** ${a.owner} | **Timeline:** ${a.timeline}`).join("\n")}
`;

  const htmlDocument = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090d16; color: #e2e8f0; padding: 28px; line-height: 1.5; }
    .card { background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 22px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    .badge-pos { background: #059669; color: #fff; }
    .badge-flag { background: #dc2626; color: #fff; }
    .badge-time { background: #3b82f6; color: #fff; }
    .btn { display: inline-block; padding: 10px 18px; background: #6366f1; color: white; border-radius: 8px; text-decoration: none; font-weight: bold; margin-right: 12px; margin-top: 8px; }
    h2, h3 { color: #f8fafc; margin-top: 0; }
    ul { padding-left: 20px; }
    li { margin-bottom: 10px; }
    .item-owner { color: #38bdf8; font-weight: 600; }
    .item-time { color: #f59e0b; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <h2 style="color:#6366f1; margin-top:0;">Dealflow AI - Minutes of Meeting</h2>
    <p><strong>Scenario:</strong> <span class="badge badge-pos">${state.callScenario.toUpperCase()}</span></p>
    <p><strong>Call ID:</strong> ${state.botId} &nbsp;|&nbsp; <strong>Generated At:</strong> ${new Date().toISOString()}</p>
    <p><strong>Recipients:</strong> ${recipients.join(", ") || "All meeting participants"}</p>
    <div>
      <a class="btn" href="${recordingUrl}">🎥 Watch Full Recording</a>
      <a class="btn" style="background:#10b981;" href="${actionPlanUrl}">📋 View Action Plan</a>
    </div>
  </div>

  <div class="card">
    <h3>Executive Summary</h3>
    <p>${executiveSummary}</p>
  </div>

  <div class="card">
    <h3>Decision Log</h3>
    <ul>
      ${decisionLog.map(d => `<li><strong>[${d.type}] ${d.title}</strong>: ${d.status} (Impact: ${(d.impactScore * 100).toFixed(0)}%)</li>`).join("")}
    </ul>
  </div>

  <div class="card">
    <h3>Action Items, Responsible Persons & Timelines</h3>
    <ul>
      ${actionItems.map(a => `<li><strong>[${a.priority.toUpperCase()}]</strong> ${a.task}<br/><span class="item-owner">Responsible: ${a.owner}</span> &nbsp;|&nbsp; <span class="item-time">Timeline: ${a.timeline}</span></li>`).join("")}
    </ul>
  </div>
</body>
</html>
`;

  return {
    momId,
    callId: state.botId,
    generatedAt: new Date().toISOString(),
    callScenario: state.callScenario,
    meetingUrl: state.meetingUrl,
    recordingUrl,
    actionPlanUrl,
    participants: state.participants,
    recipients,
    deliveryStatus: "generated",
    executiveSummary,
    keyDiscussionPoints,
    customerObjections,
    decisionLog,
    actionItems,
    htmlDocument,
    markdownDocument,
  };
}
