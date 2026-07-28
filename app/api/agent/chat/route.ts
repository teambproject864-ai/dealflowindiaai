import { NextResponse } from "next/server";
import { performInference } from '@/lib/inference'; 
import { db } from '@/lib/firebase-admin';
import { PERSONAS } from "@/prompts/personas";

function formattedTimeFromDate(date: Date) {
  return date.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

export async function POST(req: Request) { 
  try {
    const { callId, message, history } = await req.json();
    
    if (!db) {
      return NextResponse.json({ response: "AI Agent chat service active." });
    }

    const callDoc = await db.collection('calls').doc(callId).get(); 
    if (!callDoc.exists) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }
    const call = callDoc.data()!; 
    
    const leadDoc = await db.collection('leads').doc(call.leadId).get();
    const lead = leadDoc.data()!;
    
    const analysisDoc = await db.collection('analyses').doc(call.analysisId).get();
    const analysis = analysisDoc.data()!;

    const personaKey = call.agentPersona || "praneeth_assist";
    const persona = (PERSONAS as any)[personaKey] || PERSONAS.praneeth_assist;

    const scheduledDate = call.scheduledAt?.toDate?.() || new Date(call.scheduledAt || Date.now());
    const isImmediate = call.callMode === "immediate";
    const formattedTime = formattedTimeFromDate(scheduledDate);

    const systemPrompt = isImmediate
      ? `You are ${persona.name}, ${persona.role} at DealFlow.ai.
You are currently connected with ${lead.contactName} from ${lead.companyName} in an ON-DEMAND immediate session happening right now.

Company context:
- GTM plan: ${analysis.gtmPlan || "N/A"}.
- Strategic outreach: ${analysis.strategicOutreachApproach || "N/A"}.
- Differentiation triggers: ${(analysis.marketDifferentiationTriggers || []).join("; ")}.

Constraints:
- Keep responses concise and conversational — 2-4 sentences max.
- Ask one high-signal question at a time.
- Drive toward a concrete next step (implementation call, pilot, or booked demo).
`
      : `You are ${persona.name}, ${persona.role} at DealFlow.ai.
You are speaking with ${lead.contactName} from ${lead.companyName}.

CRITICAL: The demo call is ALREADY scheduled.
Scheduled for: ${formattedTime}.
Meeting Link: ${call.meetingUrl || "Sent to your email"}.

Company context:
- GTM plan: ${analysis.gtmPlan || "N/A"}.
- Brand overview: ${analysis.comprehensiveBrandOverview || "N/A"}.

Constraints:
- Keep responses concise and conversational — 2-4 sentences max.
`;

    const conversationPrompt = `
    Conversation so far:
    ${history.map((m: any) => `${m.role}: ${m.content}`).join('\n')}
    
    User just said: ${message}
    
    Respond as ${persona.name}:`;

    const response = await performInference(conversationPrompt, systemPrompt);

    return NextResponse.json({ response }); 
  } catch (error) {
    console.error("Error in agent chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat" }, 
      { status: 500 }
    );
  }
}
