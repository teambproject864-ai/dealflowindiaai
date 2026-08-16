import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BLOCKED_IPS = new Set<string>(
  (process.env.BLOCKED_IPS || "198.51.100.42,203.0.113.15").split(",").map(ip => ip.trim())
);

const WAF_PATTERNS = [
  /UNION\s+(ALL\s+)?SELECT/i,
  /OR\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
  /javascript:/i,
  /\s(on\w+)\s*=/i,
  /\.\.[\\/]/
];

function isMalicious(text: string): boolean {
  if (!text) return false;
  let decoded = text;
  try {
    decoded = decodeURIComponent(text);
  } catch {
    // ignore decode error
  }
  return WAF_PATTERNS.some(rx => rx.test(text) || rx.test(decoded));
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY ERROR: JWT_SECRET environment variable must be defined and at least 32 characters long in production."
      );
    }
    return "default-dev-jwt-secret-key-must-be-at-least-32-chars-long!";
  }
  return secret;
}

async function verifyJwtSignature(token: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    // For local development and E2E tests, allow dummySignature bypass
    if (process.env.NODE_ENV !== "production" && parts[2] === "dummySignature") {
      return true;
    }

    const secret = getJwtSecret();
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const message = enc.encode(`${parts[0]}.${parts[1]}`);

    const base64Url = parts[2];
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }

    const sigString = atob(base64);
    const sigBytes = new Uint8Array(sigString.length);
    for (let i = 0; i < sigString.length; i++) {
      sigBytes[i] = sigString.charCodeAt(i);
    }

    return await crypto.subtle.verify("HMAC", key, sigBytes, message);
  } catch {
    return false;
  }
}

function decodeJwt(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    let base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const decoded = atob(base64);
    const parsed = JSON.parse(decoded);

    // Verify token expiration
    const now = Math.floor(Date.now() / 1000);
    if (parsed.exp && parsed.exp < now) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const ip = (request as any).ip || request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Skip WAF for our internal API routes that handle form data (we validate those separately)
  const skipWafPaths = ["/api/leads/save", "/api/gtm-intake", "/api/gtm-analysis"];
  const shouldSkipWaf = skipWafPaths.some((path) => pathname.startsWith(path));

  // 1. IP Filtering
  if (BLOCKED_IPS.has(ip)) {
    return new NextResponse(
      JSON.stringify({ success: false, error: "Access Denied: IP blocked by Edge Firewall" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!shouldSkipWaf) {
    // 2. Query String and Header WAF Checks
    if (isMalicious(url.search) || isMalicious(request.headers.get("user-agent") || "")) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Access Denied: Malicious request blocked by Edge WAF" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Request Body WAF Check (JSON/Form payload)
    if (["POST", "PUT", "PATCH"].includes(request.method) && pathname.startsWith("/api")) {
      try {
        const clone = request.clone();
        const bodyText = await clone.text();
        // For JSON payloads, check for direct script injections / SQL injections
        if (isMalicious(bodyText)) {
          return new NextResponse(
            JSON.stringify({ success: false, error: "Access Denied: Malicious body blocked by Edge WAF" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      } catch {
        // safe fallback
      }
    }
  }

  // 4. Server-Side Portal RBAC Guard
  const authToken = request.cookies.get("df_auth_token")?.value;
  const isSignatureValid = authToken ? await verifyJwtSignature(authToken) : false;
  const decoded = authToken && isSignatureValid ? decodeJwt(authToken) : null;
  const userRole = decoded?.role;

  if (pathname.startsWith("/portal/admin") && !pathname.startsWith("/portal/admin/login")) {
    if (!userRole || userRole !== "admin") {
      return NextResponse.redirect(new URL("/portal/admin/login", request.url));
    }
  } else if (pathname.startsWith("/portal/agent") && !pathname.startsWith("/portal/agent/login")) {
    if (!userRole || userRole !== "agent") {
      return NextResponse.redirect(new URL("/portal/agent/login", request.url));
    }
  } else if (pathname.startsWith("/portal/customer") && !pathname.startsWith("/portal/customer/login")) {
    if (!userRole || userRole !== "customer") {
      return NextResponse.redirect(new URL("/portal/customer/login", request.url));
    }
  }

  const response = NextResponse.next();

  // Content Security Policy (CSP)
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://assets.calendly.com https://*.calendly.com",
    "style-src 'self' 'unsafe-inline' https://assets.calendly.com",
    "img-src 'self' data: blob: https: https://assets.calendly.com https://*.calendly.com",
    "font-src 'self' data: https://assets.calendly.com",
    "connect-src 'self' https://api.openai.com https://*.firebaseio.com wss://*.firebaseio.com https://firestore.googleapis.com https://api.huggingface.co https://calendly.com https://*.calendly.com https://assets.calendly.com https://api.elevenlabs.io https://*.twilio.com wss://*.twilio.com",
    "frame-src 'self' https://calendly.com https://*.calendly.com https://assets.calendly.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "worker-src 'self' blob:",
    "child-src 'self' blob:"
  ].join("; ");

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the static and image assets
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
