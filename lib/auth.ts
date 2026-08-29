import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "./firebase-admin";
import { logger } from "./logger";

// --- Constants & Configuration ---
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
const JWT_EXPIRES_IN = "8h"; // 8-hour sessions — auto-refreshed on activity
const AUTH_COOKIE_NAME = "df_auth_token";
export const SALT_ROUNDS = 12;

// --- Types ---
export type UserRole = "admin" | "agent" | "customer";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface DemoAgent {
  id: string;
  email: string;
  hashedPassword: string;
  name: string;
  role: "agent";
}

export interface DemoCustomer {
  id: string;
  email: string;
  hashedPassword: string;
  name: string;
  role: "customer";
}

export interface DemoAdmin {
  id: string;
  email: string;
  name: string;
  role: "admin";
}

import { isBuildPhase } from "./utils";

// S-01: In production runtime, required auth credentials MUST come from environment variables.
// In development/testing and build phase, a stable default is permitted.
function requireEnvPassword(envVar: string, devDefault: string): string {
  const value = process.env[envVar];
  if (value && value.trim() !== "") {
    return value.trim();
  }
  if (process.env.NODE_ENV === "production") {
    if (isBuildPhase()) {
      return devDefault;
    }
    throw new Error(`CRITICAL SECURITY ERROR: Required authentication environment variable '${envVar}' must be configured in production.`);
  }
  return devDefault;
}

export const DEMO_ADMIN = {
  id: "admin-2",
  email: "admin@dealflow.ai",
  name: "Admin One",
  role: "admin" as const,
  hashedPassword: bcrypt.hashSync(requireEnvPassword("ADMIN_PASSWORD", "DealFlowDev!Admin2026"), SALT_ROUNDS),
};

export const DEMO_ADMINS: (DemoAdmin & { hashedPassword: string })[] = [
  {
    id: "admin-1",
    email: "admin1@dealflow.ai",
    name: "Administrator",
    role: "admin",
    hashedPassword: bcrypt.hashSync(requireEnvPassword("ADMIN1_PASSWORD", "DealFlowDev!Admin12026"), SALT_ROUNDS),
  },
  {
    id: "admin-3",
    email: "admin3@dealflow.ai",
    name: "Admin Ops",
    role: "admin",
    hashedPassword: bcrypt.hashSync(requireEnvPassword("ADMIN3_PASSWORD", "DealFlowDev!Admin32026"), SALT_ROUNDS),
  },
];

export const DEMO_AGENTS: DemoAgent[] = [
  {
    id: "agent-1",
    email: "praneeth@dealflow.ai",
    name: "Praneeth",
    role: "agent",
    hashedPassword: bcrypt.hashSync(requireEnvPassword("AGENT_PRANEETH_PASSWORD", "DealFlowDev!Agent12026"), SALT_ROUNDS),
  },
  {
    id: "agent-2",
    email: "agent.ashok@dealflow.ai",
    name: "Ashok",
    role: "agent",
    hashedPassword: bcrypt.hashSync(requireEnvPassword("AGENT_ASHOK_PASSWORD", "DealFlowDev!Agent22026"), SALT_ROUNDS),
  },
];

export const DEMO_CUSTOMERS: DemoCustomer[] = [
  {
    id: "cust-1",
    email: "demo@customer.com",
    name: "Demo Customer",
    role: "customer",
    hashedPassword: bcrypt.hashSync(requireEnvPassword("CUSTOMER_DEMO_PASSWORD", "DealFlowDev!Cust12026"), SALT_ROUNDS),
  },
  {
    id: "cust-2",
    email: "praneethburada@gmail.com",
    name: "Praneeth Burada",
    role: "customer",
    hashedPassword: bcrypt.hashSync(requireEnvPassword("CUSTOMER_PRANEETH_PASSWORD", "DealFlowDev!Cust22026"), SALT_ROUNDS),
  },
];
export let NEW_CUSTOMERS: DemoCustomer[] = [];

// --- Audit Logging ---
export function addAuditLog(
  email: string,
  role: UserRole | "unknown",
  success: boolean,
  message: string,
  ip?: string,
  userAgent?: string
) {
  const log = {
    id: `log-${Date.now()}-${Math.random()}`,
    timestamp: new Date().toISOString(),
    email,
    role,
    success,
    ip: ip || "unknown",
    userAgent: userAgent || "unknown",
    message,
  };

  // Write structured JSON log
  logger.info(`[AUDIT LOG] ${message}`, log);

  // Persist to Firestore asynchronously
  if (db && typeof db.collection === "function") {
    try {
      const col = db.collection("audit_logs");
      if (col && typeof col.add === "function") {
        col.add(log).catch((err) => {
          logger.error("Failed to write audit log to Firestore", err);
        });
      }
    } catch (err) {
      logger.error("Failed to write audit log to Firestore", err);
    }
  }
}

// --- Password Hashing ---
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

export async function verifyPassword(
  plaintext: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hashed);
}

// --- JWT Token Management ---
export function createToken(user: AuthUser): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Refreshes a valid token — reissues a fresh JWT if the current one is still valid.
 * Returns null if the token is expired or invalid.
 */
export function refreshToken(existingToken: string): string | null {
  const payload = verifyToken(existingToken);
  if (!payload) return null;
  const user: AuthUser = {
    id: payload.userId,
    email: payload.email,
    role: payload.role,
    name: payload.name,
  };
  return createToken(user);
}

// --- Cookie Management ---
export async function setAuthCookie(token: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true, // Secure from XSS
      secure: process.env.NODE_ENV === "production", // Only HTTPS in production
      sameSite: "lax", // Prevent CSRF
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours (matches JWT expiry)
    });
  } catch (e) {
    // If called outside Next.js request context (e.g. CLI test environment), ignore cookie store error
  }
}

export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value || null;
}

export function deleteAuthCookieFromResponse(response: NextResponse): NextResponse {
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return response;
}

export async function deleteAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

// --- Current User Helper ---
export async function getAuthenticatedUser(req?: Request): Promise<AuthUser | null> {
  let token: string | null = null;
  try {
    token = await getAuthCookie();
  } catch (e) {
    // cookies() might throw in some rendering contexts
  }
  
  if (!token && req) {
    const authHeader = req.headers.get("authorization") ?? "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
    
    if (!token) {
      const cookieHeader = req.headers.get("cookie") ?? "";
      const match = cookieHeader.match(new RegExp(`(^|;)\\s*${AUTH_COOKIE_NAME}\\s*=\\s*([^;]+)`));
      if (match) {
        token = match[2];
      }
    }
  }
  
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return {
    id: payload.userId,
    email: payload.email,
    role: payload.role,
    name: payload.name,
  };
}

export async function getCurrentUser(req?: Request): Promise<AuthUser | null> {
  return getAuthenticatedUser(req);
}

export const getCurrentUserFromRequest = getAuthenticatedUser;

/**
 * Reusable RBAC/Auth Guard for Next.js endpoints.
 */
export async function requireAuth(
  req: Request,
  allowedRoles?: UserRole[]
): Promise<{ user: AuthUser | null; errorResponse?: NextResponse }> {
  const user = await getAuthenticatedUser(req);
  
  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ),
    };
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      user,
      errorResponse: NextResponse.json(
        { success: false, error: "Forbidden: insufficient permissions" },
        { status: 403 }
      ),
    };
  }
  
  return { user };
}
