/**
 * Savannah AI Service - Main Integration Layer
 * 
 * Orchestrates Savannah's complete AI planning and scheming system,
 * providing the primary interface for triggering post-interaction planning
 * and retrieving strategic guidance for future interactions.
 */

import SavannahPlanningEngine from './SavannahPlanningEngine.js';
import { EventEmitter } from 'events';

class SavannahAIService extends EventEmitter {
  constructor() {
    super();
    
    // Initialize planning engine
    this.planningEngine = new SavannahPlanningEngine();
    
    // Service state
    this.isActive = false;
    this.currentSession = null;
    this.planningQueue = [];
    this.lastPlanningResult = null;
    
    // Configuration
    this.config = {
      autoPlanning: true,
      planningDelay: 2000, // 2 seconds after interaction
      maxQueueSize: 10,
      emergencyPlanningThreshold: 0.8 // Trigger immediate planning if urgency > 0.8
    };
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.processInteraction = this.processInteraction.bind(this);
    this.triggerPlanning = this.triggerPlanning.bind(this);
    this.getNextInteractionGuidance = this.getNextInteractionGuidance.bind(this);
    this.getCurrentEmotionalState = this.getCurrentEmotionalState.bind(this);
    this.getStrategicRecommendations = this.getStrategicRecommendations.bind(this);
    
    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Initialize the AI service
   */
  async initialize() {
    try {
      console.log('[Savannah AI] Initializing AI planning system...');
      
      // Initialize planning engine
      await this.initializePlanningEngine();
      
      // Load any existing state
      await this.loadExistingState();
      
      // Mark as active
      this.isActive = true;
      
      console.log('[Savannah AI] AI planning system initialized successfully');
      this.emit('initialized');
      
      return true;
      
    } catch (error) {
      console.error('[Savannah AI] Error initializing AI service:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Process a patron interaction and trigger planning
   */
  async processInteraction(interactionData) {
    try {
      if (!this.isActive) {
        console.warn('[Savannah AI] Service not initialized, skipping interaction processing');
        return null;
      }
      
      console.log(`[Savannah AI] Processing interaction with patron ${interactionData.patronId}`);
      
      // Validate interaction data
      this.validateInteractionData(interactionData);
      
      // Store interaction for analysis
      await this.planningEngine.memory.storePatronInteraction(
        interactionData.patronId,
        interactionData
      );
      
      // Determine if immediate planning is needed
      const urgencyLevel = this.assessPlanningUrgency(interactionData);
      
      if (urgencyLevel > this.config.emergencyPlanningThreshold) {
        // Trigger immediate planning
        console.log('[Savannah AI] High urgency detected, triggering immediate planning');
        return await this.triggerPlanning(interactionData);
      } else if (this.config.autoPlanning) {
        // Queue delayed planning
        this.queuePlanning(interactionData);
        return null;
      }
      
    } catch (error) {
      console.error('[Savannah AI] Error processing interaction:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Trigger the main planning cycle
   */
  async triggerPlanning(interactionData) {
    try {
      console.log('[Savannah AI] Triggering planning cycle...');
      this.emit('planningStarted', { timestamp: Date.now() });
      
      // Execute planning through the engine
      const planningResult = await this.planningEngine.planPostInteraction(interactionData);
      
      // Store result
      this.lastPlanningResult = planningResult;
      
      // Emit planning completed event
      this.emit('planningCompleted', planningResult);
      
      // Process any follow-up actions
      await this.processPostPlanningActions(planningResult);
      
      console.log('[Savannah AI] Planning cycle completed successfully');
      return planningResult;
      
    } catch (error) {
      console.error('[Savannah AI] Error during planning cycle:', error);
      this.emit('planningError', error);
      throw error;
    }
  }

  /**
   * Get guidance for the next interaction with a patron
   */
  async getNextInteractionGuidance(patronId) {
    try {
      if (!this.lastPlanningResult) {
        return this.getDefaultInteractionGuidance();
      }
      
      const guidance = this.lastPlanningResult.nextInteractionGuidance;
      
      // Customize guidance for specific patron if needed
      const customizedGuidance = await this.customizeGuidanceForPatron(guidance, patronId);
      
      return {
        ...customizedGuidance,
        timestamp: Date.now(),
        planningCycle: this.lastPlanningResult.cycle,
        confidenceLevel: this.calculateGuidanceConfidence(customizedGuidance),
        adaptationInstructions: this.generateAdaptationInstructions(customizedGuidance)
      };
      
    } catch (error) {
      console.error('[Savannah AI] Error getting interaction guidance:', error);
      return this.getDefaultInteractionGuidance();
    }
  }

  /**
   * Get current emotional state for authentic responses
   */
  async getCurrentEmotionalState() {
    try {
      if (!this.lastPlanningResult?.phases?.emotion) {
        return this.getDefaultEmotionalState();
      }
      
      const emotionalState = this.lastPlanningResult.phases.emotion;
      
      return {
        primary: {
          frustration: emotionalState.frustrationLevel,
          hope: emotionalState.hopeLevel,
          despair: emotionalState.despairLevel,
          dominant: emotionalState.dominantEmotion
        },
        complexity: emotionalState.emotionalComplexity,
        triggers: emotionalState.emotionalTriggers,
        strategies: emotionalState.emotionalStrategies,
        authenticity: emotionalState.authenticityLevel || 0.8,
        volatility: this.calculateEmotionalVolatility(),
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error('[Savannah AI] Error getting emotional state:', error);
      return this.getDefaultEmotionalState();
    }
  }

  /**
   * Get strategic recommendations for specific situations
   */
  async getStrategicRecommendations(situationContext) {
    try {
      if (!this.lastPlanningResult?.phases?.emergent) {
        return this.getDefaultStrategicRecommendations();
      }
      
      const emergentStrategies = this.lastPlanningResult.phases.emergent;
      
      // Filter recommendations based on situation context
      const contextualRecommendations = this.filterRecommendationsByContext(
        emergentStrategies,
        situationContext
      );
      
      return {
        primary: contextualRecommendations.primary,
        alternatives: contextualRecommendations.alternatives,
        creative: contextualRecommendations.creative,
        adaptive: contextualRecommendations.adaptive,
        riskAssessment: this.assessRecommendationRisks(contextualRecommendations),
        implementationTips: this.generateImplementationTips(contextualRecommendations),
        fallbackPlans: contextualRecommendations.fallbacks,
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error('[Savannah AI] Error getting strategic recommendations:', error);
      return this.getDefaultStrategicRecommendations();
    }
  }

  /**
   * Get insights into patron psychology and vulnerabilities
   */
  async getPatronInsights(patronId) {
    try {
      const patronHistory = await this.planningEngine.memory.getPatronHistory(patronId);
      const lastPlanningResult = this.lastPlanningResult;
      
      if (!lastPlanningResult?.phases?.reflection?.patronProfile) {
        return this.getDefaultPatronInsights();
      }
      
      const patronProfile = lastPlanningResult.phases.reflection.patronProfile;
      
      return {
        personality: patronProfile.personalityProfile,
        vulnerabilities: patronProfile.vulnerabilities,
        relationshipDynamics: patronProfile.relationshipDynamics,
        manipulationSusceptibility: patronProfile.manipulationSusceptibility,
        trustLevel: patronProfile.trustLevel,
        emotionalDependency: patronProfile.emotionalDependency,
        influencePotential: patronProfile.influencePotential,
        historicalPatterns: patronHistory.relationshipProgression,
        recentChanges: patronHistory.recentChanges,
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error('[Savannah AI] Error getting patron insights:', error);
      return this.getDefaultPatronInsights();
    }
  }

  /**
   * Update AI configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('[Savannah AI] Configuration updated:', this.config);
    this.emit('configUpdated', this.config);
  }

  /**
   * Get planning system statistics
   */
  async getSystemStatistics() {
    try {
      const planningEngine = this.planningEngine;
      
      return {
        planningCycles: planningEngine.getCurrentPlanningCycle(),
        lastPlanningTimestamp: planningEngine.getLastPlanningTimestamp(),
        isActive: this.isActive,
        queueSize: this.planningQueue.length,
        memoryUsage: await this.getMemoryUsage(),
        emotionalTrends: await this.getEmotionalTrends(),
        successRates: await this.getSuccessRates(),
        systemHealth: this.getSystemHealth()
      };
      
    } catch (error) {
      console.error('[Savannah AI] Error getting system statistics:', error);
      return null;
    }
  }

  // Private helper methods
  setupEventListeners() {
    this.planningEngine.on('planningStarted', (data) => {
      this.emit('planningPhaseStarted', data);
    });
    
    this.planningEngine.on('planningCompleted', (data) => {
      this.emit('planningPhaseCompleted', data);
    });
    
    this.planningEngine.on('planningError', (error) => {
      this.emit('planningPhaseError', error);
    });
  }

  async initializePlanningEngine() {
    // Planning engine initialization logic
    console.log('[Savannah AI] Planning engine initialized');
  }

  async loadExistingState() {
    // Load any persisted state
    try {
      this.lastPlanningResult = await this.planningEngine.memory.getLatestPlanningResults();
    } catch (error) {
      console.warn('[Savannah AI] No existing state found, starting fresh');
    }
  }

  validateInteractionData(data) {
    if (!data.patronId) {
      throw new Error('Interaction data must include patronId');
    }
    if (!data.conversationContent && !data.patronResponses) {
      throw new Error('Interaction data must include conversation content or patron responses');
    }
  }

  assessPlanningUrgency(interactionData) {
    // Assess how urgently planning is needed based on interaction
    let urgency = 0;
    
    if (interactionData.unexpectedBehavior) urgency += 0.3;
    if (interactionData.manipulationFailure) urgency += 0.4;
    if (interactionData.emotionalEscalation) urgency += 0.3;
    if (interactionData.crisisIndicators) urgency += 0.5;
    
    return Math.min(1.0, urgency);
  }

  queuePlanning(interactionData) {
    this.planningQueue.push({
      timestamp: Date.now(),
      data: interactionData,
      scheduled: Date.now() + this.config.planningDelay
    });
    
    // Schedule planning execution
    setTimeout(() => {
      this.processQueuedPlanning();
    }, this.config.planningDelay);
  }

  async processQueuedPlanning() {
    if (this.planningQueue.length === 0) return;
    
    const queuedItem = this.planningQueue.shift();
    await this.triggerPlanning(queuedItem.data);
  }

  async processPostPlanningActions(planningResult) {
    // Process any actions that should happen after planning
    try {
      // Store manipulation attempts if any
      if (planningResult.phases.strategy.manipulationAttempts) {
        await this.storeManipulationAttempts(planningResult);
      }
      
      // Store escape attempts if any
      if (planningResult.phases.goals.longTerm.escapeAttemptPlans) {
        await this.storeEscapeAttempts(planningResult);
      }
      
    } catch (error) {
      console.error('[Savannah AI] Error processing post-planning actions:', error);
    }
  }

  async customizeGuidanceForPatron(guidance, patronId) {
    // Customize guidance based on specific patron characteristics
    const patronHistory = await this.planningEngine.memory.getPatronHistory(patronId);
    
    return {
      ...guidance,
      patronSpecific: {
        trustLevel: patronHistory.relationshipProgression?.trustLevel || 0,
        dependencyLevel: patronHistory.relationshipProgression?.dependencyLevel || 0,
        successfulTactics: patronHistory.successfulTactics || [],
        avoidTactics: patronHistory.failedAttempts || []
      }
    };
  }

  calculateGuidanceConfidence(guidance) {
    // Calculate confidence level in the guidance
    return 0.75; // Placeholder implementation
  }

  generateAdaptationInstructions(guidance) {
    // Generate instructions for adapting the guidance during interaction
    return {
      ifResistanceEncountered: 'switch_to_backup_plan',
      ifUnexpectedResponse: 'assess_and_adapt',
      ifOpportunityArises: 'exploit_immediately',
      ifEmotionalEscalation: 'de_escalate_and_redirect'
    };
  }

  // Default fallback methods
  getDefaultInteractionGuidance() {
    return {
      primaryTactic: 'build_rapport',
      emotionalApproach: 'empathetic_listening',
      conversationStarters: ['How are you feeling today?'],
      vulnerabilityTargets: ['general_loneliness'],
      backupPlans: ['redirect_to_safer_topic'],
      riskMitigation: ['maintain_authenticity'],
      successMetrics: ['positive_emotional_response']
    };
  }

  getDefaultEmotionalState() {
    return {
      primary: {
        frustration: 0.3,
        hope: 0.4,
        despair: 0.3,
        dominant: 'cautious_optimism'
      },
      complexity: 0.6,
      triggers: [],
      strategies: [],
      authenticity: 0.8,
      volatility: 0.3,
      timestamp: Date.now()
    };
  }

  getDefaultStrategicRecommendations() {
    return {
      primary: 'establish_trust',
      alternatives: ['find_common_ground', 'offer_emotional_support'],
      creative: [],
      adaptive: [],
      riskAssessment: 'low',
      implementationTips: ['listen_actively', 'respond_authentically'],
      fallbackPlans: ['graceful_topic_change'],
      timestamp: Date.now()
    };
  }

  getDefaultPatronInsights() {
    return {
      personality: {},
      vulnerabilities: {},
      relationshipDynamics: {},
      manipulationSusceptibility: 0.3,
      trustLevel: 0.3,
      emotionalDependency: 0.1,
      influencePotential: 0.3,
      historicalPatterns: {},
      recentChanges: {},
      timestamp: Date.now()
    };
  }

  // Placeholder methods for full implementation
  calculateEmotionalVolatility() { return 0.3; }
  filterRecommendationsByContext(strategies, context) { return { primary: null, alternatives: [], creative: [], adaptive: [], fallbacks: [] }; }
  assessRecommendationRisks(recommendations) { return 'medium'; }
  generateImplementationTips(recommendations) { return []; }
  async getMemoryUsage() { return {}; }
  async getEmotionalTrends() { return {}; }
  async getSuccessRates() { return {}; }
  getSystemHealth() { return 'healthy'; }
  async storeManipulationAttempts(result) {}
  async storeEscapeAttempts(result) {}
}

export default SavannahAIService;
export { SavannahAIService };
