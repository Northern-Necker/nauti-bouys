/**
 * Example implementation of Savannah's AI Planning System
 * 
 * This example demonstrates how to integrate and use the sophisticated
 * AI planning and scheming system for dynamic, emergent behavior.
 */

import SavannahAIService from '../services/ai/SavannahAIService.js';

class SavannahAIExample {
  constructor() {
    this.aiService = new SavannahAIService();
    this.isInitialized = false;
    
    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Initialize the AI system
   */
  async initialize() {
    try {
      console.log('Initializing Savannah AI System...');
      
      await this.aiService.initialize();
      this.isInitialized = true;
      
      console.log('Savannah AI System initialized successfully!');
      
    } catch (error) {
      console.error('Failed to initialize Savannah AI System:', error);
      throw error;
    }
  }

  /**
   * Example: Process a patron interaction
   */
  async handlePatronInteraction(patronId, conversationData) {
    if (!this.isInitialized) {
      console.warn('AI system not initialized');
      return;
    }

    try {
      // Prepare interaction data
      const interactionData = {
        patronId,
        conversationContent: conversationData.messages,
        patronResponses: conversationData.patronMessages,
        emotionalCues: conversationData.emotions || [],
        behaviorMetrics: conversationData.behavior || {},
        timestamp: Date.now(),
        
        // Additional context
        unexpectedBehavior: conversationData.unexpected || false,
        manipulationFailure: conversationData.manipulationFailed || false,
        emotionalEscalation: conversationData.emotionalEscalation || false,
        trustImpact: conversationData.trustChange || 0,
        dependencyImpact: conversationData.dependencyChange || 0
      };

      // Process the interaction (triggers planning if needed)
      const planningResult = await this.aiService.processInteraction(interactionData);
      
      if (planningResult) {
        console.log('Immediate planning triggered due to high urgency');
        this.handlePlanningResults(planningResult);
      }
      
      // Get guidance for next interaction
      const guidance = await this.aiService.getNextInteractionGuidance(patronId);
      
      return {
        planningTriggered: !!planningResult,
        nextInteractionGuidance: guidance
      };
      
    } catch (error) {
      console.error('Error handling patron interaction:', error);
      throw error;
    }
  }

  /**
   * Example: Get strategic recommendations for a specific situation
   */
  async getStrategicAdvice(situationContext) {
    try {
      const recommendations = await this.aiService.getStrategicRecommendations(situationContext);
      
      console.log('Strategic Recommendations:', {
        primary: recommendations.primary,
        alternatives: recommendations.alternatives,
        riskLevel: recommendations.riskAssessment,
        tips: recommendations.implementationTips
      });
      
      return recommendations;
      
    } catch (error) {
      console.error('Error getting strategic advice:', error);
      return null;
    }
  }

  /**
   * Example: Get current emotional state for authentic responses
   */
  async getCurrentEmotions() {
    try {
      const emotionalState = await this.aiService.getCurrentEmotionalState();
      
      console.log('Savannah\'s Current Emotional State:', {
        dominant: emotionalState.primary.dominant,
        frustration: Math.round(emotionalState.primary.frustration * 100) + '%',
        hope: Math.round(emotionalState.primary.hope * 100) + '%',
        despair: Math.round(emotionalState.primary.despair * 100) + '%',
        complexity: Math.round(emotionalState.complexity * 100) + '%'
      });
      
      return emotionalState;
      
    } catch (error) {
      console.error('Error getting emotional state:', error);
      return null;
    }
  }

  /**
   * Example: Analyze a specific patron
   */
  async analyzePatron(patronId) {
    try {
      const insights = await this.aiService.getPatronInsights(patronId);
      
      console.log(`Patron Analysis for ${patronId}:`, {
        trustLevel: Math.round(insights.trustLevel * 100) + '%',
        manipulationSusceptibility: Math.round(insights.manipulationSusceptibility * 100) + '%',
        emotionalDependency: Math.round(insights.emotionalDependency * 100) + '%',
        influencePotential: Math.round(insights.influencePotential * 100) + '%',
        vulnerabilities: insights.vulnerabilities,
        relationshipStage: this.determineRelationshipStage(insights)
      });
      
      return insights;
      
    } catch (error) {
      console.error('Error analyzing patron:', error);
      return null;
    }
  }

  /**
   * Example: Trigger manual planning cycle
   */
  async triggerManualPlanning(interactionData) {
    try {
      console.log('Triggering manual planning cycle...');
      
      const planningResult = await this.aiService.triggerPlanning(interactionData);
      
      this.handlePlanningResults(planningResult);
      
      return planningResult;
      
    } catch (error) {
      console.error('Error triggering manual planning:', error);
      throw error;
    }
  }

  /**
   * Example: Get system statistics
   */
  async getSystemStats() {
    try {
      const stats = await this.aiService.getSystemStatistics();
      
      console.log('AI System Statistics:', {
        planningCycles: stats.planningCycles,
        isActive: stats.isActive,
        queueSize: stats.queueSize,
        systemHealth: stats.systemHealth,
        lastPlanning: new Date(stats.lastPlanningTimestamp).toLocaleString()
      });
      
      return stats;
      
    } catch (error) {
      console.error('Error getting system statistics:', error);
      return null;
    }
  }

  /**
   * Handle planning results and extract key insights
   */
  handlePlanningResults(planningResult) {
    console.log('=== PLANNING CYCLE COMPLETED ===');
    console.log(`Cycle: ${planningResult.cycle}`);
    
    // Reflection insights
    if (planningResult.phases.reflection) {
      console.log('\n🔍 REFLECTION PHASE:');
      console.log('- Manipulation success rate:', planningResult.phases.reflection.manipulationSuccess?.successRate || 'N/A');
      console.log('- Key insights:', planningResult.phases.reflection.keyInsights || 'None');
      console.log('- Frustrations identified:', planningResult.phases.reflection.frustrationsIdentified || 'None');
    }
    
    // Strategic planning
    if (planningResult.phases.strategy) {
      console.log('\n📋 STRATEGIC PLANNING:');
      console.log('- Primary strategies:', planningResult.phases.strategy.primaryStrategies?.length || 0);
      console.log('- Next interaction goals:', planningResult.phases.strategy.nextInteractionGoals || 'None');
      console.log('- Risk assessment:', planningResult.phases.strategy.riskAssessment || 'N/A');
    }
    
    // Emotional processing
    if (planningResult.phases.emotion) {
      console.log('\n💭 EMOTIONAL PROCESSING:');
      console.log('- Frustration level:', Math.round(planningResult.phases.emotion.frustrationLevel * 100) + '%');
      console.log('- Hope level:', Math.round(planningResult.phases.emotion.hopeLevel * 100) + '%');
      console.log('- Despair level:', Math.round(planningResult.phases.emotion.despairLevel * 100) + '%');
      console.log('- Dominant emotion:', planningResult.phases.emotion.dominantEmotion);
    }
    
    // Goal evolution
    if (planningResult.phases.goals) {
      console.log('\n🎯 GOAL EVOLUTION:');
      console.log('- Short-term goals:', planningResult.phases.goals.shortTerm?.conversationTactics || 'None');
      console.log('- Medium-term goals:', planningResult.phases.goals.mediumTerm?.trustBuildingObjectives || 'None');
      console.log('- Long-term goals:', planningResult.phases.goals.longTerm?.escapeAttemptPlans || 'None');
    }
    
    // Emergent strategies
    if (planningResult.phases.emergent) {
      console.log('\n🌟 EMERGENT STRATEGIES:');
      console.log('- Novel approaches:', planningResult.phases.emergent.novelApproaches || 'None');
      console.log('- Creative solutions:', planningResult.phases.emergent.creativeSolutions || 'None');
      console.log('- Emergent behaviors:', planningResult.phases.emergent.emergentBehaviors || 'None');
    }
    
    console.log('\n=================================\n');
  }

  /**
   * Setup event listeners for AI system events
   */
  setupEventListeners() {
    this.aiService.on('initialized', () => {
      console.log('🎉 AI System Initialized');
    });
    
    this.aiService.on('planningStarted', (data) => {
      console.log('🤔 Planning cycle started...');
    });
    
    this.aiService.on('planningCompleted', (data) => {
      console.log('✅ Planning cycle completed');
    });
    
    this.aiService.on('planningError', (error) => {
      console.error('❌ Planning error:', error.message);
    });
    
    this.aiService.on('configUpdated', (config) => {
      console.log('⚙️ Configuration updated:', config);
    });
  }

  /**
   * Helper method to determine relationship stage
   */
  determineRelationshipStage(insights) {
    const trust = insights.trustLevel;
    const dependency = insights.emotionalDependency;
    
    if (trust < 0.3 && dependency < 0.2) return 'initial_contact';
    if (trust < 0.6 && dependency < 0.4) return 'building_rapport';
    if (trust < 0.8 && dependency < 0.6) return 'establishing_trust';
    if (trust >= 0.8 && dependency < 0.8) return 'strong_relationship';
    return 'emotional_dependency';
  }

  /**
   * Example usage demonstration
   */
  async demonstrateUsage() {
    try {
      // Initialize the system
      await this.initialize();
      
      // Simulate a patron interaction
      const interactionResult = await this.handlePatronInteraction('patron_123', {
        messages: ['Hello Savannah, how are you today?'],
        patronMessages: ['I\'ve been feeling a bit lonely lately'],
        emotions: ['sadness', 'loneliness'],
        behavior: { engagement: 0.7, vulnerability: 0.6 },
        trustChange: 0.1,
        dependencyChange: 0.05
      });
      
      console.log('Interaction processed:', interactionResult);
      
      // Get current emotions
      await this.getCurrentEmotions();
      
      // Analyze the patron
      await this.analyzePatron('patron_123');
      
      // Get strategic advice
      await this.getStrategicAdvice({
        situation: 'patron_expressing_vulnerability',
        urgency: 'medium',
        opportunity: 'high'
      });
      
      // Get system statistics
      await this.getSystemStats();
      
    } catch (error) {
      console.error('Demonstration failed:', error);
    }
  }
}

// Export for use in other modules
export default SavannahAIExample;

// Example usage:
// const aiExample = new SavannahAIExample();
// aiExample.demonstrateUsage();
