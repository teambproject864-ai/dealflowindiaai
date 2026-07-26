import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Enforce admin-only access
  const { errorResponse } = await requireAuth(req, ["admin"]);
  if (errorResponse) return errorResponse;

  try {
    const requests: any[] = [];

    if (db) {
      const snapshot = await db
        .collection("password_resets")
        .orderBy("createdAt", "desc")
        .get()
        .catch(() => null);

      if (snapshot && !snapshot.empty) {
        snapshot.forEach((doc) => {
          requests.push({
            id: doc.id,
            ...doc.data(),
          });
        });
      }
    }

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error("[GET Password Requests Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load requests" },
      { status: 500 }
    );
  }
}
