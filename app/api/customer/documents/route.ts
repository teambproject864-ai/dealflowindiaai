import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let targetCustomerId = user.id;
    if (user.role !== "customer") {
      const { searchParams } = new URL(request.url);
      const requestedId = searchParams.get("customerId");
      if (requestedId) {
        targetCustomerId = requestedId;
      }
    }

    let documents: any[] = [];
    if (db) {
      try {
        const snap = await db
          .collection("documents")
          .where("customerId", "==", targetCustomerId)
          .get();

        documents = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (err) {
        console.error("Error querying customer documents:", err);
      }
    }

    return NextResponse.json({ success: true, documents }, { status: 200 });
  } catch (error) {
    console.error("Error in documents API:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
