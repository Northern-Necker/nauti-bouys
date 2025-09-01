/**
 * Adaptive Morph Controller - Intelligent Morph Management System
 * 
 * This controller integrates with the IterativeMorphOptimizer to provide
 * a unified interface for intelligent morph optimization that learns and
 * adapts over time, preventing distortions while improving accuracy.
 */

class AdaptiveMorphController {
    constructor(mediaPipeAnalyzer, iterativeMorphOptimizer) {
        this.mediaPipeAnalyzer = mediaPipeAnalyzer;
        this.optimizer = iterativeMorphOptimizer;
        
        // Learning and adaptation parameters
        this.adaptationEnabled = true;
        this.minIterationsForLearning = 3;
        this.maxOptimizationTime = 30000; // 30 seconds max
        
        // Performance tracking
        this.sessionMetrics = {
            optimizationsPerformed: 0,
            averageScoreImprovement: 0,
            constraintViolations: 0,
            totalOptimizationTime: 0,
            visemeAccuracy: {}
        };
        
        // Viseme-specific learning data
        this.visemeLearningData = {};
        
        // Current optimization state
        this.isOptimizing = false;
        this.currentOptimization = null;
        this.optimizationCallbacks = [];
    }
    
    /**
     * Main interface: Optimize a viseme with intelligent adaptation
     */
    async optimizeViseme(viseme, initialMorphs, options = {}) {
        if (this.isOptimizing) {
            throw new Error('Optimization already in progress');
        }
        
        console.log(`🧠 Starting adaptive optimization for ${viseme.toUpperCase()} viseme...`);
        
        this.isOptimizing = true;
        const startTime = Date.now();
        
        try {
            // Prepare optimization with learned parameters
            const optimizationConfig = this.prepareOptimizationConfig(viseme, options);
            
            // Apply learned morph priors if available
            const enhancedInitialMorphs = this.applyLearnedPriors(viseme, initialMorphs);
            
            // Perform iterative optimization
            this.currentOptimization = this.optimizer.optimizeMorphConfiguration(
                viseme,
                enhancedInitialMorphs,
                this.mediaPipeAnalyzer,
                optimizationConfig
            );
            
            // Execute with progress tracking
            const result = await this.executeWithProgressTracking(
                this.currentOptimization,
                viseme,
                startTime
            );
            
            // Process and learn from results
            await this.processOptimizationResults(viseme, result, startTime);
            
            return result;
            
        } catch (error) {
            console.error(`❌ Adaptive optimization failed for ${viseme}:`, error);
            throw error;
        } finally {
            this.isOptimizing = false;
            this.currentOptimization = null;
        }
    }
    
    /**
     * Prepare optimization configuration with learned parameters
     */
    prepareOptimizationConfig(viseme, userOptions) {
        const learnedData = this.visemeLearningData[viseme];
        
        const config = {
            // Base configuration
            maxIterations: userOptions.maxIterations || 8,
            learningRate: userOptions.learningRate || 0.15,
            convergenceThreshold: userOptions.convergenceThreshold || 0.02,
            
            // Adaptive parameters based on learning
            constraintWeight: this.calculateAdaptiveConstraintWeight(viseme),
            focusMetrics: this.identifyFocusMetrics(viseme),
            morphPriorities: this.calculateMorphPriorities(viseme),
            
            // Time management
            maxOptimizationTime: Math.min(
                userOptions.maxOptimizationTime || this.maxOptimizationTime,
                this.calculateOptimalTime(viseme)
            )
        };
        
        // Apply learned adjustments
        if (learnedData && learnedData.optimizations >= this.minIterationsForLearning) {
            config.learningRate *= learnedData.learningRateMultiplier || 1.0;
            config.maxIterations = Math.min(config.maxIterations, 
                learnedData.averageIterationsToConvergence + 2);
        }
        
        return config;
    }
    
    /**
     * Apply learned morph priors to improve initial configuration
     */
    applyLearnedPriors(viseme, initialMorphs) {
        const learnedData = this.visemeLearningData[viseme];
        const enhancedMorphs = { ...initialMorphs };
        
        if (learnedData && learnedData.successfulConfigurations.length > 0) {
            // Calculate weighted average of successful configurations
            const weightedAverages = this.calculateWeightedMorphAverages(
                learnedData.successfulConfigurations
            );
            
            // Blend with initial morphs (favor learned data for proven effective morphs)
            for (const [morphName, learnedValue] of Object.entries(weightedAverages)) {
                const morphEffectiveness = this.optimizer.morphEffectivenessScores[morphName] || 0.5;
                const blendWeight = Math.min(0.7, morphEffectiveness);
                
                enhancedMorphs[morphName] = 
                    (initialMorphs[morphName] || 0) * (1 - blendWeight) +
                    learnedValue * blendWeight;
            }
            
            console.log(`🎯 Applied learned priors from ${learnedData.successfulConfigurations.length} successful optimizations`);
        }
        
        return enhancedMorphs;
    }
    
