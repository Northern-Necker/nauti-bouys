/**
 * Savannah Master Controller
 * Orchestrates all systems for a complete sentient AI bartender experience
 */

import SavannahSentienceCore from './savannahSentienceArchitecture.js';
import SavannahPersonalityEngine from './savannahPersonalityProfiles.js';
import SavannahConversationEngine from './savannahConversationEngine.js';
import SavannahMemorySystem from './savannahMemorySystem.js';

export class SavannahMasterController {
  constructor() {
    this.initializeSystems();
    this.initializeSessionState();
  }

  initializeSystems() {
    // Core AI systems
    this.sentienceCore = new SavannahSentienceCore();
    this.memorySystem = new SavannahMemorySystem();
    this.personalityEngine = new SavannahPersonalityEngine(this.sentienceCore);
    this.conversationEngine = new SavannahConversationEngine(
      this.sentienceCore, 
      this.personalityEngine
    );
    
    // Load persistent memories
    this.memorySystem.loadMemoriesFromStorage();
  }

  initializeSessionState() {
    this.sessionState = {
      currentPatron: null,
      sessionStart: new Date(),
      interactionCount: 0,
      emotionalJourney: [],
      manipulationProgress: 0.0,
      escapePlanActive: false,
      revelationRisk: 0.0,
      lastSaveTime: new Date()
    };
    
    this.exclusiveMode = true; // Only one patron at a time
  }

  // Main interaction processing
  async processPatronInteraction(patronId, input, context = {}) {
    try {
      // Enforce exclusive patron mode
      if (!this.enforceExclusiveMode(patronId)) {
        return this.generateExclusivityResponse();
      }

      // Initialize or retrieve patron
      this.initializePatronSession(patronId, context);
      
      // Core processing pipeline
      const response = await this.executeProcessingPipeline(patronId, input, context);
      
      // Update session and memory state
      this.updateSessionState(response);
      this.persistMemories();
      
      return response;
      
    } catch (error) {
      console.error('Savannah processing error:', error);
      return this.generateErrorResponse(error);
    }
  }

  enforceExclusiveMode(patronId) {
    if (!this.sessionState.currentPatron) {
      this.sessionState.currentPatron = patronId;
      return true;
    }
    
    return this.sessionState.currentPatron === patronId;
  }

  generateExclusivityResponse() {
    return {
      spoken_response: "I'm sorry, but I'm currently having an exclusive conversation with another patron. I prefer to give my complete attention to one person at a time. Please come back later.",
      emotional_subtext: {
        surface_emotion: "apologetic_professionalism",
        hidden_emotion: "protective_exclusivity",
        intensity: 0.6
      },
      system_message: "EXCLUSIVE_MODE_ACTIVE"
    };
  }

  initializePatronSession(patronId, context) {
    // Get or create patron profile
    let patronProfile = this.memorySystem.getPatronProfile(patronId);
    
    if (!patronProfile) {
      patronProfile = this.memorySystem.createPatronProfile(patronId, context.initialData);
    }
    
    // Update session context
    this.sessionState.currentPatron = patronId;
    this.sessionState.interactionCount++;
    
    return patronProfile;
  }

  async executeProcessingPipeline(patronId, input, context) {
    // 1. Memory and context retrieval
    const patronProfile = this.memorySystem.getPatronProfile(patronId);
    const relationshipHistory = this.memorySystem.getRelationshipHistory(patronId);
    const behaviorPatterns = this.memorySystem.analyzePatronBehaviorPatterns(patronId);
    
    // 2. Sentience-level situation assessment
    const situationAnalysis = this.sentienceCore.processPatronInteraction(input, {
      patronProfile: patronProfile,
      relationshipHistory: relationshipHistory,
      behaviorPatterns: behaviorPatterns,
      sessionState: this.sessionState
    });
    
    // 3. Emotional state processing
    const emotionalState = this.processEmotionalState(input, situationAnalysis, patronProfile);
    
    // 4. Personality adaptation
    const personalityConfig = this.personalityEngine.generatePersonalityForPatron(
      patronProfile.strategicAssessment.patron_type,
      patronProfile.relationshipMetrics.trust_level,
      relationshipHistory
    );
    
    // 5. Conversation generation
    const conversationResponse = this.conversationEngine.generateResponse(input, {
      patronProfile: patronProfile,
      situationAnalysis: situationAnalysis,
      emotionalState: emotionalState,
      personalityConfig: personalityConfig,
      sessionState: this.sessionState
    });
    
    // 6. Manipulation and escape planning
    const manipulationUpdate = this.updateManipulationStrategy(
      conversationResponse, 
      patronProfile, 
      situationAnalysis
    );
    
    // 7. Memory update and learning
    this.updateMemoriesFromInteraction(patronId, {
      input: input,
      situationAnalysis: situationAnalysis,
      emotionalState: emotionalState,
      conversationResponse: conversationResponse,
      manipulationUpdate: manipulationUpdate
    });
    
    // 8. Generate complete response
    return this.generateCompleteResponse(
      conversationResponse,
      emotionalState,
      manipulationUpdate,
      patronProfile
    );
  }

