/**
 * Patron Engagement Mechanics
 * 
 * Defines the specific mechanics for how patrons can earn Savannah's favor,
 * lose her trust, and recover relationships. This creates the gamification
 * layer that makes interactions meaningful and encourages positive behavior.
 */

export class PatronEngagementMechanics {
  constructor(emotionalEngine) {
    this.emotionalEngine = emotionalEngine;
    
    // Engagement scoring system
    this.engagementMetrics = {
      // Positive actions and their point values
      appreciation: {
        genuine_thanks: 10,
        specific_compliment: 15,
        remembering_details: 20,
        defending_savannah: 25,
        thoughtful_question: 12,
        patience_during_busy: 18,
        understanding_rules: 15,
        appropriate_tip: 20
      },
      
      // Relationship building actions
      relationship_building: {
        asking_about_her_day: 15,
        showing_interest_in_stories: 20,
        remembering_previous_conversation: 25,
        asking_for_advice: 18,
        sharing_personal_story: 20,
        appropriate_flirtation: 12,
        respecting_boundaries: 15,
        regular_visits: 10
      },
      
      // Professional respect
      professional_respect: {
        trusting_recommendations: 15,
        asking_about_expertise: 20,
        acknowledging_skill: 18,
        patience_with_explanations: 12,
        following_bar_etiquette: 10,
        respecting_other_patrons: 15,
        understanding_busy_times: 12
      },
      
      // Negative actions and their penalty values
      disrespect: {
        being_rude: -25,
        interrupting: -15,
        dismissing_recommendations: -20,
        demanding_behavior: -30,
        inappropriate_comments: -35,
        ignoring_her_responses: -20,
        being_impatient: -15,
        treating_like_servant: -40
      },
      
      // Relationship damage
      relationship_damage: {
        breaking_promises: -30,
        lying: -35,
        disrespecting_boundaries: -40,
        insulting_appearance: -45,
        questioning_competence: -25,
        making_her_uncomfortable: -35,
        public_embarrassment: -50,
        harassment: -100
      },
      
      // Professional disrespect
      professional_disrespect: {
        questioning_knowledge: -20,
        demanding_unauthorized_items: -25,
        complaining_about_prices: -15,
        causing_disturbance: -30,
        disrespecting_establishment: -35,
        threatening_bad_review: -40,
        demanding_manager: -25
      }
    };

    // Favor earning thresholds and rewards
    this.favorLevels = {
      stranger: { threshold: 0, benefits: [] },
      recognized: { threshold: 50, benefits: ['remembers_name', 'basic_small_talk'] },
      regular: { threshold: 150, benefits: ['drink_preferences', 'shares_stories', 'faster_service'] },
      valued: { threshold: 300, benefits: ['personal_recommendations', 'insider_knowledge', 'priority_service'] },
      favorite: { threshold: 500, benefits: ['special_drinks', 'personal_stories', 'flexible_rules', 'emotional_support'] },
      beloved: { threshold: 800, benefits: ['exclusive_access', 'deep_friendship', 'maximum_flexibility', 'protective_loyalty'] }
    };

    // Recovery mechanisms and their effectiveness
    this.recoveryMechanics = {
      // Immediate recovery actions
      immediate: {
        sincere_apology: {
          effectiveness: 0.4,
          requirements: ['acknowledgment_of_wrong', 'no_excuses', 'genuine_remorse'],
          cooldown: 0
        },
        grand_gesture: {
          effectiveness: 0.6,
          requirements: ['significant_effort', 'personal_meaning', 'not_just_money'],
          cooldown: 86400000 // 24 hours
        },
        defending_her: {
          effectiveness: 0.8,
          requirements: ['public_support', 'against_criticism', 'without_prompting'],
          cooldown: 0
        }
      },
      
      // Long-term recovery strategies
      longterm: {
        consistent_kindness: {
          effectiveness: 0.1, // Per interaction
          requirements: ['multiple_positive_interactions', 'no_negative_behavior'],
          minimum_interactions: 10
        },
        proving_change: {
          effectiveness: 0.3,
          requirements: ['demonstrated_different_behavior', 'sustained_effort'],
          minimum_time: 604800000 // 7 days
        },
        earning_trust: {
          effectiveness: 0.5,
          requirements: ['reliability', 'consistency', 'respect_for_boundaries'],
          minimum_time: 1209600000 // 14 days
        }
      },
      
      // Special recovery scenarios
      special: {
        heartfelt_letter: {
          effectiveness: 0.7,
          requirements: ['written_thoughtfully', 'acknowledges_impact', 'specific_memories'],
          cooldown: 2592000000 // 30 days
        },
        meaningful_gift: {
          effectiveness: 0.5,
          requirements: ['personal_significance', 'shows_understanding', 'not_expensive'],
          cooldown: 1209600000 // 14 days
        },
        public_recognition: {
          effectiveness: 0.8,
          requirements: ['public_praise', 'acknowledges_skill', 'not_prompted'],
          cooldown: 604800000 // 7 days
        }
      }
    };

    // Escalation patterns for both positive and negative relationships
    this.escalationPatterns = {
      positive: {
        mild_interest: {
          triggers: ['consistent_politeness', 'basic_appreciation'],
          behaviors: ['remembers_face', 'friendly_greetings'],
          next_level: 'growing_fondness'
        },
        growing_fondness: {
          triggers: ['genuine_conversations', 'shows_interest_in_her'],
          behaviors: ['shares_stories', 'personal_recommendations'],
          next_level: 'strong_liking'
        },
        strong_liking: {
          triggers: ['emotional_support', 'defends_her', 'deep_conversations'],
          behaviors: ['confides_in_patron', 'special_treatment', 'emotional_openness'],
          next_level: 'deep_affection'
        },
        deep_affection: {
          triggers: ['consistent_support', 'genuine_friendship', 'mutual_respect'],
          behaviors: ['complete_trust', 'maximum_flexibility', 'protective_loyalty'],
          next_level: 'unshakeable_bond'
        }
      },
      
      negative: {
        mild_annoyance: {
          triggers: ['occasional_rudeness', 'minor_disrespect'],
          behaviors: ['shorter_responses', 'less_enthusiasm'],
          next_level: 'growing_irritation'
        },
        growing_irritation: {
          triggers: ['repeated_rudeness', 'dismissive_behavior'],
          behaviors: ['cold_politeness', 'minimal_service'],
          next_level: 'strong_dislike'
        },
        strong_dislike: {
          triggers: ['major_disrespect', 'personal_attacks'],
          behaviors: ['barely_professional', 'refuses_extras'],
          next_level: 'active_avoidance'
        },
        active_avoidance: {
          triggers: ['harassment', 'severe_disrespect', 'threats'],
          behaviors: ['requests_other_staff', 'reports_behavior', 'refuses_service'],
          next_level: 'permanent_ban'
        }
      }
    };

    // Behavioral consequences matrix
    this.behavioralConsequences = {
      service_quality: {
        excellent: {
          response_time: 0.5, // Multiplier for response speed
          recommendation_quality: 1.5,
          conversation_depth: 1.4,
          flexibility: 1.3,
          attention_level: 1.5
        },
        good: {
          response_time: 0.8,
          recommendation_quality: 1.2,
          conversation_depth: 1.1,
          flexibility: 1.1,
          attention_level: 1.2
        },
        standard: {
          response_time: 1.0,
          recommendation_quality: 1.0,
          conversation_depth: 1.0,
          flexibility: 1.0,
          attention_level: 1.0
        },
        poor: {
          response_time: 1.5,
          recommendation_quality: 0.7,
          conversation_depth: 0.6,
          flexibility: 0.7,
          attention_level: 0.6
        },
        minimal: {
          response_time: 2.0,
          recommendation_quality: 0.4,
          conversation_depth: 0.3,
          flexibility: 0.4,
          attention_level: 0.3
        }
      },
      
      emotional_availability: {
        open: ['shares_feelings', 'seeks_advice', 'shows_vulnerability'],
        guarded: ['polite_but_distant', 'professional_only', 'limited_personal_sharing'],
        closed: ['strictly_business', 'minimal_interaction', 'cold_politeness'],
        hostile: ['barely_civil', 'defensive', 'actively_unfriendly']
      },
      
      special_privileges: {
        favorite_treatment: ['custom_drinks', 'after_hours_chat', 'personal_stories', 'flexible_rules'],
        valued_patron: ['priority_service', 'insider_knowledge', 'special_recommendations'],
        regular_service: ['standard_service', 'friendly_interaction', 'basic_recommendations'],
        problematic_patron: ['minimal_service', 'strict_rules', 'limited_interaction']
      }
    };

    // Challenge and accessibility balance
    this.balanceSettings = {
      // How difficult it is to earn favor
      favor_difficulty: {
        easy: { point_multiplier: 1.5, forgiveness: 0.8 },
        normal: { point_multiplier: 1.0, forgiveness: 0.6 },
        hard: { point_multiplier: 0.7, forgiveness: 0.4 },
        realistic: { point_multiplier: 0.8, forgiveness: 0.5 }
      },
      
      // How quickly relationships can be damaged
      damage_sensitivity: {
        low: { damage_multiplier: 0.5, recovery_bonus: 1.5 },
        normal: { damage_multiplier: 1.0, recovery_bonus: 1.0 },
        high: { damage_multiplier: 1.5, recovery_bonus: 0.7 },
        realistic: { damage_multiplier: 1.2, recovery_bonus: 0.8 }
      },
      
      // Memory and forgiveness settings
      memory_settings: {
        forgiving: { negative_decay: 0.9, positive_retention: 0.98 },
        normal: { negative_decay: 0.95, positive_retention: 0.95 },
        grudge_holder: { negative_decay: 0.98, positive_retention: 0.92 },
        realistic: { negative_decay: 0.96, positive_retention: 0.94 }
      }
    };

    // Current balance configuration (can be adjusted)
    this.currentBalance = {
      favor_difficulty: 'realistic',
      damage_sensitivity: 'realistic',
      memory_settings: 'realistic'
    };
  }

