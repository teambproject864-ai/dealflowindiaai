import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Debug endpoint disabled for security compliance (CWE-200 / CWE-489)
export async function GET() {
  return NextResponse.json(
    { success: false, error: "Not Found: Debug endpoints are disabled." },
    { status: 404 }
  );
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: "Not Found: Debug endpoints are disabled." },
    { status: 404 }
  );
}
