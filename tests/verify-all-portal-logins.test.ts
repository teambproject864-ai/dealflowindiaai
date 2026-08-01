import assert from "assert";
import { NextRequest } from "next/server";

// Set environment variables for test execution
process.env.ADMIN_PASSWORD = "Admin@123";
process.env.ADMIN1_PASSWORD = "Admin@123";
process.env.AGENT_PRANEETH_PASSWORD = "Praneeth@123";
process.env.AGENT_ASHOK_PASSWORD = "Ashok@123";
process.env.CUSTOMER_DEMO_PASSWORD = "Demo@123";
process.env.CUSTOMER_PRANEETH_PASSWORD = "Praneeth@1909";

const { POST: loginPost } = require("../app/api/auth/login/route");

async function runPortalLoginVerification() {
  console.log("==================================================");
  console.log("RUNNING PORTAL AUTHENTICATION VERIFICATION SUITE");
  console.log("==================================================");

  const testAccounts = [
    { email: "admin@dealflow.ai", password: "Admin@123", role: "admin", label: "Admin Account (admin@dealflow.ai)" },
    { email: "admin1@dealflow.ai", password: "Admin@123", role: "admin", label: "Secondary Admin (admin1@dealflow.ai)" },
    { email: "praneeth@dealflow.ai", password: "Praneeth@123", role: "agent", label: "Agent Account (praneeth@dealflow.ai)" },
    { email: "agent.ashok@dealflow.ai", password: "Ashok@123", role: "agent", label: "Agent Account (agent.ashok@dealflow.ai)" },
    { email: "demo@customer.com", password: "Demo@123", role: "customer", label: "Customer Account (demo@customer.com)" },
    { email: "praneethburada@gmail.com", password: "Praneeth@1909", role: "customer", label: "Customer Account (praneethburada@gmail.com)" },
  ];

  for (const account of testAccounts) {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: account.email,
        password: account.password,
        role: account.role,
      }),
    });

    const res = await loginPost(req);
    const body = await res.json();

    assert.strictEqual(res.status, 200, `Expected status 200 for ${account.label}, got ${res.status}`);
    assert.strictEqual(body.success, true, `Expected success true for ${account.label}`);
    assert.strictEqual(body.user.email.toLowerCase(), account.email.toLowerCase(), `User email mismatch for ${account.label}`);
    assert.strictEqual(body.user.role, account.role, `User role mismatch for ${account.label}`);

    console.log(`✅ Passed: ${account.label} authenticated successfully as ${account.role}`);
  }

  // Cross-role scoping validation test
  const crossRoleTestReq = new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "demo@customer.com",
      password: "Demo@123",
      role: "admin", // Invalid portal role for customer account
    }),
  });

  const crossRoleRes = await loginPost(crossRoleTestReq);
  assert.strictEqual(crossRoleRes.status, 401, "Expected 401 for wrong credentials/role mismatch in demo lookup");

  console.log("✅ Passed: Cross-role protection working as expected");
  console.log("==================================================");
  console.log("ALL PORTAL LOGIN VERIFICATIONS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

runPortalLoginVerification().catch((err) => {
  console.error("❌ Verification test failed:", err);
  process.exit(1);
});
