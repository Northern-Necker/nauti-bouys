/**
 * Performance Monitoring Utility for MediaPipe Operations
 * Tracks initialization times, analysis performance, and system resources
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            initialization: {
                attempts: 0,
                successes: 0,
                failures: 0,
                averageTime: 0,
                fastestTime: Infinity,
                slowestTime: 0,
                totalTime: 0
            },
            analysis: {
                count: 0,
                successes: 0,
                failures: 0,
                averageTime: 0,
                fastestTime: Infinity,
                slowestTime: 0,
                totalTime: 0
            },
            errors: {
                count: 0,
                types: {},
                recent: []
            },
            memory: {
                peak: 0,
                current: 0,
                samples: []
            },
            network: {
                wasmLoadTime: 0,
                failedAttempts: 0,
                successfulSources: []
            }
        };
        
        this.startTime = performance.now();
        this.isMonitoring = true;
        
        // Start background monitoring
        this.startMemoryMonitoring();
    }
    
    /**
     * Record initialization performance
     */
    recordInitialization(duration, success, error = null) {
        const init = this.metrics.initialization;
        
        init.attempts++;
        init.totalTime += duration;
        
        if (success) {
            init.successes++;
            init.fastestTime = Math.min(init.fastestTime, duration);
            init.slowestTime = Math.max(init.slowestTime, duration);
            init.averageTime = init.totalTime / init.successes;
        } else {
            init.failures++;
            if (error) {
                this.recordError('initialization', error);
            }
        }
        
        return this.getInitializationStats();
    }
    
    /**
     * Record face analysis performance
     */
    recordAnalysis(duration, success, error = null) {
        const analysis = this.metrics.analysis;
        
        analysis.count++;
        analysis.totalTime += duration;
        
        if (success) {
            analysis.successes++;
            analysis.fastestTime = Math.min(analysis.fastestTime, duration);
            analysis.slowestTime = Math.max(analysis.slowestTime, duration);
            analysis.averageTime = analysis.totalTime / analysis.successes;
        } else {
            analysis.failures++;
            if (error) {
                this.recordError('analysis', error);
            }
        }
        
        return this.getAnalysisStats();
    }
    
    /**
     * Record WASM loading performance
     */
    recordWasmLoading(source, duration, success) {
        const network = this.metrics.network;
        
        if (success) {
            network.wasmLoadTime = duration;
            network.successfulSources.push({
                source: source,
                duration: duration,
                timestamp: Date.now()
            });
        } else {
            network.failedAttempts++;
        }
    }
    
    /**
     * Record error with categorization
     */
    recordError(category, error) {
        const errors = this.metrics.errors;
        
        errors.count++;
        
        const errorType = this.categorizeError(error);
        if (!errors.types[errorType]) {
            errors.types[errorType] = 0;
        }
        errors.types[errorType]++;
        
        // Keep recent errors (last 10)
        errors.recent.push({
            category: category,
            type: errorType,
            message: error.message || error,
            timestamp: Date.now()
        });
        
        if (errors.recent.length > 10) {
            errors.recent.shift();
        }
    }
    
    /**
     * Start memory monitoring
     */
    startMemoryMonitoring() {
        if (!this.isMonitoring) return;
        
        // Check if memory API is available
        if (window.performance && window.performance.memory) {
            const updateMemory = () => {
                const memory = window.performance.memory;
                const current = memory.usedJSHeapSize / 1024 / 1024; // MB
                
                this.metrics.memory.current = current;
                this.metrics.memory.peak = Math.max(this.metrics.memory.peak, current);
                
                // Keep last 20 samples
                this.metrics.memory.samples.push({
                    timestamp: Date.now(),
                    value: current
                });
                
                if (this.metrics.memory.samples.length > 20) {
                    this.metrics.memory.samples.shift();
                }
            };
            
            updateMemory();
            setInterval(updateMemory, 5000); // Update every 5 seconds
        }
    }
    
    /**
     * Categorize error types for better tracking
     */
    categorizeError(error) {
        const message = error.message || error.toString();
        
        if (message.includes('timeout')) return 'timeout';
        if (message.includes('network') || message.includes('fetch')) return 'network';
        if (message.includes('WASM') || message.includes('wasm')) return 'wasm';
        if (message.includes('WebGL')) return 'webgl';
        if (message.includes('not initialized')) return 'initialization';
        if (message.includes('No face detected')) return 'detection';
        if (message.includes('import') || message.includes('module')) return 'module';
        
        return 'other';
    }
    
    /**
     * Get comprehensive performance report
     */
    getPerformanceReport() {
        const uptime = performance.now() - this.startTime;
        
        return {
            uptime: Math.round(uptime),
            metrics: this.metrics,
            summary: this.generateSummary(),
            recommendations: this.generateRecommendations(),
            timestamp: Date.now()
        };
    }
    
    /**
     * Generate performance summary
     */
    generateSummary() {
        const init = this.metrics.initialization;
        const analysis = this.metrics.analysis;
        const errors = this.metrics.errors;
        
        return {
            initializationSuccess: init.attempts > 0 ? (init.successes / init.attempts * 100) : 0,
            analysisSuccess: analysis.count > 0 ? (analysis.successes / analysis.count * 100) : 0,
            averageInitTime: init.averageTime,
            averageAnalysisTime: analysis.averageTime,
            totalErrors: errors.count,
            memoryUsage: this.metrics.memory.current,
            overallHealth: this.calculateOverallHealth()
        };
    }
    
    /**
     * Calculate overall system health score (0-100)
     */
    calculateOverallHealth() {
        const init = this.metrics.initialization;
        const analysis = this.metrics.analysis;
        const errors = this.metrics.errors;
        
        let score = 100;
        
        // Initialization success rate
        if (init.attempts > 0) {
            const initSuccess = (init.successes / init.attempts) * 100;
            score -= (100 - initSuccess) * 0.4; // 40% weight
        }
        
        // Analysis success rate
        if (analysis.count > 0) {
            const analysisSuccess = (analysis.successes / analysis.count) * 100;
            score -= (100 - analysisSuccess) * 0.3; // 30% weight
        }
        
        // Error rate
        const totalOperations = init.attempts + analysis.count;
        if (totalOperations > 0) {
            const errorRate = (errors.count / totalOperations) * 100;
            score -= errorRate * 0.2; // 20% weight
        }
        
        // Performance penalties
        if (init.averageTime > 15000) score -= 5; // Slow initialization
        if (analysis.averageTime > 1000) score -= 5; // Slow analysis
        
        // Memory usage penalty
        if (this.metrics.memory.current > 100) score -= 5; // High memory usage
        
        return Math.max(0, Math.round(score));
    }
    
    /**
     * Generate performance recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        const summary = this.generateSummary();
        
        // Initialization recommendations
        if (summary.initializationSuccess < 80) {
            recommendations.push({
                type: 'error',
                message: 'MediaPipe initialization failure rate is high. Check network connectivity and WASM sources.',
                action: 'Review MediaPipe Manager fallback sources'
            });
        }
        
        if (summary.averageInitTime > 15000) {
            recommendations.push({
                type: 'warning',
                message: 'MediaPipe initialization is slow. Consider optimizing WASM loading.',
                action: 'Check CDN performance or use local WASM files'
            });
        }
        
        // Analysis recommendations
        if (summary.analysisSuccess < 90 && this.metrics.analysis.count > 5) {
            recommendations.push({
                type: 'warning',
                message: 'Face analysis success rate is below optimal. Review input image quality.',
                action: 'Improve lighting conditions and face positioning'
            });
        }
        
        if (summary.averageAnalysisTime > 1000) {
            recommendations.push({
                type: 'info',
                message: 'Face analysis is slower than optimal. Consider GPU acceleration.',
                action: 'Verify WebGL is available and enabled'
            });
        }
        
        // Error recommendations
        const errorTypes = Object.keys(this.metrics.errors.types);
        if (errorTypes.includes('timeout')) {
            recommendations.push({
                type: 'error',
                message: 'Timeout errors detected. Network or processing issues.',
                action: 'Increase timeout values or check network stability'
            });
        }
        
        if (errorTypes.includes('wasm')) {
            recommendations.push({
                type: 'error',
                message: 'WASM loading errors detected. CDN or compatibility issues.',
                action: 'Update MediaPipe version or use alternative CDN'
            });
        }
        
        // Memory recommendations
        if (summary.memoryUsage > 100) {
            recommendations.push({
                type: 'warning',
                message: 'High memory usage detected. Consider cleanup optimizations.',
                action: 'Implement periodic cleanup or reduce concurrent operations'
            });
        }
        
        // Overall health
        if (summary.overallHealth > 90) {
            recommendations.push({
                type: 'success',
                message: 'System performing optimally. All metrics within acceptable ranges.'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Get specific metric stats
     */
    getInitializationStats() {
        return { ...this.metrics.initialization };
    }
    
    getAnalysisStats() {
        return { ...this.metrics.analysis };
    }
    
    getErrorStats() {
        return { ...this.metrics.errors };
    }
    
    getMemoryStats() {
        return { ...this.metrics.memory };
    }
    
    /**
     * Reset all metrics
     */
    reset() {
        this.metrics = {
            initialization: {
                attempts: 0,
                successes: 0,
                failures: 0,
                averageTime: 0,
                fastestTime: Infinity,
                slowestTime: 0,
                totalTime: 0
            },
            analysis: {
                count: 0,
                successes: 0,
                failures: 0,
                averageTime: 0,
                fastestTime: Infinity,
                slowestTime: 0,
                totalTime: 0
            },
            errors: {
                count: 0,
                types: {},
                recent: []
            },
            memory: {
                peak: 0,
                current: 0,
                samples: []
            },
            network: {
                wasmLoadTime: 0,
                failedAttempts: 0,
                successfulSources: []
            }
        };
        
        this.startTime = performance.now();
    }
    
    /**
     * Stop monitoring
     */
    stop() {
        this.isMonitoring = false;
    }
    
    /**
     * Export performance data for analysis
     */
    exportData() {
        return {
            ...this.getPerformanceReport(),
            metadata: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                webglSupport: this.checkWebGLSupport(),
                memoryApiSupport: !!(window.performance && window.performance.memory)
            }
        };
    }
    
    /**
     * Check WebGL support level
     */
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const webgl2 = canvas.getContext('webgl2');
            const webgl1 = canvas.getContext('webgl');
            
            return {
                webgl2: !!webgl2,
                webgl1: !!webgl1,
                level: webgl2 ? 'webgl2' : webgl1 ? 'webgl1' : 'none'
            };
        } catch (error) {
            return { webgl2: false, webgl1: false, level: 'none' };
        }
    }
}

export default PerformanceMonitor;