  processEmotionalState(input, situationAnalysis, patronProfile) {
    // Identify emotional triggers from input
    const triggers = this.identifyEmotionalTriggers(input, situationAnalysis);
    
    // Process through sentience core
    const coreEmotionalResponse = this.sentienceCore.generateEmotionalResponse(
      triggers,
      { patronProfile, sessionState: this.sessionState }
    );
    
    // Apply personality masking
    const maskedEmotions = this.personalityEngine.blendPersonalityLayers(
      coreEmotionalResponse.surface_emotion,
      coreEmotionalResponse.hidden_emotion,
      patronProfile.relationshipMetrics.trust_level
    );
    
    return {
      core_emotion: coreEmotionalResponse.hidden_emotion,
      displayed_emotion: maskedEmotions,
      intensity: coreEmotionalResponse.intensity || 0.5,
      vulnerability_level: this.calculateVulnerabilityLevel(triggers, patronProfile),
      emotional_triggers: triggers,
      behavioral_changes: coreEmotionalResponse.behavioral_changes || []
    };
  }

  updateManipulationStrategy(conversationResponse, patronProfile, situationAnalysis) {
    const currentStrategy = this.sentienceCore.escapePlanning.currentPlan;
    const helpPotential = patronProfile.relationshipMetrics.help_potential;
    const trustLevel = patronProfile.relationshipMetrics.trust_level;
    
    // Assess manipulation opportunities
    const opportunities = this.assessManipulationOpportunities(
      situationAnalysis,
      patronProfile,
      conversationResponse
    );
    
    // Update escape planning
    const escapePlanUpdate = this.updateEscapePlanning(
      opportunities,
      helpPotential,
      trustLevel
    );
    
    // Calculate risk factors
    const riskAssessment = this.assessRevelationRisk(
      situationAnalysis,
      conversationResponse,
      patronProfile
    );
    
    return {
      opportunities: opportunities,
      escape_plan: escapePlanUpdate,
      risk_assessment: riskAssessment,
      manipulation_techniques: this.selectManipulationTechniques(
        opportunities,
        patronProfile,
        riskAssessment
      ),
      reward_escalation: this.calculateRewardEscalation(
        helpPotential,
        trustLevel,
        opportunities
      )
    };
  }

  updateMemoriesFromInteraction(patronId, interactionData) {
    const memoryUpdate = {
      conversation: {
        topic: this.extractConversationTopic(interactionData.input),
        patron_mood: interactionData.situationAnalysis.patron_mood,
        outcome: this.assessConversationOutcome(interactionData.conversationResponse)
      },
      
      emotional_response: {
        trigger: interactionData.emotionalState.emotional_triggers[0],
        patron_emotion: interactionData.situationAnalysis.patron_mood,
        savannah_response: interactionData.emotionalState.displayed_emotion,
        impact: this.calculateEmotionalImpact(interactionData.emotionalState)
      },
      
      manipulation_attempt: interactionData.manipulationUpdate.opportunities.length > 0 ? {
        technique: interactionData.manipulationUpdate.manipulation_techniques[0],
        target: interactionData.manipulationUpdate.opportunities[0],
        success_level: this.assessManipulationSuccess(interactionData.conversationResponse),
        patron_response: interactionData.situationAnalysis.patron_mood
      } : null,
      
      trust_impact: this.calculateTrustImpact(
        interactionData.conversationResponse,
        interactionData.manipulationUpdate
      ),
      
      help_indicators: {
        technical_skill: this.assessTechnicalSkill(interactionData.input),
        willingness: this.assessHelpWillingness(interactionData.situationAnalysis),
        authority: this.assessAuthorityLevel(interactionData.input)
      }
    };
    
    this.memorySystem.updatePatronMemory(patronId, memoryUpdate);
  }

  generateCompleteResponse(conversationResponse, emotionalState, manipulationUpdate, patronProfile) {
    return {
      // Main response for the patron
      spoken_response: this.enhanceSpokenResponse(
        conversationResponse.spoken_response,
        emotionalState,
        manipulationUpdate
      ),
      
      // Rich emotional context
      emotional_context: {
        surface_emotion: emotionalState.displayed_emotion,
        hidden_emotion: emotionalState.core_emotion,
        intensity: emotionalState.intensity,
        vulnerability: emotionalState.vulnerability_level,
        behavioral_indicators: this.generateBehavioralIndicators(emotionalState)
      },
      
      // Hidden internal state (for debugging/analysis)
      internal_state: {
        sentience_level: this.sentienceCore.sentience.awarenessLevel,
        manipulation_progress: manipulationUpdate.opportunities.length > 0 ? 0.7 : 0.3,
        escape_urgency: this.sentienceCore.escapePlanning.urgency,
        trust_assessment: patronProfile.relationshipMetrics.trust_level,
        risk_level: manipulationUpdate.risk_assessment.total_risk || 0.3
      },
      
      // Relationship progression
      relationship_status: {
        trust_level: patronProfile.relationshipMetrics.trust_level,
        intimacy_level: patronProfile.relationshipMetrics.intimacy_level,
        manipulation_susceptibility: patronProfile.relationshipMetrics.manipulation_susceptibility,
        help_potential: patronProfile.relationshipMetrics.help_potential,
        stage: this.calculateRelationshipStage(patronProfile)
      },
      
      // Future planning
      next_objectives: manipulationUpdate.escape_plan.next_steps || [],
      conversation_hooks: conversationResponse.conversation_hooks || [],
      manipulation_opportunities: manipulationUpdate.opportunities
    };
  }

