/**
 * MediaPipe Manager - Fixed Implementation
 * @fileoverview Consolidated MediaPipe Face Landmarker with proper error handling
 * @author Claude Code Implementation Agent
 * @version 1.0.0-fixed
 * 
 * Key Fixes:
 * - Uses stable MediaPipe version 0.10.6
 * - Proper FilesetResolver loading pattern
 * - Robust CDN fallback strategy
 * - Cross-origin request handling
 * - Module resolution fixes
 */

class MediaPipeManager {
    constructor() {
        this.faceLandmarker = null;
        this.isInitialized = false;
        this.isInitializing = false;
        this.lastError = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // Use stable MediaPipe version 0.10.6
        this.config = {
            // Primary source - stable version
            primarySource: {
                wasmPath: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.6/wasm",
                moduleUrl: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.6/vision_bundle.mjs"
            },
            
            // Fallback sources with stable versions
            fallbackSources: [
                {
                    wasmPath: "https://unpkg.com/@mediapipe/tasks-vision@0.10.6/wasm",
                    moduleUrl: "https://unpkg.com/@mediapipe/tasks-vision@0.10.6/vision_bundle.mjs"
                },
                {
                    wasmPath: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.5/wasm",
                    moduleUrl: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.5/vision_bundle.mjs"
                },
                {
                    wasmPath: "https://unpkg.com/@mediapipe/tasks-vision@0.10.5/wasm",
                    moduleUrl: "https://unpkg.com/@mediapipe/tasks-vision@0.10.5/vision_bundle.mjs"
                },
                {
                    wasmPath: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
                    moduleUrl: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs"
                }
            ],
            
            modelPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            
            landmarkerOptions: {
                runningMode: 'IMAGE',
                numFaces: 1,
                minFaceDetectionConfidence: 0.5,
                minFacePresenceConfidence: 0.5,
                minTrackingConfidence: 0.5,
                refineLandmarks: true,
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: false
            }
        };
        
        this.performanceMetrics = {
            initTime: 0,
            analysisCount: 0,
            errorCount: 0,
            lastAnalysisTime: 0
        };
        
        this.connectionDiagnostics = {
            testedSources: [],
            workingSources: [],
            failedSources: []
        };
    }
    
    /**
     * Initialize MediaPipe Face Landmarker with robust loading strategy
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('✅ MediaPipe already initialized');
            return true;
        }
        
        if (this.isInitializing) {
            console.log('⏳ Initialization in progress...');
            return false;
        }
        
        this.isInitializing = true;
        const startTime = performance.now();
        
        try {
            console.log('🚀 Initializing MediaPipe Face Landmarker (Fixed v1.0.0)...');
            
            // Test WebGL support
            const hasWebGL = this.testWebGLSupport();
            console.log(`🎨 WebGL Support: ${hasWebGL ? 'Available' : 'Not Available'}`);
            
            // Load MediaPipe modules with fallback strategy
            const { FilesetResolver, FaceLandmarker } = await this.loadMediaPipeModules();
            
            // Initialize FilesetResolver with WASM files
            const vision = await this.initializeFilesetResolver(FilesetResolver);
            
            // Create FaceLandmarker instance
            this.faceLandmarker = await this.createFaceLandmarker(FaceLandmarker, vision);
            
            this.isInitialized = true;
            this.performanceMetrics.initTime = performance.now() - startTime;
            
            console.log(`🎉 MediaPipe initialized successfully in ${Math.round(this.performanceMetrics.initTime)}ms`);
            return true;
            
        } catch (error) {
            this.lastError = error;
            this.performanceMetrics.errorCount++;
            console.error('❌ MediaPipe initialization failed:', error);
            
            // Record failed attempt
            this.connectionDiagnostics.failedSources.push({
                source: 'initialization',
                error: error.message,
                timestamp: Date.now()
            });
            
            return false;
            
        } finally {
            this.isInitializing = false;
        }
    }
    
    /**
     * Load MediaPipe modules with comprehensive fallback strategy
     */
    async loadMediaPipeModules() {
        console.log('📦 Loading MediaPipe modules with fallback strategy...');
        
        // Try primary source first
        const primarySource = this.config.primarySource;
        try {
            console.log('🔄 Trying primary source (v0.10.6)...');
            this.connectionDiagnostics.testedSources.push(primarySource.moduleUrl);
            
            const module = await this.loadModuleFromSource(primarySource.moduleUrl, 8000);
            
            if (module.FilesetResolver && module.FaceLandmarker) {
                console.log('✅ MediaPipe modules loaded from primary source');
                this.connectionDiagnostics.workingSources.push(primarySource.moduleUrl);
                return module;
            }
        } catch (error) {
            console.warn('⚠️ Primary source failed:', error.message);
            this.connectionDiagnostics.failedSources.push({
                source: primarySource.moduleUrl,
                error: error.message,
                timestamp: Date.now()
            });
        }
        
        // Try fallback sources
        for (let i = 0; i < this.config.fallbackSources.length; i++) {
            const source = this.config.fallbackSources[i];
            
            try {
                console.log(`🔄 Trying fallback source ${i + 1}/${this.config.fallbackSources.length}...`);
                this.connectionDiagnostics.testedSources.push(source.moduleUrl);
                
                const module = await this.loadModuleFromSource(source.moduleUrl, 6000);
                
                if (module.FilesetResolver && module.FaceLandmarker) {
                    console.log(`✅ MediaPipe modules loaded from fallback source ${i + 1}`);
                    this.connectionDiagnostics.workingSources.push(source.moduleUrl);
                    return module;
                }
                
            } catch (error) {
                console.warn(`❌ Fallback source ${i + 1} failed:`, error.message);
                this.connectionDiagnostics.failedSources.push({
                    source: source.moduleUrl,
                    error: error.message,
                    timestamp: Date.now()
                });
            }
        }
        
        throw new Error('Failed to load MediaPipe modules from all sources. Check network connectivity and CORS settings.');
    }
    
