// app/api/portal/chat/context-reply/route.ts
import { NextResponse } from "next/server";
import {
  generateContextAwareChatReply,
  approveDraftReply,
  editDraftReply,
  discardDraftReply,
} from "@/lib/chat/context-aware-chat";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, customerQuery, customerId, ticketId, draftId, editedText, language } = body;

    if (action === "generate") {
      if (!customerQuery || !customerId) {
        return NextResponse.json(
          { success: false, error: "customerQuery and customerId are required" },
          { status: 400 }
        );
      }

      const draft = await generateContextAwareChatReply({
        customerQuery,
        customerId,
        ticketId,
        agentPreferredLanguage: language || "en",
      });

      return NextResponse.json({ success: true, draft });
    }

    if (action === "approve") {
      if (!draftId) return NextResponse.json({ success: false, error: "draftId required" }, { status: 400 });
      const approved = approveDraftReply(draftId);
      return NextResponse.json({ success: true, draft: approved });
    }

    if (action === "edit") {
      if (!draftId || !editedText) {
        return NextResponse.json({ success: false, error: "draftId and editedText required" }, { status: 400 });
      }
      const edited = editDraftReply(draftId, editedText);
      return NextResponse.json({ success: true, draft: edited });
    }

    if (action === "discard") {
      if (!draftId) return NextResponse.json({ success: false, error: "draftId required" }, { status: 400 });
      discardDraftReply(draftId);
      return NextResponse.json({ success: true, message: "Draft reply discarded" });
    }

    return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to process context chat request" },
      { status: 500 }
    );
  }
}
