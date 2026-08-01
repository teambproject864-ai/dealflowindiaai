import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/portal/messages/files
 *
 * Accepts a multipart/form-data upload containing:
 *   - file: the binary file payload
 *   - channelId: the target messaging channel
 *   - fileName: original file name
 *
 * Stores the file in Firestore as a base64 document (suitable for files
 * up to ~800 KB). For production, replace with a Firebase Storage / GCS
 * signed URL approach for large files.
 *
 * Returns: { success, attachmentUrl, attachmentName, fileId }
 */
export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, ["customer", "agent"]);
  if (errorResponse) return errorResponse;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const channelId = formData.get("channelId") as string | null;
    const fileName = (formData.get("fileName") as string | null) || file?.name || "attachment";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }
    if (!channelId) {
      return NextResponse.json({ success: false, error: "channelId is required" }, { status: 400 });
    }

    // Validate file size (max 5 MB)
    const MAX_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: "File exceeds maximum size of 5 MB" },
        { status: 413 }
      );
    }

    // Validate mime type (allow documents, images, PDFs)
    const ALLOWED_TYPES = [
      "image/png", "image/jpeg", "image/gif", "image/webp",
      "application/pdf",
      "text/plain", "text/csv",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "File type not permitted. Allowed: images, PDF, Word, Excel, CSV, plain text." },
        { status: 415 }
      );
    }

    const fileId = uuidv4();
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;
    const now = new Date().toISOString();

    // Persist to Firestore attachments sub-collection
    try {
      const { getDb } = await import("@/lib/firebase-admin");
      const db = getDb();
      if (db) {
        await db
          .collection("customer_agent_messages")
          .doc(channelId)
          .collection("attachments")
          .doc(fileId)
          .set({
            id: fileId,
            channelId,
            uploadedBy: user!.id,
            uploaderRole: user!.role,
            fileName,
            mimeType: file.type,
            sizeBytes: file.size,
            dataUrl, // base64 inline — replace with GCS signed URL in production
            createdAt: now,
          });
      }
    } catch (dbErr) {
      console.warn("[messages/files] Firestore write failed, returning ephemeral URL", dbErr);
    }

    // Build a pseudo-URL that the frontend can render inline or as a download link
    // In production this would be a GCS/S3 signed URL
    const attachmentUrl = `/api/portal/messages/files/${fileId}?channelId=${encodeURIComponent(channelId)}`;

    return NextResponse.json({
      success: true,
      fileId,
      attachmentUrl,
      attachmentName: fileName,
      mimeType: file.type,
      sizeBytes: file.size,
    });
  } catch (error) {
    console.error("[portal/messages/files POST]", error);
    return NextResponse.json(
      { success: false, error: "File upload failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/portal/messages/files/[fileId]?channelId=
 * Retrieves the stored attachment as an inline data URL for preview.
 */
export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, ["customer", "agent", "admin"]);
  if (errorResponse) return errorResponse;

  const { searchParams, pathname } = new URL(req.url);
  const channelId = searchParams.get("channelId");
  const fileId = pathname.split("/").pop();

  if (!channelId || !fileId) {
    return NextResponse.json({ success: false, error: "channelId and fileId are required" }, { status: 400 });
  }

  try {
    const { getDb } = await import("@/lib/firebase-admin");
    const db = getDb();
    if (!db) {
      return NextResponse.json({ success: false, error: "Storage not configured" }, { status: 503 });
    }
    const doc = await db
      .collection("customer_agent_messages")
      .doc(channelId)
      .collection("attachments")
      .doc(fileId)
      .get();

    if (!doc.exists) {
      return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
    }

    const data = doc.data()!;
    // Stream back the base64 as a binary response
    const buf = Buffer.from(data.dataUrl.split(",")[1], "base64");
    return new NextResponse(buf, {
      headers: {
        "Content-Type": data.mimeType,
        "Content-Disposition": `inline; filename="${data.fileName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[portal/messages/files GET]", error);
    return NextResponse.json({ success: false, error: "Failed to retrieve file" }, { status: 500 });
  }
}
