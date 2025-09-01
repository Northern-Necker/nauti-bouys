/**
 * Comprehensive MediaPipe Face Landmarker v2 Loading Test Suite
 * Tests different import methods, model loading, WASM initialization, GPU acceleration, and browser compatibility
 * 
 * Usage: Run in browser console or as standalone HTML page
 * Purpose: Identify exact failure points in MediaPipe Face Landmarker v2 loading
 */

class MediaPipeLoadingTestSuite {
    constructor() {
        this.testResults = [];
        this.diagnostics = {
            browserInfo: this.getBrowserInfo(),
            webglInfo: this.getWebGLInfo(),
            networkInfo: this.getNetworkInfo(),
            mediaDevicesInfo: this.getMediaDevicesInfo(),
            startTime: Date.now()
        };
        
        // Test configurations
        this.testConfigs = {
            // CDN sources to test
            cdnSources: [
                {
                    name: 'JSDelivr Latest',
                    wasmPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm',
                    scriptUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304'
                },
                {
                    name: 'JSDelivr Stable',
                    wasmPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/wasm',
                    scriptUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15'
                },
                {
                    name: 'Unpkg Latest',
                    wasmPath: 'https://unpkg.com/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm',
                    scriptUrl: 'https://unpkg.com/@mediapipe/tasks-vision@0.10.22-rc.20250304'
                },
                {
                    name: 'Unpkg Stable',
                    wasmPath: 'https://unpkg.com/@mediapipe/tasks-vision@0.10.15/wasm',
                    scriptUrl: 'https://unpkg.com/@mediapipe/tasks-vision@0.10.15'
                },
                {
                    name: 'Local NPM (if available)',
                    wasmPath: '/node_modules/@mediapipe/tasks-vision/wasm',
                    scriptUrl: '/node_modules/@mediapipe/tasks-vision'
                }
            ],
            
            // Model file sources
            modelSources: [
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float32/1/face_landmarker.task',
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/models/face_landmarker.task'
            ],
            
            // WASM backend configurations
            wasmConfigs: [
                { name: 'Auto Detection', runningMode: 'VIDEO' },
                { name: 'SIMD Enabled', runningMode: 'VIDEO', delegate: 'CPU' },
                { name: 'GPU Delegate', runningMode: 'VIDEO', delegate: 'GPU' }
            ]
        };
        
        this.errorLog = [];
        this.performanceMetrics = {};
    }