    /**
     * Execute optimization with real-time progress tracking
     */
    async executeWithProgressTracking(optimizationPromise, viseme, startTime) {
        const progressInterval = setInterval(() => {
            if (this.optimizer.currentIteration !== undefined) {
                this.broadcastProgress({
                    viseme,
                    iteration: this.optimizer.currentIteration + 1,
                    maxIterations: this.optimizer.maxIterations,
                    currentScore: this.optimizer.bestScore,
                    elapsedTime: Date.now() - startTime,
                    constraintsViolated: this.optimizer.previousConstraints ? 
                        Object.values(this.optimizer.previousConstraints).filter(c => c.violated).length : 0
                });
            }
        }, 500);
        
        try {
            const result = await optimizationPromise;
            clearInterval(progressInterval);
            return result;
        } catch (error) {
            clearInterval(progressInterval);
            throw error;
        }
    }
    
    /**
     * Process optimization results and update learning data
     */
    async processOptimizationResults(viseme, result, startTime) {
        const optimizationTime = Date.now() - startTime;
        
        // Update session metrics
        this.sessionMetrics.optimizationsPerformed++;
        this.sessionMetrics.totalOptimizationTime += optimizationTime;
        
        const scoreImprovement = result.finalScore - (result.optimizationLog.iterations[0]?.rawScore || 0);
        this.sessionMetrics.averageScoreImprovement = 
            (this.sessionMetrics.averageScoreImprovement * (this.sessionMetrics.optimizationsPerformed - 1) + 
             scoreImprovement) / this.sessionMetrics.optimizationsPerformed;
        
        if (!result.constraintsSatisfied) {
            this.sessionMetrics.constraintViolations++;
        }
        
        // Update viseme-specific metrics
        if (!this.sessionMetrics.visemeAccuracy[viseme]) {
            this.sessionMetrics.visemeAccuracy[viseme] = {
                attempts: 0,
                averageScore: 0,
                bestScore: 0
            };
        }
        
        const visemeMetrics = this.sessionMetrics.visemeAccuracy[viseme];
        visemeMetrics.attempts++;
        visemeMetrics.averageScore = 
            (visemeMetrics.averageScore * (visemeMetrics.attempts - 1) + result.finalScore) / 
            visemeMetrics.attempts;
        visemeMetrics.bestScore = Math.max(visemeMetrics.bestScore, result.finalScore);
        
        // Update learning data
        await this.updateVisemeLearningData(viseme, result, optimizationTime);
        
        // Broadcast completion
        this.broadcastCompletion({
            viseme,
            finalScore: result.finalScore,
            scoreImprovement: scoreImprovement,
            constraintsSatisfied: result.constraintsSatisfied,
            optimizationTime: optimizationTime,
            iterations: result.optimizationLog.iterations.length
        });
        
        console.log(`📊 Optimization complete: ${result.finalScore.toFixed(1)}% (${scoreImprovement > 0 ? '+' : ''}${scoreImprovement.toFixed(1)}) in ${optimizationTime}ms`);
    }
    
