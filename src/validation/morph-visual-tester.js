/**
 * MorphVisualTester - Automated testing pipeline for morph target validation
 * Runs through all 15 visemes with visual evidence collection
 */

class MorphVisualTester {
    constructor(options = {}) {
        this.options = {
            visemes: options.visemes || [
                'sil', 'aa', 'ae', 'ah', 'ao', 'aw', 'ay',
                'b_m_p', 'ch_j_sh', 'd_s_t', 'eh', 'er', 'ey', 'f_v', 'ih'
            ],
            testDuration: options.testDuration || 1000, // ms per viseme
            morphIntensity: options.morphIntensity || 1.0,
            frameworks: options.frameworks || ['threejs', 'babylonjs', 'unity'],
            captureDelay: options.captureDelay || 200,
            validationThreshold: options.validationThreshold || 0.05, // 5% change required
            performanceMetrics: options.performanceMetrics !== false,
            generateReport: options.generateReport !== false,
            debugMode: options.debugMode || false,
            ...options
        };
        
        this.testResults = new Map();
        this.performanceData = new Map();
        this.validationErrors = [];
        this.currentTest = null;
        this.testRunning = false;
        
        // Dependencies
        this.screenshotCapture = null;
        this.gpuValidator = null;
        
        this.init();
    }
    
    init() {
        // Initialize dependencies
        if (window.MorphScreenshotCapture) {
            this.screenshotCapture = new MorphScreenshotCapture({
                debugMode: this.options.debugMode
            });
        }
        
        if (window.GPUStateValidator) {
            this.gpuValidator = new GPUStateValidator({
                debugMode: this.options.debugMode
            });
        }
        
        this.log('Morph Visual Tester initialized', 'info');
    }
    
    /**
     * Run complete validation across all frameworks and visemes
     */
    async runFullValidation(options = {}) {
        if (this.testRunning) {
            throw new Error('Validation already running');
        }
        
        this.testRunning = true;
        const testOptions = { ...this.options, ...options };
        
        try {
            this.log('Starting full validation suite...', 'info');
            
            const startTime = performance.now();
            const results = {
                startTime: new Date().toISOString(),
                frameworks: {},
                summary: {},
                errors: [],
                performance: {}
            };
            
            // Run tests for each framework
            for (const framework of testOptions.frameworks) {
                this.log(`Testing framework: ${framework}`, 'info');
                
                try {
                    const frameworkResults = await this.testFramework(framework, testOptions);
                    results.frameworks[framework] = frameworkResults;
                    
                    this.log(`${framework} testing completed`, 'success');
                } catch (error) {
                    this.log(`${framework} testing failed: ${error.message}`, 'error');
                    results.errors.push({
                        framework,
                        error: error.message,
                        timestamp: Date.now()
                    });
                }
            }
            
            // Generate summary
            results.summary = this.generateSummary(results.frameworks);
            results.performance = this.getPerformanceMetrics();
            results.duration = performance.now() - startTime;
            results.endTime = new Date().toISOString();
            
            this.log(`Full validation completed in ${results.duration.toFixed(0)}ms`, 'success');
            return results;
            
        } finally {
            this.testRunning = false;
        }
    }
    
