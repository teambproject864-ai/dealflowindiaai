import { NextResponse } from "next/server";
import { 
  searchCRMRecords, 
  saveCRMCustomer, 
  saveCRMCompany, 
  saveCRMDeal, 
  deleteCRMRecord,
  validateCRMRecord 
} from "@/lib/crm-store";
import { logAuditEvent } from "@/lib/audit-logger";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const type = (searchParams.get("type") as any) || "all";
    const stage = (searchParams.get("stage") as any) || "all";

    const results = await searchCRMRecords({ query, type, stage });
    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    console.error("[CRM API GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch CRM records" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;
    const user = authResult.user!;

    const body = await req.json();
    const { type, record } = body;
    const userId = user.id;

    if (!type || !["customer", "company", "deal"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid CRM record type specified. Must be customer, company, or deal." },
        { status: 400 }
      );
    }

    if (!record) {
      return NextResponse.json(
        { success: false, error: "Missing record payload." },
        { status: 400 }
      );
    }

    // Mandatory Data Integrity Check
    const validation = validateCRMRecord(type, record);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Mandatory Data Integrity Error: Customer or Company metadata missing.",
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    let savedRecord: any;
    if (type === "customer") {
      savedRecord = await saveCRMCustomer(record);
    } else if (type === "company") {
      savedRecord = await saveCRMCompany(record);
    } else if (type === "deal") {
      savedRecord = await saveCRMDeal(record);
    }

    // Compliance Audit Logging
    await logAuditEvent(req, userId, `crm_${type}_save`, {
      recordId: savedRecord.id,
      type,
      customerName: savedRecord.customerName || savedRecord.companyName,
      companyName: savedRecord.companyName,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `Successfully saved CRM ${type} record.`,
      record: savedRecord
    });
  } catch (error: any) {
    console.error("[CRM API POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save CRM record" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") as any);
    const id = searchParams.get("id");
    const userId = user.id;

    if (!type || !id || !["customer", "company", "deal"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid type or id for deletion." },
        { status: 400 }
      );
    }

    await deleteCRMRecord(type, id);

    // Audit Logging
    await logAuditEvent(req, userId, `crm_${type}_delete`, { recordId: id, type });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted CRM ${type} record ${id}.`
    });
  } catch (error: any) {
    console.error("[CRM API DELETE Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete CRM record" },
      { status: 500 }
    );
  }
}
