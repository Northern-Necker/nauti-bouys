# MediaPipe v2 - Comprehensive Troubleshooting Guide

## 🔧 Quick Diagnostic Commands

### Check Implementation Status
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

### Test Suite Execution
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
- **Package not installed**: `npm install @mediapipe/tasks-vision@0.10.22-rc.20250304`
- **Import path incorrect**: Verify import statements use correct ES6 syntax
- **Module cache issues**: Clear browser cache and restart dev server
- **Network issues**: Check network connectivity and try different CDN sources

#### Symptom: "Failed to load MediaPipe WASM from all sources"
```javascript
Error: Failed to load MediaPipe WASM from all sources. Last error: NetworkError
```

**Systematic Resolution:**

1. **Check CDN Accessibility:**
```bash
# Test primary CDN
curl -I "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm/vision_wasm_internal.wasm"

# Test fallback CDNs
curl -I "https://unpkg.com/@mediapipe/tasks-vision@latest/wasm/vision_wasm_internal.wasm"
```

2. **Verify CORS Settings:**
```javascript
// Check if CORS is blocking requests
fetch('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm/vision_wasm_internal.wasm', {
    method: 'HEAD',
    mode: 'cors'
}).then(response => console.log('CORS OK:', response.ok));
```

3. **Use Local WASM Files:**
```bash
# Copy WASM files locally (if CDN fails)
cp node_modules/@mediapipe/tasks-vision/wasm/* public/wasm/
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
```

2. **Enable WebGL in Browser:**
- Chrome: `chrome://settings/` → Advanced → System → "Use hardware acceleration"
- Firefox: `about:config` → `webgl.disabled` = false
- Safari: Develop menu → "Enable WebGL"

3. **Check Hardware Acceleration:**
- Visit `chrome://gpu/` to verify GPU acceleration status
- Update graphics drivers if needed
- Try different browsers to isolate issues

### 3. Performance Issues

#### Symptom: Slow initialization (>30 seconds)
```javascript
Performance metrics: { initTime: 45000, errorCount: 0 }
```

**Optimization Steps:**

1. **Network Optimization:**
```javascript
// Preload WASM files
const link = document.createElement('link');
link.rel = 'prefetch';
link.href = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm/vision_wasm_internal.wasm';
document.head.appendChild(link);
```

2. **Use Specific Version:**
```javascript
// Pin to specific working version
const wasmSources = [
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm"
];
```

3. **Implement WASM Caching:**
```javascript
// Service worker for WASM caching
self.addEventListener('fetch', event => {
    if (event.request.url.includes('tasks-vision/wasm')) {
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request);
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
console.log('Image dimensions:', image.width, 'x', image.height);
console.log('Image complete:', image.complete);
console.log('Image src:', image.src.substring(0, 50) + '...');
```

2. **Image Quality Requirements:**
- Minimum resolution: 200x200 pixels
- Face should occupy at least 20% of image
- Good lighting conditions
- Face should be front-facing
- Single face per image (for best results)

3. **Adjust Detection Parameters:**
```javascript
const config = {
    minFaceDetectionConfidence: 0.5,  // Lower threshold
    minFacePresenceConfidence: 0.5,   // Lower threshold
    minTrackingConfidence: 0.3        // Lower threshold
};
```

## 🔬 Advanced Debugging

### 1. Enable Debug Mode
```javascript
const analyzer = new MediaPipeVisemeAnalyzer();
const debugInfo = analyzer.getDebugInfo();
console.log('Debug Info:', debugInfo);

// Enable detailed logging
const manager = new MediaPipeManager();
manager.debugMode = true;
```

### 2. Performance Profiling
```javascript
// Monitor initialization performance
console.time('MediaPipe-Init');
const manager = new MediaPipeManager();
await manager.initialize();
console.timeEnd('MediaPipe-Init');

// Monitor analysis performance
console.time('Face-Analysis');
const results = await manager.analyzeFace(image);
console.timeEnd('Face-Analysis');
```

