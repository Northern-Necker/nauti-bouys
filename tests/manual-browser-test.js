/**
 * Manual Browser Test - Component Analysis
 * This script analyzes the actual React component structure
 * and tests interactive elements manually
 */

const fs = require('fs');
const path = require('path');

// Component analysis results
let componentAnalysis = {
  timestamp: new Date().toISOString(),
  header_component: {
    navigation_links: [],
    mobile_menu: false,
    auth_buttons: []
  },
  page_components: {},
  form_analysis: {
    login_form: {},
    register_form: {}
  },
  interactive_elements: {
    buttons: [],
    inputs: [],
    dropdowns: [],
    modals: []
  },
  test_recommendations: [],
  critical_issues: [],
  summary: {
    total_components_analyzed: 0,
    functional_components: 0,
    components_with_issues: 0
  }
};

async function analyzeHeaderComponent() {
  console.log('\\n=== Analyzing Header Component ===');
  
  try {
    // Read Header component
    const headerPath = '/mnt/c/nauti-bouys/frontend/src/components/layout/Header.jsx';
    const headerContent = await fs.promises.readFile(headerPath, 'utf8');
    
    // Extract navigation items
    const navMatch = headerContent.match(/navigation = \\[(.*?)\\]/s);
    if (navMatch) {
      const navContent = navMatch[1];
      const navItems = navContent.match(/name: '(.*?)'/g);
      if (navItems) {
        componentAnalysis.header_component.navigation_links = navItems.map(item => 
          item.replace(/name: '|'/g, '')
        );
      }
    }
    
    // Check for mobile menu
    componentAnalysis.header_component.mobile_menu = headerContent.includes('isMenuOpen');
    
    // Check for auth buttons
    const authButtons = headerContent.match(/to="\/(login|register)"/g);
    if (authButtons) {
      componentAnalysis.header_component.auth_buttons = authButtons.map(btn => 
        btn.replace(/to="\/(.*?)"/, '$1')
      );
    }
    
    console.log(`✅ Header analysis completed`);
    console.log(`   Navigation links: ${componentAnalysis.header_component.navigation_links.length}`);
    console.log(`   Mobile menu: ${componentAnalysis.header_component.mobile_menu}`);
    console.log(`   Auth buttons: ${componentAnalysis.header_component.auth_buttons.length}`);
    
  } catch (error) {
    componentAnalysis.critical_issues.push({
      component: 'Header',
      issue: 'Analysis failed',
      details: error.message
    });
  }
}

async function analyzePageComponents() {
  console.log('\\n=== Analyzing Page Components ===');
  
  const pagesDir = '/mnt/c/nauti-bouys/frontend/src/pages';
  const componentDirs = [
    '/mnt/c/nauti-bouys/frontend/src/components/spirits',
    '/mnt/c/nauti-bouys/frontend/src/components/wines',
    '/mnt/c/nauti-bouys/frontend/src/components/cocktails',
    '/mnt/c/nauti-bouys/frontend/src/components/common'
  ];
  
  try {
    // Analyze main pages
    const pages = ['HomePage.jsx', 'CalendarPage.jsx', 'IAPage.jsx'];
    
    for (const page of pages) {
      try {
        const pagePath = path.join(pagesDir, page);
        const pageContent = await fs.promises.readFile(pagePath, 'utf8');
        
        const analysis = {
          has_form_elements: pageContent.includes('<form') || pageContent.includes('input'),
          has_buttons: pageContent.includes('<button') || pageContent.includes('btn'),
          has_interactive_components: pageContent.includes('onClick') || pageContent.includes('onChange'),
          imports_components: (pageContent.match(/import.*from/g) || []).length
        };
        
        componentAnalysis.page_components[page] = analysis;
        console.log(`✅ ${page}: Forms: ${analysis.has_form_elements}, Buttons: ${analysis.has_buttons}, Interactive: ${analysis.has_interactive_components}`);
        
      } catch (error) {
        console.log(`❌ ${page}: ${error.message}`);
      }
    }
    
    // Analyze beverage pages
    const beveragePages = [
      'beverages/BeveragesPage.jsx',
      'cocktails/CocktailsPage.jsx',
      'wines/WinesPage.jsx',
      'spirits/SpiritsPage.jsx'
    ];
    
    for (const page of beveragePages) {
      try {
        const pagePath = path.join(pagesDir, page);
        const pageContent = await fs.promises.readFile(pagePath, 'utf8');
        
        const analysis = {
          has_filters: pageContent.includes('Filter') || pageContent.includes('filter'),
          has_search: pageContent.includes('search') || pageContent.includes('Search'),
          has_pagination: pageContent.includes('pagination') || pageContent.includes('next') || pageContent.includes('prev'),
          uses_hooks: pageContent.includes('useState') || pageContent.includes('useEffect'),
          api_integration: pageContent.includes('api') || pageContent.includes('fetch') || pageContent.includes('axios')
        };
        
        componentAnalysis.page_components[page] = analysis;
        console.log(`✅ ${page}: Filters: ${analysis.has_filters}, Search: ${analysis.has_search}, API: ${analysis.api_integration}`);
        
      } catch (error) {
        console.log(`❌ ${page}: ${error.message}`);
      }
    }
    
  } catch (error) {
    componentAnalysis.critical_issues.push({
      component: 'Page Components',
      issue: 'Analysis failed',
      details: error.message
    });
  }
}

