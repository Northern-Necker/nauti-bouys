/**
 * End-to-End Test Setup
 * Setup for cross-framework testing and workflow validation
 */

import { jest } from '@jest/globals';

// E2E specific utilities
global.e2eUtils = {
  // Cross-framework coordination
  frameworkManager: {
    activeFrameworks: new Set(),
    
    register: (framework) => {
      global.e2eUtils.frameworkManager.activeFrameworks.add(framework);
    },
    
    unregister: (framework) => {
      global.e2eUtils.frameworkManager.activeFrameworks.delete(framework);
    },
    
    isActive: (framework) => {
      return global.e2eUtils.frameworkManager.activeFrameworks.has(framework);
    },
    
    getActive: () => {
      return Array.from(global.e2eUtils.frameworkManager.activeFrameworks);
    }
  },

  // Workflow orchestration
  workflowEngine: {
    workflows: new Map(),
    
    define: (name, steps) => {
      global.e2eUtils.workflowEngine.workflows.set(name, {
        name,
        steps,
        status: 'defined',
        results: []
      });
    },
    
    execute: async (name) => {
      const workflow = global.e2eUtils.workflowEngine.workflows.get(name);
      if (!workflow) throw new Error(`Workflow ${name} not found`);
      
      workflow.status = 'running';
      workflow.results = [];
      
      for (const step of workflow.steps) {
        try {
          const result = await step();
          workflow.results.push({ success: true, result });
        } catch (error) {
          workflow.results.push({ success: false, error: error.message });
          workflow.status = 'failed';
          return workflow;
        }
      }
      
      workflow.status = 'completed';
      return workflow;
    }
  },

  // Test reporting
  reporter: {
    reports: new Map(),
    
    startReport: (name) => {
      global.e2eUtils.reporter.reports.set(name, {
        name,
        startTime: Date.now(),
        endTime: null,
        sections: [],
        status: 'running'
      });
    },
    
    addSection: (reportName, sectionName, data) => {
      const report = global.e2eUtils.reporter.reports.get(reportName);
      if (report) {
        report.sections.push({
          name: sectionName,
          timestamp: Date.now(),
          data
        });
      }
    },
    
    finishReport: (reportName, status = 'completed') => {
      const report = global.e2eUtils.reporter.reports.get(reportName);
      if (report) {
        report.endTime = Date.now();
        report.duration = report.endTime - report.startTime;
        report.status = status;
      }
      return report;
    },
    
    generateSummary: (reportName) => {
      const report = global.e2eUtils.reporter.reports.get(reportName);
      if (!report) return null;
      
      return {
        name: report.name,
        duration: report.duration,
        sections: report.sections.length,
        status: report.status,
        summary: `Report "${report.name}" completed in ${report.duration}ms with ${report.sections.length} sections`
      };
    }
  },

  // Visual comparison utilities
  visualComparison: {
    compareFrameworks: (frameworks, criteria) => {
      const comparison = {
        frameworks,
        criteria,
        results: {},
        winner: null,
        scores: {}
      };
      
      frameworks.forEach(framework => {
        let score = 0;
        const results = {};
        
        Object.keys(criteria).forEach(criterion => {
          const value = criteria[criterion][framework] || 0;
          results[criterion] = value;
          score += value;
        });
        
        comparison.results[framework] = results;
        comparison.scores[framework] = score;
      });
      
      // Find winner (highest score)
      comparison.winner = Object.keys(comparison.scores).reduce((winner, framework) =>
        comparison.scores[framework] > comparison.scores[winner] ? framework : winner
      );
      
      return comparison;
    },
    
    generateMetricsTable: (metrics) => {
      const table = {
        headers: ['Framework', ...Object.keys(metrics[Object.keys(metrics)[0]])],
        rows: []
      };
      
      Object.keys(metrics).forEach(framework => {
        const row = [framework];
        Object.keys(metrics[framework]).forEach(metric => {
          row.push(metrics[framework][metric]);
        });
        table.rows.push(row);
      });
      
      return table;
    }
  },

  // Mock screenshot generation
  screenshot: {
    capture: jest.fn().mockImplementation((framework, morphState) => {
      return {
        framework,
        morphState,
        timestamp: Date.now(),
        filename: `${framework}-${morphState.description}-${Date.now()}.png`,
        dimensions: { width: 1920, height: 1080 },
        fileSize: Math.floor(Math.random() * 1024 * 1024) + 100000 // 100KB - 1MB
      };
    }),
    
    compare: jest.fn().mockImplementation((screenshot1, screenshot2) => {
      return {
        similarity: 0.95 + Math.random() * 0.05, // 95-100% similarity
        differences: Math.floor(Math.random() * 100), // 0-100 pixel differences
        passed: true
      };
    })
  }
};

// Mock all framework setups for E2E tests
beforeEach(() => {
  // Register all frameworks
  global.e2eUtils.frameworkManager.register('threejs');
  global.e2eUtils.frameworkManager.register('babylonjs');
  global.e2eUtils.frameworkManager.register('unity');
  
  // Setup framework-specific mocks if utilities exist
  if (global.threeUtils) {
    const { Scene, PerspectiveCamera, WebGLRenderer } = require('three');
    global.threeUtils.mockScene = new Scene();
    global.threeUtils.mockCamera = new PerspectiveCamera(75, 1, 0.1, 1000);
    global.threeUtils.mockRenderer = new WebGLRenderer({ 
      canvas: global.testUtils.createMockCanvas() 
    });
  }
  
  if (global.babylonUtils) {
    const { Engine, Scene } = require('@babylonjs/core');
    const mockCanvas = global.testUtils.createMockCanvas();
    global.babylonUtils.mockEngine = new Engine(mockCanvas, true);
    global.babylonUtils.mockScene = new Scene(global.babylonUtils.mockEngine);
  }
  
  if (global.unityUtils) {
    // Reset Unity instance state
    Object.keys(global.unityInstance.gameObjects).forEach(objName => {
      const obj = global.unityInstance.gameObjects[objName];
      obj.influences.fill(0);
      obj.isActive = true;
    });
  }
});

afterEach(() => {
  // Clear framework registrations
  global.e2eUtils.frameworkManager.activeFrameworks.clear();
  
  // Clear workflows and reports
  global.e2eUtils.workflowEngine.workflows.clear();
  global.e2eUtils.reporter.reports.clear();
});

console.log('✓ E2E test environment setup complete');