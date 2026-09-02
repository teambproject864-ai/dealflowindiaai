import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, ["admin", "agent"]);
  if (errorResponse) return errorResponse;

  try {
    const logs: any[] = [];
    if (db) {
      const snapshot = await db.collection("audit_logs").get();
      if (snapshot && !snapshot.empty) {
        snapshot.forEach((doc: any) => {
          logs.push({ id: doc.id, ...doc.data() });
        });
      }

      // Sort by timestamp or createdAt descending in memory
      logs.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
        const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
        return timeB - timeA;
      });
    }
    
    // Admins can see all logs; agents can only see their own logs
    const filteredLogs = user!.role === "admin" 
      ? logs 
      : logs.filter(l => l.performedBy === user!.id || l.performedByEmail === user!.email);

    return NextResponse.json({ success: true, logs: filteredLogs.slice(0, 100) });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, ["admin", "agent"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { actionType, actionDetails, targetId, targetType, metadata } = body;

    if (!actionType || !actionDetails) {
      return NextResponse.json(
        { success: false, error: "actionType and actionDetails are required" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }

    const logId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newLog = {
      id: logId,
      actionType,
      actionDetails,
      performedBy: user!.id,
      performedByEmail: user!.email,
      performedByRole: user!.role,
      performedByName: user!.name || user!.email,
      targetId: targetId || "",
      targetType: targetType || "",
      metadata: metadata || {},
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };

    await db.collection("audit_logs").doc(logId).set(newLog);

    return NextResponse.json({ success: true, log: newLog });
  } catch (error) {
    console.error("Error creating audit log:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create audit log" },
      { status: 500 }
    );
  }
}
