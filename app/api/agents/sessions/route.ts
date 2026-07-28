import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { listRevenueAgentsWithAvailability } from "@/lib/revenue-agents";
import type { AgentSession } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET: List all sessions or sessions for a specific agent
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agentKey = searchParams.get("agentKey");
    
    if (!db) {
      return NextResponse.json({ success: true, sessions: [], agents: [] });
    }

    let q: FirebaseFirestore.Query = db.collection("agentSessions");
    
    if (agentKey) {
      q = q.where("agentKey", "==", agentKey);
    }
    
    const snapshot = await q.orderBy("createdAt", "desc").limit(50).get();
    const sessions: AgentSession[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AgentSession[];
    
    // Also get agent availability
    const agents = await listRevenueAgentsWithAvailability();
    
    return NextResponse.json({
      success: true,
      sessions,
      agents,
    });
  } catch (error) {
    console.error("[api/agents/sessions] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

// POST: Create a new session
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { agentKey, leadId, companyName } = body;
    
    if (!agentKey || !leadId || !companyName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json({ success: true, session: { id: "mock-sess", agentKey, leadId, companyName, status: "active" } });
    }
    
    const sessionData: Omit<AgentSession, "id"> = {
      agentKey,
      leadId,
      companyName,
      status: "active",
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    
    const docRef = await db.collection("agentSessions").add(sessionData);
    
    return NextResponse.json({
      success: true,
      session: { id: docRef.id, ...sessionData },
    });
  } catch (error) {
    console.error("[api/agents/sessions] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create session" },
      { status: 500 }
    );
  }
}

// PATCH: Update session status (end a session)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, status } = body;
    
    if (!sessionId || !status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json({ success: true });
    }
    
    const updateData: Partial<AgentSession> = {
      status: status as AgentSession["status"],
      updatedAt: new Date().toISOString(),
    };
    
    if (status === "ended") {
      updateData.endedAt = new Date().toISOString();
    }
    
    await db.collection("agentSessions").doc(sessionId).update(updateData);
    
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("[api/agents/sessions] PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update session" },
      { status: 500 }
    );
  }
}
