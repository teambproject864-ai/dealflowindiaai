/**
 * GET /api/gtm-playbook
 * Returns AI-generated GTM Playbooks.
 *
 * Auth scoping:
 *  - customer → can only fetch their own playbook (matched via customerId)
 *  - agent / admin → can fetch any playbook by id or customerId
 *
 * Query params:
 *  - id          Optional. Fetch a specific playbook by trackingId doc ID.
 *  - customerId  Optional. Fetch all playbooks for a given customer.
 *  (No params)   Customer role: returns all playbooks for the authenticated user.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import type { GTMPlaybook } from "@/lib/gtm-playbook-generator";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const customerIdParam = searchParams.get("customerId");

    if (!db) {
      // Return empty gracefully when DB isn't configured (dev fallback)
      return NextResponse.json({ success: true, playbooks: [], playbook: null });
    }

    // ── Fetch by specific tracking ID ──
    if (id) {
      const doc = await db.collection("gtm_playbooks").doc(id).get();

      if (!doc.exists) {
        // Check if intake exists — playbook may still be generating
        const intakeDoc = await db.collection("gtm_intakes").doc(id).get();
        if (intakeDoc.exists) {
          return NextResponse.json({
            success: true,
            playbook: null,
            status: "generating",
            message: "GTM Playbook is being generated. Check back in a moment.",
          });
        }
        return NextResponse.json({ success: false, error: "Playbook not found" }, { status: 404 });
      }

      const playbook = doc.data() as GTMPlaybook;

      // Customers can only see their own playbook
      if (user.role === "customer" && playbook.customerId !== user.id) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.json({ success: true, playbook, playbooks: [playbook] });
    }

    // ── Fetch by customerId parameter ──
    if (customerIdParam) {
      // Agents/admins can query any customerId; customers only their own
      if (user.role === "customer" && customerIdParam !== user.id) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }

      // Use simple collection filter without orderBy to avoid needing a composite index.
      // Sort in memory after fetching.
      const snap = await db
        .collection("gtm_playbooks")
        .where("customerId", "==", customerIdParam)
        .limit(20)
        .get();

      const playbooks: GTMPlaybook[] = [];
      snap.forEach((doc) => playbooks.push({ id: doc.id, ...doc.data() } as any));

      // Sort by generatedAt descending in-memory
      playbooks.sort((a: any, b: any) => {
        const aTime = a.generatedAt ? new Date(a.generatedAt).getTime() : 0;
        const bTime = b.generatedAt ? new Date(b.generatedAt).getTime() : 0;
        return bTime - aTime;
      });

      return NextResponse.json({ success: true, playbooks });
    }

    // ── Customer fetching their own latest playbooks (no params) ──
    if (user.role === "customer") {
      const snap = await db
        .collection("gtm_playbooks")
        .where("customerId", "==", user.id)
        .limit(10)
        .get()
        .catch(() => null);

      const playbooks: GTMPlaybook[] = [];
      if (snap && !snap.empty) {
        snap.forEach((doc) => playbooks.push({ id: doc.id, ...doc.data() } as any));
      }

      // Sort by generatedAt descending in-memory
      playbooks.sort((a: any, b: any) => {
        const aTime = a.generatedAt ? new Date(a.generatedAt).getTime() : 0;
        const bTime = b.generatedAt ? new Date(b.generatedAt).getTime() : 0;
        return bTime - aTime;
      });

      return NextResponse.json({ success: true, playbooks });
    }

    // Agent/admin with no filter: return recent playbooks across all customers
    if (user.role === "agent" || user.role === "admin") {
      const snap = await db
        .collection("gtm_playbooks")
        .limit(50)
        .get()
        .catch(() => null);

      const playbooks: GTMPlaybook[] = [];
      if (snap && !snap.empty) {
        snap.forEach((doc) => playbooks.push({ id: doc.id, ...doc.data() } as any));
      }

      playbooks.sort((a: any, b: any) => {
        const aTime = a.generatedAt ? new Date(a.generatedAt).getTime() : 0;
        const bTime = b.generatedAt ? new Date(b.generatedAt).getTime() : 0;
        return bTime - aTime;
      });

      return NextResponse.json({ success: true, playbooks });
    }

    return NextResponse.json(
      { success: false, error: "Provide an id or customerId query parameter" },
      { status: 400 }
    );

  } catch (error) {
    console.error("[api-gtm-playbook-get] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch playbook" }, { status: 500 });
  }
}
