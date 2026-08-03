import { NextResponse } from "next/server";
import { RegistrationItem } from "@/types/webinar";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { webinarId, name, email, company, jobTitle } = body;

    if (!email || !name) {
      return NextResponse.json({ success: false, error: "Name and email are required" }, { status: 400 });
    }

    const registration: RegistrationItem = {
      id: `reg-${Date.now()}`,
      webinarId: webinarId || "webinar-1",
      name,
      email,
      company: company || "Independent",
      jobTitle: jobTitle || "Attendee",
      status: "approved",
      registeredAt: new Date().toISOString(),
      qrCodeToken: `QR-${(company || "GUEST").substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      calendarInviteSent: true,
      leadScore: Math.floor(65 + Math.random() * 30),
      attended: false,
    };

    return NextResponse.json({ success: true, registration });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
