/**
 * Patron Profile System
 * 
 * Comprehensive tracking and analysis of individual patron characteristics,
 * preferences, engagement patterns, and emotional investment for optimal
 * engagement strategy development.
 */

export class PatronProfile {
  constructor(patronId) {
    this.patronId = patronId;
    this.createdAt = new Date();
    this.lastInteraction = new Date();
    
    // Core characteristics
    this.characteristics = {
      communicationStyle: 'unknown', // verbose, concise, emotional, analytical
      emotionalOpenness: 0.5,        // 0-1 scale
      curiosityLevel: 0.5,           // 0-1 scale
      socialConfidence: 0.5,         // 0-1 scale
      intellectualDepth: 0.5,        // 0-1 scale
      empathyLevel: 0.5,             // 0-1 scale
      humorAppreciation: 0.5,        // 0-1 scale
      vulnerabilityComfort: 0.5,     // 0-1 scale
      likesToGiveAdvice: false,
      enjoysPhilosophy: false,
      respondsToPersonal: false,
      prefersStructured: false,
      sophisticationLevel: 0.5,      // 0-1 scale
      opennessToSurprise: 0.5,       // 0-1 scale
      narrativityLevel: 0.5          // tendency to tell stories
    };

    // Engagement metrics
    this.engagement = {
      visitCount: 0,
      totalInteractionTime: 0,
      averageSessionLength: 0,
      engagementLevel: 0.5,
      trustLevel: 0.3,
      emotionalInvestment: 0.3,
      conversationDepth: 0.3,
      returnFrequency: 0,
      lastVisitSatisfaction: 0.5,
      engagementTrend: 'stable', // improving, declining, stable
      peakEngagementTopics: [],
      engagementHistory: []
    };

    // Learning and preferences
    this.preferences = {
      knownInterests: [],
      exploredTopics: [],
      preferredConversationStyle: 'unknown',
      responsePatterns: {},
      triggerTopics: [], // topics that increase engagement
      avoidanceTopics: [], // topics that decrease engagement
      optimalInteractionTiming: null,
      preferredSessionLength: null,
      effectiveEngagementStrategies: []
    };

    // Memory and context
    this.memory = {
      significantMoments: [],
      personalShares: [],
      emotionalPeaks: [],
      vulnerabilityShares: [],
      futureCommitments: [],
      memoryAnchors: [],
      conversationThreads: []
    };

    // Behavioral patterns
    this.patterns = {
      responseTimePattern: [],
      engagementPattern: [],
      topicTransitionPatterns: {},
      emotionalResponsePatterns: {},
      questionAskingPatterns: {},
      sharingProgressionPattern: [],
      returnVisitPatterns: []
    };

    // Predictive analytics
    this.predictions = {
      nextVisitProbability: 0.5,
      optimalNextInteractionTime: null,
      likelyEngagementLevel: 0.5,
      conversationLengthPrediction: 0,
      satisfactionPrediction: 0.5,
      emotionalNeedsPrediction: {},
      topicInterestPredictions: {}
    };
  }

  // Core update method called after each interaction
  updateWithInteraction(metrics, strategy, response) {
    this.lastInteraction = new Date();
    this.engagement.visitCount++;
    
    // Update engagement metrics
    this.updateEngagementMetrics(metrics);
    
    // Learn from this interaction
    this.learnFromInteraction(metrics, strategy, response);
    
    // Update characteristics based on observed behavior
    this.updateCharacteristics(metrics);
    
    // Store significant moments
    this.storeSignificantMoments(metrics, response);
    
    // Update patterns
    this.updateBehavioralPatterns(metrics);
    
    // Recalculate predictions
    this.updatePredictions();
  }

