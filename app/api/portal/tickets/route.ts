import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { seedFirestore } from "@/lib/db-init";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await seedFirestore();

    let tickets: any[] = [];
    if (db) {
      let queryRef: any = db.collection("tickets");

      if (user.role === "customer") {
        queryRef = queryRef.where("customerId", "==", user.id);
      }

      const snap = await queryRef.orderBy("createdAt", "desc").get().catch(() => null);
      if (snap && !snap.empty) {
        snap.forEach((doc: any) => {
          tickets.push({ id: doc.id, ...doc.data() });
        });
      }
    }

    return NextResponse.json({ success: true, tickets }, { status: 200 });
  } catch (error) {
    console.error("[api-portal-tickets-get] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { id, customerId, requesterName, requesterEmail, category, subject, description, priority, status } = body;

    const ticketId = id || `ticket-${Date.now()}`;
    const ticketData: any = {
      customerId: customerId || user.id,
      requesterName: requesterName || user.name,
      requesterEmail: requesterEmail || user.email,
      category: category || "General",
      subject: subject || "No Subject",
      description: description || "",
      priority: priority || "medium",
      status: status || "open",
      updatedAt: new Date().toISOString(),
    };

    if (!id) {
      ticketData.id = ticketId;
      ticketData.createdAt = new Date().toISOString();
    }

    await db.collection("tickets").doc(ticketId).set(ticketData, { merge: true });

    return NextResponse.json({ success: true, ticket: { id: ticketId, ...ticketData } }, { status: 200 });
  } catch (error) {
    console.error("[api-portal-tickets-post] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to save ticket" }, { status: 500 });
  }
}
