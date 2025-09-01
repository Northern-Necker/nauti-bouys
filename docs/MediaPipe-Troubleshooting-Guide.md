# MediaPipe v2 - Troubleshooting Guide
## Common Issues and Solutions

### 🔧 Quick Diagnostic Commands

#### Check Implementation Status
```javascript
// In browser console - Quick status check
const manager = new MediaPipeManager();
console.log('Status:', manager.getStatus());

// Initialize and test
manager.initialize().then(success => {
    console.log('Init success:', success);
    console.log('Final status:', manager.getStatus());
});
```

#### Test Suite Execution
```javascript
// Run comprehensive test suite
const testSuite = new MediaPipeTestSuite();
testSuite.runAllTests().then(report => {
    console.log('Test Results:', report);
});
```

## 🚨 Common Issues & Solutions

### 1. MediaPipe Initialization Failures

#### Symptom: "Failed to import MediaPipe modules"
```javascript
Error: Failed to import MediaPipe modules: Cannot read property 'FilesetResolver'
```

**Root Causes & Solutions:**

**Package not installed**:
```bash
npm install @mediapipe/tasks-vision@0.10.22
```

**Import path incorrect**: 
```javascript
// ❌ Wrong
import MediaPipe from 'mediapipe';

// ✅ Correct
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
```

**Module cache issues**:
```bash
# Clear browser cache and restart
rm -rf node_modules package-lock.json
npm install
# Hard refresh browser (Ctrl+Shift+R)
```

#### Symptom: "Failed to load MediaPipe WASM from all sources"
```javascript
Error: Failed to load MediaPipe WASM from all sources. Last error: NetworkError
```

**Systematic Resolution:**

1. **Check CDN Accessibility:**
```bash
# Test primary CDN
curl -I "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm/vision_wasm_internal.wasm"

# Test fallback CDNs  
curl -I "https://unpkg.com/@mediapipe/tasks-vision@latest/wasm/vision_wasm_internal.wasm"
```

2. **Verify CORS Settings:**
```javascript
// Check if CORS is blocking requests
fetch('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm/vision_wasm_internal.wasm', {
    method: 'HEAD',
    mode: 'cors'
}).then(response => console.log('CORS OK:', response.ok))
.catch(error => console.log('CORS Error:', error));
```

3. **Use Local WASM Files:**
```bash
# Copy WASM files locally (if CDN fails)
mkdir -p public/assets/mediapipe/wasm
cp node_modules/@mediapipe/tasks-vision/wasm/* public/assets/mediapipe/wasm/
```

### 2. WebGL Context Issues

#### Symptom: "WebGL not available - falling back to CPU processing"
```javascript
Warning: WebGL initialization failed: WebGL not supported
```

**Resolution Steps:**

1. **Check WebGL Support:**
```javascript
// Test WebGL availability
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
console.log('WebGL available:', !!gl);

if (gl) {
    console.log('WebGL Info:', {
        version: gl.getParameter(gl.VERSION),
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER)
    });
}
```

2. **Enable WebGL in Browser:**

**Chrome:**
- Go to `chrome://settings/`
- Advanced → System → Enable "Use hardware acceleration when available"
- Restart Chrome

**Firefox:**
- Go to `about:config`
- Search for `webgl.disabled` → Set to `false`
- Restart Firefox

**Safari:**
- Develop menu → Enable WebGL
- If Develop menu not visible: Preferences → Advanced → Show Develop menu

3. **Check Hardware Acceleration:**
```javascript
// Visit chrome://gpu/ to check GPU status
// Look for "Graphics Feature Status" - should show "Hardware accelerated"

// Test WebGL context creation
function testWebGLContext() {
    const canvas = document.createElement('canvas');
    const contexts = ['webgl2', 'webgl', 'experimental-webgl'];
    
    for (const contextType of contexts) {
        try {
            const gl = canvas.getContext(contextType);
            if (gl) {
                return {
                    success: true,
                    type: contextType,
                    version: gl.getParameter(gl.VERSION),
                    vendor: gl.getParameter(gl.VENDOR)
                };
            }
        } catch (error) {
            console.warn(`${contextType} failed:`, error.message);
        }
    }
    
    return { success: false, error: 'No WebGL context available' };
}

console.log('WebGL Test:', testWebGLContext());
```