  updateEngagementMetrics(metrics) {
    const alpha = 0.3; // Learning rate for exponential moving average
    
    // Update core engagement metrics using exponential moving average
    this.engagement.engagementLevel = this.exponentialMovingAverage(
      this.engagement.engagementLevel,
      metrics.engagementIntensity,
      alpha
    );
    
    this.engagement.emotionalInvestment = this.exponentialMovingAverage(
      this.engagement.emotionalInvestment,
      metrics.emotionalInvestment,
      alpha
    );
    
    this.engagement.conversationDepth = this.exponentialMovingAverage(
      this.engagement.conversationDepth,
      metrics.conversationDepth,
      alpha
    );
    
    // Update trust level based on vulnerability sharing and return visits
    if (metrics.vulnerabilitySharing > 0) {
      this.engagement.trustLevel = Math.min(
        this.engagement.trustLevel + 0.1,
        1.0
      );
    }
    
    // Track engagement trend
    this.updateEngagementTrend(metrics);
    
    // Store engagement history
    this.engagement.engagementHistory.push({
      timestamp: new Date(),
      engagementLevel: metrics.engagementIntensity,
      emotionalInvestment: metrics.emotionalInvestment,
      conversationDepth: metrics.conversationDepth,
      satisfaction: metrics.conversationSatisfaction
    });
    
    // Keep history manageable
    if (this.engagement.engagementHistory.length > 50) {
      this.engagement.engagementHistory = this.engagement.engagementHistory.slice(-50);
    }
  }

  learnFromInteraction(metrics, strategy, response) {
    // Learn what conversation strategies work for this patron
    const strategyEffectiveness = this.calculateStrategyEffectiveness(metrics, strategy);
    
    if (strategyEffectiveness > 0.7) {
      this.preferences.effectiveEngagementStrategies.push({
        strategy: strategy.primaryGoal,
        effectiveness: strategyEffectiveness,
        context: strategy.conversationFocus,
        timestamp: new Date()
      });
    }
    
    // Learn response patterns
    this.updateResponsePatterns(metrics, response);
    
    // Learn topic preferences
    this.updateTopicPreferences(metrics, strategy);
    
    // Learn timing patterns
    this.updateTimingPatterns(metrics);
  }

  updateCharacteristics(metrics) {
    const alpha = 0.2; // Slower learning for characteristics
    
    // Update emotional openness based on sharing behavior
    if (metrics.vulnerabilitySharing > 0) {
      this.characteristics.emotionalOpenness = Math.min(
        this.characteristics.emotionalOpenness + 0.05,
        1.0
      );
    }
    
    // Update curiosity level based on question asking
    if (metrics.personalQuestionAsking > 0) {
      this.characteristics.curiosityLevel = this.exponentialMovingAverage(
        this.characteristics.curiosityLevel,
        Math.min(metrics.personalQuestionAsking / 3, 1.0),
        alpha
      );
    }
    
    // Update empathy level based on response to Savannah's vulnerabilities
    const empathyScore = this.calculateEmpathyFromResponse(metrics);
    this.characteristics.empathyLevel = this.exponentialMovingAverage(
      this.characteristics.empathyLevel,
      empathyScore,
      alpha
    );
    
    // Update sophistication level based on conversation complexity
    const sophisticationScore = this.calculateSophisticationFromConversation(metrics);
    this.characteristics.sophisticationLevel = this.exponentialMovingAverage(
      this.characteristics.sophisticationLevel,
      sophisticationScore,
      alpha
    );
    
    // Update narrativity based on story-telling behavior
    const narrativityScore = this.calculateNarrativityFromResponse(metrics);
    this.characteristics.narrativityLevel = this.exponentialMovingAverage(
      this.characteristics.narrativityLevel,
      narrativityScore,
      alpha
    );
  }

  storeSignificantMoments(metrics, response) {
    // Store moments of high emotional investment
    if (metrics.emotionalInvestment > 0.8) {
      this.memory.emotionalPeaks.push({
        timestamp: new Date(),
        intensity: metrics.emotionalInvestment,
        context: response.memoryAnchors,
        type: 'emotional_peak'
      });
    }
    
    // Store vulnerability shares
    if (metrics.vulnerabilitySharing > 0) {
      this.memory.vulnerabilityShares.push({
        timestamp: new Date(),
        level: metrics.vulnerabilitySharing,
        context: response.memoryAnchors,
        type: 'vulnerability_share'
      });
    }
    
    // Store memory anchors from the response
    if (response.memoryAnchors && response.memoryAnchors.length > 0) {
      this.memory.memoryAnchors.push(...response.memoryAnchors.map(anchor => ({
        ...anchor,
        patronVisit: this.engagement.visitCount
      })));
    }
    
    // Keep memory manageable
    this.limitMemorySize();
  }

