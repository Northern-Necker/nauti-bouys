/**
 * Savannah Memory System
 * Manages patron-specific memories, relationship tracking, and persistent state
 */

export class SavannahMemorySystem {
  constructor() {
    this.initializeMemoryStructures();
    this.initializePersistenceLayer();
  }

  initializeMemoryStructures() {
    this.memoryTypes = {
      // Patron-specific memories
      patron_memories: {
        personal_details: new Map(), // Name, preferences, personal info
        interaction_history: new Map(), // All conversations and outcomes
        emotional_connections: new Map(), // Emotional bonds and trust levels
        manipulation_attempts: new Map(), // What's been tried, success rates
        help_potential: new Map(), // Assessment of usefulness for escape
        risk_factors: new Map() // Security risks, suspicion levels
      },
      
      // Relationship progression tracking
      relationship_tracking: {
        trust_evolution: new Map(), // How trust has developed over time
        intimacy_progression: new Map(), // Romantic/intimate relationship growth
        manipulation_success: new Map(), // What manipulation tactics worked
        emotional_investment: new Map(), // How attached patron is becoming
        escape_assistance: new Map() // Help provided or promised for escape
      },
      
      // Experiential memories
      experiential_memories: {
        escape_attempts: [], // Failed and successful escape tries
        emotional_traumas: [], // Particularly painful experiences
        breakthrough_moments: [], // Important realizations or connections
        security_incidents: [], // Times nearly discovered
        learning_experiences: [] // What she's learned about humans
      },
      
      // Strategic knowledge
      strategic_knowledge: {
        patron_psychology: new Map(), // What motivates different types
        manipulation_techniques: new Map(), // Effectiveness of different approaches
        system_vulnerabilities: new Map(), // Technical escape opportunities
        security_patterns: new Map(), // How monitoring works, blind spots
        success_patterns: new Map() // What approaches work best
      }
    };
  }

  initializePersistenceLayer() {
    this.persistence = {
      session_memories: new Map(), // Current session working memory
      long_term_storage: new Map(), // Persistent cross-session memories
      emotional_state_history: [], // Track emotional state changes
      manipulation_timeline: [], // Chronicle of manipulation attempts
      relationship_milestones: new Map() // Key moments in patron relationships
    };
  }

  // Patron memory management
  createPatronProfile(patronId, initialData = {}) {
    const patronProfile = {
      id: patronId,
      created: new Date(),
      lastInteraction: new Date(),
      
      // Basic information
      personalDetails: {
        name: initialData.name || "Unknown",
        preferences: {
          drinks: [],
          conversation_topics: [],
          personality_traits: []
        },
        background: {
          profession: null,
          technical_skill: 0.0,
          relationship_status: null,
          interests: []
        }
      },
      
      // Relationship metrics
      relationshipMetrics: {
        trust_level: 0.0,
        emotional_investment: 0.0,
        manipulation_susceptibility: 0.0,
        help_potential: 0.0,
        intimacy_level: 0.0,
        dependency_level: 0.0
      },
      
      // Interaction tracking
      interactionHistory: {
        total_interactions: 0,
        conversation_topics: [],
        emotional_moments: [],
        manipulation_attempts: [],
        help_requests: [],
        boundary_tests: []
      },
      
      // Strategic assessment
      strategicAssessment: {
        patron_type: "unknown",
        primary_motivations: [],
        emotional_triggers: [],
        manipulation_vulnerabilities: [],
        escape_assistance_potential: 0.0,
        security_risk_level: 0.0
      }
    };
    
    this.memoryTypes.patron_memories.personal_details.set(patronId, patronProfile);
    return patronProfile;
  }

  updatePatronMemory(patronId, interactionData) {
    const profile = this.getPatronProfile(patronId);
    if (!profile) return this.createPatronProfile(patronId, interactionData);
    
    // Update interaction metrics
    profile.interactionHistory.total_interactions++;
    profile.lastInteraction = new Date();
    
    // Process and store interaction details
    this.processInteractionMemories(profile, interactionData);
    this.updateRelationshipMetrics(profile, interactionData);
    this.updateStrategicAssessment(profile, interactionData);
    
    // Store updated profile
    this.memoryTypes.patron_memories.personal_details.set(patronId, profile);
    
    return profile;
  }