### 3. Performance Issues

#### Symptom: Slow initialization (>30 seconds)
```javascript
Performance metrics: { initTime: 45000, errorCount: 0 }
```

**Optimization Steps:**

1. **Network Optimization:**
```javascript
// Preload WASM files
const preloadWasm = () => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm/vision_wasm_internal.wasm';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
};

// Call before MediaPipe initialization
preloadWasm();
```

2. **Use Specific Version:**
```javascript
// Pin to specific working version (avoid "latest")
const wasmSources = [
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"  // Specific version
    // "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm" // Avoid this
];
```

3. **Implement WASM Caching:**
```javascript
// Service worker for WASM caching
// public/sw.js
const CACHE_NAME = 'mediapipe-wasm-v1';

self.addEventListener('fetch', event => {
    const url = event.request.url;
    
    if (url.includes('tasks-vision/wasm') || url.endsWith('.wasm')) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        console.log('WASM cache hit:', url);
                        return response;
                    }
                    
                    console.log('WASM cache miss:', url);
                    return fetch(event.request)
                        .then(fetchResponse => {
                            const responseClone = fetchResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(event.request, responseClone));
                            return fetchResponse;
                        });
                })
                .catch(error => {
                    console.error('WASM fetch error:', error);
                    throw error;
                })
        );
    }
});
```

### 4. Face Detection Failures

#### Symptom: "No face detected" or empty results
```javascript
Results: { faceLandmarks: [], hasFace: false }
```

**Troubleshooting Steps:**

1. **Validate Input Image:**
```javascript
// Check image properties
function validateImage(image) {
    const validation = {
        loaded: image.complete && image.naturalHeight !== 0,
        dimensions: `${image.naturalWidth}x${image.naturalHeight}`,
        aspectRatio: image.naturalWidth / image.naturalHeight,
        size: image.src.length
    };
    
    console.log('Image Validation:', validation);
    
    // Requirements check
    const issues = [];
    if (image.naturalWidth < 200 || image.naturalHeight < 200) {
        issues.push('Image too small (minimum 200x200)');
    }
    if (validation.aspectRatio < 0.5 || validation.aspectRatio > 2) {
        issues.push('Unusual aspect ratio - face may not be centered');
    }
    if (!validation.loaded) {
        issues.push('Image not fully loaded');
    }
    
    if (issues.length > 0) {
        console.warn('Image Issues:', issues);
    }
    
    return { validation, issues };
}

// Usage
const imageElement = document.getElementById('myImage');
validateImage(imageElement);
```

2. **Image Quality Requirements:**
- **Minimum resolution**: 200x200 pixels
- **Face size**: Should occupy at least 20% of image area
- **Lighting**: Well-lit, avoid harsh shadows
- **Angle**: Front-facing preferred (up to 45° rotation acceptable)
- **Count**: Single face per image for best results
- **Format**: JPEG, PNG, WebP supported

3. **Adjust Detection Parameters:**
```javascript
// Lower thresholds for difficult images
const manager = new MediaPipeManager();
await manager.initialize({
    minFaceDetectionConfidence: 0.3,  // Lower from default 0.5
    minFacePresenceConfidence: 0.3,   // Lower from default 0.5
    minTrackingConfidence: 0.2,       // Lower from default 0.5
    numFaces: 1                       // Single face detection
});
```

