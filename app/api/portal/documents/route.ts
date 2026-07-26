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

    let documents: any[] = [];
    if (db) {
      if (user.role === "admin") {
        const snap = await db.collection("documents").get().catch(() => null);
        if (snap && !snap.empty) {
          snap.forEach((doc: any) => {
            documents.push({ id: doc.id, ...doc.data() });
          });
          documents.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        }
      } else if (user.role === "agent") {
        // Find assigned customers of the agent
        const custSnap = await db.collection("customers").where("assignedAgentId", "==", user.id).get().catch(() => null);
        const assignedCustIds = custSnap ? custSnap.docs.map(d => d.id) : [];
        
        const snap = await db.collection("documents").get().catch(() => null);
        if (snap && !snap.empty) {
          snap.forEach((doc: any) => {
            const data = doc.data();
            if (assignedCustIds.includes(data.customerId) || data.createdBy === user.id) {
              documents.push({ id: doc.id, ...data });
            }
          });
          documents.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        }
      } else {
        // Customer role
        const snap = await db.collection("documents").where("customerId", "==", user.id).get().catch(() => null);
        if (snap && !snap.empty) {
          snap.forEach((doc: any) => {
            documents.push({ id: doc.id, ...doc.data() });
          });
          documents.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        }
      }
    }

    return NextResponse.json({ success: true, documents }, { status: 200 });
  } catch (error) {
    console.error("[api-portal-documents-get] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch documents" }, { status: 500 });
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
    const { id, action, customerId, documentType, title, description, createdBy, accessRoles, name, type, size, version, updateNotes, versionDetails } = body;

    const docId = id || `doc-${Date.now()}`;
    const docRef = db.collection("documents").doc(docId);
    const existingDoc = await docRef.get();

    // 1. Log Access Action (view / download)
    if (action === "log_access") {
      if (!existingDoc.exists) {
        return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
      }
      const docData = existingDoc.data() || {};
      const accessLogs = docData.accessLogs || [];
      const newAccessLog = {
        id: `access-${Date.now()}`,
        documentId: docId,
        action: body.accessAction || "view",
        performedBy: user.name || user.email,
        performedAt: new Date().toISOString(),
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1",
      };

      await docRef.update({
        accessLogs: [newAccessLog, ...accessLogs]
      });

      // Write central audit log
      await db.collection("audit_logs").add({
        id: `audit-${Date.now()}`,
        actionType: "document_access",
        actionDetails: `${user.name} (${user.role}) viewed document: ${docData.title || docData.name}`,
        performedBy: user.id,
        performedByRole: user.role,
        targetId: docId,
        targetType: "document",
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, message: "Document access logged successfully" });
    }

    // 2. Upload/Create new Version Action
    if (action === "upload_version") {
      if (!existingDoc.exists) {
        return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
      }
      const docData = existingDoc.data() || {};
      const versions = docData.versions || [];
      const currentVerNum = parseFloat(docData.version || "1.0") || 1.0;
      const nextVerNum = (currentVerNum + 0.1).toFixed(1);

      const newVersion = {
        id: `ver-${Date.now()}`,
        documentId: docId,
        versionNumber: parseFloat(nextVerNum),
        fileUrl: versionDetails?.fileUrl || `/files/${docId}_v${nextVerNum}.pdf`,
        fileSize: versionDetails?.fileSize || size || "1.2 MB",
        uploadedBy: user.name || user.email,
        uploadedAt: new Date().toISOString(),
        changeDescription: updateNotes || versionDetails?.changeDescription || "New version uploaded",
      };

      await docRef.update({
        version: nextVerNum,
        versions: [newVersion, ...versions],
        updatedAt: new Date().toISOString(),
      });

      // Write central audit log
      await db.collection("audit_logs").add({
        id: `audit-${Date.now()}`,
        actionType: "document_update",
        actionDetails: `${user.name} (${user.role}) uploaded new version v${nextVerNum} for: ${docData.title || docData.name}`,
        performedBy: user.id,
        performedByRole: user.role,
        targetId: docId,
        targetType: "document",
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, message: "New version added successfully" });
    }

    // 3. Create or regular update
    let docData: any = {};
    if (existingDoc.exists) {
      docData = existingDoc.data() || {};
    }

    const nextDocData = {
      ...docData,
      customerId: customerId || docData.customerId || user.id,
      documentType: documentType || docData.documentType || "other",
      title: title || name || docData.title || "Untitled Document",
      description: description || docData.description || "",
      createdBy: createdBy || docData.createdBy || user.id,
      accessRoles: accessRoles || docData.accessRoles || ["admin", "agent", "customer"],
      name: name || title || docData.name || "Untitled Document",
      type: type || docData.type || "pdf",
      size: size || docData.size || "150 KB",
      version: version || docData.version || "1.0",
      isNew: false,
      updatedAt: new Date().toISOString(),
    };

    if (!existingDoc.exists) {
      nextDocData.id = docId;
      nextDocData.createdAt = new Date().toISOString();
      nextDocData.versions = [{
        id: `ver-${Date.now()}`,
        documentId: docId,
        versionNumber: 1.0,
        fileUrl: `/files/${docId}_v1.0.pdf`,
        fileSize: size || "150 KB",
        uploadedBy: user.name || user.email,
        uploadedAt: new Date().toISOString(),
        changeDescription: "Initial document upload",
      }];
      nextDocData.accessLogs = [];
    }

    await docRef.set(nextDocData);

    // Write central audit log
    await db.collection("audit_logs").add({
      id: `audit-${Date.now()}`,
      actionType: id ? "document_update" : "document_upload",
      actionDetails: `${user.name} (${user.role}) ${id ? "updated" : "uploaded"} document: ${nextDocData.title}`,
      performedBy: user.id,
      performedByRole: user.role,
      targetId: docId,
      targetType: "document",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, document: { id: docId, ...nextDocData } }, { status: 200 });
  } catch (error) {
    console.error("[api-portal-documents-post] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to save document" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admins only" }, { status: 403 });
    }

    const url = new URL(request.url);
    const docId = url.searchParams.get("docId");

    if (!docId) {
      return NextResponse.json({ success: false, error: "Document ID is required" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }

    await db.collection("documents").doc(docId).delete();

    // Write audit log
    await db.collection("audit_logs").add({
      id: `audit-${Date.now()}`,
      actionType: "other",
      actionDetails: `${user.name} (${user.role}) deleted document ID: ${docId}`,
      performedBy: user.id,
      performedByRole: user.role,
      targetId: docId,
      targetType: "document",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: "Document deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[api-portal-documents-delete] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete document" }, { status: 500 });
  }
}
