// app/api/whatsapp/openwa/session/route.ts
import { NextResponse } from "next/server";
import { 
  initializeOpenWASession, 
  confirmOpenWAConnection, 
  disconnectOpenWASession 
} from "@/lib/whatsapp/openwa-whatsapp-client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId") || "openwa-default-session";
    const session = await initializeOpenWASession(sessionId);

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch OpenWA session" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, sessionId = "openwa-default-session", phoneNumber } = body;

    if (action === "confirm") {
      const session = await confirmOpenWAConnection(sessionId, phoneNumber);
      return NextResponse.json({ success: true, session });
    }

    if (action === "disconnect") {
      await disconnectOpenWASession(sessionId);
      return NextResponse.json({ success: true, message: "Session disconnected" });
    }

    const session = await initializeOpenWASession(sessionId);
    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to manage OpenWA session" },
      { status: 500 }
    );
  }
}