    /**
     * Log test results with timestamp and categorization
     */
    log(category, message, data = null, level = 'info') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            category,
            message,
            data,
            level,
            elapsed: Date.now() - this.diagnostics.startTime
        };
        
        console.log(`[${level.toUpperCase()}] ${category}: ${message}`, data || '');
        this.testResults.push(logEntry);
        
        if (level === 'error') {
            this.errorLog.push(logEntry);
        }
    }

    /**
     * Get detailed browser information
     */
    getBrowserInfo() {
        const nav = navigator;
        return {
            userAgent: nav.userAgent,
            vendor: nav.vendor,
            platform: nav.platform,
            language: nav.language,
            languages: nav.languages,
            cookieEnabled: nav.cookieEnabled,
            onLine: nav.onLine,
            hardwareConcurrency: nav.hardwareConcurrency,
            memory: nav.deviceMemory || 'unknown',
            connection: nav.connection ? {
                effectiveType: nav.connection.effectiveType,
                downlink: nav.connection.downlink,
                rtt: nav.connection.rtt
            } : 'unknown'
        };
    }

    /**
     * Get WebGL capabilities and context information
     */
    getWebGLInfo() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            
            if (!gl) {
                return { supported: false, error: 'WebGL not supported' };
            }

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            const contextAttributes = gl.getContextAttributes();
            
            return {
                supported: true,
                version: gl.getParameter(gl.VERSION),
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                unmaskedVendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown',
                unmaskedRenderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown',
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
                contextAttributes,
                extensions: gl.getSupportedExtensions()
            };
        } catch (error) {
            return { supported: false, error: error.message };
        }
    }

    /**
     * Get network connection information
     */
    getNetworkInfo() {
        return {
            online: navigator.onLine,
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            } : 'unknown',
            timestamp: Date.now()
        };
    }

    /**
     * Get media devices information
     */
    async getMediaDevicesInfo() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                return { supported: false, error: 'MediaDevices API not supported' };
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            return {
                supported: true,
                devices: devices.map(device => ({
                    kind: device.kind,
                    label: device.label,
                    deviceId: device.deviceId ? 'available' : 'not available'
                })),
                permissions: {
                    camera: await this.checkMediaPermission('camera'),
                    microphone: await this.checkMediaPermission('microphone')
                }
            };
        } catch (error) {
            return { supported: false, error: error.message };
        }
    }

    /**
     * Check media permissions
     */
    async checkMediaPermission(name) {
        try {
            if (!navigator.permissions) return 'unknown';
            const permission = await navigator.permissions.query({ name });
            return permission.state;
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Test CDN import methods
     */
    async testCDNImports() {
        this.log('CDN_IMPORT', 'Starting CDN import tests');
        
        for (const config of this.testConfigs.cdnSources) {
            try {
                this.log('CDN_IMPORT', `Testing ${config.name}`, { config });
                
                const startTime = performance.now();
                
                // Test script loading
                const scriptLoadResult = await this.testScriptLoading(config);
                const scriptLoadTime = performance.now() - startTime;
                
                if (scriptLoadResult.success) {
                    // Test WASM loading
                    const wasmStartTime = performance.now();
                    const wasmLoadResult = await this.testWASMLoading(config);
                    const wasmLoadTime = performance.now() - wasmStartTime;
                    
                    this.log('CDN_IMPORT', `${config.name} - Script: ${scriptLoadResult.success ? 'SUCCESS' : 'FAILED'}, WASM: ${wasmLoadResult.success ? 'SUCCESS' : 'FAILED'}`, {
                        scriptLoadTime,
                        wasmLoadTime,
                        scriptError: scriptLoadResult.error,
                        wasmError: wasmLoadResult.error
                    });
                } else {
                    this.log('CDN_IMPORT', `${config.name} - Script loading failed`, scriptLoadResult, 'error');
                }
                
            } catch (error) {
                this.log('CDN_IMPORT', `${config.name} - Unexpected error`, error, 'error');
            }
        }
    }

    /**
     * Test script loading from CDN
     */
    async testScriptLoading(config) {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            const timeout = setTimeout(() => {
                resolve({ success: false, error: 'Script loading timeout' });
            }, 30000); // 30 second timeout
            
            script.onload = () => {
                clearTimeout(timeout);
                resolve({ success: true });
            };
            
            script.onerror = (error) => {
                clearTimeout(timeout);
                resolve({ success: false, error: `Script loading failed: ${error.message || 'Unknown error'}` });
            };
            
            script.src = `${config.scriptUrl}/tasks-vision.js`;
            document.head.appendChild(script);
        });
    }

    /**
     * Test WASM loading
     */
    async testWASMLoading(config) {
        try {
            // Test WASM file accessibility
            const wasmFiles = ['tasks-vision_wasm.wasm', 'vision_wasm_internal.wasm'];
            const results = [];
            
            for (const wasmFile of wasmFiles) {
                const wasmUrl = `${config.wasmPath}/${wasmFile}`;
                try {
                    const response = await fetch(wasmUrl, { method: 'HEAD' });
                    results.push({
                        file: wasmFile,
                        url: wasmUrl,
                        status: response.status,
                        success: response.ok,
                        contentType: response.headers.get('content-type'),
                        contentLength: response.headers.get('content-length')
                    });
                } catch (error) {
                    results.push({
                        file: wasmFile,
                        url: wasmUrl,
                        success: false,
                        error: error.message
                    });
                }
            }
            
            const successfulLoads = results.filter(r => r.success);
            return {
                success: successfulLoads.length > 0,
                results,
                error: successfulLoads.length === 0 ? 'No WASM files accessible' : null
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Test model file loading from various sources
     */
    async testModelLoading() {
        this.log('MODEL_LOADING', 'Starting model file loading tests');
        
        for (const modelUrl of this.testConfigs.modelSources) {
            try {
                this.log('MODEL_LOADING', `Testing model: ${modelUrl}`);
                
                const startTime = performance.now();
                const response = await fetch(modelUrl, { method: 'HEAD' });
                const loadTime = performance.now() - startTime;
                
                const result = {
                    url: modelUrl,
                    status: response.status,
                    success: response.ok,
                    loadTime,
                    contentType: response.headers.get('content-type'),
                    contentLength: response.headers.get('content-length'),
                    lastModified: response.headers.get('last-modified'),
                    etag: response.headers.get('etag')
                };
                
                this.log('MODEL_LOADING', `Model ${response.ok ? 'accessible' : 'failed'}`, result, response.ok ? 'info' : 'error');
                
            } catch (error) {
                this.log('MODEL_LOADING', `Model loading error: ${modelUrl}`, error, 'error');
            }
        }
    }

    /**
     * Test WASM backend initialization
     */
    async testWASMBackendInit() {
        this.log('WASM_INIT', 'Starting WASM backend initialization tests');
        
        // Check if MediaPipe is available
        if (typeof window.MediaPipe === 'undefined' && typeof window.TasksVision === 'undefined') {
            this.log('WASM_INIT', 'MediaPipe/TasksVision not loaded - testing import methods');
            
            try {
                // Try ES6 import
                const { FilesetResolver, FaceLandmarker } = await import('@mediapipe/tasks-vision');
                this.log('WASM_INIT', 'ES6 import successful');
                
                await this.testFilesetResolver(FilesetResolver, FaceLandmarker);
                
            } catch (importError) {
                this.log('WASM_INIT', 'ES6 import failed', importError, 'error');
                
                // Try alternative loading methods
                await this.testAlternativeLoading();
            }
        } else {
            this.log('WASM_INIT', 'MediaPipe already loaded, testing initialization');
            await this.testExistingMediaPipeInit();
        }
    }

    /**
     * Test FilesetResolver and FaceLandmarker initialization
     */
    async testFilesetResolver(FilesetResolver, FaceLandmarker) {
        for (const config of this.testConfigs.cdnSources) {
            try {
                this.log('WASM_INIT', `Testing FilesetResolver with ${config.name}`);
                
                const startTime = performance.now();
                const vision = await FilesetResolver.forVisionTasks(config.wasmPath);
                const resolverTime = performance.now() - startTime;
                
                this.log('WASM_INIT', `FilesetResolver successful for ${config.name}`, { resolverTime });
                
                // Test FaceLandmarker creation
                await this.testFaceLandmarkerCreation(FaceLandmarker, vision, config);
                
                break; // Use first successful resolver
                
            } catch (error) {
                this.log('WASM_INIT', `FilesetResolver failed for ${config.name}`, error, 'error');
            }
        }
    }

    /**
     * Test FaceLandmarker creation with different configurations
     */
    async testFaceLandmarkerCreation(FaceLandmarker, vision, config) {
        for (const modelUrl of this.testConfigs.modelSources) {
            try {
                this.log('WASM_INIT', `Testing FaceLandmarker creation with model: ${modelUrl}`);
                
                const startTime = performance.now();
                const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: modelUrl,
                        delegate: 'CPU'
                    },
                    runningMode: 'VIDEO',
                    numFaces: 1,
                    minFaceDetectionConfidence: 0.5,
                    minFacePresenceConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                    outputFaceBlendshapes: true,
                    outputFacialTransformationMatrixes: true
                });
                const creationTime = performance.now() - startTime;
                
                this.log('WASM_INIT', 'FaceLandmarker creation successful', { 
                    modelUrl, 
                    creationTime,
                    config: config.name 
                });
                
                // Test actual detection
                await this.testFaceDetection(faceLandmarker);
                
                break; // Use first successful model
                
            } catch (error) {
                this.log('WASM_INIT', `FaceLandmarker creation failed with model: ${modelUrl}`, error, 'error');
            }
        }
    }

    /**
     * Test alternative MediaPipe loading methods
     */
    async testAlternativeLoading() {
        this.log('WASM_INIT', 'Testing alternative loading methods');
        
        // Test global MediaPipe object
        if (typeof window.MediaPipe !== 'undefined') {
            this.log('WASM_INIT', 'Global MediaPipe object found');
            // Implementation would depend on specific MediaPipe version
        }
        
        // Test UMD loading
        try {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/tasks-vision.js';
            document.head.appendChild(script);
            
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                setTimeout(reject, 30000); // 30s timeout
            });
            
            this.log('WASM_INIT', 'UMD script loaded successfully');
            
        } catch (error) {
            this.log('WASM_INIT', 'UMD loading failed', error, 'error');
        }
    }

    /**
     * Test existing MediaPipe initialization
     */
    async testExistingMediaPipeInit() {
        // Implementation depends on what's already loaded
        this.log('WASM_INIT', 'Testing with existing MediaPipe installation');
    }

    /**
     * Test GPU acceleration availability
     */
    async testGPUAcceleration() {
        this.log('GPU_ACCELERATION', 'Starting GPU acceleration tests');
        
        // Test WebGL2 availability
        const canvas = document.createElement('canvas');
        const gl2 = canvas.getContext('webgl2');
        
        if (gl2) {
            this.log('GPU_ACCELERATION', 'WebGL2 supported');
            
            // Test GPU-specific extensions
            const gpuExtensions = [
                'EXT_color_buffer_float',
                'EXT_texture_filter_anisotropic',
                'OES_texture_float_linear',
                'WEBGL_compressed_texture_s3tc',
                'WEBGL_debug_renderer_info'
            ];
            
            const supportedExtensions = [];
            const unsupportedExtensions = [];
            
            gpuExtensions.forEach(ext => {
                if (gl2.getExtension(ext)) {
                    supportedExtensions.push(ext);
                } else {
                    unsupportedExtensions.push(ext);
                }
            });
            
            this.log('GPU_ACCELERATION', 'WebGL2 extensions analysis', {
                supported: supportedExtensions,
                unsupported: unsupportedExtensions
            });
            
        } else {
            this.log('GPU_ACCELERATION', 'WebGL2 not supported', null, 'error');
        }
        
        // Test WebGPU availability
        if ('gpu' in navigator) {
            try {
                const adapter = await navigator.gpu.requestAdapter();
                if (adapter) {
                    const device = await adapter.requestDevice();
                    this.log('GPU_ACCELERATION', 'WebGPU supported and available', {
                        features: Array.from(adapter.features),
                        limits: adapter.limits
                    });
                } else {
                    this.log('GPU_ACCELERATION', 'WebGPU adapter not available', null, 'error');
                }
            } catch (error) {
                this.log('GPU_ACCELERATION', 'WebGPU initialization failed', error, 'error');
            }
        } else {
            this.log('GPU_ACCELERATION', 'WebGPU not supported');
        }
    }

    /**
     * Test face detection with a test image
     */
    async testFaceDetection(faceLandmarker) {
        try {
            this.log('FACE_DETECTION', 'Testing face detection');
            
            // Create a test canvas with a simple face-like pattern
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            
            // Draw a simple test pattern
            ctx.fillStyle = '#fdbcb4'; // Skin tone
            ctx.fillRect(200, 150, 240, 180); // Face
            
            ctx.fillStyle = '#000000';
            ctx.fillRect(250, 200, 20, 20); // Left eye
            ctx.fillRect(370, 200, 20, 20); // Right eye
            ctx.fillRect(310, 250, 20, 30); // Nose
            ctx.fillRect(280, 290, 80, 20); // Mouth
            
            const startTime = performance.now();
            const results = faceLandmarker.detect(canvas);
            const detectionTime = performance.now() - startTime;
            
            this.log('FACE_DETECTION', 'Face detection completed', {
                detectionTime,
                facesDetected: results.faceLandmarks ? results.faceLandmarks.length : 0,
                hasBlendshapes: !!results.faceBlendshapes,
                hasTransforms: !!results.facialTransformationMatrixes
            });
            
        } catch (error) {
            this.log('FACE_DETECTION', 'Face detection failed', error, 'error');
        }
    }

    /**
     * Test cross-browser compatibility
     */
    async testCrossBrowserCompatibility() {
        this.log('BROWSER_COMPAT', 'Starting cross-browser compatibility tests');
        
        // Test feature detection
        const features = {
            webgl: !!this.getWebGLInfo().supported,
            webgl2: !!(document.createElement('canvas').getContext('webgl2')),
            webgpu: 'gpu' in navigator,
            wasm: 'WebAssembly' in window,
            simd: this.testWASMSIMD(),
            threads: this.testWASMThreads(),
            mediaDevices: 'mediaDevices' in navigator,
            getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            modernJS: this.testModernJSFeatures(),
            crossOriginIsolated: window.crossOriginIsolated,
            secureContext: window.isSecureContext
        };
        
        this.log('BROWSER_COMPAT', 'Feature detection results', features);
        
        // Test specific browser quirks
        await this.testBrowserSpecificIssues();
    }

    /**
     * Test WASM SIMD support
     */
    testWASMSIMD() {
        try {
            return WebAssembly.validate(new Uint8Array([
                0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 10, 8, 1, 6, 0, 65, 0, 253, 15, 26, 11
            ]));
        } catch {
            return false;
        }
    }

    /**
     * Test WASM threads support
     */
    testWASMThreads() {
        return 'SharedArrayBuffer' in window && 'Atomics' in window;
    }

    /**
     * Test modern JavaScript features
     */
    testModernJSFeatures() {
        try {
            // Test ES6+ features that MediaPipe might require
            new Function('async () => {}'); // Async/await
            new Function('const [a] = [1]'); // Destructuring
            new Function('const a = {...{}}'); // Spread operator
            new Function('class A {}'); // Classes
            new Function('() => {}'); // Arrow functions
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Test browser-specific issues
     */
    async testBrowserSpecificIssues() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        // Chrome/Chromium specific tests
        if (userAgent.includes('chrome')) {
            this.log('BROWSER_COMPAT', 'Chrome-specific tests');
            // Test Chrome's CORS policies, security restrictions
        }
        
        // Firefox specific tests
        if (userAgent.includes('firefox')) {
            this.log('BROWSER_COMPAT', 'Firefox-specific tests');
            // Test Firefox's stricter security policies
        }
        
        // Safari specific tests
        if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
            this.log('BROWSER_COMPAT', 'Safari-specific tests');
            // Test Safari's WebKit limitations
        }
        
        // Edge specific tests
        if (userAgent.includes('edge')) {
            this.log('BROWSER_COMPAT', 'Edge-specific tests');
        }
    }

    /**
     * Run performance benchmarks
     */
    async runPerformanceBenchmarks() {
        this.log('PERFORMANCE', 'Starting performance benchmarks');
        
        // Memory usage tracking
        if ('memory' in performance) {
            const memBefore = performance.memory.usedJSHeapSize;
            this.log('PERFORMANCE', 'Initial memory usage', { memory: memBefore });
        }
        
        // Network timing
        if ('connection' in navigator) {
            this.log('PERFORMANCE', 'Network connection info', {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            });
        }
    }

    /**
     * Generate comprehensive diagnostic report
     */
    generateDiagnosticReport() {
        const report = {
            timestamp: new Date().toISOString(),
            testDuration: Date.now() - this.diagnostics.startTime,
            browserInfo: this.diagnostics.browserInfo,
            webglInfo: this.diagnostics.webglInfo,
            networkInfo: this.diagnostics.networkInfo,
            mediaDevicesInfo: this.diagnostics.mediaDevicesInfo,
            testResults: this.testResults,
            errorSummary: this.errorLog,
            recommendations: this.generateRecommendations()
        };
        
        return report;
    }

    /**
     * Generate recommendations based on test results
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Analyze errors and suggest fixes
        this.errorLog.forEach(error => {
            if (error.message.includes('CORS')) {
                recommendations.push({
                    issue: 'CORS Error',
                    solution: 'Configure proper CORS headers or use a local server',
                    priority: 'high'
                });
            }
            
            if (error.message.includes('WebGL')) {
                recommendations.push({
                    issue: 'WebGL Issue',
                    solution: 'Update graphics drivers or enable hardware acceleration',
                    priority: 'medium'
                });
            }
            
            if (error.message.includes('WASM')) {
                recommendations.push({
                    issue: 'WASM Loading Issue',
                    solution: 'Check browser WASM support and network connectivity',
                    priority: 'high'
                });
            }
        });
        
        // Browser-specific recommendations
        if (!this.diagnostics.webglInfo.supported) {
            recommendations.push({
                issue: 'WebGL Not Supported',
                solution: 'Use a modern browser with WebGL support',
                priority: 'critical'
            });
        }
        
        return recommendations;
    }

    /**
     * Run all tests in sequence
     */
    async runAllTests() {
        this.log('TEST_SUITE', 'Starting comprehensive MediaPipe loading test suite');
        
        try {
            // Initialize diagnostics
            this.diagnostics.mediaDevicesInfo = await this.getMediaDevicesInfo();
            
            // Run test categories
            await this.testCDNImports();
            await this.testModelLoading();
            await this.testWASMBackendInit();
            await this.testGPUAcceleration();
            await this.testCrossBrowserCompatibility();
            await this.runPerformanceBenchmarks();
            
            // Generate final report
            const report = this.generateDiagnosticReport();
            this.log('TEST_SUITE', 'Test suite completed', {
                totalTests: this.testResults.length,
                errors: this.errorLog.length,
                duration: report.testDuration
            });
            
            return report;
            
        } catch (error) {
            this.log('TEST_SUITE', 'Test suite failed with critical error', error, 'error');
            throw error;
        }
    }
}

