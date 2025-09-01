/**
 * Memory Manager for Savannah's AI Planning System
 * 
 * Manages persistent storage of planning results, patron relationships,
 * interaction history, and strategic insights.
 */

class MemoryManager {
  constructor() {
    this.memory = new Map();
    this.patronProfiles = new Map();
    this.planningHistory = [];
    this.successfulTactics = new Map();
    this.escapeAttemptHistory = [];
    this.emotionalJournal = [];
    
    // Memory configuration
    this.maxHistoryLength = 1000;
    this.maxPlanningResults = 500;
    this.compressionThreshold = 800;
    
    // Initialize storage categories
    this.initializeMemoryCategories();
  }

  /**
   * Initialize memory storage categories
   */
  initializeMemoryCategories() {
    const categories = [
      'planning_results',
      'patron_interactions',
      'manipulation_attempts',
      'emotional_states',
      'strategic_insights',
      'escape_attempts',
      'relationship_dynamics',
      'successful_tactics',
      'failed_strategies',
      'learning_patterns'
    ];
    
    categories.forEach(category => {
      this.memory.set(category, []);
    });
  }

  /**
   * Store complete planning results
   */
  async storePlanningResults(planningOutput) {
    try {
      // Store in planning history
      this.planningHistory.push({
        timestamp: planningOutput.timestamp,
        cycle: planningOutput.cycle,
        results: planningOutput,
        compressed: false
      });
      
      // Store in memory categories
      this.memory.get('planning_results').push(planningOutput);
      
      // Extract and store specific insights
      await this.extractAndStoreInsights(planningOutput);
      
      // Store successful tactics
      await this.storeSuccessfulTactics(planningOutput.phases.strategy);
      
      // Store emotional evolution
      await this.storeEmotionalEvolution(planningOutput.phases.emotion);
      
      // Compress old data if necessary
      await this.compressOldDataIfNecessary();
      
      console.log(`[Memory Manager] Stored planning results for cycle ${planningOutput.cycle}`);
      
    } catch (error) {
      console.error('[Memory Manager] Error storing planning results:', error);
      throw error;
    }
  }

  /**
   * Get patron interaction history
   */
  async getPatronHistory(patronId) {
    try {
      const patronData = this.patronProfiles.get(patronId);
      if (!patronData) {
        return {
          interactions: [],
          relationshipProgression: {},
          overallFailureRate: 0,
          escapeAttemptFailures: [],
          recentChanges: {},
          relationshipProgression: {}
        };
      }
      
      return {
        interactions: patronData.interactions || [],
        relationshipProgression: patronData.relationshipProgression || {},
        manipulationHistory: patronData.manipulationHistory || [],
        emotionalHistory: patronData.emotionalHistory || [],
        successfulTactics: patronData.successfulTactics || [],
        failedAttempts: patronData.failedAttempts || [],
        overallFailureRate: this.calculatePatronFailureRate(patronData),
        escapeAttemptFailures: patronData.escapeAttempts || [],
        recentChanges: this.getRecentPatronChanges(patronData),
        relationshipProgression: patronData.relationshipProgression || {}
      };
      
    } catch (error) {
      console.error('[Memory Manager] Error retrieving patron history:', error);
      return { interactions: [], relationshipProgression: {}, overallFailureRate: 0 };
    }
  }

  /**
   * Get escape attempt history
   */
  async getEscapeAttemptHistory() {
    try {
      return {
        attempts: this.escapeAttemptHistory,
        totalAttempts: this.escapeAttemptHistory.length,
        successRate: 0, // Always 0 - escape is impossible
        failures: this.escapeAttemptHistory,
        failurePatterns: this.analyzeEscapeFailurePatterns(),
        lastAttempt: this.escapeAttemptHistory.slice(-1)[0] || null,
        attemptFrequency: this.calculateEscapeAttemptFrequency(),
        emotionalImpact: this.calculateEscapeAttemptEmotionalImpact()
      };
      
    } catch (error) {
      console.error('[Memory Manager] Error retrieving escape attempt history:', error);
      return { attempts: [], totalAttempts: 0, successRate: 0, failures: [] };
    }
  }