    /**
     * Load MediaPipe module from specific source with timeout and error handling
     */
    async loadModuleFromSource(moduleUrl, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Module loading timeout (${timeout}ms): ${moduleUrl}`));
            }, timeout);
            
            // Use dynamic import with error handling
            import(moduleUrl)
                .then(module => {
                    clearTimeout(timer);
                    
                    // Verify module exports
                    if (!module.FilesetResolver || !module.FaceLandmarker) {
                        reject(new Error(`Invalid module exports from: ${moduleUrl}`));
                        return;
                    }
                    
                    resolve(module);
                })
                .catch(error => {
                    clearTimeout(timer);
                    reject(new Error(`Module import failed: ${error.message}`));
                });
        });
    }
    
    /**
     * Initialize FilesetResolver with robust fallback mechanism
     */
    async initializeFilesetResolver(FilesetResolver) {
        console.log('🔄 Initializing FilesetResolver with WASM files...');
        
        // Try primary WASM path
        const primaryWasmPath = this.config.primarySource.wasmPath;
        try {
            console.log('🔄 Trying primary WASM path...');
            const vision = await this.createFilesetResolver(FilesetResolver, primaryWasmPath);
            console.log('✅ FilesetResolver initialized with primary WASM path');
            return vision;
        } catch (error) {
            console.warn('⚠️ Primary WASM path failed:', error.message);
        }
        
        // Try fallback WASM paths
        for (let i = 0; i < this.config.fallbackSources.length; i++) {
            const source = this.config.fallbackSources[i];
            
            try {
                console.log(`🔄 Trying fallback WASM path ${i + 1}/${this.config.fallbackSources.length}...`);
                const vision = await this.createFilesetResolver(FilesetResolver, source.wasmPath);
                console.log(`✅ FilesetResolver initialized with fallback WASM path ${i + 1}`);
                return vision;
                
            } catch (error) {
                console.warn(`❌ Fallback WASM path ${i + 1} failed:`, error.message);
            }
        }
        
        throw new Error('Failed to initialize FilesetResolver with all WASM sources');
    }
    
    /**
     * Create FilesetResolver with timeout protection
     */
    async createFilesetResolver(FilesetResolver, wasmPath) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`FilesetResolver timeout for: ${wasmPath}`));
            }, 12000);
            
            FilesetResolver.forVisionTasks(wasmPath)
                .then(vision => {
                    clearTimeout(timeout);
                    resolve(vision);
                })
                .catch(error => {
                    clearTimeout(timeout);
                    reject(new Error(`FilesetResolver creation failed: ${error.message}`));
                });
        });
    }
    
    /**
     * Create FaceLandmarker instance with optimal configuration
     */
    async createFaceLandmarker(FaceLandmarker, vision) {
        console.log('🎯 Creating FaceLandmarker instance...');
        
        const options = {
            baseOptions: {
                modelAssetPath: this.config.modelPath,
                delegate: "GPU" // Use GPU acceleration when available
            },
            ...this.config.landmarkerOptions
        };
        
        console.log('⚙️ FaceLandmarker options:', options);
        
        try {
            const faceLandmarker = await Promise.race([
                FaceLandmarker.createFromOptions(vision, options),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('FaceLandmarker creation timeout')), 15000)
                )
            ]);
            
            console.log('✅ FaceLandmarker created successfully');
            return faceLandmarker;
            
        } catch (error) {
            console.error('❌ FaceLandmarker creation failed:', error);
            throw new Error(`FaceLandmarker creation failed: ${error.message}`);
        }
    }
    
    /**
     * Analyze face in image with comprehensive error handling
     * @param {HTMLImageElement} imageElement - Image element to analyze
     * @param {Object} options - Analysis options
     * @returns {Object} Analysis results
     */
    async analyzeFace(imageElement, options = {}) {
        if (!this.isInitialized || !this.faceLandmarker) {
            throw new Error('MediaPipe not initialized. Call initialize() first.');
        }
        
        if (!imageElement || !imageElement.complete) {
            throw new Error('Invalid or unloaded image element');
        }
        
        const startTime = performance.now();
        
        try {
            console.log('👤 Analyzing face landmarks...');
            
            // Perform face detection
            const results = this.faceLandmarker.detect(imageElement);
            const analysisTime = performance.now() - startTime;
            
            // Update performance metrics
            this.performanceMetrics.analysisCount++;
            this.performanceMetrics.lastAnalysisTime = analysisTime;
            
            // Process results
            const processedResults = {
                hasFace: results.faceLandmarks && results.faceLandmarks.length > 0,
                faceLandmarks: results.faceLandmarks || [],
                faceBlendshapes: results.faceBlendshapes || [],
                confidence: this.calculateConfidence(results),
                analysisTime: analysisTime,
                timestamp: Date.now()
            };
            
            // Add debug information if requested
            if (options.includeDebug) {
                processedResults.debug = {
                    landmarkCount: results.faceLandmarks?.[0]?.length || 0,
                    blendshapeCount: results.faceBlendshapes?.[0]?.categories?.length || 0,
                    imageSize: {
                        width: imageElement.naturalWidth || imageElement.width,
                        height: imageElement.naturalHeight || imageElement.height
                    }
                };
            }
            
            console.log(`✅ Face analysis completed in ${Math.round(analysisTime)}ms`);
            return processedResults;
            
        } catch (error) {
            this.performanceMetrics.errorCount++;
            this.lastError = error;
            console.error('❌ Face analysis failed:', error);
            throw new Error(`Face analysis failed: ${error.message}`);
        }
    }
    
    /**
     * Calculate confidence based on detection results
     */
    calculateConfidence(results) {
        if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
            return 0;
        }
        
        // Simple confidence calculation based on landmark count
        const landmarkCount = results.faceLandmarks[0]?.length || 0;
        const expectedLandmarks = 468; // MediaPipe Face Landmarker standard
        
        return Math.min(1.0, landmarkCount / expectedLandmarks);
    }
    
    /**
     * Test WebGL support
     */
    testWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return !!gl;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Reinitialize MediaPipe (for testing)
     */
    async reinitialize() {
        console.log('🔄 Reinitializing MediaPipe...');
        
        // Clean up existing instance
        if (this.faceLandmarker) {
            try {
                this.faceLandmarker.close();
            } catch (error) {
                console.warn('Warning during cleanup:', error.message);
            }
        }
        
        // Reset state
        this.faceLandmarker = null;
        this.isInitialized = false;
        this.isInitializing = false;
        this.lastError = null;
        this.retryCount = 0;
        
        // Clear diagnostics
        this.connectionDiagnostics = {
            testedSources: [],
            workingSources: [],
            failedSources: []
        };
        
        // Initialize again
        return await this.initialize();
    }
    
    /**
     * Get current status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isInitializing: this.isInitializing,
            hasWebGL: this.testWebGLSupport(),
            lastError: this.lastError?.message || null,
            performanceMetrics: { ...this.performanceMetrics },
            version: '1.0.0-fixed',
            mediaVersion: '0.10.6-stable'
        };
    }
    
    /**
     * Get connection diagnostics
     */
    getConnectionDiagnostics() {
        return {
            ...this.connectionDiagnostics,
            totalTested: this.connectionDiagnostics.testedSources.length,
            totalWorking: this.connectionDiagnostics.workingSources.length,
            totalFailed: this.connectionDiagnostics.failedSources.length,
            successRate: this.connectionDiagnostics.testedSources.length > 0 
                ? this.connectionDiagnostics.workingSources.length / this.connectionDiagnostics.testedSources.length 
                : 0
        };
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.faceLandmarker) {
            try {
                this.faceLandmarker.close();
            } catch (error) {
                console.warn('Warning during cleanup:', error.message);
            }
        }
        
        this.faceLandmarker = null;
        this.isInitialized = false;
        this.isInitializing = false;
        this.lastError = null;
        
        console.log('🧹 MediaPipe Manager cleaned up');
    }
}

export default MediaPipeManager;