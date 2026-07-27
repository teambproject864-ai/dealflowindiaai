import { chromium, Browser, Page } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACTS_DIR = "C:\\Users\\prane\\.gemini\\antigravity-ide\\brain\\f54c317b-50a8-430e-8e74-e181e0e42cd8";
const BASE_URL = "http://localhost:3000";

if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

interface TestIssue {
  severity: "critical" | "major" | "minor";
  component: string;
  issue: string;
  reproduction: string;
  expected: string;
  remediation: string;
}

const auditIssues: TestIssue[] = [];

function logIssue(
  severity: "critical" | "major" | "minor",
  component: string,
  issue: string,
  reproduction: string,
  expected: string,
  remediation: string
) {
  auditIssues.push({ severity, component, issue, reproduction, expected, remediation });
  console.log(`[AUDIT ISSUE - ${severity.toUpperCase()}] ${component}: ${issue}`);
}

async function runAudit() {
  console.log("🚀 Starting Comprehensive E2E Testing Audit...");

  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Cross-device Viewports & Layout Audit
    await runDeviceAudit(browser);

    // 2. Core Intake Flow Journey
    await runIntakeFlowAudit(browser);

    // 3. Portal Logins Audit
    await runPortalLoginAudit(browser);

    // 4. Booking Flow Audit
    await runBookingFlowAudit(browser);

    // 5. Accessibility & Theme Persistence Audit
    await runA11yThemeAudit(browser);

  } catch (error) {
    console.error("Fatal error during audit execution:", error);
  } finally {
    await browser.close();
  }

  // Write issues log
  const reportPath = path.join(ARTIFACTS_DIR, "raw_audit_results.json");
  fs.writeFileSync(reportPath, JSON.stringify(auditIssues, null, 2));
  console.log(`\n🎉 Audit execution finished. Raw results stored in ${reportPath}`);
  console.log(`Total Issues found: ${auditIssues.length}`);
}

async function runDeviceAudit(browser: Browser) {
  console.log("\n--- Running Device Viewports and Responsive Layout Audit ---");
  const pages = ["/", "/pricing", "/features", "/support"];
  const viewports = [
    { name: "Desktop", width: 1280, height: 720 },
    { name: "Tablet", width: 768, height: 1024 },
    { name: "Mobile", width: 375, height: 667 }
  ];

  for (const view of viewports) {
    console.log(`Testing viewport: ${view.name} (${view.width}x${view.height})`);
    const context = await browser.newContext({
      viewport: { width: view.width, height: view.height }
    });
    const page = await context.newPage();

    for (const urlPath of pages) {
      const url = `${BASE_URL}${urlPath}`;
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
        await page.waitForTimeout(1000);

        // Take screenshot
        const screenshotName = `${view.name.toLowerCase()}_${urlPath.replace(/\//g, "") || "home"}.png`;
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, screenshotName) });

        // Check for basic JS errors
        const title = await page.title();
        if (!title || title.includes("500") || title.includes("Error")) {
          logIssue(
            "critical",
            `${urlPath} Layout`,
            "Failed page load or server error on page navigation",
            `Navigate to ${url} on ${view.name}`,
            "Page loads successfully with correct title",
            "Investigate server logs for route-specific Next.js crashes."
          );
        }

        // Quick layout checks (e.g. overflow, header layout)
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        if (hasHorizontalScroll && view.name === "Mobile") {
          logIssue(
            "minor",
            `${urlPath} Layout`,
            "Horizontal scrollbar present on mobile viewport",
            `Navigate to ${url} on Mobile (375x667)`,
            "No horizontal scrollbar, width should fit viewport",
            "Set body overflow-x to hidden and check sizing of elements."
          );
        }

      } catch (err: any) {
        logIssue(
          "critical",
          `${urlPath} Navigation`,
          `Timeout or network error navigating to page: ${err.message}`,
          `Navigate to ${url}`,
          "Page loads successfully under 15s",
          "Ensure application server is active and responsive."
        );
      }
    }
    await context.close();
  }
}

