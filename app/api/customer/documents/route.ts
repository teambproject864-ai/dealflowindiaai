import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { CustomerDocument, mockCustomerDocs } from "@/lib/customer-documents";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "customer") {
      const docs = mockCustomerDocs[user.id] || [];
      return NextResponse.json({ success: true, documents: docs }, { status: 200 });
    }

    // Agents and admins can access any documents (e.g., via query param ?customerId=...)
    const { searchParams } = new URL(request.url);
    const targetCustomerId = searchParams.get("customerId");
    if (!targetCustomerId) {
      return NextResponse.json({ success: false, error: "Missing customerId" }, { status: 400 });
    }

    const docs = mockCustomerDocs[targetCustomerId] || [];
    return NextResponse.json({ success: true, documents: docs }, { status: 200 });
  } catch (error) {
    console.error("Error in documents API:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
