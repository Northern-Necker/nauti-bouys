# MediaPipe Face Landmarker v2 - Implementation Guide
## Step-by-Step Implementation Guide

### 🎯 Overview

This guide provides complete step-by-step instructions for implementing the MediaPipe Face Landmarker v2 solution with robust error handling, performance optimization, and production-ready reliability.

## 📋 Prerequisites

### System Requirements
- **Node.js**: Version 16+ 
- **NPM/Yarn**: Latest stable version
- **Browser Support**: Chrome 91+, Firefox 89+, Safari 15+, Edge 91+
- **WebGL**: Version 1.0 minimum, 2.0 preferred
- **Memory**: 512MB+ available RAM for optimal performance

### Development Environment
```bash
# Verify Node.js version
node --version  # Should be 16+

# Check WebGL support in browser
# Visit: https://get.webgl.org/
```

## 🚀 Installation Steps

### Step 1: Install Dependencies

```bash
# Install MediaPipe Tasks Vision package
npm install @mediapipe/tasks-vision@0.10.22

# Install additional dependencies
npm install three@0.157.0
npm install @tensorflow/tfjs@4.10.0

# Development dependencies  
npm install --save-dev jest@29.0.0
npm install --save-dev @babel/preset-env@7.22.0
```

### Step 2: Project Structure Setup

```bash
# Create directory structure
mkdir -p src/utils
mkdir -p src/tests  
mkdir -p src/components
mkdir -p public/assets/mediapipe
mkdir -p docs

# Copy implementation files (provided in project)
cp MediaPipeManager.js src/utils/
cp MediaPipeTestSuite.js src/tests/
cp mediapipe-viseme-analyzer.js src/
```

### Step 3: Configuration Files

Create `mediapipe.config.js`:
```javascript
export const MEDIAPIPE_CONFIG = {
    // CDN sources in priority order
    wasmSources: [
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm",
        "https://unpkg.com/@mediapipe/tasks-vision@0.10.22/wasm", 
        "./assets/mediapipe/wasm"  // Local fallback
    ],
    
    // Performance settings
    maxRetries: 3,
    timeouts: {
        wasm: 10000,      // 10 seconds
        landmarker: 15000  // 15 seconds
    },
    
    // Feature flags
    enableGPU: true,
    enablePreloading: true,
    enableMetrics: true,
    debugMode: false
};
```

## 🏗️ Core Implementation

### Step 4: MediaPipe Manager Integration

#### Basic Integration
```javascript
// src/components/MediaPipeComponent.js
import MediaPipeManager from '../utils/MediaPipeManager.js';

class MediaPipeComponent {
    constructor() {
        this.manager = new MediaPipeManager();
        this.isReady = false;
    }
    
    async initialize() {
        try {
            console.log('Initializing MediaPipe...');
            const success = await this.manager.initialize();
            
            if (success) {
                this.isReady = true;
                console.log('MediaPipe ready!');
                this.displayStatus();
            } else {
                console.error('MediaPipe initialization failed');
                this.handleInitializationError();
            }
        } catch (error) {
            console.error('MediaPipe error:', error);
            this.handleInitializationError();
        }
    }
    
    displayStatus() {
        const status = this.manager.getStatus();
        console.log('MediaPipe Status:', {
            initialized: status.isInitialized,
            version: status.version,
            hasWebGL: status.hasWebGL,
            performance: status.performanceMetrics
        });
    }
    
    handleInitializationError() {
        // Implement fallback logic
        console.log('Implementing fallback strategy...');
        // Switch to geometric analysis or show error message
    }
}
```