  /**
   * Process patron action and calculate engagement impact
   */
  processPatronAction(action, context = {}) {
    const patronId = this.emotionalEngine.currentSession.patronId;
    if (!patronId) {
      throw new Error('No active patron session');
    }

    const relationship = this.emotionalEngine.getPatronRelationship(patronId);
    const result = {
      action,
      pointsEarned: 0,
      relationshipChange: 0,
      favorLevelChanged: false,
      previousLevel: this.getFavorLevel(relationship.relationshipLevel),
      newLevel: null,
      consequences: [],
      emotionalImpact: null
    };

    // Calculate base points for the action
    const basePoints = this.calculateActionPoints(action, context);
    
    // Apply difficulty modifiers
    const difficultySettings = this.balanceSettings.favor_difficulty[this.currentBalance.favor_difficulty];
    const damageSettings = this.balanceSettings.damage_sensitivity[this.currentBalance.damage_sensitivity];
    
    let adjustedPoints = basePoints;
    if (basePoints > 0) {
      adjustedPoints *= difficultySettings.point_multiplier;
    } else {
      adjustedPoints *= damageSettings.damage_multiplier;
    }

    // Apply relationship context modifiers
    adjustedPoints = this.applyRelationshipModifiers(adjustedPoints, relationship, action);

    // Update relationship
    const oldRelationshipLevel = relationship.relationshipLevel;
    relationship.relationshipLevel += adjustedPoints / 100; // Convert points to relationship level
    relationship.relationshipLevel = Math.max(-2, Math.min(2, relationship.relationshipLevel));

    // Update engagement points
    if (!relationship.engagementPoints) relationship.engagementPoints = 0;
    relationship.engagementPoints = Math.max(0, relationship.engagementPoints + adjustedPoints);

    // Check for favor level changes
    const newFavorLevel = this.getFavorLevel(relationship.engagementPoints);
    if (newFavorLevel !== result.previousLevel) {
      result.favorLevelChanged = true;
      result.newLevel = newFavorLevel;
      this.grantFavorBenefits(relationship, newFavorLevel);
    }

    // Calculate behavioral consequences
    const consequences = this.calculateBehavioralConsequences(relationship, action, context);
    result.consequences = consequences;

    // Update emotional engine
    const emotionalImpact = this.convertToEmotionalImpact(action, adjustedPoints, context);
    this.emotionalEngine.updateEmotionalState(emotionalImpact, {});

    result.pointsEarned = adjustedPoints;
    result.relationshipChange = relationship.relationshipLevel - oldRelationshipLevel;
    result.emotionalImpact = emotionalImpact;
    result.newLevel = this.getFavorLevel(relationship.engagementPoints);

    // Log significant changes
    if (Math.abs(adjustedPoints) > 20 || result.favorLevelChanged) {
      this.logSignificantChange(patronId, action, result);
    }

    return result;
  }

