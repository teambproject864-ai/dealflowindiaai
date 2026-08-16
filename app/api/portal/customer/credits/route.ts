// app/api/portal/customer/credits/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  const { user, errorResponse } = await requireAuth(request, ["admin", "customer"]);
  if (errorResponse) return errorResponse;

  try {
    const url = new URL(request.url);
    const targetCustomerId = user!.role === "admin" 
      ? (url.searchParams.get("customerId") || user!.id)
      : user!.id;

    let balance = 0;
    let transactions: any[] = [];

    if (db) {
      try {
        const custDoc = await db.collection("customers").doc(targetCustomerId).get();
        if (custDoc.exists) {
          balance = custDoc.data()?.creditsBalance || 0;
        }

        const txSnap = await db
          .collection("transactions")
          .where("customerId", "==", targetCustomerId)
          .orderBy("createdAt", "desc")
          .limit(20)
          .get()
          .catch(() => null);

        if (txSnap) {
          transactions = txSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        }
      } catch (err) {
        console.error("Error reading credits from database:", err);
      }
    }

    return NextResponse.json({
      success: true,
      credits: {
        balance,
        currency: "USD",
        tier: "Standard Tier",
        transactions,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to load credits" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { user, errorResponse } = await requireAuth(request, ["admin", "customer"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json().catch(() => ({}));
    const creditTier = Number(body.creditTier) || 100;
    
    if (creditTier <= 0 || !Number.isFinite(creditTier)) {
      return NextResponse.json(
        { success: false, error: "Invalid credit tier value" },
        { status: 400 }
      );
    }

    const targetCustomerId = user!.role === "admin"
      ? (body.customerId || user!.id)
      : user!.id;

    const creditAmount = creditTier * 10;
    let newBalance = creditAmount;

    if (db) {
      const custRef = db.collection("customers").doc(targetCustomerId);
      const custDoc = await custRef.get();
      const currentBalance = custDoc.exists ? custDoc.data()?.creditsBalance || 0 : 0;
      newBalance = currentBalance + creditAmount;

      await custRef.set({ creditsBalance: newBalance }, { merge: true });

      const newTx = {
        customerId: targetCustomerId,
        type: "topup",
        amount: creditAmount,
        costUsd: creditTier,
        createdAt: new Date().toISOString(),
        status: "completed",
        performedBy: user!.id,
      };
      await db.collection("transactions").add(newTx);
    }

    return NextResponse.json({
      success: true,
      newBalance,
      message: `Successfully added ${creditAmount} credits ($${creditTier} USD).`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to add credits" },
      { status: 500 }
    );
  }
}