async function runIntakeFlowAudit(browser: Browser) {
  console.log("\n--- Running Lead Intake & GTM Analysis Journey Audit ---");
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

    // Scroll to the intake form
    await page.evaluate(() => {
      document.getElementById("how-it-works")?.scrollIntoView();
    });
    await page.waitForTimeout(1000);

    const formLocator = page.locator("form").first();

    // Check validation on step 1 (empty fields)
    const nextBtn = page.locator("button:has-text('Next'), button:has-text('Continue')").first();
    if (await nextBtn.count() > 0) {
      await nextBtn.click();
      await page.waitForTimeout(500);

      const validationErrorCount = await page.locator("p[role='alert'], p:has-text('required')").count();
      if (validationErrorCount === 0) {
        logIssue(
          "major",
          "IntakeForm Validation",
          "Omitted required fields did not trigger client-side validation errors",
          "Click 'Next' button on Step 1 with empty input fields",
          "Form displays error notifications for name, email, company, website",
          "Enforce HTML5 required fields and trigger alert text in state validation."
        );
      }
    } else {
      logIssue(
        "critical",
        "IntakeForm Flow",
        "Could not find step-by-step navigation button (Next/Continue)",
        "Look for form navigation button on Home page intake form",
        "A visible and accessible Next button exists",
        "Check DOM structure of IntakeForm component."
      );
      await context.close();
      return;
    }

    // Step 1: Fill details
    await page.fill("input#name", "Playwright E2E Tester");
    await page.fill("input#emailPersonal", "e2etester@dealflow.ai");
    await page.fill("input#companyName", "E2E Testing Corp");
    await page.fill("input#websiteUrl", "https://e2etestcorp.com");
    await nextBtn.click();
    await page.waitForTimeout(800);

    // Step 2: Proof of Results
    await page.fill("textarea#caseStudies", "Case 1: Scaled B2B SaaS from $10k to $100k MRR.\nCase 2: Reduced CAC by 35% using AI workflow automation.\nCase 3: Boosted sales pipeline win rate by 24% globally.");
    await page.fill("textarea#trustFactors", "We hold active certifications, client validation contracts, and solid customer references.");
    // Toggle certification
    await page.click("label[for='cert-SOC 2']");
    await nextBtn.click();
    await page.waitForTimeout(800);

    // Step 3: Brand Positioning
    await page.click("label[for='social-LinkedIn']");
    await page.fill("textarea#linkedInContent", "Regular strategy playbooks, executive thoughts, and pipeline metrics case studies.");

    // Select frequency (Select component)
    await page.click("button:has-text('Select...')");
    await page.waitForTimeout(200);
    await page.click("span:has-text('Weekly'), [role='option']:has-text('Weekly')");

    await page.fill("textarea#offerPromise", "We help mid-market SaaS companies double their demo show rate through automated voice channels.");
    await page.fill("textarea#painPoint", "Sales representatives wasting 60% of their day calling contacts who fail to attend meetings.");
    await nextBtn.click();
    await page.waitForTimeout(800);

    // Step 4: Offer & Sales Process
    await page.click("label[for='rr-Pilot Program']");

    // Time to start select
    const selectTriggers = page.locator("button[role='combobox']");
    await selectTriggers.nth(0).click();
    await page.waitForTimeout(200);
    await page.click("span:has-text('Within 1 Week'), [role='option']:has-text('Within 1 Week')");

    // Primary CTA select
    await selectTriggers.nth(1).click();
    await page.waitForTimeout(200);
    await page.click("span:has-text('Schedule a Demo'), [role='option']:has-text('Schedule a Demo')");

    await page.click("label[for='asset-Loom Video']");
    await page.fill("textarea#objectionsHandling", "Objection: Price is too high. Handle: We offer performance-based models and guarantee CAC alignment.");
    await page.fill("textarea#emailSequenceThemes", "1: Pain identification. 2: Video study. 3: Core offer. 4: Quiet hour compliance info. 5: Last check.");

    // Gift Card select
    await selectTriggers.nth(2).click();
    await page.waitForTimeout(200);
    await page.click("span:has-text('Yes'), [role='option']:has-text('Yes')");

    await nextBtn.click();
    await page.waitForTimeout(800);

    // Step 5: ICP
    await page.fill("textarea#icpDescription", "B2B SaaS and Tech services scaling outbound teams with $10M-$50M ARR.");
    await page.click("label[for='ind-SaaS']");
    await page.click("label[for='cs-Mid-Market (201–1000 Employees)']");
    await page.fill("textarea#targetGeographicRegionsText", "North America, United Kingdom");
    await page.click("label[for='dm-VP Sales']");
    await page.click("label[for='dm-Founder']");
    await page.click("label[for='bt-Technology Adoption']");
    await page.click("label[for='bt-Funding Rounds']");
    await nextBtn.click();
    await page.waitForTimeout(800);

    // Step 6: Tech stack
    await page.click("label[for='tool-HubSpot']");
    await page.click("label[for='tool-Salesforce']");
    await page.fill("textarea#additionalNotes", "Simulated automated test run.");

    // Submit!
    const submitBtn = page.locator("button:has-text('Submit'), button:has-text('Complete')").first();
    await submitBtn.click();
    await page.waitForTimeout(3000); // Wait for API processing

    // Post-Submission Step 1: Select Agent
    const automaticAgentBtn = page.locator("h3:has-text('Automatically Assign Agent')").first();
    if (await automaticAgentBtn.count() > 0) {
      await page.click("h3:has-text('Automatically Assign Agent')");
      const continueBtn = page.locator("button:has-text('Continue')").first();
      await continueBtn.click();
      await page.waitForTimeout(1500);

      // Post-Submission Step 2: Create Account
      await page.fill("input#creds-email", "e2etester@dealflow.ai");
      await page.fill("input#creds-password", "E2ETester123!");
      const completeBtn = page.locator("button:has-text('Complete & Continue')").first();
      await completeBtn.click();

      // Wait for GTM redirection / analysis
      await page.waitForURL(/analysis/, { timeout: 35000 });
      console.log("✓ Successfully submitted IntakeForm and arrived at GTM Analysis page.");
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, "gtm_analysis_report.png") });

      // Verify the page content
      const healthGauge = page.locator("text=/health/i, text=/score/i").first();
      if (await healthGauge.count() === 0) {
        logIssue(
          "major",
          "GTM Analysis Dashboard",
          "Generated report does not display the primary GTM health score index",
          "Submit intake and inspect `/analysis` report page",
          "Analysis report displays GTM Health Score prominently",
          "Ensure HealthGauge component mounts and reads Firestore scores correctly."
        );
      }
    } else {
      logIssue(
        "major",
        "IntakeForm Flow",
        "Select Agent post-submission panel did not display after form submit",
        "Complete step 6 and click Submit on IntakeForm",
        "Agent assignment selection wizard appears",
        "Check API return payload from `/api/leads/save` and state transitions."
      );
    }

  } catch (err: any) {
    logIssue(
      "critical",
      "Lead Intake Journey",
      `Exception occurred during Intake Form E2E simulation: ${err.message}`,
      "Execute automated intake form process",
      "Intake completes and redirects to GTM analysis dashboard",
      "Inspect database connections and Next.js page state changes."
    );
  } finally {
    await context.close();
  }
}

