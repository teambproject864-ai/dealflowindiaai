
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import { DEMO_ADMIN, DEMO_AGENTS, DEMO_CUSTOMERS } from "@/lib/auth";

// Get JWT secret from environment or use fallback for dev
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET is required in production");
    }
    return "your-secret-key-in-production-env-var-only";
  }
  return secret;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if email exists in demo users or Firestore
    let userExists = false;
    let userRole: "admin" | "agent" | "customer" = "customer";

    // Check demo admin
    if (DEMO_ADMIN.email.toLowerCase() === email.toLowerCase()) {
      userExists = true;
      userRole = "admin";
    }

    // Check demo agents
    if (!userExists) {
      const agent = DEMO_AGENTS.find(
        (a) => a.email.toLowerCase() === email.toLowerCase()
      );
      if (agent) {
        userExists = true;
        userRole = "agent";
      }
    }

    // Check demo customers
    if (!userExists) {
      const customer = DEMO_CUSTOMERS.find(
        (c) => c.email.toLowerCase() === email.toLowerCase()
      );
      if (customer) {
        userExists = true;
        userRole = "customer";
      }
    }

    // Check Firestore users (if db is available)
    if (!userExists && db) {
      const usersSnapshot = await db
        .collection("users")
        .where("email", "==", email.toLowerCase())
        .get();
      if (!usersSnapshot.empty) {
        userExists = true;
        const userDoc = usersSnapshot.docs[0].data();
        userRole = (userDoc.role as "admin" | "agent" | "customer") || "customer";
      }
    }

    // Always return success to avoid email enumeration attacks
    if (userExists) {
      // Generate a short-lived password reset token (15 minutes expiry)
      const resetToken = jwt.sign(
        { email, role: userRole, type: "password-reset" },
        getJwtSecret(),
        { expiresIn: "15m" }
      );

      // S-03 FIX: NEVER log the reset token or the full reset URL.
      // Log only the email and expiry time for audit purposes.
      const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      logger.info(
        `[PASSWORD RESET] Reset token generated for ${email}. Expires at: ${expiryTime}`
      );

      // Persist reset token to Firestore if available
      if (db) {
        await db.collection("password_resets").add({
          email,
          token: resetToken,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          used: false,
        });
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message:
        "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (error) {
    logger.error("Error in forgot password API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred. Please try again later.",
      },
      { status: 500 }
    );
  }
}
