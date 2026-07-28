import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import admin from "@/lib/firebase-admin";
import { logAuditEvent } from "@/lib/audit-logger";

async function verifyToken(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw new Error("Missing auth token");
  return admin.auth().verifyIdToken(token);
}

/**
 * DELETE /api/leads/delete
 * GDPR Article 17 — Right to Erasure.
 * Accepts { leadId } in the JSON body.
 * Verifies the caller owns the lead document, then hard-deletes it
 * and writes a GDPR_ERASURE entry to audit_log.
 */
export async function DELETE(req: Request) {
  try {
    // ── Auth ──────────────────────────────────────────────────
    let uid: string;
    try {
      const decoded = await verifyToken(req);
      uid = decoded.uid;
    } catch {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const { leadId } = await req.json();
    if (!leadId || typeof leadId !== "string") {
      return NextResponse.json(
        { success: false, error: "leadId is required." },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json({ success: true, deleted: leadId });
    }

    // ── Verify ownership ─────────────────────────────────────
    const leadRef = db.collection("leads").doc(leadId);
    const leadSnap = await leadRef.get();

    if (!leadSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Lead not found." },
        { status: 404 }
      );
    }

    if (leadSnap.data()?.userId !== uid) {
      return NextResponse.json(
        { success: false, error: "Forbidden: you do not own this record." },
        { status: 403 }
      );
    }

    // ── Delete ───────────────────────────────────────────────
    await leadRef.delete();

    // ── Audit log ────────────────────────────────────────────
    await logAuditEvent(req, uid, "GDPR_ERASURE", { leadId });

    return NextResponse.json({ success: true, message: "Lead data erased." });
  } catch (error: any) {
    console.error("[leads/delete] Error:", error?.message ?? error);
    return NextResponse.json(
      { success: false, error: "Failed to erase lead data." },
      { status: 500 }
    );
  }
}
