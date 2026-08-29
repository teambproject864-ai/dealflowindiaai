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

    if (!isBillionmailFeatureAllowed(user.role, "contact_management")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: role not authorized for contact management" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const listId = searchParams.get("listId") || undefined;
    const tag = searchParams.get("tag") || undefined;
    const search = searchParams.get("search") || undefined;

    const contacts = await billionmailService.listContacts({
      userId: user.id,
      listId,
      tag,
      search,
    });
    return NextResponse.json({ success: true, count: contacts.length, contacts });
  } catch (error: any) {
    console.error("[Billionmail Contacts GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list contacts" },
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

    if (!isBillionmailFeatureAllowed(user.role, "contact_management")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: role not authorized for contact management" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const contactsArray = Array.isArray(body.contacts) ? body.contacts : [body];

    if (contactsArray.length === 0) {
      return NextResponse.json(
        { success: false, error: "No contact data provided" },
        { status: 400 }
      );
    }

    const result = await billionmailService.syncContacts(contactsArray, user.id);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("[Billionmail Contacts POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sync contacts" },
      { status: 500 }
    );
  }
}