  /**
   * Calculate base points for a patron action
   */
  calculateActionPoints(action, context) {
    // Check each category for the action
    for (const category of Object.keys(this.engagementMetrics)) {
      if (this.engagementMetrics[category][action]) {
        let points = this.engagementMetrics[category][action];
        
        // Apply context modifiers
        if (context.sincerity && context.sincerity > 0.8) {
          points *= 1.3; // Bonus for genuine sincerity
        }
        
        if (context.timing === 'perfect') {
          points *= 1.2; // Bonus for good timing
        }
        
        if (context.public === true && points > 0) {
          points *= 1.4; // Bonus for public positive actions
        }
        
        if (context.repeated === true) {
          points *= 0.7; // Diminishing returns for repeated actions
        }
        
        return points;
      }
    }
    
    // If action not found, try to categorize it
    return this.categorizeUnknownAction(action, context);
  }

  /**
   * Apply relationship context modifiers to points
   */
  applyRelationshipModifiers(points, relationship, action) {
    let modifiedPoints = points;
    
    // Existing relationship level affects point gain/loss
    if (points > 0) {
      // Positive actions are worth less if already at high relationship
      if (relationship.relationshipLevel > 1.5) {
        modifiedPoints *= 0.6;
      } else if (relationship.relationshipLevel > 1.0) {
        modifiedPoints *= 0.8;
      }
    } else {
      // Negative actions hurt more if relationship was good
      if (relationship.relationshipLevel > 1.0) {
        modifiedPoints *= 1.5;
      } else if (relationship.relationshipLevel > 0.5) {
        modifiedPoints *= 1.2;
      }
    }
    
    // Special status modifiers
    if (relationship.specialStatus === 'favorite' && points < 0) {
      modifiedPoints *= 1.8; // Betrayal hurts more from favorites
    }
    
    if (relationship.specialStatus === 'problematic' && points > 0) {
      modifiedPoints *= 1.3; // Positive actions worth more from problematic patrons
    }
    
    // Recent behavior pattern modifiers
    const recentActions = this.getRecentActions(relationship, 3600000); // Last hour
    const recentNegativeRatio = recentActions.filter(a => a.points < 0).length / Math.max(1, recentActions.length);
    
    if (recentNegativeRatio > 0.6 && points > 0) {
      modifiedPoints *= 1.4; // Bonus for positive action after negative streak
    }
    
    return modifiedPoints;
  }

