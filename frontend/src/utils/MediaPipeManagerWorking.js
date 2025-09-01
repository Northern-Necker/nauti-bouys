/**
 * Working MediaPipe Manager using the proven FaceMesh approach
 * This avoids the "Unexpected token 'export'" errors by using the correct MediaPipe loading pattern
 */

class MediaPipeManagerWorking {
    constructor() {
        this.faceMesh = null;
        this.isInitialized = false;
        this.isInitializing = false;
        this.lastError = null;
        this.lastResults = null;
        
        // Performance tracking
        this.performanceMetrics = {
            initTime: 0,
            analysisCount: 0,
            averageAnalysisTime: 0,
            errorCount: 0
        };
        
        // Bind callback
        this.onResults = this.onResults.bind(this);
    }
    
    /**
     * Initialize MediaPipe with working script loading approach
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
            console.log('🚀 Initializing MediaPipe FaceMesh...');
            
            // Step 1: Load required scripts if not already loaded
            await this._ensureScriptsLoaded();
            
            // Step 2: Create FaceMesh instance
            if (typeof FaceMesh === 'undefined') {
                throw new Error('FaceMesh not available - scripts not loaded properly');
            }
            
            this.faceMesh = new FaceMesh({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                }
            });
            
            // Step 3: Configure FaceMesh
            this.faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            
            // Step 4: Set up results callback
            this.faceMesh.onResults(this.onResults);
            
            this.isInitialized = true;
            this.performanceMetrics.initTime = performance.now() - startTime;
            
            console.log(`✅ MediaPipe FaceMesh initialized in ${Math.round(this.performanceMetrics.initTime)}ms`);
            return true;
            
        } catch (error) {
            this.lastError = error;
            console.error('❌ MediaPipe initialization failed:', error);
            return false;
            
        } finally {
            this.isInitializing = false;
        }
    }
    
    /**
     * Ensure all required MediaPipe scripts are loaded
     */
    async _ensureScriptsLoaded() {
        const scripts = [
            {
                id: 'mediapipe-camera-utils',
                src: 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
                check: () => typeof Camera !== 'undefined'
            },
            {
                id: 'mediapipe-control-utils',
                src: 'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
                check: () => typeof ControlPanel !== 'undefined'
            },
            {
                id: 'mediapipe-drawing-utils',
                src: 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
                check: () => typeof drawConnectors !== 'undefined'
            },
            {
                id: 'mediapipe-face-mesh',
                src: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js',
                check: () => typeof FaceMesh !== 'undefined'
            }
        ];
        
        for (const script of scripts) {
            if (!script.check()) {
                console.log(`📦 Loading ${script.id}...`);
                await this._loadScript(script.id, script.src);
                
                // Wait for the script to initialize
                await this._waitFor(script.check, 5000);
            } else {
                console.log(`✅ ${script.id} already loaded`);
            }
        }
    }
    
    /**
     * Load a script dynamically
     */
    async _loadScript(id, src) {
        return new Promise((resolve, reject) => {
            // Check if already exists
            if (document.getElementById(id)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.id = id;
            script.src = src;
            script.crossOrigin = 'anonymous';
            
            script.onload = () => {
                console.log(`✅ Loaded: ${id}`);
                resolve();
            };
            
            script.onerror = () => {
                reject(new Error(`Failed to load script: ${src}`));
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Wait for a condition to be true
     */
    async _waitFor(condition, timeout = 5000) {
        const startTime = Date.now();
        
        return new Promise((resolve, reject) => {
            const check = () => {
                if (condition()) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Timeout waiting for condition'));
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }
    
    /**
     * Handle MediaPipe results
     */
    onResults(results) {
        this.lastResults = results;
        this.performanceMetrics.analysisCount++;
        
        // Process landmarks for viseme analysis
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            
            // Extract key mouth landmarks for viseme analysis
            this.lastLandmarks = this._extractMouthLandmarks(landmarks);
        }
    }
    
    /**
     * Extract mouth landmarks for viseme analysis
     */
    _extractMouthLandmarks(landmarks) {
        // MediaPipe Face Mesh landmark indices for mouth
        const mouthIndices = {
            // Upper lip
            upperLip: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318],
            // Lower lip  
            lowerLip: [78, 191, 80, 81, 82, 13, 312, 15, 16, 17, 18, 200],
            // Mouth corners
            leftCorner: 61,
            rightCorner: 291,
            // Mouth center points
            upperCenter: 13,
            lowerCenter: 14
        };
        
        const mouthLandmarks = {};
        
        // Extract specific landmark points
        mouthLandmarks.leftCorner = landmarks[mouthIndices.leftCorner];
        mouthLandmarks.rightCorner = landmarks[mouthIndices.rightCorner];
        mouthLandmarks.upperCenter = landmarks[mouthIndices.upperCenter];
        mouthLandmarks.lowerCenter = landmarks[mouthIndices.lowerCenter];
        
        // Extract lip contours
        mouthLandmarks.upperLip = mouthIndices.upperLip.map(i => landmarks[i]);
        mouthLandmarks.lowerLip = mouthIndices.lowerLip.map(i => landmarks[i]);
        
        return mouthLandmarks;
    }
    
    /**
     * Analyze image for face landmarks
     */
    async analyzeImage(imageElement) {
        if (!this.isInitialized || !this.faceMesh) {
            throw new Error('MediaPipe not initialized');
        }
        
        const startTime = performance.now();
        
        try {
            // Send image to MediaPipe
            await this.faceMesh.send({image: imageElement});
            
            // Wait for results (they come via callback)
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const analysisTime = performance.now() - startTime;
            this.performanceMetrics.averageAnalysisTime = 
                (this.performanceMetrics.averageAnalysisTime * (this.performanceMetrics.analysisCount - 1) + analysisTime) 
                / this.performanceMetrics.analysisCount;
            
            return {
                landmarks: this.lastLandmarks,
                rawResults: this.lastResults,
                analysisTime
            };
            
        } catch (error) {
            this.performanceMetrics.errorCount++;
            throw error;
        }
    }
    
    /**
     * Get current status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isInitializing: this.isInitializing,
            hasResults: !!this.lastResults,
            lastError: this.lastError?.message,
            performanceMetrics: this.performanceMetrics
        };
    }
    
    /**
     * Dispose resources
     */
    dispose() {
        if (this.faceMesh) {
            this.faceMesh.close();
            this.faceMesh = null;
        }
        this.isInitialized = false;
        this.lastResults = null;
        this.lastLandmarks = null;
    }
}

export default MediaPipeManagerWorking;