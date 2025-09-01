/**
 * Iterative Morph Optimizer - Systemic Facial Expression Optimization
 * 
 * This system uses MediaPipe mesh analysis to iteratively improve facial morphs
 * through constraint-based optimization and adaptive learning, preventing 
 * distortions like philtrum stretching while achieving target expressions.
 */

class IterativeMorphOptimizer {
    constructor() {
        // Optimization parameters
        this.learningRate = 0.15;
        this.maxIterations = 8;
        this.convergenceThreshold = 0.02; // Stop when improvements < 2%
        this.constraintWeight = 0.3; // How much to penalize constraint violations
        
        // Facial feature constraints and relationships
        this.facialConstraints = {
            // Preserve natural facial proportions
            philtrum: {
                maxStretch: 0.15, // Max allowed philtrum distortion
                landmarks: [13, 14, 15], // Upper lip center landmarks
                measure: (landmarks) => this.measurePhiltrumStretch(landmarks)
            },
            
            lipSymmetry: {
                maxAsymmetry: 0.1, // Max left-right lip asymmetry
                landmarks: [61, 291, 78, 308], // Left/right mouth corners and lip points
                measure: (landmarks) => this.measureLipAsymmetry(landmarks)
            },
            
            faceWidth: {
                maxDistortion: 0.12, // Max face width distortion
                landmarks: [172, 397], // Jaw landmarks
                measure: (landmarks) => this.measureFaceWidthDistortion(landmarks)
            },
            
            eyeNoseRelation: {
                maxDistortion: 0.08, // Keep eye-nose relationship stable
                landmarks: [1, 2, 168, 6], // Nose and eye region landmarks
                measure: (landmarks) => this.measureEyeNoseDistortion(landmarks)
            }
        };
        
        // Morph influence mapping - which morphs affect which facial features
        this.morphInfluenceMap = {
            // Mouth morphs and their primary/secondary effects
            'Mouth_Close': {
                primary: ['lipGap', 'lipCompression'],
                secondary: ['philtrum', 'chinPosition'],
                conflicts: ['Mouth_Open', 'Jaw_Open']
            },
            
            'Mouth_Stretch_L': {
                primary: ['mouthWidth'],
                secondary: ['lipSymmetry', 'philtrum'],
                conflicts: ['Mouth_Pucker', 'Mouth_Stretch_R']
            },
            
            'Mouth_Stretch_R': {
                primary: ['mouthWidth'],
                secondary: ['lipSymmetry', 'philtrum'], 
                conflicts: ['Mouth_Pucker', 'Mouth_Stretch_L']
            },
            
            'Mouth_Pucker': {
                primary: ['mouthWidth', 'lipRounding'],
                secondary: ['lipCompression'],
                conflicts: ['Mouth_Stretch_L', 'Mouth_Stretch_R']
            },
            
            'Jaw_Open': {
                primary: ['jawOpening'],
                secondary: ['faceHeight', 'lipGap'],
                conflicts: ['Mouth_Close']
            },
            
            'V_Explosive': {
                primary: ['lipCompression', 'lipGap'],
                secondary: ['mouthWidth'],
                conflicts: ['V_Open', 'V_Wide']
            }
        };
        
        // Optimization history for learning
        this.optimizationHistory = [];
        this.morphEffectivenessScores = {};
        
        // Current optimization state
        this.currentIteration = 0;
        this.bestScore = 0;
        this.bestMorphConfiguration = null;
        this.previousScore = 0;
    }
    
