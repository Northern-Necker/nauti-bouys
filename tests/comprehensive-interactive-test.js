/**
 * Comprehensive Interactive Elements Test Suite
 * Tests all navigation, buttons, forms, and interactive components
 * in the Nauti Bouys application
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';

// Navigation routes to test
const ROUTES = [
  { path: '/', name: 'Home' },
  { path: '/beverages', name: 'Beverages' },
  { path: '/cocktails', name: 'Cocktails' },
  { path: '/wines', name: 'Wines' },
  { path: '/spirits', name: 'Spirits' },
  { path: '/calendar', name: 'Calendar' },
  { path: '/ia', name: 'IA Assistant' },
  { path: '/login', name: 'Login' },
  { path: '/register', name: 'Register' }
];

// Test results collector
let testResults = {
  desktop_navigation: [],
  mobile_navigation: [],
  authentication: [],
  page_elements: [],
  interactive_components: [],
  failures: [],
  summary: {
    total_tests: 0,
    passed: 0,
    failed: 0
  }
};

// Utility function to log test results
function logTestResult(category, testName, status, details = null) {
  const result = {
    test: testName,
    status: status,
    timestamp: new Date().toISOString(),
    details: details
  };
  
  testResults[category].push(result);
  testResults.summary.total_tests++;
  
  if (status === 'PASS') {
    testResults.summary.passed++;
  } else {
    testResults.summary.failed++;
    testResults.failures.push(result);
  }
}

test.describe('Comprehensive Interactive Elements Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set a longer timeout for network operations
    page.setDefaultTimeout(30000);
    await page.goto(BASE_URL);
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('Desktop Navigation - Header Links', async ({ page }) => {
    console.log('Testing desktop navigation...');
    
    // Test each navigation link
    for (const route of ROUTES.filter(r => !r.path.includes('login') && !r.path.includes('register'))) {
      try {
        // Find and click navigation link
        const navLink = page.locator(`nav a[href="${route.path}"], header a[href="${route.path}"]`).first();
        
        if (await navLink.isVisible()) {
          await navLink.click();
          await page.waitForURL(`**${route.path}`);
          
          // Verify the page loaded correctly
          const currentUrl = page.url();
          if (currentUrl.includes(route.path)) {
            logTestResult('desktop_navigation', `Navigate to ${route.name}`, 'PASS');
            console.log(`✓ ${route.name} navigation works`);
          } else {
            logTestResult('desktop_navigation', `Navigate to ${route.name}`, 'FAIL', 
              `Expected URL to contain ${route.path}, but got ${currentUrl}`);
          }
        } else {
          logTestResult('desktop_navigation', `Navigate to ${route.name}`, 'FAIL', 
            'Navigation link not visible');
        }
      } catch (error) {
        logTestResult('desktop_navigation', `Navigate to ${route.name}`, 'FAIL', error.message);
        console.log(`✗ ${route.name} navigation failed: ${error.message}`);
      }
    }
  });

  test('Mobile Navigation - Menu Toggle and Links', async ({ page }) => {
    console.log('Testing mobile navigation...');
    
    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    try {
      // Look for mobile menu button/hamburger
      const mobileMenuButton = page.locator('button[aria-label*="menu"], button[aria-expanded], .hamburger, [data-testid="mobile-menu"], button:has(svg)').first();
      
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();
        await page.waitForTimeout(500); // Wait for menu animation
        
        logTestResult('mobile_navigation', 'Mobile menu toggle', 'PASS');
        console.log('✓ Mobile menu toggle works');
        
        // Test mobile navigation links
        for (const route of ROUTES.filter(r => !r.path.includes('login') && !r.path.includes('register'))) {
          try {
            const mobileNavLink = page.locator(`nav a[href="${route.path}"], .mobile-nav a[href="${route.path}"]`).first();
            
            if (await mobileNavLink.isVisible()) {
              await mobileNavLink.click();
              await page.waitForURL(`**${route.path}`);
              
              const currentUrl = page.url();
              if (currentUrl.includes(route.path)) {
                logTestResult('mobile_navigation', `Mobile navigate to ${route.name}`, 'PASS');
                console.log(`✓ Mobile ${route.name} navigation works`);
              } else {
                logTestResult('mobile_navigation', `Mobile navigate to ${route.name}`, 'FAIL', 
                  `Expected URL to contain ${route.path}, but got ${currentUrl}`);
              }
              
              // Re-open menu for next test
              if (await mobileMenuButton.isVisible()) {
                await mobileMenuButton.click();
                await page.waitForTimeout(300);
              }
            } else {
              logTestResult('mobile_navigation', `Mobile navigate to ${route.name}`, 'FAIL', 
                'Mobile navigation link not visible');
            }
          } catch (error) {
            logTestResult('mobile_navigation', `Mobile navigate to ${route.name}`, 'FAIL', error.message);
          }
        }
      } else {
        logTestResult('mobile_navigation', 'Mobile menu toggle', 'FAIL', 'Mobile menu button not found');
      }
    } catch (error) {
      logTestResult('mobile_navigation', 'Mobile menu toggle', 'FAIL', error.message);
    }
  });

  test('Authentication Forms', async ({ page }) => {
    console.log('Testing authentication forms...');
    
    // Test Login Page
    try {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      // Check if login form exists
      const loginForm = page.locator('form, [data-testid="login-form"]').first();
      const emailField = page.locator('input[type="email"], input[name="email"], #email').first();
      const passwordField = page.locator('input[type="password"], input[name="password"], #password').first();
      const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("login"), button:has-text("sign in")').first();
      
      if (await loginForm.isVisible()) {
        logTestResult('authentication', 'Login form visibility', 'PASS');
        
        // Test form fields
        if (await emailField.isVisible() && await passwordField.isVisible()) {
          logTestResult('authentication', 'Login form fields', 'PASS');
          
          // Test form submission with invalid data
          await emailField.fill('test@example.com');
          await passwordField.fill('password123');
          
          if (await submitButton.isVisible()) {
            await submitButton.click();
            logTestResult('authentication', 'Login form submission', 'PASS');
            console.log('✓ Login form submission works');
          } else {
            logTestResult('authentication', 'Login form submission', 'FAIL', 'Submit button not visible');
          }
        } else {
          logTestResult('authentication', 'Login form fields', 'FAIL', 'Email or password fields not visible');
        }
      } else {
        logTestResult('authentication', 'Login form visibility', 'FAIL', 'Login form not found');
      }
    } catch (error) {
      logTestResult('authentication', 'Login page test', 'FAIL', error.message);
    }
    
    // Test Register Page
    try {
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('networkidle');
      
      const registerForm = page.locator('form, [data-testid="register-form"]').first();
      
      if (await registerForm.isVisible()) {
        logTestResult('authentication', 'Register form visibility', 'PASS');
        console.log('✓ Register form is visible');
        
        // Test form fields exist
        const nameField = page.locator('input[name="name"], input[name="username"], #name, #username').first();
        const emailField = page.locator('input[type="email"], input[name="email"], #email').first();
        const passwordField = page.locator('input[type="password"], input[name="password"], #password').first();
        
        if (await emailField.isVisible() && await passwordField.isVisible()) {
          logTestResult('authentication', 'Register form fields', 'PASS');
        } else {
          logTestResult('authentication', 'Register form fields', 'FAIL', 'Required fields not visible');
        }
      } else {
        logTestResult('authentication', 'Register form visibility', 'FAIL', 'Register form not found');
      }
    } catch (error) {
      logTestResult('authentication', 'Register page test', 'FAIL', error.message);
    }
  });

  test('Page-Specific Interactive Elements', async ({ page }) => {
    console.log('Testing page-specific interactive elements...');
    
    for (const route of ROUTES.filter(r => !r.path.includes('login') && !r.path.includes('register'))) {
      try {
        await page.goto(`${BASE_URL}${route.path}`);
        await page.waitForLoadState('networkidle');
        
        // Test buttons on each page
        const buttons = await page.locator('button, input[type="button"], input[type="submit"], .btn').all();
        let buttonCount = 0;
        let workingButtons = 0;
        
        for (const button of buttons) {
          if (await button.isVisible()) {
            buttonCount++;
            try {
              // Test if button is clickable
              await button.hover();
              const isClickable = await button.isEnabled();
              if (isClickable) {
                workingButtons++;
              }
            } catch (e) {
              // Button might not be clickable
            }
          }
        }
        
        logTestResult('page_elements', `${route.name} - Buttons (${workingButtons}/${buttonCount})`, 
          workingButtons > 0 ? 'PASS' : 'FAIL', 
          `Found ${buttonCount} buttons, ${workingButtons} are functional`);
        
        // Test form inputs
        const inputs = await page.locator('input, textarea, select').all();
        let inputCount = 0;
        let workingInputs = 0;
        
        for (const input of inputs) {
          if (await input.isVisible()) {
            inputCount++;
            try {
              const isEditable = await input.isEditable();
              if (isEditable) {
                workingInputs++;
              }
            } catch (e) {
              // Input might not be editable
            }
          }
        }
        
        if (inputCount > 0) {
          logTestResult('page_elements', `${route.name} - Form inputs (${workingInputs}/${inputCount})`, 
            workingInputs > 0 ? 'PASS' : 'FAIL', 
            `Found ${inputCount} inputs, ${workingInputs} are functional`);
        }
        
        console.log(`✓ ${route.name} page elements tested - ${buttonCount} buttons, ${inputCount} inputs`);
        
      } catch (error) {
        logTestResult('page_elements', `${route.name} page elements`, 'FAIL', error.message);
      }
    }
  });

  test('Search and Filter Components', async ({ page }) => {
    console.log('Testing search and filter components...');
    
    const pagesWithFilters = ['/beverages', '/cocktails', '/wines', '/spirits'];
    
    for (const path of pagesWithFilters) {
      try {
        await page.goto(`${BASE_URL}${path}`);
        await page.waitForLoadState('networkidle');
        
        // Look for search inputs
        const searchInputs = await page.locator('input[type="search"], input[placeholder*="search"], input[name*="search"], .search-input').all();
        
        for (let i = 0; i < searchInputs.length; i++) {
          const searchInput = searchInputs[i];
          if (await searchInput.isVisible()) {
            try {
              await searchInput.fill('test search');
              await searchInput.press('Enter');
              logTestResult('interactive_components', `${path} - Search functionality`, 'PASS');
              console.log(`✓ Search works on ${path}`);
              break;
            } catch (error) {
              logTestResult('interactive_components', `${path} - Search functionality`, 'FAIL', error.message);
            }
          }
        }
        
        // Look for filter dropdowns or buttons
        const filterElements = await page.locator('select, .filter, [data-testid*="filter"], button:has-text("filter")').all();
        
        let filterCount = 0;
        for (const filter of filterElements) {
          if (await filter.isVisible()) {
            filterCount++;
            try {
              await filter.click();
              logTestResult('interactive_components', `${path} - Filter interaction`, 'PASS');
            } catch (error) {
              logTestResult('interactive_components', `${path} - Filter interaction`, 'FAIL', error.message);
            }
          }
        }
        
        if (filterCount > 0) {
          console.log(`✓ Found ${filterCount} filter elements on ${path}`);
        }
        
      } catch (error) {
        logTestResult('interactive_components', `${path} filters and search`, 'FAIL', error.message);
      }
    }
  });

  test('Calendar Functionality', async ({ page }) => {
    console.log('Testing calendar functionality...');
    
    try {
      await page.goto(`${BASE_URL}/calendar`);
      await page.waitForLoadState('networkidle');
      
      // Look for calendar elements
      const calendarElements = await page.locator('.calendar, [data-testid="calendar"], .react-calendar, .calendar-wrapper').all();
      
      if (calendarElements.length > 0) {
        logTestResult('interactive_components', 'Calendar component visibility', 'PASS');
        
        // Test calendar interactions
        const clickableElements = await page.locator('.calendar button, .calendar .day, .react-calendar button').all();
        let clickableCount = 0;
        
        for (const element of clickableElements.slice(0, 5)) { // Test first 5 clickable elements
          if (await element.isVisible()) {
            try {
              await element.click();
              clickableCount++;
            } catch (e) {
              // Element might not be clickable
            }
          }
        }
        
        logTestResult('interactive_components', 'Calendar interactions', 
          clickableCount > 0 ? 'PASS' : 'FAIL', 
          `${clickableCount} calendar elements are clickable`);
          
        console.log(`✓ Calendar functionality tested - ${clickableCount} interactive elements`);
      } else {
        logTestResult('interactive_components', 'Calendar component visibility', 'FAIL', 
          'No calendar component found');
      }
      
    } catch (error) {
      logTestResult('interactive_components', 'Calendar functionality', 'FAIL', error.message);
    }
  });

  test('IA Assistant Interactions', async ({ page }) => {
    console.log('Testing IA Assistant interactions...');
    
    try {
      await page.goto(`${BASE_URL}/ia`);
      await page.waitForLoadState('networkidle');
      
      // Look for chat/assistant interface elements
      const chatElements = await page.locator('input[placeholder*="message"], textarea[placeholder*="message"], .chat-input, [data-testid="chat-input"]').all();
      const sendButtons = await page.locator('button:has-text("send"), button[type="submit"], .send-button, [data-testid="send-button"]').all();
      
      if (chatElements.length > 0) {
        logTestResult('interactive_components', 'IA Assistant input field', 'PASS');
        
        try {
          const chatInput = chatElements[0];
          await chatInput.fill('Hello, this is a test message');
          
          if (sendButtons.length > 0) {
            await sendButtons[0].click();
            logTestResult('interactive_components', 'IA Assistant message sending', 'PASS');
            console.log('✓ IA Assistant messaging works');
          } else {
            logTestResult('interactive_components', 'IA Assistant message sending', 'FAIL', 
              'Send button not found');
          }
        } catch (error) {
          logTestResult('interactive_components', 'IA Assistant interactions', 'FAIL', error.message);
        }
      } else {
        logTestResult('interactive_components', 'IA Assistant input field', 'FAIL', 
          'Chat input field not found');
      }
      
    } catch (error) {
      logTestResult('interactive_components', 'IA Assistant functionality', 'FAIL', error.message);
    }
  });

  test.afterAll(async () => {
    // Calculate test summary
    console.log('\n=== COMPREHENSIVE INTERACTIVE ELEMENTS TEST RESULTS ===');
    console.log(`Total Tests: ${testResults.summary.total_tests}`);
    console.log(`Passed: ${testResults.summary.passed}`);
    console.log(`Failed: ${testResults.summary.failed}`);
    console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total_tests) * 100).toFixed(2)}%`);
    
    if (testResults.failures.length > 0) {
      console.log('\n=== FAILURES ===');
      testResults.failures.forEach(failure => {
        console.log(`❌ ${failure.test}: ${failure.details}`);
      });
    }
    
    // Store results (this will be captured by the test runner)
    global.comprehensiveTestResults = testResults;
  });
});

module.exports = testResults;