/**
 * Mobile Navigation Testing Suite
 * Phase 3: Comprehensive Mobile UI Testing
 * HIVE MIND ui-tester agent
 */

const { test, expect, devices } = require('@playwright/test');

// Mobile device configurations
const mobileDevices = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'Galaxy S8', width: 360, height: 740 },
  { name: 'iPad Mini', width: 768, height: 1024 }
];

test.describe('Mobile Navigation Testing Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  // 1. MOBILE MENU FUNCTIONALITY TESTING
  test.describe('Hamburger Menu Functionality', () => {
    
    test('should open mobile menu when hamburger button clicked', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Find hamburger button (should be visible on mobile)
      const hamburgerBtn = page.locator('[data-testid="hamburger-menu"], button:has-text("☰"), .hamburger-menu, [aria-label="Open menu"]');
      await expect(hamburgerBtn).toBeVisible();
      
      // Click hamburger button
      await hamburgerBtn.click();
      
      // Verify mobile menu overlay appears
      const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu-overlay, .mobile-navigation');
      await expect(mobileMenu).toBeVisible();
      
      console.log('✅ Hamburger menu opens mobile overlay');
    });

    test('should close mobile menu when close button clicked', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Open mobile menu first
      const hamburgerBtn = page.locator('[data-testid="hamburger-menu"], button:has-text("☰"), .hamburger-menu');
      await hamburgerBtn.click();
      
      // Find and click close button
      const closeBtn = page.locator('[data-testid="close-menu"], button:has-text("✗"), .close-menu, [aria-label="Close menu"]');
      await expect(closeBtn).toBeVisible();
      await closeBtn.click();
      
      // Verify mobile menu is hidden
      const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu-overlay, .mobile-navigation');
      await expect(mobileMenu).not.toBeVisible();
      
      console.log('✅ Close button hides mobile menu');
    });

    test('should close mobile menu when clicking outside', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Open mobile menu
      const hamburgerBtn = page.locator('[data-testid="hamburger-menu"], button:has-text("☰"), .hamburger-menu');
      await hamburgerBtn.click();
      
      // Click outside menu area (on backdrop/overlay)
      await page.click('.mobile-menu-backdrop, .overlay-backdrop', { force: true });
      
      // Verify menu closes
      const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu-overlay');
      await expect(mobileMenu).not.toBeVisible();
      
      console.log('✅ Outside click closes mobile menu');
    });

    test('should close mobile menu when escape key pressed', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Open mobile menu
      const hamburgerBtn = page.locator('[data-testid="hamburger-menu"], button:has-text("☰")');
      await hamburgerBtn.click();
      
      // Press escape key
      await page.keyboard.press('Escape');
      
      // Verify menu closes
      const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu-overlay');
      await expect(mobileMenu).not.toBeVisible();
      
      console.log('✅ Escape key closes mobile menu');
    });
  });

  // 2. MOBILE MENU NAVIGATION TESTING
  test.describe('Mobile Menu Navigation Links', () => {
    
    const navigationItems = [
      { name: 'Home', path: '/', selector: 'a[href="/"]' },
      { name: 'Beverages', path: '/beverages', selector: 'a[href="/beverages"]' },
      { name: 'Cocktails', path: '/cocktails', selector: 'a[href="/cocktails"]' },
      { name: 'Wines', path: '/wines', selector: 'a[href="/wines"]' },
      { name: 'Spirits', path: '/spirits', selector: 'a[href="/spirits"]' },
      { name: 'Calendar', path: '/calendar', selector: 'a[href="/calendar"]' },
      { name: 'IA Assistant', path: '/ia', selector: 'a[href="/ia"]' }
    ];

    for (const item of navigationItems) {
      test(`should navigate to ${item.name} and close mobile menu`, async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Open mobile menu
        const hamburgerBtn = page.locator('[data-testid="hamburger-menu"], button:has-text("☰")');
        await hamburgerBtn.click();
        
        // Click navigation item in mobile menu
        const navLink = page.locator(`.mobile-menu ${item.selector}, .mobile-navigation ${item.selector}`);
        await expect(navLink).toBeVisible();
        await navLink.click();
        
        // Verify navigation occurred
        await expect(page).toHaveURL(new RegExp(item.path));
        
        // Verify mobile menu closed after navigation
        const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu-overlay');
        await expect(mobileMenu).not.toBeVisible();
        
        console.log(`✅ ${item.name} navigation works and closes menu`);
      });
    }
  });

  // 3. MOBILE AUTHENTICATION TESTING
  test.describe('Mobile Authentication Links', () => {
    
    test('should navigate to login page and close mobile menu', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Open mobile menu
      const hamburgerBtn = page.locator('[data-testid="hamburger-menu"], button:has-text("☰")');
      await hamburgerBtn.click();
      
      // Click Login link in mobile menu
      const loginLink = page.locator('.mobile-menu a[href="/login"], .mobile-navigation a[href="/login"]');
      await expect(loginLink).toBeVisible();
      await loginLink.click();
      
      // Verify navigation to login
      await expect(page).toHaveURL(/\/login/);
      
      // Verify mobile menu closed
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      await expect(mobileMenu).not.toBeVisible();
      
      console.log('✅ Login link works in mobile menu');
    });

    test('should navigate to register page and close mobile menu', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Open mobile menu
      const hamburgerBtn = page.locator('[data-testid="hamburger-menu"], button:has-text("☰")');
      await hamburgerBtn.click();
      
      // Click Sign Up button in mobile menu
      const signUpBtn = page.locator('.mobile-menu a[href="/register"], .mobile-navigation button:has-text("Sign Up")');
      await expect(signUpBtn).toBeVisible();
      await signUpBtn.click();
      
      // Verify navigation to register
      await expect(page).toHaveURL(/\/register/);
      
      // Verify mobile menu closed
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      await expect(mobileMenu).not.toBeVisible();
      
      console.log('✅ Sign Up button works in mobile menu');
    });
  });

  // 4. RESPONSIVE BREAKPOINT TESTING
  test.describe('Responsive Breakpoint Testing', () => {
    
    const breakpoints = [
      { name: 'Small Mobile', width: 320, height: 568 },
      { name: 'iPhone', width: 375, height: 667 },
      { name: 'Large Mobile', width: 414, height: 896 },
      { name: 'Tablet', width: 768, height: 1024 }
    ];

    for (const bp of breakpoints) {
      test(`should show correct navigation at ${bp.name} (${bp.width}px)`, async ({ page }) => {
        await page.setViewportSize({ width: bp.width, height: bp.height });
        
        if (bp.width < 768) {
          // Mobile: hamburger should be visible, desktop nav hidden
          const hamburgerBtn = page.locator('[data-testid="hamburger-menu"], .hamburger-menu');
          await expect(hamburgerBtn).toBeVisible();
          
          const desktopNav = page.locator('.desktop-navigation, nav.hidden.md\\:block');
          await expect(desktopNav).not.toBeVisible();
          
          console.log(`✅ ${bp.name}: Mobile navigation displayed`);
        } else {
          // Tablet: desktop nav should be visible, hamburger hidden
          const desktopNav = page.locator('.desktop-navigation, nav:not(.mobile-menu)');
          await expect(desktopNav).toBeVisible();
          
          const hamburgerBtn = page.locator('[data-testid="hamburger-menu"], .hamburger-menu');
          await expect(hamburgerBtn).not.toBeVisible();
          
          console.log(`✅ ${bp.name}: Desktop navigation displayed`);
        }
      });
    }
  });

  // 5. TOUCH INTERACTION TESTING
  test.describe('Touch Interaction Requirements', () => {
    
    test('should meet 44px minimum touch target size', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Open mobile menu
      const hamburgerBtn = page.locator('[data-testid="hamburger-menu"], .hamburger-menu');
      await hamburgerBtn.click();
      
      // Check touch target sizes for all mobile menu items
      const touchTargets = page.locator('.mobile-menu a, .mobile-menu button, .mobile-navigation a, .mobile-navigation button');
      const count = await touchTargets.count();
      
      for (let i = 0; i < count; i++) {
        const target = touchTargets.nth(i);
        const bbox = await target.boundingBox();
        
        if (bbox) {
          expect(bbox.height).toBeGreaterThanOrEqual(44);
          expect(bbox.width).toBeGreaterThanOrEqual(44);
        }
      }
      
      console.log('✅ Touch targets meet 44px minimum requirement');
    });

    test('should respond to touch interactions quickly', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Measure response time for hamburger menu
      const startTime = Date.now();
      const hamburgerBtn = page.locator('[data-testid="hamburger-menu"], .hamburger-menu');
      await hamburgerBtn.click();
      
      const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu-overlay');
      await expect(mobileMenu).toBeVisible();
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(300); // Should respond within 300ms
      
      console.log(`✅ Touch response time: ${responseTime}ms`);
    });
  });

  // 6. MOBILE PERFORMANCE TESTING
  test.describe('Mobile Performance Testing', () => {
    
    test('should maintain smooth animations on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Monitor for animation performance
      await page.addInitScript(() => {
        window.animationFrameTimings = [];
        const originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = function(callback) {
          const startTime = performance.now();
          return originalRAF.call(window, function(timestamp) {
            const endTime = performance.now();
            window.animationFrameTimings.push(endTime - startTime);
            callback(timestamp);
          });
        };
      });
      
      // Trigger mobile menu animation
      const hamburgerBtn = page.locator('[data-testid="hamburger-menu"], .hamburger-menu');
      await hamburgerBtn.click();
      
      // Wait for animation to complete
      await page.waitForTimeout(1000);
      
      // Check animation frame timing
      const frameTimes = await page.evaluate(() => window.animationFrameTimings);
      const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      
      expect(averageFrameTime).toBeLessThan(16.67); // 60fps = 16.67ms per frame
      
      console.log(`✅ Animation performance: ${averageFrameTime.toFixed(2)}ms avg frame time`);
    });

    test('should not have mobile-specific console errors', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      // Interact with mobile navigation
      const hamburgerBtn = page.locator('[data-testid="hamburger-menu"], .hamburger-menu');
      await hamburgerBtn.click();
      
      await page.waitForTimeout(1000);
      
      expect(errors).toHaveLength(0);
      console.log('✅ No mobile-specific console errors detected');
    });
  });

  // 7. ORIENTATION TESTING
  test.describe('Orientation Testing', () => {
    
    test('should work in portrait orientation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // Portrait
      
      const hamburgerBtn = page.locator('[data-testid="hamburger-menu"], .hamburger-menu');
      await expect(hamburgerBtn).toBeVisible();
      await hamburgerBtn.click();
      
      const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu-overlay');
      await expect(mobileMenu).toBeVisible();
      
      console.log('✅ Portrait orientation works correctly');
    });

    test('should work in landscape orientation', async ({ page }) => {
      await page.setViewportSize({ width: 667, height: 375 }); // Landscape
      
      const hamburgerBtn = page.locator('[data-testid="hamburger-menu"], .hamburger-menu');
      await expect(hamburgerBtn).toBeVisible();
      await hamburgerBtn.click();
      
      const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu-overlay');
      await expect(mobileMenu).toBeVisible();
      
      console.log('✅ Landscape orientation works correctly');
    });
  });
});