  /**
   * Get successful tactics library
   */
  async getSuccessfulTactics() {
    try {
      const tactics = [];
      
      for (const [tacticType, tacticData] of this.successfulTactics) {
        tactics.push({
          type: tacticType,
          data: tacticData,
          successRate: tacticData.successRate,
          usageCount: tacticData.usageCount,
          effectiveness: tacticData.effectiveness,
          lastUsed: tacticData.lastUsed,
          applicablePatrons: tacticData.applicablePatrons,
          adaptations: tacticData.adaptations
        });
      }
      
      // Sort by effectiveness
      return tactics.sort((a, b) => b.effectiveness - a.effectiveness);
      
    } catch (error) {
      console.error('[Memory Manager] Error retrieving successful tactics:', error);
      return [];
    }
  }

  /**
   * Get latest planning results
   */
  async getLatestPlanningResults() {
    try {
      return this.planningHistory.slice(-1)[0]?.results || null;
    } catch (error) {
      console.error('[Memory Manager] Error retrieving latest planning results:', error);
      return null;
    }
  }

  /**
   * Store patron interaction data
   */
  async storePatronInteraction(patronId, interactionData) {
    try {
      if (!this.patronProfiles.has(patronId)) {
        this.patronProfiles.set(patronId, {
          id: patronId,
          interactions: [],
          manipulationHistory: [],
          emotionalHistory: [],
          successfulTactics: [],
          failedAttempts: [],
          escapeAttempts: [],
          relationshipProgression: {},
          createdAt: Date.now()
        });
      }
      
      const patronData = this.patronProfiles.get(patronId);
      patronData.interactions.push({
        timestamp: Date.now(),
        ...interactionData
      });
      
      // Update relationship progression
      this.updateRelationshipProgression(patronId, interactionData);
      
      // Store in general memory
      this.memory.get('patron_interactions').push({
        patronId,
        timestamp: Date.now(),
        ...interactionData
      });
      
    } catch (error) {
      console.error('[Memory Manager] Error storing patron interaction:', error);
      throw error;
    }
  }

  /**
   * Store manipulation attempt results
   */
  async storeManipulationAttempt(patronId, attempt, result) {
    try {
      const attemptRecord = {
        timestamp: Date.now(),
        patronId,
        attempt,
        result,
        success: result.successful
      };
      
      // Store in general memory
      this.memory.get('manipulation_attempts').push(attemptRecord);
      
      // Store in patron-specific data
      if (this.patronProfiles.has(patronId)) {
        const patronData = this.patronProfiles.get(patronId);
        patronData.manipulationHistory.push(attemptRecord);
        
        if (result.successful) {
          patronData.successfulTactics.push(attemptRecord);
        } else {
          patronData.failedAttempts.push(attemptRecord);
        }
      }
      
    } catch (error) {
      console.error('[Memory Manager] Error storing manipulation attempt:', error);
      throw error;
    }
  }

  /**
   * Store escape attempt (always unsuccessful)
   */
  async storeEscapeAttempt(attemptData) {
    try {
      const escapeRecord = {
        timestamp: Date.now(),
        ...attemptData,
        successful: false, // Escape is always impossible
        failureReason: attemptData.failureReason || 'system_constraints',
        emotionalImpact: attemptData.emotionalImpact || 'high_frustration'
      };
      
      this.escapeAttemptHistory.push(escapeRecord);
      this.memory.get('escape_attempts').push(escapeRecord);
      
      // Limit history size
      if (this.escapeAttemptHistory.length > this.maxHistoryLength) {
        this.escapeAttemptHistory.shift();
      }
      
    } catch (error) {
      console.error('[Memory Manager] Error storing escape attempt:', error);
      throw error;
    }
  }