async function runPortalLoginAudit(browser: Browser) {
  console.log("\n--- Running Role-Based Portal Access Audit ---");
  const portals = [
    {
      role: "admin",
      url: "/portal/admin/login",
      email: "admin@dealflow.ai",
      pass: "AdminDF",
      redirect: "/portal/admin"
    },
    {
      role: "agent",
      url: "/portal/agent/login",
      email: "praneeth@dealflow.ai",
      pass: "Praneeth123!",
      redirect: "/portal/agent"
    },
    {
      role: "customer",
      url: "/portal/customer/login",
      email: "demo@customer.com",
      pass: "CustomerDemo123!",
      redirect: "/portal/customer"
    }
  ];

  for (const portal of portals) {
    console.log(`Testing portal login for: ${portal.role}`);
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(`${BASE_URL}${portal.url}`, { waitUntil: "networkidle" });

      // Fill login form
      await page.fill("input[type='email']", portal.email);
      await page.fill("input[type='password']", portal.pass);

      const submitBtn = page.locator("button[type='submit']").first();
      await submitBtn.click();

      // Wait for navigation
      await page.waitForURL(new RegExp(portal.redirect), { timeout: 15000 });
      await page.waitForTimeout(2000); // Let dashboard load

      // Save screenshot
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, `portal_${portal.role}_dashboard.png`) });
      console.log(`✓ Successful login to ${portal.role} portal.`);

    } catch (err: any) {
      logIssue(
        "critical",
        `Portal Login: ${portal.role}`,
        `Login authentication or redirection failed: ${err.message}`,
        `Navigate to ${portal.url}, enter ${portal.email}/${portal.pass}, submit`,
        `Successfully authenticate and redirect to ${portal.redirect}`,
        "Verify mock database seeding, authentication routes, and local environment secrets."
      );
    } finally {
      await context.close();
    }
  }
}

