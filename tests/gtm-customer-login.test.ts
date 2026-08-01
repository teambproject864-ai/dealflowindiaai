import assert from "assert";

// Set mock environment variables for CI/test execution
if (!process.env.FIREBASE_PROJECT_ID) {
  process.env.FIREBASE_PROJECT_ID = "mock-project";
}
if (!process.env.FIREBASE_CLIENT_EMAIL) {
  process.env.FIREBASE_CLIENT_EMAIL = "mock-email";
}
if (!process.env.FIREBASE_PRIVATE_KEY) {
  process.env.FIREBASE_PRIVATE_KEY = "mock-key";
}

const { POST: loginPost } = require("../app/api/auth/login/route");
const { POST: credentialsPost } = require("../app/api/customer-credentials/route");
const { migrateGTMCustomerAccounts } = require("../scripts/migrate-gtm-customer-accounts");
const { NEW_CUSTOMERS, hashPassword } = require("../lib/auth");

let mockStore: Record<string, Record<string, any>> = {};

function resetMockStore() {
  mockStore = {
    users: {},
    customer_credentials: {},
    leads: {},
    customers: {},
    gtm_intakes: {},
  };
}

function setupMockFirestore() {
  (globalThis as any).firestoreQuotaExhausted = false;
  const mockDb = {
    collection: (collectionName: string) => {
      const getCollection = () => {
        if (!mockStore[collectionName]) {
          mockStore[collectionName] = {};
        }
        return mockStore[collectionName];
      };

      return {
        doc: (docId: string) => {
          return {
            get: async () => ({
              exists: !!getCollection()[docId],
              data: () => getCollection()[docId],
            }),
            set: async (data: any, options?: any) => {
              const col = getCollection();
              if (options?.merge) {
                col[docId] = { ...col[docId], ...data };
              } else {
                col[docId] = data;
              }
            },
            update: async (data: any) => {
              const col = getCollection();
              col[docId] = { ...col[docId], ...data };
            },
          };
        },
        get: async () => {
          const col = getCollection();
          const docs = Object.entries(col).map(([id, val]) => ({
            id,
            data: () => val,
          }));
          return {
            empty: docs.length === 0,
            forEach: (cb: any) => docs.forEach(cb),
            docs,
          };
        },
        where: function(field: string, op: string, value: any) {
          return {
            get: async () => {
              const col = getCollection();
              const filtered = Object.entries(col)
                .filter(([_, val]: any) => val[field] === value)
                .map(([id, val]) => ({
                  id,
                  data: () => val,
                }));
              return {
                empty: filtered.length === 0,
                docs: filtered,
                forEach: (cb: any) => filtered.forEach(cb),
              };
            }
          };
        },
        add: async (data: any) => {
          const col = getCollection();
          const docId = `auto-gen-${Date.now()}-${Math.random()}`;
          col[docId] = data;
          return { id: docId };
        }
      } as any;
    }
  };
  (globalThis as any).firestoreMock = mockDb;
}

function restoreFirestore() {
  (globalThis as any).firestoreMock = undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SCENARIOS
// ─────────────────────────────────────────────────────────────────────────────

async function testGTMAssessmentAccountCreationAndLogin() {
  resetMockStore();
  setupMockFirestore();

  try {
    const leadId = "lead-gtm-auth-001";
    const email = "gtm.customer@acme.com";
    const password = "Password123!";

    mockStore.leads[leadId] = {
      id: leadId,
      companyName: "Acme Corp",
      contactName: "Wile E Coyote",
      contactEmail: email,
    };

    // 1. Create account via customer-credentials endpoint
    const credReq = new Request("http://localhost:3000/api/customer-credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, email, password }),
    });

    const credRes = await credentialsPost(credReq);
    assert.strictEqual(credRes.status, 200, "Account creation should return 200");
    const credData = await credRes.json();
    assert.strictEqual(credData.success, true, "Account creation should be successful");

    // Verify user record created in users collection with role="customer" and isVerified=true
    const userDocs = Object.values(mockStore.users);
    assert.strictEqual(userDocs.length, 1, "Should create one user in users collection");
    const createdUser = userDocs[0];
    assert.strictEqual(createdUser.email, email.toLowerCase());
    assert.strictEqual(createdUser.role, "customer");
    assert.strictEqual(createdUser.isVerified, true);
    assert.strictEqual(createdUser.source, "gtm_assessment");

    // 2. Login via Customer Portal endpoint (role: "customer") -> Success 200
    const loginReq = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: "customer" }),
    });

    const loginRes = await loginPost(loginReq);
    assert.strictEqual(loginRes.status, 200, "Customer login should return 200");
    const loginData = await loginRes.json();
    assert.strictEqual(loginData.success, true, "Customer login should be successful");
    assert.strictEqual(loginData.user.role, "customer");
    assert.strictEqual(loginData.user.email, email.toLowerCase());

    console.log("✅ Passed: testGTMAssessmentAccountCreationAndLogin");
  } finally {
    restoreFirestore();
  }
}

