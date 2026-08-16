import { NextRequest, NextResponse } from "next/server";
import {
  DEMO_CUSTOMERS,
  createToken,
  setAuthCookie,
  addAuditLog,
  NEW_CUSTOMERS,
} from "@/lib/auth";
import { z } from "zod";

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Verification code must be exactly 6 digits"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message || "Invalid input parameters" },
        { status: 400 }
      );
    }

    const { email, code } = validation.data;
    const ip = (req as any).ip || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const sanitizedEmail = email.toLowerCase().trim();

    let matchedUser: any = null;
    let isDbUser = false;

    // ─── 1. Query Firestore for the user ───
    try {
      const { db } = await import("@/lib/firebase-admin");
      if (db) {
        const snap = await db.collection("users").where("email", "==", sanitizedEmail).get();
        if (snap && !snap.empty) {

          const doc = snap.docs[0];
          matchedUser = { id: doc.id, ...doc.data() };
          isDbUser = true;
        }
      }
    } catch (e) {
      console.warn("[Verify] Firestore not configured, checking local memory fallback", e);
    }

    // ─── 2. Fallback to in-memory check ───
    if (!matchedUser) {
      matchedUser = NEW_CUSTOMERS.find((c) => c.email === sanitizedEmail);
    }

    if (!matchedUser) {
      addAuditLog(sanitizedEmail, "customer", false, "Verification failed: User email not found", ip, userAgent);
      return NextResponse.json(
        { success: false, error: "Invalid verification request details" },
        { status: 400 }
      );
    }

    // Check if already verified
    if (matchedUser.isVerified) {
      return NextResponse.json(
        { success: false, error: "Account is already verified and active" },
        { status: 400 }
      );
    }

    // ─── 3. Validate Verification Code & Expiration ───
    if (matchedUser.verificationCode !== code) {
      addAuditLog(sanitizedEmail, "customer", false, `Verification failed: Code mismatch. Provided: ${code}`, ip, userAgent);
      return NextResponse.json(
        { success: false, error: "Invalid verification code" },
        { status: 400 }
      );
    }

    const expiryTime = new Date(matchedUser.verificationExpiresAt).getTime();
    if (Date.now() > expiryTime) {
      addAuditLog(sanitizedEmail, "customer", false, "Verification failed: Code expired", ip, userAgent);
      return NextResponse.json(
        { success: false, error: "Verification code has expired. Please request a new registration." },
        { status: 400 }
      );
    }

    // ─── 4. Mark account as verified ───
    matchedUser.isVerified = true;
    matchedUser.verificationCode = null;
    matchedUser.verificationExpiresAt = null;

    // Update Firestore if available
    if (isDbUser) {
      try {
        const { db } = await import("@/lib/firebase-admin");
        if (db) {
          await db.collection("users").doc(matchedUser.id).update({
            isVerified: true,
            verificationCode: null,
            verificationExpiresAt: null,
            updatedAt: new Date().toISOString(),
          });
          await db.collection("customers").doc(matchedUser.id).set({
            isVerified: true,
            status: "active",
            updatedAt: new Date().toISOString(),
          }, { merge: true });
          console.log("[Verify] User & customer status set to active in Firestore:", matchedUser.id);
        }
      } catch (err) {
        console.error("[Verify] Failed to update user/customer in Firestore", err);
      }
    }

    // Also update NEW_CUSTOMERS in-memory reference
    const memIndex = NEW_CUSTOMERS.findIndex((c) => c.email === sanitizedEmail);
    if (memIndex !== -1) {
      NEW_CUSTOMERS[memIndex] = matchedUser;
    }

    // ─── 5. Auto login verified user ───
    const userPayload = {
      id: matchedUser.id,
      email: matchedUser.email,
      name: matchedUser.name,
      role: matchedUser.role,
    };
    const token = createToken(userPayload);
    await setAuthCookie(token);

    addAuditLog(sanitizedEmail, "customer", true, "Account verified successfully and logged in", ip, userAgent);

    return NextResponse.json({
      success: true,
      message: "Account verified successfully",
      user: userPayload,
    });
  } catch (error) {
    console.error("[Verify Error]", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during email verification" },
      { status: 500 }
    );
  }
}