    /**
     * Main optimization loop - iteratively improve morph configuration
     */
    async optimizeMorphConfiguration(targetViseme, initialMorphs, mediaPipeAnalyzer) {
        console.log(`🔄 Starting iterative optimization for ${targetViseme} viseme...`);
        
        // Initialize optimization state
        this.currentIteration = 0;
        this.bestScore = 0;
        this.bestMorphConfiguration = { ...initialMorphs };
        
        let currentMorphs = { ...initialMorphs };
        let currentScore = 0;
        
        const optimizationLog = {
            targetViseme,
            iterations: [],
            constraints: {},
            finalScore: 0,
            improvements: []
        };
        
        // Optimization iterations
        for (this.currentIteration = 0; this.currentIteration < this.maxIterations; this.currentIteration++) {
            console.log(`🔍 Iteration ${this.currentIteration + 1}/${this.maxIterations}`);
            
            // Apply current morph configuration
            await this.applyMorphConfiguration(currentMorphs);
            
            // Capture and analyze current state
            const imageData = await this.captureCurrentState();
            const analysis = await mediaPipeAnalyzer.analyzeViseme(imageData, targetViseme);
            
            // Calculate constraint violations
            const constraints = await this.evaluateConstraints(analysis.landmarks);
            const constraintPenalty = this.calculateConstraintPenalty(constraints);
            
            // Adjusted score with constraint penalty
            currentScore = analysis.score * (1 - constraintPenalty);
            
            // Log iteration data
            const iterationData = {
                iteration: this.currentIteration + 1,
                morphs: { ...currentMorphs },
                rawScore: analysis.score,
                constraintPenalty: constraintPenalty,
                adjustedScore: currentScore,
                constraints: constraints,
                improvements: []
            };
            
            console.log(`📊 Iteration ${this.currentIteration + 1}: Score ${currentScore.toFixed(1)}% (raw: ${analysis.score.toFixed(1)}%, penalty: ${(constraintPenalty * 100).toFixed(1)}%)`);
            
            // Check if this is the best configuration so far
            if (currentScore > this.bestScore) {
                this.bestScore = currentScore;
                this.bestMorphConfiguration = { ...currentMorphs };
                console.log(`✨ New best configuration! Score: ${currentScore.toFixed(1)}%`);
            }
            
            // Check for convergence
            const improvement = currentScore - this.previousScore;
            if (this.currentIteration > 0 && improvement < this.convergenceThreshold) {
                console.log(`🎯 Converged after ${this.currentIteration + 1} iterations (improvement: ${improvement.toFixed(3)})`);
                iterationData.converged = true;
                optimizationLog.iterations.push(iterationData);
                break;
            }
            
            // Generate next iteration improvements
            const morphAdjustments = await this.generateSmartAdjustments(
                analysis, 
                constraints, 
                currentMorphs, 
                targetViseme
            );
            
            // Apply adjustments with learning rate
            currentMorphs = this.applyAdjustments(currentMorphs, morphAdjustments);
            iterationData.improvements = morphAdjustments;
            
            optimizationLog.iterations.push(iterationData);
            this.previousScore = currentScore;
        }
        
        // Apply final best configuration
        await this.applyMorphConfiguration(this.bestMorphConfiguration);
        
        optimizationLog.finalScore = this.bestScore;
        optimizationLog.constraints = await this.evaluateConstraints(
            (await mediaPipeAnalyzer.analyzeViseme(await this.captureCurrentState(), targetViseme)).landmarks
        );
        
        // Update learning system
        this.updateMorphEffectiveness(optimizationLog);
        this.optimizationHistory.push(optimizationLog);
        
        console.log(`🎉 Optimization complete! Final score: ${this.bestScore.toFixed(1)}%`);
        console.log(`📈 Total iterations: ${optimizationLog.iterations.length}`);
        console.log(`🛡️ Constraint violations: ${Object.values(optimizationLog.constraints).filter(v => v.violated).length}`);
        
        return {
            finalMorphs: this.bestMorphConfiguration,
            finalScore: this.bestScore,
            optimizationLog: optimizationLog,
            constraintsSatisfied: this.areConstraintsSatisfied(optimizationLog.constraints)
        };
    }
    
    /**
     * Generate smart morph adjustments based on analysis and constraints
     */
    async generateSmartAdjustments(analysis, constraints, currentMorphs, targetViseme) {
        const adjustments = [];
        
        // Analyze each deviation and generate targeted improvements
        for (const [metric, deviation] of Object.entries(analysis.deviations)) {
            if (Math.abs(deviation.deviation) < 0.05) continue; // Skip small deviations
            
            // Find morphs that can affect this metric
            const relevantMorphs = this.findRelevantMorphs(metric);
            
            for (const morphName of relevantMorphs) {
                const currentValue = currentMorphs[morphName] || 0;
                
                // Calculate desired adjustment
                const targetAdjustment = this.calculateTargetAdjustment(
                    metric, 
                    deviation, 
                    morphName, 
                    constraints
                );
                
                // Apply learning rate and constraint awareness
                const safeAdjustment = this.applySafetyConstraints(
                    morphName,
                    targetAdjustment,
                    currentValue,
                    constraints
                );
                
                if (Math.abs(safeAdjustment) > 0.02) { // Only apply meaningful adjustments
                    adjustments.push({
                        morphName: morphName,
                        currentValue: currentValue,
                        adjustment: safeAdjustment,
                        newValue: Math.max(0, Math.min(1, currentValue + safeAdjustment)),
                        reason: `${metric}: ${deviation.current.toFixed(3)} → ${deviation.target.toFixed(3)} (Δ${deviation.deviation.toFixed(3)})`,
                        constraintSafe: true
                    });
                }
            }
        }
        
        // Remove conflicting adjustments and apply synergy bonuses
        return this.resolveConflictsAndSynergies(adjustments, targetViseme);
    }
    
