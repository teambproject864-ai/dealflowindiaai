// tests/customer-persistence-reassignment.test.ts
import assert from "assert";
import fs from "fs";
import path from "path";
import { 
  CustomerStorageService, 
  validateCustomerData, 
  initializeCustomerStorage 
} from "../lib/customer-storage";
import { CustomerAccountOption } from "../lib/customer-accounts";

const DATA_DIR = path.resolve(process.cwd(), "data");
const CUSTOMERS_FILE_PATH = path.resolve(DATA_DIR, "customers.json");

async function runCustomerPersistenceAndReassignmentTests() {
  console.log("\n=======================================================");
  console.log("🚀 STARTING CUSTOMER PERSISTENCE & REASSIGNMENT E2E TESTS");
  console.log("=======================================================\n");

  // Setup / Clean test state
  if (fs.existsSync(CUSTOMERS_FILE_PATH)) {
    fs.writeFileSync(CUSTOMERS_FILE_PATH, JSON.stringify([], null, 2), "utf8");
  }
  CustomerStorageService._resetMemoryStore();

  // Test 1: Data Validation
  console.log("--> [1/6] Testing Customer Data Validation (Strict Rules)...");
  
  const validCheck = validateCustomerData({
    name: "John Doe",
    companyName: "Acme Corp",
    email: "john@acme.com",
    assignedAgentKey: "praneeth",
  });
  assert.strictEqual(validCheck.isValid, true, "Valid customer data should pass validation");

  const invalidNameCheck = validateCustomerData({
    name: "J",
    companyName: "Acme Corp",
  });
  assert.strictEqual(invalidNameCheck.isValid, false, "Name < 2 chars should fail validation");

  const invalidCompanyCheck = validateCustomerData({
    name: "John Doe",
    companyName: "",
  });
  assert.strictEqual(invalidCompanyCheck.isValid, false, "Empty company name should fail validation");

  const invalidEmailCheck = validateCustomerData({
    name: "John Doe",
    companyName: "Acme Corp",
    email: "not-an-email",
  });
  assert.strictEqual(invalidEmailCheck.isValid, false, "Malformed email should fail validation");

  const invalidAgentCheck = validateCustomerData({
    name: "John Doe",
    companyName: "Acme Corp",
    assignedAgentKey: "invalid_agent_xyz",
  });
  assert.strictEqual(invalidAgentCheck.isValid, false, "Unknown agent key should fail validation");

  console.log("  ✅ Data validation rules correctly enforce formatting constraints.");

  // Test 2: Customer Creation & Persistent File Storage
  console.log("\n--> [2/6] Testing Customer Creation & Storage Persistence...");
  
  const customer1 = await CustomerStorageService.createCustomer({
    name: "Alice Johnson",
    companyName: "HealthBridge Solutions",
    email: "alice@healthbridge.io",
    industry: "Healthcare Software",
    assignedAgentKey: "ashok",
  });

  assert.ok(customer1.id, "Created customer must have an ID");
  assert.strictEqual(customer1.companyName, "HealthBridge Solutions");
  assert.strictEqual(customer1.assignedAgentKey, "ashok");
  assert.strictEqual(customer1.assignedAgentName, "Ashok");

  // Verify file write on disk
  assert.ok(fs.existsSync(CUSTOMERS_FILE_PATH), "customers.json must exist on disk");
  const fileRaw = fs.readFileSync(CUSTOMERS_FILE_PATH, "utf8");
  const fileData = JSON.parse(fileRaw);
  assert.strictEqual(fileData.length, 1, "File must contain 1 stored customer");
  assert.strictEqual(fileData[0].id, customer1.id);
  assert.strictEqual(fileData[0].companyName, "HealthBridge Solutions");
  console.log("  ✅ Customer successfully created and persisted to durable storage.");

  // Test 3: Simulation of App Closure / Server Restart / Logout
  console.log("\n--> [3/6] Simulating App Closure, Logout & Server Restart...");
  
  // Wipe in-memory store to simulate complete process shutdown and restart
  CustomerStorageService._resetMemoryStore();

  // Re-read customers
  const reloadedCustomers = await CustomerStorageService.getAllCustomers();
  assert.strictEqual(reloadedCustomers.length, 1, "Reloaded customer list must retain saved customer after restart");
  assert.strictEqual(reloadedCustomers[0].id, customer1.id);
  assert.strictEqual(reloadedCustomers[0].companyName, "HealthBridge Solutions");
  assert.strictEqual(reloadedCustomers[0].name, "Alice Johnson");
  assert.strictEqual(reloadedCustomers[0].assignedAgentKey, "ashok");
  console.log("  ✅ Customer data perfectly preserved across app restart and memory reset.");

  // Test 4: Agent Reassignment & Long-term Persistence
  console.log("\n--> [4/6] Testing Customer Reassignment to Another Agent...");
  
  const reassigned = await CustomerStorageService.reassignCustomer(customer1.id, "praneeth");
  assert.strictEqual(reassigned.assignedAgentKey, "praneeth");
  assert.strictEqual(reassigned.assignedAgentName, "Praneeth");
  assert.strictEqual(reassigned.assignedAgentId, "agent-praneeth");

  // Verify updated in file
  const fileAfterReassign = JSON.parse(fs.readFileSync(CUSTOMERS_FILE_PATH, "utf8"));
  assert.strictEqual(fileAfterReassign[0].assignedAgentKey, "praneeth");
  assert.strictEqual(fileAfterReassign[0].assignedAgentName, "Praneeth");

  // Simulate restart again after reassignment
  CustomerStorageService._resetMemoryStore();
  const reloadedAfterReassign = await CustomerStorageService.getAllCustomers();
  assert.strictEqual(reloadedAfterReassign[0].assignedAgentKey, "praneeth");
  assert.strictEqual(reloadedAfterReassign[0].assignedAgentName, "Praneeth");
  console.log("  ✅ Agent reassignment successfully persisted across restart.");

  // Test 5: Customer Deletion & Long-term Persistence
  console.log("\n--> [5/6] Testing Customer Deletion & Long-term Removal...");
  
  // Add a second customer first
  const customer2 = await CustomerStorageService.createCustomer({
    name: "Bob Williams",
    companyName: "FinScale Dynamics",
    email: "bob@finscale.com",
    industry: "Financial Technology",
    assignedAgentKey: "kiran",
  });

  const listWithTwo = await CustomerStorageService.getAllCustomers();
  assert.strictEqual(listWithTwo.length, 2, "Should have 2 customers before deletion");

  // Delete customer1
  const deleteResult = await CustomerStorageService.deleteCustomer(customer1.id);
  assert.strictEqual(deleteResult, true, "Delete should return true on success");

  // Verify in-memory and on-disk
  const listAfterDelete = await CustomerStorageService.getAllCustomers();
  assert.strictEqual(listAfterDelete.length, 1, "Should have 1 customer after deletion");
  assert.strictEqual(listAfterDelete[0].id, customer2.id);

  // Simulate restart after deletion
  CustomerStorageService._resetMemoryStore();
  const reloadedAfterDelete = await CustomerStorageService.getAllCustomers();
  assert.strictEqual(reloadedAfterDelete.length, 1, "Reloaded list must not contain deleted customer");
  assert.strictEqual(reloadedAfterDelete[0].id, customer2.id);
  assert.strictEqual(reloadedAfterDelete[0].companyName, "FinScale Dynamics");
  console.log("  ✅ Customer deletion permanently saved across app restarts.");

  // Test 6: Component & API Route File Verification
  console.log("\n--> [6/6] Verifying Component & API Integration Integrity...");
  
  const switcherPath = path.resolve(__dirname, "../components/portal/CustomerSwitcher.tsx");
  const switcherCode = fs.readFileSync(switcherPath, "utf8");
  assert.ok(switcherCode.includes("dealflow_customer_accounts_cache"), "CustomerSwitcher uses persistent local cache");
  assert.ok(switcherCode.includes("handleDeleteSubmit"), "CustomerSwitcher implements deletion handler");
  assert.ok(switcherCode.includes("handleReassignSubmit"), "CustomerSwitcher implements agent reassignment handler");
  assert.ok(switcherCode.includes("UserCheck"), "CustomerSwitcher provides agent reassignment UI");
  assert.ok(switcherCode.includes("Trash2"), "CustomerSwitcher provides deletion UI");
  assert.ok(switcherCode.includes("storageError"), "CustomerSwitcher surfaces storage error state");

  const apiRoutePath = path.resolve(__dirname, "../app/api/portal/customers/route.ts");
  const apiRouteCode = fs.readFileSync(apiRoutePath, "utf8");
  assert.ok(apiRouteCode.includes("CustomerStorageService.getAllCustomers"), "API route uses persistent storage for GET");
  assert.ok(apiRouteCode.includes("CustomerStorageService.createCustomer"), "API route uses persistent storage for POST");
  assert.ok(apiRouteCode.includes("CustomerStorageService.updateCustomer"), "API route uses persistent storage for PATCH");
  assert.ok(apiRouteCode.includes("CustomerStorageService.deleteCustomer"), "API route uses persistent storage for DELETE");

  console.log("  ✅ Component and API routes integrate persistent storage, deletion, and reassignment.");

  console.log("\n=======================================================");
  console.log("✨ ALL CUSTOMER PERSISTENCE & REASSIGNMENT TESTS PASSED!");
  console.log("=======================================================\n");
}

runCustomerPersistenceAndReassignmentTests().catch((err) => {
  console.error("❌ Test verification failed:", err);
  process.exit(1);
});
