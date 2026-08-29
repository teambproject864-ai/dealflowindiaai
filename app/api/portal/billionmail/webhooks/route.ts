import { NextRequest, NextResponse } from "next/server";
import { billionmailService } from "@/lib/billionmail-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.event || !body.campaignId || !body.email) {
      return NextResponse.json(
        { success: false, error: "Missing required webhook parameters: event, campaignId, email" },
        { status: 400 }
      );
    }

    const result = await billionmailService.processWebhook({
      event: body.event,
      campaignId: body.campaignId,
      email: body.email,
      timestamp: body.timestamp,
      details: body.details,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Billionmail Webhooks Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process webhook" },
      { status: 500 }
    );
  }
}