async function testGTMCustomerBlockedFromNonCustomerPortals() {
  resetMockStore();
  setupMockFirestore();

  try {
    const email = "gtm.customer.restricted@acme.com";
    const password = "Password123!";
    const hashedPassword = await hashPassword(password);

    // Pre-populate GTM Customer user
    mockStore.users["user-gtm-restricted"] = {
      id: "user-gtm-restricted",
      email: email.toLowerCase(),
      hashedPassword,
      name: "Restricted Customer",
      role: "customer",
      isVerified: true,
      source: "gtm_assessment",
    };

    // 1. Attempt login at Admin portal endpoint (role: "admin") -> Blocked 403
    const adminReq = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: "admin" }),
    });

    const adminRes = await loginPost(adminReq);
    assert.strictEqual(adminRes.status, 403, "GTM Customer login to Admin portal should return 403");
    const adminData = await adminRes.json();
    assert.strictEqual(adminData.success, false);
    assert.ok(adminData.error.includes("Customer accounts generated through GTM Assessment can only authenticate via the Customer Portal"));

    // 2. Attempt login at Agent portal endpoint (role: "agent") -> Blocked 403
    const agentReq = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: "agent" }),
    });

    const agentRes = await loginPost(agentReq);
    assert.strictEqual(agentRes.status, 403, "GTM Customer login to Agent portal should return 403");
    const agentData = await agentRes.json();
    assert.strictEqual(agentData.success, false);
    assert.ok(agentData.error.includes("Customer accounts generated through GTM Assessment can only authenticate via the Customer Portal"));

    console.log("✅ Passed: testGTMCustomerBlockedFromNonCustomerPortals");
  } finally {
    restoreFirestore();
  }
}

async function testNonCustomerBlockedFromCustomerPortal() {
  resetMockStore();
  setupMockFirestore();

  try {
    const email = "admin.staff@dealflow.ai";
    const password = "Password123!";
    const hashedPassword = await hashPassword(password);

    // Pre-populate Admin user
    mockStore.users["user-admin-staff"] = {
      id: "user-admin-staff",
      email: email.toLowerCase(),
      hashedPassword,
      name: "Admin Staff",
      role: "admin",
      isVerified: true,
    };

    // Attempt login at Customer portal endpoint (role: "customer") -> Blocked 403
    const req = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: "customer" }),
    });

    const res = await loginPost(req);
    assert.strictEqual(res.status, 403, "Admin user logging into Customer portal should return 403");
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.error.includes("Internal staff/admin accounts cannot authenticate via the Customer Portal"));

    console.log("✅ Passed: testNonCustomerBlockedFromCustomerPortal");
  } finally {
    restoreFirestore();
  }
}

async function testAutoHealingMissingUserRecord() {
  resetMockStore();
  setupMockFirestore();

  try {
    const email = "legacy.gtm@customer.com";
    const password = "Password123!";
    const hashedPassword = await hashPassword(password);

    // Pre-populate document ONLY in customer_credentials (simulating legacy/un-healed record)
    mockStore.customer_credentials["cred-legacy-001"] = {
      id: "cred-legacy-001",
      leadId: "lead-legacy-001",
      customerId: "customer-legacy-001",
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      createdAt: new Date().toISOString(),
      isVerified: true,
    };

    // Verify users collection is empty initially
    assert.strictEqual(Object.keys(mockStore.users).length, 0);

    // Login via Customer Portal endpoint -> Auto-heals user record & returns 200
    const loginReq = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: "customer" }),
    });

    const loginRes = await loginPost(loginReq);
    assert.strictEqual(loginRes.status, 200, "Auto-healing login should return 200");
    const loginData = await loginRes.json();
    assert.strictEqual(loginData.success, true);
    assert.strictEqual(loginData.user.email, email.toLowerCase());

    // Verify user record was auto-created in users collection
    const users = Object.values(mockStore.users);
    assert.strictEqual(users.length, 1, "User doc should be auto-created in users collection");
    assert.strictEqual(users[0].email, email.toLowerCase());
    assert.strictEqual(users[0].role, "customer");
    assert.strictEqual(users[0].source, "gtm_assessment");

    console.log("✅ Passed: testAutoHealingMissingUserRecord");
  } finally {
    restoreFirestore();
  }
}

