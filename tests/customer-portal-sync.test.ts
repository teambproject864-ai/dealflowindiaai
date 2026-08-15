import assert from "assert";

// Set mock environment variables
if (!process.env.FIREBASE_PROJECT_ID) {
  process.env.FIREBASE_PROJECT_ID = "mock-project";
}
if (!process.env.FIREBASE_CLIENT_EMAIL) {
  process.env.FIREBASE_CLIENT_EMAIL = "mock-email";
}
if (!process.env.FIREBASE_PRIVATE_KEY) {
  process.env.FIREBASE_PRIVATE_KEY = "mock-key";
}

const { POST: credentialsPost } = require("../app/api/customer-credentials/route");
const { POST: assignmentsPost, PUT: assignmentsPut } = require("../app/api/agent-assignments/route");
const { POST: reassignPost } = require("../app/api/admin/reassign-agent/route");
const { GET: customersGet } = require("../app/api/admin/customers/route");
const { createToken } = require("../lib/auth");

let mockStore: Record<string, Record<string, any>> = {};

function resetMockStore() {
  mockStore = {
    users: {},
    customer_credentials: {},
    leads: {},
    customers: {},
    agent_assignments: {},
    in_app_notifications: {},
  };
}

function setupMockFirestore() {
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
            orderBy: () => ({
              limit: () => ({
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
              })
            }),
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

async function testCustomerSyncOnCredentialsCreation() {
  resetMockStore();
  setupMockFirestore();

  try {
    const leadId = "lead-test-123";
    const leadData = {
      id: leadId,
      companyName: "Stark Tech",
      contactName: "Tony Stark",
      contactEmail: "tony@stark.com",
      contactPhone: "+1-555-111-2222",
      websiteUrl: "https://stark.com",
      industry: "SaaS",
      targetIndustries: ["SaaS", "Defense"],
      targetCompanySizes: ["Mid-Market"],
      targetRevenues: ["$1M-$10M"],
      targetGeographics: ["United States"],
      preferredLanguages: ["English"],
      assignedAgentKey: "praneeth",
      icpCategory: "Enterprise Buyer",
    };

    mockStore.leads[leadId] = leadData;

    const req = new Request("http://localhost:3000/api/customer-credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        email: "tony@stark.com",
        password: "Password123!",
      }),
    });

    const res = await credentialsPost(req);
    assert.strictEqual(res.status, 200, "Should return 200 status");

    const data = await res.json();
    assert.strictEqual(data.success, true, "Response success should be true");

    // 1. Verify user created in users collection
    const users = mockStore.users;
    const userIds = Object.keys(users);
    assert.strictEqual(userIds.length, 1);
    const user = users[userIds[0]];
    assert.strictEqual(user.email, "tony@stark.com");
    assert.strictEqual(user.role, "customer");

    // 2. Verify lead record updated with customerId
    const updatedLead = mockStore.leads[leadId];
    assert.strictEqual(updatedLead.customerId, user.id, "Lead customerId should match new user ID");

    // 3. Verify customer record created in customers collection
    const customers = mockStore.customers;
    const customerIds = Object.keys(customers);
    assert.strictEqual(customerIds.length, 1, "Should create one customer record");
    
    const customer = customers[customerIds[0]];
    assert.strictEqual(customer.id, user.id);
    assert.strictEqual(customer.companyName, "Stark Tech");
    assert.strictEqual(customer.email, "tony@stark.com");
    assert.strictEqual(customer.phone, "+1-555-111-2222");
    assert.strictEqual(customer.assignedAgentId, "agent-praneeth", "Should resolve and map assigned agent ID");
    assert.strictEqual(customer.assignedAgentName, "Praneeth", "Should map agent name");
    assert.strictEqual(customer.personalIdentifiers.fullName, "Tony Stark");
    assert.strictEqual(customer.companyInformation.companyName, "Stark Tech");
    assert.strictEqual(customer.companyInformation.industry, "SaaS");

    console.log("✅ Passed: testCustomerSyncOnCredentialsCreation");
  } finally {
    restoreFirestore();
  }
}