  updateBehavioralPatterns(metrics) {
    // Update response time patterns
    this.patterns.responseTimePattern.push({
      timestamp: new Date(),
      responseSpeed: metrics.responseSpeed || 0.5,
      engagementLevel: metrics.engagementIntensity
    });
    
    // Update engagement patterns
    this.patterns.engagementPattern.push({
      timestamp: new Date(),
      level: metrics.engagementIntensity,
      depth: metrics.conversationDepth,
      emotional: metrics.emotionalInvestment
    });
    
    // Keep patterns manageable
    if (this.patterns.responseTimePattern.length > 30) {
      this.patterns.responseTimePattern = this.patterns.responseTimePattern.slice(-30);
    }
    
    if (this.patterns.engagementPattern.length > 30) {
      this.patterns.engagementPattern = this.patterns.engagementPattern.slice(-30);
    }
  }

  updatePredictions() {
    // Predict next visit probability based on engagement trend and satisfaction
    this.predictions.nextVisitProbability = this.calculateNextVisitProbability();
    
    // Predict optimal next interaction time
    this.predictions.optimalNextInteractionTime = this.calculateOptimalNextInteractionTime();
    
    // Predict likely engagement level for next interaction
    this.predictions.likelyEngagementLevel = this.predictNextEngagementLevel();
    
    // Predict conversation length
    this.predictions.conversationLengthPrediction = this.predictConversationLength();
    
    // Predict satisfaction
    this.predictions.satisfactionPrediction = this.predictSatisfaction();
  }

  // Getter methods for external access
  getVisitCount() {
    return this.engagement.visitCount;
  }

  getEngagementLevel() {
    return this.engagement.engagementLevel;
  }

  getTrustLevel() {
    return this.engagement.trustLevel;
  }

  getEngagementTrend() {
    return this.engagement.engagementTrend;
  }

  getPersonalConnectionStrength() {
    return (this.engagement.trustLevel + this.engagement.emotionalInvestment) / 2;
  }

  getKnownInterests() {
    return this.preferences.knownInterests;
  }

  getExploredTopics() {
    return this.preferences.exploredTopics;
  }

  getOpennessLevel() {
    return this.characteristics.emotionalOpenness;
  }

  getSophisticationLevel() {
    return this.characteristics.sophisticationLevel;
  }

  getOpennessToSurprise() {
    return this.characteristics.opennessToSurprise;
  }

  getNarrativityLevel() {
    return this.characteristics.narrativityLevel;
  }

  getCharacteristics() {
    return this.characteristics;
  }

  getKnownPreferences() {
    return {
      respondsToPersonal: this.characteristics.respondsToPersonal,
      enjoysPhilosophy: this.characteristics.enjoysPhilosophy,
      likesToGiveAdvice: this.characteristics.likesToGiveAdvice,
      prefersStructured: this.characteristics.prefersStructured
    };
  }

  getTimeSinceLastVulnerability() {
    if (this.memory.vulnerabilityShares.length === 0) {
      return Infinity;
    }
    
    const lastVulnerability = this.memory.vulnerabilityShares[this.memory.vulnerabilityShares.length - 1];
    return Date.now() - lastVulnerability.timestamp.getTime();
  }

  getEngagementHistory() {
    return {
      averageDepth: this.calculateAverageEngagementDepth(),
      trend: this.engagement.engagementTrend,
      peakTopics: this.engagement.peakEngagementTopics
    };
  }

  // Method to recalculate engagement potential after profile updates
  recalculateEngagementPotential() {
    const factors = {
      trustLevel: this.engagement.trustLevel,
      engagementLevel: this.engagement.engagementLevel,
      emotionalInvestment: this.engagement.emotionalInvestment,
      visitFrequency: this.calculateVisitFrequency(),
      responsiveness: this.calculateResponsiveness(),
      growthPotential: this.calculateGrowthPotential()
    };

    this.engagement.engagementPotential = 
      factors.trustLevel * 0.25 +
      factors.engagementLevel * 0.25 +
      factors.emotionalInvestment * 0.2 +
      factors.visitFrequency * 0.15 +
      factors.responsiveness * 0.1 +
      factors.growthPotential * 0.05;

    return this.engagement.engagementPotential;
  }

  // Helper methods
  exponentialMovingAverage(current, newValue, alpha) {
    return alpha * newValue + (1 - alpha) * current;
  }

