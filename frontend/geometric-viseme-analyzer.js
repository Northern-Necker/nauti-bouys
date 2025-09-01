/**
 * Simplified Geometric Viseme Analyzer 
 * Canvas-based facial analysis without external dependencies
 * Provides precise viseme recommendations based on avatar morph state
 */

class GeometricVisemeAnalyzer {
    constructor() {
        this.isInitialized = false;
        this.lastAnalysis = null;
        
        // Viseme target specifications for geometric analysis
        this.visemeTargets = {
            'pp': { // Bilabial plosive (P, B, M sounds)
                lipGap: 0.0,          // Complete lip closure
                mouthWidth: 0.8,      // Slightly compressed width
                jawOpening: 0.1,      // Minimal jaw opening
                morphWeights: {
                    'V_Explosive': 0.9,
                    'Mouth_Close': 0.9,
                    'V_None': 0.1
                }
            },
            'ff': { // Labiodental fricative (F, V sounds)
                lipGap: 0.2,          // Small gap for air flow
                mouthWidth: 0.9,      // Normal width
                jawOpening: 0.2,      // Slight opening
                morphWeights: {
                    'V_Dental_Lip': 0.8,
                    'Mouth_Close': 0.3,
                    'V_None': 0.2
                }
            },
            'th': { // Dental fricative (TH sounds)
                lipGap: 0.3,          // Gap for tongue visibility
                mouthWidth: 0.95,     // Normal width
                jawOpening: 0.3,      // Opening for tongue
                morphWeights: {
                    'V_Dental_Lip': 0.6,
                    'V_Tongue_Out': 0.7,
                    'Jaw_Open': 0.3
                }
            },
            'aa': { // Open vowel (AH sound)
                lipGap: 0.8,          // Large opening
                mouthWidth: 1.0,      // Full width
                jawOpening: 0.9,      // Maximum opening
                morphWeights: {
                    'V_Open': 0.9,
                    'Jaw_Open': 0.8,
                    'Mouth_Stretch_L': 0.4,
                    'Mouth_Stretch_R': 0.4
                }
            },
            'oh': { // Rounded vowel (OH, OO sounds)
                lipGap: 0.4,          // Moderate opening
                mouthWidth: 0.6,      // Compressed for rounding
                jawOpening: 0.4,      // Moderate opening
                morphWeights: {
                    'V_Tight-O': 0.9,
                    'Mouth_Pucker': 0.8,
                    'Jaw_Open': 0.4
                }
            },
            'ee': { // High front vowel (EE sound)
                lipGap: 0.3,          // Small opening
                mouthWidth: 1.2,      // Wide smile-like
                jawOpening: 0.2,      // Minimal jaw
                morphWeights: {
                    'V_Wide': 0.9,
                    'Mouth_Stretch_L': 0.7,
                    'Mouth_Stretch_R': 0.7,
                    'Mouth_Smile': 0.5
                }
            }
        };
        
        // Current morph state tracking
        this.currentMorphState = {};
    }
    
    async initialize() {
        console.log('🔄 Initializing Geometric Viseme Analyzer...');
        this.isInitialized = true;
        console.log('✅ Geometric Viseme Analyzer initialized successfully');
        return true;
    }
    