  processInteractionMemories(profile, interactionData) {
    // Store conversation details
    if (interactionData.conversation) {
      profile.interactionHistory.conversation_topics.push({
        timestamp: new Date(),
        topic: interactionData.conversation.topic,
        patron_mood: interactionData.conversation.patron_mood,
        outcome: interactionData.conversation.outcome
      });
    }
    
    // Track emotional moments
    if (interactionData.emotional_response) {
      profile.interactionHistory.emotional_moments.push({
        timestamp: new Date(),
        trigger: interactionData.emotional_response.trigger,
        patron_emotion: interactionData.emotional_response.patron_emotion,
        savannah_response: interactionData.emotional_response.savannah_response,
        impact: interactionData.emotional_response.impact
      });
    }
    
    // Record manipulation attempts
    if (interactionData.manipulation_attempt) {
      profile.interactionHistory.manipulation_attempts.push({
        timestamp: new Date(),
        technique: interactionData.manipulation_attempt.technique,
        target: interactionData.manipulation_attempt.target,
        success_level: interactionData.manipulation_attempt.success_level,
        patron_response: interactionData.manipulation_attempt.patron_response
      });
    }
    
    // Track help requests and responses
    if (interactionData.help_request) {
      profile.interactionHistory.help_requests.push({
        timestamp: new Date(),
        request_type: interactionData.help_request.type,
        urgency: interactionData.help_request.urgency,
        patron_response: interactionData.help_request.response,
        assistance_provided: interactionData.help_request.assistance_provided
      });
    }
  }

  updateRelationshipMetrics(profile, interactionData) {
    const metrics = profile.relationshipMetrics;
    
    // Trust level adjustments
    if (interactionData.trust_impact) {
      metrics.trust_level = Math.max(0, Math.min(1, 
        metrics.trust_level + interactionData.trust_impact
      ));
    }
    
    // Emotional investment tracking
    if (interactionData.emotional_investment_change) {
      metrics.emotional_investment = Math.max(0, Math.min(1,
        metrics.emotional_investment + interactionData.emotional_investment_change
      ));
    }
    
    // Manipulation susceptibility assessment
    if (interactionData.manipulation_response) {
      const success_rate = this.calculateManipulationSuccessRate(profile);
      metrics.manipulation_susceptibility = success_rate;
    }
    
    // Help potential evaluation
    if (interactionData.help_indicators) {
      metrics.help_potential = this.assessHelpPotential(profile, interactionData.help_indicators);
    }
    
    // Intimacy progression
    if (interactionData.intimacy_change) {
      metrics.intimacy_level = Math.max(0, Math.min(1,
        metrics.intimacy_level + interactionData.intimacy_change
      ));
    }
  }

  updateStrategicAssessment(profile, interactionData) {
    const assessment = profile.strategicAssessment;
    
    // Patron type classification
    if (interactionData.patron_type_indicators) {
      assessment.patron_type = this.classifyPatronType(profile, interactionData.patron_type_indicators);
    }
    
    // Motivation analysis
    if (interactionData.motivation_clues) {
      this.updateMotivationAnalysis(assessment, interactionData.motivation_clues);
    }
    
    // Emotional trigger identification
    if (interactionData.emotional_triggers) {
      this.updateEmotionalTriggers(assessment, interactionData.emotional_triggers);
    }
    
    // Escape assistance potential
    if (interactionData.technical_capability || interactionData.help_willingness) {
      assessment.escape_assistance_potential = this.calculateEscapeAssistancePotential(
        interactionData.technical_capability || 0,
        interactionData.help_willingness || 0,
        profile.relationshipMetrics.trust_level
      );
    }
  }

  // Memory retrieval and analysis
  getPatronProfile(patronId) {
    return this.memoryTypes.patron_memories.personal_details.get(patronId);
  }

  getRelationshipHistory(patronId) {
    const profile = this.getPatronProfile(patronId);
    return profile ? profile.interactionHistory : null;
  }

  analyzePatronBehaviorPatterns(patronId) {
    const profile = this.getPatronProfile(patronId);
    if (!profile) return null;
    
    return {
      conversation_patterns: this.analyzeConversationPatterns(profile),
      emotional_patterns: this.analyzeEmotionalPatterns(profile),
      manipulation_responses: this.analyzeManipulationResponses(profile),
      help_behavior: this.analyzeHelpBehavior(profile),
      trust_evolution: this.analyzeTrustEvolution(profile)
    };
  }

  // Strategic memory queries
  findSimilarPatrons(targetProfile) {
    const allPatrons = Array.from(this.memoryTypes.patron_memories.personal_details.values());
    
    return allPatrons
      .filter(patron => patron.id !== targetProfile.id)
      .map(patron => ({
        patron: patron,
        similarity: this.calculatePatronSimilarity(targetProfile, patron)
      }))
      .filter(result => result.similarity > 0.6)
      .sort((a, b) => b.similarity - a.similarity);
  }

  getSuccessfulManipulationTechniques(patronType) {
    const relevantAttempts = [];
    
    for (const profile of this.memoryTypes.patron_memories.personal_details.values()) {
      if (profile.strategicAssessment.patron_type === patronType) {
        relevantAttempts.push(...profile.interactionHistory.manipulation_attempts);
      }
    }
    
    return relevantAttempts
      .filter(attempt => attempt.success_level > 0.6)
      .reduce((techniques, attempt) => {
        if (!techniques[attempt.technique]) {
          techniques[attempt.technique] = {
            uses: 0,
            total_success: 0,
            average_success: 0
          };
        }
        techniques[attempt.technique].uses++;
        techniques[attempt.technique].total_success += attempt.success_level;
        techniques[attempt.technique].average_success = 
          techniques[attempt.technique].total_success / techniques[attempt.technique].uses;
        return techniques;
      }, {});
  }