4. **Image Preprocessing:**
```javascript
// Optimize image for face detection
function preprocessImage(image) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Resize if too large (improves performance)
    const maxDimension = 640;
    let { width, height } = image;
    
    if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        width *= scale;
        height *= scale;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Apply contrast enhancement
    ctx.filter = 'contrast(1.2) brightness(1.1)';
    ctx.drawImage(image, 0, 0, width, height);
    
    return canvas;
}
```

### 5. Memory Management Issues

#### Symptom: Increasing memory usage / memory leaks
```javascript
Warning: High memory usage detected: 250MB+
```

**Resolution:**

1. **Proper Cleanup:**
```javascript
class ManagedMediaPipe {
    constructor() {
        this.manager = null;
        this.analyzer = null;
        this.initialized = false;
    }
    
    async initialize() {
        if (this.initialized) return true;
        
        try {
            this.manager = new MediaPipeManager();
            this.analyzer = new MediaPipeVisemeAnalyzer();
            
            const success = await this.manager.initialize();
            if (success) {
                await this.analyzer.initialize();
                this.initialized = true;
            }
            
            return success;
        } catch (error) {
            this.cleanup();
            throw error;
        }
    }
    
    cleanup() {
        if (this.manager) {
            this.manager.dispose();
            this.manager = null;
        }
        if (this.analyzer) {
            this.analyzer.dispose();
            this.analyzer = null;
        }
        this.initialized = false;
    }
    
    // Auto-cleanup on page unload
    enableAutoCleanup() {
        window.addEventListener('beforeunload', () => this.cleanup());
        
        // Cleanup on visibility change (mobile)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.cleanup();
            }
        });
    }
}
```

2. **Memory Monitoring:**
```javascript
// Monitor memory usage
class MemoryMonitor {
    constructor() {
        this.startMemory = this.getMemoryUsage();
        this.maxMemory = this.startMemory;
    }
    
    getMemoryUsage() {
        if (window.performance && window.performance.memory) {
            return {
                used: Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(window.performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(window.performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return null;
    }
    
    checkMemoryLeak() {
        const current = this.getMemoryUsage();
        if (!current) return false;
        
        if (current.used > this.maxMemory.used) {
            this.maxMemory = current;
        }
        
        const growthMB = current.used - this.startMemory.used;
        const utilizationPercent = (current.used / current.limit) * 100;
        
        if (growthMB > 100) { // More than 100MB growth
            console.warn('Potential memory leak detected:', {
                growth: `+${growthMB}MB`,
                current: `${current.used}MB`,
                utilization: `${utilizationPercent.toFixed(1)}%`
            });
            return true;
        }
        
        return false;
    }
}

// Usage
const memoryMonitor = new MemoryMonitor();
setInterval(() => memoryMonitor.checkMemoryLeak(), 30000); // Check every 30s
```

## 🌐 Browser-Specific Issues

### Chrome Issues
**CORS errors with local files:**
```bash
# Solution 1: Run Chrome with flag
chrome --allow-file-access-from-files

# Solution 2: Use local development server
npx http-server . -p 8080 --cors
```

**GPU Process crashes:**
```javascript
// Check chrome://gpu/ for GPU status
// If GPU process unstable, force CPU mode:
const manager = new MediaPipeManager();
await manager.initialize({ forceDelegate: 'CPU' });
```

### Firefox Issues
**WebGL context creation fails:**
```javascript
// Check about:config settings:
// webgl.force-enabled = true
// webgl.disabled = false
// webgl.enable-debug-renderer-info = true
```

**Module import errors:**
```javascript
// Ensure proper MIME types in server config
// .mjs files should be served as application/javascript
```

### Safari Issues
**ES6 module import errors:**
```javascript
// ❌ Problematic
import MediaPipeManager from './MediaPipeManager';

// ✅ Safari requires explicit .js extension
import MediaPipeManager from './MediaPipeManager.js';
```

**WebGL performance issues:**
```javascript
// Safari has WebGL memory limitations
// Reduce texture sizes and use lower precision
const config = {
    baseOptions: {
        delegate: "CPU"  // Force CPU on Safari if performance issues
    }
};
```