    /**
     * Find morphs that can influence a specific facial metric
     */
    findRelevantMorphs(metric) {
        const relevantMorphs = [];
        
        for (const [morphName, influence] of Object.entries(this.morphInfluenceMap)) {
            if (influence.primary.includes(metric) || influence.secondary.includes(metric)) {
                relevantMorphs.push(morphName);
            }
        }
        
        return relevantMorphs;
    }
    
    /**
     * Calculate target adjustment for a morph based on deviation
     */
    calculateTargetAdjustment(metric, deviation, morphName, constraints) {
        const influence = this.morphInfluenceMap[morphName];
        if (!influence) return 0;
        
        // Base adjustment proportional to deviation
        let baseAdjustment = deviation.deviation * this.learningRate;
        
        // Adjust direction based on whether we need to increase or decrease the metric
        if (deviation.current < deviation.target) {
            // Need to increase metric
            baseAdjustment = Math.abs(baseAdjustment);
        } else {
            // Need to decrease metric
            baseAdjustment = -Math.abs(baseAdjustment);
        }
        
        // Scale by morph effectiveness (learned from history)
        const effectiveness = this.morphEffectivenessScores[morphName] || 0.5;
        baseAdjustment *= effectiveness;
        
        // Apply constraint penalties
        const constraintPenalty = this.calculateMorphConstraintPenalty(morphName, constraints);
        baseAdjustment *= (1 - constraintPenalty);
        
        return baseAdjustment;
    }
    
    /**
     * Apply safety constraints to prevent distortions
     */
    applySafetyConstraints(morphName, targetAdjustment, currentValue, constraints) {
        const newValue = currentValue + targetAdjustment;
        
        // Clamp to valid range
        if (newValue < 0 || newValue > 1) {
            return Math.max(0, Math.min(1, newValue)) - currentValue;
        }
        
        // Check if this adjustment would violate constraints
        const wouldViolateConstraints = this.wouldViolateConstraints(
            morphName, 
            newValue, 
            constraints
        );
        
        if (wouldViolateConstraints) {
            // Reduce adjustment to stay within constraints
            return targetAdjustment * 0.3; // Conservative adjustment
        }
        
        return targetAdjustment;
    }
    
    /**
     * Resolve conflicting morph adjustments and apply synergies
     */
    resolveConflictsAndSynergies(adjustments, targetViseme) {
        const resolvedAdjustments = [];
        const processedMorphs = new Set();
        
        // Sort by impact magnitude
        adjustments.sort((a, b) => Math.abs(b.adjustment) - Math.abs(a.adjustment));
        
        for (const adjustment of adjustments) {
            if (processedMorphs.has(adjustment.morphName)) continue;
            
            const influence = this.morphInfluenceMap[adjustment.morphName];
            if (!influence) {
                resolvedAdjustments.push(adjustment);
                processedMorphs.add(adjustment.morphName);
                continue;
            }
            
            // Check for conflicts with already processed morphs
            const hasConflicts = influence.conflicts.some(conflictMorph => 
                processedMorphs.has(conflictMorph)
            );
            
            if (hasConflicts) {
                // Reduce adjustment strength due to conflict
                adjustment.adjustment *= 0.5;
                adjustment.newValue = Math.max(0, Math.min(1, 
                    adjustment.currentValue + adjustment.adjustment
                ));
                adjustment.reason += ' (reduced due to conflicts)';
            }
            
            resolvedAdjustments.push(adjustment);
            processedMorphs.add(adjustment.morphName);
        }
        
        return resolvedAdjustments;
    }
    
