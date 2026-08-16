import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DUMMY_IDS = [
  "customer-demo",
  "customer-john",
  "customer-creator",
  "customer-praneeth",
  "task-1",
  "task-3",
  "doc-1",
  "doc-3",
  "gtm-1",
  "req-1",
  "resign-1",
  "ticket-1",
  "call-1",
  "asset-14",
  "asset-15",
  "asset-16",
  "asset-18",
  "asset-23",
  "asset-24",
  "asset-25",
];

const DUMMY_EMAILS = [
  "demo@customer.com",
  "john@techstartup.io",
  "creator@youtube.io",
];

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, ["admin"]);
  if (errorResponse) return errorResponse;

  if (!db) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
  }

  try {
    let deletedCount = 0;
    const collectionsToClean = [
      "customers",
      "tasks",
      "documents",
      "gtm_reports",
      "requirements",
      "resignations",
      "tickets",
      "calls",
      "content_assets",
    ];

    // 1. Delete specific dummy documents across collections
    for (const collName of collectionsToClean) {
      for (const id of DUMMY_IDS) {
        const docRef = db.collection(collName).doc(id);
        const docSnap = await docRef.get().catch(() => null);
        if (docSnap && docSnap.exists) {
          await docRef.delete();
          deletedCount++;
        }
      }
    }

    // 2. Clean dummy customer users from "users" collection
    for (const id of DUMMY_IDS) {
      const userRef = db.collection("users").doc(id);
      const userSnap = await userRef.get().catch(() => null);
      if (userSnap && userSnap.exists) {
        const data = userSnap.data();
        if (data?.role === "customer" || DUMMY_EMAILS.includes(data?.email)) {
          await userRef.delete();
          deletedCount++;
        }
      }
    }

    // 3. Clean by dummy emails
    for (const email of DUMMY_EMAILS) {
      const querySnap = await db.collection("users").where("email", "==", email).get().catch(() => null);
      if (querySnap && !querySnap.empty) {
        for (const doc of querySnap.docs) {
          await doc.ref.delete();
          deletedCount++;
        }
      }
      const custQuery = await db.collection("customers").where("email", "==", email).get().catch(() => null);
      if (custQuery && !custQuery.empty) {
        for (const doc of custQuery.docs) {
          await doc.ref.delete();
          deletedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Database audit and purge completed. Cleaned ${deletedCount} dummy sample records.`,
      purgedRecords: deletedCount,
    });
  } catch (error: any) {
    console.error("[cleanup-default-data] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to purge dummy data" },
      { status: 500 }
    );
  }
}
