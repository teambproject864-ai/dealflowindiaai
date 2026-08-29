import { NextRequest, NextResponse } from "next/server";
import { billionmailService } from "@/lib/billionmail-service";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isBillionmailFeatureAllowed, getBillionmailMaxAudienceSize } from "@/lib/billionmail-rbac";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!isBillionmailFeatureAllowed(user.role, "campaign_view")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: role not authorized to view campaigns" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const campaigns = await billionmailService.listCampaigns({
      userId: user.id,
      status,
      search,
    });

    return NextResponse.json({ success: true, campaigns });
  } catch (error: any) {
    console.error("[Billionmail Campaigns GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!isBillionmailFeatureAllowed(user.role, "campaign_create")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: role not authorized to create campaigns" },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.title || !body.subject || !body.senderEmail || !body.contentHtml) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title, subject, senderEmail, contentHtml" },
        { status: 400 }
      );
    }

    // Role-based audience limit validation
    const userRole = user.role || "customer";
    const maxAudienceLimit = getBillionmailMaxAudienceSize(userRole);
    let requestedAudience: number;

    if (body.audienceCount !== undefined && body.audienceCount !== null) {
      const parsed = typeof body.audienceCount === "number" ? body.audienceCount : Number(body.audienceCount);
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid audienceCount: must be a positive integer",
          },
          { status: 400 }
        );
      }
      requestedAudience = parsed;
    } else if (body.audienceListId) {
      const contacts = await billionmailService.listContacts({ listId: body.audienceListId, userId: user.id });
      const listSubscribedCount = contacts.filter((c) => c.status === "subscribed").length;
      if (listSubscribedCount > 0) {
        requestedAudience = listSubscribedCount;
      } else {
        return NextResponse.json(
          {
            success: false,
            error: `Audience list '${body.audienceListId}' contains no subscribed contacts. Please provide audienceCount or select a non-empty contact list.`,
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Missing audience specification: either audienceCount or audienceListId must be provided",
        },
        { status: 400 }
      );
    }

    if (requestedAudience > maxAudienceLimit) {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: Calculated audience count of ${requestedAudience} exceeds your role limit of ${maxAudienceLimit}`,
        },
        { status: 403 }
      );
    }

    const campaign = await billionmailService.createCampaign({
      userId: user.id,
      userRole,
      title: body.title,
      subject: body.subject,
      senderName: body.senderName || "DealFlow Growth Engine",
      senderEmail: body.senderEmail,
      replyTo: body.replyTo,
      audienceListId: body.audienceListId,
      audienceName: body.audienceName,
      audienceCount: requestedAudience,
      contentHtml: body.contentHtml,
      contentText: body.contentText,
      tags: body.tags,
      scheduledAt: body.scheduledAt,
      sendImmediately: body.sendImmediately,
    });

    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch (error: any) {
    console.error("[Billionmail Campaigns POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!isBillionmailFeatureAllowed(user.role, "campaign_delete")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: role not authorized to delete campaigns" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing campaign id" }, { status: 400 });
    }

    const campaign = await billionmailService.getCampaign(id);
    if (!campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }

    if (user.role !== "admin" && campaign.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to delete this campaign" },
        { status: 403 }
      );
    }

    const deleted = await billionmailService.deleteCampaign(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    console.error("[Billionmail Campaigns DELETE Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete campaign" },
      { status: 500 }
    );
  }
}

