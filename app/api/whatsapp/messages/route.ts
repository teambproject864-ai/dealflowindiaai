// app/api/whatsapp/messages/route.ts
import { NextResponse } from "next/server";
import { getPortalWhatsAppHistory, getWhatsAppComplianceArchive } from "@/lib/whatsapp/evolution-whatsapp-client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const role = (searchParams.get("role") || "customer") as "customer" | "agent" | "admin";
  const filterId = searchParams.get("filterId") || undefined;
  const isArchiveRequest = searchParams.get("archive") === "true";

  try {
    if (isArchiveRequest && role === "admin") {
      const complianceArchive = await getWhatsAppComplianceArchive("admin");
      return NextResponse.json({ success: true, archive: complianceArchive });
    }

    const messages = await getPortalWhatsAppHistory(role, filterId);
    return NextResponse.json({ success: true, messages });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to fetch WhatsApp history" }, { status: 500 });
  }
}
