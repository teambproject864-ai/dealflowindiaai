import { NextResponse } from "next/server";
import { SocialPlatformId } from "@/types/webinar";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { platform, action, scheduledTime }: { platform: SocialPlatformId; action: "publish" | "schedule"; scheduledTime?: string } = body;

    const simulatedMetrics = {
      platform,
      publishedAt: action === "publish" ? new Date().toISOString() : undefined,
      scheduledTime: action === "schedule" ? scheduledTime : undefined,
      status: action === "publish" ? "published" : "scheduled",
      estimatedClicks: Math.floor(120 + Math.random() * 400),
      estimatedRegistrations: Math.floor(18 + Math.random() * 65),
    };

    return NextResponse.json({ success: true, result: simulatedMetrics });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
