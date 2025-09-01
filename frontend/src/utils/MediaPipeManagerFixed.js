/**
 * Fixed MediaPipe Manager - Uses proper MediaPipe loading pattern
 * Fixes the "Unexpected token 'export'" errors by using correct loading method
 */

class MediaPipeManagerFixed {
    constructor() {
        this.faceLandmarker = null;
        this.isInitialized = false;
        this.isInitializing = false;
        this.lastError = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // Performance tracking
        this.performanceMetrics = {
            initTime: 0,
            analysisCount: 0,
            averageAnalysisTime: 0,
            errorCount: 0
        };
    }
    
    /**
     * Initialize MediaPipe Face Landmarker with correct loading pattern
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('✅ MediaPipe already initialized');
            return true;
        }
        
        if (this.isInitializing) {
            console.log('⏳ MediaPipe initialization in progress...');
            return false;
        }
        
        this.isInitializing = true;
        const startTime = performance.now();
        
        try {
            console.log('🚀 Starting MediaPipe Face Landmarker initialization...');
            
            // Method 1: Try the working MediaPipe pattern
            let FilesetResolver, FaceLandmarker;
            
            try {
                // Use the official MediaPipe hosted files approach
                console.log('📦 Loading MediaPipe via dynamic import...');
                
                // Load the tasks-vision module properly
                const visionModule = await this._loadVisionModule();
                FilesetResolver = visionModule.FilesetResolver;
                FaceLandmarker = visionModule.FaceLandmarker;
                
                if (!FilesetResolver || !FaceLandmarker) {
                    throw new Error('FilesetResolver or FaceLandmarker not found');
                }
                
                console.log('✅ MediaPipe modules loaded successfully');
                
            } catch (error) {
                console.error('❌ Failed to load MediaPipe modules:', error);
                throw new Error(`MediaPipe module loading failed: ${error.message}`);
            }
            
            // Initialize the vision fileset
            console.log('🔄 Initializing MediaPipe vision fileset...');
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
            );
            
            console.log('✅ Vision fileset initialized');
            
            // Create Face Landmarker
            console.log('🔄 Creating Face Landmarker...');
            this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                    delegate: 'GPU'
                },
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: true,
                runningMode: 'IMAGE',
                numFaces: 1
            });
            
            console.log('✅ Face Landmarker created successfully');
            
            this.isInitialized = true;
            this.performanceMetrics.initTime = performance.now() - startTime;
            
            console.log(`🎉 MediaPipe initialization complete in ${Math.round(this.performanceMetrics.initTime)}ms`);
            return true;
            
        } catch (error) {
            this.lastError = error;
            console.error('❌ MediaPipe initialization failed:', error);
            
            // Try fallback initialization
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`🔄 Retrying initialization (${this.retryCount}/${this.maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return await this.initialize();
            }
            
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }
    
    /**
     * Load MediaPipe vision module using the correct method
     */
    async _loadVisionModule() {
        // Try different loading strategies
        const strategies = [
            // Strategy 1: Direct CDN import
            async () => {
                console.log('🔄 Trying direct CDN import...');
                return await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision.js');
            },
            
            // Strategy 2: Alternative CDN
            async () => {
                console.log('🔄 Trying alternative CDN...');
                return await import('https://unpkg.com/@mediapipe/tasks-vision@0.10.3/vision.js');
            },
            
            // Strategy 3: Script tag loading with global detection
            async () => {
                console.log('🔄 Trying script tag loading...');
                await this._loadScriptTag('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision.js');
                
                // Wait for globals to be available
                await this._waitForGlobals(['FilesetResolver', 'FaceLandmarker'], 5000);
                
                return {
                    FilesetResolver: window.FilesetResolver,
                    FaceLandmarker: window.FaceLandmarker
                };
            }
        ];
        
        let lastError;
        
        for (const strategy of strategies) {
            try {
                const result = await strategy();
                if (result && result.FilesetResolver && result.FaceLandmarker) {
                    return result;
                }
            } catch (error) {
                lastError = error;
                console.warn(`Strategy failed:`, error.message);
            }
        }
        
        throw new Error(`All loading strategies failed. Last error: ${lastError?.message}`);
    }
    
    /**
     * Load script via script tag
     */
    async _loadScriptTag(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.type = 'text/javascript';
            
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Wait for global variables to be available
     */
    async _waitForGlobals(globalNames, timeout = 5000) {
        const startTime = Date.now();
        
        return new Promise((resolve, reject) => {
            const check = () => {
                const allAvailable = globalNames.every(name => window[name]);
                
                if (allAvailable) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error(`Timeout waiting for globals: ${globalNames.join(', ')}`));
                } else {
                    setTimeout(check, 100);
                }
            };
            
            check();
        });
    }
    
    /**
     * Analyze image for face landmarks
     */
    async analyzeImage(imageElement) {
        if (!this.isInitialized || !this.faceLandmarker) {
            throw new Error('MediaPipe not initialized');
        }
        
        try {
            const startTime = performance.now();
            
            const results = await this.faceLandmarker.detect(imageElement);
            
            const analysisTime = performance.now() - startTime;
            this.performanceMetrics.analysisCount++;
            this.performanceMetrics.averageAnalysisTime = 
                (this.performanceMetrics.averageAnalysisTime * (this.performanceMetrics.analysisCount - 1) + analysisTime) 
                / this.performanceMetrics.analysisCount;
            
            return results;
            
        } catch (error) {
            this.performanceMetrics.errorCount++;
            throw error;
        }
    }
    
    /**
     * Get status information
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isInitializing: this.isInitializing,
            lastError: this.lastError?.message,
            performanceMetrics: this.performanceMetrics
        };
    }
    
    /**
     * Dispose resources
     */
    dispose() {
        if (this.faceLandmarker) {
            this.faceLandmarker.close();
            this.faceLandmarker = null;
        }
        this.isInitialized = false;
    }
}

export default MediaPipeManagerFixed;