### Mobile Browser Issues
**Performance degradation:**
```javascript
// Detect mobile and adjust settings
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const config = {
    baseOptions: {
        delegate: isMobile ? "CPU" : "GPU"
    },
    // Reduce precision on mobile
    minFaceDetectionConfidence: isMobile ? 0.3 : 0.5,
    // Process smaller images on mobile
    maxImageDimension: isMobile ? 320 : 640
};
```

**iOS Safari memory warnings:**
```javascript
// Listen for memory warnings
window.addEventListener('pagehide', () => {
    // Cleanup MediaPipe resources
    if (window.mediaPipeManager) {
        window.mediaPipeManager.dispose();
    }
});
```

## 🔬 Advanced Debugging

### Enable Debug Mode
```javascript
// Enable comprehensive debugging
const manager = new MediaPipeManager();
manager.debugMode = true;  // Enables verbose logging

// Check debug info
const analyzer = new MediaPipeVisemeAnalyzer();
const debugInfo = analyzer.getDebugInfo();
console.log('Debug Info:', {
    managerStatus: debugInfo.manager,
    initialization: debugInfo.initialization,
    performance: debugInfo.performance,
    errors: debugInfo.errors
});
```

### Performance Profiling
```javascript
// Profile initialization performance
console.time('MediaPipe-Full-Init');
console.time('MediaPipe-WASM-Load');

const manager = new MediaPipeManager();

// Hook into loading stages
manager.onWasmLoaded = () => {
    console.timeEnd('MediaPipe-WASM-Load');
    console.time('MediaPipe-Landmarker-Create');
};

manager.onLandmarkerCreated = () => {
    console.timeEnd('MediaPipe-Landmarker-Create');
};

await manager.initialize();
console.timeEnd('MediaPipe-Full-Init');

// Profile analysis performance
const image = document.getElementById('testImage');
console.time('Face-Analysis');
const results = await manager.analyzeFace(image);
console.timeEnd('Face-Analysis');
```

### Network Analysis
```javascript
// Test CDN performance
async function testCdnPerformance() {
    const cdns = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm/vision_wasm_internal.wasm',
        'https://unpkg.com/@mediapipe/tasks-vision@0.10.22/wasm/vision_wasm_internal.wasm'
    ];
    
    for (const url of cdns) {
        try {
            const start = performance.now();
            const response = await fetch(url, { method: 'HEAD' });
            const duration = performance.now() - start;
            
            console.log(`CDN Test - ${new URL(url).hostname}:`, {
                accessible: response.ok,
                responseTime: `${duration.toFixed(0)}ms`,
                status: response.status
            });
        } catch (error) {
            console.log(`CDN Test - ${new URL(url).hostname}: FAILED - ${error.message}`);
        }
    }
}

testCdnPerformance();
```

## 🆘 Emergency Recovery Procedures

### 1. Complete System Reset
```javascript
// Nuclear option - complete reset
async function emergencyReset() {
    console.log('🚨 Emergency MediaPipe Reset');
    
    // 1. Dispose all instances
    if (window.mediaPipeManager) {
        window.mediaPipeManager.dispose();
        window.mediaPipeManager = null;
    }
    
    // 2. Clear all caches
    if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(name => caches.delete(name))
        );
        console.log('Cache cleared');
    }
    
    // 3. Clear local storage
    localStorage.clear();
    sessionStorage.clear();
    console.log('Storage cleared');
    
    // 4. Force garbage collection (if available)
    if (window.gc) {
        window.gc();
        console.log('Garbage collection forced');
    }
    
    // 5. Reload page
    setTimeout(() => {
        window.location.reload(true);
    }, 1000);
}

// Bind to global for emergency use
window.emergencyReset = emergencyReset;
```

