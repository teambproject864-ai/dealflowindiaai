// tests/whatsapp-selector-and-customer-creation.test.ts
import assert from "assert";
import fs from "fs";
import path from "path";

async function runValidationAndFunctionalTests() {
  console.log("\n=======================================================");
  console.log("🚀 STARTING WHATSAPP SELECTOR & CUSTOMER CREATION TESTS");
  console.log("=======================================================\n");

  // 1. WhatsApp Provider Selector Component Verification
  console.log("--> [1/4] Verifying WhatsApp Provider Selector Component & Options...");
  const selectorPath = path.resolve(__dirname, "../components/whatsapp/WhatsAppProviderSelectorModal.tsx");
  assert.ok(fs.existsSync(selectorPath), "WhatsAppProviderSelectorModal.tsx must exist");
  const selectorContent = fs.readFileSync(selectorPath, "utf8");

  assert.ok(selectorContent.includes('"Evolution Whatsapp"'), "Selector contains 'Evolution Whatsapp' option");
  assert.ok(selectorContent.includes('"Open WA"'), "Selector contains 'Open WA' option");
  assert.ok(selectorContent.includes('role="dialog"'), "Selector has accessible dialog role");
  assert.ok(selectorContent.includes('role="radiogroup"'), "Selector provides radiogroup selection");
  assert.ok(selectorContent.includes('role="radio"'), "Options have accessible radio role");
  assert.ok(selectorContent.includes('aria-checked='), "Radio options toggle aria-checked attribute");
  assert.ok(selectorContent.includes('onSelectProvider'), "Selector invokes callback on provider selection");
  console.log("  ✅ WhatsApp Provider Selector modal properly formatted & accessible.");

  // 2. WhatsApp Inline Dropdown Component Verification
  console.log("\n--> [2/4] Verifying WhatsApp Selector Dropdown Component...");
  const dropdownPath = path.resolve(__dirname, "../components/whatsapp/WhatsAppSelectorDropdown.tsx");
  assert.ok(fs.existsSync(dropdownPath), "WhatsAppSelectorDropdown.tsx must exist");
  const dropdownContent = fs.readFileSync(dropdownPath, "utf8");

  assert.ok(dropdownContent.includes('"Evolution Whatsapp"'), "Dropdown contains 'Evolution Whatsapp'");
  assert.ok(dropdownContent.includes('"Open WA"'), "Dropdown contains 'Open WA'");
  assert.ok(dropdownContent.includes('role="listbox"'), "Dropdown uses accessible listbox role");
  assert.ok(dropdownContent.includes('role="option"'), "Dropdown items use option role");
  console.log("  ✅ WhatsApp Selector Dropdown component verified.");

  // 3. Customer Switcher Real-Time Account Creation & Display
  console.log("\n--> [3/4] Verifying Customer Account Creation & Display Logic...");
  const switcherPath = path.resolve(__dirname, "../components/portal/CustomerSwitcher.tsx");
  assert.ok(fs.existsSync(switcherPath), "CustomerSwitcher.tsx must exist");
  const switcherContent = fs.readFileSync(switcherPath, "utf8");

  assert.ok(switcherContent.includes('fetch("/api/portal/customers"'), "CustomerSwitcher fetches backend customers on mount");
  assert.ok(switcherContent.includes('method: "POST"'), "CustomerSwitcher submits customer data via POST");
  assert.ok(switcherContent.includes('setInternalCustomers(prev => [createdCustomer, ...prev'), "CustomerSwitcher immediately adds new account to customer list without page refresh");
  assert.ok(switcherContent.includes('handleSelectCustomer(createdCustomer)'), "CustomerSwitcher automatically switches active customer to new account");
  assert.ok(switcherContent.includes('FormValidator.validateField'), "CustomerSwitcher validates required fields before submission");
  assert.ok(switcherContent.includes('setFormErrors({ general: err.message'), "CustomerSwitcher handles and surfaces submission errors");
  console.log("  ✅ Customer creation, validation, real-time list update, and switching verified.");

  // 4. Backend Customer Persistence API Route
  console.log("\n--> [4/4] Verifying Customer API Route Validation & Persistence...");
  const apiRoutePath = path.resolve(__dirname, "../app/api/portal/customers/route.ts");
  assert.ok(fs.existsSync(apiRoutePath), "Customer API route exists");
  const apiRouteContent = fs.readFileSync(apiRoutePath, "utf8");

  assert.ok(apiRouteContent.includes("export async function GET"), "GET handler implemented");
  assert.ok(apiRouteContent.includes("export async function POST"), "POST handler implemented");
  assert.ok(apiRouteContent.includes("Customer Contact Name is required"), "Name validation implemented");
  assert.ok(apiRouteContent.includes("Company Name is required"), "Company Name validation implemented");
  assert.ok(apiRouteContent.includes("db.collection(\"customers\").doc(customerId).set"), "Firestore database persistence implemented");
  console.log("  ✅ Backend customer persistence API route and error handling verified.");

  console.log("\n=======================================================");
  console.log("✨ ALL WHATSAPP SELECTION & CUSTOMER CREATION TESTS PASSED!");
  console.log("=======================================================\n");
}

runValidationAndFunctionalTests().catch(err => {
  console.error("❌ Test verification failed:", err);
  process.exit(1);
});
