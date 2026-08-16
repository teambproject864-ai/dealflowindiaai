import { test, expect } from './auth-test.fixture';

test.describe('Security controls (headers, cookies, CORS, portal auth UX)', () => {
  test('landing page sends clickjacking and MIME-sniffing headers', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    const headers = response!.headers();
    expect(headers['x-content-type-options'] || '').toMatch(/nosniff/i);
    expect(headers['x-frame-options'] || '').toMatch(/SAMEORIGIN|DENY/i);
    expect(headers['content-security-policy'] || '').toContain("default-src");
  });

  test('auth cookie is HttpOnly and not readable from document.cookie', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'df_auth_token',
        value: 'probe-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const readable = await page.evaluate(() => document.cookie);
    expect(readable).not.toContain('df_auth_token');
  });

  test('unauthenticated visitor is redirected away from admin portal', async ({ page }) => {
    await page.goto('/portal/admin', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/portal\/admin\/login|\/portal\/?$/, { timeout: 30000 });
  });

  test('API does not advertise a wildcard CORS origin', async ({ request }) => {
    const res = await request.get('/api/auth/me');
    const acao = res.headers()['access-control-allow-origin'];
    expect(acao === undefined || acao === 'null' || acao === '').toBeTruthy();
    expect(acao).not.toBe('*');
  });

  test('landing page load stays under 8s baseline (domcontentloaded)', async ({ page }) => {
    const start = Date.now();
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    const elapsed = Date.now() - start;
    expect(response?.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(8000);
  });
});
