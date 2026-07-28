import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { mockCustomerDocs, CustomerDocument } from "@/lib/customer-documents";

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

    // Find the document across all records to check ownership
    let document: CustomerDocument | null = null;
    let ownerId: string | null = null;

    for (const [customerId, docs] of Object.entries(mockCustomerDocs)) {
      const found = docs.find((d: CustomerDocument) => d.id === documentId);
      if (found) {
        document = found;
        ownerId = customerId;
        break;
      }
    }

    if (!document) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    // Role-based access control check
    if (user.role === "customer" && ownerId !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden: You do not have access to this document" }, { status: 403 });
    }

    // Generate a mock file download content based on document type
    const filename = document.name;
    const fileContent = `DealFlow.AI Secure Document Download
------------------------------------
Document Name: ${document.name}
Version: ${document.version}
Last Updated: ${document.updatedAt}
Size: ${document.size}
Owner Customer ID: ${ownerId}

This is a secure mock download of your pre-uploaded ${document.type.toUpperCase()} file.
All GTM and ICP specifications inside this document are fully verified and SOC2 compliant.
`;

    const response = new NextResponse(fileContent, {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "text/plain; charset=utf-8",
      },
    });

    return response;
  } catch (error) {
    console.error("Error in download API:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
