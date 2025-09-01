/**
 * GPUStateValidator - WebGL state monitoring and validation
 * Tracks GPU synchronization, buffer updates, and shader compilation
 */

class GPUStateValidator {
    constructor(options = {}) {
        this.options = {
            monitoringInterval: options.monitoringInterval || 1000,
            trackDrawCalls: options.trackDrawCalls !== false,
            trackBufferUpdates: options.trackBufferUpdates !== false,
            trackShaderCompilation: options.trackShaderCompilation !== false,
            trackMemoryUsage: options.trackMemoryUsage !== false,
            debugMode: options.debugMode || false,
            ...options
        };
        
        this.contexts = new Map();
        this.stats = {
            webglVersion: null,
            drawCalls: 0,
            bufferUpdates: 0,
            textureMemory: 0,
            shaderCompilations: 0,
            memoryBarriers: 0,
            contextSwitches: 0,
            errors: []
        };
        
        this.frameworkStats = new Map();
        this.monitoringActive = false;
        this.originalFunctions = new Map();
        
        this.init();
    }
    
    init() {
        this.detectWebGLVersion();
        this.setupWebGLHooks();
        this.startMonitoring();
        this.log('GPU State Validator initialized', 'info');
    }
    
    /**
     * Detect available WebGL version
     */
    detectWebGLVersion() {
        const testCanvas = document.createElement('canvas');
        
        if (testCanvas.getContext('webgl2')) {
            this.stats.webglVersion = 'WebGL 2.0';
        } else if (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')) {
            this.stats.webglVersion = 'WebGL 1.0';
        } else {
            this.stats.webglVersion = 'Not Supported';
            this.log('WebGL not supported', 'error');
        }
        
        this.log(`Detected ${this.stats.webglVersion}`, 'info');
    }
    
    /**
     * Setup WebGL function hooks for monitoring
     */
    setupWebGLHooks() {
        // Hook into WebGL context creation
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        
        HTMLCanvasElement.prototype.getContext = (contextType, ...args) => {
            const context = originalGetContext.call(this, contextType, ...args);
            
            if (contextType === 'webgl' || contextType === 'webgl2' || 
                contextType === 'experimental-webgl') {
                this.registerContext(context, this.id || 'unknown');
            }
            
            return context;
        };
    }
    
    /**
     * Register and instrument a WebGL context
     */
    registerContext(gl, frameworkName) {
        if (!gl || this.contexts.has(gl)) return;
        
        const contextInfo = {
            framework: frameworkName,
            version: gl instanceof WebGL2RenderingContext ? 'WebGL 2.0' : 'WebGL 1.0',
            extensions: this.getContextExtensions(gl),
            limits: this.getContextLimits(gl),
            stats: {
                drawCalls: 0,
                bufferUpdates: 0,
                textureUploads: 0,
                shaderCompilations: 0
            }
        };
        
        this.contexts.set(gl, contextInfo);
        this.frameworkStats.set(frameworkName, contextInfo.stats);
        
        // Instrument WebGL functions
        this.instrumentContext(gl, frameworkName);
        
        this.log(`Registered ${frameworkName} context: ${contextInfo.version}`, 'info');
    }
    
    /**
     * Instrument WebGL context functions for monitoring
     */
    instrumentContext(gl, frameworkName) {
        const stats = this.frameworkStats.get(frameworkName);
        
        // Monitor draw calls
        if (this.options.trackDrawCalls) {
            this.hookDrawCalls(gl, stats);
        }
        
        // Monitor buffer operations
        if (this.options.trackBufferUpdates) {
            this.hookBufferOperations(gl, stats);
        }
        
        // Monitor shader compilation
        if (this.options.trackShaderCompilation) {
            this.hookShaderOperations(gl, stats);
        }
        
        // Monitor texture operations
        this.hookTextureOperations(gl, stats);
        
        // Monitor errors
        this.hookErrorChecking(gl, frameworkName);
    }
    
    /**
     * Hook draw call functions
     */
    hookDrawCalls(gl, stats) {
        const drawFunctions = [
            'drawArrays', 'drawElements', 'drawArraysInstanced', 
            'drawElementsInstanced', 'drawRangeElements'
        ];
        
        drawFunctions.forEach(funcName => {
            if (gl[funcName]) {
                const original = gl[funcName].bind(gl);
                gl[funcName] = (...args) => {
                    stats.drawCalls++;
                    this.stats.drawCalls++;
                    return original(...args);
                };
            }
        });
    }
    
    /**
     * Hook buffer operations
     */
    hookBufferOperations(gl, stats) {
        const bufferFunctions = [
            'bufferData', 'bufferSubData', 'createBuffer', 'deleteBuffer'
        ];
        
        bufferFunctions.forEach(funcName => {
            if (gl[funcName]) {
                const original = gl[funcName].bind(gl);
                gl[funcName] = (...args) => {
                    if (funcName === 'bufferData' || funcName === 'bufferSubData') {
                        stats.bufferUpdates++;
                        this.stats.bufferUpdates++;
                    }
                    return original(...args);
                };
            }
        });
    }
    