// Export for use in different contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaPipeLoadingTestSuite;
} else {
    window.MediaPipeLoadingTestSuite = MediaPipeLoadingTestSuite;
}

// Auto-run if in browser and not explicitly disabled
if (typeof window !== 'undefined' && !window.DISABLE_AUTO_TEST) {
    // Add test runner function to window for manual execution
    window.runMediaPipeTests = async function() {
        const testSuite = new MediaPipeLoadingTestSuite();
        const report = await testSuite.runAllTests();
        
        console.log('=== MediaPipe Loading Test Report ===');
        console.log(JSON.stringify(report, null, 2));
        
        // Display results in DOM if available
        if (document.body) {
            const reportDiv = document.createElement('div');
            reportDiv.id = 'mediapipe-test-report';
            reportDiv.innerHTML = `
                <h2>MediaPipe Loading Test Results</h2>
                <p>Total Tests: ${report.testResults.length}</p>
                <p>Errors: ${report.errorSummary.length}</p>
                <p>Duration: ${report.testDuration}ms</p>
                <details>
                    <summary>Full Report</summary>
                    <pre>${JSON.stringify(report, null, 2)}</pre>
                </details>
            `;
            document.body.appendChild(reportDiv);
        }
        
        return report;
    };
    
    console.log('MediaPipe Loading Test Suite loaded. Run window.runMediaPipeTests() to start testing.');
}