    /**
     * Test a specific framework with all visemes
     */
    async testFramework(framework, options = {}) {
        const canvasId = `${framework}-canvas`;
        const canvas = document.getElementById(canvasId);
        
        if (!canvas) {
            throw new Error(`Canvas not found for ${framework}: ${canvasId}`);
        }
        
        const frameworkResults = {
            framework,
            canvasId,
            visemeResults: new Map(),
            screenshots: new Map(),
            performanceMetrics: {},
            validationScore: 0,
            errors: []
        };
        
        const startTime = performance.now();
        
        // Capture baseline (neutral state)
        const baseline = await this.captureBaseline(canvasId, framework);
        frameworkResults.baseline = baseline;
        
        // Test each viseme
        let validVisemes = 0;
        
        for (let i = 0; i < this.options.visemes.length; i++) {
            const viseme = this.options.visemes[i];
            
            try {
                this.log(`Testing ${framework} viseme: ${viseme} (${i + 1}/${this.options.visemes.length})`, 'info');
                
                const visemeResult = await this.testViseme(
                    canvasId, 
                    framework, 
                    viseme, 
                    baseline,
                    options
                );
                
                frameworkResults.visemeResults.set(viseme, visemeResult);
                
                if (visemeResult.isValid) {
                    validVisemes++;
                }
                
                // Progress callback
                if (options.onProgress) {
                    options.onProgress(framework, i + 1, this.options.visemes.length, viseme);
                }
                
            } catch (error) {
                this.log(`Failed to test ${framework} viseme ${viseme}: ${error.message}`, 'error');
                frameworkResults.errors.push({
                    viseme,
                    error: error.message,
                    timestamp: Date.now()
                });
            }
        }
        
        // Calculate framework score
        frameworkResults.validationScore = (validVisemes / this.options.visemes.length) * 100;
        frameworkResults.performanceMetrics = this.calculateFrameworkPerformance(framework, startTime);
        
        return frameworkResults;
    }
    
    /**
     * Capture baseline neutral state
     */
    async captureBaseline(canvasId, framework) {
        this.log(`Capturing baseline for ${framework}`, 'info');
        
        try {
            // Ensure neutral state
            await this.setNeutralState(framework);
            await this.waitForRender();
            
            // Capture baseline screenshot
            const baseline = await this.screenshotCapture.captureCanvas(canvasId);
            
            // Get GPU state
            const gpuState = this.gpuValidator ? 
                await this.gpuValidator.getStateReport() : null;
            
            return {
                screenshot: baseline,
                gpuState,
                timestamp: Date.now()
            };
            
        } catch (error) {
            this.log(`Failed to capture baseline for ${framework}: ${error.message}`, 'error');
            throw error;
        }
    }
    
    /**
     * Test a specific viseme
     */
    async testViseme(canvasId, framework, viseme, baseline, options = {}) {
        const testStart = performance.now();
        
        try {
            // Apply viseme morph
            await this.applyViseme(framework, viseme, options.morphIntensity);
            await this.waitForRender(3); // Wait for morph to apply
            
            // Capture after state
            const afterScreenshot = await this.screenshotCapture.captureCanvas(canvasId);
            
            // Calculate visual difference
            const difference = await this.screenshotCapture.calculatePixelDifference(
                baseline.screenshot.dataURL,
                afterScreenshot.dataURL
            );
            
            // Validate change is significant
            const isValid = this.validateVisemeChange(viseme, difference);
            
            // Performance metrics
            const testDuration = performance.now() - testStart;
            
            const result = {
                viseme,
                framework,
                baseline: baseline.screenshot,
                afterScreenshot,
                difference,
                isValid,
                validationReason: this.getValidationReason(viseme, difference, isValid),
                performance: {
                    testDuration,
                    renderTime: this.estimateRenderTime()
                },
                timestamp: Date.now()
            };
            
            this.log(`${framework} ${viseme}: ${isValid ? 'PASS' : 'FAIL'} 
                     (${difference.similarityPercentage.toFixed(1)}% similarity)`, 
                     isValid ? 'success' : 'warning');
            
            return result;
            
        } catch (error) {
            this.log(`Failed to test viseme ${viseme} on ${framework}: ${error.message}`, 'error');
            throw error;
        }
    }
    
    /**
     * Apply viseme to framework
     */
    async applyViseme(framework, viseme, intensity = 1.0) {
        // This would integrate with actual framework morph systems
        // For now, simulate by triggering the UI controls
        
        if (window.morphValidator) {
            // Use the main validator's systems
            window.morphValidator.currentViseme = viseme;
            window.morphValidator.morphIntensity = intensity;
            window.morphValidator.updateFrameworkMorph(framework);
        } else {
            // Simulate morph application
            await this.simulateMorphApplication(framework, viseme, intensity);
        }
    }
    
