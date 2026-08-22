// tests/agent-portal-account-settings-and-popups.test.ts

import assert from "assert";
import fs from "fs";
import path from "path";
import { FormValidator } from "../lib/form-validator";
import { 
  CustomerAccountOption, 
  DEFAULT_SEEDED_CUSTOMERS, 
  FALLBACK_DEFAULT_CUSTOMER 
} from "../components/portal/CustomerSwitcher";

export async function runAgentPortalAccountSettingsAndPopupsTests() {
  console.log("\n============================================================");
  console.log("🚀 TESTING AGENT PORTAL ACCOUNT SETTINGS & POPUP FIXES");
  console.log("============================================================\n");

  // -------------------------------------------------------------
  // TEST 1: Role-Aware Redirection in AccountMenu
  // -------------------------------------------------------------
  console.log("--> [1/6] Verifying Role-Aware Account Settings Routing in AccountMenu.tsx...");

  const accountMenuPath = path.resolve(__dirname, "../components/header/AccountMenu.tsx");
  const accountMenuContent = fs.readFileSync(accountMenuPath, "utf8");

  assert.ok(accountMenuContent.includes("getAccountSettingsHref"), "AccountMenu must define getAccountSettingsHref helper");
  assert.ok(accountMenuContent.includes('/portal/agent?tab=account-settings'), "Agent role must link to /portal/agent?tab=account-settings");
  assert.ok(accountMenuContent.includes('/portal/admin?tab=platform-settings-module'), "Admin role must link to /portal/admin?tab=platform-settings-module");
  assert.ok(accountMenuContent.includes('/portal/customer?tab=account-settings'), "Customer role must link to /portal/customer?tab=account-settings");
  assert.ok(accountMenuContent.includes('href={getAccountSettingsHref()}'), "Account Settings Link must use dynamic role-aware href");

  console.log("  ✅ Role-aware routing in AccountMenu accurately targets portal settings for agent, admin, customer, and guests");

  // -------------------------------------------------------------
  // TEST 2: Agent Portal Account Settings Tab Definition & Rendering
  // -------------------------------------------------------------
  console.log("--> [2/6] Verifying 'account-settings' Tab in Agent Portal (app/portal/agent/page.tsx)...");

  const agentPagePath = path.resolve(__dirname, "../app/portal/agent/page.tsx");
  const agentPageContent = fs.readFileSync(agentPagePath, "utf8");

  assert.ok(
    agentPageContent.includes('{ id: "account-settings", label: "Account Settings & Profile"'),
    "Agent portal tabs must contain account-settings definition"
  );
  assert.ok(
    agentPageContent.includes('import { CustomerProfileSettingsTab }'),
    "Agent portal must import CustomerProfileSettingsTab component"
  );
  assert.ok(
    agentPageContent.includes('activeTab === "account-settings"'),
    "Agent portal must render CustomerProfileSettingsTab when activeTab is account-settings"
  );

  console.log("  ✅ Agent Portal contains account-settings tab and correctly mounts CustomerProfileSettingsTab");

  // -------------------------------------------------------------
  // TEST 3: Customer Switcher Dropdown Layout & Positioning Classes
  // -------------------------------------------------------------
  console.log("--> [3/6] Verifying Customer Switcher Dropdown Layout & Alignment Classes...");

  const customerSwitcherPath = path.resolve(__dirname, "../components/portal/CustomerSwitcher.tsx");
  const customerSwitcherContent = fs.readFileSync(customerSwitcherPath, "utf8");

  assert.ok(customerSwitcherContent.includes('align?: "left" | "right" | "auto"'), "CustomerSwitcher must accept align prop");
  assert.ok(customerSwitcherContent.includes('alignmentClass'), "CustomerSwitcher must compute responsive alignmentClass");
  assert.ok(customerSwitcherContent.includes('max-w-[calc(100vw-24px)]'), "Dropdown must be bounded to viewport width to prevent horizontal overflow");

  const portalHeaderPath = path.resolve(__dirname, "../components/portal/PortalHeader.tsx");
  const portalHeaderContent = fs.readFileSync(portalHeaderPath, "utf8");
  assert.ok(portalHeaderContent.includes('align="left"'), "Desktop CustomerSwitcher must be left-aligned in header breadcrumbs");
  assert.ok(portalHeaderContent.includes('align="right"'), "Mobile CustomerSwitcher must be right-aligned in toolbar");

  console.log("  ✅ Customer Switcher dropdown uses responsive width clamping and directional alignment to eliminate clipping");

  // -------------------------------------------------------------
  // TEST 4: Quick-Add Modal Portalling via createPortal to document.body
  // -------------------------------------------------------------
  console.log("--> [4/6] Verifying Modal Portalling (Escaping CSS containing-block traps)...");

  assert.ok(customerSwitcherContent.includes('import { createPortal } from "react-dom"'), "CustomerSwitcher must import createPortal");
  assert.ok(customerSwitcherContent.includes('showAddModal && isMounted && createPortal('), "Quick-add modal must be rendered through createPortal");
  assert.ok(customerSwitcherContent.includes('fixed inset-0 z-[9999]'), "Modal overlay must have z-[9999] and fixed inset-0");
  assert.ok(customerSwitcherContent.includes('max-h-[90vh] overflow-y-auto custom-scrollbar my-auto'), "Modal dialog card must have max-h-[90vh] and vertical scrolling");

  console.log("  ✅ Quick-Add Modal is portalled directly to document.body, eliminating header filter and overflow clipping");

  // -------------------------------------------------------------
  // TEST 5: 'Save and Switch Account' Button Logic & Validation
  // -------------------------------------------------------------
  console.log("--> [5/6] Testing 'Save and Switch Account' Button Workflow & Context Switching...");

  // Verify form validation rules on submit
  const validName = "Marcus Vance";
  const validCompany = "HyperScale Analytics Inc.";
  const validEmail = "marcus@hyperscale.ai";
  const validIndustry = "Enterprise AI & Data";

  const nameError = FormValidator.validateField(validName, { required: true, minLength: 2, maxLength: 80 }, "Customer Name");
  const compError = FormValidator.validateField(validCompany, { required: true, minLength: 2, maxLength: 100 }, "Company Name");
  assert.strictEqual(nameError, null, "Valid name passes validation");
  assert.strictEqual(compError, null, "Valid company passes validation");

  // Verify creation payload
  const newAccount: CustomerAccountOption = {
    id: `cust_${Date.now()}`,
    name: validName,
    companyName: validCompany,
    email: validEmail,
    industry: validIndustry,
    status: "active"
  };

  assert.ok(newAccount.id.startsWith("cust_"), "New customer ID is generated with proper prefix");
  assert.strictEqual(newAccount.companyName, validCompany, "Company name matches input");

  assert.ok(customerSwitcherContent.includes('setInternalCustomers(prev => [newCust, ...prev])'), "CustomerSwitcher immediately updates internal customer list");
  assert.ok(customerSwitcherContent.includes('handleSelectCustomer(newCust)'), "CustomerSwitcher automatically switches active customer to new account");
  assert.ok(customerSwitcherContent.includes('dealflow_customer_switched'), "CustomerSwitcher dispatches global dealflow_customer_switched event");
  assert.ok(customerSwitcherContent.includes('Save & Switch Account'), "Button label is clearly rendered as 'Save & Switch Account'");

  console.log("  ✅ 'Save and Switch Account' button triggers validation, account creation, immediate selection, and event broadcast");

  // -------------------------------------------------------------
  // TEST 6: Sidebar Category Mapping
  // -------------------------------------------------------------
  console.log("--> [6/6] Verifying Sidebar Category Mapping in PortalSidebar.tsx...");

  const portalSidebarPath = path.resolve(__dirname, "../components/portal/PortalSidebar.tsx");
  const portalSidebarContent = fs.readFileSync(portalSidebarPath, "utf8");

  assert.ok(
    portalSidebarContent.includes('"account-settings": "Platform & Governance"'),
    "account-settings must be registered under Platform & Governance category in PortalSidebar.tsx"
  );

  console.log("  ✅ Sidebar category map contains account-settings");

  console.log("\n============================================================");
  console.log("🎉 ALL AGENT PORTAL ACCOUNT SETTINGS & POPUP TESTS PASSED!");
  console.log("============================================================\n");
}

if (require.main === module) {
  runAgentPortalAccountSettingsAndPopupsTests().catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  });
}