    /**
     * Evaluate facial constraints to prevent distortions
     */
    async evaluateConstraints(landmarks) {
        const constraintResults = {};
        
        for (const [constraintName, constraint] of Object.entries(this.facialConstraints)) {
            try {
                const relevantLandmarks = constraint.landmarks.map(idx => landmarks[idx]).filter(Boolean);
                if (relevantLandmarks.length === 0) continue;
                
                const measureValue = constraint.measure(relevantLandmarks);
                const maxAllowed = constraint.maxStretch || constraint.maxAsymmetry || constraint.maxDistortion;
                
                constraintResults[constraintName] = {
                    value: measureValue,
                    maxAllowed: maxAllowed,
                    violated: measureValue > maxAllowed,
                    severity: Math.max(0, measureValue - maxAllowed) / maxAllowed
                };
                
            } catch (error) {
                console.warn(`Failed to evaluate constraint ${constraintName}:`, error);
                constraintResults[constraintName] = {
                    value: 0,
                    maxAllowed: 0,
                    violated: false,
                    severity: 0,
                    error: error.message
                };
            }
        }
        
        return constraintResults;
    }
    
    /**
     * Measure philtrum stretch to prevent unnatural distortion
     */
    measurePhiltrumStretch(landmarks) {
        if (landmarks.length < 3) return 0;
        
        // Calculate the vertical stretch of the philtrum area
        const upperLip = landmarks[0]; // Upper lip center
        const lipBorder = landmarks[1]; // Lip border
        const noseTip = landmarks[2]; // Nose tip reference
        
        const philtrumLength = Math.abs(upperLip.y - noseTip.y);
        const naturalLength = 0.03; // Expected natural philtrum length (normalized)
        
        return Math.max(0, (philtrumLength - naturalLength) / naturalLength);
    }
    
    /**
     * Measure lip asymmetry to maintain facial balance
     */
    measureLipAsymmetry(landmarks) {
        if (landmarks.length < 4) return 0;
        
        const leftCorner = landmarks[0];
        const rightCorner = landmarks[1];
        const leftLip = landmarks[2];
        const rightLip = landmarks[3];
        
        // Calculate left and right lip distances
        const leftDistance = Math.sqrt(
            Math.pow(leftCorner.x - leftLip.x, 2) + Math.pow(leftCorner.y - leftLip.y, 2)
        );
        const rightDistance = Math.sqrt(
            Math.pow(rightCorner.x - rightLip.x, 2) + Math.pow(rightCorner.y - rightLip.y, 2)
        );
        
        return Math.abs(leftDistance - rightDistance) / Math.max(leftDistance, rightDistance);
    }
    
    /**
     * Measure face width distortion
     */
    measureFaceWidthDistortion(landmarks) {
        if (landmarks.length < 2) return 0;
        
        const leftJaw = landmarks[0];
        const rightJaw = landmarks[1];
        const currentWidth = Math.abs(leftJaw.x - rightJaw.x);
        const naturalWidth = 0.4; // Expected natural face width (normalized)
        
        return Math.abs(currentWidth - naturalWidth) / naturalWidth;
    }
    
    /**
     * Measure eye-nose relationship distortion
     */
    measureEyeNoseDistortion(landmarks) {
        if (landmarks.length < 4) return 0;
        
        // Simple measure of nose position relative to eye landmarks
        const noseTip = landmarks[0];
        const noseCenter = landmarks[1];
        const eyeLeft = landmarks[2];
        const eyeRight = landmarks[3];
        
        const eyeMidpoint = {
            x: (eyeLeft.x + eyeRight.x) / 2,
            y: (eyeLeft.y + eyeRight.y) / 2
        };
        
        const noseOffset = Math.abs(noseTip.x - eyeMidpoint.x);
        const maxNaturalOffset = 0.02;
        
        return Math.max(0, (noseOffset - maxNaturalOffset) / maxNaturalOffset);
    }
    
    /**
     * Calculate overall constraint penalty
     */
    calculateConstraintPenalty(constraints) {
        let totalPenalty = 0;
        let violatedCount = 0;
        
        for (const constraint of Object.values(constraints)) {
            if (constraint.violated) {
                totalPenalty += constraint.severity * this.constraintWeight;
                violatedCount++;
            }
        }
        
        // Exponential penalty for multiple violations
        if (violatedCount > 1) {
            totalPenalty *= Math.pow(1.2, violatedCount - 1);
        }
        
        return Math.min(0.8, totalPenalty); // Cap penalty at 80%
    }
    
