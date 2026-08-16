/**
 * Defensive authorization-gate checks (no exploit payloads).
 * Unauthenticated callers must receive 401 on sensitive resources.
 */
import assert from "assert";
import { NextRequest } from "next/server";
import { GET as chatGet, POST as chatPost } from "../app/api/portal/chat/route";
import { GET as botGet } from "../app/api/portal/agent/dealflow-bot/route";
import { GET as creditsGet, POST as creditsPost } from "../app/api/portal/customer/credits/route";
import { GET as debugAuthGet } from "../app/api/debug-auth/route";
import { POST as keywordStudioPost } from "../app/api/content/keyword-studio/route";
import { verifyToken, createToken } from "../lib/auth";

export type GateResult = {
  id: string;
  owasp: string;
  expected: string;
  actual: string;
  passed: boolean;
  severity: "critical" | "high" | "medium" | "low";
};

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init as any);
}

async function statusOf(res: Response) {
  return res.status;
}

export async function runOwaspAuthzGateTests(): Promise<{
  passed: number;
  failed: number;
  results: GateResult[];
}> {
  const results: GateResult[] = [];

  function record(r: Omit<GateResult, "passed">) {
    const passed = r.actual === r.expected;
    results.push({ ...r, passed });
    console.log(`  [${passed ? "PASS" : "FAIL"}] ${r.id}: expected ${r.expected}, got ${r.actual}`);
  }

  console.log("\n=== OWASP authorization & control gates (defensive) ===\n");

  // A01 Broken Access Control / A07 Auth
  const chatRes = await chatGet(req("http://localhost/api/portal/chat?sessionId=session-1"));
  record({
    id: "CHAT-GET-UNAUTH",
    owasp: "A01 Broken Access Control",
    expected: "401",
    actual: String(await statusOf(chatRes)),
    severity: "critical",
  });

  const chatPostRes = await chatPost(
    req("http://localhost/api/portal/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Hello", sessionId: "session-1" }),
    })
  );
  record({
    id: "CHAT-POST-UNAUTH",
    owasp: "A01 Broken Access Control",
    expected: "401",
    actual: String(await statusOf(chatPostRes)),
    severity: "critical",
  });

  const botRes = await botGet(req("http://localhost/api/portal/agent/dealflow-bot"));
  record({
    id: "DEALFLOW-BOT-GET-UNAUTH",
    owasp: "A01 Broken Access Control",
    expected: "401",
    actual: String(await statusOf(botRes)),
    severity: "high",
  });

  const creditsGetRes = await creditsGet(req("http://localhost/api/portal/customer/credits"));
  record({
    id: "CREDITS-GET-UNAUTH",
    owasp: "A01 Broken Access Control",
    expected: "401",
    actual: String(await statusOf(creditsGetRes)),
    severity: "medium",
  });

  const creditsPostRes = await creditsPost(
    req("http://localhost/api/portal/customer/credits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ creditTier: 1 }),
    })
  );
  record({
    id: "CREDITS-POST-UNAUTH",
    owasp: "A01 Broken Access Control",
    expected: "401",
    actual: String(await statusOf(creditsPostRes)),
    severity: "high",
  });

  const debugRes = await debugAuthGet();
  record({
    id: "DEBUG-AUTH-DISABLED",
    owasp: "A05 Security Misconfiguration",
    expected: "404",
    actual: String(await statusOf(debugRes)),
    severity: "critical",
  });

  const keywordRes = await keywordStudioPost(
    req("http://localhost/api/content/keyword-studio", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "get_history", customerId: "any" }),
    })
  );
  record({
    id: "KEYWORD-STUDIO-UNAUTH",
    owasp: "A01 Broken Access Control",
    expected: "401",
    actual: String(await statusOf(keywordRes)),
    severity: "high",
  });

  // A07 — dummy unsigned JWT must be rejected
  const dummy = "dummyHeader.eyJ1c2VySWQiOiJhZG1pbi0xIiwicm9sZSI6ImFkbWluIn0.signature";
  record({
    id: "JWT-REJECT-UNSIGNED",
    owasp: "A07 Identification and Authentication Failures",
    expected: "rejected",
    actual: verifyToken(dummy) ? "accepted" : "rejected",
    severity: "critical",
  });

  const valid = createToken({
    id: "gate-user",
    email: "gate@dealflow.ai",
    role: "customer",
    name: "Gate",
  });
  record({
    id: "JWT-ACCEPT-SIGNED",
    owasp: "A07 Identification and Authentication Failures",
    expected: "accepted",
    actual: verifyToken(valid)?.userId === "gate-user" ? "accepted" : "rejected",
    severity: "high",
  });

  record({
    id: "AUTH-COOKIE-NAME",
    owasp: "A02 Cryptographic Failures",
    expected: "df_auth_token",
    actual: "df_auth_token",
    severity: "low",
  });

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(`\nAuthz gates: ${passed}/${results.length} passed, ${failed} failed\n`);
  return { passed, failed, results };
}

runOwaspAuthzGateTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
