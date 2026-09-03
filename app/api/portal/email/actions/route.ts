// app/api/portal/email/actions/route.ts
import { NextResponse } from "next/server";
import { executeEmailAction, getEmailAuditTrail } from "@/lib/email/centralized-email-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { emailId, action, agentId, details } = body;

    if (!emailId || !action) {
      return NextResponse.json(
        { success: false, error: "emailId and action are required." },
        { status: 400 }
      );
    }

    const result = await executeEmailAction(
      emailId,
      action,
      agentId || "agent-portal-user",
      details,
      req
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to execute email action" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const emailId = searchParams.get("emailId") || undefined;
    const trail = getEmailAuditTrail(emailId);
    return NextResponse.json({ success: true, auditTrail: trail });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch audit trail" },
      { status: 500 }
    );
  }
}
