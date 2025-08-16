/**
 * DOM Analysis and Interactive Elements Test
 * This script tests the application by analyzing the HTML structure
 * and performing HTTP requests to verify functionality
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const API_BASE = 'http://localhost:3001/api';

// Test results storage
let testResults = {
  timestamp: new Date().toISOString(),
  application_status: {
    frontend_accessible: false,
    backend_accessible: false
  },
  route_testing: [],
  dom_analysis: [],
  api_endpoints: [],
  navigation_structure: {},
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
    console.log(`❌ ${test}: ${details || 'No details'}`);
  }
}

async function testApplicationAccessibility() {
  console.log('\\n=== Testing Application Accessibility ===');
  
  try {
    const response = await axios.get(BASE_URL, { timeout: 10000 });
    if (response.status === 200) {
      testResults.application_status.frontend_accessible = true;
      logResult('route_testing', 'Frontend Application Accessible', 'PASS', 
        `Status: ${response.status}`);
    } else {
      logResult('route_testing', 'Frontend Application Accessible', 'FAIL', 
        `Unexpected status: ${response.status}`);
    }
  } catch (error) {
    logResult('route_testing', 'Frontend Application Accessible', 'FAIL', 
      error.message);
  }
  
  // Test backend accessibility
  try {
    const response = await axios.get(`${API_BASE}/beverages`, { timeout: 5000 });
    if (response.status === 200) {
      testResults.application_status.backend_accessible = true;
      logResult('route_testing', 'Backend API Accessible', 'PASS', 
        `Status: ${response.status}, Data items: ${response.data?.length || 'unknown'}`);
    } else {
      logResult('route_testing', 'Backend API Accessible', 'FAIL', 
        `Unexpected status: ${response.status}`);
    }
  } catch (error) {
    logResult('route_testing', 'Backend API Accessible', 'FAIL', 
      error.message);
  }
}

async function testRouteAccessibility() {
  console.log('\\n=== Testing Route Accessibility ===');
  
  const routes = [
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
  
  for (const route of routes) {
    try {
      const response = await axios.get(`${BASE_URL}${route}`, { 
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500; // Accept any status below 500
        }
      });
      
      if (response.status === 200) {
        logResult('route_testing', `Route ${route} accessible`, 'PASS', 
          `Status: ${response.status}, Content-Type: ${response.headers['content-type']}`);
          
        // Analyze HTML content for interactive elements
        if (response.data && typeof response.data === 'string') {
          const htmlContent = response.data;
          const analysisResult = analyzePageContent(route, htmlContent);
          testResults.dom_analysis.push({
            route,
            analysis: analysisResult,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        logResult('route_testing', `Route ${route} accessible`, 'FAIL', 
          `Status: ${response.status}`);
      }
    } catch (error) {
      logResult('route_testing', `Route ${route} accessible`, 'FAIL', 
        error.message);
    }
  }
}

function analyzePageContent(route, htmlContent) {
  const analysis = {
    route,
    navigation_links: [],
    buttons: [],
    forms: [],
    inputs: [],
    interactive_elements: []
  };
  
  // Count navigation links
  const navLinkMatches = htmlContent.match(/<a[^>]*href=["'][^"']*["'][^>]*>/g) || [];
  analysis.navigation_links = navLinkMatches.length;
  
  // Count buttons
  const buttonMatches = htmlContent.match(/<button[^>]*>|<input[^>]*type=["']button["'][^>]*>|<input[^>]*type=["']submit["'][^>]*>/g) || [];
  analysis.buttons = buttonMatches.length;
  
  // Count forms
  const formMatches = htmlContent.match(/<form[^>]*>/g) || [];
  analysis.forms = formMatches.length;
  
  // Count input fields
  const inputMatches = htmlContent.match(/<input[^>]*>|<textarea[^>]*>|<select[^>]*>/g) || [];
  analysis.inputs = inputMatches.length;
  
  // Look for specific interactive patterns
  const interactivePatterns = [
    { name: 'Mobile Menu Toggle', pattern: /menu.*toggle|hamburger|mobile.*menu/i },
    { name: 'Search Input', pattern: /search|filter/i },
    { name: 'Calendar Component', pattern: /calendar|date.*picker/i },
    { name: 'Modal/Dialog', pattern: /modal|dialog|popup/i },
    { name: 'Dropdown', pattern: /dropdown|select.*option/i }
  ];
  
  interactivePatterns.forEach(pattern => {
    if (pattern.pattern.test(htmlContent)) {
      analysis.interactive_elements.push(pattern.name);
    }
  });
  
  return analysis;
}

async function testAPIEndpoints() {
  console.log('\\n=== Testing API Endpoints ===');
  
  const endpoints = [
    { path: '/beverages', name: 'Beverages API' },
    { path: '/cocktails', name: 'Cocktails API' },
    { path: '/wines', name: 'Wines API' },
    { path: '/spirits', name: 'Spirits API' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${API_BASE}${endpoint.path}`, { 
        timeout: 5000,
        validateStatus: function (status) {
          return status < 500;
        }
      });
      
      if (response.status === 200) {
        const dataLength = Array.isArray(response.data) ? response.data.length : 'unknown';
        logResult('api_endpoints', `${endpoint.name} functional`, 'PASS', 
          `Status: ${response.status}, Items: ${dataLength}`);
      } else {
        logResult('api_endpoints', `${endpoint.name} functional`, 'FAIL', 
          `Status: ${response.status}`);
      }
    } catch (error) {
      logResult('api_endpoints', `${endpoint.name} functional`, 'FAIL', 
        error.message);
    }
  }
}

async function generateDetailedReport() {
  console.log('\\n=== Generating Detailed Analysis Report ===');
  
  // Analyze navigation structure from DOM analysis
  const navigationAnalysis = {
    total_routes_tested: testResults.route_testing.filter(r => r.test.includes('Route')).length,
    accessible_routes: testResults.route_testing.filter(r => r.test.includes('Route') && r.status === 'PASS').length,
    total_interactive_elements: 0,
    pages_with_forms: 0,
    pages_with_buttons: 0
  };
  
  testResults.dom_analysis.forEach(page => {
    navigationAnalysis.total_interactive_elements += 
      (page.analysis.buttons || 0) + 
      (page.analysis.inputs || 0) + 
      (page.analysis.navigation_links || 0);
    
    if (page.analysis.forms > 0) navigationAnalysis.pages_with_forms++;
    if (page.analysis.buttons > 0) navigationAnalysis.pages_with_buttons++;
  });
  
  testResults.navigation_structure = navigationAnalysis;
  
  // Calculate success rate
  testResults.summary.success_rate = testResults.summary.total_tests > 0 
    ? (testResults.summary.passed / testResults.summary.total_tests * 100).toFixed(2)
    : 0;
  
  console.log('\\n🎯 === COMPREHENSIVE TEST ANALYSIS ===');
  console.log(`📊 Total Tests Executed: ${testResults.summary.total_tests}`);
  console.log(`✅ Tests Passed: ${testResults.summary.passed}`);
  console.log(`❌ Tests Failed: ${testResults.summary.failed}`);
  console.log(`📈 Overall Success Rate: ${testResults.summary.success_rate}%`);
  
  console.log('\\n📱 === APPLICATION STATUS ===');
  console.log(`Frontend Accessible: ${testResults.application_status.frontend_accessible ? '✅' : '❌'}`);
  console.log(`Backend Accessible: ${testResults.application_status.backend_accessible ? '✅' : '❌'}`);
  
  console.log('\\n🔗 === NAVIGATION ANALYSIS ===');
  console.log(`Routes Tested: ${navigationAnalysis.total_routes_tested}`);
  console.log(`Accessible Routes: ${navigationAnalysis.accessible_routes}`);
  console.log(`Pages with Forms: ${navigationAnalysis.pages_with_forms}`);
  console.log(`Pages with Buttons: ${navigationAnalysis.pages_with_buttons}`);
  console.log(`Total Interactive Elements: ${navigationAnalysis.total_interactive_elements}`);
  
  if (testResults.failures.length > 0) {
    console.log('\\n🚨 === CRITICAL ISSUES FOUND ===');
    testResults.failures.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.test}`);
      console.log(`   Category: ${failure.category || 'Unknown'}`);
      console.log(`   Details: ${failure.details}`);
      console.log('');
    });
    
    console.log('\\n📋 === RECOMMENDED ACTIONS ===');
    const recommendations = generateRecommendations(testResults.failures);
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
  
  console.log('\\n🔍 === PAGE-BY-PAGE ANALYSIS ===');
  testResults.dom_analysis.forEach(page => {
    console.log(`\\n📄 ${page.route}:`);
    console.log(`   Navigation Links: ${page.analysis.navigation_links}`);
    console.log(`   Buttons: ${page.analysis.buttons}`);
    console.log(`   Forms: ${page.analysis.forms}`);
    console.log(`   Input Fields: ${page.analysis.inputs}`);
    console.log(`   Interactive Elements: ${page.analysis.interactive_elements.join(', ') || 'None detected'}`);
  });
}

function generateRecommendations(failures) {
  const recommendations = [];
  const failureTypes = {};
  
  failures.forEach(failure => {
    if (failure.test.includes('Backend')) {
      failureTypes.backend = true;
    }
    if (failure.test.includes('Route')) {
      failureTypes.routing = true;
    }
    if (failure.test.includes('API')) {
      failureTypes.api = true;
    }
  });
  
  if (failureTypes.backend) {
    recommendations.push('Start the backend server (node server.js in /backend directory)');
    recommendations.push('Verify backend dependencies are installed (npm install in /backend)');
  }
  
  if (failureTypes.routing) {
    recommendations.push('Check React Router configuration in App.jsx');
    recommendations.push('Verify all route components exist and are properly imported');
  }
  
  if (failureTypes.api) {
    recommendations.push('Check API endpoint implementations in backend/routes/');
    recommendations.push('Verify database connection and data seeding');
  }
  
  if (failures.length > testResults.summary.passed) {
    recommendations.push('Consider running individual component tests to isolate issues');
    recommendations.push('Check browser console for JavaScript errors when testing manually');
  }
  
  return recommendations;
}

async function runComprehensiveTest() {
  console.log('🚀 Starting DOM Analysis and Interactive Elements Test...');
  console.log(`Testing application at: ${BASE_URL}`);
  
  try {
    // Install axios if not available
    try {
      require('axios');
    } catch (e) {
      console.log('Installing axios...');
      require('child_process').execSync('npm install axios', { stdio: 'inherit' });
    }
    
    await testApplicationAccessibility();
    await testRouteAccessibility();
    
    // Only test API if backend is accessible
    if (testResults.application_status.backend_accessible) {
      await testAPIEndpoints();
    }
    
    await generateDetailedReport();
    
    // Save results
    const resultsPath = path.join(__dirname, 'results', 'dom-analysis-results.json');
    await fs.promises.mkdir(path.dirname(resultsPath), { recursive: true });
    await fs.promises.writeFile(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\\n📄 Detailed results saved to: ${resultsPath}`);
    
    return testResults;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    return null;
  }
}

// Export for use in other scripts
module.exports = { runComprehensiveTest, testResults };

// Run if called directly
if (require.main === module) {
  runComprehensiveTest()
    .then(results => {
      if (results) {
        console.log('\\n✅ DOM Analysis completed!');
        console.log(`Success Rate: ${results.summary.success_rate}%`);
        process.exit(results.summary.failed > 0 ? 1 : 0);
      } else {
        console.log('\\n❌ Test execution failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Testing failed:', error);
      process.exit(1);
    });
}