    /**
     * Update viseme-specific learning data
     */
    async updateVisemeLearningData(viseme, result, optimizationTime) {
        if (!this.visemeLearningData[viseme]) {
            this.visemeLearningData[viseme] = {
                optimizations: 0,
                successfulConfigurations: [],
                averageIterationsToConvergence: 0,
                averageOptimizationTime: 0,
                learningRateMultiplier: 1.0,
                commonConstraintViolations: {},
                morphEffectivenessHistory: {}
            };
        }
        
        const learnedData = this.visemeLearningData[viseme];
        learnedData.optimizations++;
        
        // Update timing averages
        learnedData.averageOptimizationTime = 
            (learnedData.averageOptimizationTime * (learnedData.optimizations - 1) + optimizationTime) / 
            learnedData.optimizations;
        
        learnedData.averageIterationsToConvergence = 
            (learnedData.averageIterationsToConvergence * (learnedData.optimizations - 1) + 
             result.optimizationLog.iterations.length) / learnedData.optimizations;
        
        // Store successful configurations (score > 85%)
        if (result.finalScore > 85 && result.constraintsSatisfied) {
            learnedData.successfulConfigurations.push({
                morphs: { ...result.finalMorphs },
                score: result.finalScore,
                timestamp: Date.now(),
                weight: this.calculateConfigurationWeight(result)
            });
            
            // Limit stored configurations to prevent memory bloat
            if (learnedData.successfulConfigurations.length > 10) {
                // Remove oldest or lowest scoring configurations
                learnedData.successfulConfigurations.sort((a, b) => 
                    (b.score * b.weight) - (a.score * a.weight)
                );
                learnedData.successfulConfigurations = learnedData.successfulConfigurations.slice(0, 10);
            }
        }
        
        // Update constraint violation tracking
        for (const [constraintName, constraint] of Object.entries(result.optimizationLog.constraints)) {
            if (constraint.violated) {
                learnedData.commonConstraintViolations[constraintName] = 
                    (learnedData.commonConstraintViolations[constraintName] || 0) + 1;
            }
        }
        
        // Adapt learning rate based on success
        if (result.finalScore > 90) {
            learnedData.learningRateMultiplier = Math.min(1.5, learnedData.learningRateMultiplier * 1.1);
        } else if (result.finalScore < 60) {
            learnedData.learningRateMultiplier = Math.max(0.5, learnedData.learningRateMultiplier * 0.9);
        }
    }
    
    /**
     * Calculate adaptive constraint weight based on learning
     */
    calculateAdaptiveConstraintWeight(viseme) {
        const learnedData = this.visemeLearningData[viseme];
        
        if (!learnedData || learnedData.optimizations < this.minIterationsForLearning) {
            return 0.3; // Default constraint weight
        }
        
        // Increase constraint weight if this viseme frequently violates constraints
        const violationRate = Object.values(learnedData.commonConstraintViolations).reduce((a, b) => a + b, 0) / 
                              learnedData.optimizations;
        
        return Math.min(0.6, 0.3 + (violationRate * 0.4));
    }
    
    /**
     * Identify focus metrics for this viseme based on learning
     */
    identifyFocusMetrics(viseme) {
        const learnedData = this.visemeLearningData[viseme];
        
        if (!learnedData) {
            // Default focus metrics per viseme type
            const defaultFocus = {
                'pp': ['lipGap', 'lipCompression'],
                'ff': ['lipGap', 'mouthWidth'],
                'aa': ['lipGap', 'jawOpening'],
                'oh': ['mouthWidth', 'lipRounding']
            };
            return defaultFocus[viseme] || ['lipGap', 'mouthWidth'];
        }
        
        // Analyze which metrics most commonly need improvement
        const metricImportance = {};
        for (const config of learnedData.successfulConfigurations) {
            // This would analyze which metrics were most critical for success
            // Implementation would examine the optimization logs
        }
        
        return Object.keys(metricImportance).slice(0, 3);
    }
    
    /**
     * Calculate morph priorities based on learning
     */
    calculateMorphPriorities(viseme) {
        const priorities = {};
        const learnedData = this.visemeLearningData[viseme];
        
        if (learnedData && learnedData.successfulConfigurations.length > 0) {
            // Calculate which morphs are most commonly used in successful configurations
            const morphUsage = {};
            
            for (const config of learnedData.successfulConfigurations) {
                for (const [morphName, value] of Object.entries(config.morphs)) {
                    if (value > 0.1) { // Only count meaningful values
                        morphUsage[morphName] = (morphUsage[morphName] || 0) + (value * config.weight);
                    }
                }
            }
            
            // Convert to priorities (0-1 scale)
            const maxUsage = Math.max(...Object.values(morphUsage));
            for (const [morphName, usage] of Object.entries(morphUsage)) {
                priorities[morphName] = usage / maxUsage;
            }
        }
        
        return priorities;
    }
    
    /**
     * Calculate optimal optimization time based on learning
     */
    calculateOptimalTime(viseme) {
        const learnedData = this.visemeLearningData[viseme];
        
        if (!learnedData || learnedData.optimizations < 3) {
            return this.maxOptimizationTime;
        }
        
        // Use 150% of average time, capped at max
        return Math.min(
            this.maxOptimizationTime,
            learnedData.averageOptimizationTime * 1.5
        );
    }
    
    /**
     * Calculate weighted morph averages from successful configurations
     */
    calculateWeightedMorphAverages(configurations) {
        const morphSums = {};
        const morphWeights = {};
        
        for (const config of configurations) {
            const weight = config.weight;
            
            for (const [morphName, value] of Object.entries(config.morphs)) {
                morphSums[morphName] = (morphSums[morphName] || 0) + (value * weight);
                morphWeights[morphName] = (morphWeights[morphName] || 0) + weight;
            }
        }
        
        const averages = {};
        for (const morphName of Object.keys(morphSums)) {
            averages[morphName] = morphSums[morphName] / morphWeights[morphName];
        }
        
        return averages;
    }
    