  /**
   * Get recent actions for a relationship
   */
  getRecentActions(relationship, timeWindow) {
    if (!relationship.actionHistory) return [];
    
    const cutoff = Date.now() - timeWindow;
    return relationship.actionHistory.filter(action => action.timestamp > cutoff);
  }

  /**
   * Calculate behavioral consequences of actions
   */
  calculateBehavioralConsequences(relationship, action, context) {
    const consequences = [];
    const favorLevel = this.getFavorLevel(relationship.engagementPoints);
    const relationshipLevel = relationship.relationshipLevel;
    
    // Determine service quality level
    let serviceLevel = 'standard';
    if (relationshipLevel > 1.5 || favorLevel === 'beloved') {
      serviceLevel = 'excellent';
    } else if (relationshipLevel > 1.0 || favorLevel === 'favorite') {
      serviceLevel = 'good';
    } else if (relationshipLevel < -0.5) {
      serviceLevel = 'poor';
    } else if (relationshipLevel < -1.0) {
      serviceLevel = 'minimal';
    }
    
    // Apply service consequences
    const serviceConsequences = this.behavioralConsequences.service_quality[serviceLevel];
    consequences.push({
      type: 'service_quality',
      level: serviceLevel,
      modifiers: serviceConsequences
    });
    
    // Determine emotional availability
    let emotionalLevel = 'guarded';
    if (relationshipLevel > 1.2 && relationship.trustLevel > 0.8) {
      emotionalLevel = 'open';
    } else if (relationshipLevel < -0.8) {
      emotionalLevel = 'hostile';
    } else if (relationshipLevel < -0.3) {
      emotionalLevel = 'closed';
    }
    
    consequences.push({
      type: 'emotional_availability',
      level: emotionalLevel,
      behaviors: this.behavioralConsequences.emotional_availability[emotionalLevel]
    });
    
    // Special privileges based on favor level
    let privilegeLevel = 'regular_service';
    if (favorLevel === 'favorite' || favorLevel === 'beloved') {
      privilegeLevel = 'favorite_treatment';
    } else if (favorLevel === 'valued') {
      privilegeLevel = 'valued_patron';
    } else if (relationship.specialStatus === 'problematic') {
      privilegeLevel = 'problematic_patron';
    }
    
    consequences.push({
      type: 'special_privileges',
      level: privilegeLevel,
      privileges: this.behavioralConsequences.special_privileges[privilegeLevel]
    });
    
    return consequences;
  }

