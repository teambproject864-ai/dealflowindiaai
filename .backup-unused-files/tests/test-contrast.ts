import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function run() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  const urls = [
    "/",
    "/pricing",
    "/features",
    "/settings",
    "/support",
    "/profile"
  ];

  // Save screenshots to the artifact folder
  const artifactsDir = "C:\\Users\\Praneeth Burada\\.gemini\\antigravity-ide\\brain\\1c73e32c-281f-4547-802a-4ba946d841ac";

  for (const url of urls) {
    const fullUrl = `http://localhost:3001${url}`;
    console.log(`Navigating to ${fullUrl}...`);
    try {
      await page.goto(fullUrl, { timeout: 30000, waitUntil: "load" });
      await page.waitForTimeout(3000); // wait for dynamic components to mount

      // Check current theme (HTML class)
      const initialTheme = await page.evaluate(() => document.documentElement.className);
      console.log(`  Initial theme class for ${url}: "${initialTheme}"`);

      // Take initial screenshot
      const cleanUrl = url === "/" ? "home" : url.replace("/", "");
      const screenshot1 = path.join(artifactsDir, `${cleanUrl}_initial.png`);
      await page.screenshot({ path: screenshot1 });
      console.log(`  Saved initial screenshot: ${screenshot1}`);

      // Locate and click theme toggle button
      const toggleBtn = page.locator('button[aria-label*="Switch to"], button[aria-label*="theme"], button:has(svg.lucide-sun), button:has(svg.lucide-moon)').first();
      if (await toggleBtn.count() > 0) {
        console.log("  Clicking theme toggle button...");
        await toggleBtn.click();
        await page.waitForTimeout(2000);

        const toggledTheme = await page.evaluate(() => document.documentElement.className);
        console.log(`  Toggled theme class for ${url}: "${toggledTheme}"`);

        const screenshot2 = path.join(artifactsDir, `${cleanUrl}_toggled.png`);
        await page.screenshot({ path: screenshot2 });
        console.log(`  Saved toggled screenshot: ${screenshot2}`);

        // Toggle back to clean up state
        await toggleBtn.click();
        await page.waitForTimeout(1000);
      } else {
        console.log("  No theme toggle button found on this page.");
      }
    } catch (err: any) {
      console.error(`  Failed to process ${url}:`, err.message);
    }
  }

  await browser.close();
  console.log("Verification finished.");
}

run().catch(console.error);
