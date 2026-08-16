import { test, expect } from './auth-test.fixture';

test.describe('Agent portal - authentication and cross-module navigation', () => {
  test.beforeEach(async ({ authenticatedAgent }) => {
    await authenticatedAgent.route('**/api/portal/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [], activeSessions: [], kpi: {} }),
      });
    });
    await authenticatedAgent.goto('/portal/agent', { waitUntil: 'domcontentloaded' });
    await authenticatedAgent.waitForSelector('button, nav, [data-testid]', { timeout: 60000 });
    await authenticatedAgent.waitForTimeout(1000);
  });

  test('should allow agent to open the agent portal', async ({ authenticatedAgent }) => {
    await expect(authenticatedAgent).toHaveURL(/\/portal\/agent/);
  });

  test('should expose core agent workflow tabs', async ({ authenticatedAgent }) => {
    const expected = ['Dashboard', 'Assigned Customers'];
    for (const tabName of expected) {
      await expect(
        authenticatedAgent.getByRole('button', { name: tabName }).first()
      ).toBeVisible({ timeout: 20000 });
    }
  });
});
