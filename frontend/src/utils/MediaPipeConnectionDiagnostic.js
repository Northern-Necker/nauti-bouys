/**
 * MediaPipe Connection Diagnostic Tool
 * Helps debug ERR_CONNECTION_REFUSED and version issues
 */

class MediaPipeConnectionDiagnostic {
    constructor() {
        this.testResults = [];
        this.mediapipeVersions = [
            '0.10.6', // Latest stable
            '0.10.5',
            '0.10.4',
            '0.10.3',
            '0.10.2'
        ];
        this.cdnProviders = {
            jsdelivr: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision',
            unpkg: 'https://unpkg.com/@mediapipe/tasks-vision',
            npmjs: 'https://registry.npmjs.org/@mediapipe/tasks-vision'
        };
    }

    /**
     * Run comprehensive connection diagnostics
     */
    async runDiagnostics() {
        console.log('🔍 Starting MediaPipe Connection Diagnostics...');
        
        const results = {
            networkConnectivity: await this.checkNetworkConnectivity(),
            cdnAvailability: await this.checkCDNAvailability(),
            versionValidation: await this.validateVersions(),
            wasmFileAccess: await this.checkWasmFileAccess(),
            browserCapabilities: this.checkBrowserCapabilities(),
            recommendations: [],
            summary: { passed: 0, failed: 0, warnings: 0 }
        };

        // Generate recommendations based on results
        results.recommendations = this.generateRecommendations(results);
        results.summary = this.calculateSummary(results);

        return results;
    }

    /**
     * Check basic network connectivity
     */
    async checkNetworkConnectivity() {
        const tests = [];
        const testUrls = [
            'https://cdn.jsdelivr.net',
            'https://unpkg.com',
            'https://registry.npmjs.org',
            'https://storage.googleapis.com' // MediaPipe models
        ];

        for (const url of testUrls) {
            try {
                const startTime = performance.now();
                const response = await fetch(url, {
                    method: 'HEAD',
                    cache: 'no-cache',
                    signal: AbortSignal.timeout(5000)
                });
                
                const duration = Math.round(performance.now() - startTime);
                tests.push({
                    url,
                    status: response.status === 200 ? 'PASS' : `FAIL (${response.status})`,
                    duration: `${duration}ms`,
                    details: response.status === 200 ? 'Connected successfully' : `HTTP ${response.status}`
                });
            } catch (error) {
                tests.push({
                    url,
                    status: 'FAIL',
                    duration: 'timeout',
                    details: error.message
                });
            }
        }

        return { tests, passed: tests.filter(t => t.status === 'PASS').length };
    }

    /**
     * Check CDN availability for MediaPipe packages
     */
    async checkCDNAvailability() {
        const tests = [];
        
        for (const [name, baseUrl] of Object.entries(this.cdnProviders)) {
            for (const version of this.mediapipeVersions.slice(0, 3)) { // Test top 3 versions
                const testUrl = name === 'npmjs' ? 
                    `${baseUrl}/${version}` : 
                    `${baseUrl}@${version}/package.json`;
                
                try {
                    const response = await fetch(testUrl, {
                        method: 'HEAD',
                        cache: 'no-cache',
                        signal: AbortSignal.timeout(3000)
                    });
                    
                    tests.push({
                        provider: name,
                        version,
                        url: testUrl,
                        status: response.status === 200 ? 'AVAILABLE' : `UNAVAILABLE (${response.status})`,
                        details: response.status === 200 ? 'Package found' : `HTTP ${response.status}`
                    });
                } catch (error) {
                    tests.push({
                        provider: name,
                        version,
                        url: testUrl,
                        status: 'ERROR',
                        details: error.message.includes('404') ? 'Version not found' : error.message
                    });
                }
            }
        }

        return { 
            tests, 
            passed: tests.filter(t => t.status === 'AVAILABLE').length,
            byProvider: this.groupTestsByProvider(tests)
        };
    }

