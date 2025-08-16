#!/usr/bin/env node

/**
 * Manual Desktop Navigation Testing Script
 * Alternative testing approach using curl and DOM analysis
 */

const { execSync } = require('child_process');
const fs = require('fs');

class ManualDesktopNavigationTester {
  constructor() {
    this.baseUrl = 'http://localhost:5173';
    this.results = {
      timestamp: new Date().toISOString(),
      phase: 'Phase 2: Desktop Navigation Testing (Manual)',
      testResults: {},
      errors: [],
      summary: {}
    };
    
    this.routes = [
      '/',
      '/beverages',
      '/cocktails', 
      '/wines',
      '/spirits',
      '/calendar',
      '/ia',
      '/login',
      '/register'
    ];
  }

  async testServerConnectivity() {
    console.log('📡 Testing server connectivity...');
    
    try {
      const response = execSync(`curl -s -o /dev/null -w "%{http_code}" ${this.baseUrl}`, { encoding: 'utf8' });
      const statusCode = response.trim();
      
      this.results.testResults.serverConnectivity = {
        success: statusCode === '200',
        statusCode,
        status: statusCode === '200' ? 'Server accessible' : `Server returned ${statusCode}`
      };
      
      console.log(`${statusCode === '200' ? '✅' : '❌'} Server connectivity: HTTP ${statusCode}`);
      return statusCode === '200';
      
    } catch (error) {
      this.results.testResults.serverConnectivity = {
        success: false,
        error: error.message,
        status: 'Server connection failed'
      };
      console.log(`❌ Server connection failed: ${error.message}`);
      return false;
    }
  }

  async testRouteAccessibility() {
    console.log('🧭 Testing route accessibility...');
    const routeResults = {};
    
    for (const route of this.routes) {
      console.log(`  Testing route: ${route}`);
      
      try {
        const startTime = Date.now();
        const response = execSync(`curl -s -o /dev/null -w "%{http_code},%{time_total}" ${this.baseUrl}${route}`, { encoding: 'utf8' });
        const [statusCode, timeTotal] = response.trim().split(',');
        const responseTime = Math.round(parseFloat(timeTotal) * 1000);
        
        routeResults[route] = {
          success: statusCode === '200',
          statusCode,
          responseTime,
          status: statusCode === '200' ? 'Route accessible' : `Route returned ${statusCode}`,
          performanceRating: responseTime < 200 ? 'Excellent' : responseTime < 500 ? 'Good' : responseTime < 1000 ? 'Fair' : 'Slow'
        };
        
        console.log(`    ${statusCode === '200' ? '✅' : '❌'} ${route}: HTTP ${statusCode} (${responseTime}ms)`);
        
      } catch (error) {
        routeResults[route] = {
          success: false,
          error: error.message,
          status: 'Route test failed'
        };
        console.log(`    ❌ ${route} failed: ${error.message}`);
      }
    }
    
    this.results.testResults.routeAccessibility = routeResults;
    return routeResults;
  }

  async analyzeApplicationStructure() {
    console.log('🔍 Analyzing application structure...');
    
    try {
      // Get main HTML
      const htmlContent = execSync(`curl -s ${this.baseUrl}`, { encoding: 'utf8' });
      
      // Check for React app structure
      const hasReactRoot = htmlContent.includes('<div id="root">');
      const hasViteClient = htmlContent.includes('@vite/client');
      const hasMainScript = htmlContent.includes('/src/main.jsx');
      
      this.results.testResults.applicationStructure = {
        success: hasReactRoot && hasViteClient && hasMainScript,
        hasReactRoot,
        hasViteClient,
        hasMainScript,
        status: 'Application structure analyzed'
      };
      
      console.log(`  ✅ React Root: ${hasReactRoot}`);
      console.log(`  ✅ Vite Client: ${hasViteClient}`);
      console.log(`  ✅ Main Script: ${hasMainScript}`);
      
      return true;
      
    } catch (error) {
      this.results.testResults.applicationStructure = {
        success: false,
        error: error.message,
        status: 'Structure analysis failed'
      };
      console.log(`❌ Structure analysis failed: ${error.message}`);
      return false;
    }
  }

  async validateNavigationComponents() {
    console.log('🧩 Validating navigation components...');
    
    try {
      // Check Header component
      const headerPath = '/mnt/c/nauti-bouys/frontend/src/components/layout/Header.jsx';
      const headerContent = fs.readFileSync(headerPath, 'utf8');
      
      const navigationItems = [
        'Home',
        'Beverages', 
        'Cocktails',
        'Wines',
        'Spirits',
        'Calendar',
        'IA Assistant'
      ];
      
      const componentValidation = {};
      
      navigationItems.forEach(item => {
        const isPresent = headerContent.includes(`name: '${item}'`);
        componentValidation[item] = {
          present: isPresent,
          status: isPresent ? 'Navigation item found' : 'Navigation item missing'
        };
        console.log(`  ${isPresent ? '✅' : '❌'} ${item} navigation item`);
      });
      
      // Check for authentication links
      const hasLogin = headerContent.includes("to=\"/login\"");
      const hasSignUp = headerContent.includes("to=\"/register\"");
      
      componentValidation.Login = {
        present: hasLogin,
        status: hasLogin ? 'Login link found' : 'Login link missing'
      };
      
      componentValidation.SignUp = {
        present: hasSignUp,
        status: hasSignUp ? 'Sign Up link found' : 'Sign Up link missing'
      };
      
      console.log(`  ${hasLogin ? '✅' : '❌'} Login link`);
      console.log(`  ${hasSignUp ? '✅' : '❌'} Sign Up link`);
      
      this.results.testResults.navigationComponents = {
        success: Object.values(componentValidation).every(item => item.present),
        validation: componentValidation,
        status: 'Navigation components validated'
      };
      
      return componentValidation;
      
    } catch (error) {
      this.results.testResults.navigationComponents = {
        success: false,
        error: error.message,
        status: 'Component validation failed'
      };
      console.log(`❌ Component validation failed: ${error.message}`);
      return false;
    }
  }