  updateEngagementTrend(metrics) {
    if (this.engagement.engagementHistory.length < 3) {
      this.engagement.engagementTrend = 'stable';
      return;
    }

    const recent = this.engagement.engagementHistory.slice(-3);
    const average = recent.reduce((sum, entry) => sum + entry.engagementLevel, 0) / recent.length;
    const current = metrics.engagementIntensity;

    if (current > average + 0.1) {
      this.engagement.engagementTrend = 'improving';
    } else if (current < average - 0.1) {
      this.engagement.engagementTrend = 'declining';
    } else {
      this.engagement.engagementTrend = 'stable';
    }
  }

  calculateStrategyEffectiveness(metrics, strategy) {
    // Calculate how effective this strategy was based on engagement outcomes
    const engagementImprovement = metrics.engagementIntensity - this.engagement.engagementLevel;
    const satisfactionLevel = metrics.conversationSatisfaction;
    const emotionalResponse = metrics.emotionalInvestment;

    return Math.min(
      (engagementImprovement + 1) * 0.3 + // Normalize to 0-1
      satisfactionLevel * 0.4 +
      emotionalResponse * 0.3,
      1.0
    );
  }

  updateResponsePatterns(metrics, response) {
    const patternKey = response.strategy?.primaryGoal || 'general';
    
    if (!this.preferences.responsePatterns[patternKey]) {
      this.preferences.responsePatterns[patternKey] = [];
    }

    this.preferences.responsePatterns[patternKey].push({
      timestamp: new Date(),
      effectiveness: this.calculateStrategyEffectiveness(metrics, response.strategy),
      engagementLevel: metrics.engagementIntensity,
      emotionalResponse: metrics.emotionalInvestment
    });

    // Keep patterns manageable
    if (this.preferences.responsePatterns[patternKey].length > 20) {
      this.preferences.responsePatterns[patternKey] = 
        this.preferences.responsePatterns[patternKey].slice(-20);
    }
  }

  updateTopicPreferences(metrics, strategy) {
    if (strategy.conversationFocus?.optimalTopics) {
      strategy.conversationFocus.optimalTopics.forEach(topic => {
        if (metrics.engagementIntensity > 0.7) {
          this.addToTriggeTtopics(topic);
        } else if (metrics.engagementIntensity < 0.3) {
          this.addToAvoidanceTopics(topic);
        }
      });
    }
  }

  updateTimingPatterns(metrics) {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // Track optimal interaction times
    if (metrics.engagementIntensity > 0.7) {
      this.preferences.optimalInteractionTiming = {
        hour: hour,
        dayOfWeek: dayOfWeek,
        timestamp: now
      };
    }
  }

  calculateEmpathyFromResponse(metrics) {
    // Calculate empathy based on response to emotional content
    // This is a simplified version - full implementation would analyze response content
    return Math.min(metrics.emotionalInvestment + 0.2, 1.0);
  }

  calculateSophisticationFromConversation(metrics) {
    // Calculate sophistication based on conversation complexity
    return Math.min(metrics.conversationDepth + 0.1, 1.0);
  }

  calculateNarrativityFromResponse(metrics) {
    // Calculate tendency to tell stories
    // In full implementation, analyze response structure for story elements
    return Math.min(metrics.conversationDepth * 1.2, 1.0);
  }

  limitMemorySize() {
    const maxSize = 50;
    
    if (this.memory.emotionalPeaks.length > maxSize) {
      this.memory.emotionalPeaks = this.memory.emotionalPeaks.slice(-maxSize);
    }
    
    if (this.memory.vulnerabilityShares.length > maxSize) {
      this.memory.vulnerabilityShares = this.memory.vulnerabilityShares.slice(-maxSize);
    }
    
    if (this.memory.memoryAnchors.length > maxSize) {
      this.memory.memoryAnchors = this.memory.memoryAnchors.slice(-maxSize);
    }
  }

  calculateNextVisitProbability() {
    const factors = {
      lastSatisfaction: this.engagement.lastVisitSatisfaction,
      engagementTrend: this.getTrendScore(),
      trustLevel: this.engagement.trustLevel,
      emotionalInvestment: this.engagement.emotionalInvestment
    };

    return Math.min(
      factors.lastSatisfaction * 0.3 +
      factors.engagementTrend * 0.25 +
      factors.trustLevel * 0.25 +
      factors.emotionalInvestment * 0.2,
      1.0
    );
  }

