/**
 * Advanced Viseme Optimizer for MediaPipe Face Landmarker v2
 * Leverages 468-point facial landmarks for precise lip sync viseme generation
 * 
 * Features:
 * - Geometric analysis of mouth landmarks
 * - Smooth interpolation between viseme states
 * - Real-time performance optimization
 * - Confidence scoring and noise reduction
 * - Three.js morph target integration
 */

import { LandmarkToVisemeMapping } from './LandmarkToVisemeMapping.js';

export class VisemeOptimizer {
    constructor(options = {}) {
        this.options = {
            smoothingFactor: options.smoothingFactor || 0.3,
            confidenceThreshold: options.confidenceThreshold || 0.7,
            interpolationFrames: options.interpolationFrames || 5,
            noiseReductionEnabled: options.noiseReductionEnabled !== false,
            performanceMode: options.performanceMode || 'balanced', // 'fast', 'balanced', 'quality'
            batchSize: options.batchSize || 10,
            ...options
        };

        this.mapping = new LandmarkToVisemeMapping();
        this.previousVisemes = [];
        this.frameBuffer = [];
        this.confidenceHistory = [];
        this.morphTargetWeights = {};
        
        // Performance optimization caches
        this.landmarkCache = new Map();
        this.visemeCache = new Map();
        this.lastProcessTime = 0;
        this.targetFPS = options.targetFPS || 30;

        this.initializeVisemeStates();
    }

