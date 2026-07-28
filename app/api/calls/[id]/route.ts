import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;
    const user = authResult.user!;

    const { id: callId } = await params;
    if (!db) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }
    const callDoc = await db.collection("calls").doc(callId).get();

    if (!callDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Call not found" },
        { status: 404 }
      );
    }

    const data = callDoc.data() || {};
    // Ownership check: user must be admin, or assignedAgent, or customer matching lead/caller identity
    const isOwnerOrAdmin =
      user.role === "admin" ||
      data.assignedAgentId === user.id ||
      data.callerId === user.id ||
      data.customerId === user.id ||
      data.guests?.includes(user.email);

    if (!isOwnerOrAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have access to this call record" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      callId: callDoc.id,
      ...data,
    });
  } catch (error) {
    console.error("Error fetching call:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch call" },
      { status: 500 }
    );
  }
}