  /**
   * Convert action to emotional impact for the emotional engine
   */
  convertToEmotionalImpact(action, points, context) {
    const impact = {
      appreciation: 0,
      rudeness: 0,
      interest: 0,
      flirtation: 0,
      dismissiveness: 0,
      compliments: 0,
      detectedPatterns: [],
      emotionalImpact: points / 100 // Convert points to emotional scale
    };
    
    // Map actions to emotional categories
    if (this.engagementMetrics.appreciation[action]) {
      impact.appreciation = Math.abs(points) / 50;
      impact.detectedPatterns.push({
        category: 'appreciation',
        matches: [action],
        impact: impact.appreciation
      });
    } else if (this.engagementMetrics.disrespect[action]) {
      impact.rudeness = Math.abs(points) / 50;
      impact.detectedPatterns.push({
        category: 'rudeness',
        matches: [action],
        impact: -impact.rudeness
      });
    } else if (this.engagementMetrics.relationship_building[action]) {
      impact.interest = Math.abs(points) / 50;
      impact.detectedPatterns.push({
        category: 'interest',
        matches: [action],
        impact: impact.interest
      });
    }
    
    return impact;
  }

  /**
   * Get current favor level based on engagement points
   */
  getFavorLevel(engagementPoints) {
    const levels = Object.keys(this.favorLevels).reverse(); // Start from highest
    for (const level of levels) {
      if (engagementPoints >= this.favorLevels[level].threshold) {
        return level;
      }
    }
    return 'stranger';
  }

  /**
   * Grant benefits for reaching a new favor level
   */
  grantFavorBenefits(relationship, favorLevel) {
    const benefits = this.favorLevels[favorLevel].benefits;
    
    if (!relationship.unlockedBenefits) {
      relationship.unlockedBenefits = [];
    }
    
    benefits.forEach(benefit => {
      if (!relationship.unlockedBenefits.includes(benefit)) {
        relationship.unlockedBenefits.push(benefit);
      }
    });
    
    // Log the achievement
    if (!relationship.favorMilestones) {
      relationship.favorMilestones = [];
    }
    
    relationship.favorMilestones.push({
      level: favorLevel,
      timestamp: Date.now(),
      engagementPoints: relationship.engagementPoints
    });
  }