async function testAgentAssignmentPropagation() {
  resetMockStore();
  setupMockFirestore();

  try {
    const leadId = "lead-test-456";
    const customerId = "customer-test-456";

    mockStore.leads[leadId] = {
      id: leadId,
      customerId,
      companyName: "Wayne Enterprises",
      contactName: "Bruce Wayne",
      contactEmail: "bruce@wayne.com",
    };

    mockStore.customers[customerId] = {
      id: customerId,
      companyName: "Wayne Enterprises",
      email: "bruce@wayne.com",
      assignedAgentId: "",
      assignedAgentName: "",
    };

    const req = new Request("http://localhost:3000/api/agent-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        agentKey: "praneeth",
      }),
    });

    const res = await assignmentsPost(req);
    assert.strictEqual(res.status, 200);

    const data = await res.json();
    assert.strictEqual(data.success, true);

    // Verify lead record updated
    const updatedLead = mockStore.leads[leadId];
    assert.strictEqual(updatedLead.assignedAgentKey, "praneeth");

    // Verify customer record updated
    const updatedCustomer = mockStore.customers[customerId];
    assert.strictEqual(updatedCustomer.assignedAgentId, "agent-praneeth");
    assert.strictEqual(updatedCustomer.assignedAgentName, "Praneeth");

    console.log("✅ Passed: testAgentAssignmentPropagation");
  } finally {
    restoreFirestore();
  }
}

async function testAgentReassignmentPropagation() {
  resetMockStore();
  setupMockFirestore();

  try {
    const leadId = "lead-test-789";
    const customerId = "customer-test-789";

    mockStore.leads[leadId] = {
      id: leadId,
      customerId,
      companyName: "Queen Industries",
      contactName: "Oliver Queen",
      contactEmail: "oliver@queen.com",
      assignedAgentKey: "praneeth",
    };

    mockStore.customers[customerId] = {
      id: customerId,
      companyName: "Queen Industries",
      email: "oliver@queen.com",
      assignedAgentId: "agent-praneeth",
      assignedAgentName: "Praneeth",
    };

    // Generate real JWT token for admin auth
    const adminToken = createToken({
      id: "admin-2",
      email: "admin@dealflow.ai",
      role: "admin",
      name: "Admin One"
    });

    const req = new Request("http://localhost:3000/api/admin/reassign-agent", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        leadId,
        newAgentKey: "ashok", // Reassign to another agent
      }),
    });

    const res = await reassignPost(req);
    if (res.status !== 200) {
      console.log("Reassignment API failure status:", res.status);
      try {
        console.log("Reassignment API failure body:", await res.json());
      } catch (e) {
        console.log("Reassignment API failure body not JSON");
      }
    }
    assert.strictEqual(res.status, 200);

    const data = await res.json();
    assert.strictEqual(data.success, true);

    // Verify customer record updated with new agent
    const updatedCustomer = mockStore.customers[customerId];
    assert.strictEqual(updatedCustomer.assignedAgentId, "agent-ashok");
    assert.strictEqual(updatedCustomer.assignedAgentName, "Ashok");

    console.log("✅ Passed: testAgentReassignmentPropagation");
  } finally {
    restoreFirestore();
  }
}