    /**
     * Simulate morph application (fallback)
     */
    async simulateMorphApplication(framework, viseme, intensity) {
        this.log(`Simulating ${viseme} morph on ${framework} (${intensity})`, 'info');
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Trigger buffer updates for GPU validator
        if (this.gpuValidator) {
            this.gpuValidator.recordBufferUpdate(framework);
        }
    }
    
    /**
     * Set framework to neutral state
     */
    async setNeutralState(framework) {
        await this.applyViseme(framework, 'sil', 0);
    }
    
    /**
     * Validate if viseme change is significant
     */
    validateVisemeChange(viseme, difference) {
        // Different visemes should have different validation criteria
        const thresholds = {
            'sil': 0.01,      // Silence should show minimal change
            'aa': 0.15,       // Vowels should show significant mouth opening
            'ae': 0.12,
            'ah': 0.18,
            'ao': 0.16,
            'aw': 0.14,
            'ay': 0.13,
            'eh': 0.11,
            'er': 0.10,
            'ey': 0.12,
            'ih': 0.09,
            'b_m_p': 0.20,    // Consonants show different mouth shapes
            'ch_j_sh': 0.15,
            'd_s_t': 0.12,
            'f_v': 0.18
        };
        
        const expectedThreshold = thresholds[viseme] || this.options.validationThreshold;
        const actualChange = (100 - difference.similarityPercentage) / 100;
        
        // Special case for silence - should have minimal change
        if (viseme === 'sil') {
            return actualChange <= expectedThreshold;
        }
        
        // For other visemes, should have significant change
        return actualChange >= expectedThreshold && difference.changeDetected;
    }
    
    /**
     * Get validation reason
     */
    getValidationReason(viseme, difference, isValid) {
        const actualChange = (100 - difference.similarityPercentage) / 100;
        
        if (viseme === 'sil') {
            return isValid ? 
                'Neutral state correctly maintained' : 
                `Unexpected change detected: ${(actualChange * 100).toFixed(1)}%`;
        }
        
        if (!isValid) {
            if (!difference.changeDetected) {
                return 'No visual change detected - morph may not be applied';
            } else {
                return `Insufficient change: ${(actualChange * 100).toFixed(1)}% (threshold: ${this.options.validationThreshold * 100}%)`;
            }
        }
        
        return `Valid change detected: ${(actualChange * 100).toFixed(1)}%`;
    }
    
    /**
     * Generate summary of all framework results
     */
    generateSummary(frameworkResults) {
        const summary = {
            totalFrameworks: Object.keys(frameworkResults).length,
            totalVisemes: this.options.visemes.length,
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            frameworkScores: {},
            overallScore: 0,
            topPerformer: null,
            commonFailures: []
        };
        
        Object.entries(frameworkResults).forEach(([framework, results]) => {
            summary.totalTests += results.visemeResults.size;
            
            const passed = Array.from(results.visemeResults.values())
                .filter(r => r.isValid).length;
            summary.passedTests += passed;
            summary.failedTests += (results.visemeResults.size - passed);
            
            summary.frameworkScores[framework] = results.validationScore;
        });
        
        // Calculate overall score
        summary.overallScore = summary.totalTests > 0 ? 
            (summary.passedTests / summary.totalTests) * 100 : 0;
        
        // Find top performer
        const scores = Object.entries(summary.frameworkScores);
        if (scores.length > 0) {
            summary.topPerformer = scores.reduce((a, b) => a[1] > b[1] ? a : b)[0];
        }
        
        // Identify common failures
        summary.commonFailures = this.identifyCommonFailures(frameworkResults);
        
        return summary;
    }
    
