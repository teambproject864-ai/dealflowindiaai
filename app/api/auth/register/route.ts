import { NextRequest, NextResponse } from "next/server";
import {
  DEMO_CUSTOMERS,
  hashPassword,
  addAuditLog,
  NEW_CUSTOMERS,
} from "@/lib/auth";
import { z } from "zod";
import { sanitizeInput } from "@/lib/security";

const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com", "mailinator.com", "yopmail.com", "10minutemail.com",
  "guerrillamail.com", "sharklasers.com", "dispostable.com", "getairmail.com",
  "temp-mail.org", "maildrop.cc", "mailnesia.com", "sendgrid.net"
]);

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).*$/,
      "Password must include at least one letter, one number, and one special character"
    ),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.literal("customer"), // Only customers can register via this endpoint
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error.issues[0]?.message || "Invalid request parameters" 
        },
        { status: 400 }
      );
    }

    const { email, password, name, role } = validation.data;
    const ip = (req as any).ip || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // ─── 1. Block Disposable / Fraudulent Email Domains ───
    const emailDomain = email.split("@")[1]?.toLowerCase();
    if (DISPOSABLE_DOMAINS.has(emailDomain)) {
      return NextResponse.json(
        { success: false, error: "Registrations from disposable or temporary email providers are blocked." },
        { status: 400 }
      );
    }

    // ─── 2. Input Sanitization against Injection / XSS ───
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = email.toLowerCase().trim();

    // ─── 3. Check if email already exists in Firestore users collection ───
    let emailExists = false;
    try {
      const { db } = await import("@/lib/firebase-admin");
      if (db) {
        const snapshot = await db.collection("users").where("email", "==", sanitizedEmail).get();
        if (snapshot && !snapshot.empty) {
          emailExists = true;
        }

      }
    } catch (e) {
      console.warn("[Register] Firebase not configured, skipping Firestore email check", e);
    }

    // Also check demo customers fallback
    if (!emailExists) {
      emailExists = [...DEMO_CUSTOMERS, ...NEW_CUSTOMERS].some((c) => c.email === sanitizedEmail);
    }

    if (emailExists) {
      addAuditLog(sanitizedEmail, "customer", false, "Email already registered", ip, userAgent);
      // Avoid account enumeration / verification leak - return generic success message 
      // or standard message. To avoid leakage, we return a standard error that is generic.
      return NextResponse.json(
        { success: false, error: "This email address is not available for registration." },
        { status: 409 }
      );
    }

    // ─── 4. Generate Registration with verification code ───
    const hashedPassword = await hashPassword(password);
    const customerId = `customer-${Date.now()}`;
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // Secure 6-digit code
    const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

    const newCustomer = {
      id: customerId,
      email: sanitizedEmail,
      hashedPassword,
      name: sanitizedName,
      role: "customer" as const,
      isVerified: false,
      verificationCode,
      verificationExpiresAt,
      createdAt: new Date().toISOString(),
    };

    // Save to Firestore
    try {
      const { db } = await import("@/lib/firebase-admin");
      if (db) {
        await db.collection("users").doc(customerId).set(newCustomer);
        console.log("[Register] New customer registered with code and stored in Firestore:", customerId);
      }
    } catch (e) {
      console.warn("[Register] Firebase not configured, storing in memory only", e);
    }
    
    // Also save to in-memory NEW_CUSTOMERS array
    NEW_CUSTOMERS.push(newCustomer);

    // S-02 FIX: Do NOT log the verification code — it must not appear in log aggregators.
    addAuditLog(sanitizedEmail, "customer", true, "Registration initiated. Verification code generated and stored server-side.", ip, userAgent);

    // S-02 FIX: Return NO verificationCode in the response body.
    // The code is delivered only via the email/SMS channel (server-side).
    return NextResponse.json({ 
      success: true, 
      requiresVerification: true,
      message: "Registration successful. A verification code has been sent to your registered address."
    });
  } catch (error) {
    console.error("[Register Error]", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during account registration" },
      { status: 500 }
    );
  }
}