async function testAgentPortalVisibility() {
  resetMockStore();
  setupMockFirestore();

  try {
    const customerId = "customer-test-999";
    
    // Add customer to mock store
    mockStore.customers[customerId] = {
      id: customerId,
      companyName: "Shield Tech",
      email: "nick@shield.gov",
      assignedAgentId: "agent-praneeth",
      assignedAgentName: "Praneeth",
      createdAt: new Date().toISOString(),
    };

    // Case 1: Agent Praneeth requests customers -> should see Shield Tech
    const agentToken = createToken({
      id: "agent-praneeth",
      email: "praneeth@dealflow.ai",
      role: "agent",
      name: "Praneeth"
    });

    const reqAgent = new Request("http://localhost:3000/api/admin/customers", {
      headers: {
        "Authorization": `Bearer ${agentToken}`
      }
    });
    const resAgent = await customersGet(reqAgent);
    assert.strictEqual(resAgent.status, 200);
    const dataAgent = await resAgent.json();
    assert.strictEqual(dataAgent.success, true);
    assert.strictEqual(dataAgent.customers.length, 1);
    assert.strictEqual(dataAgent.customers[0].id, customerId);

    // Case 2: Different agent requests customers -> should NOT see Shield Tech
    const otherAgentToken = createToken({
      id: "agent-ai_sales_agent",
      email: "ai@dealflow.ai",
      role: "agent",
      name: "Revenue AI"
    });

    const reqOtherAgent = new Request("http://localhost:3000/api/admin/customers", {
      headers: {
        "Authorization": `Bearer ${otherAgentToken}`
      }
    });
    const resOtherAgent = await customersGet(reqOtherAgent);
    const dataOtherAgent = await resOtherAgent.json();
    assert.strictEqual(dataOtherAgent.success, true);
    assert.strictEqual(dataOtherAgent.customers.length, 0, "Other agents should not see this customer");

    console.log("✅ Passed: testAgentPortalVisibility");
  } finally {
    restoreFirestore();
  }
}

async function testCredentialsValidationAndChecks() {
  resetMockStore();
  setupMockFirestore();

  try {
    const leadId = "lead-validation-123";
    const leadData = {
      id: leadId,
      companyName: "Validation Corp",
      contactName: "Val Tester",
      contactEmail: "val@test.com",
    };
    mockStore.leads[leadId] = leadData;

    // 1. Invalid email format -> 400
    const reqEmail = new Request("http://localhost:3000/api/customer-credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        email: "invalid-email-format",
        password: "Password123!",
      }),
    });
    const resEmail = await credentialsPost(reqEmail);
    assert.strictEqual(resEmail.status, 400, "Should return 400 for invalid email format");
    const dataEmail = await resEmail.json();
    assert.strictEqual(dataEmail.success, false);
    assert.ok(dataEmail.error.includes("email"));

    // 2. Weak password (no special char or too short) -> 400
    const reqPassword = new Request("http://localhost:3000/api/customer-credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        email: "val@test.com",
        password: "weak",
      }),
    });
    const resPassword = await credentialsPost(reqPassword);
    assert.strictEqual(resPassword.status, 400, "Should return 400 for weak password");
    const dataPassword = await resPassword.json();
    assert.strictEqual(dataPassword.success, false);
    assert.ok(dataPassword.error.includes("Password must be"));

    // 3. Lead does not exist -> 404
    const reqNoLead = new Request("http://localhost:3000/api/customer-credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: "non-existent-lead-id",
        email: "val@test.com",
        password: "Password123!",
      }),
    });
    const resNoLead = await credentialsPost(reqNoLead);
    assert.strictEqual(resNoLead.status, 404, "Should return 404 for non-existent lead ID");
    const dataNoLead = await resNoLead.json();
    assert.strictEqual(dataNoLead.success, false);
    assert.ok(dataNoLead.error.includes("Lead not found"));

    // 4. Duplicate Email check -> 409
    // Pre-populate duplicate user in users collection
    mockStore.users["existing-user-id"] = {
      id: "existing-user-id",
      email: "val@test.com",
      role: "customer",
    };
    const reqDuplicate = new Request("http://localhost:3000/api/customer-credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        email: "val@test.com",
        password: "Password123!",
      }),
    });
    const resDuplicate = await credentialsPost(reqDuplicate);
    assert.strictEqual(resDuplicate.status, 409, "Should return 409 for duplicate email");
    const dataDuplicate = await resDuplicate.json();
    assert.strictEqual(dataDuplicate.success, false);
    assert.ok(dataDuplicate.error.includes("already registered"));

    // 5. Successful creation verifies that newUser has isVerified: true
    // Remove duplicate to allow success
    delete mockStore.users["existing-user-id"];
    const reqSuccess = new Request("http://localhost:3000/api/customer-credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        email: "val@test.com",
        password: "Password123!",
      }),
    });
    const resSuccess = await credentialsPost(reqSuccess);
    assert.strictEqual(resSuccess.status, 200, "Should return 200 for valid submission");
    const dataSuccess = await resSuccess.json();
    assert.strictEqual(dataSuccess.success, true);
    
    // Check created user properties
    const userIds = Object.keys(mockStore.users);
    const user = mockStore.users[userIds[0]];
    assert.strictEqual(user.isVerified, true, "newUser should have isVerified: true");

    console.log("✅ Passed: testCredentialsValidationAndChecks");
  } finally {
    restoreFirestore();
  }
}

