/**
 * Performance Test Setup
 * Setup for benchmarking and performance validation
 */

import { jest } from '@jest/globals';

// Performance testing utilities
global.performanceUtils = {
  // Metrics collection
  metricsCollector: {
    metrics: new Map(),
    baselines: new Map(),
    
    startCollection: (testName) => {
      global.performanceUtils.metricsCollector.metrics.set(testName, {
        testName,
        startTime: performance.now(),
        endTime: null,
        memoryStart: global.performance.memory ? global.performance.memory.usedJSHeapSize : 0,
        memoryEnd: null,
        samples: [],
        customMetrics: {}
      });
    },
    
    addSample: (testName, sampleData) => {
      const test = global.performanceUtils.metricsCollector.metrics.get(testName);
      if (test) {
        test.samples.push({
          timestamp: performance.now() - test.startTime,
          ...sampleData
        });
      }
    },
    
    addCustomMetric: (testName, metricName, value) => {
      const test = global.performanceUtils.metricsCollector.metrics.get(testName);
      if (test) {
        test.customMetrics[metricName] = value;
      }
    },
    
    endCollection: (testName) => {
      const test = global.performanceUtils.metricsCollector.metrics.get(testName);
      if (test) {
        test.endTime = performance.now();
        test.duration = test.endTime - test.startTime;
        test.memoryEnd = global.performance.memory ? global.performance.memory.usedJSHeapSize : 0;
        test.memoryDelta = test.memoryEnd - test.memoryStart;
      }
      return test;
    },
    
    getResults: (testName) => {
      return global.performanceUtils.metricsCollector.metrics.get(testName);
    },
    
    setBaseline: (testName, baseline) => {
      global.performanceUtils.metricsCollector.baselines.set(testName, baseline);
    },
    
    compareToBaseline: (testName) => {
      const test = global.performanceUtils.metricsCollector.metrics.get(testName);
      const baseline = global.performanceUtils.metricsCollector.baselines.get(testName);
      
      if (!test || !baseline) return null;
      
      return {
        testName,
        current: test.duration,
        baseline: baseline.duration,
        improvement: ((baseline.duration - test.duration) / baseline.duration) * 100,
        memoryImprovement: ((baseline.memoryDelta - test.memoryDelta) / baseline.memoryDelta) * 100,
        passed: test.duration <= baseline.duration * 1.1 // Allow 10% regression
      };
    }
  },

  // FPS monitoring
  fpsMonitor: {
    start: (testName, duration = 5000) => {
      return new Promise((resolve) => {
        const frameRates = [];
        const startTime = performance.now();
        let lastFrameTime = startTime;
        let frameCount = 0;
        
        const measureFrame = () => {
          const currentTime = performance.now();
          const frameDelta = currentTime - lastFrameTime;
          
          if (frameDelta > 0) {
            frameRates.push(1000 / frameDelta);
          }
          
          lastFrameTime = currentTime;
          frameCount++;
          
          if (currentTime - startTime < duration) {
            requestAnimationFrame(measureFrame);
          } else {
            const avgFPS = frameRates.reduce((sum, fps) => sum + fps, 0) / frameRates.length;
            const minFPS = Math.min(...frameRates);
            const maxFPS = Math.max(...frameRates);
            const fpsVariance = frameRates.reduce((sum, fps) => sum + Math.pow(fps - avgFPS, 2), 0) / frameRates.length;
            
            resolve({
              testName,
              duration: currentTime - startTime,
              frameCount,
              frameRates,
              avgFPS,
              minFPS,
              maxFPS,
              fpsVariance,
              fpsStdDev: Math.sqrt(fpsVariance),
              consistency: Math.sqrt(fpsVariance) < 5 ? 'EXCELLENT' : Math.sqrt(fpsVariance) < 10 ? 'GOOD' : 'POOR'
            });
          }
        };
        
        measureFrame();
      });
    }
  },

  // Memory profiling
  memoryProfiler: {
    profile: (testName, testFunction, options = {}) => {
      const { iterations = 100, gcBetweenIterations = false } = options;
      const memorySnapshots = [];
      
      // Initial memory snapshot
      const initialMemory = global.performance.memory ? 
        global.performance.memory.usedJSHeapSize : process.memoryUsage().heapUsed;
      
      memorySnapshots.push({
        iteration: 0,
        memory: initialMemory,
        delta: 0
      });
      
      for (let i = 1; i <= iterations; i++) {
        // Run test function
        testFunction();
        
        // Force garbage collection if requested and available
        if (gcBetweenIterations && global.gc) {
          global.gc();
        }
        
        // Take memory snapshot
        const currentMemory = global.performance.memory ? 
          global.performance.memory.usedJSHeapSize : process.memoryUsage().heapUsed;
        
        memorySnapshots.push({
          iteration: i,
          memory: currentMemory,
          delta: currentMemory - initialMemory
        });
      }
      
      const finalMemory = memorySnapshots[memorySnapshots.length - 1].memory;
      const totalGrowth = finalMemory - initialMemory;
      const avgGrowthPerIteration = totalGrowth / iterations;
      
      // Detect potential memory leaks
      const growthTrend = memorySnapshots.slice(1).map((snapshot, index) => 
        snapshot.delta - (index === 0 ? 0 : memorySnapshots[index].delta)
      );
      
      const consistentGrowth = growthTrend.filter(growth => growth > 0).length / growthTrend.length;
      
      return {
        testName,
        iterations,
        initialMemory,
        finalMemory,
        totalGrowth,
        avgGrowthPerIteration,
        memorySnapshots,
        leakSuspected: consistentGrowth > 0.8 && totalGrowth > 10 * 1024 * 1024, // >80% growing iterations and >10MB growth
        leakSeverity: totalGrowth < 5 * 1024 * 1024 ? 'NONE' :
                      totalGrowth < 50 * 1024 * 1024 ? 'MINOR' :
                      totalGrowth < 200 * 1024 * 1024 ? 'MODERATE' : 'SEVERE'
      };
    }
  },

  // CPU profiling
  cpuProfiler: {
    profile: async (testName, testFunction, duration = 5000) => {
      const samples = [];
      const startTime = performance.now();
      
      // Sample CPU usage periodically
      const sampleInterval = setInterval(() => {
        const sampleStart = performance.now();
        
        // Run a standard CPU-intensive task to measure relative performance
        let iterations = 0;
        const testStart = performance.now();
        while (performance.now() - testStart < 10) { // 10ms of work
          Math.sin(iterations++);
        }
        
        const sampleEnd = performance.now();
        samples.push({
          timestamp: sampleStart - startTime,
          cpuTime: sampleEnd - sampleStart,
          iterations
        });
      }, 100); // Sample every 100ms
      
      // Run the actual test
      const testStart = performance.now();
      await testFunction();
      const testEnd = performance.now();
      
      clearInterval(sampleInterval);
      
      const avgCPUTime = samples.reduce((sum, s) => sum + s.cpuTime, 0) / samples.length;
      const maxCPUTime = Math.max(...samples.map(s => s.cpuTime));
      const minCPUTime = Math.min(...samples.map(s => s.cpuTime));
      
      return {
        testName,
        testDuration: testEnd - testStart,
        samples,
        avgCPUTime,
        maxCPUTime,
        minCPUTime,
        cpuEfficiency: minCPUTime / avgCPUTime, // Closer to 1 is more consistent
        performanceRating: avgCPUTime < 12 ? 'EXCELLENT' : avgCPUTime < 15 ? 'GOOD' : 'POOR'
      };
    }
  },

  // Benchmark comparison
  benchmarkComparison: {
    compare: (results, criteria = {}) => {
      const {
        fpsWeight = 0.3,
        memoryWeight = 0.3,
        cpuWeight = 0.2,
        consistencyWeight = 0.2
      } = criteria;
      
      const comparison = {};
      
      Object.keys(results).forEach(testName => {
        const result = results[testName];
        let score = 0;
        
        // FPS score (higher is better)
        if (result.avgFPS) {
          score += (Math.min(result.avgFPS, 120) / 120) * fpsWeight;
        }
        
        // Memory score (lower growth is better)
        if (result.memoryDelta !== undefined) {
          const memoryScore = Math.max(0, 1 - (result.memoryDelta / (100 * 1024 * 1024))); // Normalize to 100MB
          score += memoryScore * memoryWeight;
        }
        
        // CPU score (lower usage is better)
        if (result.avgCPUTime) {
          const cpuScore = Math.max(0, 1 - (result.avgCPUTime / 20)); // Normalize to 20ms
          score += cpuScore * cpuWeight;
        }
        
        // Consistency score
        if (result.fpsStdDev !== undefined) {
          const consistencyScore = Math.max(0, 1 - (result.fpsStdDev / 10)); // Normalize to 10fps stddev
          score += consistencyScore * consistencyWeight;
        }
        
        comparison[testName] = {
          ...result,
          score: score * 100, // Convert to 0-100 scale
          rating: score > 0.8 ? 'EXCELLENT' : score > 0.6 ? 'GOOD' : score > 0.4 ? 'ACCEPTABLE' : 'POOR'
        };
      });
      
      return comparison;
    }
  }
};

// Setup performance environment
beforeEach(() => {
  // Clear previous metrics
  global.performanceUtils.metricsCollector.metrics.clear();
  
  // Set performance baselines if they exist
  const baselines = {
    'basic_morph_animation': { duration: 16.67, memoryDelta: 1024 * 1024 }, // 60fps, 1MB
    'multiple_targets': { duration: 20, memoryDelta: 5 * 1024 * 1024 }, // 50fps, 5MB
    'complex_scene': { duration: 33.33, memoryDelta: 10 * 1024 * 1024 } // 30fps, 10MB
  };
  
  Object.keys(baselines).forEach(testName => {
    global.performanceUtils.metricsCollector.setBaseline(testName, baselines[testName]);
  });
});

// Performance test cleanup
afterEach(() => {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  // Clear any performance monitoring intervals
  jest.clearAllTimers();
});

console.log('✓ Performance test environment setup complete');