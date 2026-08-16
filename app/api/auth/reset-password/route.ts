
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import {
  hashPassword,
} from "@/lib/auth";

// Get JWT secret from environment or use fallback for dev
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL SECURITY ERROR: JWT_SECRET environment variable must be defined and at least 32 characters long in production.");
    }
    return "default-dev-jwt-secret-key-must-be-at-least-32-chars-long!";
  }
  return secret;
}

const USED_TOKENS = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Token and new password are required" },
        { status: 400 }
      );
    }

    if (USED_TOKENS.has(token)) {
      return NextResponse.json(
        { success: false, error: "Reset token has already been used" },
        { status: 400 }
      );
    }

    // Verify reset token
    let decoded: any;
    try {
      decoded = jwt.verify(token, getJwtSecret());
    } catch (err) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    if (decoded.type !== "password-reset") {
      return NextResponse.json(
        { success: false, error: "Invalid token type" },
        { status: 400 }
      );
    }

    if (decoded.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Only admin accounts can perform direct password resets. For other roles, resets must be approved and executed by an administrator.",
        },
        { status: 403 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the user's password and clear lockout status in Firestore
    if (db) {
      const userQuery = await db
        .collection("users")
        .where("email", "==", decoded.email.toLowerCase())
        .where("role", "==", decoded.role)
        .get();

      if (!userQuery.empty) {
        const userDoc = userQuery.docs[0];
        await userDoc.ref.update({
          hashedPassword,
          passwordUpdatedAt: new Date().toISOString(),
          failedLoginAttempts: 0,
          isLocked: false,
          lockedUntil: null,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Create user record in Firestore if not existing (e.g. legacy demo config)
        const userId = decoded.role === "admin" ? `admin-${Date.now()}` : `${decoded.role}-${Date.now()}`;
        await db.collection("users").doc(userId).set({
          id: userId,
          email: decoded.email.toLowerCase(),
          role: decoded.role,
          name: decoded.role === "admin" ? "Administrator" : decoded.role === "agent" ? "Agent" : "Customer",
          hashedPassword,
          passwordUpdatedAt: new Date().toISOString(),
          failedLoginAttempts: 0,
          isLocked: false,
          lockedUntil: null,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // For demo purposes, log the password reset
    logger.info(
      `[PASSWORD RESET] Password reset successful for ${decoded.email}`
    );

    // Mark token as used in Firestore if available
    if (db) {
      const resetSnapshot = await db
        .collection("password_resets")
        .where("token", "==", token)
        .where("used", "==", false)
        .get();

      if (!resetSnapshot.empty) {
        const docRef = resetSnapshot.docs[0].ref;
        await docRef.update({
          used: true,
          usedAt: new Date().toISOString(),
        });
      }
    }

    USED_TOKENS.add(token);

    return NextResponse.json({
      success: true,
      message: "Password reset successfully! You can now log in.",
    });
  } catch (error) {
    logger.error("Error in reset password API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred. Please try again later.",
      },
      { status: 500 }
    );
  }
}
