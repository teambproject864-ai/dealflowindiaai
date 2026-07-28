import { NextResponse } from "next/server";
import { 
  getRoleScopedCRMRecords, 
  queueCRMSyncOperation, 
  retryFailedCRMSyncItems, 
  getCRMSyncQueueStatus 
} from "@/lib/crm-sync-engine";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const role = user.role;
    const userId = user.id;
    const isQueueRequest = searchParams.get("queue") === "true";

    if (isQueueRequest && role === "admin") {
      const queueStatus = getCRMSyncQueueStatus();
      return NextResponse.json({ success: true, ...queueStatus });
    }

    const records = await getRoleScopedCRMRecords(role, userId);
    return NextResponse.json({ success: true, ...records });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to fetch CRM records" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;
    const user = authResult.user!;

    const body = await req.json();

    if (body.action === "retry_failed_queue") {
      if (user.role !== "admin") {
        return NextResponse.json({ success: false, error: "Forbidden: Admin role required for retrying queue" }, { status: 403 });
      }
      const retryResult = await retryFailedCRMSyncItems();
      return NextResponse.json({ success: true, ...retryResult, message: "Sync queue retry completed." });
    }

    const { entityType, entityId, action, payload } = body;

    if (!entityType || !entityId || !payload) {
      return NextResponse.json({ success: false, error: "entityType, entityId, and payload are required" }, { status: 400 });
    }

    const role = user.role;
    const syncResult = await queueCRMSyncOperation({
      entityType,
      entityId,
      action: action || "push_to_crm",
      payload,
      userRole: role,
    });

    return NextResponse.json({
      success: syncResult.success,
      queueItem: syncResult.queueItem,
      message: syncResult.message,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to execute CRM sync request" }, { status: 500 });
  }
}