    /**
     * Update morph effectiveness scores based on optimization results
     */
    updateMorphEffectiveness(optimizationLog) {
        for (const iteration of optimizationLog.iterations) {
            for (const improvement of iteration.improvements) {
                const morphName = improvement.morphName;
                const adjustmentMagnitude = Math.abs(improvement.adjustment);
                const scoreImprovement = iteration.adjustedScore - (this.previousScore || 0);
                
                // Calculate effectiveness as improvement per unit adjustment
                const effectiveness = scoreImprovement / (adjustmentMagnitude + 0.01); // Avoid division by zero
                
                // Update running average
                if (!this.morphEffectivenessScores[morphName]) {
                    this.morphEffectivenessScores[morphName] = effectiveness;
                } else {
                    this.morphEffectivenessScores[morphName] = 
                        (this.morphEffectivenessScores[morphName] * 0.8) + (effectiveness * 0.2);
                }
                
                // Clamp to reasonable range
                this.morphEffectivenessScores[morphName] = Math.max(0.1, 
                    Math.min(2.0, this.morphEffectivenessScores[morphName])
                );
            }
        }
    }
    
    /**
     * Apply morph configuration to the 3D model
     */
    async applyMorphConfiguration(morphs) {
        // This would interface with the existing 3D avatar system
        if (window.avatar) {
            window.avatar.traverse((child) => {
                if (child.morphTargetDictionary && child.morphTargetInfluences) {
                    Object.entries(morphs).forEach(([morphName, value]) => {
                        const index = child.morphTargetDictionary[morphName];
                        if (index !== undefined) {
                            child.morphTargetInfluences[index] = value;
                        }
                    });
                }
            });
            
            // Force render update
            if (window.renderer) {
                window.renderer.render(window.scene, window.camera);
            }
        }
        
        // Allow time for render
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    /**
     * Capture current state for analysis
     */
    async captureCurrentState() {
        // This interfaces with the existing image capture system
        if (window.captureAvatarImage) {
            const imageData = window.captureAvatarImage();
            if (!imageData) {
                throw new Error('Image capture failed - no data returned');
            }
            return imageData;
        }
        throw new Error('Image capture system not available');
    }
    
    /**
     * Apply adjustments to current morph configuration
     */
    applyAdjustments(currentMorphs, adjustments) {
        const newMorphs = { ...currentMorphs };
        
        for (const adjustment of adjustments) {
            newMorphs[adjustment.morphName] = adjustment.newValue;
        }
        
        return newMorphs;
    }
    
    /**
     * Check if constraints are satisfied
     */
    areConstraintsSatisfied(constraints) {
        return !Object.values(constraints).some(constraint => constraint.violated);
    }
    
    /**
     * Check if a morph adjustment would violate constraints
     */
    wouldViolateConstraints(morphName, newValue, currentConstraints) {
        // Predict constraint violations based on morph influence map
        const influence = this.morphInfluenceMap[morphName];
        if (!influence) return false;
        
        // Check if any of the facial features affected by this morph are already constrained
        for (const feature of [...influence.primary, ...influence.secondary]) {
            const relatedConstraint = this.findConstraintForFeature(feature);
            if (relatedConstraint && currentConstraints[relatedConstraint]?.violated) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Find constraint related to a facial feature
     */
    findConstraintForFeature(feature) {
        const featureConstraintMap = {
            'mouthWidth': 'lipSymmetry',
            'lipCompression': 'philtrum',
            'jawOpening': 'faceWidth'
        };
        
        return featureConstraintMap[feature];
    }
    
    /**
     * Calculate constraint penalty for a specific morph
     */
    calculateMorphConstraintPenalty(morphName, constraints) {
        const influence = this.morphInfluenceMap[morphName];
        if (!influence) return 0;
        
        let penalty = 0;
        for (const feature of [...influence.primary, ...influence.secondary]) {
            const constraintName = this.findConstraintForFeature(feature);
            if (constraintName && constraints[constraintName]?.violated) {
                penalty += constraints[constraintName].severity * 0.2;
            }
        }
        
        return Math.min(0.8, penalty);
    }
    
    /**
     * Get optimization summary for debugging
     */
    getOptimizationSummary() {
        return {
            totalOptimizations: this.optimizationHistory.length,
            morphEffectiveness: this.morphEffectivenessScores,
            averageIterations: this.optimizationHistory.reduce((sum, log) => 
                sum + log.iterations.length, 0) / this.optimizationHistory.length,
            constraintViolationRate: this.optimizationHistory.reduce((sum, log) => 
                sum + (Object.values(log.constraints).filter(c => c.violated).length > 0 ? 1 : 0), 0) / this.optimizationHistory.length
        };
    }
}

export default IterativeMorphOptimizer;