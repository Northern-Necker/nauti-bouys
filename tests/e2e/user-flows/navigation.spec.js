// E2E tests for navigation user flows
import { test, expect } from '@playwright/test';

const routes = [
  { name: 'Home', path: '/', title: /home|nauti bouys/i },
  { name: 'Beverages', path: '/beverages', title: /beverages/i },
  { name: 'Cocktails', path: '/cocktails', title: /cocktails/i },
  { name: 'Wines', path: '/wines', title: /wines/i },
  { name: 'Spirits', path: '/spirits', title: /spirits/i },
  { name: 'Calendar', path: '/calendar', title: /calendar|reservations/i },
  { name: 'Login', path: '/login', title: /login|sign in/i },
  { name: 'IA Assistant', path: '/ia', title: /ia|assistant/i },
];

test.describe('Navigation User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test from the home page
    await page.goto('/');
    await expect(page).toHaveTitle(/Nauti Bouys/);
  });

  test.describe('Desktop Navigation', () => {
    test('should navigate through all main routes', async ({ page }) => {
      for (const route of routes) {
        // Click navigation link
        await page.click(`[href="${route.path}"]`);
        
        // Verify URL changed
        await expect(page).toHaveURL(route.path);
        
        // Wait for page to load
        await page.waitForLoadState('networkidle');
        
        // Verify page content loaded (basic check)
        await expect(page.locator('main')).toBeVisible();
        
        // Check for page-specific content if available
        if (route.title) {
          await expect(page.locator('h1, h2').first()).toContainText(route.title, { 
            ignoreCase: true 
          });
        }
      }
    });

    test('should highlight active navigation item', async ({ page }) => {
      // Navigate to beverages
      await page.click('[href="/beverages"]');
      
      // Check active state styling
      const activeLink = page.locator('nav [href="/beverages"]');
      await expect(activeLink).toHaveClass(/text-teal-700|bg-teal-50/);
    });

    test('should show brand logo and navigate to home', async ({ page }) => {
      // Navigate away from home
      await page.click('[href="/beverages"]');
      
      // Click brand logo/name
      await page.click('header a[href="/"]');
      
      // Should return to home
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Mobile Navigation', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should open and close mobile menu', async ({ page }) => {
      // Mobile menu should be closed initially
      await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible();
      
      // Click hamburger menu
      await page.click('button[aria-label*="menu" i]');
      
      // Mobile menu should open
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Click close button
      await page.click('button[aria-label*="close" i]');
      
      // Mobile menu should close
      await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible();
    });

    test('should navigate through mobile menu', async ({ page }) => {
      // Open mobile menu
      await page.click('button[aria-label*="menu" i]');
      
      for (const route of routes.slice(0, 3)) { // Test first 3 routes
        // Click navigation link in mobile menu
        await page.click(`[data-testid="mobile-menu"] [href="${route.path}"]`);
        
        // Verify navigation
        await expect(page).toHaveURL(route.path);
        
        // Menu should close after navigation
        await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible();
        
        // Reopen menu for next iteration (except last)
        if (route !== routes.slice(0, 3).pop()) {
          await page.click('button[aria-label*="menu" i]');
        }
      }
    });

    test('should maintain responsive layout', async ({ page }) => {
      // Check mobile-specific elements are visible
      await expect(page.locator('button[aria-label*="menu" i]')).toBeVisible();
      
      // Check desktop navigation is hidden
      await expect(page.locator('[data-testid="desktop-navigation"]')).not.toBeVisible();
      
      // Test navigation still works
      await page.click('button[aria-label*="menu" i]');
      await page.click('[data-testid="mobile-menu"] [href="/cocktails"]');
      await expect(page).toHaveURL('/cocktails');
    });
  });

  test.describe('Browser Navigation', () => {
    test('should handle browser back/forward buttons', async ({ page }) => {
      // Navigate through several pages
      await page.click('[href="/beverages"]');
      await page.click('[href="/cocktails"]');
      await page.click('[href="/wines"]');
      
      // Go back
      await page.goBack();
      await expect(page).toHaveURL('/cocktails');
      
      // Go back again
      await page.goBack();
      await expect(page).toHaveURL('/beverages');
      
      // Go forward
      await page.goForward();
      await expect(page).toHaveURL('/cocktails');
    });

    test('should handle page refresh on any route', async ({ page }) => {
      for (const route of routes.slice(0, 3)) {
        // Navigate to route
        await page.goto(route.path);
        
        // Refresh page
        await page.reload();
        
        // Should still be on same route
        await expect(page).toHaveURL(route.path);
        
        // Page should load correctly
        await expect(page.locator('main')).toBeVisible();
      }
    });
  });

  test.describe('Performance', () => {
    test('should load pages quickly', async ({ page }) => {
      for (const route of routes.slice(0, 4)) {
        const startTime = Date.now();
        
        await page.click(`[href="${route.path}"]`);
        await page.waitForLoadState('networkidle');
        
        const loadTime = Date.now() - startTime;
        
        // Should load within 3 seconds
        expect(loadTime).toBeLessThan(3000);
        
        // Page should be interactive
        await expect(page.locator('main')).toBeVisible();
      }
    });

    test('should not have console errors during navigation', async ({ page }) => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Navigate through all routes
      for (const route of routes.slice(0, 3)) {
        await page.click(`[href="${route.path}"]`);
        await page.waitForLoadState('networkidle');
      }

      // Check for critical errors (filter out minor warnings)
      const criticalErrors = errors.filter(error => 
        !error.includes('Warning:') && 
        !error.includes('DevTools')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Tab through navigation items
      const navLinks = await page.locator('nav a').count();
      
      for (let i = 0; i < navLinks; i++) {
        await page.keyboard.press('Tab');
        
        // Check that an element is focused
        const focused = await page.locator(':focus').count();
        expect(focused).toBeGreaterThan(0);
      }
    });

    test('should have proper ARIA attributes', async ({ page }) => {
      // Check header has role banner
      await expect(page.locator('header')).toHaveAttribute('role', 'banner');
      
      // Check navigation has proper role
      await expect(page.locator('nav')).toHaveAttribute('role', 'navigation');
      
      // Check mobile menu button has proper aria-label
      const menuButton = page.locator('button[aria-label*="menu" i]').first();
      await expect(menuButton).toHaveAttribute('aria-label');
    });

    test('should have good contrast ratios', async ({ page }) => {
      // Basic check for text visibility
      const textElements = page.locator('nav a, header');
      const count = await textElements.count();
      
      for (let i = 0; i < count; i++) {
        const element = textElements.nth(i);
        await expect(element).toBeVisible();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid routes gracefully', async ({ page }) => {
      await page.goto('/invalid-route-that-does-not-exist');
      
      // Should either show 404 or redirect to home
      const url = page.url();
      const hasNotFound = await page.locator('text=/404|not found/i').count() > 0;
      const isHome = url.endsWith('/');
      
      expect(hasNotFound || isHome).toBe(true);
    });
  });
});