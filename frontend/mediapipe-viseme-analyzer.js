/**
 * MediaPipe Face Landmarker v2 - Complete Implementation
 * @fileoverview Comprehensive MediaPipe Face Landmarker v2 implementation for precise viseme analysis
 * @author Claude Code Implementation Agent
 * @version 2.1.0
 * 
 * Features:
 * - MediaPipe Face Landmarker v2 integration
 * - Real-time video processing
 * - 468-point facial landmark detection
 * - Viseme classification from landmarks
 * - Three.js morph target integration
 * - Comprehensive error handling and recovery
 * - Performance optimization and metrics
 * - Debug mode and monitoring
 */

/**
 * MediaPipe Face Landmarker v2 Viseme Analyzer
 * Complete implementation matching all test expectations
 */
class MediaPipeVisemeAnalyzer {
    constructor() {
        this.faceLandmarker = null;
        this.isInitialized = false;
        this.isInitializing = false;
        this.lastLandmarks = null;
        this.lastError = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.debugMode = false;
        
        // Performance tracking
        this.performanceMetrics = {
            initTime: 0,
            analysisCount: 0,
            averageAnalysisTime: 0,
            errorCount: 0,
            totalProcessingTime: 0,
            lastAnalysisTime: 0,
            frameRate: 0,
            memoryUsage: 0
        };
        
        // MediaPipe Face Landmarker v2 landmark indices (468 points)
        this.landmarkIndices = {
            // Core mouth landmarks
            upperLipTop: 13,
            upperLipBottom: 12, 
            lowerLipTop: 15,
            lowerLipBottom: 16,
            leftMouthCorner: 61,
            rightMouthCorner: 291,
            leftUpperLip: 84,
            rightUpperLip: 314,
            leftLowerLip: 17,
            rightLowerLip: 18,
            
            // Jaw landmarks
            jawLeft: 172,
            jawRight: 397,
            jawBottom: 18,
            chinTip: 175,
            
            // Additional mouth detail points
            lipCenter: 0,
            noseBottom: 2,
            
            // Full lip contour for precise measurements (MediaPipe Face Landmarker v2 indices)
            lipOutline: [
                61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318,
                402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82, 13,
                312, 15, 16, 17, 18, 200, 199, 175, 0, 269, 270, 267, 271, 272
            ],
            
            // Inner mouth landmarks
            innerMouth: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308],
            
            // Teeth visibility landmarks
            upperTeeth: [13, 82, 81, 80, 78],
            lowerTeeth: [14, 17, 18, 200, 199]
        };
        
        // Viseme target configurations based on phonetic analysis
        this.visemeTargets = {
            'pp': { // Bilabial plosive (P, B, M)
                lipGap: 0,
                mouthWidth: 0.4,
                jawOpening: 0.1,
                lipCompression: 0.9,
                description: 'Bilabial closure'
            },
            'ff': { // Labiodental fricative (F, V)
                lipGap: 0.2,
                mouthWidth: 0.9,
                jawOpening: 0.2,
                lipCompression: 0.6,
                description: 'Lower lip to upper teeth'
            },
            'th': { // Dental fricative (TH)
                lipGap: 0.3,
                mouthWidth: 0.95,
                jawOpening: 0.3,
                tongueVisible: true,
                description: 'Tongue tip visible'
            },
            'aa': { // Open vowel (A, AH)
                lipGap: 0.8,
                mouthWidth: 1.0,
                jawOpening: 0.9,
                lipCompression: 0.1,
                description: 'Maximum opening'
            },
            'oh': { // Rounded vowel (O, OH)
                lipGap: 0.4,
                mouthWidth: 0.6,
                jawOpening: 0.4,
                lipRounding: 0.9,
                description: 'Lip rounding'
            },
            'ee': { // Close front vowel (EE, I)
                lipGap: 0.3,
                mouthWidth: 1.2,
                jawOpening: 0.2,
                lipSpreading: 0.9,
                description: 'Lip spreading'
            },
            'oo': { // Close back vowel (OO, U)
                lipGap: 0.2,
                mouthWidth: 0.5,
                jawOpening: 0.15,
                lipRounding: 1.0,
                description: 'Maximum rounding'
            },
            'kk': { // Velar stop (K, G)
                lipGap: 0.4,
                mouthWidth: 0.8,
                jawOpening: 0.5,
                tongueBack: 0.8,
                description: 'Tongue back raised'
            },
            'nn': { // Nasal (N, NG)
                lipGap: 0.1,
                mouthWidth: 0.7,
                jawOpening: 0.3,
                nasalResonance: 0.9,
                description: 'Nasal resonance'
            },
            'rr': { // Liquid (R, L)
                lipGap: 0.4,
                mouthWidth: 0.8,
                jawOpening: 0.4,
                tonguePosition: 0.7,
                description: 'Tongue positioning'
            },
            'ss': { // Sibilant (S, SH, Z)
                lipGap: 0.2,
                mouthWidth: 0.9,
                jawOpening: 0.25,
                tongueGroove: 0.8,
                description: 'Tongue groove for airflow'
            },
            'ch': { // Affricate (CH, J)
                lipGap: 0.3,
                mouthWidth: 0.85,
                jawOpening: 0.35,
                tongueTip: 0.8,
                description: 'Tongue tip raised'
            }
        };
        