    /**
     * Validate specific MediaPipe versions
     */
    async validateVersions() {
        const tests = [];
        
        // Test the exact URLs used by MediaPipeManager
        const criticalUrls = [
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.6/wasm',
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.5/wasm',
            'https://unpkg.com/@mediapipe/tasks-vision@0.10.6/wasm',
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
        ];

        for (const url of criticalUrls) {
            try {
                const response = await fetch(url, {
                    method: 'HEAD',
                    cache: 'no-cache',
                    signal: AbortSignal.timeout(4000)
                });
                
                tests.push({
                    url,
                    type: url.includes('wasm') ? 'WASM_FILESET' : 'MODEL_FILE',
                    status: response.status === 200 ? 'VALID' : `INVALID (${response.status})`,
                    details: response.status === 200 ? 'Resource accessible' : this.getStatusDetails(response.status)
                });
            } catch (error) {
                tests.push({
                    url,
                    type: url.includes('wasm') ? 'WASM_FILESET' : 'MODEL_FILE',
                    status: 'ERROR',
                    details: this.categorizeNetworkError(error)
                });
            }
        }

        return { tests, passed: tests.filter(t => t.status === 'VALID').length };
    }

    /**
     * Check WASM file accessibility
     */
    async checkWasmFileAccess() {
        const tests = [];
        const wasmUrls = [
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.6/wasm/vision_wasm_internal.wasm',
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.6/wasm/vision_wasm_internal.js'
        ];

        for (const url of wasmUrls) {
            try {
                const response = await fetch(url, {
                    method: 'HEAD',
                    cache: 'no-cache',
                    signal: AbortSignal.timeout(3000)
                });
                
                tests.push({
                    url,
                    fileType: url.endsWith('.wasm') ? 'WASM_BINARY' : 'JS_LOADER',
                    status: response.status === 200 ? 'ACCESSIBLE' : `INACCESSIBLE (${response.status})`,
                    contentType: response.headers.get('content-type') || 'unknown',
                    details: response.status === 200 ? 'File accessible' : this.getStatusDetails(response.status)
                });
            } catch (error) {
                tests.push({
                    url,
                    fileType: url.endsWith('.wasm') ? 'WASM_BINARY' : 'JS_LOADER',
                    status: 'ERROR',
                    contentType: 'unknown',
                    details: this.categorizeNetworkError(error)
                });
            }
        }

        return { tests, passed: tests.filter(t => t.status === 'ACCESSIBLE').length };
    }

    /**
     * Check browser capabilities
     */
    checkBrowserCapabilities() {
        const capabilities = {
            webgl: this.checkWebGLSupport(),
            webgl2: this.checkWebGL2Support(),
            wasm: this.checkWasmSupport(),
            fetchAPI: typeof fetch !== 'undefined',
            promiseAPI: typeof Promise !== 'undefined',
            es6Support: this.checkES6Support(),
            corsSupport: this.checkCORSSupport()
        };

        const tests = Object.entries(capabilities).map(([feature, supported]) => ({
            feature: feature.toUpperCase(),
            status: supported ? 'SUPPORTED' : 'NOT_SUPPORTED',
            critical: ['webgl', 'wasm', 'fetchAPI'].includes(feature),
            details: this.getCapabilityDetails(feature, supported)
        }));

        return { 
            tests, 
            passed: tests.filter(t => t.status === 'SUPPORTED').length,
            critical: tests.filter(t => t.critical && t.status !== 'SUPPORTED').length
        };
    }