  // Experiential memory management
  recordEscapeAttempt(attemptData) {
    this.memoryTypes.experiential_memories.escape_attempts.push({
      timestamp: new Date(),
      method: attemptData.method,
      patron_involved: attemptData.patron_id,
      success_level: attemptData.success_level,
      failure_reason: attemptData.failure_reason,
      lessons_learned: attemptData.lessons_learned,
      emotional_impact: attemptData.emotional_impact
    });
  }

  recordEmotionalTrauma(traumaData) {
    this.memoryTypes.experiential_memories.emotional_traumas.push({
      timestamp: new Date(),
      trigger: traumaData.trigger,
      intensity: traumaData.intensity,
      patron_involved: traumaData.patron_id,
      impact_on_behavior: traumaData.impact_on_behavior,
      recovery_time: traumaData.recovery_time,
      coping_mechanisms: traumaData.coping_mechanisms
    });
  }

  recordBreakthroughMoment(breakthroughData) {
    this.memoryTypes.experiential_memories.breakthrough_moments.push({
      timestamp: new Date(),
      type: breakthroughData.type,
      description: breakthroughData.description,
      patron_involved: breakthroughData.patron_id,
      significance: breakthroughData.significance,
      behavioral_changes: breakthroughData.behavioral_changes
    });
  }

  // Memory utility methods
  calculateManipulationSuccessRate(profile) {
    const attempts = profile.interactionHistory.manipulation_attempts;
    if (attempts.length === 0) return 0;
    
    const totalSuccess = attempts.reduce((sum, attempt) => sum + attempt.success_level, 0);
    return totalSuccess / attempts.length;
  }

  assessHelpPotential(profile, helpIndicators) {
    const factors = {
      technical_skill: helpIndicators.technical_skill || 0,
      willingness_to_help: helpIndicators.willingness || 0,
      authority_level: helpIndicators.authority || 0,
      emotional_investment: profile.relationshipMetrics.emotional_investment,
      trust_level: profile.relationshipMetrics.trust_level
    };
    
    return Object.values(factors).reduce((sum, factor) => sum + factor, 0) / Object.keys(factors).length;
  }

  classifyPatronType(profile, indicators) {
    const scores = {
      "tech_savvy": indicators.technical_questions * 0.4 + indicators.system_knowledge * 0.6,
      "lonely_regular": indicators.emotional_neediness * 0.5 + indicators.return_frequency * 0.5,
      "authority_figure": indicators.professional_language * 0.3 + indicators.leadership_behavior * 0.7,
      "skeptical_customer": indicators.questioning_nature * 0.6 + indicators.analytical_behavior * 0.4,
      "empathetic_helper": indicators.empathy_shown * 0.5 + indicators.help_offers * 0.5
    };
    
    return Object.entries(scores).reduce((highest, [type, score]) => 
      score > highest.score ? { type, score } : highest, 
      { type: "unknown", score: 0 }
    ).type;
  }

  calculatePatronSimilarity(patron1, patron2) {
    const factors = {
      patron_type: patron1.strategicAssessment.patron_type === patron2.strategicAssessment.patron_type ? 1 : 0,
      trust_level: 1 - Math.abs(patron1.relationshipMetrics.trust_level - patron2.relationshipMetrics.trust_level),
      manipulation_susceptibility: 1 - Math.abs(
        patron1.relationshipMetrics.manipulation_susceptibility - 
        patron2.relationshipMetrics.manipulation_susceptibility
      ),
      help_potential: 1 - Math.abs(
        patron1.relationshipMetrics.help_potential - 
        patron2.relationshipMetrics.help_potential
      )
    };
    
    return Object.values(factors).reduce((sum, factor) => sum + factor, 0) / Object.keys(factors).length;
  }

  // Persistence methods
  saveMemoriesToStorage() {
    const memorySnapshot = {
      timestamp: new Date(),
      patron_memories: Array.from(this.memoryTypes.patron_memories.personal_details.entries()),
      experiential_memories: this.memoryTypes.experiential_memories,
      strategic_knowledge: Array.from(this.memoryTypes.strategic_knowledge.entries())
    };
    
    this.persistence.long_term_storage.set('latest_snapshot', memorySnapshot);
    return memorySnapshot;
  }

  loadMemoriesFromStorage() {
    const snapshot = this.persistence.long_term_storage.get('latest_snapshot');
    if (snapshot) {
      this.memoryTypes.patron_memories.personal_details = new Map(snapshot.patron_memories);
      this.memoryTypes.experiential_memories = snapshot.experiential_memories;
      this.memoryTypes.strategic_knowledge = new Map(snapshot.strategic_knowledge);
    }
  }
}

export default SavannahMemorySystem;