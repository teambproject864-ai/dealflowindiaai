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
  executiveSummary: string;
  keyDiscussionPoints: string[];
  customerObjections: Array<{ objection: string; resolution: string }>;
  decisionLog: Array<{
    title: string;
    type: "Autonomous" | "Flagged for Agent Approval";
    status: string;
    impactScore: number;
  }>;
  actionItems: Array<{ task: string; owner: string; priority: string }>;
  htmlDocument: string;
  markdownDocument: string;
}

export function generateMOMDocument(
  state: LiveMeetingBotState,
  actionPlan?: GeneratedActionPlan
): MinutesOfMeeting {
  const momId = `mom-${Date.now()}`;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://app.dealflow.ai").replace(/\/$/, "");
  const recordingUrl = `${appUrl}/portal/agent?tab=dealflow-bot&recordingId=${state.botId}`;
  const actionPlanUrl = `${appUrl}/portal/agent?tab=dealflow-bot&actionPlanId=${actionPlan?.planId || state.botId}`;

  const executiveSummary = `Meeting concluded for scenario [${state.callScenario.toUpperCase()}]. Active participants: ${state.participants.join(", ") || "Participants"}. Overall sentiment: ${state.sentimentRating} (${(state.sentimentScore * 100).toFixed(0)}%). Key action plan generated with deal conversion confidence of ${actionPlan ? (actionPlan.dealConversionProbability * 100).toFixed(0) : "85"}%.`;

  const keyDiscussionPoints = state.transcript.length > 0
    ? state.transcript.slice(0, 5).map(t => `${t.speaker}: ${t.text}`)
    : ["Discussed project setup, requirements alignment, and key milestones."];

  const customerObjections = state.detectedObjections.map(o => ({
    objection: o.objection,
    resolution: o.suggestedResolution,
  }));

  const decisionLog = state.decisions.map(d => ({
    title: d.title,
    type: (d.requiresAgentApproval ? "Flagged for Agent Approval" : "Autonomous") as "Autonomous" | "Flagged for Agent Approval",
    status: d.status,
    impactScore: d.impactScore,
  }));

  const actionItems = state.extractedActionItems.map(a => ({
    task: a.task,
    owner: a.owner,
    priority: a.priority,
  }));

  const markdownDocument = `# Minutes of Meeting (MOM) - Dealflow AI Bot
**Call ID:** ${state.botId}  
**Scenario:** ${state.callScenario.toUpperCase()}  
**Generated At:** ${new Date().toISOString()}  

## 🔗 Quick Links
- 🎥 [View Full Meeting Recording](${recordingUrl})
- 📋 [View Interactive Data-Driven Action Plan](${actionPlanUrl})

## 👥 Participants
${state.participants.map(p => `- ${p}`).join("\n") || "- Standard attendees"}

## 📝 Executive Summary
${executiveSummary}

## 💬 Key Discussion Points
${keyDiscussionPoints.map(p => `- ${p}`).join("\n")}

## ⚖️ Decision Log
${decisionLog.map(d => `- **[${d.type}] ${d.title}**: ${d.status} (Impact: ${(d.impactScore * 100).toFixed(0)}%)`).join("\n") || "- No major decisions logged."}

## 🎯 Action Items
${actionItems.map(a => `- **[${a.priority.toUpperCase()}]** ${a.task} (Owner: ${a.owner})`).join("\n") || "- None logged."}
`;

  const htmlDocument = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background-color: #090d16; color: #e2e8f0; padding: 24px; }
    .card { background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 12px; }
    .badge-pos { background: #059669; color: #fff; }
    .badge-flag { background: #dc2626; color: #fff; }
    .btn { display: inline-block; padding: 10px 18px; background: #6366f1; color: white; border-radius: 8px; text-decoration: none; font-weight: bold; margin-right: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <h2 style="color:#6366f1; margin-top:0;">Dealflow AI - Minutes of Meeting</h2>
    <p><strong>Scenario:</strong> <span class="badge badge-pos">${state.callScenario.toUpperCase()}</span></p>
    <p><strong>Call ID:</strong> ${state.botId}</p>
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
    <h3>Action Items & Next Steps</h3>
    <ul>
      ${actionItems.map(a => `<li><strong>[${a.priority.toUpperCase()}]</strong> ${a.task} — <em>${a.owner}</em></li>`).join("") || "<li>No action items</li>"}
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
    executiveSummary,
    keyDiscussionPoints,
    customerObjections,
    decisionLog,
    actionItems,
    htmlDocument,
    markdownDocument,
  };
}