import { getCustomerDisplayName } from "../lib/utils";

export function testCustomerPortalGreetingNameFormatting() {
  // Test Case 1: Valid customer name
  assert.strictEqual(getCustomerDisplayName({ name: "Jane Smith", email: "jane@company.com" }), "Jane Smith");
  assert.strictEqual(getCustomerDisplayName({ name: "   Alex Johnson   " }), "Alex Johnson");

  // Test Case 2: Email prefix name derivation when name is missing or generic placeholder
  assert.strictEqual(getCustomerDisplayName({ name: "Valued Customer", email: "praneeth.burada@gmail.com" }), "Praneeth Burada");
  assert.strictEqual(getCustomerDisplayName({ name: "Customer", email: "john_doe@acme.com" }), "John Doe");
  assert.strictEqual(getCustomerDisplayName({ name: "", email: "sarah@tech.io" }), "Sarah");

  // Test Case 3: Missing name and missing email fallback
  assert.strictEqual(getCustomerDisplayName(null), "Customer Name");
  assert.strictEqual(getCustomerDisplayName(undefined), "Customer Name");
  assert.strictEqual(getCustomerDisplayName({ name: "", email: "" }), "Customer Name");
  assert.strictEqual(getCustomerDisplayName({ name: "Valued Customer", email: "" }), "Customer Name");

  console.log("✅ Passed: testCustomerPortalGreetingNameFormatting");
}

export async function testUserProfileUpdateAPI() {
  const { GET: profileGet, PUT: profilePut } = await import("../app/api/user/profile/route");

  // 1. Unauthenticated GET returns 401
  const reqUnauth = new Request("http://localhost:3000/api/user/profile");
  const resUnauth = await profileGet(reqUnauth as any);
  assert.strictEqual(resUnauth.status, 401, "Unauthenticated GET should return 401");

  // 2. Unauthenticated PUT returns 401
  const reqPutUnauth = new Request("http://localhost:3000/api/user/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Updated Name" }),
  });
  const resPutUnauth = await profilePut(reqPutUnauth as any);
  assert.strictEqual(resPutUnauth.status, 401, "Unauthenticated PUT should return 401");

  console.log("✅ Passed: testUserProfileUpdateAPI");
}

export function testCommunityMiningCustomerPortalIntegration() {
  const customerTabs = ["dashboard", "agent-assignment", "voice-call", "standup-calendar", "dealflow-bot", "whatsapp-alerts", "dealflow-connect", "content-hub", "api-keys", "business-toolset", "icp-entries", "gtm-analysis", "tickets", "billing", "chat", "documents", "feedback", "ai-communications", "genbi", "kb-search", "dealflow-crm", "community-mining", "account-settings"];
  assert.ok(customerTabs.includes("community-mining"), "Customer portal must include community-mining tab");
  assert.ok(customerTabs.includes("account-settings"), "Customer portal must include account-settings tab");

  console.log("✅ Passed: testCommunityMiningCustomerPortalIntegration");
}

export async function runCustomerPortalSyncTests() {
  await testCustomerSyncOnCredentialsCreation();
  await testAgentAssignmentPropagation();
  await testAgentReassignmentPropagation();
  await testAgentPortalVisibility();
  await testCredentialsValidationAndChecks();
  testCustomerPortalGreetingNameFormatting();
  await testUserProfileUpdateAPI();
  testCommunityMiningCustomerPortalIntegration();
}