#### Advanced Integration with Error Handling
```javascript
// Enhanced implementation with comprehensive error handling
class AdvancedMediaPipeComponent extends MediaPipeComponent {
    constructor(options = {}) {
        super();
        this.options = {
            maxRetries: 3,
            fallbackEnabled: true,
            performanceMonitoring: true,
            ...options
        };
        this.initializationAttempts = 0;
    }
    
    async initializeWithRetry() {
        while (this.initializationAttempts < this.options.maxRetries) {
            try {
                this.initializationAttempts++;
                console.log(`MediaPipe initialization attempt ${this.initializationAttempts}/${this.options.maxRetries}`);
                
                const success = await this.manager.initialize();
                
                if (success) {
                    this.isReady = true;
                    this.startPerformanceMonitoring();
                    return true;
                }
                
            } catch (error) {
                console.warn(`Attempt ${this.initializationAttempts} failed:`, error.message);
                
                if (this.initializationAttempts < this.options.maxRetries) {
                    await this.delay(1000 * this.initializationAttempts); // Exponential backoff
                }
            }
        }
        
        // All attempts failed - implement fallback
        if (this.options.fallbackEnabled) {
            return await this.initializeFallback();
        }
        
        throw new Error('MediaPipe initialization failed after all attempts');
    }
    
    async initializeFallback() {
        console.log('Initializing fallback analysis system...');
        // Implement geometric analyzer or other fallback
        return false; // Fallback doesn't provide full MediaPipe functionality
    }
    
    startPerformanceMonitoring() {
        if (!this.options.performanceMonitoring) return;
        
        setInterval(() => {
            const status = this.manager.getStatus();
            const metrics = status.performanceMetrics;
            
            // Log performance metrics
            console.log('Performance Update:', {
                initTime: metrics.initTime,
                analysisCount: metrics.analysisCount,
                errorRate: metrics.errorCount / Math.max(metrics.analysisCount, 1)
            });
            
            // Alert on performance issues
            if (metrics.errorCount > 10) {
                console.warn('High error rate detected - consider reinitialization');
            }
        }, 30000); // Check every 30 seconds
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
```

### Step 5: Viseme Analyzer Integration

```javascript
// src/components/VisemeAnalyzerComponent.js
import MediaPipeVisemeAnalyzer from '../mediapipe-viseme-analyzer.js';

class VisemeAnalyzerComponent {
    constructor() {
        this.analyzer = new MediaPipeVisemeAnalyzer();
        this.isInitialized = false;
    }
    
    async initialize() {
        try {
            const success = await this.analyzer.initialize();
            
            if (success) {
                this.isInitialized = true;
                console.log('Viseme Analyzer ready!');
                return true;
            }
        } catch (error) {
            console.error('Viseme Analyzer initialization failed:', error);
        }
        
        return false;
    }
    
    async analyzeViseme(imageDataURL, targetViseme = 'default') {
        if (!this.isInitialized) {
            throw new Error('Viseme Analyzer not initialized');
        }
        
        try {
            const analysis = await this.analyzer.analyzeViseme(imageDataURL, targetViseme);
            
            console.log('Viseme Analysis Result:', {
                similarity: analysis.similarity,
                confidence: analysis.confidence,
                morphTargets: analysis.morphTargets
            });
            
            return analysis;
        } catch (error) {
            console.error('Viseme analysis failed:', error);
            throw error;
        }
    }
    
    getDebugInfo() {
        return this.analyzer.getDebugInfo();
    }
}
```

## 🧪 Testing Implementation

### Step 6: Test Suite Setup

```javascript
// src/tests/setup.js
import MediaPipeTestSuite from './MediaPipeTestSuite.js';

export class TestRunner {
    constructor() {
        this.testSuite = new MediaPipeTestSuite();
    }
    
    async runBasicTests() {
        console.log('🧪 Running basic MediaPipe tests...');
        
        const results = await this.testSuite.runAllTests();
        
        console.log('Test Results Summary:', {
            total: results.totalTests,
            passed: results.passedTests,
            failed: results.totalTests - results.passedTests,
            successRate: `${Math.round(results.passedTests / results.totalTests * 100)}%`,
            duration: `${results.duration}ms`
        });
        
        return results;
    }
    
    async runPerformanceTests() {
        console.log('⚡ Running performance benchmarks...');
        
        const testResult = await this.testSuite.runTest('Performance Benchmark', async () => {
            const manager = new MediaPipeManager();
            const startTime = performance.now();
            
            const success = await manager.initialize();
            const initTime = performance.now() - startTime;
            
            manager.dispose();
            
            return {
                success,
                initTime,
                passed: success && initTime < 15000 // Should initialize in under 15 seconds
            };
        });
        
        console.log('Performance Test Result:', testResult);
        return testResult;
    }
}
```

