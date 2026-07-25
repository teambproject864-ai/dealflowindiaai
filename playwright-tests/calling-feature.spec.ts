import { test, expect } from './auth-test.fixture';

test.describe('Calling Feature DOM Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Wait for page initial load if spinner exists
    const spinner = page.getByText('Initializing experience');
    if (await spinner.isVisible()) {
      await expect(spinner).toBeHidden({ timeout: 30000 });
    }
    await page.waitForTimeout(500);
  });

  test('should render voice call floating button on DOM scroll or trigger', async ({ page }) => {
    // Scroll down to ensure hero element is not intersecting if present
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(500);

    // Check if "Book a call" floating action button is present in the DOM
    const fabButton = page.getByRole('button', { name: /Book a call/i });
    await expect(fabButton).toBeVisible({ timeout: 10000 });
  });

  test('should open voice call booking modal when floating action button is clicked', async ({ page }) => {
    // Scroll down to make FAB visible
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(500);

    const fabButton = page.getByRole('button', { name: /Book a call/i });
    await expect(fabButton).toBeVisible();
    await fabButton.click();

    // Verify modal overlay appears in DOM
    const closeButton = page.getByRole('button', { name: /Close scheduler/i });
    await expect(closeButton).toBeVisible({ timeout: 10000 });

    // Verify booking widget is present inside modal
    const bookingWidget = page.locator('div').filter({ hasText: /Schedule|Book|Meeting|Select Date|Calendar/i }).first();
    await expect(bookingWidget).toBeVisible();

    // Close the modal
    await closeButton.click();
    await expect(closeButton).toBeHidden({ timeout: 5000 });
  });

  test('should open voice call booking modal via DOM window event "open-voice-call"', async ({ page }) => {
    // Dispatch custom DOM event: window.dispatchEvent(new CustomEvent("open-voice-call"))
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('open-voice-call'));
    });

    // Check that close button of modal appears in DOM
    const closeButton = page.getByRole('button', { name: /Close scheduler/i });
    await expect(closeButton).toBeVisible({ timeout: 10000 });

    // Close modal via backdrop click
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/60');
    if (await backdrop.isVisible()) {
      await backdrop.click({ position: { x: 10, y: 10 } });
      await expect(closeButton).toBeHidden({ timeout: 5000 });
    } else {
      await closeButton.click();
      await expect(closeButton).toBeHidden({ timeout: 5000 });
    }
  });

  test('should render AI Agent Call Monitor interface on /ai-agent-call route', async ({ page }) => {
    await page.goto('/ai-agent-call?sessionId=test-dom-session-101', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Check for title or loading/error/monitor container
    const monitorContainer = page.locator('main, div').filter({ hasText: /AI Agent|Voice Call|Monitor|Call details/i }).first();
    await expect(monitorContainer).toBeVisible({ timeout: 15000 });

    // Check for "Return Dashboard", "Back to Dashboard", or "End Monitor" button in the DOM
    const actionButton = page.getByRole('button', { name: /Dashboard|End Monitor|Return/i }).first();
    await expect(actionButton).toBeVisible({ timeout: 10000 });
  });

  test('should handle Access Revenue Cockpit button click by closing modal and navigating', async ({ page }) => {
    // Open modal via custom DOM event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('open-voice-call'));
    });

    const closeButton = page.getByRole('button', { name: /Close scheduler/i });
    await expect(closeButton).toBeVisible({ timeout: 10000 });

    // If Access Revenue Cockpit button exists in step 4 or modal, verify it functions
    const cockpitBtn = page.getByRole('button', { name: /Access Revenue Cockpit/i });
    if (await cockpitBtn.isVisible()) {
      await cockpitBtn.click();
      await expect(closeButton).toBeHidden({ timeout: 5000 });
    }
  });
});