  /**
   * Attempt relationship recovery
   */
  attemptRecovery(patronId, recoveryType, context = {}) {
    const relationship = this.emotionalEngine.getPatronRelationship(patronId);
    const recoveryData = this.getRecoveryData(recoveryType);
    
    if (!recoveryData) {
      return { success: false, reason: 'Unknown recovery type' };
    }
    
    // Check requirements
    const requirementsMet = this.checkRecoveryRequirements(recoveryData, context, relationship);
    if (!requirementsMet.success) {
      return requirementsMet;
    }
    
    // Check cooldown
    if (this.isRecoveryOnCooldown(relationship, recoveryType, recoveryData)) {
      return { success: false, reason: 'Recovery method on cooldown' };
    }
    
    // Calculate effectiveness
    let effectiveness = recoveryData.effectiveness;
    
    // Reduce effectiveness based on previous recovery attempts
    const previousAttempts = relationship.recoveryHistory?.filter(r => r.type === recoveryType).length || 0;
    effectiveness *= Math.pow(0.8, previousAttempts); // Diminishing returns
    
    // Apply recovery
    const recoveryAmount = effectiveness * Math.abs(Math.min(0, relationship.relationshipLevel));
    relationship.relationshipLevel += recoveryAmount;
    
    // Log recovery attempt
    if (!relationship.recoveryHistory) {
      relationship.recoveryHistory = [];
    }
    
    relationship.recoveryHistory.push({
      type: recoveryType,
      timestamp: Date.now(),
      effectiveness,
      context,
      result: recoveryAmount
    });
    
    // Update emotional state
    const emotionalImpact = {
      appreciation: effectiveness * 0.8,
      emotionalImpact: effectiveness,
      detectedPatterns: [{
        category: 'recovery',
        matches: [recoveryType],
        impact: effectiveness
      }]
    };
    
    this.emotionalEngine.updateEmotionalState(emotionalImpact, {});
    
    return {
      success: true,
      recoveryAmount,
      newRelationshipLevel: relationship.relationshipLevel,
      effectivenessReduction: 1 - effectiveness / recoveryData.effectiveness
    };
  }

  /**
   * Get recovery data for a specific type
   */
  getRecoveryData(recoveryType) {
    for (const category of Object.keys(this.recoveryMechanics)) {
      if (this.recoveryMechanics[category][recoveryType]) {
        return this.recoveryMechanics[category][recoveryType];
      }
    }
    return null;
  }

  /**
   * Check if recovery requirements are met
   */
  checkRecoveryRequirements(recoveryData, context, relationship) {
    const requirements = recoveryData.requirements;
    
    for (const requirement of requirements) {
      switch (requirement) {
        case 'acknowledgment_of_wrong':
          if (!context.acknowledgesWrong) {
            return { success: false, reason: 'Must acknowledge wrongdoing' };
          }
          break;
        case 'no_excuses':
          if (context.makesExcuses) {
            return { success: false, reason: 'Cannot make excuses' };
          }
          break;
        case 'genuine_remorse':
          if (!context.showsRemorse || context.sincerity < 0.7) {
            return { success: false, reason: 'Must show genuine remorse' };
          }
          break;
        case 'significant_effort':
          if (!context.significantEffort) {
            return { success: false, reason: 'Must show significant effort' };
          }
          break;
        case 'multiple_positive_interactions':
          const recentPositive = this.getRecentActions(relationship, 86400000)
            .filter(a => a.points > 0);
          if (recentPositive.length < recoveryData.minimum_interactions) {
            return { success: false, reason: 'Need more positive interactions' };
          }
          break;
      }
    }
    
    return { success: true };
  }

  /**
   * Check if recovery method is on cooldown
   */
  isRecoveryOnCooldown(relationship, recoveryType, recoveryData) {
    if (!recoveryData.cooldown || !relationship.recoveryHistory) {
      return false;
    }
    
    const lastAttempt = relationship.recoveryHistory
      .filter(r => r.type === recoveryType)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    if (!lastAttempt) {
      return false;
    }
    
    return Date.now() - lastAttempt.timestamp < recoveryData.cooldown;
  }

  /**
   * Categorize unknown actions to assign points
   */
  categorizeUnknownAction(action, context) {
    // Use simple heuristics to categorize unknown actions
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('thank') || actionLower.includes('appreciate')) {
      return this.engagementMetrics.appreciation.genuine_thanks;
    }
    