    initializeVisemeStates() {
        // Standard viseme phonemes with Three.js morph target mappings
        this.visemeStates = {
            'sil': { // Silence
                mouthOpen: 0.0,
                mouthWide: 0.0,
                jawOpen: 0.0,
                lipsTogether: 1.0,
                tongueUp: 0.0
            },
            'AA': { // 'hot', 'father'
                mouthOpen: 0.8,
                mouthWide: 0.6,
                jawOpen: 0.7,
                lipsTogether: 0.0,
                tongueUp: 0.1
            },
            'AE': { // 'cat', 'bat'
                mouthOpen: 0.5,
                mouthWide: 0.8,
                jawOpen: 0.4,
                lipsTogether: 0.0,
                tongueUp: 0.2
            },
            'AH': { // 'but', 'cup'
                mouthOpen: 0.4,
                mouthWide: 0.3,
                jawOpen: 0.3,
                lipsTogether: 0.0,
                tongueUp: 0.1
            },
            'AO': { // 'bought', 'dog'
                mouthOpen: 0.7,
                mouthWide: 0.2,
                jawOpen: 0.6,
                lipsTogether: 0.0,
                tongueUp: 0.0
            },
            'AW': { // 'cow', 'how'
                mouthOpen: 0.6,
                mouthWide: 0.4,
                jawOpen: 0.5,
                lipsTogether: 0.0,
                tongueUp: 0.0
            },
            'AY': { // 'my', 'buy'
                mouthOpen: 0.5,
                mouthWide: 0.7,
                jawOpen: 0.4,
                lipsTogether: 0.0,
                tongueUp: 0.1
            },
            'B': { // 'big', 'boy'
                mouthOpen: 0.0,
                mouthWide: 0.0,
                jawOpen: 0.0,
                lipsTogether: 1.0,
                tongueUp: 0.0
            },
            'CH': { // 'church', 'chair'
                mouthOpen: 0.2,
                mouthWide: 0.0,
                jawOpen: 0.1,
                lipsTogether: 0.0,
                tongueUp: 0.8
            },
            'D': { // 'dog', 'day'
                mouthOpen: 0.1,
                mouthWide: 0.2,
                jawOpen: 0.1,
                lipsTogether: 0.0,
                tongueUp: 1.0
            },
            'DH': { // 'that', 'this'
                mouthOpen: 0.2,
                mouthWide: 0.3,
                jawOpen: 0.1,
                lipsTogether: 0.0,
                tongueUp: 0.9
            },
            'EH': { // 'bet', 'red'
                mouthOpen: 0.3,
                mouthWide: 0.6,
                jawOpen: 0.2,
                lipsTogether: 0.0,
                tongueUp: 0.3
            },
            'ER': { // 'bird', 'her'
                mouthOpen: 0.2,
                mouthWide: 0.1,
                jawOpen: 0.1,
                lipsTogether: 0.0,
                tongueUp: 0.7
            },
            'EY': { // 'say', 'day'
                mouthOpen: 0.3,
                mouthWide: 0.7,
                jawOpen: 0.2,
                lipsTogether: 0.0,
                tongueUp: 0.2
            },
            'F': { // 'fish', 'phone'
                mouthOpen: 0.1,
                mouthWide: 0.0,
                jawOpen: 0.0,
                lipsTogether: 0.0,
                tongueUp: 0.0
            },
            'G': { // 'good', 'go'
                mouthOpen: 0.1,
                mouthWide: 0.1,
                jawOpen: 0.1,
                lipsTogether: 0.0,
                tongueUp: 0.8
            },
            'HH': { // 'house', 'hat'
                mouthOpen: 0.2,
                mouthWide: 0.2,
                jawOpen: 0.1,
                lipsTogether: 0.0,
                tongueUp: 0.0
            },
            'IH': { // 'bit', 'hit'
                mouthOpen: 0.2,
                mouthWide: 0.5,
                jawOpen: 0.1,
                lipsTogether: 0.0,
                tongueUp: 0.4
            },
            'IY': { // 'see', 'beat'
                mouthOpen: 0.1,
                mouthWide: 0.8,
                jawOpen: 0.0,
                lipsTogether: 0.0,
                tongueUp: 0.5
            },
            'JH': { // 'judge', 'joy'
                mouthOpen: 0.2,
                mouthWide: 0.0,
                jawOpen: 0.1,
                lipsTogether: 0.0,
                tongueUp: 0.8
            },
            'K': { // 'cat', 'key'
                mouthOpen: 0.1,
                mouthWide: 0.1,
                jawOpen: 0.1,
                lipsTogether: 0.0,
                tongueUp: 0.9
            },
            'L': { // 'look', 'love'
                mouthOpen: 0.2,
                mouthWide: 0.2,
                jawOpen: 0.1,
                lipsTogether: 0.0,
                tongueUp: 1.0
            },
            'M': { // 'man', 'mom'
                mouthOpen: 0.0,
                mouthWide: 0.0,
                jawOpen: 0.0,
                lipsTogether: 1.0,
                tongueUp: 0.0
            },
            'N': { // 'no', 'name'
                mouthOpen: 0.1,
                mouthWide: 0.2,
                jawOpen: 0.0,
                lipsTogether: 0.0,
                tongueUp: 1.0
            },
            'NG': { // 'sing', 'ring'
                mouthOpen: 0.1,
                mouthWide: 0.1,
                jawOpen: 0.1,
                lipsTogether: 0.0,
                tongueUp: 0.9
            },
            'OW': { // 'go', 'show'
                mouthOpen: 0.5,
                mouthWide: 0.0,
                jawOpen: 0.4,
                lipsTogether: 0.0,
                tongueUp: 0.0
            },
            'OY': { // 'boy', 'toy'
                mouthOpen: 0.4,
                mouthWide: 0.3,
                jawOpen: 0.3,
                lipsTogether: 0.0,
                tongueUp: 0.0
            },
            'P': { // 'put', 'pop'
                mouthOpen: 0.0,
                mouthWide: 0.0,
                jawOpen: 0.0,
                lipsTogether: 1.0,
                tongueUp: 0.0
            },
            'R': { // 'red', 'run'
                mouthOpen: 0.2,
                mouthWide: 0.1,
                jawOpen: 0.1,
                lipsTogether: 0.0,
                tongueUp: 0.7
            },
            'S': { // 'see', 'sun'
                mouthOpen: 0.1,
                mouthWide: 0.3,
                jawOpen: 0.0,
                lipsTogether: 0.0,
                tongueUp: 0.8
            },
            'SH': { // 'shoe', 'fish'
                mouthOpen: 0.1,
                mouthWide: 0.0,
                jawOpen: 0.0,
                lipsTogether: 0.0,
                tongueUp: 0.6
            },
            'T': { // 'top', 'time'
                mouthOpen: 0.1,
                mouthWide: 0.2,
                jawOpen: 0.0,
                lipsTogether: 0.0,
                tongueUp: 1.0
            },
            'TH': { // 'think', 'math'
                mouthOpen: 0.1,
                mouthWide: 0.3,
                jawOpen: 0.0,
                lipsTogether: 0.0,
                tongueUp: 0.9
            },
            'UH': { // 'book', 'good'
                mouthOpen: 0.2,
                mouthWide: 0.1,
                jawOpen: 0.1,
                lipsTogether: 0.0,
                tongueUp: 0.3
            },
            'UW': { // 'you', 'new'
                mouthOpen: 0.3,
                mouthWide: 0.0,
                jawOpen: 0.2,
                lipsTogether: 0.0,
                tongueUp: 0.2
            },
            'V': { // 'very', 'voice'
                mouthOpen: 0.1,
                mouthWide: 0.0,
                jawOpen: 0.0,
                lipsTogether: 0.0,
                tongueUp: 0.0
            },
            'W': { // 'water', 'way'
                mouthOpen: 0.2,
                mouthWide: 0.0,
                jawOpen: 0.1,
                lipsTogether: 0.0,
                tongueUp: 0.1
            },
            'Y': { // 'yes', 'you'
                mouthOpen: 0.2,
                mouthWide: 0.4,
                jawOpen: 0.1,
                lipsTogether: 0.0,
                tongueUp: 0.6
            },
            'Z': { // 'zoo', 'zero'
                mouthOpen: 0.1,
                mouthWide: 0.3,
                jawOpen: 0.0,
                lipsTogether: 0.0,
                tongueUp: 0.8
            },
            'ZH': { // 'measure', 'vision'
                mouthOpen: 0.1,
                mouthWide: 0.0,
                jawOpen: 0.0,
                lipsTogether: 0.0,
                tongueUp: 0.6
            }
        };
    }