### 2. Fallback to Geometric Analysis
```javascript
// If MediaPipe completely fails, use geometric analyzer
class FallbackAnalyzer {
    constructor() {
        this.isGeometric = false;
    }
    
    async initialize() {
        try {
            // Try MediaPipe first
            this.mediaAnalyzer = new MediaPipeVisemeAnalyzer();
            await this.mediaAnalyzer.initialize();
            console.log('✅ MediaPipe analyzer ready');
        } catch (error) {
            console.warn('❌ MediaPipe failed, switching to geometric analyzer');
            
            // Fallback to geometric analysis
            this.geometricAnalyzer = new GeometricVisemeAnalyzer();
            await this.geometricAnalyzer.initialize();
            this.isGeometric = true;
            console.log('✅ Geometric analyzer ready');
        }
    }
    
    async analyzeViseme(imageDataURL, targetViseme) {
        if (this.isGeometric) {
            return await this.geometricAnalyzer.analyzeViseme(imageDataURL, targetViseme);
        } else {
            return await this.mediaAnalyzer.analyzeViseme(imageDataURL, targetViseme);
        }
    }
    
    getCapabilities() {
        return {
            type: this.isGeometric ? 'geometric' : 'mediapipe',
            features: this.isGeometric ? ['basic_lip_detection'] : ['full_facial_landmarks', 'blendshapes']
        };
    }
}
```

### 3. Offline Mode
```javascript
// Handle offline scenarios
class OfflineMediaPipe {
    constructor() {
        this.isOnline = navigator.onLine;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        window.addEventListener('online', () => {
            console.log('🌐 Network restored, reinitializing MediaPipe...');
            this.isOnline = true;
            this.handleOnline();
        });
        
        window.addEventListener('offline', () => {
            console.log('📴 Network lost, switching to offline mode');
            this.isOnline = false;
            this.handleOffline();
        });
    }
    
    async handleOnline() {
        // Reinitialize with full capabilities
        try {
            if (this.manager) {
                await this.manager.reinitialize();
            }
        } catch (error) {
            console.error('Failed to reinitialize MediaPipe after coming online:', error);
        }
    }
    
    handleOffline() {
        // Switch to local-only resources
        if (this.manager) {
            this.manager.switchToOfflineMode();
        }
        
        // Show offline indicator
        this.showOfflineNotification();
    }
    
    showOfflineNotification() {
        const notification = document.createElement('div');
        notification.id = 'offline-notification';
        notification.innerHTML = '📴 Offline Mode - Limited functionality available';
        notification.style.cssText = `
            position: fixed; top: 10px; right: 10px; 
            background: #ffeb3b; color: #333; 
            padding: 10px; border-radius: 5px; 
            z-index: 10000; font-family: Arial, sans-serif;
        `;
        document.body.appendChild(notification);
        
        // Remove when online
        window.addEventListener('online', () => {
            const elem = document.getElementById('offline-notification');
            if (elem) elem.remove();
        }, { once: true });
    }
}
```

## 📋 Health Check Procedures