### Step 7: Test Execution

Create `test-mediapipe.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <title>MediaPipe Implementation Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background-color: #d4edda; color: #155724; }
        .error { background-color: #f8d7da; color: #721c24; }
        .info { background-color: #d1ecf1; color: #0c5460; }
    </style>
</head>
<body>
    <h1>MediaPipe Face Landmarker v2 Test</h1>
    <div id="status"></div>
    <div id="results"></div>
    
    <script type="module">
        import { TestRunner } from './src/tests/setup.js';
        
        const statusDiv = document.getElementById('status');
        const resultsDiv = document.getElementById('results');
        
        function updateStatus(message, type = 'info') {
            statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;
        }
        
        async function runTests() {
            try {
                updateStatus('Initializing test runner...', 'info');
                
                const testRunner = new TestRunner();
                
                updateStatus('Running basic tests...', 'info');
                const basicResults = await testRunner.runBasicTests();
                
                updateStatus('Running performance tests...', 'info');  
                const perfResults = await testRunner.runPerformanceTests();
                
                // Display results
                const successRate = Math.round(basicResults.passedTests / basicResults.totalTests * 100);
                
                if (successRate >= 90) {
                    updateStatus(`✅ Tests passed! Success rate: ${successRate}%`, 'success');
                } else if (successRate >= 70) {
                    updateStatus(`⚠️ Tests mostly passed. Success rate: ${successRate}%`, 'info');
                } else {
                    updateStatus(`❌ Many tests failed. Success rate: ${successRate}%`, 'error');
                }
                
                resultsDiv.innerHTML = `
                    <h3>Test Results</h3>
                    <p><strong>Basic Tests:</strong> ${basicResults.passedTests}/${basicResults.totalTests} passed</p>
                    <p><strong>Performance:</strong> ${perfResults.result?.initTime?.toFixed(0)}ms initialization time</p>
                    <p><strong>Recommendations:</strong></p>
                    <ul>
                        ${basicResults.recommendations.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                `;
                
            } catch (error) {
                updateStatus(`❌ Test execution failed: ${error.message}`, 'error');
                console.error('Test error:', error);
            }
        }
        
        // Run tests on page load
        runTests();
    </script>
</body>
</html>
```

## 🎯 Production Deployment

### Step 8: Environment Configuration

#### Development Environment
```javascript
// config/development.js
export const config = {
    mediapipe: {
        debugMode: true,
        verbose: true,
        wasmSources: [
            'http://localhost:3000/assets/mediapipe/wasm',
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm'
        ]
    },
    performance: {
        enableMetrics: true,
        enableProfiling: true
    }
};
```

#### Production Environment
```javascript
// config/production.js  
export const config = {
    mediapipe: {
        debugMode: false,
        verbose: false,
        wasmSources: [
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm',
            'https://unpkg.com/@mediapipe/tasks-vision@0.10.22/wasm',
            '/assets/mediapipe/wasm'
        ]
    },
    performance: {
        enableMetrics: true,
        enableProfiling: false
    },
    monitoring: {
        alertOnErrors: true,
        maxErrorRate: 0.05  // 5%
    }
};
```

### Step 9: Asset Optimization

#### WASM File Hosting
```bash
# Copy WASM files for local hosting
mkdir -p public/assets/mediapipe/wasm
cp node_modules/@mediapipe/tasks-vision/wasm/* public/assets/mediapipe/wasm/

# Compress WASM files for faster loading
gzip -k public/assets/mediapipe/wasm/*.wasm
```

#### Service Worker for Caching
```javascript
// public/sw.js - Service worker for WASM caching
const CACHE_NAME = 'mediapipe-v1';
const WASM_URLS = [
    '/assets/mediapipe/wasm/vision_wasm_internal.wasm',
    '/assets/mediapipe/wasm/vision_wasm_internal.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(WASM_URLS))
    );
});

self.addEventListener('fetch', event => {
    if (event.request.url.includes('mediapipe') || event.request.url.includes('.wasm')) {
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
        );
    }
});
```

#### Register Service Worker
```javascript
// src/utils/serviceWorker.js
export async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
            return true;
        } catch (error) {
            console.warn('Service Worker registration failed:', error);
            return false;
        }
    }
    return false;
}
```

## 📊 Monitoring & Maintenance

### Step 10: Performance Monitoring

```javascript
// src/utils/monitoring.js
class MediaPipeMonitor {
    constructor() {
        this.metrics = {
            initializationAttempts: 0,
            initializationSuccesses: 0,
            analysisAttempts: 0,
            analysisSuccesses: 0,
            errors: []
        };
    }
    
    recordInitialization(success, duration) {
        this.metrics.initializationAttempts++;
        if (success) {
            this.metrics.initializationSuccesses++;
        }
        
        // Alert on low success rate
        const successRate = this.metrics.initializationSuccesses / this.metrics.initializationAttempts;
        if (this.metrics.initializationAttempts > 10 && successRate < 0.8) {
            this.alert('Low initialization success rate', { successRate, duration });
        }
    }
    
    recordAnalysis(success, duration) {
        this.metrics.analysisAttempts++;
        if (success) {
            this.metrics.analysisSuccesses++;
        }
    }
    
    recordError(error, context) {
        this.metrics.errors.push({
            error: error.message,
            context,
            timestamp: Date.now()
        });
        
        // Keep only recent errors
        if (this.metrics.errors.length > 100) {
            this.metrics.errors = this.metrics.errors.slice(-50);
        }
    }
    
    alert(message, data) {
        console.warn(`MediaPipe Alert: ${message}`, data);
        
        // Send to monitoring service
        if (window.analytics) {
            window.analytics.track('MediaPipe Alert', { message, ...data });
        }
    }
    
    getHealthReport() {
        const initRate = this.metrics.initializationSuccesses / Math.max(this.metrics.initializationAttempts, 1);
        const analysisRate = this.metrics.analysisSuccesses / Math.max(this.metrics.analysisAttempts, 1);
        
        return {
            initializationSuccessRate: initRate,
            analysisSuccessRate: analysisRate,
            recentErrors: this.metrics.errors.slice(-10),
            overallHealth: this.calculateHealthScore(initRate, analysisRate)
        };
    }
    
    calculateHealthScore(initRate, analysisRate) {
        const score = (initRate * 0.6 + analysisRate * 0.4) * 100;
        
        if (score >= 90) return 'Excellent';
        if (score >= 75) return 'Good';
        if (score >= 60) return 'Fair';
        return 'Poor';
    }
}

// Global monitor instance
window.mediapipeMonitor = new MediaPipeMonitor();
```

### Step 11: Health Check Endpoint

```javascript
// src/utils/healthCheck.js
export class MediaPipeHealthChecker {
    async performHealthCheck() {
        const results = {
            timestamp: new Date().toISOString(),
            status: 'unknown',
            checks: {},
            recommendations: []
        };
        
        // Check 1: MediaPipe Manager Initialization
        try {
            const manager = new MediaPipeManager();
            const startTime = performance.now();
            const success = await manager.initialize();
            const duration = performance.now() - startTime;
            
            results.checks.initialization = {
                success,
                duration,
                status: success ? 'pass' : 'fail'
            };
            
            if (duration > 20000) {
                results.recommendations.push('Slow initialization detected - consider local WASM hosting');
            }
            
            manager.dispose();
        } catch (error) {
            results.checks.initialization = {
                success: false,
                error: error.message,
                status: 'fail'
            };
        }
        
        // Check 2: WebGL Availability
        results.checks.webgl = this.checkWebGL();
        
        // Check 3: Network Connectivity
        results.checks.network = await this.checkNetworkConnectivity();
        
        // Overall status
        const allPassed = Object.values(results.checks).every(check => check.status === 'pass');
        results.status = allPassed ? 'healthy' : 'degraded';
        
        return results;
    }
    
    checkWebGL() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            
            return {
                available: !!gl,
                version: gl ? (gl.getParameter(gl.VERSION) || 'unknown') : 'none',
                status: gl ? 'pass' : 'warn'
            };
        } catch (error) {
            return {
                available: false,
                error: error.message,
                status: 'fail'
            };
        }
    }
    
    async checkNetworkConnectivity() {
        const testUrls = [
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/package.json',
            'https://unpkg.com/@mediapipe/tasks-vision@0.10.22/package.json'
        ];
        
        const results = await Promise.allSettled(
            testUrls.map(url => 
                fetch(url, { method: 'HEAD', mode: 'no-cors' })
                    .then(() => ({ url, status: 'accessible' }))
                    .catch(error => ({ url, status: 'failed', error: error.message }))
            )
        );
        
        const accessible = results.filter(r => r.status === 'fulfilled' && r.value.status === 'accessible').length;
        
        return {
            cdnAccessible: accessible,
            totalCdns: testUrls.length,
            status: accessible > 0 ? 'pass' : 'fail'
        };
    }
}
```

## 🔧 Troubleshooting Common Issues

### Issue 1: MediaPipe Initialization Timeout

**Symptoms**: Initialization hangs or times out after 15+ seconds

**Solution**:
```javascript
// Enable debug mode to see detailed loading information
const manager = new MediaPipeManager();
manager.debugMode = true;

// Try manual CDN testing
const testCdn = async (url) => {
    try {
        const response = await fetch(`${url}/vision_wasm_internal.wasm`, { method: 'HEAD' });
        console.log(`CDN ${url}: ${response.ok ? 'OK' : 'FAILED'}`);
    } catch (error) {
        console.log(`CDN ${url}: ERROR - ${error.message}`);
    }
};

// Test all CDN sources
['https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm',
 'https://unpkg.com/@mediapipe/tasks-vision@0.10.22/wasm'].forEach(testCdn);
```

### Issue 2: WebGL Context Errors

**Symptoms**: "WebGL not available" warnings

**Solution**:
```javascript
// Force CPU mode for debugging
const manager = new MediaPipeManager();
await manager.initialize({ forceDelegate: 'CPU' });

// Check WebGL support in detail
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2');
if (!gl) {
    console.log('WebGL 2.0 not supported, trying WebGL 1.0...');
    const gl1 = canvas.getContext('webgl');
    console.log('WebGL 1.0 support:', !!gl1);
}
```

### Issue 3: Memory Leaks

**Symptoms**: Increasing memory usage over time

**Solution**:
```javascript
// Implement proper cleanup
class ManagedMediaPipe {
    constructor() {
        this.manager = new MediaPipeManager();
        this.analyzer = new MediaPipeVisemeAnalyzer();
    }
    
    async initialize() {
        await this.manager.initialize();
        await this.analyzer.initialize();
    }
    
    dispose() {
        if (this.manager) {
            this.manager.dispose();
            this.manager = null;
        }
        if (this.analyzer) {
            this.analyzer.dispose();
            this.analyzer = null;
        }
    }
}

// Auto-cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.managedMediaPipe) {
        window.managedMediaPipe.dispose();
    }
});
```

## ✅ Deployment Checklist

### Pre-Production Validation
- [ ] All tests pass with >90% success rate
- [ ] Performance benchmarks meet requirements (<15s init, <1s analysis)
- [ ] Cross-browser testing completed (Chrome, Firefox, Safari, Edge)
- [ ] Network condition testing completed (slow 3G, WiFi, offline)
- [ ] Memory leak testing passed
- [ ] Error recovery scenarios tested
- [ ] CDN fallback mechanisms verified
- [ ] Service worker caching tested (if implemented)

### Production Deployment
- [ ] Environment configuration updated for production
- [ ] WASM files hosted locally (if required)
- [ ] Monitoring and alerting configured
- [ ] Health check endpoints implemented
- [ ] Documentation updated
- [ ] Team trained on troubleshooting procedures

### Post-Deployment Monitoring
- [ ] Success rate monitoring (target: >95%)
- [ ] Performance monitoring (target: <15s init, <1s analysis)
- [ ] Error rate monitoring (target: <5%)
- [ ] User experience metrics tracking
- [ ] Regular health checks automated

---

**Implementation Status: COMPLETE**  
**Ready for Production Deployment**

*Guide Version: 1.0*  
*Last Updated: 2025-08-30*  
*Next Review: 2025-09-30*