    /**
     * Helper methods for browser capability checks
     */
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }

    checkWebGL2Support() {
        try {
            const canvas = document.createElement('canvas');
            return !!canvas.getContext('webgl2');
        } catch (e) {
            return false;
        }
    }

    checkWasmSupport() {
        return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
    }

    checkES6Support() {
        try {
            eval('const test = () => {}; class Test {}');
            return true;
        } catch (e) {
            return false;
        }
    }

    checkCORSSupport() {
        return typeof XMLHttpRequest !== 'undefined' && 'withCredentials' in new XMLHttpRequest();
    }

    /**
     * Generate recommendations based on test results
     */
    generateRecommendations(results) {
        const recommendations = [];

        // Network issues
        if (results.networkConnectivity.passed < 2) {
            recommendations.push({
                type: 'NETWORK',
                priority: 'HIGH',
                message: '🚨 Network connectivity issues detected',
                solution: 'Check internet connection and firewall settings'
            });
        }

        // CDN issues
        if (results.cdnAvailability.passed < 3) {
            recommendations.push({
                type: 'CDN',
                priority: 'HIGH',
                message: '⚠️ CDN availability issues',
                solution: 'Try alternative CDN providers or local hosting'
            });
        }

        // Version issues
        const invalidVersions = results.versionValidation.tests.filter(t => t.status.includes('404'));
        if (invalidVersions.length > 0) {
            recommendations.push({
                type: 'VERSION',
                priority: 'CRITICAL',
                message: '❌ MediaPipe version not found (404 errors)',
                solution: 'Update to confirmed working version (0.10.6 or 0.10.5)'
            });
        }

        // Browser capability issues
        const criticalMissing = results.browserCapabilities.tests.filter(t => t.critical && t.status !== 'SUPPORTED');
        if (criticalMissing.length > 0) {
            recommendations.push({
                type: 'BROWSER',
                priority: 'HIGH',
                message: `🌐 Missing critical browser features: ${criticalMissing.map(t => t.feature).join(', ')}`,
                solution: 'Update browser or enable required features'
            });
        }

        // Success case
        if (recommendations.length === 0) {
            recommendations.push({
                type: 'SUCCESS',
                priority: 'INFO',
                message: '✅ All connection diagnostics passed',
                solution: 'MediaPipe should work correctly with current configuration'
            });
        }

        return recommendations;
    }

    /**
     * Helper methods
     */
    groupTestsByProvider(tests) {
        return tests.reduce((acc, test) => {
            if (!acc[test.provider]) acc[test.provider] = [];
            acc[test.provider].push(test);
            return acc;
        }, {});
    }

    getStatusDetails(status) {
        const statusMap = {
            404: 'Resource not found - version may not exist',
            403: 'Access forbidden - CDN restrictions',
            500: 'Server error - CDN issues',
            503: 'Service unavailable - CDN overloaded'
        };
        return statusMap[status] || `HTTP ${status}`;
    }

    categorizeNetworkError(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('timeout')) return 'Network timeout';
        if (message.includes('cors')) return 'CORS policy error';
        if (message.includes('failed to fetch')) return 'Network unreachable';
        if (message.includes('abort')) return 'Request aborted';
        
        return error.message;
    }

    getCapabilityDetails(feature, supported) {
        const details = {
            webgl: supported ? 'Hardware acceleration available' : 'Will use CPU processing (slower)',
            wasm: supported ? 'WebAssembly support enabled' : 'Critical: WebAssembly required for MediaPipe',
            fetchAPI: supported ? 'Modern fetch API available' : 'Will fallback to XMLHttpRequest'
        };
        
        return details[feature] || (supported ? 'Feature available' : 'Feature not available');
    }

    calculateSummary(results) {
        let passed = 0, failed = 0, warnings = 0;
        
        Object.values(results).forEach(section => {
            if (section.tests) {
                section.tests.forEach(test => {
                    if (test.status.includes('PASS') || test.status.includes('VALID') || 
                        test.status.includes('AVAILABLE') || test.status.includes('SUPPORTED')) {
                        passed++;
                    } else if (test.status.includes('WARN')) {
                        warnings++;
                    } else {
                        failed++;
                    }
                });
            }
        });

        return { passed, failed, warnings, total: passed + failed + warnings };
    }

    /**
     * Export results as formatted report
     */
    exportReport(results) {
        const timestamp = new Date().toISOString();
        const report = {
            timestamp,
            userAgent: navigator.userAgent,
            summary: results.summary,
            recommendations: results.recommendations,
            detailedResults: results
        };

        return JSON.stringify(report, null, 2);
    }
}

export default MediaPipeConnectionDiagnostic;