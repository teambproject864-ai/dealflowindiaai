import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("id");
    if (!documentId) {
      return NextResponse.json({ success: false, error: "Missing document id" }, { status: 400 });
    }

    let document: any = null;
    let ownerId: string | null = null;

    if (db) {
      try {
        const docRef = await db.collection("documents").doc(documentId).get();
        if (docRef.exists) {
          document = { id: docRef.id, ...docRef.data() };
          ownerId = document.customerId;
        }
      } catch (err) {
        console.error("Error finding document in Firestore:", err);
      }
    }

    if (!document) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    // Role-based access control check
    if (user.role === "customer" && ownerId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have access to this document" },
        { status: 403 }
      );
    }

    const filename = document.name || document.title || "document.pdf";
    const fileContent =
      document.content ||
      `DealFlow.AI Secure Document Download
------------------------------------
Document Name: ${filename}
Version: ${document.version || "1.0"}
Last Updated: ${document.updatedAt || new Date().toISOString()}
Owner Customer ID: ${ownerId}
`;

    return new NextResponse(fileContent, {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error in download API:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
