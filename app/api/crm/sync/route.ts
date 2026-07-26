// app/api/crm/sync/route.ts
import { NextResponse } from "next/server";
import { 
  getRoleScopedCRMRecords, 
  queueCRMSyncOperation, 
  retryFailedCRMSyncItems, 
  getCRMSyncQueueStatus 
} from "@/lib/crm-sync-engine";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const role = (searchParams.get("role") || "customer") as "customer" | "agent" | "admin";
  const userId = searchParams.get("userId") || undefined;
  const isQueueRequest = searchParams.get("queue") === "true";

  try {
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
    const body = await req.json();

    if (body.action === "retry_failed_queue") {
      const retryResult = await retryFailedCRMSyncItems();
      return NextResponse.json({ success: true, ...retryResult, message: "Sync queue retry completed." });
    }

    const { entityType, entityId, action, payload, userRole } = body;

    if (!entityType || !entityId || !payload) {
      return NextResponse.json({ success: false, error: "entityType, entityId, and payload are required" }, { status: 400 });
    }

    const role = (userRole || "agent") as "customer" | "agent" | "admin";
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