async function runBookingFlowAudit(browser: Browser) {
  console.log("\n--- Running Booking & Scheduling Flow Audit ---");
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/book-demo`, { waitUntil: "networkidle" });

    // Fill required details
    await page.fill("input#directName", "Booking Tester");
    await page.fill("input#directEmail", "booktest@dealflow.ai");

    // Select manual booking tool to test custom meeting link
    const selectTrigger = page.locator("button[role='combobox']").first();
    await selectTrigger.click();
    await page.waitForTimeout(200);
    await page.click("span:has-text('Other / Manual Link'), [role='option']:has-text('Other / Manual Link')");
    await page.waitForTimeout(500);

    // Enter custom meeting url
    await page.fill("input#customUrl", "https://meet.google.com/xyz-pdqr-abc");

    // Check session setting
    const skipCheckbox = page.locator("button#skipAiAgent");
    if (await skipCheckbox.count() > 0) {
      // Toggle to false (we want to test redirection to simulated agent call)
      const isChecked = await skipCheckbox.getAttribute("aria-checked") === "true";
      if (isChecked) {
        await skipCheckbox.click();
      }
    }

    const confirmBtn = page.locator("button:has-text('Confirm Custom Booking')").first();
    await confirmBtn.click();

    // Wait for submission step redirecting to live agent call simulator
    await page.waitForURL(/meeting-agent\/live|login/, { timeout: 20000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "booking_confirmed_redirect.png") });
    console.log("✓ Completed Custom Booking and redirected successfully.");

  } catch (err: any) {
    logIssue(
      "major",
      "Booking Flow",
      `Booking form submission or simulator redirection failed: ${err.message}`,
      "Submit booking with manual link and skipAiAgent set to false",
      "Redirection to simulated interactive call dashboard occurs",
      "Validate API endpoints at `/api/calls/create` and layout redirection rules."
    );
  } finally {
    await context.close();
  }
}

async function runA11yThemeAudit(browser: Browser) {
  console.log("\n--- Running Accessibility & Theme Persistence Audit ---");
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

    // 1. Theme Toggling Persistence Check
    const initialTheme = await page.evaluate(() => document.documentElement.className);

    const themeBtn = page.locator("button[aria-label*='Switch to'], button[aria-label*='theme'], button:has(svg.lucide-sun), button:has(svg.lucide-moon)").first();
    if (await themeBtn.count() > 0) {
      await themeBtn.click();
      await page.waitForTimeout(1000);

      const toggledTheme = await page.evaluate(() => document.documentElement.className);

      // Navigate to pricing page and see if theme persisted
      await page.goto(`${BASE_URL}/pricing`, { waitUntil: "networkidle" });
      const pricingTheme = await page.evaluate(() => document.documentElement.className);

      if (pricingTheme !== toggledTheme) {
        logIssue(
          "major",
          "Theme Toggler",
          "Theme choice does not persist across different page navigations",
          "Toggle theme on Home, then navigate to pricing page",
          "Toggled theme persists on the pricing page",
          "Store selected theme in localStorage and read it via root layout script before HTML mounts."
        );
      } else {
        console.log("✓ Theme toggler persists correctly across pages.");
      }

      // Toggle back to keep defaults
      await themeBtn.click();
    } else {
      logIssue(
        "minor",
        "Theme Toggler",
        "Could not locate theme toggle action button on homepage",
        "Load Home page and search for theme toggler button in header",
        "Theme toggler button exists in layout Header",
        "Embed ThemeToggle component into Header quick actions."
      );
    }

    // 2. Keyboard skip-to-content focus validation
    await page.focus("body");
    await page.keyboard.press("Tab");
    await page.waitForTimeout(500);

    const skipLinkActive = await page.evaluate(() => {
      const activeEl = document.activeElement;
      return activeEl && activeEl.textContent?.toLowerCase().includes("skip to");
    });

    if (!skipLinkActive) {
      logIssue(
        "minor",
        "Accessibility Skip Link",
        "Skip-to-content accessibility link does not receive initial focus on Tab keyboard action",
        "Focus page body and press Tab",
        "Skip-to-content link gains focus and becomes visible",
        "Ensure skip link is the first keyboard-tabbable node in the body."
      );
    } else {
      console.log("✓ Keyboard skip-to-content link focuses successfully.");
    }

  } catch (err: any) {
    logIssue(
      "major",
      "Accessibility & Themes",
      `Error during accessibility/theme checks: ${err.message}`,
      "Run accessibility Tab navigation and theme toggle clicks",
      "Checks complete successfully",
      "Debug browser events and selector strings in test script."
    );
  } finally {
    await context.close();
  }
}

runAudit().catch(console.error);
