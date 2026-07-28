import { NextResponse } from "next/server";
import { getInMemoryLeads } from "@/lib/memory-storage";
import { db } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";
import { ExtendedLeadRecord } from "@/lib/types";
import { decryptLead } from "@/lib/security";

export const dynamic = "force-dynamic";

const inMemoryLeads = getInMemoryLeads();

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Authentication ─────────────────────────────────────────
  const { user, errorResponse } = await requireAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const { id: leadId } = await params;
    
    // Check in-memory cache first
    let lead = inMemoryLeads.get(leadId);

    // If not found in cache, fetch from Firestore
    if (!lead && db) {
      const doc = await db.collection("leads").doc(leadId).get();
      if (doc.exists) {
        lead = doc.data() as ExtendedLeadRecord;
        // Cache it locally
        inMemoryLeads.set(leadId, lead!);
      }
    }

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    // Role-based Ownership Filter (A-12)
    const leadAny = lead as any;
    const isOwnerOrAdmin =
      user!.role === "admin" ||
      lead.assignedAgentKey === user!.id ||
      leadAny.assignedAgentId === user!.id ||
      leadAny.customerId === user!.id ||
      lead.contactEmail === user!.email;

    if (!isOwnerOrAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to view this lead" },
        { status: 403 }
      );
    }

    const decryptedLead = decryptLead(lead);

    return NextResponse.json({
      success: true,
      leadId,
      ...decryptedLead,
    });
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

