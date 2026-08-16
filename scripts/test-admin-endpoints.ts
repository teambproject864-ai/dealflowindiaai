// scripts/test-admin-endpoints.ts
import { NextResponse } from "next/server";

async function testEndpoints() {
  console.log("Checking API endpoints polled by Admin Portal...");
  const urls = [
    "http://localhost:3000/api/admin/agents",
    "http://localhost:3000/api/admin/customers",
    "http://localhost:3000/api/portal/tasks",
    "http://localhost:3000/api/portal/requirements",
    "http://localhost:3000/api/portal/resignations",
    "http://localhost:3000/api/portal/documents",
    "http://localhost:3000/api/admin/audit-logs",
    "http://localhost:3000/api/portal/gtm-reports",
    "http://localhost:3000/api/portal/feedback",
    "http://localhost:3000/api/portal/calls",
    "http://localhost:3000/api/portal/chat?sessionId=session-1",
    "http://localhost:3000/api/integrated/observability/stats",
    "http://localhost:3000/api/integrated/observability/events?limit=50"
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url).catch(() => null);
      if (!res) {
        console.log(`[Offline / Dev] ${url} - Server not listening locally or fetch skipped.`);
        continue;
      }
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        console.log(`[${res.status}] ${url} -> JSON OK (${json.success ? "success: true" : "handled failure/auth required"})`);
      } catch (parseErr) {
        console.log(`⚠️ [${res.status}] ${url} -> Non-JSON Body returned (${text.slice(0, 50)}...)`);
      }
    } catch (err: any) {
      console.log(`Error checking ${url}:`, err.message);
    }
  }
}

testEndpoints();
