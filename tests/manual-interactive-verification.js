/**
 * Manual Interactive Element Verification
 * This script performs manual verification of all interactive elements
 * using Puppeteer for direct DOM interaction testing
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';

// Test results storage
let testResults = {
  timestamp: new Date().toISOString(),
  desktop_navigation: [],
  mobile_navigation: [],
  authentication: [],
  page_elements: [],
  interactive_components: [],
  failures: [],
  summary: {
    total_tests: 0,
    passed: 0,
    failed: 0,
    success_rate: 0
  }
};

// Utility functions
function logResult(category, test, status, details = null) {
  const result = {
    test,
    status,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults[category].push(result);
  testResults.summary.total_tests++;
  
  if (status === 'PASS') {
    testResults.summary.passed++;
    console.log(`✅ ${test}`);
  } else {
    testResults.summary.failed++;
    testResults.failures.push(result);
    console.log(`❌ ${test}: ${details}`);
  }
}

async function testDesktopNavigation(page) {
  console.log('\\n=== Testing Desktop Navigation ===');
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    
    // Define navigation links to test
    const navLinks = [
      { href: '/', text: 'Home' },
      { href: '/beverages', text: 'Beverages' },
      { href: '/cocktails', text: 'Cocktails' },
      { href: '/wines', text: 'Wines' },
      { href: '/spirits', text: 'Spirits' },
      { href: '/calendar', text: 'Calendar' },
      { href: '/ia', text: 'IA Assistant' }
    ];
    
    for (const link of navLinks) {
      try {
        // Look for navigation link
        const navElement = await page.$(
          `nav a[href="${link.href}"], header a[href="${link.href}"], a[href="${link.href}"]`
        );
        
        if (navElement) {
          // Test if link is visible and clickable
          const isVisible = await navElement.boundingBox() !== null;
          
          if (isVisible) {
            await navElement.click();
            await page.waitForTimeout(1000); // Wait for navigation
            
            const currentUrl = page.url();
            if (currentUrl.includes(link.href) || (link.href === '/' && !currentUrl.includes('/', 1))) {
              logResult('desktop_navigation', `Navigate to ${link.text}`, 'PASS');
            } else {
              logResult('desktop_navigation', `Navigate to ${link.text}`, 'FAIL', 
                `Expected ${link.href}, got ${currentUrl}`);
            }
          } else {
            logResult('desktop_navigation', `Navigate to ${link.text}`, 'FAIL', 
              'Link not visible');
          }
        } else {
          logResult('desktop_navigation', `Navigate to ${link.text}`, 'FAIL', 
            'Link not found in DOM');
        }
      } catch (error) {
        logResult('desktop_navigation', `Navigate to ${link.text}`, 'FAIL', error.message);
      }
    }
  } catch (error) {
    logResult('desktop_navigation', 'Desktop Navigation Test', 'FAIL', error.message);
  }
}

async function testMobileNavigation(page) {
  console.log('\\n=== Testing Mobile Navigation ===');
  
  try {
    // Set mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    
    // Look for mobile menu toggle
    const mobileMenuSelectors = [
      'button[aria-label*="menu"]',
      'button[aria-expanded]',
      '.hamburger',
      '[data-testid="mobile-menu"]',
      'button:has(svg)',
      '.mobile-menu-toggle',
      '.menu-btn'
    ];
    
    let mobileMenuButton = null;
    for (const selector of mobileMenuSelectors) {
      try {
        mobileMenuButton = await page.$(selector);
        if (mobileMenuButton) break;
      } catch (e) {
        // Continue with next selector
      }
    }
    
    if (mobileMenuButton) {
      const isVisible = await mobileMenuButton.boundingBox() !== null;
      
      if (isVisible) {
        await mobileMenuButton.click();
        await page.waitForTimeout(500);
        
        logResult('mobile_navigation', 'Mobile menu toggle', 'PASS');
        
        // Test mobile nav links
        const mobileNavLinks = await page.$$('nav a, .mobile-nav a, .mobile-menu a');
        let workingLinks = 0;
        
        for (const link of mobileNavLinks) {
          try {
            const href = await link.getProperty('href');
            const hrefValue = await href.jsonValue();
            
            if (hrefValue && !hrefValue.includes('#') && !hrefValue.includes('login') && !hrefValue.includes('register')) {
              const isLinkVisible = await link.boundingBox() !== null;
              if (isLinkVisible) {
                await link.click();
                await page.waitForTimeout(1000);
                workingLinks++;
              }
            }
          } catch (e) {
            // Link might not be clickable
          }
        }
        
        logResult('mobile_navigation', 'Mobile navigation links', 
          workingLinks > 0 ? 'PASS' : 'FAIL', 
          `${workingLinks} working mobile links found`);
          
      } else {
        logResult('mobile_navigation', 'Mobile menu toggle', 'FAIL', 'Menu button not visible');
      }
    } else {
      logResult('mobile_navigation', 'Mobile menu toggle', 'FAIL', 'Mobile menu button not found');
    }
  } catch (error) {
    logResult('mobile_navigation', 'Mobile Navigation Test', 'FAIL', error.message);
  }
}

async function testAuthenticationForms(page) {
  console.log('\\n=== Testing Authentication Forms ===');
  
  // Test Login Page
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    
    // Look for login form elements
    const loginForm = await page.$('form, [data-testid="login-form"]');
    
    if (loginForm) {
      logResult('authentication', 'Login form exists', 'PASS');
      
      // Check form fields
      const emailField = await page.$('input[type="email"], input[name="email"], #email');
      const passwordField = await page.$('input[type="password"], input[name="password"], #password');
      const submitButton = await page.$('button[type="submit"], input[type="submit"], button:contains("login"), button:contains("sign in")');
      
      if (emailField && passwordField) {
        logResult('authentication', 'Login form fields', 'PASS');
        
        // Test form interaction
        await page.type('input[type="email"], input[name="email"], #email', 'test@example.com');
        await page.type('input[type="password"], input[name="password"], #password', 'testpassword');
        
        if (submitButton) {
          // Don't actually submit, just test the button
          logResult('authentication', 'Login form interaction', 'PASS');
        } else {
          logResult('authentication', 'Login form interaction', 'FAIL', 'Submit button not found');
        }
      } else {
        logResult('authentication', 'Login form fields', 'FAIL', 'Required fields not found');
      }
    } else {
      logResult('authentication', 'Login form exists', 'FAIL', 'Login form not found');
    }
  } catch (error) {
    logResult('authentication', 'Login page test', 'FAIL', error.message);
  }
  
  // Test Register Page
  try {
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle2' });
    
    const registerForm = await page.$('form, [data-testid="register-form"]');
    
    if (registerForm) {
      logResult('authentication', 'Register form exists', 'PASS');
      
      // Check for form fields
      const formFields = await page.$$('input');
      if (formFields.length >= 2) {
        logResult('authentication', 'Register form fields', 'PASS', 
          `${formFields.length} form fields found`);
      } else {
        logResult('authentication', 'Register form fields', 'FAIL', 
          'Insufficient form fields');
      }
    } else {
      logResult('authentication', 'Register form exists', 'FAIL', 'Register form not found');
    }
  } catch (error) {
    logResult('authentication', 'Register page test', 'FAIL', error.message);
  }
}

async function testPageElements(page) {
  console.log('\\n=== Testing Page-Specific Elements ===');
  
  const pages = ['/', '/beverages', '/cocktails', '/wines', '/spirits', '/calendar', '/ia'];
  
  for (const pagePath of pages) {
    try {
      await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'networkidle2' });
      
      // Count buttons
      const buttons = await page.$$('button, input[type="button"], input[type="submit"], .btn');
      const visibleButtons = [];
      
      for (const button of buttons) {
        const isVisible = await button.boundingBox() !== null;
        if (isVisible) visibleButtons.push(button);
      }
      
      // Count form inputs
      const inputs = await page.$$('input, textarea, select');
      const visibleInputs = [];
      
      for (const input of inputs) {
        const isVisible = await input.boundingBox() !== null;
        if (isVisible) visibleInputs.push(input);
      }
      
      logResult('page_elements', `${pagePath} - Interactive elements`, 'PASS', 
        `${visibleButtons.length} buttons, ${visibleInputs.length} inputs`);
        
    } catch (error) {
      logResult('page_elements', `${pagePath} - Interactive elements`, 'FAIL', error.message);
    }
  }
}

async function testSearchAndFilters(page) {
  console.log('\\n=== Testing Search and Filter Components ===');
  
  const filterPages = ['/beverages', '/cocktails', '/wines', '/spirits'];
  
  for (const pagePath of filterPages) {
    try {
      await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'networkidle2' });
      
      // Look for search inputs
      const searchSelectors = [
        'input[type="search"]',
        'input[placeholder*="search"]',
        'input[name*="search"]',
        '.search-input',
        '[data-testid*="search"]'
      ];
      
      let searchFound = false;
      for (const selector of searchSelectors) {
        const searchInput = await page.$(selector);
        if (searchInput) {
          const isVisible = await searchInput.boundingBox() !== null;
          if (isVisible) {
            await page.type(selector, 'test search');
            searchFound = true;
            break;
          }
        }
      }
      
      // Look for filter elements
      const filterSelectors = [
        'select',
        '.filter',
        '[data-testid*="filter"]',
        'button:contains("filter")',
        '.dropdown'
      ];
      
      let filtersFound = 0;
      for (const selector of filterSelectors) {
        try {
          const elements = await page.$$(selector);
          for (const element of elements) {
            const isVisible = await element.boundingBox() !== null;
            if (isVisible) filtersFound++;
          }
        } catch (e) {
          // Selector might not be valid
        }
      }
      
      logResult('interactive_components', `${pagePath} - Search and filters`, 
        searchFound || filtersFound > 0 ? 'PASS' : 'FAIL',
        `Search: ${searchFound}, Filters: ${filtersFound}`);
        
    } catch (error) {
      logResult('interactive_components', `${pagePath} - Search and filters`, 'FAIL', error.message);
    }
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Interactive Elements Test...');
  console.log(`Testing application at: ${BASE_URL}`);
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Set a reasonable timeout
    page.setDefaultTimeout(10000);
    
    // Run all test suites
    await testDesktopNavigation(page);
    await testMobileNavigation(page);
    await testAuthenticationForms(page);
    await testPageElements(page);
    await testSearchAndFilters(page);
    
    // Calculate final results
    testResults.summary.success_rate = testResults.summary.total_tests > 0 
      ? (testResults.summary.passed / testResults.summary.total_tests * 100).toFixed(2)
      : 0;
      
    console.log('\\n🎯 === COMPREHENSIVE TEST RESULTS ===');
    console.log(`📊 Total Tests: ${testResults.summary.total_tests}`);
    console.log(`✅ Passed: ${testResults.summary.passed}`);
    console.log(`❌ Failed: ${testResults.summary.failed}`);
    console.log(`📈 Success Rate: ${testResults.summary.success_rate}%`);
    
    if (testResults.failures.length > 0) {
      console.log('\\n🚨 === CRITICAL FAILURES ===');
      testResults.failures.forEach((failure, index) => {
        console.log(`${index + 1}. ${failure.test}`);
        console.log(`   Status: ${failure.status}`);
        console.log(`   Details: ${failure.details}`);
        console.log(`   Time: ${failure.timestamp}`);
        console.log('');
      });
    }
    
    // Save results to file
    const resultsPath = path.join(__dirname, 'results', 'comprehensive-test-results.json');
    await fs.promises.mkdir(path.dirname(resultsPath), { recursive: true });
    await fs.promises.writeFile(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`📄 Results saved to: ${resultsPath}`);
    
    return testResults;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    testResults.failures.push({
      test: 'Test Suite Execution',
      status: 'FAIL',
      details: error.message,
      timestamp: new Date().toISOString()
    });
    return testResults;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Export for use in other scripts
module.exports = { runComprehensiveTest, testResults };

// Run if called directly
if (require.main === module) {
  runComprehensiveTest()
    .then(results => {
      console.log('\\n✅ Testing completed!');
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Testing failed:', error);
      process.exit(1);
    });
}