    /**
     * Process landmarks and generate optimized visemes
     * @param {Array} landmarks - MediaPipe 468-point facial landmarks
     * @param {Object} options - Processing options
     * @returns {Object} Viseme data with confidence scores
     */
    async processLandmarks(landmarks, options = {}) {
        const startTime = performance.now();
        
        // Performance throttling based on target FPS
        if (this.shouldThrottle(startTime)) {
            return this.getLastValidResult();
        }

        try {
            // Extract mouth landmarks with caching
            const mouthLandmarks = this.extractMouthLandmarks(landmarks);
            
            // Calculate geometric features
            const geometryFeatures = this.calculateGeometricFeatures(mouthLandmarks);
            
            // Generate viseme classification
            const visemeResult = await this.classifyViseme(geometryFeatures, options);
            
            // Apply smoothing and interpolation
            const smoothedViseme = this.applySmoothing(visemeResult);
            
            // Calculate confidence score
            const confidence = this.calculateConfidence(smoothedViseme, geometryFeatures);
            
            // Generate morph target weights
            const morphTargets = this.generateMorphTargets(smoothedViseme, confidence);
            
            const result = {
                viseme: smoothedViseme.phoneme,
                confidence: confidence,
                morphTargets: morphTargets,
                geometryFeatures: geometryFeatures,
                processingTime: performance.now() - startTime,
                timestamp: startTime
            };

            this.cacheResult(result);
            this.lastProcessTime = startTime;
            
            return result;
            
        } catch (error) {
            console.warn('VisemeOptimizer processing error:', error);
            return this.getLastValidResult();
        }
    }

