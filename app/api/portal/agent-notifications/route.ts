import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { seedFirestore } from "@/lib/db-init";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "agent") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await seedFirestore();

    let notifications: any[] = [];
    if (db) {
      const snap = await db.collection("agent_notifications")
        .where("agentId", "==", user.id)
        .orderBy("createdAt", "desc")
        .get()
        .catch(() => null);

      if (snap && !snap.empty) {
        snap.forEach((doc: any) => {
          notifications.push({ id: doc.id, ...doc.data() });
        });
      }
    }

    return NextResponse.json({ success: true, notifications }, { status: 200 });
  } catch (error) {
    console.error("[api-portal-agent-notifications-get] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { id, read, action, agentId, title, description, type } = body;

    // Admin action to create a notification (e.g. reminder)
    if (action === "create") {
      if (user.role !== "admin") {
        return NextResponse.json({ success: false, error: "Forbidden: Admins only" }, { status: 403 });
      }
      if (!agentId || !title || !description) {
        return NextResponse.json({ success: false, error: "agentId, title, and description are required" }, { status: 400 });
      }

      const notifId = id || `notif-${Date.now()}`;
      const newNotif = {
        id: notifId,
        agentId,
        title,
        description,
        type: type || "info",
        read: false,
        createdAt: new Date().toISOString(),
      };

      await db.collection("agent_notifications").doc(notifId).set(newNotif);
      return NextResponse.json({ success: true, notification: newNotif });
    }

    // Default update/mark-read behavior for agents
    if (!id) {
      return NextResponse.json({ success: false, error: "Notification ID is required" }, { status: 400 });
    }

    await db.collection("agent_notifications").doc(id).set({
      read: read ?? true,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[api-portal-agent-notifications-post] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update/create notification" }, { status: 500 });
  }
}