### Automated Health Check
```javascript
// Comprehensive health check function
async function performHealthCheck() {
    const report = {
        timestamp: new Date().toISOString(),
        overall: 'unknown',
        checks: {}
    };
    
    console.log('🏥 Starting MediaPipe health check...');
    
    // Check 1: Basic Initialization
    try {
        const manager = new MediaPipeManager();
        const initStart = performance.now();
        const success = await manager.initialize();
        const initTime = performance.now() - initStart;
        
        report.checks.initialization = {
            success,
            time: Math.round(initTime),
            status: success && initTime < 20000 ? 'healthy' : 'degraded'
        };
        
        manager.dispose();
    } catch (error) {
        report.checks.initialization = {
            success: false,
            error: error.message,
            status: 'failed'
        };
    }
    
    // Check 2: WebGL Support
    const gl = document.createElement('canvas').getContext('webgl2') || 
              document.createElement('canvas').getContext('webgl');
    report.checks.webgl = {
        available: !!gl,
        version: gl ? gl.getParameter(gl.VERSION) : null,
        status: gl ? 'healthy' : 'degraded'
    };
    
    // Check 3: Network Connectivity
    try {
        const response = await fetch('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/package.json', {
            method: 'HEAD',
            mode: 'no-cors'
        });
        report.checks.network = {
            accessible: true,
            status: 'healthy'
        };
    } catch (error) {
        report.checks.network = {
            accessible: false,
            error: error.message,
            status: 'failed'
        };
    }
    
    // Check 4: Memory Usage
    if (window.performance && window.performance.memory) {
        const memory = window.performance.memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
        const utilization = (usedMB / limitMB) * 100;
        
        report.checks.memory = {
            used: `${usedMB}MB`,
            limit: `${limitMB}MB`,
            utilization: `${utilization.toFixed(1)}%`,
            status: utilization < 80 ? 'healthy' : 'degraded'
        };
    }
    
    // Overall health assessment
    const statuses = Object.values(report.checks).map(check => check.status);
    const healthyCount = statuses.filter(s => s === 'healthy').length;
    const totalChecks = statuses.length;
    
    if (healthyCount === totalChecks) {
        report.overall = 'healthy';
    } else if (healthyCount >= totalChecks * 0.75) {
        report.overall = 'degraded';
    } else {
        report.overall = 'failed';
    }
    
    console.log('🏥 Health check complete:', report);
    return report;
}

// Run health check every 5 minutes
setInterval(performHealthCheck, 5 * 60 * 1000);
```

### Production Monitoring
```javascript
// Production monitoring dashboard
class ProductionMonitor {
    constructor() {
        this.metrics = {
            initAttempts: 0,
            initSuccesses: 0,
            analysisAttempts: 0,
            analysisSuccesses: 0,
            errors: []
        };
        
        this.thresholds = {
            initSuccessRate: 0.95,    // 95%
            analysisSuccessRate: 0.90, // 90%
            maxInitTime: 15000,       // 15 seconds
            maxAnalysisTime: 1000     // 1 second
        };
    }
    
    recordInitialization(success, duration) {
        this.metrics.initAttempts++;
        if (success) this.metrics.initSuccesses++;
        
        const successRate = this.metrics.initSuccesses / this.metrics.initAttempts;
        
        // Alert if below threshold
        if (this.metrics.initAttempts > 10 && successRate < this.thresholds.initSuccessRate) {
            this.sendAlert('Low initialization success rate', {
                current: `${(successRate * 100).toFixed(1)}%`,
                threshold: `${(this.thresholds.initSuccessRate * 100)}%`,
                attempts: this.metrics.initAttempts
            });
        }
        
        if (success && duration > this.thresholds.maxInitTime) {
            this.sendAlert('Slow initialization', {
                duration: `${duration}ms`,
                threshold: `${this.thresholds.maxInitTime}ms`
            });
        }
    }
    
    sendAlert(message, data) {
        console.warn(`🚨 MediaPipe Alert: ${message}`, data);
        
        // Send to monitoring service (customize for your setup)
        if (window.monitoring) {
            window.monitoring.alert('mediapipe', message, data);
        }
        
        // Could also send to external services like Datadog, New Relic, etc.
    }
    
    getHealthReport() {
        return {
            initSuccessRate: this.metrics.initSuccesses / Math.max(this.metrics.initAttempts, 1),
            analysisSuccessRate: this.metrics.analysisSuccesses / Math.max(this.metrics.analysisAttempts, 1),
            totalErrors: this.metrics.errors.length,
            recentErrors: this.metrics.errors.slice(-5)
        };
    }
}

// Global monitor instance
window.mediaPipeMonitor = new ProductionMonitor();
```

---

**Troubleshooting Guide Status: COMPLETE**  
**Coverage: All known MediaPipe v2 issues addressed**

*Guide Version: 1.0*  
*Last Updated: 2025-08-30*  
*Next Review: 2025-09-30*