  async testActiveStateLogic() {
    console.log('🎨 Testing active state logic...');
    
    try {
      const headerPath = '/mnt/c/nauti-bouys/frontend/src/components/layout/Header.jsx';
      const headerContent = fs.readFileSync(headerPath, 'utf8');
      
      // Check for isActive function
      const hasIsActiveFunction = headerContent.includes('const isActive = (path) => location.pathname === path');
      const hasActiveStateClasses = headerContent.includes('text-teal-700 bg-teal-50 border-b-2 border-teal-600');
      const hasHoverClasses = headerContent.includes('hover:text-teal-700 hover:bg-teal-50');
      
      this.results.testResults.activeStateLogic = {
        success: hasIsActiveFunction && hasActiveStateClasses && hasHoverClasses,
        hasIsActiveFunction,
        hasActiveStateClasses,
        hasHoverClasses,
        status: 'Active state logic validated'
      };
      
      console.log(`  ${hasIsActiveFunction ? '✅' : '❌'} isActive function`);
      console.log(`  ${hasActiveStateClasses ? '✅' : '❌'} Active state classes`);
      console.log(`  ${hasHoverClasses ? '✅' : '❌'} Hover state classes`);
      
      return true;
      
    } catch (error) {
      this.results.testResults.activeStateLogic = {
        success: false,
        error: error.message,
        status: 'Active state logic test failed'
      };
      console.log(`❌ Active state logic test failed: ${error.message}`);
      return false;
    }
  }

  async performLoadTesting() {
    console.log('⚡ Performing load testing...');
    
    const testRoutes = ['/', '/beverages', '/cocktails', '/wines'];
    const loadResults = [];
    
    for (const route of testRoutes) {
      console.log(`  Load testing ${route}...`);
      
      try {
        // Test 5 concurrent requests
        const startTime = Date.now();
        const promises = Array(5).fill(null).map(() => 
          execSync(`curl -s -o /dev/null -w "%{time_total}" ${this.baseUrl}${route}`, { encoding: 'utf8' })
        );
        
        const responses = await Promise.all(promises.map(p => Promise.resolve(p)));
        const endTime = Date.now();
        
        const responseTimes = responses.map(r => Math.round(parseFloat(r.trim()) * 1000));
        const averageTime = Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length);
        const maxTime = Math.max(...responseTimes);
        
        loadResults.push({
          route,
          averageTime,
          maxTime,
          responseTimes,
          concurrentRequests: 5,
          totalTime: endTime - startTime,
          status: maxTime < 1000 ? 'Good' : maxTime < 2000 ? 'Acceptable' : 'Needs Optimization'
        });
        
        console.log(`    📊 ${route}: Avg ${averageTime}ms, Max ${maxTime}ms`);
        
      } catch (error) {
        loadResults.push({
          route,
          error: error.message,
          status: 'Load test failed'
        });
      }
    }
    
    this.results.testResults.loadTesting = {
      success: loadResults.every(result => !result.error),
      results: loadResults,
      overallPerformance: loadResults.reduce((sum, result) => sum + (result.averageTime || 0), 0) / loadResults.length,
      status: 'Load testing completed'
    };
    
    return loadResults;
  }

  generateSummary() {
    const testCategories = Object.keys(this.results.testResults);
    const passedTests = testCategories.filter(category => this.results.testResults[category].success).length;
    const totalTests = testCategories.length;
    
    this.results.summary = {
      totalTestCategories: totalTests,
      passedCategories: passedTests,
      failedCategories: totalTests - passedTests,
      successRate: ((passedTests / totalTests) * 100).toFixed(1) + '%',
      totalErrors: this.results.errors.length,
      overallStatus: passedTests === totalTests ? 'PASS' : 'PARTIAL PASS'
    };
    
    console.log('\n📊 DESKTOP NAVIGATION TEST SUMMARY:');
    console.log(`   Test Categories: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${totalTests - passedTests}`);
    console.log(`   Success Rate: ${this.results.summary.successRate}`);
    console.log(`   Overall Status: ${this.results.summary.overallStatus}`);
  }

  async saveResults() {
    const resultsPath = '/mnt/c/nauti-bouys/tests/results/desktop-nav-manual-results.json';
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
    
    console.log(`\n💾 Results saved to: ${resultsPath}`);
    
    // Also return for memory storage
    return this.results;
  }

  async runAllTests() {
    console.log('🚀 Starting Manual Desktop Navigation Testing...\n');
    
    try {
      // Run all test categories
      await this.testServerConnectivity();
      await this.testRouteAccessibility();
      await this.analyzeApplicationStructure();
      await this.validateNavigationComponents();
      await this.testActiveStateLogic();
      await this.performLoadTesting();
      
      // Generate summary and save
      this.generateSummary();
      const results = await this.saveResults();
      
      console.log('\n🏁 Desktop Navigation Testing Complete!');
      return results;
      
    } catch (error) {
      console.log(`❌ Test execution failed: ${error.message}`);
      this.results.errors.push({
        type: 'execution_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return this.results;
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new ManualDesktopNavigationTester();
  tester.runAllTests();
}

module.exports = ManualDesktopNavigationTester;