async function testAutoHealingPersistsCustomerIdAndAvoidsDuplicates() {
  resetMockStore();
  setupMockFirestore();

  try {
    const email = "legacy.noid@customer.com";
    const password = "Password123!";
    const hashedPassword = await hashPassword(password);

    mockStore.customer_credentials["cred-missing-customerid"] = {
      id: "cred-missing-customerid",
      leadId: "lead-missing-customerid",
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    const loginReq1 = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: "customer" }),
    });

    const loginRes1 = await loginPost(loginReq1);
    assert.strictEqual(loginRes1.status, 200);

    assert.strictEqual(Object.keys(mockStore.users).length, 1);
    assert.ok(mockStore.users["cred-missing-customerid"]);
    assert.strictEqual(
      mockStore.customer_credentials["cred-missing-customerid"].customerId,
      "cred-missing-customerid"
    );

    const loginReq2 = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: "customer" }),
    });

    const loginRes2 = await loginPost(loginReq2);
    assert.strictEqual(loginRes2.status, 200);
    assert.strictEqual(Object.keys(mockStore.users).length, 1);

    console.log("✅ Passed: testAutoHealingPersistsCustomerIdAndAvoidsDuplicates");
  } finally {
    restoreFirestore();
  }
}

async function testIsVerifiedAutoFixIsPersisted() {
  resetMockStore();
  setupMockFirestore();

  try {
    const email = "customer.missing.verified@acme.com";
    const password = "Password123!";
    const hashedPassword = await hashPassword(password);

    mockStore.users["user-missing-isverified"] = {
      id: "user-missing-isverified",
      email: email.toLowerCase(),
      hashedPassword,
      name: "Missing Verified Flag",
      role: "customer",
    };

    const loginReq = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: "customer" }),
    });

    const loginRes = await loginPost(loginReq);
    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(mockStore.users["user-missing-isverified"].isVerified, true);

    console.log("✅ Passed: testIsVerifiedAutoFixIsPersisted");
  } finally {
    restoreFirestore();
  }
}

async function testMigrationScriptExecution() {
  resetMockStore();
  setupMockFirestore();

  try {
    const emailUnlinked = "unlinked.gtm@client.com";
    const hashedPassword = await hashPassword("Password123!");

    // 1. Add orphaned customer_credentials
    mockStore.customer_credentials["cred-orphaned"] = {
      id: "cred-orphaned",
      customerId: "customer-orphaned-1",
      email: emailUnlinked,
      passwordHash: hashedPassword,
      name: "Orphaned Client",
    };

    // 2. Add unlinked intake
    mockStore.gtm_intakes["GTM-ORPHANED-1"] = {
      id: "GTM-ORPHANED-1",
      companyName: "Orphaned Co",
      productName: "Product X",
      productOwnerEmail: emailUnlinked,
      customerId: null,
    };

    // Run migration script
    const summary = await migrateGTMCustomerAccounts();
    assert.strictEqual(summary.createdUsers, 1, "Should create 1 missing user doc");
    assert.strictEqual(summary.linkedIntakes, 1, "Should link 1 orphaned intake");

    // Verify user created
    const createdUser = mockStore.users["customer-orphaned-1"];
    assert.ok(createdUser, "Created user should exist in mock store");
    assert.strictEqual(createdUser.email, emailUnlinked);

    // Verify intake linked
    const updatedIntake = mockStore.gtm_intakes["GTM-ORPHANED-1"];
    assert.strictEqual(updatedIntake.customerId, "customer-orphaned-1");

    console.log("✅ Passed: testMigrationScriptExecution");
  } finally {
    restoreFirestore();
  }
}

export async function runGTMCustomerLoginTests() {
  console.log("==================================================");
  console.log("RUNNING GTM CUSTOMER LOGIN & RBAC AUTH TEST SUITE");
  console.log("==================================================");

  await testGTMAssessmentAccountCreationAndLogin();
  await testGTMCustomerBlockedFromNonCustomerPortals();
  await testNonCustomerBlockedFromCustomerPortal();
  await testAutoHealingMissingUserRecord();
  await testAutoHealingPersistsCustomerIdAndAvoidsDuplicates();
  await testIsVerifiedAutoFixIsPersisted();
  await testMigrationScriptExecution();

  console.log("==================================================");
  console.log("ALL GTM CUSTOMER LOGIN TESTS PASSED SUCCESSFULLY! ");
  console.log("==================================================");
}

// Allow direct execution from command line via npx tsx
if (require.main === module) {
  runGTMCustomerLoginTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Test failure:", err);
      process.exit(1);
    });
}
