import assert from "assert";
import { NextRequest } from "next/server";
import { middleware } from "../middleware";
import { createToken } from "../lib/auth";

export async function runMiddlewareTests() {
  console.log("==========================================");
  console.log("RUNNING MIDDLEWARE SECURITY & RBAC TESTS");
  console.log("==========================================\n");

  // ─── 1. Security Headers Verification ───
  console.log("--> Testing Security Headers...");
  const standardReq = new NextRequest("http://localhost/about");
  const standardRes = await middleware(standardReq);

  assert.strictEqual(
    standardRes.headers.get("X-Content-Type-Options"),
    "nosniff",
    "X-Content-Type-Options header must be nosniff"
  );
  assert.strictEqual(
    standardRes.headers.get("Referrer-Policy"),
    "strict-origin-when-cross-origin",
    "Referrer-Policy header must be strict-origin-when-cross-origin"
  );
  assert.strictEqual(
    standardRes.headers.get("Permissions-Policy"),
    "camera=(), microphone=(), geolocation=()",
    "Permissions-Policy header must be camera=(), microphone=(), geolocation=()"
  );
  console.log("  ✅ Security headers verified");

  // ─── 2. RBAC Enforcement Verification ───
  console.log("\n--> Testing RBAC & Role Enforcement...");

  const adminToken = createToken({
    id: "admin-user",
    email: "admin@dealflow.ai",
    name: "Admin User",
    role: "admin",
  });

  const agentToken = createToken({
    id: "agent-user",
    email: "agent@dealflow.ai",
    name: "Agent User",
    role: "agent",
  });

  const customerToken = createToken({
    id: "customer-user",
    email: "customer@dealflow.ai",
    name: "Customer User",
    role: "customer",
  });

  function makeAuthReq(urlStr: string, token?: string) {
    const headers = new Headers();
    if (token) {
      headers.set("cookie", `df_auth_token=${token}`);
    }
    return new NextRequest(urlStr, { headers });
  }

  // Unauthenticated requests
  const unauthAdmin = await middleware(makeAuthReq("http://localhost/portal/admin"));
  assert.strictEqual(unauthAdmin.status, 307);
  assert.strictEqual(new URL(unauthAdmin.headers.get("location")!).pathname, "/portal/admin/login");

  const unauthAgent = await middleware(makeAuthReq("http://localhost/portal/agent"));
  assert.strictEqual(unauthAgent.status, 307);
  assert.strictEqual(new URL(unauthAgent.headers.get("location")!).pathname, "/portal/agent/login");

  const unauthCustomer = await middleware(makeAuthReq("http://localhost/portal/customer"));
  assert.strictEqual(unauthCustomer.status, 307);
  assert.strictEqual(new URL(unauthCustomer.headers.get("location")!).pathname, "/portal/customer/login");

  // Login pages must remain accessible
  const adminLoginReq = await middleware(makeAuthReq("http://localhost/portal/admin/login"));
  assert.strictEqual(adminLoginReq.status, 200);

  const agentLoginReq = await middleware(makeAuthReq("http://localhost/portal/agent/login"));
  assert.strictEqual(agentLoginReq.status, 200);

  const customerLoginReq = await middleware(makeAuthReq("http://localhost/portal/customer/login"));
  assert.strictEqual(customerLoginReq.status, 200);

  // Customer role accessing various portals
  const custToAdmin = await middleware(makeAuthReq("http://localhost/portal/admin", customerToken));
  assert.strictEqual(custToAdmin.status, 307, "Customer should be blocked from /portal/admin");
  assert.strictEqual(new URL(custToAdmin.headers.get("location")!).pathname, "/portal/admin/login");

  const custToAgent = await middleware(makeAuthReq("http://localhost/portal/agent", customerToken));
  assert.strictEqual(custToAgent.status, 307, "Customer should be blocked from /portal/agent");
  assert.strictEqual(new URL(custToAgent.headers.get("location")!).pathname, "/portal/agent/login");

  const custToCustomer = await middleware(makeAuthReq("http://localhost/portal/customer", customerToken));
  assert.strictEqual(custToCustomer.status, 200, "Customer should be allowed into /portal/customer");

  // Agent role accessing various portals
  const agentToAdmin = await middleware(makeAuthReq("http://localhost/portal/admin", agentToken));
  assert.strictEqual(agentToAdmin.status, 307, "Agent should be blocked from /portal/admin");
  assert.strictEqual(new URL(agentToAdmin.headers.get("location")!).pathname, "/portal/admin/login");

  const agentToCustomer = await middleware(makeAuthReq("http://localhost/portal/customer", agentToken));
  assert.strictEqual(agentToCustomer.status, 307, "Agent should be blocked from /portal/customer");
  assert.strictEqual(new URL(agentToCustomer.headers.get("location")!).pathname, "/portal/customer/login");

  const agentToAgent = await middleware(makeAuthReq("http://localhost/portal/agent", agentToken));
  assert.strictEqual(agentToAgent.status, 200, "Agent should be allowed into /portal/agent");

  // Admin role accessing admin portal
  const adminToAdmin = await middleware(makeAuthReq("http://localhost/portal/admin", adminToken));
  assert.strictEqual(adminToAdmin.status, 200, "Admin should be allowed into /portal/admin");

  // Tampered/invalid token
  const tamperedToken = customerToken.substring(0, customerToken.lastIndexOf(".") + 1) + "badSignature123";
  const tamperedRes = await middleware(makeAuthReq("http://localhost/portal/customer", tamperedToken));
  assert.strictEqual(tamperedRes.status, 307, "Tampered token should be rejected");

  console.log("  ✅ RBAC role-based portal protection verified");

  // ─── 3. WAF Exclusions for Internal API Routes ───
  console.log("\n--> Testing WAF Exclusions for Internal API Routes...");

  // Non-excluded API route with malicious query
  const maliciousQueryReq = new NextRequest("http://localhost/api/users?query=" + encodeURIComponent("UNION SELECT 1,2,3"));
  const maliciousQueryRes = await middleware(maliciousQueryReq);
  assert.strictEqual(maliciousQueryRes.status, 400, "WAF must block SQL injection on normal API routes");

  // Non-excluded API route with malicious body
  const maliciousBodyReq = new NextRequest("http://localhost/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bio: "<script>alert('xss')</script>" }),
  });
  const maliciousBodyRes = await middleware(maliciousBodyReq);
  assert.strictEqual(maliciousBodyRes.status, 400, "WAF must block XSS on normal API routes");

  // Excluded routes: /api/leads/save, /api/gtm-intake, /api/gtm-analysis
  const leadsSaveReq = new NextRequest("http://localhost/api/leads/save?query=" + encodeURIComponent("UNION SELECT 1,2,3"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comments: "Discussing <script> tags and UNION SELECT syntax" }),
  });
  const leadsSaveRes = await middleware(leadsSaveReq);
  assert.strictEqual(leadsSaveRes.status, 200, "/api/leads/save must bypass WAF");

  const gtmIntakeReq = new NextRequest("http://localhost/api/gtm-intake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ formData: "<script>alert('test')</script>" }),
  });
  const gtmIntakeRes = await middleware(gtmIntakeReq);
  assert.strictEqual(gtmIntakeRes.status, 200, "/api/gtm-intake must bypass WAF");

  const gtmAnalysisReq = new NextRequest("http://localhost/api/gtm-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ analysis: "UNION SELECT * FROM competitors" }),
  });
  const gtmAnalysisRes = await middleware(gtmAnalysisReq);
  assert.strictEqual(gtmAnalysisRes.status, 200, "/api/gtm-analysis must bypass WAF");

  console.log("  ✅ WAF exclusions verified for /api/leads/save, /api/gtm-intake, /api/gtm-analysis");

  // ─── 4. JWT Secret Production Safeguard Verification ───
  console.log("\n--> Testing JWT Secret Production Safeguard...");
  const origEnv = process.env.NODE_ENV;
  const origSecret = process.env.JWT_SECRET;

  try {
    // 1. In production mode with missing JWT_SECRET, getJwtSecret must throw error
    (process.env as any).NODE_ENV = "production";
    delete process.env.JWT_SECRET;

    assert.throws(
      () => {
        createToken({
          id: "attacker",
          email: "attacker@test.com",
          role: "admin",
          name: "Attacker",
        });
      },
      /CRITICAL SECURITY ERROR: JWT_SECRET environment variable must be defined and at least 32 characters long in production/,
      "Expected createToken to throw in production when JWT_SECRET is missing"
    );

    // 2. In production mode with short JWT_SECRET, it must also throw
    process.env.JWT_SECRET = "too-short-secret";
    assert.throws(
      () => {
        createToken({
          id: "attacker",
          email: "attacker@test.com",
          role: "admin",
          name: "Attacker",
        });
      },
      /CRITICAL SECURITY ERROR: JWT_SECRET environment variable must be defined and at least 32 characters long in production/,
      "Expected createToken to throw in production when JWT_SECRET is too short"
    );

    console.log("  ✅ Production JWT_SECRET enforcement verified");
  } finally {
    (process.env as any).NODE_ENV = origEnv;
    if (origSecret !== undefined) {
      process.env.JWT_SECRET = origSecret;
    }
  }

  console.log("\n🎉 ALL MIDDLEWARE TESTS PASSED SUCCESSFULLY!\n");
}

runMiddlewareTests().catch((err) => {
  console.error("❌ Middleware test failed:", err);
  process.exit(1);
});