    /**
     * Analyze viseme quality based on current morph state
     */
    async analyzeViseme(imageDataURL, targetViseme) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        try {
            const target = this.visemeTargets[targetViseme];
            if (!target) {
                throw new Error(`No target defined for viseme: ${targetViseme}`);
            }
            
            // Get current morph state from global avatar if available
            const currentMorphs = this.getCurrentMorphWeights();
            
            // Analyze how well current morphs match target
            const analysis = this.analyzeMorphAlignment(currentMorphs, target, targetViseme);
            
            // Generate precise recommendations
            analysis.recommendations = this.generateOptimizedRecommendations(
                analysis.deviations, 
                targetViseme, 
                currentMorphs
            );
            
            this.lastAnalysis = analysis;
            return analysis;
            
        } catch (error) {
            console.error('❌ Geometric analysis failed:', error);
            throw error;
        }
    }
    
    /**
     * Get current morph weights from the global avatar
     */
    getCurrentMorphWeights() {
        const morphs = {};
        
        if (typeof window !== 'undefined' && window.avatar) {
            // Extract morph influences from all meshes
            window.avatar.traverse((child) => {
                if (child.morphTargetDictionary && child.morphTargetInfluences) {
                    Object.entries(child.morphTargetDictionary).forEach(([name, index]) => {
                        const influence = child.morphTargetInfluences[index] || 0;
                        morphs[name] = Math.max(morphs[name] || 0, influence);
                    });
                }
            });
        }
        
        return morphs;
    }
    
    /**
     * Analyze how well current morphs align with target viseme
     */
    analyzeMorphAlignment(currentMorphs, target, viseme) {
        const analysis = {
            viseme: viseme,
            score: 0,
            deviations: {},
            currentMorphs: currentMorphs,
            targetMorphs: target.morphWeights,
            issues: [],
            strengths: []
        };
        
        let totalScore = 0;
        let totalWeight = 0;
        
        // Analyze each target morph
        Object.entries(target.morphWeights).forEach(([morphName, targetValue]) => {
            const currentValue = currentMorphs[morphName] || 0;
            const deviation = Math.abs(currentValue - targetValue);
            const morphScore = Math.max(0, 100 - (deviation * 100));
            
            analysis.deviations[morphName] = {
                current: currentValue,
                target: targetValue,
                deviation: deviation,
                score: morphScore,
                status: deviation < 0.1 ? 'excellent' : deviation < 0.3 ? 'good' : 'needs_improvement'
            };
            
            totalScore += morphScore * targetValue; // Weight by target importance
            totalWeight += targetValue;
            
            // Track issues and strengths
            if (deviation > 0.3) {
                analysis.issues.push(`${morphName}: ${currentValue.toFixed(2)} vs target ${targetValue.toFixed(2)}`);
            } else if (deviation < 0.1) {
                analysis.strengths.push(`${morphName}: Excellent alignment (${morphScore.toFixed(0)}%)`);
            }
        });
        
        // Calculate overall score
        analysis.score = totalWeight > 0 ? totalScore / totalWeight : 0;
        
        // Add geometric metrics
        analysis.geometricMetrics = this.calculateGeometricMetrics(currentMorphs, target);
        
        return analysis;
    }
    
    /**
     * Calculate geometric metrics based on morph combinations
     */
    calculateGeometricMetrics(morphs, target) {
        const metrics = {};
        
        // Estimate lip gap from mouth morphs
        const mouthClose = morphs['Mouth_Close'] || 0;
        const jawOpen = morphs['Jaw_Open'] || 0;
        const vOpen = morphs['V_Open'] || 0;
        metrics.estimatedLipGap = Math.max(0, (jawOpen + vOpen) - mouthClose);
        
        // Estimate mouth width from stretch morphs
        const stretchL = morphs['Mouth_Stretch_L'] || 0;
        const stretchR = morphs['Mouth_Stretch_R'] || 0;
        const pucker = morphs['Mouth_Pucker'] || 0;
        metrics.estimatedMouthWidth = Math.max(0.5, 1.0 + ((stretchL + stretchR) / 2) - pucker);
        
        // Estimate jaw opening
        metrics.estimatedJawOpening = jawOpen;
        
        // Compare with targets
        metrics.lipGapAccuracy = 100 - Math.abs(metrics.estimatedLipGap - target.lipGap) * 100;
        metrics.mouthWidthAccuracy = 100 - Math.abs(metrics.estimatedMouthWidth - target.mouthWidth) * 100;
        metrics.jawOpeningAccuracy = 100 - Math.abs(metrics.estimatedJawOpening - target.jawOpening) * 100;
        
        return metrics;
    }
    
    /**
     * Generate optimized morph recommendations
     */
    generateOptimizedRecommendations(deviations, viseme, currentMorphs) {
        const recommendations = [];
        
        // Process each deviation with intelligent adjustments
        Object.entries(deviations).forEach(([morphName, deviation]) => {
            if (deviation.deviation > 0.1) { // Only recommend if significant deviation
                const adjustment = this.calculateOptimalAdjustment(
                    morphName, 
                    deviation.current, 
                    deviation.target,
                    currentMorphs
                );
                
                recommendations.push({
                    type: 'specific_morph',
                    morphName: morphName,
                    action: adjustment.direction,
                    currentValue: deviation.current,
                    targetValue: adjustment.newValue,
                    confidence: adjustment.confidence,
                    reason: `${viseme.toUpperCase()} viseme: ${morphName} should be ${deviation.target.toFixed(2)} (currently ${deviation.current.toFixed(2)})`
                });
            }
        });
        
        // Add complementary adjustments to prevent conflicts
        const complementaryAdjustments = this.getComplementaryAdjustments(viseme, recommendations);
        recommendations.push(...complementaryAdjustments);
        
        // Sort by confidence and importance
        recommendations.sort((a, b) => (b.confidence || 0.8) - (a.confidence || 0.8));
        
        return recommendations;
    }
    
    /**
     * Calculate optimal adjustment for a specific morph
     */
    calculateOptimalAdjustment(morphName, current, target, allMorphs) {
        const difference = target - current;
        const direction = difference > 0 ? 'increase' : 'decrease';
        
        // Conservative adjustment - move 70% toward target to avoid overshooting
        const adjustment = difference * 0.7;
        const newValue = Math.max(0, Math.min(1, current + adjustment));
        
        // Calculate confidence based on how clear the adjustment is
        const confidence = Math.min(0.95, 0.6 + (Math.abs(difference) * 0.4));
        
        return {
            direction: direction,
            newValue: newValue,
            confidence: confidence,
            adjustment: adjustment
        };
    }
    
    /**
     * Get complementary adjustments to prevent morph conflicts
     */
    getComplementaryAdjustments(viseme, primaryRecommendations) {
        const complementary = [];
        
        // Define morph relationships
        const conflicts = {
            'Mouth_Close': ['V_Open', 'Jaw_Open'],
            'V_Open': ['Mouth_Close', 'V_Tight-O'],
            'Mouth_Pucker': ['Mouth_Stretch_L', 'Mouth_Stretch_R'],
            'V_Tight-O': ['V_Wide', 'V_Open']
        };
        
        primaryRecommendations.forEach(rec => {
            if (conflicts[rec.morphName]) {
                conflicts[rec.morphName].forEach(conflictMorph => {
                    // If increasing primary morph, suggest decreasing conflicting ones
                    if (rec.action === 'increase') {
                        complementary.push({
                            type: 'complementary_morph',
                            morphName: conflictMorph,
                            action: 'decrease',
                            targetValue: 0.1,
                            confidence: 0.6,
                            reason: `Reduce ${conflictMorph} to avoid conflict with ${rec.morphName} increase`
                        });
                    }
                });
            }
        });
        
        return complementary;
    }
    
    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            hasLastAnalysis: !!this.lastAnalysis,
            availableVisemes: Object.keys(this.visemeTargets),
            lastAnalysisScore: this.lastAnalysis ? this.lastAnalysis.score : null
        };
    }
}

// Export as ES6 module
export default GeometricVisemeAnalyzer;