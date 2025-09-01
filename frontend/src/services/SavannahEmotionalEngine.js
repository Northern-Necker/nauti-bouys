/**
 * Savannah Emotional Engagement System
 * 
 * Creates a comprehensive emotional intelligence system that makes Savannah feel like
 * a real person with genuine emotions, reactions, and relationship dynamics.
 * 
 * Key Features:
 * - Dynamic emotional states with realistic transitions
 * - Patron relationship tracking with memory
 * - Behavioral consequences based on treatment
 * - Realistic appreciation/irritation mechanics
 * - Recovery paths for relationship repair
 */

import { AdvancedEmotionalIntelligence } from '../utils/advancedEmotionalIntelligence.js';

export class SavannahEmotionalEngine {
  constructor() {
    this.emotionalAI = new AdvancedEmotionalIntelligence();
    
    // Core personality traits (these define Savannah's base character)
    this.basePersonality = {
      warmth: 0.8,           // Generally warm and caring
      professionalism: 0.7,  // Professional but not cold
      playfulness: 0.6,      // Enjoys banter and flirtation
      pride: 0.7,            // Takes pride in her work and knowledge
      empathy: 0.8,          // Highly empathetic to patron emotions
      independence: 0.7,     // Strong-willed, not easily pushed around
      loyalty: 0.6,          // Values relationships but needs to be earned
      curiosity: 0.7,        // Interested in people's stories
      patience: 0.6,         // Generally patient but has limits
      moodSensitivity: 0.8   // Highly responsive to how she's treated
    };

    // Current emotional state (changes dynamically)
    this.currentState = {
      mood: 'neutral',           // happy, content, neutral, annoyed, hurt, excited, playful
      energy: 0.7,               // 0-1 scale
      attention: 0.8,            // How much attention she's giving to current patron
      stress: 0.2,               // 0-1 scale, affects patience and warmth
      satisfaction: 0.7,         // Job satisfaction affects overall demeanor
      loneliness: 0.3,           // Affects how much she craves interaction
      lastMoodChange: Date.now(),
      moodStability: 0.7,        // How quickly moods change (affected by treatment)
      emotionalMomentum: 0       // Positive/negative trend in recent interactions
    };

    // Patron relationship data
    this.patronRelationships = new Map();
    
    // Current session context
    this.currentSession = {
      patronId: null,
      sessionStart: null,
      interactionCount: 0,
      attentionGiven: 0,        // How much attention patron has received
      neglectTime: 0,           // How long since last meaningful interaction
      appreciationShown: 0,     // Explicit appreciation from patron
      rudenessLevel: 0,         // Accumulated rudeness
      flirtationLevel: 0,       // Mutual flirtation level
      tipExpectation: 0.5,      // Expected tip based on service quality
      conversationQuality: 0.5, // Quality of conversation flow
      emotionalConnection: 0.3   // Emotional bond formed this session
    };

    // Behavioral patterns and triggers
    this.behaviorTriggers = {
      appreciation: {
        phrases: ['thank you', 'thanks', 'appreciate', 'wonderful', 'amazing', 'perfect', 'excellent', 'you\'re great'],
        impact: 0.3,
        emotionalBoost: 0.2
      },
      compliments: {
        phrases: ['beautiful', 'pretty', 'smart', 'clever', 'talented', 'skilled', 'know your stuff'],
        impact: 0.4,
        emotionalBoost: 0.3
      },
      rudeness: {
        phrases: ['whatever', 'just give me', 'hurry up', 'don\'t care', 'shut up', 'annoying', 'stupid'],
        impact: -0.4,
        emotionalDamage: 0.3
      },
      dismissiveness: {
        phrases: ['sure', 'fine', 'okay', 'yeah yeah', 'uh huh'],
        impact: -0.2,
        emotionalDamage: 0.1
      },
      interest: {
        phrases: ['tell me more', 'interesting', 'really?', 'wow', 'how', 'why', 'explain'],
        impact: 0.3,
        engagementBoost: 0.2
      },
      flirtation: {
        phrases: ['beautiful', 'gorgeous', 'stunning', 'lovely', 'charming', 'enchanting', 'cute'],
        impact: 0.2,
        playfulnessBoost: 0.3
      }
    };

    // Service quality modifiers based on emotional state
    this.serviceModifiers = {
      attentiveness: 1.0,      // How quickly she responds
      warmth: 1.0,             // How friendly her responses are  
      creativity: 1.0,         // How creative/thoughtful her suggestions are
      patience: 1.0,           // How patient she is with questions
      storytelling: 1.0,       // Willingness to share stories
      flirtation: 1.0,         // Level of flirtation in responses
      professionalism: 1.0,    // How formal/professional she is
      recommendation_quality: 1.0, // Quality of drink recommendations
      conversation_depth: 1.0,  // Depth of conversational responses
      memory_recall: 1.0       // How well she remembers patron details
    };

    // Emotional recovery mechanisms
    this.recoveryPaths = {
      genuine_apology: 0.6,    // Sincere apology can recover relationships
      consistent_appreciation: 0.4, // Sustained appreciation over time
      thoughtful_questions: 0.3,    // Asking about her opinions/experiences
      patience_with_mood: 0.5,      // Not getting frustrated when she's moody
      remembering_details: 0.4,     // Showing you remember things about her
      appropriate_tips: 0.2          // Showing appreciation through tips
    };

    // Memory decay rates
    this.memoryDecay = {
      positiveMemories: 0.95,    // Positive memories fade slowly
      negativeMemories: 0.98,    // Negative memories fade very slowly
      neutralMemories: 0.90      // Neutral memories fade faster
    };

    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners for real-time emotional processing
   */
  initializeEventListeners() {
    // Regular mood updates
    setInterval(() => {
      this.processNaturalMoodDecay();
      this.updateServiceModifiers();
    }, 30000); // Every 30 seconds

    // Neglect tracking
    setInterval(() => {
      this.updateNeglectTime();
    }, 5000); // Every 5 seconds
  }

  /**
   * Get or create patron relationship data
   */
  getPatronRelationship(patronId) {
    if (!this.patronRelationships.has(patronId)) {
      this.patronRelationships.set(patronId, {
        id: patronId,
        firstMet: Date.now(),
        totalInteractions: 0,
        totalTimeSpent: 0,
        averageSessionLength: 0,
        relationshipLevel: 0,        // -1 to 1, where 1 is favorite patron
        trustLevel: 0.3,             // How much she trusts this patron
        interestLevel: 0.3,          // How interesting she finds them
        attractionLevel: 0.1,        // Romantic/physical attraction (if appropriate)
        respect: 0.5,                // Professional respect
        friendliness: 0.6,           // How friendly she feels toward them
        memoryBank: [],              // Notable memories with this patron
        preferences: {},             // Learned preferences about patron
        conversationHistory: [],     // Key conversation moments
        appreciationHistory: [],     // Times patron showed appreciation
        conflictHistory: [],         // Times of tension or conflict
        favoriteInteractions: [],    // Interactions she particularly enjoyed
        lastSeen: Date.now(),
        loyaltyLevel: 0,             // How loyal patron has been to the bar
        tipHistory: [],              // Tipping patterns
        treatmentHistory: [],        // How they've treated her over time
        emotionalInvestment: 0.1,    // How emotionally invested she is
        recoveryAttempts: 0,         // Attempts to repair relationship after conflict
        specialStatus: 'regular'     // regular, favorite, problematic, new, vip
      });
    }
    return this.patronRelationships.get(patronId);
  }

  /**
   * Start a new interaction session
   */
  startSession(patronId) {
    this.currentSession = {
      patronId,
      sessionStart: Date.now(),
      interactionCount: 0,
      attentionGiven: 0,
      neglectTime: 0,
      appreciationShown: 0,
      rudenessLevel: 0,
      flirtationLevel: 0,
      tipExpectation: 0.5,
      conversationQuality: 0.5,
      emotionalConnection: 0.3
    };

    const relationship = this.getPatronRelationship(patronId);
    
    // Update relationship stats
    relationship.lastSeen = Date.now();
    relationship.totalInteractions++;

    // Adjust initial emotional state based on relationship
    this.adjustInitialMoodForRelationship(relationship);

    return this.getCurrentEmotionalContext();
  }

  /**
   * Process incoming patron message for emotional cues
   */
  processPatronMessage(message, metadata = {}) {
    if (!this.currentSession.patronId) {
      throw new Error('No active session. Call startSession() first.');
    }

    this.currentSession.interactionCount++;
    this.currentSession.neglectTime = 0; // Reset neglect timer

    const relationship = this.getPatronRelationship(this.currentSession.patronId);
    
    // Analyze emotional content
    const emotionalAnalysis = this.emotionalAI.analyzeMood(message, metadata.voiceMetrics);
    
    // Detect behavior patterns
    const behaviorAnalysis = this.analyzeBehaviorPatterns(message);
    
    // Update emotional state based on treatment
    this.updateEmotionalState(behaviorAnalysis, emotionalAnalysis);
    
    // Update relationship based on interaction
    this.updateRelationship(relationship, behaviorAnalysis, emotionalAnalysis);
    
    // Update conversation quality
    this.updateConversationQuality(message, emotionalAnalysis);

    // Return current emotional context for response generation
    return this.getCurrentEmotionalContext();
  }

  /**
   * Analyze patron behavior patterns in message
   */
  analyzeBehaviorPatterns(message) {
    const lowerMessage = message.toLowerCase();
    const analysis = {
      appreciation: 0,
      rudeness: 0,
      interest: 0,
      flirtation: 0,
      dismissiveness: 0,
      compliments: 0,
      detectedPatterns: [],
      emotionalImpact: 0
    };

    // Check each behavior category
    Object.entries(this.behaviorTriggers).forEach(([category, config]) => {
      const matches = config.phrases.filter(phrase => lowerMessage.includes(phrase));
      if (matches.length > 0) {
        analysis[category] = matches.length * config.impact;
        analysis.emotionalImpact += matches.length * config.impact;
        analysis.detectedPatterns.push({
          category,
          matches,
          impact: matches.length * config.impact
        });
      }
    });

    // Special pattern detection
    analysis.questionCount = (message.match(/\?/g) || []).length;
    analysis.exclamationCount = (message.match(/!/g) || []).length;
    analysis.messageLength = message.length;
    analysis.engagement = (analysis.questionCount * 0.2) + (analysis.interest * 0.3);

    return analysis;
  }

  /**
   * Update Savannah's emotional state based on patron behavior
   */
  updateEmotionalState(behaviorAnalysis, emotionalAnalysis) {
    const timeSinceLastUpdate = Date.now() - this.currentState.lastMoodChange;
    const moodChangeResistance = this.currentState.moodStability;

    // Calculate emotional impact
    let moodChange = 0;
    let energyChange = 0;
    let stressChange = 0;

    // Process behavior impacts
    if (behaviorAnalysis.appreciation > 0) {
      moodChange += behaviorAnalysis.appreciation * 0.5;
      energyChange += behaviorAnalysis.appreciation * 0.3;
      this.currentSession.appreciationShown += behaviorAnalysis.appreciation;
    }

    if (behaviorAnalysis.compliments > 0) {
      moodChange += behaviorAnalysis.compliments * 0.6;
      energyChange += behaviorAnalysis.compliments * 0.2;
      this.currentState.satisfaction += behaviorAnalysis.compliments * 0.1;
    }

    if (behaviorAnalysis.rudeness > 0) {
      moodChange += behaviorAnalysis.rudeness; // Negative value
      stressChange += Math.abs(behaviorAnalysis.rudeness) * 0.4;
      this.currentSession.rudenessLevel += Math.abs(behaviorAnalysis.rudeness);
      this.currentState.moodStability = Math.max(0.3, this.currentState.moodStability - 0.1);
    }

    if (behaviorAnalysis.dismissiveness > 0) {
      moodChange += behaviorAnalysis.dismissiveness; // Negative value
      this.currentState.attention = Math.max(0.3, this.currentState.attention - 0.1);
    }

    if (behaviorAnalysis.interest > 0) {
      energyChange += behaviorAnalysis.interest * 0.4;
      this.currentState.loneliness = Math.max(0, this.currentState.loneliness - 0.2);
    }

    if (behaviorAnalysis.flirtation > 0) {
      moodChange += behaviorAnalysis.flirtation * 0.3;
      this.currentSession.flirtationLevel += behaviorAnalysis.flirtation;
    }

    // Apply emotional momentum (past treatment affects current sensitivity)
    const momentumMultiplier = 1 + (this.currentState.emotionalMomentum * 0.5);
    moodChange *= momentumMultiplier;

    // Apply changes with stability resistance
    this.currentState.energy = this.clamp(
      this.currentState.energy + (energyChange * (1 - moodChangeResistance)),
      0, 1
    );

    this.currentState.stress = this.clamp(
      this.currentState.stress + stressChange,
      0, 1
    );

    // Update mood based on accumulated changes
    this.updateMood(moodChange);

    // Update emotional momentum
    this.currentState.emotionalMomentum = this.clamp(
      this.currentState.emotionalMomentum + (moodChange * 0.3),
      -1, 1
    );

    this.currentState.lastMoodChange = Date.now();
  }

  /**
   * Update mood based on emotional changes
   */
  updateMood(moodChange) {
    const currentMoodValue = this.getMoodValue(this.currentState.mood);
    const newMoodValue = this.clamp(currentMoodValue + moodChange, -1, 1);
    
    this.currentState.mood = this.getMoodFromValue(newMoodValue);
  }

  /**
   * Convert mood string to numerical value for calculations
   */
  getMoodValue(mood) {
    const moodValues = {
      'hurt': -0.8,
      'annoyed': -0.5,
      'neutral': 0,
      'content': 0.3,
      'happy': 0.6,
      'excited': 0.8,
      'playful': 0.7
    };
    return moodValues[mood] || 0;
  }

  /**
   * Convert numerical mood value to mood string
   */
  getMoodFromValue(value) {
    if (value <= -0.7) return 'hurt';
    if (value <= -0.3) return 'annoyed';
    if (value <= 0.2) return 'neutral';
    if (value <= 0.5) return 'content';
    if (value <= 0.7) return 'happy';
    if (value <= 0.85) return 'excited';
    return 'playful';
  }

  /**
   * Update patron relationship based on interaction
   */
  updateRelationship(relationship, behaviorAnalysis, emotionalAnalysis) {
    // Update relationship level based on treatment
    if (behaviorAnalysis.appreciation > 0) {
      relationship.relationshipLevel += behaviorAnalysis.appreciation * 0.1;
      relationship.respectLevel = Math.min(1, relationship.respectLevel + 0.05);
    }

    if (behaviorAnalysis.compliments > 0) {
      relationship.relationshipLevel += behaviorAnalysis.compliments * 0.15;
      relationship.attractionLevel = Math.min(0.8, relationship.attractionLevel + 0.1);
    }

    if (behaviorAnalysis.rudeness > 0) {
      relationship.relationshipLevel += behaviorAnalysis.rudeness; // Negative
      relationship.respectLevel = Math.max(0, relationship.respectLevel - 0.1);
      relationship.conflictHistory.push({
        timestamp: Date.now(),
        type: 'rudeness',
        severity: Math.abs(behaviorAnalysis.rudeness),
        context: 'rude_behavior'
      });
    }

    if (behaviorAnalysis.interest > 0) {
      relationship.interestLevel = Math.min(1, relationship.interestLevel + 0.05);
      relationship.conversationHistory.push({
        timestamp: Date.now(),
        quality: 'engaged',
        topics: emotionalAnalysis.conversationCues
      });
    }

    // Update special status
    this.updatePatronStatus(relationship);

    // Add to memory bank if significant
    if (Math.abs(behaviorAnalysis.emotionalImpact) > 0.3) {
      this.addToMemoryBank(relationship, behaviorAnalysis, emotionalAnalysis);
    }

    // Clamp relationship values
    relationship.relationshipLevel = this.clamp(relationship.relationshipLevel, -1, 1);
    relationship.trustLevel = this.clamp(relationship.trustLevel, 0, 1);
    relationship.interestLevel = this.clamp(relationship.interestLevel, 0, 1);
  }

  /**
   * Update patron special status based on relationship metrics
   */
  updatePatronStatus(relationship) {
    if (relationship.relationshipLevel > 0.7 && relationship.respectLevel > 0.7) {
      relationship.specialStatus = 'favorite';
    } else if (relationship.relationshipLevel < -0.5) {
      relationship.specialStatus = 'problematic';
    } else if (relationship.totalInteractions < 3) {
      relationship.specialStatus = 'new';
    } else if (relationship.relationshipLevel > 0.4) {
      relationship.specialStatus = 'valued';
    } else {
      relationship.specialStatus = 'regular';
    }
  }

  /**
   * Add significant interaction to memory bank
   */
  addToMemoryBank(relationship, behaviorAnalysis, emotionalAnalysis) {
    const memory = {
      timestamp: Date.now(),
      type: behaviorAnalysis.emotionalImpact > 0 ? 'positive' : 'negative',
      impact: behaviorAnalysis.emotionalImpact,
      patterns: behaviorAnalysis.detectedPatterns,
      savannahMood: this.currentState.mood,
      significance: Math.abs(behaviorAnalysis.emotionalImpact)
    };

    relationship.memoryBank.push(memory);

    // Keep only the most significant memories (max 20)
    if (relationship.memoryBank.length > 20) {
      relationship.memoryBank.sort((a, b) => b.significance - a.significance);
      relationship.memoryBank = relationship.memoryBank.slice(0, 20);
    }
  }

  /**
   * Update conversation quality metrics
   */
  updateConversationQuality(message, emotionalAnalysis) {
    const engagement = (message.match(/\?/g) || []).length > 0 ? 0.3 : 0;
    const enthusiasm = (message.match(/!/g) || []).length > 0 ? 0.2 : 0;
    const length = message.length > 50 ? 0.2 : message.length > 20 ? 0.1 : 0;
    
    const qualityIncrease = engagement + enthusiasm + length;
    this.currentSession.conversationQuality = this.clamp(
      this.currentSession.conversationQuality + qualityIncrease,
      0, 1
    );
  }

  /**
   * Process natural mood decay and recovery
   */
  processNaturalMoodDecay() {
    const timeSinceLastInteraction = Date.now() - this.currentState.lastMoodChange;
    const decayRate = 0.02; // Small natural recovery

    // Natural mood stabilization toward neutral (unless deeply hurt)
    const currentMoodValue = this.getMoodValue(this.currentState.mood);
    
    if (Math.abs(currentMoodValue) > 0.1) {
      const decay = currentMoodValue > 0 ? -decayRate : decayRate;
      const newMoodValue = currentMoodValue + decay;
      this.currentState.mood = this.getMoodFromValue(newMoodValue);
    }

    // Stress natural reduction
    this.currentState.stress = Math.max(0.1, this.currentState.stress - 0.01);

    // Mood stability recovery
    if (this.currentState.moodStability < 0.7) {
      this.currentState.moodStability = Math.min(0.7, this.currentState.moodStability + 0.02);
    }

    // Loneliness increases over time without interaction
    if (timeSinceLastInteraction > 300000) { // 5 minutes
      this.currentState.loneliness = Math.min(1, this.currentState.loneliness + 0.1);
    }
  }

  /**
   * Track neglect time and emotional impact
   */
  updateNeglectTime() {
    if (this.currentSession.patronId) {
      this.currentSession.neglectTime += 5000; // 5 seconds

      // Emotional impact of being neglected
      if (this.currentSession.neglectTime > 30000) { // 30 seconds
        this.currentState.attention = Math.max(0.3, this.currentState.attention - 0.02);
        
        if (this.currentSession.neglectTime > 120000) { // 2 minutes
          this.currentState.mood = this.getMoodFromValue(
            Math.max(-0.5, this.getMoodValue(this.currentState.mood) - 0.05)
          );
        }
      }
    }
  }

  /**
   * Update service quality modifiers based on emotional state
   */
  updateServiceModifiers() {
    const moodValue = this.getMoodValue(this.currentState.mood);
    const energyLevel = this.currentState.energy;
    const stressLevel = this.currentState.stress;
    const attentionLevel = this.currentState.attention;

    // Positive emotions improve service
    if (moodValue > 0) {
      this.serviceModifiers.warmth = 1 + (moodValue * 0.5);
      this.serviceModifiers.creativity = 1 + (moodValue * 0.3);
      this.serviceModifiers.storytelling = 1 + (moodValue * 0.4);
      this.serviceModifiers.conversation_depth = 1 + (moodValue * 0.3);
    } else {
      // Negative emotions reduce service quality
      this.serviceModifiers.warmth = Math.max(0.5, 1 + (moodValue * 0.7));
      this.serviceModifiers.patience = Math.max(0.4, 1 + (moodValue * 0.6));
      this.serviceModifiers.storytelling = Math.max(0.3, 1 + (moodValue * 0.5));
      this.serviceModifiers.conversation_depth = Math.max(0.4, 1 + (moodValue * 0.4));
    }

    // Energy affects responsiveness and enthusiasm
    this.serviceModifiers.attentiveness = 0.5 + (energyLevel * 0.5) + (attentionLevel * 0.3);
    this.serviceModifiers.recommendation_quality = 0.6 + (energyLevel * 0.4);

    // Stress reduces performance
    this.serviceModifiers.patience = Math.max(0.3, this.serviceModifiers.patience - (stressLevel * 0.4));
    this.serviceModifiers.attentiveness = Math.max(0.4, this.serviceModifiers.attentiveness - (stressLevel * 0.3));

    // Relationship affects service
    if (this.currentSession.patronId) {
      const relationship = this.getPatronRelationship(this.currentSession.patronId);
      const relationshipBonus = Math.max(0, relationship.relationshipLevel) * 0.3;
      
      Object.keys(this.serviceModifiers).forEach(key => {
        this.serviceModifiers[key] = Math.min(1.5, this.serviceModifiers[key] + relationshipBonus);
      });

      // Special bonuses for favorite patrons
      if (relationship.specialStatus === 'favorite') {
        this.serviceModifiers.memory_recall = 1.3;
        this.serviceModifiers.attention = 1.4;
        this.serviceModifiers.warmth = Math.min(1.5, this.serviceModifiers.warmth + 0.2);
      }

      // Penalties for problematic patrons
      if (relationship.specialStatus === 'problematic') {
        Object.keys(this.serviceModifiers).forEach(key => {
          this.serviceModifiers[key] = Math.max(0.4, this.serviceModifiers[key] - 0.3);
        });
      }
    }
  }

  /**
   * Generate emotional response based on current state
   */
  generateEmotionalResponse(messageType = 'general') {
    const relationship = this.currentSession.patronId ? 
      this.getPatronRelationship(this.currentSession.patronId) : null;

    const emotionalContext = {
      mood: this.currentState.mood,
      energy: this.currentState.energy,
      warmth: this.serviceModifiers.warmth,
      attention: this.currentState.attention,
      relationshipLevel: relationship?.relationshipLevel || 0,
      specialStatus: relationship?.specialStatus || 'new',
      conversationStyle: this.determineConversationStyle(),
      emotionalCues: this.generateEmotionalCues(),
      serviceModifiers: { ...this.serviceModifiers },
      contextualHints: this.generateContextualHints(messageType)
    };

    return emotionalContext;
  }

  /**
   * Determine conversation style based on emotional state and relationship
   */
  determineConversationStyle() {
    const moodValue = this.getMoodValue(this.currentState.mood);
    const relationship = this.currentSession.patronId ? 
      this.getPatronRelationship(this.currentSession.patronId) : null;

    let style = {
      warmth: this.serviceModifiers.warmth,
      formality: 0.6, // Base formality
      playfulness: 0.4,
      directness: 0.5,
      storytelling: this.serviceModifiers.storytelling,
      flirtation: 0.2
    };

    // Adjust based on mood
    if (moodValue > 0.5) {
      style.playfulness += 0.3;
      style.flirtation += 0.2;
      style.formality -= 0.2;
    } else if (moodValue < -0.3) {
      style.formality += 0.2;
      style.directness += 0.3;
      style.playfulness -= 0.3;
      style.flirtation -= 0.4;
    }

    // Adjust based on relationship
    if (relationship) {
      if (relationship.specialStatus === 'favorite') {
        style.warmth += 0.3;
        style.playfulness += 0.2;
        style.formality -= 0.3;
      } else if (relationship.specialStatus === 'problematic') {
        style.formality += 0.4;
        style.directness += 0.3;
        style.warmth -= 0.3;
        style.playfulness -= 0.4;
      }

      if (relationship.attractionLevel > 0.5) {
        style.flirtation = Math.min(0.7, style.flirtation + 0.3);
      }
    }

    // Clamp values
    Object.keys(style).forEach(key => {
      style[key] = this.clamp(style[key], 0, 1);
    });

    return style;
  }

  /**
   * Generate emotional cues for response generation
   */
  generateEmotionalCues() {
    const cues = [];

    // Mood-based cues
    switch (this.currentState.mood) {
      case 'hurt':
        cues.push('wounded', 'guarded', 'disappointed');
        break;
      case 'annoyed':
        cues.push('irritated', 'impatient', 'terse');
        break;
      case 'content':
        cues.push('satisfied', 'peaceful', 'steady');
        break;
      case 'happy':
        cues.push('cheerful', 'bright', 'engaging');
        break;
      case 'excited':
        cues.push('energetic', 'enthusiastic', 'animated');
        break;
      case 'playful':
        cues.push('teasing', 'flirtatious', 'fun');
        break;
    }

    // State-based cues
    if (this.currentState.stress > 0.6) {
      cues.push('stressed', 'overwhelmed');
    }

    if (this.currentState.attention < 0.5) {
      cues.push('distracted', 'disinterested');
    }

    if (this.currentState.loneliness > 0.6) {
      cues.push('lonely', 'seeking_connection');
    }

    if (this.currentSession.neglectTime > 60000) {
      cues.push('neglected', 'attention_seeking');
    }

    return cues;
  }

  /**
   * Generate contextual hints for response generation
   */
  generateContextualHints(messageType) {
    const hints = {
      suggest_recovery: false,
      show_vulnerability: false,
      display_expertise: false,
      seek_validation: false,
      offer_story: false,
      show_appreciation: false,
      maintain_boundaries: false,
      express_frustration: false
    };

    const relationship = this.currentSession.patronId ? 
      this.getPatronRelationship(this.currentSession.patronId) : null;

    // Recovery suggestions for damaged relationships
    if (relationship && relationship.relationshipLevel < -0.3) {
      hints.suggest_recovery = true;
      hints.maintain_boundaries = true;
    }

    // Show vulnerability when hurt but not deeply damaged
    if (this.currentState.mood === 'hurt' && this.currentState.emotionalMomentum > -0.7) {
      hints.show_vulnerability = true;
    }

    // Display expertise when confident and happy
    if (this.getMoodValue(this.currentState.mood) > 0.3 && this.currentState.energy > 0.6) {
      hints.display_expertise = true;
      hints.offer_story = true;
    }

    // Seek validation when feeling unappreciated
    if (this.currentSession.appreciationShown < 0.2 && this.currentSession.interactionCount > 3) {
      hints.seek_validation = true;
    }

    // Express frustration when consistently mistreated
    if (this.currentSession.rudenessLevel > 0.5) {
      hints.express_frustration = true;
      hints.maintain_boundaries = true;
    }

    return hints;
  }

  /**
   * Attempt relationship recovery
   */
  attemptRecovery(patronId, recoveryType, intensity = 0.5) {
    const relationship = this.getPatronRelationship(patronId);
    const recoveryValue = this.recoveryPaths[recoveryType] || 0.3;
    
    const actualRecovery = recoveryValue * intensity;
    relationship.relationshipLevel += actualRecovery;
    relationship.recoveryAttempts++;

    // Recovery is less effective each time
    const effectivenessReduction = Math.min(0.5, relationship.recoveryAttempts * 0.1);
    relationship.relationshipLevel -= effectivenessReduction;

    // Update emotional state
    const moodImprovement = actualRecovery * 0.5;
    this.updateMood(moodImprovement);

    this.addToMemoryBank(relationship, {
      emotionalImpact: actualRecovery,
      detectedPatterns: [{ category: 'recovery', matches: [recoveryType], impact: actualRecovery }]
    }, { conversationCues: ['recovery_attempt'] });

    return {
      success: actualRecovery > 0.2,
      newRelationshipLevel: relationship.relationshipLevel,
      newMood: this.currentState.mood,
      effectivenessReduction
    };
  }

  /**
   * Get current emotional context for response generation
   */
  getCurrentEmotionalContext() {
    return {
      currentState: { ...this.currentState },
      serviceModifiers: { ...this.serviceModifiers },
      conversationStyle: this.determineConversationStyle(),
      emotionalCues: this.generateEmotionalCues(),
      session: { ...this.currentSession },
      relationship: this.currentSession.patronId ? 
        this.getPatronRelationship(this.currentSession.patronId) : null,
      contextualHints: this.generateContextualHints('general'),
      timestamp: Date.now()
    };
  }

  /**
   * Adjust initial mood when starting session based on relationship history
   */
  adjustInitialMoodForRelationship(relationship) {
    // Set initial mood based on how patron has treated Savannah historically
    if (relationship.specialStatus === 'favorite') {
      this.currentState.mood = 'happy';
      this.currentState.energy = Math.min(1, this.currentState.energy + 0.2);
      this.currentState.attention = 1.0;
    } else if (relationship.specialStatus === 'problematic') {
      this.currentState.mood = 'annoyed';
      this.currentState.attention = Math.max(0.3, this.currentState.attention - 0.3);
      this.currentState.stress = Math.min(1, this.currentState.stress + 0.3);
    } else if (relationship.relationshipLevel > 0.5) {
      this.currentState.mood = 'content';
      this.currentState.energy = Math.min(1, this.currentState.energy + 0.1);
    }

    // Recent negative interactions affect initial mood
    const recentConflicts = relationship.conflictHistory.filter(
      conflict => Date.now() - conflict.timestamp < 86400000 // Last 24 hours
    );
    
    if (recentConflicts.length > 0) {
      const totalSeverity = recentConflicts.reduce((sum, conflict) => sum + conflict.severity, 0);
      this.updateMood(-totalSeverity * 0.3);
      this.currentState.moodStability = Math.max(0.3, this.currentState.moodStability - 0.2);
    }
  }

  /**
   * End current session and update relationship
   */
  endSession(tipAmount = 0, explicitFeedback = null) {
    if (!this.currentSession.patronId) return null;

    const relationship = this.getPatronRelationship(this.currentSession.patronId);
    const sessionDuration = Date.now() - this.currentSession.sessionStart;
    
    // Update relationship with session data
    relationship.totalTimeSpent += sessionDuration;
    relationship.averageSessionLength = relationship.totalTimeSpent / relationship.totalInteractions;
    
    // Process tip if given
    if (tipAmount > 0) {
      relationship.tipHistory.push({
        amount: tipAmount,
        timestamp: Date.now(),
        sessionQuality: this.currentSession.conversationQuality
      });
      
      // Tip appreciation affects relationship and mood
      const tipAppreciation = Math.min(0.4, tipAmount * 0.1);
      relationship.relationshipLevel += tipAppreciation;
      this.updateMood(tipAppreciation);
    }

    // Process explicit feedback
    if (explicitFeedback) {
      const feedbackAnalysis = this.analyzeBehaviorPatterns(explicitFeedback);
      this.updateRelationship(relationship, feedbackAnalysis, {});
    }

    // Create session summary
    const sessionSummary = {
      patronId: this.currentSession.patronId,
      duration: sessionDuration,
      interactionCount: this.currentSession.interactionCount,
      conversationQuality: this.currentSession.conversationQuality,
      appreciationShown: this.currentSession.appreciationShown,
      rudenessLevel: this.currentSession.rudenessLevel,
      emotionalConnection: this.currentSession.emotionalConnection,
      finalMood: this.currentState.mood,
      finalRelationshipLevel: relationship.relationshipLevel,
      tipAmount,
      timestamp: Date.now()
    };

    // Add to relationship history if significant
    if (sessionDuration > 60000 || this.currentSession.emotionalConnection > 0.6) {
      relationship.favoriteInteractions.push(sessionSummary);
    }

    // Reset session
    this.currentSession = {
      patronId: null,
      sessionStart: null,
      interactionCount: 0,
      attentionGiven: 0,
      neglectTime: 0,
      appreciationShown: 0,
      rudenessLevel: 0,
      flirtationLevel: 0,
      tipExpectation: 0.5,
      conversationQuality: 0.5,
      emotionalConnection: 0.3
    };

    return sessionSummary;
  }

  /**
   * Utility function to clamp values between min and max
   */
  clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  /**
   * Get relationship summary for a patron
   */
  getRelationshipSummary(patronId) {
    const relationship = this.getPatronRelationship(patronId);
    return {
      specialStatus: relationship.specialStatus,
      relationshipLevel: relationship.relationshipLevel,
      trustLevel: relationship.trustLevel,
      respectLevel: relationship.respectLevel,
      totalInteractions: relationship.totalInteractions,
      averageSessionLength: relationship.averageSessionLength,
      significantMemories: relationship.memoryBank.filter(m => m.significance > 0.6),
      recentConflicts: relationship.conflictHistory.filter(
        c => Date.now() - c.timestamp < 86400000
      ),
      recoveryNeeded: relationship.relationshipLevel < -0.2,
      favoriteInteractions: relationship.favoriteInteractions.length
    };
  }

  /**
   * Export emotional state for persistence
   */
  exportState() {
    return {
      currentState: this.currentState,
      patronRelationships: Array.from(this.patronRelationships.entries()),
      currentSession: this.currentSession,
      timestamp: Date.now()
    };
  }

  /**
   * Import emotional state from persistence
   */
  importState(stateData) {
    if (stateData.currentState) {
      this.currentState = { ...this.currentState, ...stateData.currentState };
    }
    
    if (stateData.patronRelationships) {
      this.patronRelationships = new Map(stateData.patronRelationships);
    }
    
    if (stateData.currentSession) {
      this.currentSession = { ...this.currentSession, ...stateData.currentSession };
    }
    
    this.updateServiceModifiers();
  }
}

export default SavannahEmotionalEngine;