    /**
     * Process batch of landmark frames for offline processing
     * @param {Array} landmarkFrames - Array of landmark frames
     * @param {Object} options - Batch processing options
     * @returns {Array} Array of viseme results
     */
    async processBatch(landmarkFrames, options = {}) {
        const results = [];
        const batchSize = options.batchSize || this.options.batchSize;
        
        for (let i = 0; i < landmarkFrames.length; i += batchSize) {
            const batch = landmarkFrames.slice(i, i + batchSize);
            const batchPromises = batch.map(landmarks => 
                this.processLandmarks(landmarks, { ...options, batch: true })
            );
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Apply batch-level smoothing
            if (results.length > 1) {
                this.applyBatchSmoothing(results, Math.max(0, results.length - batchSize));
            }
        }
        
        return results;
    }

    /**
     * Extract mouth landmarks from the 468-point face model
     */
    extractMouthLandmarks(landmarks) {
        // MediaPipe Face Landmarker v2 mouth indices
        const mouthIndices = {
            outer: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318],
            inner: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415],
            upperLip: [61, 84, 17, 314, 405, 320, 307, 375, 269, 270, 267, 271, 272],
            lowerLip: [146, 91, 181, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318]
        };

        const extractPoints = (indices) => 
            indices.map(i => landmarks[i] ? {
                x: landmarks[i].x,
                y: landmarks[i].y,
                z: landmarks[i].z || 0
            } : null).filter(p => p !== null);

        return {
            outer: extractPoints(mouthIndices.outer),
            inner: extractPoints(mouthIndices.inner),
            upperLip: extractPoints(mouthIndices.upperLip),
            lowerLip: extractPoints(mouthIndices.lowerLip),
            leftCorner: landmarks[61] ? { x: landmarks[61].x, y: landmarks[61].y, z: landmarks[61].z || 0 } : null,
            rightCorner: landmarks[291] ? { x: landmarks[291].x, y: landmarks[291].y, z: landmarks[291].z || 0 } : null,
            topCenter: landmarks[13] ? { x: landmarks[13].x, y: landmarks[13].y, z: landmarks[13].z || 0 } : null,
            bottomCenter: landmarks[14] ? { x: landmarks[14].x, y: landmarks[14].y, z: landmarks[14].z || 0 } : null
        };
    }

    /**
     * Calculate geometric features from mouth landmarks
     */
    calculateGeometricFeatures(mouthLandmarks) {
        const features = {};

        try {
            // Mouth width (horizontal distance between corners)
            if (mouthLandmarks.leftCorner && mouthLandmarks.rightCorner) {
                features.mouthWidth = this.euclideanDistance(
                    mouthLandmarks.leftCorner, 
                    mouthLandmarks.rightCorner
                );
            }

            // Mouth height (vertical distance between top and bottom center)
            if (mouthLandmarks.topCenter && mouthLandmarks.bottomCenter) {
                features.mouthHeight = this.euclideanDistance(
                    mouthLandmarks.topCenter,
                    mouthLandmarks.bottomCenter
                );
            }

            // Mouth area approximation using convex hull
            if (mouthLandmarks.outer.length > 0) {
                features.mouthArea = this.calculatePolygonArea(mouthLandmarks.outer);
            }

            // Lip separation (gap between upper and lower lip)
            if (mouthLandmarks.upperLip.length > 0 && mouthLandmarks.lowerLip.length > 0) {
                features.lipSeparation = this.calculateLipSeparation(
                    mouthLandmarks.upperLip,
                    mouthLandmarks.lowerLip
                );
            }

            // Aspect ratio (width/height)
            if (features.mouthWidth && features.mouthHeight) {
                features.aspectRatio = features.mouthWidth / features.mouthHeight;
            }

            // Mouth curvature (smile/frown detection)
            features.curvature = this.calculateMouthCurvature(mouthLandmarks);

            // Lip roundness (how circular the mouth shape is)
            features.roundness = this.calculateLipRoundness(mouthLandmarks.outer);

            // Jaw opening (3D depth analysis)
            features.jawOpening = this.calculateJawOpening(mouthLandmarks);

        } catch (error) {
            console.warn('Error calculating geometric features:', error);
        }

        return features;
    }

    /**
     * Classify viseme based on geometric features
     */
    async classifyViseme(features, options = {}) {
        // Use machine learning model or rule-based classification
        const phoneme = await this.mapping.classifyPhoneme(features, options);
        
        return {
            phoneme: phoneme,
            confidence: this.calculateClassificationConfidence(features, phoneme),
            features: features,
            alternatives: await this.mapping.getAlternativePhonemes(features, 3)
        };
    }

    /**
     * Apply temporal smoothing to viseme transitions
     */
    applySmoothing(visemeResult) {
        if (!this.options.smoothingEnabled) return visemeResult;

        this.previousVisemes.push(visemeResult);
        
        // Keep only recent frames for smoothing
        const maxHistory = this.options.interpolationFrames;
        if (this.previousVisemes.length > maxHistory) {
            this.previousVisemes = this.previousVisemes.slice(-maxHistory);
        }

        if (this.previousVisemes.length < 2) {
            return visemeResult;
        }

        // Weighted average based on confidence and recency
        const weights = this.previousVisemes.map((v, i) => {
            const recencyWeight = (i + 1) / this.previousVisemes.length;
            const confidenceWeight = v.confidence || 0.5;
            return recencyWeight * confidenceWeight;
        });

        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        const normalizedWeights = weights.map(w => w / totalWeight);

        // Smooth phoneme selection (use most confident recent phoneme)
        const recentConfident = this.previousVisemes
            .slice(-3)
            .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];

        return {
            ...visemeResult,
            phoneme: recentConfident.phoneme,
            confidence: Math.min(1.0, (visemeResult.confidence + recentConfident.confidence) / 2),
            smoothed: true
        };
    }

    /**
     * Generate Three.js morph target weights
     */
    generateMorphTargets(visemeResult, confidence) {
        const phoneme = visemeResult.phoneme;
        const baseWeights = this.visemeStates[phoneme] || this.visemeStates['sil'];
        
        // Apply confidence scaling
        const morphTargets = {};
        for (const [target, weight] of Object.entries(baseWeights)) {
            morphTargets[target] = weight * confidence;
        }

        // Smooth transitions between morph targets
        if (this.morphTargetWeights && Object.keys(this.morphTargetWeights).length > 0) {
            const smoothing = this.options.smoothingFactor;
            for (const target in morphTargets) {
                if (this.morphTargetWeights[target] !== undefined) {
                    morphTargets[target] = 
                        (1 - smoothing) * this.morphTargetWeights[target] + 
                        smoothing * morphTargets[target];
                }
            }
        }

        this.morphTargetWeights = morphTargets;
        return morphTargets;
    }

    /**
     * Calculate confidence score for viseme detection
     */
    calculateConfidence(visemeResult, features) {
        let confidence = visemeResult.confidence || 0.5;

        // Adjust confidence based on landmark quality
        if (features.mouthWidth && features.mouthHeight) {
            const geometryConfidence = Math.min(1.0, 
                (features.mouthWidth + features.mouthHeight) / 0.1
            );
            confidence *= geometryConfidence;
        }

        // Historical consistency boost
        if (this.confidenceHistory.length > 0) {
            const avgHistoricalConfidence = this.confidenceHistory
                .slice(-5)
                .reduce((sum, c) => sum + c, 0) / Math.min(5, this.confidenceHistory.length);
            
            confidence = 0.7 * confidence + 0.3 * avgHistoricalConfidence;
        }

        this.confidenceHistory.push(confidence);
        if (this.confidenceHistory.length > 10) {
            this.confidenceHistory.shift();
        }

        return Math.max(0.0, Math.min(1.0, confidence));
    }

    /**
     * Utility method to calculate Euclidean distance between two 3D points
     */
    euclideanDistance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        const dz = (point1.z || 0) - (point2.z || 0);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * Calculate area of a polygon defined by points
     */
    calculatePolygonArea(points) {
        if (points.length < 3) return 0;
        
        let area = 0;
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
        }
        return Math.abs(area) / 2;
    }

    /**
     * Calculate average distance between upper and lower lips
     */
    calculateLipSeparation(upperLip, lowerLip) {
        if (upperLip.length === 0 || lowerLip.length === 0) return 0;
        
        let totalDistance = 0;
        let count = 0;
        
        for (const upperPoint of upperLip) {
            for (const lowerPoint of lowerLip) {
                totalDistance += this.euclideanDistance(upperPoint, lowerPoint);
                count++;
            }
        }
        
        return count > 0 ? totalDistance / count : 0;
    }

    /**
     * Calculate mouth curvature (positive for smile, negative for frown)
     */
    calculateMouthCurvature(mouthLandmarks) {
        if (!mouthLandmarks.leftCorner || !mouthLandmarks.rightCorner || !mouthLandmarks.topCenter) {
            return 0;
        }
        
        const leftCorner = mouthLandmarks.leftCorner;
        const rightCorner = mouthLandmarks.rightCorner;
        const topCenter = mouthLandmarks.topCenter;
        
        // Calculate the y-difference between corners and top center
        const avgCornerY = (leftCorner.y + rightCorner.y) / 2;
        return topCenter.y - avgCornerY;
    }

    /**
     * Calculate how round/circular the mouth shape is
     */
    calculateLipRoundness(outerPoints) {
        if (outerPoints.length < 4) return 0;
        
        // Calculate centroid
        const centroid = {
            x: outerPoints.reduce((sum, p) => sum + p.x, 0) / outerPoints.length,
            y: outerPoints.reduce((sum, p) => sum + p.y, 0) / outerPoints.length
        };
        
        // Calculate distances from centroid
        const distances = outerPoints.map(p => this.euclideanDistance(p, centroid));
        const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
        
        // Calculate variance (lower variance = more round)
        const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
        
        // Return roundness score (inverse of normalized variance)
        return Math.max(0, 1 - (variance / (avgDistance * avgDistance)));
    }

    /**
     * Calculate jaw opening using 3D depth information
     */
    calculateJawOpening(mouthLandmarks) {
        if (!mouthLandmarks.topCenter || !mouthLandmarks.bottomCenter) {
            return 0;
        }
        
        const topZ = mouthLandmarks.topCenter.z || 0;
        const bottomZ = mouthLandmarks.bottomCenter.z || 0;
        const verticalDistance = Math.abs(mouthLandmarks.topCenter.y - mouthLandmarks.bottomCenter.y);
        const depthDistance = Math.abs(topZ - bottomZ);
        
        // Combine vertical and depth components for jaw opening estimate
        return Math.sqrt(verticalDistance * verticalDistance + depthDistance * depthDistance);
    }

    /**
     * Performance throttling based on target FPS
     */
    shouldThrottle(currentTime) {
        if (this.options.performanceMode === 'fast') {
            const targetInterval = 1000 / this.targetFPS;
            return (currentTime - this.lastProcessTime) < targetInterval;
        }
        return false;
    }

    /**
     * Get the last valid processing result for throttled frames
     */
    getLastValidResult() {
        return this.frameBuffer.length > 0 ? 
            this.frameBuffer[this.frameBuffer.length - 1] : 
            {
                viseme: 'sil',
                confidence: 0.5,
                morphTargets: this.visemeStates['sil'],
                processingTime: 0,
                timestamp: performance.now(),
                throttled: true
            };
    }

    /**
     * Cache processing results for performance optimization
     */
    cacheResult(result) {
        this.frameBuffer.push(result);
        if (this.frameBuffer.length > 30) { // Keep last 30 frames
            this.frameBuffer.shift();
        }
    }

    /**
     * Apply smoothing across batch results
     */
    applyBatchSmoothing(results, startIndex) {
        const smoothingWindow = 3;
        
        for (let i = Math.max(startIndex, smoothingWindow); i < results.length - smoothingWindow; i++) {
            const window = results.slice(i - smoothingWindow, i + smoothingWindow + 1);
            const avgConfidence = window.reduce((sum, r) => sum + r.confidence, 0) / window.length;
            
            // Smooth confidence scores
            results[i].confidence = avgConfidence;
            
            // Smooth morph targets
            for (const target in results[i].morphTargets) {
                const avgWeight = window.reduce((sum, r) => sum + (r.morphTargets[target] || 0), 0) / window.length;
                results[i].morphTargets[target] = avgWeight;
            }
        }
    }

    /**
     * Calculate classification confidence based on feature consistency
     */
    calculateClassificationConfidence(features, phoneme) {
        // Implement feature-phoneme consistency scoring
        const expectedFeatures = this.getExpectedFeatures(phoneme);
        let confidence = 0.5;
        
        if (expectedFeatures && features) {
            let matchCount = 0;
            let totalChecks = 0;
            
            for (const [feature, expectedValue] of Object.entries(expectedFeatures)) {
                if (features[feature] !== undefined) {
                    const difference = Math.abs(features[feature] - expectedValue);
                    const match = difference < 0.1; // Threshold for feature matching
                    if (match) matchCount++;
                    totalChecks++;
                }
            }
            
            if (totalChecks > 0) {
                confidence = matchCount / totalChecks;
            }
        }
        
        return Math.max(0.1, Math.min(1.0, confidence));
    }

    /**
     * Get expected geometric features for a phoneme
     */
    getExpectedFeatures(phoneme) {
        // Map phonemes to expected geometric features
        const featureMap = {
            'AA': { aspectRatio: 0.5, mouthHeight: 0.8, roundness: 0.6 },
            'EE': { aspectRatio: 2.0, mouthHeight: 0.2, roundness: 0.2 },
            'OO': { aspectRatio: 1.0, mouthHeight: 0.6, roundness: 0.9 },
            'M': { aspectRatio: 0.1, mouthHeight: 0.0, roundness: 0.8 },
            'B': { aspectRatio: 0.1, mouthHeight: 0.0, roundness: 0.8 },
            'P': { aspectRatio: 0.1, mouthHeight: 0.0, roundness: 0.8 },
            'sil': { aspectRatio: 1.5, mouthHeight: 0.1, roundness: 0.3 }
        };
        
        return featureMap[phoneme] || featureMap['sil'];
    }

    /**
     * Get current optimization settings
     */
    getOptimizationSettings() {
        return {
            ...this.options,
            cacheSize: this.landmarkCache.size,
            bufferLength: this.frameBuffer.length,
            averageProcessingTime: this.calculateAverageProcessingTime()
        };
    }

    /**
     * Calculate average processing time from recent frames
     */
    calculateAverageProcessingTime() {
        if (this.frameBuffer.length === 0) return 0;
        
        const recentFrames = this.frameBuffer.slice(-10);
        const totalTime = recentFrames.reduce((sum, frame) => sum + (frame.processingTime || 0), 0);
        return totalTime / recentFrames.length;
    }

    /**
     * Update optimization settings dynamically
     */
    updateSettings(newSettings) {
        this.options = { ...this.options, ...newSettings };
        
        // Clear caches if performance mode changed
        if (newSettings.performanceMode && newSettings.performanceMode !== this.options.performanceMode) {
            this.clearCaches();
        }
    }

    /**
     * Clear all caches for memory management
     */
    clearCaches() {
        this.landmarkCache.clear();
        this.visemeCache.clear();
        this.frameBuffer = [];
        this.previousVisemes = [];
        this.confidenceHistory = [];
    }
}

export default VisemeOptimizer;