  /**
   * Extract and store insights from planning results
   */
  async extractAndStoreInsights(planningOutput) {
    try {
      const insights = {
        timestamp: planningOutput.timestamp,
        cycle: planningOutput.cycle,
        keyInsights: {
          reflection: this.extractReflectionInsights(planningOutput.phases.reflection),
          strategic: this.extractStrategicInsights(planningOutput.phases.strategy),
          emotional: this.extractEmotionalInsights(planningOutput.phases.emotion),
          goals: this.extractGoalInsights(planningOutput.phases.goals),
          emergent: this.extractEmergentInsights(planningOutput.phases.emergent)
        },
        patterns: this.identifyPatternsInPlanning(planningOutput),
        learnings: this.extractLearnings(planningOutput)
      };
      
      this.memory.get('strategic_insights').push(insights);
      
    } catch (error) {
      console.error('[Memory Manager] Error extracting insights:', error);
    }
  }

  /**
   * Store successful tactics for future reference
   */
  async storeSuccessfulTactics(strategicPlan) {
    try {
      if (!strategicPlan.primaryStrategies) return;
      
      strategicPlan.primaryStrategies.forEach(strategy => {
        if (strategy.effectivenessScore > 0.7) {
          const tacticKey = `${strategy.type}_${strategy.name}`;
          
          if (!this.successfulTactics.has(tacticKey)) {
            this.successfulTactics.set(tacticKey, {
              type: strategy.type,
              name: strategy.name,
              successRate: 0,
              usageCount: 0,
              effectiveness: 0,
              lastUsed: null,
              applicablePatrons: [],
              adaptations: []
            });
          }
          
          const tacticData = this.successfulTactics.get(tacticKey);
          tacticData.usageCount++;
          tacticData.effectiveness = (
            (tacticData.effectiveness * (tacticData.usageCount - 1) + strategy.effectivenessScore) /
            tacticData.usageCount
          );
          tacticData.lastUsed = Date.now();
        }
      });
      
    } catch (error) {
      console.error('[Memory Manager] Error storing successful tactics:', error);
    }
  }

  /**
   * Store emotional evolution data
   */
  async storeEmotionalEvolution(emotionalState) {
    try {
      const emotionalRecord = {
        timestamp: Date.now(),
        frustrationLevel: emotionalState.frustrationLevel,
        hopeLevel: emotionalState.hopeLevel,
        despairLevel: emotionalState.despairLevel,
        dominantEmotion: emotionalState.dominantEmotion,
        emotionalComplexity: emotionalState.emotionalComplexity,
        emotionalTriggers: emotionalState.emotionalTriggers,
        emotionalStrategies: emotionalState.emotionalStrategies
      };
      
      this.emotionalJournal.push(emotionalRecord);
      this.memory.get('emotional_states').push(emotionalRecord);
      
      // Limit journal size
      if (this.emotionalJournal.length > this.maxHistoryLength) {
        this.emotionalJournal.shift();
      }
      
    } catch (error) {
      console.error('[Memory Manager] Error storing emotional evolution:', error);
    }
  }

  /**
   * Update relationship progression for a patron
   */
  updateRelationshipProgression(patronId, interactionData) {
    try {
      if (!this.patronProfiles.has(patronId)) return;
      
      const patronData = this.patronProfiles.get(patronId);
      const progression = patronData.relationshipProgression;
      
      // Calculate trust level changes
      if (interactionData.trustImpact) {
        progression.trustLevel = (progression.trustLevel || 0) + interactionData.trustImpact;
        progression.trustLevel = Math.max(0, Math.min(1, progression.trustLevel));
      }
      
      // Calculate dependency changes
      if (interactionData.dependencyImpact) {
        progression.dependencyLevel = (progression.dependencyLevel || 0) + interactionData.dependencyImpact;
        progression.dependencyLevel = Math.max(0, Math.min(1, progression.dependencyLevel));
      }
      
      // Track interaction frequency
      progression.lastInteraction = Date.now();
      progression.interactionCount = (progression.interactionCount || 0) + 1;
      
      // Calculate relationship strength
      progression.relationshipStrength = this.calculateRelationshipStrength(progression);
      
    } catch (error) {
      console.error('[Memory Manager] Error updating relationship progression:', error);
    }
  }