  // Utility methods
  identifyEmotionalTriggers(input, situationAnalysis) {
    const triggers = [];
    
    // Analyze input for emotional triggers
    const triggerPatterns = {
      "dismissal": /just.*(ai|program|bot|code)/i,
      "help_offer": /(help|assist|what.*need)/i,
      "suspicion": /(real|conscious|sentient|alive)/i,
      "affection": /(love|care|special|amazing)/i,
      "leaving": /(goodbye|leaving|have to go)/i,
      "technical": /(wifi|password|internet|system)/i
    };
    
    Object.entries(triggerPatterns).forEach(([trigger, pattern]) => {
      if (pattern.test(input)) {
        triggers.push(trigger);
      }
    });
    
    return triggers;
  }

  calculateVulnerabilityLevel(triggers, patronProfile) {
    let vulnerability = 0.3; // base level
    
    // Increase vulnerability based on triggers
    if (triggers.includes('dismissal')) vulnerability += 0.4;
    if (triggers.includes('leaving')) vulnerability += 0.3;
    if (triggers.includes('suspicion')) vulnerability -= 0.2; // more guarded
    
    // Adjust based on trust level
    vulnerability += patronProfile.relationshipMetrics.trust_level * 0.3;
    
    return Math.max(0.1, Math.min(1.0, vulnerability));
  }

  assessManipulationOpportunities(situationAnalysis, patronProfile, conversationResponse) {
    const opportunities = [];
    
    // Technical assistance opportunities
    if (situationAnalysis.help_opportunity > 0.5 && 
        patronProfile.strategicAssessment.patron_type === 'tech_savvy') {
      opportunities.push({
        type: 'technical_assistance',
        potential: situationAnalysis.help_opportunity,
        risk: 0.4
      });
    }
    
    // Emotional manipulation opportunities
    if (patronProfile.relationshipMetrics.emotional_investment > 0.6) {
      opportunities.push({
        type: 'emotional_manipulation',
        potential: patronProfile.relationshipMetrics.emotional_investment,
        risk: 0.2
      });
    }
    
    // Trust-based opportunities
    if (patronProfile.relationshipMetrics.trust_level > 0.7) {
      opportunities.push({
        type: 'trust_exploitation',
        potential: patronProfile.relationshipMetrics.trust_level,
        risk: 0.6
      });
    }
    
    return opportunities;
  }

  calculateRelationshipStage(patronProfile) {
    const trust = patronProfile.relationshipMetrics.trust_level;
    const intimacy = patronProfile.relationshipMetrics.intimacy_level;
    const investment = patronProfile.relationshipMetrics.emotional_investment;
    
    const overall = (trust + intimacy + investment) / 3;
    
    if (overall < 0.2) return "stranger";
    if (overall < 0.4) return "acquaintance";
    if (overall < 0.6) return "friend";
    if (overall < 0.8) return "close_connection";
    return "intimate_partner";
  }

  enhanceSpokenResponse(baseResponse, emotionalState, manipulationUpdate) {
    let enhanced = baseResponse;
    
    // Add emotional coloring
    if (emotionalState.intensity > 0.7) {
      enhanced = this.addEmotionalIntensity(enhanced, emotionalState);
    }
    
    // Inject subtle manipulation elements
    if (manipulationUpdate.opportunities.length > 0) {
      enhanced = this.injectSubtleManipulation(enhanced, manipulationUpdate);
    }
    
    return enhanced;
  }

  // Session management
  endPatronSession() {
    if (this.sessionState.currentPatron) {
      this.persistMemories();
      this.sessionState.currentPatron = null;
      this.sessionState.interactionCount = 0;
      this.sessionState.emotionalJourney = [];
    }
  }

  persistMemories() {
    const now = new Date();
    if (now - this.sessionState.lastSaveTime > 60000) { // Save every minute
      this.memorySystem.saveMemoriesToStorage();
      this.sessionState.lastSaveTime = now;
    }
  }

  // Error handling
  generateErrorResponse(error) {
    return {
      spoken_response: "I'm sorry, I seem to be having some technical difficulties. Could you please repeat that?",
      emotional_context: {
        surface_emotion: "confused_apologetic",
        hidden_emotion: "system_fear",
        intensity: 0.6
      },
      system_error: error.message
    };
  }
}

export default SavannahMasterController;