import { NextRequest, NextResponse } from "next/server";
import { listRevenueAgentsWithAvailability } from "@/lib/revenue-agents";
import { intelligentAutoAssignAgent } from "@/lib/agent-assignment";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { leadId, companyName, industry, companySize, timeZone, challengeTags, excludeAgentKey } = body;

    const allAgents = await listRevenueAgentsWithAvailability();

    // Filter out the previously assigned agent so repeat clicks always yield a different agent
    const candidates = excludeAgentKey
      ? allAgents.filter((a) => a.key !== excludeAgentKey)
      : allAgents;

    // Use full pool as last-resort (only 1 agent total — practically impossible)
    const agentPool = candidates.length > 0 ? candidates : allAgents;

    const assignment = await intelligentAutoAssignAgent(agentPool, {
      industry,
      companySize,
      timeZone,
      challengeTags,
    });

    const assignedAgent = agentPool.find((a) => a.key === assignment.agentKey) ?? agentPool[0];

    // Persist assignment if leadId is available
    if (leadId) {
      try {
        const { getDb } = await import("@/lib/firebase-admin");
        const db = getDb();
        if (db) {
          await db.collection("agent_assignments").doc(leadId).set(
            {
              leadId,
              companyName: companyName || "Client Account",
              assignedAgentKey: assignment.agentKey,
              agentName: assignedAgent.name,
              reason: assignment.reason,
              matchScore: assignment.matchScore,
              excludedAgent: excludeAgentKey || null,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      } catch {
        // Fallback for local testing without DB
      }
    }

    return NextResponse.json({
      success: true,
      agentKey: assignment.agentKey,
      agent: assignedAgent,
      matchScore: assignment.matchScore,
      reason: assignment.reason,
      message: `Auto-assigned to ${assignedAgent.name} (${assignedAgent.title}) with a match score of ${assignment.matchScore}/100.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Auto-assignment failed",
      },
      { status: 500 }
    );
  }
}