### 3. Memory Usage Monitoring
```javascript
// Check memory usage
const status = manager.getStatus();
console.log('Performance Metrics:', status.performanceMetrics);

// Monitor for memory leaks
setInterval(() => {
    if (window.performance && window.performance.memory) {
        console.log('Memory:', {
            used: Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
            total: Math.round(window.performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
            limit: Math.round(window.performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
        });
    }
}, 5000);
```

## 🌐 Browser-Specific Issues

### Chrome
- **Issue**: CORS errors with local files
- **Solution**: Run with `--allow-file-access-from-files` flag
- **Alternative**: Use local development server

### Firefox
- **Issue**: WebGL context creation fails
- **Solution**: Enable `webgl.enable-debug-renderer-info` in about:config

### Safari
- **Issue**: ES6 module import errors
- **Solution**: Ensure all imports use `.js` extensions explicitly

### Mobile Browsers
- **Issue**: Performance degradation on mobile
- **Solution**: Force CPU processing on mobile devices
```javascript
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const config = {
    baseOptions: {
        delegate: isMobile ? "CPU" : "GPU"
    }
};
```

## 🚀 Performance Tuning

### 1. Initialization Optimization
```javascript
// Pre-warm WebGL context
const canvas = document.createElement('canvas');
canvas.width = 1;
canvas.height = 1;
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

// Preload MediaPipe early
const preloadPromise = import('@mediapipe/tasks-vision');
```

### 2. Analysis Optimization
```javascript
// Resize large images before analysis
function optimizeImageForAnalysis(image) {
    const maxSize = 640;
    if (image.width > maxSize || image.height > maxSize) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const scale = maxSize / Math.max(image.width, image.height);
        canvas.width = image.width * scale;
        canvas.height = image.height * scale;
        
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas;
    }
    return image;
}
```

### 3. Resource Management
```javascript
// Proper cleanup
class MediaPipeApp {
    constructor() {
        this.manager = new MediaPipeManager();
    }
    
    async dispose() {
        if (this.manager) {
            this.manager.dispose();
            this.manager = null;
        }
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.mediaManager) {
        window.mediaManager.dispose();
    }
});
```

## 📋 Health Check Checklist

### Pre-Deployment Validation:
- [ ] MediaPipe package installed and version verified
- [ ] WebGL context creation successful
- [ ] WASM files accessible from all CDN sources
- [ ] Test suite passes with >90% success rate
- [ ] Performance benchmarks meet requirements (<15s init, <1s analysis)
- [ ] Error recovery mechanisms tested
- [ ] Memory cleanup verified

### Runtime Monitoring:
- [ ] Initialization success rate >95%
- [ ] Average initialization time <15 seconds
- [ ] Face detection accuracy acceptable for use case
- [ ] Memory usage stable over time
- [ ] Error rates within acceptable limits

## 🆘 Emergency Recovery Procedures

### 1. Complete System Reset
```javascript
// Nuclear option - complete reset
if (window.mediaManager) {
    window.mediaManager.dispose();
    window.mediaManager = null;
}

// Clear caches
if ('caches' in window) {
    caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
    });
}

// Reload page
window.location.reload();
```

### 2. Fallback to Geometric Analysis
```javascript
// If MediaPipe completely fails, use geometric analyzer
try {
    const mediaAnalyzer = new MediaPipeVisemeAnalyzer();
    await mediaAnalyzer.initialize();
} catch (error) {
    console.log('MediaPipe failed, using geometric analyzer');
    const geometricAnalyzer = new GeometricVisemeAnalyzer();
    await geometricAnalyzer.initialize();
    // Continue with geometric analysis...
}
```

### 3. Offline Mode
```javascript
// Detect offline status and adjust behavior
window.addEventListener('online', () => {
    console.log('Network restored, reinitializing MediaPipe...');
    manager.reinitialize();
});

window.addEventListener('offline', () => {
    console.log('Network lost, switching to CPU-only mode');
    // Switch to minimal functionality
});
```

---

**Created by Code Analyzer Agent**  
**Hive Mind Swarm Completion**  
**Date**: 2025-08-28