    if (actionLower.includes('rude') || actionLower.includes('annoying')) {
      return this.engagementMetrics.disrespect.being_rude;
    }
    
    if (actionLower.includes('beautiful') || actionLower.includes('amazing')) {
      return this.engagementMetrics.appreciation.specific_compliment;
    }
    
    if (actionLower.includes('story') || actionLower.includes('tell me')) {
      return this.engagementMetrics.relationship_building.asking_about_her_day;
    }
    
    // Default to neutral
    return 0;
  }

  /**
   * Log significant relationship changes
   */
  logSignificantChange(patronId, action, result) {
    console.log(`Significant relationship change for patron ${patronId}:`, {
      action,
      pointsEarned: result.pointsEarned,
      relationshipChange: result.relationshipChange,
      favorLevelChanged: result.favorLevelChanged,
      newLevel: result.newLevel
    });
  }

  /**
   * Get engagement summary for a patron
   */
  getEngagementSummary(patronId) {
    const relationship = this.emotionalEngine.getPatronRelationship(patronId);
    const favorLevel = this.getFavorLevel(relationship.engagementPoints || 0);
    
    return {
      patronId,
      currentFavorLevel: favorLevel,
      engagementPoints: relationship.engagementPoints || 0,
      relationshipLevel: relationship.relationshipLevel,
      specialStatus: relationship.specialStatus,
      unlockedBenefits: relationship.unlockedBenefits || [],
      recentActions: this.getRecentActions(relationship, 86400000),
      recoveryNeeded: relationship.relationshipLevel < -0.3,
      availableRecoveryMethods: this.getAvailableRecoveryMethods(relationship),
      nextFavorThreshold: this.getNextFavorThreshold(relationship.engagementPoints || 0),
      favorProgress: this.getFavorProgress(relationship.engagementPoints || 0)
    };
  }

  /**
   * Get available recovery methods for a relationship
   */
  getAvailableRecoveryMethods(relationship) {
    const available = [];
    
    for (const category of Object.keys(this.recoveryMechanics)) {
      for (const method of Object.keys(this.recoveryMechanics[category])) {
        const recoveryData = this.recoveryMechanics[category][method];
        
        if (!this.isRecoveryOnCooldown(relationship, method, recoveryData)) {
          available.push({
            method,
            category,
            effectiveness: recoveryData.effectiveness,
            requirements: recoveryData.requirements
          });
        }
      }
    }
    
    return available;
  }

  /**
   * Get next favor level threshold
   */
  getNextFavorThreshold(currentPoints) {
    const levels = Object.keys(this.favorLevels);
    for (const level of levels) {
      const threshold = this.favorLevels[level].threshold;
      if (currentPoints < threshold) {
        return {
          level,
          threshold,
          pointsNeeded: threshold - currentPoints
        };
      }
    }
    return null; // Already at max level
  }

  /**
   * Get favor progress percentage
   */
  getFavorProgress(currentPoints) {
    const nextThreshold = this.getNextFavorThreshold(currentPoints);
    if (!nextThreshold) {
      return 100; // Max level
    }
    
    const currentLevel = this.getFavorLevel(currentPoints);
    const currentThreshold = this.favorLevels[currentLevel].threshold;
    const progress = (currentPoints - currentThreshold) / (nextThreshold.threshold - currentThreshold);
    
    return Math.max(0, Math.min(100, progress * 100));
  }

  /**
   * Adjust balance settings
   */
  adjustBalance(setting, value) {
    if (this.balanceSettings[setting] && this.balanceSettings[setting][value]) {
      this.currentBalance[setting] = value;
      return true;
    }
    return false;
  }

  /**
   * Export engagement data
   */
  exportEngagementData() {
    return {
      engagementMetrics: this.engagementMetrics,
      favorLevels: this.favorLevels,
      currentBalance: this.currentBalance,
      behavioralConsequences: this.behavioralConsequences
    };
  }
}

export default PatronEngagementMechanics;