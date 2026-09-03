// app/api/portal/email/inbox/route.ts
import { NextResponse } from "next/server";
import { getUnifiedEmails, sendOrComposeEmail } from "@/lib/email/centralized-email-service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") as any) || "all";
    const folder = (searchParams.get("folder") as any) || "all";
    const sender = searchParams.get("sender") || undefined;
    const ticketId = searchParams.get("ticketId") || undefined;
    const customerId = searchParams.get("customerId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const searchQuery = searchParams.get("searchQuery") || undefined;

    const data = await getUnifiedEmails({
      status,
      folder,
      sender,
      ticketId,
      customerId,
      startDate,
      endDate,
      searchQuery,
    });

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch unified email inbox" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      recipientEmail,
      recipientName,
      subject,
      bodyText,
      threadId,
      inReplyTo,
      ticketId,
      customerId,
      actionType,
      agentId,
      agentEmail,
      agentName,
    } = body;

    if (!recipientEmail || !subject || !bodyText) {
      return NextResponse.json(
        { success: false, error: "Recipient email, subject, and message body are required." },
        { status: 400 }
      );
    }

    const email = await sendOrComposeEmail(
      {
        recipientEmail,
        recipientName,
        subject,
        bodyText,
        threadId,
        inReplyTo,
        ticketId,
        customerId,
        actionType: actionType || "compose",
      },
      agentId || "agent-portal-user",
      agentEmail || "agent@dealflow.ai",
      agentName || "Dealflow Agent",
      req
    );

    return NextResponse.json({
      success: true,
      email,
      message: "Email dispatched and synchronized with mail server.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to dispatch email." },
      { status: 500 }
    );
  }
}
