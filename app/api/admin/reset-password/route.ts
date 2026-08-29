import { NextResponse, NextRequest } from "next/server";
import { requireAuth, hashPassword, addAuditLog, DEMO_ADMIN, DEMO_ADMINS, DEMO_AGENTS, DEMO_CUSTOMERS } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req, ["admin"]);
  if (authResult instanceof NextResponse) return authResult;
  const currentUser = (authResult as any).user;

  try {
    const body = await req.json();
    const { requestId, newPassword } = body;

    if (!requestId || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters (requestId, newPassword)" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      );
    }

    // 1. Fetch the reset request
    const requestDoc = await db.collection("password_resets").doc(requestId).get();
    if (!requestDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Password reset request not found" },
        { status: 404 }
      );
    }

    const requestData = requestDoc.data();
    if (!requestData || requestData.status === "completed") {
      return NextResponse.json(
        { success: false, error: "Invalid or already processed request" },
        { status: 400 }
      );
    }

    const { email, role } = requestData;

    // 2. Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // 3. Find if user exists in Firestore users collection
    const userQuery = await db
      .collection("users")
      .where("email", "==", email.toLowerCase())
      .where("role", "==", role)
      .get();

    let userId = "";
    let name = "";

    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      userId = userDoc.id;
      name = userDoc.data().name || "User";
      // Update existing user password
      await db.collection("users").doc(userId).update({
        hashedPassword,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // User doesn't exist in Firestore. Let's find name/id from demo data, or generate new ones.
      if (role === "admin") {
        const adminUser = DEMO_ADMINS.find((a) => a.email.toLowerCase() === email.toLowerCase()) || (email.toLowerCase() === DEMO_ADMIN.email.toLowerCase() ? DEMO_ADMIN : null);
        userId = adminUser ? adminUser.id : `admin-${Date.now()}`;
        name = adminUser ? adminUser.name : "Admin";
      } else if (role === "agent") {
        const agent = DEMO_AGENTS.find((a) => a.email.toLowerCase() === email.toLowerCase());
        userId = agent ? agent.id : `agent-${Date.now()}`;
        name = agent ? agent.name : "Agent";
      } else {
        const customer = DEMO_CUSTOMERS.find((c) => c.email.toLowerCase() === email.toLowerCase());
        userId = customer ? customer.id : `customer-${Date.now()}`;
        name = customer ? customer.name : "Customer";
      }

      // Create new user record in Firestore
      await db.collection("users").doc(userId).set({
        id: userId,
        email: email.toLowerCase(),
        hashedPassword,
        name,
        role,
        createdAt: new Date().toISOString(),
      });
    }

    // 4. Mark the request as processed
    await db.collection("password_resets").doc(requestId).update({
      used: true,
      status: "approved",
      processedAt: new Date().toISOString(),
    });

    // 5. Audit Log
    const ip = (req as any).ip || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    addAuditLog(
      currentUser?.email || "admin@dealflow.ai",
      "admin",
      true,
      `Password reset processed and approved by Admin for user ${email} (Role: ${role}, User ID: ${userId})`,
      ip,
      userAgent
    );

    return NextResponse.json({ success: true, message: `Password reset successfully for ${email}` });
  } catch (error: any) {
    console.error("[POST Admin Reset Password Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process reset password" },
      { status: 500 }
    );
  }
}