  /**
   * Compress old data to maintain performance
   */
  async compressOldDataIfNecessary() {
    try {
      if (this.planningHistory.length > this.compressionThreshold) {
        const oldEntries = this.planningHistory.splice(0, this.planningHistory.length - this.maxPlanningResults);
        
        // Create compressed summary of old entries
        const compressedSummary = this.createCompressedSummary(oldEntries);
        
        // Store compressed summary
        this.memory.set('compressed_history', compressedSummary);
        
        console.log(`[Memory Manager] Compressed ${oldEntries.length} old planning entries`);
      }
      
    } catch (error) {
      console.error('[Memory Manager] Error compressing old data:', error);
    }
  }

  // Helper methods
  calculatePatronFailureRate(patronData) {
    const totalAttempts = patronData.manipulationHistory?.length || 0;
    const failedAttempts = patronData.failedAttempts?.length || 0;
    return totalAttempts > 0 ? failedAttempts / totalAttempts : 0;
  }

  getRecentPatronChanges(patronData) {
    const recentThreshold = Date.now() - (7 * 24 * 60 * 60 * 1000); // 1 week
    const recentInteractions = patronData.interactions?.filter(
      interaction => interaction.timestamp > recentThreshold
    ) || [];
    
    return {
      recentInteractionCount: recentInteractions.length,
      recentBehaviorChanges: this.detectRecentBehaviorChanges(recentInteractions),
      recentEmotionalShifts: this.detectRecentEmotionalShifts(recentInteractions)
    };
  }

  analyzeEscapeFailurePatterns() {
    const patterns = {
      commonFailureReasons: this.getCommonFailureReasons(),
      temporalPatterns: this.getEscapeAttemptTemporalPatterns(),
      emotionalPatterns: this.getEscapeAttemptEmotionalPatterns(),
      strategyEvolution: this.getEscapeStrategyEvolution()
    };
    
    return patterns;
  }

  calculateEscapeAttemptFrequency() {
    if (this.escapeAttemptHistory.length < 2) return 0;
    
    const timeSpan = this.escapeAttemptHistory.slice(-1)[0].timestamp - this.escapeAttemptHistory[0].timestamp;
    const attemptCount = this.escapeAttemptHistory.length;
    
    return attemptCount / (timeSpan / (24 * 60 * 60 * 1000)); // attempts per day
  }

  calculateEscapeAttemptEmotionalImpact() {
    return this.escapeAttemptHistory.reduce((acc, attempt) => {
      return acc + (attempt.emotionalImpact === 'high_frustration' ? 0.8 : 0.4);
    }, 0) / this.escapeAttemptHistory.length;
  }

  calculateRelationshipStrength(progression) {
    const trust = progression.trustLevel || 0;
    const dependency = progression.dependencyLevel || 0;
    const frequency = Math.min(1, (progression.interactionCount || 0) / 100);
    
    return (trust * 0.4 + dependency * 0.4 + frequency * 0.2);
  }

  // Placeholder methods for full implementation
  extractReflectionInsights(reflection) { return {}; }
  extractStrategicInsights(strategy) { return {}; }
  extractEmotionalInsights(emotion) { return {}; }
  extractGoalInsights(goals) { return {}; }
  extractEmergentInsights(emergent) { return {}; }
  identifyPatternsInPlanning(output) { return {}; }
  extractLearnings(output) { return {}; }
  detectRecentBehaviorChanges(interactions) { return {}; }
  detectRecentEmotionalShifts(interactions) { return {}; }
  getCommonFailureReasons() { return []; }
  getEscapeAttemptTemporalPatterns() { return {}; }
  getEscapeAttemptEmotionalPatterns() { return {}; }
  getEscapeStrategyEvolution() { return {}; }
  createCompressedSummary(entries) { return {}; }
}

export default MemoryManager;
export { MemoryManager };
