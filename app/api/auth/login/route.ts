import { NextRequest, NextResponse } from "next/server";
import {
  verifyPassword,
  createToken,
  setAuthCookie,
  addAuditLog,
  DEMO_ADMIN,
  DEMO_ADMINS,
  DEMO_AGENTS,
  DEMO_CUSTOMERS,
  NEW_CUSTOMERS,
} from "@/lib/auth";
import bcrypt from "bcrypt";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { loginLockoutLimiter, captchaTriggerLimiter } from "@/lib/rate-limiter-middleware";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password cannot be empty"),
  role: z.enum(["admin", "agent", "customer"]),
  mfaCode: z.string().optional(),
  captchaToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      logger.warn("Invalid login request parameters", validation.error.issues);
      return NextResponse.json(
        { success: false, error: "Invalid email or password format" },
        { status: 400 }
      );
    }

    const { email, password, role, mfaCode, captchaToken } = validation.data;
    const ip = (req as any).ip || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const limiterKey = `${ip}:${email.toLowerCase()}`;

    // ─── 1. Check Rate Limit & Lockout Status ───
    try {
      const lockoutRes = await loginLockoutLimiter.get(limiterKey);
      if (lockoutRes && lockoutRes.remainingPoints <= 0) {
        addAuditLog(email, role, false, `Access blocked: Persistent failed login attempts (Lockout active) from IP: ${ip}`, ip, userAgent);
        return NextResponse.json(
          { success: false, error: "Account lock-out active. Too many failed attempts. Please try again after 15 minutes." },
          { status: 429 }
        );
      }
    } catch (err) {
      // Ignore limiter fetch failure
    }

    // ─── 2. Check CAPTCHA Requirement for High-Risk Login Attempts ───
    let requiresCaptcha = false;
    try {
      const captchaRes = await captchaTriggerLimiter.get(limiterKey);
      if (captchaRes && captchaRes.remainingPoints <= 0) {
        requiresCaptcha = true;
      }
    } catch (err) {
      // Ignore limiter fetch failure
    }

    if (requiresCaptcha) {
      const expectedCaptchaToken = process.env.CAPTCHA_SECRET;
      // If CAPTCHA secret is not configured in env, skip CAPTCHA (for dev only)
      if (expectedCaptchaToken && (!captchaToken || captchaToken !== expectedCaptchaToken)) {
        addAuditLog(email, role, false, `Access rejected: CAPTCHA verification required from IP: ${ip}`, ip, userAgent);
        return NextResponse.json(
          { success: false, error: "CAPTCHA verification required for high-risk login attempt", requiresCaptcha: true },
          { status: 403 }
        );
      }
    }

    // ─── 3. IP Whitelisting for Admin ───
    if (role === "admin" && process.env.ADMIN_IP_WHITELIST) {
      const whitelist = process.env.ADMIN_IP_WHITELIST.split(",").map(item => item.trim());
      if (!whitelist.includes(ip) && ip !== "127.0.0.1" && ip !== "::1" && ip !== "unknown") {
        addAuditLog(email, role, false, `IP not whitelisted: ${ip}`, ip, userAgent);
        return NextResponse.json(
          { success: false, error: "Access denied from this IP address" },
          { status: 403 }
        );
      }
    }

    let user = null;

    // Check Firestore users
    let dbUser = null;
    try {
      const { db } = await import("@/lib/firebase-admin");
      if (db) {
        // Query users by email to inspect role and prevent role misclassification
        const snap = await db
          .collection("users")
          .where("email", "==", email.toLowerCase())
          .get();
        if (snap && !snap.empty && snap.docs?.length > 0) {
          const doc = snap.docs[0];
          dbUser = { id: doc.id, ...doc.data() } as any;
        } else {
          // Fallback: Check customer_credentials collection for GTM Assessment accounts missing a users record
          const credSnap = await db
            .collection("customer_credentials")
            .where("email", "==", email.toLowerCase())
            .get();
          if (credSnap && !credSnap.empty && credSnap.docs?.length > 0) {
            const credDocSnap = credSnap.docs[0];
            const credDoc = credDocSnap.data() as any;
            const fallbackPasswordHash = credDoc.passwordHash || credDoc.hashedPassword;
            if (fallbackPasswordHash) {
              const isValidCredPassword = await verifyPassword(password, fallbackPasswordHash);
              if (isValidCredPassword) {
                // Auto-heal/backfill user document into users collection
                const existingCustomerId =
                  typeof credDoc.customerId === "string" ? credDoc.customerId.trim() : "";
                const newUserId = existingCustomerId || credDocSnap.id || `customer-${Date.now()}`;
                const autoHealedUser = {
                  id: newUserId,
                  email: email.toLowerCase(),
                  hashedPassword: fallbackPasswordHash,
                  name: credDoc.name || credDoc.displayName || "Customer",
                  role: "customer" as const,
                  isVerified: true,
                  isLocked: false,
                  failedLoginAttempts: 0,
                  passwordUpdatedAt: new Date().toISOString(),
                  source: "gtm_assessment",
                  createdAt: credDoc.createdAt || new Date().toISOString(),
                };
                if (!existingCustomerId) {
                  await db
                    .collection("customer_credentials")
                    .doc(credDocSnap.id)
                    .update({ customerId: newUserId })
                    .catch(() => {});
                }
                await db.collection("users").doc(newUserId).set(autoHealedUser).catch(() => {});
                dbUser = autoHealedUser;
              }
            }
          }
        }
      }
    } catch (e) {
      logger.warn("[Login] Firestore not configured or failed to connect", e);
    }

    // Role-scoping validation: Prevent GTM Assessment customer accounts from logging into admin/agent portals, and vice-versa
    if (dbUser) {
      const userRole = (dbUser.role || "").toLowerCase();
      if (userRole === "customer" && role !== "customer") {
        addAuditLog(email, role, false, `[GTM Auth Monitor] Customer account attempted login at non-customer portal (${role}) from IP: ${ip}`, ip, userAgent);
        return NextResponse.json(
          { success: false, error: "Customer accounts generated through GTM Assessment can only authenticate via the Customer Portal (/portal/customer/login)." },
          { status: 403 }
        );
      }
      if (userRole !== "customer" && role === "customer") {
        addAuditLog(email, role, false, `[GTM Auth Monitor] Non-customer account (${userRole}) attempted login at Customer portal from IP: ${ip}`, ip, userAgent);
        return NextResponse.json(
          { success: false, error: "Internal staff/admin accounts cannot authenticate via the Customer Portal." },
          { status: 403 }
        );
      }
    }

    if (dbUser) {
      // Auto-heal isVerified if missing/undefined for customer accounts
      if (dbUser.role === "customer" && (dbUser.isVerified === undefined || dbUser.isVerified === null)) {
        dbUser.isVerified = true;
        try {
          const { db: fDb } = await import("@/lib/firebase-admin");
          if (fDb && dbUser.id) {
            await fDb.collection("users").doc(dbUser.id).update({ isVerified: true });
          }
        } catch (e) { }
      }

      // Check Lockout
      if (dbUser.isLocked && dbUser.lockedUntil) {
        const lockedUntilDate = new Date(dbUser.lockedUntil);
        if (lockedUntilDate.getTime() > Date.now()) {
          addAuditLog(email, role, false, `Login attempt blocked: Account is locked until ${dbUser.lockedUntil}`, ip, userAgent);
          return NextResponse.json(
            { success: false, error: "This account is temporarily locked due to multiple failed login attempts. Please try again after 15 minutes." },
            { status: 403 }
          );
        } else {
          // Lock expired: reset it in db
          try {
            const { db: fDb } = await import("@/lib/firebase-admin");
            if (fDb) {
              await fDb.collection("users").doc(dbUser.id).update({
                isLocked: false,
                lockedUntil: null,
                failedLoginAttempts: 0,
              });
            }
          } catch (e) { }
          dbUser.isLocked = false;
          dbUser.lockedUntil = null;
          dbUser.failedLoginAttempts = 0;
        }
      }

      // Block unverified customer accounts
      if (role === "customer" && dbUser.isVerified === false) {
        let code = dbUser.verificationCode;
        if (!code) {
          code = Math.floor(100000 + Math.random() * 900000).toString();
          const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          dbUser.verificationCode = code;
          dbUser.verificationExpiresAt = expiresAt;
          try {
            const { db: fDb } = await import("@/lib/firebase-admin");
            if (fDb) {
              await fDb.collection("users").doc(dbUser.id).update({
                verificationCode: code,
                verificationExpiresAt: expiresAt,
              });
            }
          } catch (e) {}
        }
        return NextResponse.json(
          { 
            success: false, 
            error: "Please verify your email to activate your account.", 
            requiresVerification: true, 
            email,
            verificationCode: code
          },
          { status: 403 }
        );
      }

      const isValidPassword = await verifyPassword(password, dbUser.hashedPassword);
      if (isValidPassword) {
        // Enforce password expiration policy (90 days)
        if (dbUser.passwordUpdatedAt) {
          const passwordAgeMs = Date.now() - new Date(dbUser.passwordUpdatedAt).getTime();
          const passwordAgeDays = passwordAgeMs / (1000 * 60 * 60 * 24);
          if (passwordAgeDays > 90) {
            addAuditLog(email, role, false, `Login blocked: Password expired (last updated at ${dbUser.passwordUpdatedAt})`, ip, userAgent);
            return NextResponse.json(
              { success: false, error: "Your password has expired (90-day policy). Please reset your password.", requiresReset: true, email },
              { status: 403 }
            );
          }
        } else {
          // If missing, save current time for backward compatibility
          try {
            const { db: fDb } = await import("@/lib/firebase-admin");
            if (fDb) {
              await fDb.collection("users").doc(dbUser.id).update({
                passwordUpdatedAt: new Date().toISOString(),
              });
            }
          } catch (e) { }
        }

        // Reset failed login attempts on success
        if (dbUser.failedLoginAttempts > 0) {
          try {
            const { db: fDb } = await import("@/lib/firebase-admin");
            if (fDb) {
              await fDb.collection("users").doc(dbUser.id).update({
                failedLoginAttempts: 0,
              });
            }
          } catch (e) { }
        }

        user = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name || (role === "admin" ? "Administrator" : role === "agent" ? "Agent" : "Customer"),
          role: dbUser.role as "admin" | "agent" | "customer",
        };
      } else {
        // Password invalid: increment failedLoginAttempts
        const newAttempts = (dbUser.failedLoginAttempts || 0) + 1;
        const updates: any = { failedLoginAttempts: newAttempts };

        let isLockedNow = false;
        let lockedUntilStr = null;

        if (newAttempts >= 5) {
          isLockedNow = true;
          lockedUntilStr = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins lock
          updates.isLocked = true;
          updates.lockedUntil = lockedUntilStr;
          addAuditLog(email, role, false, `Account locked due to 5 consecutive failed login attempts`, ip, userAgent);
        }

        try {
          const { db: fDb } = await import("@/lib/firebase-admin");
          if (fDb) {
            await fDb.collection("users").doc(dbUser.id).update(updates);
          }
        } catch (e) { }

        if (isLockedNow) {
          return NextResponse.json(
            { success: false, error: "This account has been locked for 15 minutes due to multiple failed login attempts." },
            { status: 403 }
          );
        }
      }
    }

    // Fall back to demo/hardcoded config if not found in db
    if (!user) {
      if (role === "admin") {
        const extraAdmin = DEMO_ADMINS.find((a) => a.email.toLowerCase() === email.toLowerCase());
        if (extraAdmin) {
          let isValidPassword = await verifyPassword(password, extraAdmin.hashedPassword);
          if (!isValidPassword && process.env.ADMIN_PASSWORD_HASH) {
            isValidPassword = await verifyPassword(password, process.env.ADMIN_PASSWORD_HASH);
          }
          if (isValidPassword) {
            user = { id: extraAdmin.id, email: extraAdmin.email, name: extraAdmin.name, role: "admin" as const };
          }
        } else if (email.toLowerCase() === DEMO_ADMIN.email.toLowerCase()) {
          let isValidPassword = await verifyPassword(password, DEMO_ADMIN.hashedPassword);
          if (!isValidPassword && process.env.ADMIN_PASSWORD_HASH) {
            isValidPassword = await verifyPassword(password, process.env.ADMIN_PASSWORD_HASH);
          }
          if (isValidPassword) {
            user = { id: DEMO_ADMIN.id, email: DEMO_ADMIN.email, name: DEMO_ADMIN.name, role: "admin" as const };
          }
        }
      } else if (role === "agent") {
        const agent = DEMO_AGENTS.find((a) => a.email.toLowerCase() === email.toLowerCase());
        if (agent) {
          const isValidPassword = await verifyPassword(password, agent.hashedPassword);
          if (isValidPassword) {
            user = { id: agent.id, email: agent.email, name: agent.name, role: "agent" as const };
          }
        }
      } else if (role === "customer") {
        const customer = [...DEMO_CUSTOMERS, ...NEW_CUSTOMERS].find((c) => c.email.toLowerCase() === email.toLowerCase());
        if (customer) {
          // Block unverified customer accounts
          if ((customer as any).isVerified === false) {
            return NextResponse.json(
              { 
                success: false, 
                error: "Please verify your email to activate your account.", 
                requiresVerification: true, 
                email,
                verificationCode: (customer as any).verificationCode
              },
              { status: 403 }
            );
          }
          const isValidPassword = await verifyPassword(password, customer.hashedPassword);
          if (isValidPassword) {
            user = { id: customer.id, email: customer.email, name: customer.name, role: "customer" as const };
          }
        }
      }
    }

    // ─── 4. Failed Login Handling (Limiter consumption) ───
    if (!user) {
      try {
        await captchaTriggerLimiter.consume(limiterKey, 1);
      } catch (e) {
        requiresCaptcha = true;
      }

      try {
        await loginLockoutLimiter.consume(limiterKey, 1);
      } catch (e) {
        addAuditLog(email, role, false, `Account locked out: IP: ${ip} after consecutive failed login attempts`, ip, userAgent);
        return NextResponse.json(
          { success: false, error: "Account lock-out active. Too many failed attempts. Please try again after 15 minutes." },
          { status: 429 }
        );
      }

      addAuditLog(email, role, false, "Failed login attempt (Invalid credentials)", ip, userAgent);

      // Generic message to avoid email verification leaks
      return NextResponse.json(
        { success: false, error: "Invalid email or password", requiresCaptcha },
        { status: 401 }
      );
    }

    // ─── 5. Successful Login ───
    try {
      await loginLockoutLimiter.delete(limiterKey);
      await captchaTriggerLimiter.delete(limiterKey);
    } catch (e) { }

    const token = createToken(user);
    await setAuthCookie(token);

    addAuditLog(
      user.email,
      user.role,
      true,
      "Successful login",
      ip,
      userAgent
    );

    return NextResponse.json({ success: true, user });
  } catch (error) {
    logger.error("[Login Error]", error);
    // Secure generic message to prevent error leaks
    return NextResponse.json(
      { success: false, error: "An unexpected internal server error occurred" },
      { status: 500 }
    );
  }
}
