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
  return WAF_PATTERNS.some(rx => rx.test(text));
}

export async function middleware(request: NextRequest) {
  const ip = (request as any).ip || request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  const url = new URL(request.url);

  // Skip WAF for our internal API routes that handle form data (we validate those separately)
  const skipWafPaths = ["/api/leads/save", "/api/gtm-intake", "/api/gtm-analysis"];
  const shouldSkipWaf = skipWafPaths.some(path => url.pathname.startsWith(path));

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
    if (["POST", "PUT", "PATCH"].includes(request.method) && url.pathname.startsWith("/api")) {
      try {
        const clone = request.clone();
        const bodyText = await clone.text();
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

  const response = NextResponse.next();

  // Content Security Policy (CSP) - allow necessary resources including official Calendly widgets
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

  // X-Frame-Options: Prevent clickjacking while allowing sameorigin framing
  response.headers.set("X-Frame-Options", "SAMEORIGIN");

  // X-Content-Type-Options: Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Referrer-Policy: Control how much referrer info is sent
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions-Policy: Restrict sensitive APIs
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

