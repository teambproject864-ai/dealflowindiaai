// tests/header-navigation-integrity.test.ts

import assert from "assert";
import fs from "fs";
import path from "path";

export async function runHeaderNavigationIntegrityTests() {
  console.log("\n============================================================");
  console.log("🌐 TESTING HEADER NAVIGATION INTEGRITY (SUPPORT REMOVAL)");
  console.log("============================================================\n");

  const headerPath = path.resolve(__dirname, "../components/Header.tsx");
  const headerContent = fs.readFileSync(headerPath, "utf8");

  // -------------------------------------------------------------
  // TEST 1: Verify Complete Removal of "Support" from Header
  // -------------------------------------------------------------
  console.log("--> [1/4] Verifying complete removal of Support from Header.tsx...");

  // Must not have Support in navLinks array
  const supportLinkRegex = /{\s*name:\s*["']Support["'],\s*href:\s*["']\/support["']\s*}/;
  assert.ok(!supportLinkRegex.test(headerContent), "Header navLinks must not contain Support entry");
  
  // Verify that the string 'href: "/support"' is not in Header.tsx
  assert.ok(!headerContent.includes('href: "/support"'), "Header.tsx must not contain href: '/support'");

  console.log("  ✅ 'Support' link is completely removed from Header navigation");

  // -------------------------------------------------------------
  // TEST 2: Verify Integrity of Remaining Primary Navigation Links
  // -------------------------------------------------------------
  console.log("--> [2/4] Verifying presence and correctness of all remaining navigation items...");

  const expectedNavItems = [
    { name: "Solutions", href: "/solutions" },
    { name: "Workforce Architecture", href: "/features" },
    { name: "GTM Analysis", href: "/solutions/gtm" },
    { name: "Pricing", href: "/pricing" },
    { name: "Portals", href: "/portal" },
  ];

  for (const item of expectedNavItems) {
    assert.ok(
      headerContent.includes(`name: "${item.name}"`),
      `Header must retain primary navigation link: ${item.name}`
    );
    assert.ok(
      headerContent.includes(`href: "${item.href}"`),
      `Header must retain target route: ${item.href}`
    );
  }

  console.log("  ✅ All 5 primary navigation links (Solutions, Workforce Architecture, GTM Analysis, Pricing, Portals) are intact");

  // -------------------------------------------------------------
  // TEST 3: Verify Submenu Options (Solutions & Portals)
  // -------------------------------------------------------------
  console.log("--> [3/4] Verifying sub-options for Solutions and Portals dropdowns...");

  const expectedSubOptions = [
    "Autonomous Sales Workforce",
    "AI Call Rep & Negotiation",
    "Requirement Execution Engine",
    "Customer Portal",
    "Agent Command Center",
    "Admin Governance Portal",
  ];

  for (const subOption of expectedSubOptions) {
    assert.ok(
      headerContent.includes(`name: "${subOption}"`),
      `Header dropdowns must retain sub-option: ${subOption}`
    );
  }

  console.log("  ✅ All dropdown sub-options for Solutions and Portals are preserved");

  // -------------------------------------------------------------
  // TEST 4: Verify Responsive Components & Action CTAs
  // -------------------------------------------------------------
  console.log("--> [4/4] Verifying interactive controls, mobile drawer, and CTA buttons...");

  assert.ok(headerContent.includes("<MobileCommandDrawer"), "Header must render MobileCommandDrawer");
  assert.ok(headerContent.includes("<AccountMenu />"), "Header must render AccountMenu");
  assert.ok(headerContent.includes("<NotificationCenter />"), "Header must render NotificationCenter");
  assert.ok(headerContent.includes("<ThemeToggle />"), "Header must render ThemeToggle");
  assert.ok(headerContent.includes("Book Strategy Demo"), "Header must retain Book Strategy Demo button");
  assert.ok(headerContent.includes("Deploy AI Workforce"), "Header must retain Deploy AI Workforce CTA");

  console.log("  ✅ All responsive components, mobile drawer, and action buttons remain intact");

  console.log("\n============================================================");
  console.log("🎉 ALL HEADER INTEGRITY TESTS PASSED SUCCESSFULLY!");
  console.log("============================================================\n");
}

if (require.main === module) {
  runHeaderNavigationIntegrityTests().catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  });
}
