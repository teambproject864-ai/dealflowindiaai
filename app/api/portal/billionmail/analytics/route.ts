import { NextRequest, NextResponse } from "next/server";
import { billionmailService } from "@/lib/billionmail-service";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isBillionmailFeatureAllowed } from "@/lib/billionmail-rbac";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!isBillionmailFeatureAllowed(user.role, "analytics_view")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: role not authorized for Billionmail analytics" },
        { status: 403 }
      );
    }

    // Filter analytics strictly by requesting user ID to prevent cross-user data exposure
    const analytics = await billionmailService.getAnalytics(user.id);
    return NextResponse.json({ success: true, analytics });
  } catch (error: any) {
    console.error("[Billionmail Analytics GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