    /**
     * Hook shader compilation
     */
    hookShaderOperations(gl, stats) {
        const shaderFunctions = ['compileShader', 'linkProgram'];
        
        shaderFunctions.forEach(funcName => {
            if (gl[funcName]) {
                const original = gl[funcName].bind(gl);
                gl[funcName] = (...args) => {
                    stats.shaderCompilations++;
                    this.stats.shaderCompilations++;
                    
                    const result = original(...args);
                    
                    // Check for compilation errors
                    if (funcName === 'compileShader') {
                        const shader = args[0];
                        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                            const error = gl.getShaderInfoLog(shader);
                            this.recordError('Shader compilation failed', error);
                        }
                    }
                    
                    return result;
                };
            }
        });
    }
    
    /**
     * Hook texture operations
     */
    hookTextureOperations(gl, stats) {
        const textureFunctions = ['texImage2D', 'texSubImage2D', 'texImage3D', 'texSubImage3D'];
        
        textureFunctions.forEach(funcName => {
            if (gl[funcName]) {
                const original = gl[funcName].bind(gl);
                gl[funcName] = (...args) => {
                    stats.textureUploads++;
                    this.estimateTextureMemory(args);
                    return original(...args);
                };
            }
        });
    }
    
    /**
     * Hook error checking
     */
    hookErrorChecking(gl, frameworkName) {
        const original = gl.getError.bind(gl);
        gl.getError = () => {
            const error = original();
            if (error !== gl.NO_ERROR) {
                this.recordError(`WebGL Error in ${frameworkName}`, this.getErrorString(gl, error));
            }
            return error;
        };
    }
    
    /**
     * Estimate texture memory usage
     */
    estimateTextureMemory(texImageArgs) {
        try {
            // Basic estimation - actual calculation would depend on format and type
            const [target, level, internalFormat, width, height, border, format, type, data] = texImageArgs;
            
            if (width && height) {
                // Rough estimate: 4 bytes per pixel for RGBA
                const bytes = width * height * 4;
                this.stats.textureMemory += bytes;
            }
        } catch (error) {
            // Ignore estimation errors
        }
    }
    
    /**
     * Get WebGL context extensions
     */
    getContextExtensions(gl) {
        const extensions = [];
        const availableExtensions = gl.getSupportedExtensions() || [];
        
        availableExtensions.forEach(ext => {
            if (gl.getExtension(ext)) {
                extensions.push(ext);
            }
        });
        
        return extensions;
    }
    
    /**
     * Get WebGL context limits
     */
    getContextLimits(gl) {
        const limits = {};
        
        const limitQueries = {
            MAX_TEXTURE_SIZE: gl.MAX_TEXTURE_SIZE,
            MAX_VIEWPORT_DIMS: gl.MAX_VIEWPORT_DIMS,
            MAX_VERTEX_ATTRIBS: gl.MAX_VERTEX_ATTRIBS,
            MAX_VERTEX_UNIFORM_VECTORS: gl.MAX_VERTEX_UNIFORM_VECTORS,
            MAX_FRAGMENT_UNIFORM_VECTORS: gl.MAX_FRAGMENT_UNIFORM_VECTORS,
            MAX_COMBINED_TEXTURE_IMAGE_UNITS: gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS
        };
        
        Object.keys(limitQueries).forEach(key => {
            try {
                limits[key] = gl.getParameter(limitQueries[key]);
            } catch (error) {
                limits[key] = 'Unknown';
            }
        });
        
        return limits;
    }
    
    /**
     * Start continuous monitoring
     */
    startMonitoring() {
        if (this.monitoringActive) return;
        
        this.monitoringActive = true;
        this.monitoringLoop();
    }
    
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        this.monitoringActive = false;
    }
    
    /**
     * Main monitoring loop
     */
    monitoringLoop() {
        if (!this.monitoringActive) return;
        
        // Update memory estimates
        this.updateMemoryStats();
        
        // Check for WebGL errors across all contexts
        this.checkAllContextErrors();
        
        // Schedule next update
        setTimeout(() => this.monitoringLoop(), this.options.monitoringInterval);
    }
    
    /**
     * Update memory statistics
     */
    updateMemoryStats() {
        // Convert texture memory to MB
        this.stats.textureMemory = Math.round(this.stats.textureMemory / (1024 * 1024));
        
        // Estimate total GPU memory usage
        if (performance && performance.memory) {
            const memInfo = performance.memory;
            this.stats.jsHeapSize = Math.round(memInfo.usedJSHeapSize / (1024 * 1024));
            this.stats.totalMemory = Math.round(memInfo.totalJSHeapSize / (1024 * 1024));
        }
    }
    
    /**
     * Check for errors in all registered contexts
     */
    checkAllContextErrors() {
        this.contexts.forEach((contextInfo, gl) => {
            try {
                const error = gl.getError();
                if (error !== gl.NO_ERROR) {
                    this.recordError(
                        `WebGL Error in ${contextInfo.framework}`,
                        this.getErrorString(gl, error)
                    );
                }
            } catch (e) {
                // Context may be lost
                this.recordError(`Context lost for ${contextInfo.framework}`, e.message);
            }
        });
    }
    
    /**
     * Record GPU/WebGL errors
     */
    recordError(type, message) {
        const error = {
            type,
            message,
            timestamp: Date.now(),
            stack: new Error().stack
        };
        
        this.stats.errors.push(error);
        this.log(`${type}: ${message}`, 'error');
        
        // Limit error history
        if (this.stats.errors.length > 100) {
            this.stats.errors = this.stats.errors.slice(-50);
        }
    }
    
    /**
     * Convert WebGL error code to string
     */
    getErrorString(gl, error) {
        const errors = {
            [gl.NO_ERROR]: 'NO_ERROR',
            [gl.INVALID_ENUM]: 'INVALID_ENUM',
            [gl.INVALID_VALUE]: 'INVALID_VALUE',
            [gl.INVALID_OPERATION]: 'INVALID_OPERATION',
            [gl.OUT_OF_MEMORY]: 'OUT_OF_MEMORY',
            [gl.CONTEXT_LOST_WEBGL]: 'CONTEXT_LOST_WEBGL'
        };
        
        return errors[error] || `UNKNOWN_ERROR(${error})`;
    }
    
    /**
     * Record buffer update for a specific framework
     */
    recordBufferUpdate(framework) {
        const stats = this.frameworkStats.get(framework);
        if (stats) {
            stats.bufferUpdates++;
            this.stats.bufferUpdates++;
        }
    }
    
    /**
     * Validate GPU synchronization
     */
    async validateSynchronization(gl, frameworkName) {
        if (!gl) return null;
        
        const startTime = performance.now();
        
        try {
            // Force GPU sync
            gl.flush();
            gl.finish();
            
            // Check for errors after sync
            const error = gl.getError();
            const syncTime = performance.now() - startTime;
            
            const syncResult = {
                framework: frameworkName,
                syncTime,
                hasErrors: error !== gl.NO_ERROR,
                error: error !== gl.NO_ERROR ? this.getErrorString(gl, error) : null,
                timestamp: Date.now()
            };
            
            this.log(`GPU sync for ${frameworkName}: ${syncTime.toFixed(2)}ms`, 
                    syncResult.hasErrors ? 'warning' : 'info');
            
            return syncResult;
            
        } catch (error) {
            this.recordError(`GPU sync failed for ${frameworkName}`, error.message);
            return null;
        }
    }
    
    /**
     * Validate memory barriers (WebGL 2.0+)
     */
    validateMemoryBarriers(gl, frameworkName) {
        if (!gl || !gl.memoryBarrier) return;
        
        try {
            gl.memoryBarrier(gl.ALL_BARRIER_BITS);
            this.stats.memoryBarriers++;
            this.log(`Memory barrier executed for ${frameworkName}`, 'info');
        } catch (error) {
            this.recordError(`Memory barrier failed for ${frameworkName}`, error.message);
        }
    }
    
    /**
     * Get comprehensive GPU state report
     */
    getStateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            webglVersion: this.stats.webglVersion,
            globalStats: { ...this.stats },
            frameworkStats: Object.fromEntries(this.frameworkStats),
            contexts: Array.from(this.contexts.entries()).map(([gl, info]) => ({
                framework: info.framework,
                version: info.version,
                extensions: info.extensions,
                limits: info.limits,
                stats: info.stats
            })),
            recentErrors: this.stats.errors.slice(-10),
            memoryEstimate: {
                textureMemory: this.stats.textureMemory,
                jsHeapSize: this.stats.jsHeapSize,
                totalMemory: this.stats.totalMemory
            }
        };
        
        return report;
    }
    
    /**
     * Get current statistics
     */
    getStats() {
        return {
            ...this.stats,
            frameworkStats: Object.fromEntries(this.frameworkStats),
            contextCount: this.contexts.size,
            monitoringActive: this.monitoringActive
        };
    }
    
    /**
     * Reset all statistics
     */
    resetStats() {
        this.stats = {
            webglVersion: this.stats.webglVersion,
            drawCalls: 0,
            bufferUpdates: 0,
            textureMemory: 0,
            shaderCompilations: 0,
            memoryBarriers: 0,
            contextSwitches: 0,
            errors: []
        };
        
        this.frameworkStats.forEach(stats => {
            stats.drawCalls = 0;
            stats.bufferUpdates = 0;
            stats.textureUploads = 0;
            stats.shaderCompilations = 0;
        });
        
        this.log('GPU statistics reset', 'info');
    }
    
    /**
     * Export validation data
     */
    exportValidationData() {
        return {
            metadata: {
                timestamp: Date.now(),
                version: '1.0.0',
                monitoringDuration: Date.now() - this.startTime
            },
            report: this.getStateReport(),
            rawStats: this.getStats()
        };
    }
    
    log(message, level = 'info') {
        if (this.options.debugMode) {
            console.log(`[GPUStateValidator] ${message}`);
        }
        
        // Send to parent validator if available
        if (window.morphValidator) {
            window.morphValidator.log(`[GPU] ${message}`, level);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GPUStateValidator;
}