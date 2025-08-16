#!/usr/bin/env node

/**
 * Desktop Navigation Testing Script
 * Comprehensive UI testing for Nauti Bouys navigation system
 * Phase 2: Desktop Navigation Testing
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class DesktopNavigationTester {
  constructor() {
    this.baseUrl = 'http://localhost:5173';
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      phase: 'Phase 2: Desktop Navigation Testing',
      testResults: {},
      performance: {},
      errors: [],
      summary: {}
    };
    
    // Navigation elements to test
    this.navigationElements = [
      { name: 'Home', href: '/', expectedTitle: 'Home' },
      { name: 'Beverages', href: '/beverages', expectedTitle: 'Beverages' },
      { name: 'Cocktails', href: '/cocktails', expectedTitle: 'Cocktails' },
      { name: 'Wines', href: '/wines', expectedTitle: 'Wines' },
      { name: 'Spirits', href: '/spirits', expectedTitle: 'Spirits' },
      { name: 'Calendar', href: '/calendar', expectedTitle: 'Calendar' },
      { name: 'IA Assistant', href: '/ia', expectedTitle: 'IA Assistant' }
    ];
    
    this.authElements = [
      { name: 'Login', href: '/login', expectedTitle: 'Login' },
      { name: 'Sign Up', href: '/register', expectedTitle: 'Register' }
    ];
  }

  async initialize() {
    console.log('🚀 Starting Desktop Navigation Testing...');
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Set up performance monitoring
    await this.page.setCacheEnabled(false);
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Listen for console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.results.errors.push({
          type: 'console_error',
          message: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Listen for page errors
    this.page.on('pageerror', error => {
      this.results.errors.push({
        type: 'page_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    });
  }

  async testServerAccessibility() {
    console.log('📡 Testing server accessibility...');
    try {
      const startTime = Date.now();
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0', timeout: 10000 });
      const loadTime = Date.now() - startTime;
      
      const title = await this.page.title();
      const url = this.page.url();
      
      this.results.testResults.serverAccessibility = {
        success: true,
        loadTime,
        title,
        url,
        status: 'Server accessible and responding'
      };
      
      console.log(`✅ Server accessible in ${loadTime}ms`);
      return true;
    } catch (error) {
      this.results.testResults.serverAccessibility = {
        success: false,
        error: error.message,
        status: 'Server not accessible'
      };
      console.log(`❌ Server not accessible: ${error.message}`);
      return false;
    }
  }

  async testLogoNavigation() {
    console.log('🎯 Testing logo navigation...');
    try {
      // Navigate to a different page first
      await this.page.goto(`${this.baseUrl}/beverages`, { waitUntil: 'networkidle0' });
      
      // Click logo
      const startTime = Date.now();
      await this.page.click('a[href="/"] .w-10.h-10');
      await this.page.waitForURL(`${this.baseUrl}/`);
      const navigationTime = Date.now() - startTime;
      
      // Verify we're on homepage
      const currentUrl = this.page.url();
      const isHomepage = currentUrl === `${this.baseUrl}/`;
      
      this.results.testResults.logoNavigation = {
        success: isHomepage,
        navigationTime,
        currentUrl,
        expectedUrl: `${this.baseUrl}/`,
        status: isHomepage ? 'Logo navigation successful' : 'Logo navigation failed'
      };
      
      console.log(`${isHomepage ? '✅' : '❌'} Logo navigation test: ${navigationTime}ms`);
      return isHomepage;
    } catch (error) {
      this.results.testResults.logoNavigation = {
        success: false,
        error: error.message,
        status: 'Logo navigation test failed'
      };
      console.log(`❌ Logo navigation failed: ${error.message}`);
      return false;
    }
  }

  async testMainNavigation() {
    console.log('🧭 Testing main navigation menu...');
    const navigationResults = {};
    
    for (const navItem of this.navigationElements) {
      console.log(`  Testing navigation to ${navItem.name}...`);
      
      try {
        const startTime = Date.now();
        
        // Click navigation item
        await this.page.click(`a[href="${navItem.href}"]`);
        await this.page.waitForURL(`${this.baseUrl}${navItem.href}`);
        
        const navigationTime = Date.now() - startTime;
        const currentUrl = this.page.url();
        const expectedUrl = `${this.baseUrl}${navItem.href}`;
        const isCorrectUrl = currentUrl === expectedUrl;
        
        // Check for active state styling
        const activeElement = await this.page.$(`a[href="${navItem.href}"].text-teal-700`);
        const hasActiveState = activeElement !== null;
        
        // Check if content loaded
        const hasContent = await this.page.$('main') !== null;
        
        // Take screenshot
        await this.page.screenshot({
          path: `/mnt/c/nauti-bouys/tests/screenshots/nav-${navItem.name.toLowerCase()}.png`,
          fullPage: false
        });
        
        navigationResults[navItem.name] = {
          success: isCorrectUrl && hasContent,
          navigationTime,
          currentUrl,
          expectedUrl,
          hasActiveState,
          hasContent,
          status: isCorrectUrl ? 'Navigation successful' : 'Navigation failed'
        };
        
        console.log(`    ${isCorrectUrl ? '✅' : '❌'} ${navItem.name}: ${navigationTime}ms, Active: ${hasActiveState}`);
        
      } catch (error) {
        navigationResults[navItem.name] = {
          success: false,
          error: error.message,
          status: 'Navigation test failed'
        };
        console.log(`    ❌ ${navItem.name} failed: ${error.message}`);
      }
    }
    
    this.results.testResults.mainNavigation = navigationResults;
    return navigationResults;
  }

  async testAuthNavigation() {
    console.log('🔐 Testing authentication navigation...');
    const authResults = {};
    
    for (const authItem of this.authElements) {
      console.log(`  Testing navigation to ${authItem.name}...`);
      
      try {
        const startTime = Date.now();
        
        // Click auth link
        await this.page.click(`a[href="${authItem.href}"]`);
        await this.page.waitForURL(`${this.baseUrl}${authItem.href}`);
        
        const navigationTime = Date.now() - startTime;
        const currentUrl = this.page.url();
        const expectedUrl = `${this.baseUrl}${authItem.href}`;
        const isCorrectUrl = currentUrl === expectedUrl;
        
        // Check if form is present
        const hasForm = await this.page.$('form') !== null;
        
        // Take screenshot
        await this.page.screenshot({
          path: `/mnt/c/nauti-bouys/tests/screenshots/auth-${authItem.name.toLowerCase().replace(' ', '-')}.png`,
          fullPage: false
        });
        
        authResults[authItem.name] = {
          success: isCorrectUrl && hasForm,
          navigationTime,
          currentUrl,
          expectedUrl,
          hasForm,
          status: isCorrectUrl && hasForm ? 'Auth navigation successful' : 'Auth navigation failed'
        };
        
        console.log(`    ${isCorrectUrl && hasForm ? '✅' : '❌'} ${authItem.name}: ${navigationTime}ms, Form: ${hasForm}`);
        
      } catch (error) {
        authResults[authItem.name] = {
          success: false,
          error: error.message,
          status: 'Auth navigation test failed'
        };
        console.log(`    ❌ ${authItem.name} failed: ${error.message}`);
      }
    }
    
    this.results.testResults.authNavigation = authResults;
    return authResults;
  }

  async testHoverStates() {
    console.log('🎨 Testing hover states...');
    const hoverResults = {};
    
    try {
      // Go to homepage
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
      
      for (const navItem of this.navigationElements) {
        try {
          // Hover over navigation item
          const navSelector = `a[href="${navItem.href}"]`;
          await this.page.hover(navSelector);
          
          // Wait for CSS transitions
          await this.page.waitForTimeout(300);
          
          // Check hover styles
          const hoverElement = await this.page.$(navSelector + '.hover\\:text-teal-700');
          const hasHoverEffect = hoverElement !== null;
          
          hoverResults[navItem.name] = {
            success: true,
            hasHoverEffect,
            status: 'Hover test completed'
          };
          
          console.log(`    ${hasHoverEffect ? '✅' : '⚠️'} ${navItem.name} hover state`);
          
        } catch (error) {
          hoverResults[navItem.name] = {
            success: false,
            error: error.message,
            status: 'Hover test failed'
          };
        }
      }
    } catch (error) {
      console.log(`❌ Hover state testing failed: ${error.message}`);
    }
    
    this.results.testResults.hoverStates = hoverResults;
    return hoverResults;
  }

  async testPerformance() {
    console.log('⚡ Testing navigation performance...');
    const performanceResults = [];
    
    for (const navItem of this.navigationElements.slice(0, 3)) { // Test first 3 for speed
      try {
        const startTime = Date.now();
        await this.page.goto(`${this.baseUrl}${navItem.href}`, { waitUntil: 'networkidle0' });
        const loadTime = Date.now() - startTime;
        
        performanceResults.push({
          page: navItem.name,
          loadTime,
          status: loadTime < 2000 ? 'Fast' : loadTime < 5000 ? 'Acceptable' : 'Slow'
        });
        
        console.log(`    📊 ${navItem.name}: ${loadTime}ms`);
        
      } catch (error) {
        performanceResults.push({
          page: navItem.name,
          error: error.message,
          status: 'Failed'
        });
      }
    }
    
    this.results.performance = {
      navigationPerformance: performanceResults,
      averageLoadTime: performanceResults.reduce((sum, result) => 
        sum + (result.loadTime || 0), 0) / performanceResults.length
    };
    
    return performanceResults;
  }

  async testRapidNavigation() {
    console.log('🏃‍♂️ Testing rapid navigation (stress test)...');
    
    try {
      const rapidResults = [];
      const testPages = this.navigationElements.slice(0, 4);
      
      for (let i = 0; i < 3; i++) { // 3 cycles
        for (const navItem of testPages) {
          const startTime = Date.now();
          await this.page.click(`a[href="${navItem.href}"]`);
          await this.page.waitForURL(`${this.baseUrl}${navItem.href}`, { timeout: 3000 });
          const responseTime = Date.now() - startTime;
          
          rapidResults.push({
            cycle: i + 1,
            page: navItem.name,
            responseTime,
            success: responseTime < 1000
          });
          
          // Small delay between clicks
          await this.page.waitForTimeout(100);
        }
      }
      
      this.results.testResults.rapidNavigation = {
        success: rapidResults.every(result => result.success),
        results: rapidResults,
        averageResponseTime: rapidResults.reduce((sum, result) => 
          sum + result.responseTime, 0) / rapidResults.length,
        status: 'Rapid navigation stress test completed'
      };
      
      console.log(`    🏁 Rapid navigation completed - Average: ${this.results.testResults.rapidNavigation.averageResponseTime.toFixed(0)}ms`);
      
    } catch (error) {
      this.results.testResults.rapidNavigation = {
        success: false,
        error: error.message,
        status: 'Rapid navigation test failed'
      };
      console.log(`❌ Rapid navigation failed: ${error.message}`);
    }
  }

  generateSummary() {
    const totalTests = Object.keys(this.results.testResults).length;
    const passedTests = Object.values(this.results.testResults).filter(result => 
      result.success || (typeof result === 'object' && Object.values(result).some(subResult => subResult.success))
    ).length;
    
    this.results.summary = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      successRate: ((passedTests / totalTests) * 100).toFixed(1) + '%',
      totalErrors: this.results.errors.length,
      overallStatus: passedTests === totalTests ? 'PASS' : 'PARTIAL PASS',
      averagePerformance: this.results.performance.averageLoadTime || 'N/A'
    };
    
    console.log('\n📊 TEST SUMMARY:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${totalTests - passedTests}`);
    console.log(`   Success Rate: ${this.results.summary.successRate}`);
    console.log(`   Errors: ${this.results.errors.length}`);
    console.log(`   Status: ${this.results.summary.overallStatus}`);
  }

  async saveResults() {
    const resultsPath = '/mnt/c/nauti-bouys/tests/results/desktop-navigation-results.json';
    const screenshotsDir = '/mnt/c/nauti-bouys/tests/screenshots';
    
    // Ensure directories exist
    const fs = require('fs');
    const path = require('path');
    
    ['/mnt/c/nauti-bouys/tests/results', screenshotsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Save JSON results
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
    
    // Save summary report
    const summaryPath = '/mnt/c/nauti-bouys/tests/results/desktop-navigation-summary.txt';
    const summaryReport = `
DESKTOP NAVIGATION TEST RESULTS
===============================
Test Date: ${this.results.timestamp}
Phase: ${this.results.phase}

SUMMARY:
--------
Total Tests: ${this.results.summary.totalTests}
Passed: ${this.results.summary.passedTests}
Failed: ${this.results.summary.failedTests}
Success Rate: ${this.results.summary.successRate}
Overall Status: ${this.results.summary.overallStatus}

PERFORMANCE:
-----------
Average Load Time: ${this.results.summary.averagePerformance}ms

ERRORS FOUND:
------------
${this.results.errors.map(error => `- ${error.type}: ${error.message}`).join('\n') || 'No errors found'}

RECOMMENDATIONS:
---------------
${this.results.summary.overallStatus === 'PASS' ? '✅ All navigation tests passed successfully!' : '⚠️ Some tests failed - review detailed results'}
`;
    
    fs.writeFileSync(summaryPath, summaryReport);
    
    console.log(`\n💾 Results saved to:`);
    console.log(`   📄 ${resultsPath}`);
    console.log(`   📄 ${summaryPath}`);
    console.log(`   📸 Screenshots in ${screenshotsDir}/`);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAllTests() {
    try {
      await this.initialize();
      
      // Server accessibility test
      const serverAccessible = await this.testServerAccessibility();
      if (!serverAccessible) {
        console.log('❌ Server not accessible - aborting tests');
        return;
      }
      
      // Navigation tests
      await this.testLogoNavigation();
      await this.testMainNavigation();
      await this.testAuthNavigation();
      await this.testHoverStates();
      await this.testPerformance();
      await this.testRapidNavigation();
      
      // Generate summary and save results
      this.generateSummary();
      await this.saveResults();
      
    } catch (error) {
      console.log(`❌ Test execution failed: ${error.message}`);
      this.results.errors.push({
        type: 'execution_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      await this.cleanup();
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new DesktopNavigationTester();
  tester.runAllTests();
}

module.exports = DesktopNavigationTester;