async function analyzeAuthForms() {
  console.log('\\n=== Analyzing Authentication Forms ===');
  
  const authPages = [
    { file: 'auth/LoginPage.jsx', type: 'login' },
    { file: 'auth/RegisterPage.jsx', type: 'register' }
  ];
  
  for (const authPage of authPages) {
    try {
      const pagePath = `/mnt/c/nauti-bouys/frontend/src/pages/${authPage.file}`;
      const pageContent = await fs.promises.readFile(pagePath, 'utf8');
      
      const analysis = {
        has_form_tag: pageContent.includes('<form'),
        has_email_input: pageContent.includes('email') || pageContent.includes('Email'),
        has_password_input: pageContent.includes('password') || pageContent.includes('Password'),
        has_submit_button: pageContent.includes('submit') || pageContent.includes('Submit'),
        has_validation: pageContent.includes('required') || pageContent.includes('validate'),
        uses_state: pageContent.includes('useState'),
        handles_submission: pageContent.includes('onSubmit') || pageContent.includes('handleSubmit')
      };
      
      componentAnalysis.form_analysis[`${authPage.type}_form`] = analysis;
      
      console.log(`✅ ${authPage.type} form analysis:`);
      console.log(`   Form tag: ${analysis.has_form_tag}`);
      console.log(`   Email input: ${analysis.has_email_input}`);
      console.log(`   Password input: ${analysis.has_password_input}`);
      console.log(`   Submit button: ${analysis.has_submit_button}`);
      console.log(`   Form handling: ${analysis.handles_submission}`);
      
    } catch (error) {
      componentAnalysis.critical_issues.push({
        component: `${authPage.type} form`,
        issue: 'Analysis failed',
        details: error.message
      });
    }
  }
}

async function analyzeInteractiveComponents() {
  console.log('\\n=== Analyzing Interactive Components ===');
  
  const componentDirs = [
    '/mnt/c/nauti-bouys/frontend/src/components/spirits',
    '/mnt/c/nauti-bouys/frontend/src/components/wines',
    '/mnt/c/nauti-bouys/frontend/src/components/cocktails',
    '/mnt/c/nauti-bouys/frontend/src/components/common',
    '/mnt/c/nauti-bouys/frontend/src/components/calendar'
  ];
  
  for (const dir of componentDirs) {
    try {
      const files = await fs.promises.readdir(dir);
      const jsxFiles = files.filter(f => f.endsWith('.jsx'));
      
      for (const file of jsxFiles) {
        try {
          const filePath = path.join(dir, file);
          const content = await fs.promises.readFile(filePath, 'utf8');
          
          // Analyze component for interactive elements
          const componentName = file.replace('.jsx', '');
          const interactiveAnalysis = {
            component: componentName,
            directory: path.basename(dir),
            has_buttons: content.includes('<button') || content.includes('Button'),
            has_inputs: content.includes('<input') || content.includes('<textarea') || content.includes('<select'),
            has_dropdowns: content.includes('dropdown') || content.includes('Dropdown') || content.includes('<select'),
            has_modals: content.includes('modal') || content.includes('Modal') || content.includes('dialog'),
            has_event_handlers: content.includes('onClick') || content.includes('onChange') || content.includes('onSubmit'),
            uses_state: content.includes('useState') || content.includes('useEffect')
          };
          
          if (Object.values(interactiveAnalysis).some(value => value === true)) {
            componentAnalysis.interactive_elements.buttons.push(interactiveAnalysis);
            console.log(`✅ ${componentName}: Interactive elements found`);
          }
          
        } catch (error) {
          console.log(`❌ Error reading ${file}: ${error.message}`);
        }
      }
      
    } catch (error) {
      // Directory might not exist
      console.log(`⚠️ Directory ${dir} not accessible: ${error.message}`);
    }
  }
}