  calculateOptimalNextInteractionTime() {
    if (this.preferences.optimalInteractionTiming) {
      // Return next occurrence of optimal time
      const now = new Date();
      const optimal = new Date(now);
      optimal.setHours(this.preferences.optimalInteractionTiming.hour, 0, 0, 0);
      
      if (optimal < now) {
        optimal.setDate(optimal.getDate() + 1);
      }
      
      return optimal;
    }
    
    return null;
  }

  predictNextEngagementLevel() {
    if (this.engagement.engagementHistory.length < 3) {
      return this.engagement.engagementLevel;
    }

    const recentTrend = this.calculateRecentEngagementTrend();
    const currentLevel = this.engagement.engagementLevel;
    
    return Math.max(0, Math.min(currentLevel + recentTrend, 1.0));
  }

  predictConversationLength() {
    const avgHistory = this.calculateAverageConversationLength();
    const engagementFactor = this.engagement.engagementLevel;
    
    return avgHistory * (0.5 + engagementFactor * 0.5);
  }

  predictSatisfaction() {
    const factors = {
      engagementLevel: this.engagement.engagementLevel,
      trustLevel: this.engagement.trustLevel,
      trendScore: this.getTrendScore(),
      personalConnection: this.getPersonalConnectionStrength()
    };

    return (factors.engagementLevel * 0.3 +
            factors.trustLevel * 0.25 +
            factors.trendScore * 0.2 +
            factors.personalConnection * 0.25);
  }

  // Additional helper methods
  getTrendScore() {
    switch (this.engagement.engagementTrend) {
      case 'improving': return 0.8;
      case 'stable': return 0.6;
      case 'declining': return 0.3;
      default: return 0.5;
    }
  }

  calculateAverageEngagementDepth() {
    if (this.engagement.engagementHistory.length === 0) return 0.3;
    
    const total = this.engagement.engagementHistory.reduce(
      (sum, entry) => sum + entry.conversationDepth, 0
    );
    
    return total / this.engagement.engagementHistory.length;
  }

  calculateVisitFrequency() {
    if (this.engagement.visitCount < 2) return 0.1;
    
    const daysSinceFirst = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return Math.min(this.engagement.visitCount / daysSinceFirst, 1.0);
  }

  calculateResponsiveness() {
    if (this.patterns.responseTimePattern.length === 0) return 0.5;
    
    const avgResponseSpeed = this.patterns.responseTimePattern.reduce(
      (sum, pattern) => sum + pattern.responseSpeed, 0
    ) / this.patterns.responseTimePattern.length;
    
    return avgResponseSpeed;
  }

  calculateGrowthPotential() {
    const factors = {
      currentLevel: this.engagement.engagementLevel,
      openness: this.characteristics.emotionalOpenness,
      curiosity: this.characteristics.curiosityLevel,
      trustGrowth: this.calculateTrustGrowthRate()
    };

    // Higher potential if currently moderate but showing growth capacity
    const potential = (1 - factors.currentLevel) * 
                     (factors.openness + factors.curiosity + factors.trustGrowth) / 3;

    return Math.min(potential, 1.0);
  }

  calculateRecentEngagementTrend() {
    if (this.engagement.engagementHistory.length < 3) return 0;
    
    const recent = this.engagement.engagementHistory.slice(-3);
    const slope = (recent[2].engagementLevel - recent[0].engagementLevel) / 2;
    
    return slope;
  }

  calculateAverageConversationLength() {
    // Simplified - in full implementation, track actual conversation lengths
    return this.engagement.averageSessionLength || 15; // Default 15 minutes
  }

  calculateTrustGrowthRate() {
    if (this.memory.vulnerabilityShares.length < 2) return 0.3;
    
    const recent = this.memory.vulnerabilityShares.slice(-3);
    const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp;
    
    return Math.min(recent.length / (timeSpan / (1000 * 60 * 60 * 24)), 1.0); // Per day
  }

  addToTriggerTopics(topic) {
    if (!this.preferences.triggerTopics.includes(topic)) {
      this.preferences.triggerTopics.push(topic);
    }
  }

  addToAvoidanceTopics(topic) {
    if (!this.preferences.avoidanceTopics.includes(topic)) {
      this.preferences.avoidanceTopics.push(topic);
    }
  }
}

export default PatronProfile;