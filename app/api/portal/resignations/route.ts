import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { seedFirestore } from "@/lib/db-init";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await seedFirestore();

    let resignations: any[] = [];
    if (db) {
      const snap = await db.collection("resignations").orderBy("processedAt", "desc").get().catch(() => null);
      if (snap && !snap.empty) {
        snap.forEach((doc: any) => {
          resignations.push({ id: doc.id, ...doc.data() });
        });
      }
    }

    return NextResponse.json({ success: true, resignations }, { status: 200 });
  } catch (error) {
    console.error("[api-portal-resignations-get] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch resignations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { id, customerId, customerName, requestDate, effectiveDate, terminationReason, notes, documentsArchived, accountClosed } = body;

    if (!customerId || !customerName) {
      return NextResponse.json({ success: false, error: "Customer ID and Customer Name are required" }, { status: 400 });
    }

    const resignationId = id || `resign-${Date.now()}`;
    const resignationData: any = {
      customerId,
      customerName,
      requestDate: requestDate || new Date().toISOString().split("T")[0],
      effectiveDate: effectiveDate || new Date().toISOString().split("T")[0],
      terminationReason: terminationReason || "",
      notes: notes || "",
      documentsArchived: documentsArchived ?? true,
      accountClosed: accountClosed ?? true,
      processedBy: user.id,
      processedAt: new Date().toISOString(),
    };

    await db.collection("resignations").doc(resignationId).set(resignationData);

    // Update customer status to resigned
    await db.collection("customers").doc(customerId).set({
      status: "resigned",
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Write audit log
    await db.collection("audit_logs").add({
      id: `audit-${Date.now()}`,
      actionType: "customer_resign",
      actionDetails: `${user.name} processed resignation for customer: ${customerName}`,
      performedBy: user.id,
      performedByRole: user.role,
      targetId: customerId,
      targetType: "customer",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, resignation: { id: resignationId, ...resignationData } }, { status: 200 });
  } catch (error) {
    console.error("[api-portal-resignations-post] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process resignation" }, { status: 500 });
  }
}