    /**
     * Calculate configuration weight for learning purposes
     */
    calculateConfigurationWeight(result) {
        let weight = 1.0;
        
        // Higher weight for better scores
        weight *= (result.finalScore / 100);
        
        // Higher weight for constraint satisfaction
        if (result.constraintsSatisfied) {
            weight *= 1.2;
        } else {
            weight *= 0.8;
        }
        
        // Higher weight for fewer iterations (more efficient)
        const iterationEfficiency = Math.max(0.5, 1.0 - (result.optimizationLog.iterations.length / 10));
        weight *= iterationEfficiency;
        
        return Math.max(0.1, Math.min(2.0, weight));
    }
    
    /**
     * Add progress callback for UI updates
     */
    addProgressCallback(callback) {
        this.optimizationCallbacks.push(callback);
    }
    
    /**
     * Remove progress callback
     */
    removeProgressCallback(callback) {
        const index = this.optimizationCallbacks.indexOf(callback);
        if (index > -1) {
            this.optimizationCallbacks.splice(index, 1);
        }
    }
    
    /**
     * Broadcast progress to all callbacks
     */
    broadcastProgress(progressData) {
        for (const callback of this.optimizationCallbacks) {
            try {
                callback('progress', progressData);
            } catch (error) {
                console.warn('Progress callback error:', error);
            }
        }
    }
    
    /**
     * Broadcast completion to all callbacks
     */
    broadcastCompletion(completionData) {
        for (const callback of this.optimizationCallbacks) {
            try {
                callback('complete', completionData);
            } catch (error) {
                console.warn('Completion callback error:', error);
            }
        }
    }
    
    /**
     * Get comprehensive session statistics
     */
    getSessionStatistics() {
        return {
            ...this.sessionMetrics,
            learningData: Object.keys(this.visemeLearningData).map(viseme => ({
                viseme,
                optimizations: this.visemeLearningData[viseme].optimizations,
                successfulConfigurations: this.visemeLearningData[viseme].successfulConfigurations.length,
                averageTime: this.visemeLearningData[viseme].averageOptimizationTime,
                learningRateMultiplier: this.visemeLearningData[viseme].learningRateMultiplier
            })),
            optimizerSummary: this.optimizer.getOptimizationSummary()
        };
    }
    
    /**
     * Export learning data for persistence
     */
    exportLearningData() {
        return {
            version: '1.0',
            timestamp: Date.now(),
            sessionMetrics: this.sessionMetrics,
            visemeLearningData: this.visemeLearningData,
            morphEffectivenessScores: this.optimizer.morphEffectivenessScores
        };
    }
    
    /**
     * Import learning data from previous sessions
     */
    importLearningData(data) {
        if (data.version !== '1.0') {
            console.warn('Learning data version mismatch, skipping import');
            return;
        }
        
        // Merge learning data
        for (const [viseme, learnedData] of Object.entries(data.visemeLearningData || {})) {
            if (!this.visemeLearningData[viseme]) {
                this.visemeLearningData[viseme] = learnedData;
            } else {
                // Merge with existing data
                this.visemeLearningData[viseme].successfulConfigurations.push(
                    ...learnedData.successfulConfigurations
                );
                
                // Limit configurations
                if (this.visemeLearningData[viseme].successfulConfigurations.length > 10) {
                    this.visemeLearningData[viseme].successfulConfigurations.sort(
                        (a, b) => (b.score * b.weight) - (a.score * a.weight)
                    );
                    this.visemeLearningData[viseme].successfulConfigurations = 
                        this.visemeLearningData[viseme].successfulConfigurations.slice(0, 10);
                }
            }
        }
        
        // Merge morph effectiveness scores
        Object.assign(this.optimizer.morphEffectivenessScores, data.morphEffectivenessScores || {});
        
        console.log('🧠 Imported learning data from previous sessions');
    }
    
    /**
     * Reset learning data (for debugging or fresh start)
     */
    resetLearningData() {
        this.visemeLearningData = {};
        this.optimizer.morphEffectivenessScores = {};
        this.sessionMetrics = {
            optimizationsPerformed: 0,
            averageScoreImprovement: 0,
            constraintViolations: 0,
            totalOptimizationTime: 0,
            visemeAccuracy: {}
        };
        console.log('🔄 Learning data reset');
    }
}

export default AdaptiveMorphController;