    /**
     * Identify visemes that commonly fail across frameworks
     */
    identifyCommonFailures(frameworkResults) {
        const visemeFailures = {};
        
        // Count failures per viseme
        Object.values(frameworkResults).forEach(results => {
            Array.from(results.visemeResults.entries()).forEach(([viseme, result]) => {
                if (!result.isValid) {
                    visemeFailures[viseme] = (visemeFailures[viseme] || 0) + 1;
                }
            });
        });
        
        // Return visemes that fail in majority of frameworks
        const frameworkCount = Object.keys(frameworkResults).length;
        const threshold = Math.ceil(frameworkCount / 2);
        
        return Object.entries(visemeFailures)
            .filter(([viseme, count]) => count >= threshold)
            .map(([viseme, count]) => ({
                viseme,
                failureCount: count,
                failureRate: (count / frameworkCount) * 100
            }))
            .sort((a, b) => b.failureCount - a.failureCount);
    }
    
    /**
     * Calculate framework performance metrics
     */
    calculateFrameworkPerformance(framework, startTime) {
        const duration = performance.now() - startTime;
        
        return {
            totalDuration: duration,
            averageVisemeDuration: duration / this.options.visemes.length,
            estimatedFPS: this.estimateFrameworkFPS(framework),
            gpuStats: this.gpuValidator ? 
                this.gpuValidator.frameworkStats.get(framework) : null
        };
    }
    
    /**
     * Estimate framework FPS
     */
    estimateFrameworkFPS(framework) {
        // This would integrate with actual framework render loops
        // For now, return a simulated value
        return 60 + Math.floor(Math.random() * 10) - 5;
    }
    
    /**
     * Estimate render time
     */
    estimateRenderTime() {
        return 16.67 + Math.random() * 5; // 60fps + variance
    }
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return {
            totalTestRuns: this.testResults.size,
            averageTestDuration: this.calculateAverageTestDuration(),
            memoryUsage: this.estimateMemoryUsage(),
            gpuStats: this.gpuValidator ? this.gpuValidator.getStats() : null
        };
    }
    
    calculateAverageTestDuration() {
        if (this.performanceData.size === 0) return 0;
        
        const durations = Array.from(this.performanceData.values())
            .map(data => data.duration);
        
        return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    }
    
    estimateMemoryUsage() {
        // Estimate memory usage from stored test data
        const baseSize = this.testResults.size * 100; // KB per test result
        return Math.round(baseSize / 1024) + 'MB';
    }
    
    /**
     * Wait for render frames
     */
    async waitForRender(frames = 2) {
        return new Promise(resolve => {
            let frameCount = 0;
            const waitFrame = () => {
                frameCount++;
                if (frameCount >= frames) {
                    resolve();
                } else {
                    requestAnimationFrame(waitFrame);
                }
            };
            requestAnimationFrame(waitFrame);
        });
    }
    
    /**
     * Run quick validation test (subset of visemes)
     */
    async runQuickValidation(frameworkFilter = null) {
        const quickVisemes = ['sil', 'aa', 'b_m_p', 'f_v', 'ih'];
        const frameworks = frameworkFilter ? [frameworkFilter] : this.options.frameworks;
        
        return this.runFullValidation({
            visemes: quickVisemes,
            frameworks: frameworks,
            testDuration: 500
        });
    }
    
    /**
     * Export test results
     */
    exportResults(format = 'json') {
        const exportData = {
            metadata: {
                timestamp: Date.now(),
                testCount: this.testResults.size,
                version: '1.0.0'
            },
            testResults: Array.from(this.testResults.entries()),
            performanceData: Array.from(this.performanceData.entries()),
            options: this.options,
            errors: this.validationErrors
        };
        
        if (format === 'json') {
            return JSON.stringify(exportData, null, 2);
        }
        
        return exportData;
    }
    
    /**
     * Clear all test data
     */
    clearResults() {
        this.testResults.clear();
        this.performanceData.clear();
        this.validationErrors = [];
        this.log('Test results cleared', 'info');
    }
    
    log(message, level = 'info') {
        if (this.options.debugMode) {
            console.log(`[MorphVisualTester] ${message}`);
        }
        
        // Send to parent validator if available
        if (window.morphValidator) {
            window.morphValidator.log(`[Tester] ${message}`, level);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MorphVisualTester;
}