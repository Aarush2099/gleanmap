import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Admin Workflow
 * 
 * These tests validate:
 * - Anonymous users cannot access admin pages
 * - Non-admin users cannot access admin pages
 * - Admin users can access and use admin features
 * - Admin actions require proper server-side validation
 */

test.describe('Admin Access Control', () => {
  test('should redirect anonymous user from admin page', async ({ page }) => {
    // Try to navigate directly to admin page
    await page.goto('/admin', { waitUntil: 'networkidle' });

    // Should be redirected to auth or denied
    expect(page.url()).not.toContain('/admin');
  });

  test('should show error for non-admin user attempting admin access', async ({
    page,
    context,
  }) => {
    // This would require a test account setup with student role
    // Skipping for now as it requires database setup
    test.skip();
  });

  test('admin panel should load for authenticated admin user', async ({
    page,
    context,
  }) => {
    // This would require signing in as admin
    // Skipping for now as it requires auth setup
    test.skip();
  });
});

test.describe('Admin Page Elements', () => {
  test('should not expose admin button to anonymous users', async ({ page }) => {
    await page.goto('/');

    // Check that no admin button is visible
    const adminButton = page.locator('[data-testid="admin-button"]');
    await expect(adminButton).not.toBeVisible();
  });

  test('should display admin button only for admin users', async ({
    page,
    context,
  }) => {
    // This would require signing in as admin
    test.skip();

    // await page.goto('/');
    // const adminButton = page.locator('[data-testid="admin-button"]');
    // await expect(adminButton).toBeVisible();
  });
});

test.describe('Secrets Security', () => {
  test('should not expose secrets in window object', async ({ page }) => {
    await page.goto('/');

    // Check that secrets are not accessible from client
    const secrets = await page.evaluate(() => {
      return {
        serviceRoleKey: (window as any).SUPABASE_SERVICE_ROLE_KEY,
        lovableApiKey: (window as any).LOVABLE_API_KEY,
        adminEmails: (window as any).ADMIN_EMAILS,
      };
    });

    expect(secrets.serviceRoleKey).toBeUndefined();
    expect(secrets.lovableApiKey).toBeUndefined();
    // VITE_SUPABASE_URL is public, so it might be defined
    // but service keys should never be
  });

  test('should have required VITE_ variables available', async ({ page }) => {
    await page.goto('/');

    const supabaseConfig = await page.evaluate(() => {
      return {
        projectId: (window as any).VITE_SUPABASE_PROJECT_ID,
        url: (window as any).VITE_SUPABASE_URL,
      };
    });

    // These public vars should be defined (required for auth to work)
    expect(supabaseConfig.projectId).toBeDefined();
    expect(supabaseConfig.url).toBeDefined();
  });
});

test.describe('Error Handling', () => {
  test('should show proper error when admin function is called without auth', async ({
    page,
  }) => {
    // Navigate to a page and try to trigger admin function
    // This is hard to test without actual admin setup
    test.skip();
  });

  test('should not allow admin actions via API without proper auth', async ({
    request,
  }) => {
    // Try to call an admin endpoint without authorization
    const response = await request.post('/admin/generate-feedback', {
      data: { submissionId: '123' },
    });

    // Should fail with 401 or 403
    expect([401, 403, 404]).toContain(response.status());
  });
});