        // MediaPipe configuration with stable version and fallback sources
        this.config = {
            // Primary MediaPipe source (stable version 0.10.6)
            primaryWasmPath: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.6/wasm",
            modelPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            
            // Fallback CDN sources with stable versions
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
                }
            ],
            
            // Landmarker options
            landmarkerOptions: {
                runningMode: 'VIDEO',
                numFaces: 1,
                minFaceDetectionConfidence: 0.5,
                minFacePresenceConfidence: 0.5,
                minTrackingConfidence: 0.5,
                refineLandmarks: true,
                outputFaceBlendshapes: false,
                outputFacialTransformationMatrixes: false
            }
        };
    }
    
    /**
     * Initialize MediaPipe Face Landmarker v2 with comprehensive error handling
     * @returns {boolean} Success status
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('✅ MediaPipe Face Landmarker already initialized');
            return true;
        }
        
        if (this.isInitializing) {
            console.log('⏳ MediaPipe initialization in progress...');
            return false;
        }
        
        this.isInitializing = true;
        const startTime = performance.now();
        
        try {
            console.log('🚀 Initializing MediaPipe Face Landmarker v2...');
            
            // Load MediaPipe modules with fallback mechanism
            const { FilesetResolver, FaceLandmarker } = await this.loadMediaPipeModules();
            
            // Initialize FilesetResolver with WASM files
            const vision = await this.initializeFileset(FilesetResolver);
            
            // Create FaceLandmarker instance
            this.faceLandmarker = await this.createFaceLandmarker(FaceLandmarker, vision);
            
            this.isInitialized = true;
            this.performanceMetrics.initTime = performance.now() - startTime;
            
            console.log(`🎉 MediaPipe Face Landmarker v2 initialized successfully in ${Math.round(this.performanceMetrics.initTime)}ms`);
            
            if (this.debugMode) {
                this.logInitializationDetails();
            }
            
            return true;
            
        } catch (error) {
            this.lastError = error;
            this.performanceMetrics.errorCount++;
            console.error('❌ MediaPipe initialization failed:', error);
            
            // Attempt recovery with fallback sources
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`🔄 Retrying initialization (${this.retryCount}/${this.maxRetries})...`);
                
                // Exponential backoff
                await this.delay(Math.pow(2, this.retryCount) * 1000);
                return await this.initialize();
            }
            
            return false;
            
        } finally {
            this.isInitializing = false;
        }
    }
    
    /**
     * Load MediaPipe modules with comprehensive fallback mechanism
     */
    async loadMediaPipeModules() {
        console.log('📦 Loading MediaPipe modules...');
        
        // Try primary source first (stable version)
        try {
            const mediapikeModule = await this.loadModuleFromSource(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.6/vision_bundle.mjs"
            );
            
            if (mediapikeModule.FilesetResolver && mediapikeModule.FaceLandmarker) {
                console.log('✅ MediaPipe modules loaded from primary source');
                return mediapikeModule;
            }
        } catch (error) {
            console.warn('⚠️ Primary source failed, trying fallbacks...', error.message);
        }
        
        // Try fallback sources
        for (let i = 0; i < this.config.fallbackSources.length; i++) {
            const source = this.config.fallbackSources[i];
            
            try {
                console.log(`🔄 Trying fallback source ${i + 1}/${this.config.fallbackSources.length}...`);
                
                const module = await this.loadModuleFromSource(source.moduleUrl);
                
                if (module.FilesetResolver && module.FaceLandmarker) {
                    console.log(`✅ MediaPipe modules loaded from fallback source ${i + 1}`);
                    return module;
                }
                
            } catch (error) {
                console.warn(`❌ Fallback source ${i + 1} failed:`, error.message);
            }
        }
        
        throw new Error('Failed to load MediaPipe modules from all sources');
    }
    
    /**
     * Load MediaPipe module from specific source with timeout
     */
    async loadModuleFromSource(moduleUrl) {
        return new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Module loading timeout: ${moduleUrl}`));
            }, 10000);
            
            try {
                const module = await import(moduleUrl);
                clearTimeout(timeout);
                resolve(module);
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }
    
    /**
     * Initialize FilesetResolver with WASM files and fallback mechanism
     */
    async initializeFileset(FilesetResolver) {
        console.log('🔄 Initializing FilesetResolver...');
        
        // Try primary WASM path
        try {
            const vision = await this.createVisionWithTimeout(FilesetResolver, this.config.primaryWasmPath);
            console.log('✅ FilesetResolver initialized with primary WASM path');
            return vision;
        } catch (error) {
            console.warn('⚠️ Primary WASM path failed, trying fallbacks...', error.message);
        }
        
        // Try fallback WASM paths
        for (let i = 0; i < this.config.fallbackSources.length; i++) {
            const source = this.config.fallbackSources[i];
            
            try {
                console.log(`🔄 Trying fallback WASM path ${i + 1}/${this.config.fallbackSources.length}...`);
                
                const vision = await this.createVisionWithTimeout(FilesetResolver, source.wasmPath);
                console.log(`✅ FilesetResolver initialized with fallback WASM path ${i + 1}`);
                return vision;
                
            } catch (error) {
                console.warn(`❌ Fallback WASM path ${i + 1} failed:`, error.message);
            }
        }
        
        throw new Error('Failed to initialize FilesetResolver with all WASM sources');
    }
    
    /**
     * Create vision FilesetResolver with timeout protection
     */
    async createVisionWithTimeout(FilesetResolver, wasmPath) {
        return new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`FilesetResolver timeout for path: ${wasmPath}`));
            }, 15000);
            
            try {
                const vision = await FilesetResolver.forVisionTasks(wasmPath);
                clearTimeout(timeout);
                resolve(vision);
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
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
        
        if (this.debugMode) {
            console.log('⚙️ FaceLandmarker options:', options);
        }
        
        try {
            const faceLandmarker = await Promise.race([
                FaceLandmarker.createFromOptions(vision, options),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('FaceLandmarker creation timeout')), 20000)
                )
            ]);
            
            console.log('✅ FaceLandmarker created successfully');
            return faceLandmarker;
            
        } catch (error) {
            console.error('❌ FaceLandmarker creation failed:', error);
            throw error;
        }
    }
    
    /**
     * Analyze face landmarks from video element
     * @param {HTMLVideoElement} videoElement - Video element to analyze
     * @param {number} timestamp - Video timestamp in milliseconds
     * @returns {Object|null} Analysis results or null if no face detected
     */
    async analyzeLandmarks(videoElement, timestamp) {
        if (!this.isInitialized || !this.faceLandmarker) {
            console.warn('⚠️ MediaPipe not initialized');
            return null;
        }
        
        if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) {
            console.warn('⚠️ Invalid video element');
            return null;
        }
        
        const startTime = performance.now();
        
        try {
            // Perform face detection
            const results = await this.detectFaceWithRetry(videoElement, timestamp);
            
            if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
                return null;
            }
            
            const landmarks = results.faceLandmarks[0];
            const analysisTime = performance.now() - startTime;
            
            // Update performance metrics
            this.updatePerformanceMetrics(analysisTime);
            
            // Process and cache results
            const processedResults = {
                landmarks: landmarks,
                timestamp: timestamp,
                confidence: this.calculateConfidence(landmarks),
                analysisTime: analysisTime,
                frameSize: {
                    width: videoElement.videoWidth,
                    height: videoElement.videoHeight
                }
            };
            
            this.lastLandmarks = processedResults;
            
            if (this.debugMode) {
                this.logAnalysisResults(processedResults);
            }
            
            return processedResults;
            
        } catch (error) {
            this.performanceMetrics.errorCount++;
            this.lastError = error;
            console.error('❌ Face landmark analysis failed:', error);
            return null;
        }
    }
    
    /**
     * Detect face with automatic retry mechanism
     */
    async detectFaceWithRetry(videoElement, timestamp, maxRetries = 2) {
        let lastError = null;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return this.faceLandmarker.detectForVideo(videoElement, timestamp);
            } catch (error) {
                lastError = error;
                if (i < maxRetries - 1) {
                    console.warn(`⚠️ Detection attempt ${i + 1} failed, retrying...`);
                    await this.delay(50);
                }
            }
        }
        
        throw lastError;
    }
    
    /**
     * Calculate mouth measurements from landmarks
     * @param {Array} landmarks - Face landmarks array
     * @returns {Object} Mouth measurements
     */
    calculateMouthMeasurements(landmarks) {
        if (!landmarks || landmarks.length < 468) {
            throw new Error('Invalid landmarks data - expected 468 points');
        }
        
        const measurements = {};
        
        try {
            // Get key landmark points
            const upperLip = landmarks[this.landmarkIndices.upperLipTop];
            const lowerLip = landmarks[this.landmarkIndices.lowerLipBottom];
            const leftCorner = landmarks[this.landmarkIndices.leftMouthCorner];
            const rightCorner = landmarks[this.landmarkIndices.rightMouthCorner];
            const chinTip = landmarks[this.landmarkIndices.chinTip];
            const noseBottom = landmarks[this.landmarkIndices.noseBottom];
            
            // Basic measurements
            measurements.lipGap = this.calculateDistance(upperLip, lowerLip);
            measurements.mouthWidth = this.calculateDistance(leftCorner, rightCorner);
            measurements.jawOpening = this.calculateDistance(chinTip, noseBottom);
            
            // Advanced measurements
            measurements.lipCompression = this.calculateLipCompression(landmarks);
            measurements.lipRounding = this.calculateLipRounding(landmarks);
            measurements.mouthAspectRatio = measurements.lipGap / measurements.mouthWidth;
            measurements.jawWidth = this.calculateJawWidth(landmarks);
            
            // Normalize measurements (0-1 scale)
            measurements.normalized = this.normalizeMeasurements(measurements);
            
            return measurements;
            
        } catch (error) {
            console.error('❌ Mouth measurement calculation failed:', error);
            throw error;
        }
    }
    
    /**
     * Classify viseme from mouth measurements
     * @param {Object} measurements - Mouth measurements
     * @returns {string} Classified viseme
     */
    classifyViseme(measurements) {
        if (!measurements || typeof measurements !== 'object') {
            throw new Error('Invalid measurements object');
        }
        
        const scores = {};
        
        // Calculate similarity scores for each viseme
        Object.keys(this.visemeTargets).forEach(viseme => {
            scores[viseme] = this.calculateVisemeScore(measurements, viseme);
        });
        
        // Find best matching viseme
        const bestMatch = Object.keys(scores).reduce((best, current) => {
            return scores[current] > scores[best] ? current : best;
        });
        
        return bestMatch;
    }
    
    /**
     * Classify viseme with confidence score
     * @param {Object} measurements - Mouth measurements
     * @returns {Object} Viseme classification with confidence
     */
    classifyVisemeWithConfidence(measurements) {
        const scores = {};
        
        // Calculate scores for all visemes
        Object.keys(this.visemeTargets).forEach(viseme => {
            scores[viseme] = this.calculateVisemeScore(measurements, viseme);
        });
        
        // Sort by score
        const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        const bestViseme = sortedScores[0][0];
        const bestScore = sortedScores[0][1];
        
        // Calculate confidence based on score separation
        const secondBestScore = sortedScores.length > 1 ? sortedScores[1][1] : 0;
        const confidence = Math.min(1.0, Math.max(0.1, bestScore + (bestScore - secondBestScore)));
        
        return {
            viseme: bestViseme,
            confidence: confidence,
            allScores: scores
        };
    }
    
    /**
     * Calculate distance between two landmark points
     */
    calculateDistance(point1, point2) {
        if (!point1 || !point2) return 0;
        
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        const dz = (point1.z || 0) - (point2.z || 0);
        
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    /**
     * Calculate lip compression from landmarks
     */
    calculateLipCompression(landmarks) {
        try {
            const upperLipPoints = this.landmarkIndices.lipOutline
                .slice(0, 6)
                .map(i => landmarks[i]);
            const lowerLipPoints = this.landmarkIndices.lipOutline
                .slice(6, 12)
                .map(i => landmarks[i]);
            
            let totalCompression = 0;
            const pairs = Math.min(upperLipPoints.length, lowerLipPoints.length);
            
            for (let i = 0; i < pairs; i++) {
                totalCompression += this.calculateDistance(upperLipPoints[i], lowerLipPoints[i]);
            }
            
            return totalCompression / pairs;
        } catch (error) {
            return 0.5; // Default value
        }
    }
    
    /**
     * Calculate lip rounding from landmarks
     */
    calculateLipRounding(landmarks) {
        try {
            const leftCorner = landmarks[this.landmarkIndices.leftMouthCorner];
            const rightCorner = landmarks[this.landmarkIndices.rightMouthCorner];
            const upperCenter = landmarks[this.landmarkIndices.upperLipTop];
            const lowerCenter = landmarks[this.landmarkIndices.lowerLipBottom];
            
            const horizontalWidth = this.calculateDistance(leftCorner, rightCorner);
            const verticalHeight = this.calculateDistance(upperCenter, lowerCenter);
            
            // Rounding is inversely related to aspect ratio
            const aspectRatio = horizontalWidth / (verticalHeight + 0.001);
            return Math.max(0, Math.min(1, 1 / (aspectRatio + 0.1)));
        } catch (error) {
            return 0.5; // Default value
        }
    }
    
    /**
     * Calculate jaw width from landmarks
     */
    calculateJawWidth(landmarks) {
        try {
            const jawLeft = landmarks[this.landmarkIndices.jawLeft];
            const jawRight = landmarks[this.landmarkIndices.jawRight];
            return this.calculateDistance(jawLeft, jawRight);
        } catch (error) {
            return 0.5; // Default value
        }
    }
    
    /**
     * Normalize measurements to 0-1 scale
     */
    normalizeMeasurements(measurements) {
        return {
            lipGap: Math.min(1.0, Math.max(0, measurements.lipGap * 10)),
            mouthWidth: Math.min(1.0, Math.max(0, measurements.mouthWidth * 5)),
            jawOpening: Math.min(1.0, Math.max(0, measurements.jawOpening * 2)),
            lipCompression: Math.min(1.0, Math.max(0, measurements.lipCompression * 8)),
            lipRounding: measurements.lipRounding, // Already normalized
            mouthAspectRatio: Math.min(1.0, Math.max(0, measurements.mouthAspectRatio))
        };
    }
    
    /**
     * Calculate viseme similarity score
     */
    calculateVisemeScore(measurements, viseme) {
        const target = this.visemeTargets[viseme];
        if (!target) return 0;
        
        const norm = measurements.normalized || this.normalizeMeasurements(measurements);
        let score = 0;
        let weights = 0;
        
        // Compare each metric with weights
        const metrics = [
            { key: 'lipGap', weight: 1.0 },
            { key: 'mouthWidth', weight: 1.0 },
            { key: 'jawOpening', weight: 0.8 },
            { key: 'lipCompression', weight: 0.7 },
            { key: 'lipRounding', weight: 0.6 }
        ];
        
        metrics.forEach(metric => {
            if (target[metric.key] !== undefined && norm[metric.key] !== undefined) {
                const difference = Math.abs(norm[metric.key] - target[metric.key]);
                const similarity = Math.max(0, 1 - difference);
                score += similarity * metric.weight;
                weights += metric.weight;
            }
        });
        
        return weights > 0 ? score / weights : 0;
    }
    
    /**
     * Calculate confidence based on landmark quality
     */
    calculateConfidence(landmarks) {
        if (!landmarks || landmarks.length < 468) return 0;
        
        try {
            // Check landmark stability (z-coordinate variance)
            const zValues = landmarks.map(p => p.z || 0);
            const avgZ = zValues.reduce((sum, z) => sum + z, 0) / zValues.length;
            const variance = zValues.reduce((sum, z) => sum + Math.pow(z - avgZ, 2), 0) / zValues.length;
            
            // Higher variance = lower confidence
            const stabilityScore = Math.max(0, Math.min(1, 1 - variance * 10));
            
            // Check mouth landmark completeness
            const mouthPoints = this.landmarkIndices.lipOutline.map(i => landmarks[i]);
            const validPoints = mouthPoints.filter(p => p && p.x >= 0 && p.y >= 0).length;
            const completenessScore = validPoints / mouthPoints.length;
            
            return (stabilityScore + completenessScore) / 2;
        } catch (error) {
            return 0.5; // Default confidence
        }
    }
    
    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(analysisTime) {
        this.performanceMetrics.analysisCount++;
        this.performanceMetrics.totalProcessingTime += analysisTime;
        this.performanceMetrics.lastAnalysisTime = analysisTime;
        this.performanceMetrics.averageAnalysisTime = 
            this.performanceMetrics.totalProcessingTime / this.performanceMetrics.analysisCount;
        
        // Calculate frame rate (rough estimate)
        if (this.performanceMetrics.analysisCount > 1) {
            this.performanceMetrics.frameRate = 1000 / this.performanceMetrics.averageAnalysisTime;
        }
    }
    
    // === Integration Methods for Three.js ===
    
    /**
     * Get Three.js morph targets for current viseme
     * @returns {Object} Morph target influences
     */
    getVisemeMorphTargets() {
        if (!this.lastLandmarks) return {};
        
        try {
            const measurements = this.calculateMouthMeasurements(this.lastLandmarks.landmarks);
            const classification = this.classifyVisemeWithConfidence(measurements);
            
            return this.convertToMorphTargets(classification, measurements);
        } catch (error) {
            console.error('❌ Failed to get morph targets:', error);
            return {};
        }
    }
    
    /**
     * Get morph influences for Three.js integration
     * @returns {Array} Array of morph influences [0-1]
     */
    getMorphInfluences() {
        const morphTargets = this.getVisemeMorphTargets();
        
        // Convert to standard Three.js morph influence array
        return [
            morphTargets.mouthClose || 0,
            morphTargets.mouthOpen || 0,
            morphTargets.mouthPucker || 0,
            morphTargets.mouthStretch || 0,
            morphTargets.jawOpen || 0
        ];
    }
    
    /**
     * Convert viseme classification to Three.js morph targets
     */
    convertToMorphTargets(classification, measurements) {
        const morphTargets = {};
        const norm = measurements.normalized;
        
        // Map measurements to standard morph targets
        morphTargets.mouthClose = Math.max(0, 1 - norm.lipGap);
        morphTargets.mouthOpen = norm.lipGap;
        morphTargets.mouthPucker = norm.lipRounding;
        morphTargets.mouthStretch = Math.max(0, norm.mouthWidth - 0.5) * 2;
        morphTargets.jawOpen = norm.jawOpening;
        
        // Apply viseme-specific adjustments
        const viseme = classification.viseme;
        const confidence = classification.confidence;
        
        switch (viseme) {
            case 'pp':
                morphTargets.mouthClose = Math.max(morphTargets.mouthClose, 0.9 * confidence);
                morphTargets.mouthOpen = Math.min(morphTargets.mouthOpen, 0.1);
                break;
            case 'aa':
                morphTargets.mouthOpen = Math.max(morphTargets.mouthOpen, 0.8 * confidence);
                morphTargets.jawOpen = Math.max(morphTargets.jawOpen, 0.7 * confidence);
                break;
            case 'oh':
                morphTargets.mouthPucker = Math.max(morphTargets.mouthPucker, 0.8 * confidence);
                break;
            case 'ee':
                morphTargets.mouthStretch = Math.max(morphTargets.mouthStretch, 0.7 * confidence);
                break;
        }
        
        return morphTargets;
    }
    
    // === Real-time Processing Methods ===
    
    /**
     * Process single video frame for real-time analysis
     * @param {HTMLVideoElement} video - Video element
     * @returns {Object} Frame analysis results
     */
    async processVideoFrame(video) {
        if (!video.currentTime) return null;
        
        const timestamp = video.currentTime * 1000;
        return await this.analyzeLandmarks(video, timestamp);
    }
    
    /**
     * Get latest viseme classification
     * @returns {Object|null} Latest viseme data
     */
    getLatestViseme() {
        if (!this.lastLandmarks) return null;
        
        try {
            const measurements = this.calculateMouthMeasurements(this.lastLandmarks.landmarks);
            return this.classifyVisemeWithConfidence(measurements);
        } catch (error) {
            console.error('❌ Failed to get latest viseme:', error);
            return null;
        }
    }
    
    // === Debug and Monitoring Methods ===
    
    /**
     * Enable debug mode with detailed logging
     * @param {boolean} enabled - Enable debug mode
     */
    enableDebugMode(enabled = true) {
        this.debugMode = enabled;
        console.log(`🔧 Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Get comprehensive performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            isInitialized: this.isInitialized,
            hasResults: !!this.lastLandmarks,
            lastError: this.lastError?.message || null,
            memoryUsage: this.estimateMemoryUsage()
        };
    }
    
    /**
     * Estimate memory usage
     */
    estimateMemoryUsage() {
        try {
            if (performance.memory) {
                return {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                };
            }
        } catch (error) {
            // Memory API not available
        }
        return null;
    }
    
    /**
     * Log initialization details
     */
    logInitializationDetails() {
        console.log('🔍 MediaPipe Initialization Details:');
        console.log('  - Landmark points:', 468);
        console.log('  - Available visemes:', Object.keys(this.visemeTargets).length);
        console.log('  - Initialization time:', `${Math.round(this.performanceMetrics.initTime)}ms`);
        console.log('  - Debug mode:', this.debugMode);
    }
    
    /**
     * Log analysis results for debugging
     */
    logAnalysisResults(results) {
        console.log('🔍 Analysis Results:');
        console.log('  - Landmarks detected:', results.landmarks.length);
        console.log('  - Confidence:', results.confidence.toFixed(3));
        console.log('  - Processing time:', `${Math.round(results.analysisTime)}ms`);
        console.log('  - Frame size:', `${results.frameSize.width}x${results.frameSize.height}`);
    }
    
    // === Cleanup and Utility Methods ===
    
    /**
     * Clean up resources and free memory
     */
    cleanup() {
        if (this.faceLandmarker) {
            try {
                this.faceLandmarker.close();
            } catch (error) {
                console.warn('⚠️ Warning during FaceLandmarker cleanup:', error.message);
            }
            this.faceLandmarker = null;
        }
        
        this.lastLandmarks = null;
        this.lastError = null;
        this.isInitialized = false;
        this.isInitializing = false;
        
        // Reset performance metrics
        Object.keys(this.performanceMetrics).forEach(key => {
            this.performanceMetrics[key] = 0;
        });
        
        console.log('🧹 MediaPipe Viseme Analyzer cleaned up');
    }
    
    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Get comprehensive status information
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isInitializing: this.isInitializing,
            hasLandmarks: !!this.lastLandmarks,
            lastError: this.lastError?.message || null,
            retryCount: this.retryCount,
            debugMode: this.debugMode,
            performanceMetrics: this.getPerformanceMetrics(),
            availableVisemes: Object.keys(this.visemeTargets),
            version: '2.1.0-complete'
        };
    }
}

// Export for ES6 module usage
export default MediaPipeVisemeAnalyzer;