async function generateTestRecommendations() {
  console.log('\\n=== Generating Test Recommendations ===');
  
  const recommendations = [];
  
  // Header navigation recommendations
  if (componentAnalysis.header_component.navigation_links.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Navigation',
      test: `Test all ${componentAnalysis.header_component.navigation_links.length} navigation links: ${componentAnalysis.header_component.navigation_links.join(', ')}`,
      method: 'E2E testing with Playwright or manual clicking'
    });
  }
  
  if (componentAnalysis.header_component.mobile_menu) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Mobile UX',
      test: 'Test mobile menu toggle functionality',
      method: 'Responsive testing - switch to mobile viewport and test menu'
    });
  }
  
  // Authentication recommendations
  Object.keys(componentAnalysis.form_analysis).forEach(formType => {
    const form = componentAnalysis.form_analysis[formType];
    if (form.has_form_tag) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Authentication',
        test: `Test ${formType} form submission and validation`,
        method: 'Fill form fields and test both valid and invalid submissions'
      });
    }
  });
  
  // Interactive components recommendations
  if (componentAnalysis.interactive_elements.buttons.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Interactive Elements',
      test: `Test interactive components in: ${componentAnalysis.interactive_elements.buttons.map(b => b.component).join(', ')}`,
      method: 'Manual testing of buttons, dropdowns, and form elements'
    });
  }
  
  // Page-specific recommendations
  Object.keys(componentAnalysis.page_components).forEach(page => {
    const pageData = componentAnalysis.page_components[page];
    if (pageData.has_filters || pageData.has_search) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Search & Filtering',
        test: `Test search and filter functionality on ${page}`,
        method: 'Enter search terms and use filters to verify results update'
      });
    }
  });
  
  componentAnalysis.test_recommendations = recommendations;
  
  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. [${rec.priority}] ${rec.category}: ${rec.test}`);
    console.log(`   Method: ${rec.method}\\n`);
  });
}

async function runManualComponentAnalysis() {
  console.log('🔍 Starting Manual Component Analysis...');
  
  try {
    await analyzeHeaderComponent();
    await analyzePageComponents();
    await analyzeAuthForms();
    await analyzeInteractiveComponents();
    await generateTestRecommendations();
    
    // Calculate summary
    componentAnalysis.summary = {
      total_components_analyzed: 
        Object.keys(componentAnalysis.page_components).length + 
        componentAnalysis.interactive_elements.buttons.length + 1, // +1 for header
      functional_components: 
        Object.values(componentAnalysis.page_components).filter(p => 
          p.has_buttons || p.has_form_elements || p.has_interactive_components
        ).length +
        (componentAnalysis.header_component.navigation_links.length > 0 ? 1 : 0),
      components_with_issues: componentAnalysis.critical_issues.length,
      total_test_recommendations: componentAnalysis.test_recommendations.length
    };
    
    console.log('\\n📊 === COMPONENT ANALYSIS SUMMARY ===');
    console.log(`📦 Total Components Analyzed: ${componentAnalysis.summary.total_components_analyzed}`);
    console.log(`✅ Functional Components: ${componentAnalysis.summary.functional_components}`);
    console.log(`❌ Components with Issues: ${componentAnalysis.summary.components_with_issues}`);
    console.log(`📋 Test Recommendations: ${componentAnalysis.summary.total_test_recommendations}`);
    
    if (componentAnalysis.critical_issues.length > 0) {
      console.log('\\n🚨 === CRITICAL ISSUES ===');
      componentAnalysis.critical_issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.component}: ${issue.issue}`);
        console.log(`   Details: ${issue.details}\\n`);
      });
    }
    
    // Save detailed results
    const resultsPath = path.join(__dirname, 'results', 'component-analysis-results.json');
    await fs.promises.mkdir(path.dirname(resultsPath), { recursive: true });
    await fs.promises.writeFile(resultsPath, JSON.stringify(componentAnalysis, null, 2));
    console.log(`📄 Component analysis results saved to: ${resultsPath}`);
    
    return componentAnalysis;
    
  } catch (error) {
    console.error('❌ Component analysis failed:', error.message);
    return null;
  }
}

// Export for use in other scripts
module.exports = { runManualComponentAnalysis, componentAnalysis };

// Run if called directly
if (require.main === module) {
  runManualComponentAnalysis()
    .then(results => {
      if (results) {
        console.log('\\n✅ Component analysis completed successfully!');
        console.log(`Found ${results.summary.total_test_recommendations} actionable test recommendations.`);
        process.exit(0);
      } else {
        console.log('\\n❌ Component analysis failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    });
}