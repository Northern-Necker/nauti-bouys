/**
 * Advanced Emotional Intelligence Engine for Enhanced IA System
 * Provides context-aware mood detection, adaptive conversation styling, and proactive suggestions
 */

export class AdvancedEmotionalIntelligence {
  constructor() {
    this.moodKeywords = {
      happy: ['happy', 'excited', 'great', 'awesome', 'fantastic', 'wonderful', 'cheerful', 'joy', 'celebrate'],
      sad: ['sad', 'down', 'upset', 'disappointed', 'blue', 'rough', 'tough', 'difficult', 'hard'],
      stressed: ['stressed', 'overwhelmed', 'busy', 'pressure', 'deadline', 'hectic', 'crazy', 'exhausted'],
      relaxed: ['relaxed', 'calm', 'peaceful', 'chill', 'easy', 'leisure', 'unwind', 'mellow'],
      romantic: ['date', 'anniversary', 'romantic', 'special', 'intimate', 'partner', 'love', 'valentine'],
      business: ['meeting', 'work', 'business', 'client', 'deal', 'negotiation', 'professional', 'conference'],
      social: ['friends', 'party', 'gathering', 'group', 'team', 'colleagues', 'celebration', 'toast'],
      disappointed: ['denied', 'rejected', 'declined', 'refused', 'no', 'not available', 'sorry'],
      curious: ['why', 'how', 'what', 'interested', 'learn', 'explain', 'tell me more'],
      appreciative: ['thank you', 'thanks', 'appreciate', 'grateful', 'wonderful', 'excellent', 'perfect']
    };

    this.energyIndicators = {
      high: ['energetic', 'pumped', 'ready', 'active', 'vibrant', 'lively', 'dynamic'],
      medium: ['good', 'fine', 'okay', 'normal', 'steady', 'balanced'],
      low: ['tired', 'exhausted', 'drained', 'sleepy', 'weary', 'worn out', 'beat']
    };

    this.conversationStyles = {
      formal: {
        greeting: "Good evening, welcome to Nauti-Bouys. How may I assist you this evening?",
        responseStyle: "professional",
        vocabulary: "elevated",
        storytelling: "historical"
      },
      casual: {
        greeting: "Hey there! Welcome to Nauti-Bouys. What can I get started for you?",
        responseStyle: "friendly",
        vocabulary: "conversational",
        storytelling: "personal"
      },
      playful: {
        greeting: "Ahoy there, sailor! Ready to set sail on a flavor adventure?",
        responseStyle: "enthusiastic",
        vocabulary: "maritime",
        storytelling: "adventurous"
      }
    };
  }

  /**
   * Analyzes conversation text for mood, energy, and context
   */
  analyzeMood(text, voiceMetrics = null) {
    let analysis = {
      primaryMood: 'neutral',
      confidence: 0,
      energyLevel: 'medium',
      context: 'casual',
      emotionalMarkers: [],
      conversationCues: []
    };

    const words = text.toLowerCase().split(/\s+/);
    const moodScores = {};

    // Analyze mood keywords
    Object.entries(this.moodKeywords).forEach(([mood, keywords]) => {
      const matches = words.filter(word => keywords.some(keyword => word.includes(keyword)));
      if (matches.length > 0) {
        moodScores[mood] = matches.length;
        analysis.emotionalMarkers.push(...matches);
      }
    });

    // Determine primary mood
    if (Object.keys(moodScores).length > 0) {
      analysis.primaryMood = Object.entries(moodScores)
        .sort(([,a], [,b]) => b - a)[0][0];
      analysis.confidence = Math.min(moodScores[analysis.primaryMood] * 0.3, 1);
    }

    // Analyze energy level
    Object.entries(this.energyIndicators).forEach(([energy, indicators]) => {
      const matches = words.filter(word => indicators.some(indicator => word.includes(indicator)));
      if (matches.length > 0) {
        analysis.energyLevel = energy;
      }
    });

    // Detect conversation context
    analysis.context = this.detectConversationContext(text);

    // Voice tone analysis integration
    if (voiceMetrics) {
      analysis = this.integrateVoiceAnalysis(analysis, voiceMetrics);
    }

    // Detect conversation patterns
    analysis.conversationCues = this.detectConversationPatterns(text);
    
    // Detect shelf-related emotions
    analysis.shelfContext = this.detectShelfEmotions(text);

    return analysis;
  }

  /**
   * Detects conversation context (business, romantic, casual, etc.)
   */
  detectConversationContext(text) {
    const contextScores = {};
    const words = text.toLowerCase().split(/\s+/);

    // Check for business context
    const businessWords = ['meeting', 'client', 'deal', 'work', 'business', 'professional'];
    const businessMatches = words.filter(word => businessWords.some(bw => word.includes(bw)));
    if (businessMatches.length > 0) contextScores.business = businessMatches.length;

    // Check for romantic context
    const romanticWords = ['date', 'anniversary', 'romantic', 'special someone', 'partner'];
    const romanticMatches = words.filter(word => romanticWords.some(rw => word.includes(rw)));
    if (romanticMatches.length > 0) contextScores.romantic = romanticMatches.length;

    // Check for celebration context
    const celebrationWords = ['celebrate', 'birthday', 'promotion', 'achievement', 'success'];
    const celebrationMatches = words.filter(word => celebrationWords.some(cw => word.includes(cw)));
    if (celebrationMatches.length > 0) contextScores.celebration = celebrationMatches.length;

    // Return highest scoring context or default to casual
    if (Object.keys(contextScores).length === 0) return 'casual';
    
    return Object.entries(contextScores)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  /**
   * Integrates voice analysis metrics for enhanced mood detection
   */
  integrateVoiceAnalysis(analysis, voiceMetrics) {
    const { pitch, speed, volume, clarity } = voiceMetrics;

    // Adjust confidence based on voice metrics
    if (pitch > 0.7) {
      analysis.confidence += 0.2; // High pitch often indicates excitement
      if (analysis.primaryMood === 'neutral') analysis.primaryMood = 'happy';
    }

    if (speed < 0.3) {
      analysis.energyLevel = 'low';
      if (analysis.primaryMood === 'neutral') analysis.primaryMood = 'relaxed';
    } else if (speed > 0.8) {
      analysis.energyLevel = 'high';
      if (analysis.primaryMood === 'neutral') analysis.primaryMood = 'excited';
    }

    if (volume < 0.3) {
      analysis.conversationCues.push('soft_spoken');
    }

    return analysis;
  }

  /**
   * Detects conversation patterns and engagement levels
   */
  detectConversationPatterns(text) {
    const patterns = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Check response length preference
    if (sentences.length > 3) {
      patterns.push('detailed_communicator');
    } else if (sentences.length === 1 && text.length < 20) {
      patterns.push('brief_communicator');
    }

    // Check for questions (indicates engagement)
    const questionCount = (text.match(/\?/g) || []).length;
    if (questionCount > 1) {
      patterns.push('highly_engaged');
    } else if (questionCount === 1) {
      patterns.push('moderately_engaged');
    }

    // Check for maritime interest
    const maritimeWords = ['ship', 'ocean', 'sea', 'sailing', 'captain', 'nautical', 'harbor'];
    const maritimeMatches = text.toLowerCase().split(/\s+/)
      .filter(word => maritimeWords.some(mw => word.includes(mw)));
    if (maritimeMatches.length > 0) {
      patterns.push('maritime_interested');
    }

    return patterns;
  }

  /**
   * Detects emotions specifically related to shelf requests and authorization
   */
  detectShelfEmotions(text) {
    const shelfContext = {
      hasShelfRequest: false,
      hasAuthorizationConcern: false,
      hasDisappointment: false,
      hasCuriosity: false,
      hasAppreciation: false,
      emotionalResponse: 'neutral'
    };
    
    const lowerText = text.toLowerCase();
    
    // Check for shelf requests
    const shelfIndicators = ['ultra shelf', 'top shelf', 'premium', 'best', 'finest', 'special', 'rare'];
    if (shelfIndicators.some(indicator => lowerText.includes(indicator))) {
      shelfContext.hasShelfRequest = true;
    }
    
    // Check for authorization-related language
    const authIndicators = ['permission', 'allowed', 'can i have', 'may i', 'authorization', 'captain'];
    if (authIndicators.some(indicator => lowerText.includes(indicator))) {
      shelfContext.hasAuthorizationConcern = true;
    }
    
    // Check for disappointment
    const disappointmentWords = ['disappointed', 'denied', 'sorry', 'unavailable', 'no', 'cant'];
    if (disappointmentWords.some(word => lowerText.includes(word))) {
      shelfContext.hasDisappointment = true;
      shelfContext.emotionalResponse = 'disappointed';
    }
    
    // Check for curiosity about shelf system
    const curiosityWords = ['why', 'how', 'explain', 'understand', 'what', 'curious'];
    if (curiosityWords.some(word => lowerText.includes(word))) {
      shelfContext.hasCuriosity = true;
      if (shelfContext.emotionalResponse === 'neutral') {
        shelfContext.emotionalResponse = 'curious';
      }
    }
    
    // Check for appreciation
    const appreciationWords = ['understand', 'makes sense', 'thank you', 'appreciate', 'good to know'];
    if (appreciationWords.some(word => lowerText.includes(word))) {
      shelfContext.hasAppreciation = true;
      shelfContext.emotionalResponse = 'appreciative';
    }
    
    return shelfContext;
  }

  /**
   * Adapts conversation style based on patron's communication patterns
   */
  adaptConversationStyle(patronMessage, emotionalAnalysis) {
    const { primaryMood, energyLevel, context, conversationCues } = emotionalAnalysis;
    
    let style = 'casual'; // default

    // Determine base style from context
    if (context === 'business') style = 'formal';
    else if (context === 'romantic') style = 'casual';
    else if (conversationCues.includes('maritime_interested')) style = 'playful';

    // Adjust based on patron's communication style
    if (conversationCues.includes('brief_communicator')) {
      style = 'casual'; // Keep responses concise
    } else if (conversationCues.includes('detailed_communicator')) {
      style = 'formal'; // More elaborate responses
    }

    return {
      ...this.conversationStyles[style],
      adaptedFor: {
        mood: primaryMood,
        energy: energyLevel,
        context: context,
        responseLength: conversationCues.includes('brief_communicator') ? 'short' : 'medium'
      }
    };
  }

  /**
   * Generates proactive suggestions based on mood, time, and context
   */
  generateProactiveSuggestions(emotionalAnalysis, timeOfDay, conversationHistory = []) {
    const { primaryMood, energyLevel, context } = emotionalAnalysis;
    const suggestions = {
      drinks: [],
      conversationTopics: [],
      maritimeStories: [],
      actions: []
    };

    // Time-based drink recommendations
    const hour = new Date().getHours();
    if (hour < 17) { // Before 5 PM
      suggestions.drinks.push('Light aperitifs', 'Coffee cocktails', 'Refreshing mocktails');
    } else if (hour < 20) { // Early evening
      suggestions.drinks.push('Classic cocktails', 'Wine selections', 'Signature drinks');
    } else { // Late evening
      suggestions.drinks.push('Premium spirits', 'Digestifs', 'Nightcaps');
    }

    // Mood-based recommendations
    switch (primaryMood) {
      case 'happy':
        suggestions.drinks.push('Celebratory champagne', 'Fruity cocktails', 'Festive punches');
        suggestions.conversationTopics.push('Recent achievements', 'Travel plans', 'Favorite memories');
        break;
      case 'stressed':
        suggestions.drinks.push('Calming herbal teas', 'Smooth whiskeys', 'Relaxing wines');
        suggestions.conversationTopics.push('Stress relief', 'Hobbies', 'Peaceful places');
        break;
      case 'romantic':
        suggestions.drinks.push('Wine pairings', 'Intimate cocktails', 'Shared appetizers');
        suggestions.conversationTopics.push('Local romantic spots', 'Special occasions', 'Favorite date ideas');
        break;
      case 'disappointed':
        suggestions.drinks.push('Comfort cocktails', 'Familiar favorites', 'Smooth alternatives');
        suggestions.conversationTopics.push('Alternative options', 'Understanding preferences', 'Future opportunities');
        suggestions.actions.push('offer_alternative', 'provide_education', 'empathetic_response');
        break;
      case 'curious':
        suggestions.drinks.push('Educational tastings', 'Comparison samples', 'Story-rich spirits');
        suggestions.conversationTopics.push('Spirit education', 'Maritime traditions', 'Craft processes');
        suggestions.actions.push('offer_education', 'share_story', 'explain_differences');
        break;
      case 'appreciative':
        suggestions.drinks.push('Quality selections', 'Thoughtful pairings', 'Premium options');
        suggestions.conversationTopics.push('Quality appreciation', 'Craft details', 'Tasting notes');
        suggestions.actions.push('acknowledge_understanding', 'offer_upgrade', 'share_expertise');
        break;
    }

    // Context-based adjustments
    if (context === 'business') {
      suggestions.drinks = suggestions.drinks.filter(drink => 
        !drink.includes('shots') && !drink.includes('party')
      );
      suggestions.conversationTopics.push('Industry trends', 'Professional networking', 'Business travel');
    }

    // Energy-based story selection
    if (energyLevel === 'high') {
      suggestions.maritimeStories.push('Adventure tales', 'Exciting discoveries', 'Thrilling rescues');
    } else if (energyLevel === 'low') {
      suggestions.maritimeStories.push('Peaceful harbor stories', 'Gentle sea tales', 'Calming ocean lore');
    }

    // Conversation lull detection
    if (conversationHistory.length > 3) {
      const recentMessages = conversationHistory.slice(-3);
      const avgLength = recentMessages.reduce((sum, msg) => sum + msg.length, 0) / 3;
      if (avgLength < 50) {
        suggestions.actions.push('offer_maritime_story', 'suggest_drink_pairing', 'ask_engaging_question');
      }
    }

    return suggestions;
  }

  /**
   * Builds a dynamic personality profile for Savannah based on interaction
   */
  buildPersonalityProfile(emotionalAnalysis, suggestions) {
    const { primaryMood, energyLevel, context, conversationCues } = emotionalAnalysis;
    
    const personality = {
      warmth: 0.8, // Base warmth level
      enthusiasm: 0.6, // Base enthusiasm
      formality: 0.3, // Base formality (casual by default)
      storytelling: 0.7, // Base storytelling inclination
      attentiveness: 0.8, // Base attentiveness
      maritimeTheme: 0.6 // Base maritime theme usage
    };

    // Adjust based on patron's mood
    if (primaryMood === 'happy') {
      personality.enthusiasm += 0.2;
      personality.warmth += 0.1;
    } else if (primaryMood === 'sad' || primaryMood === 'stressed') {
      personality.warmth += 0.2;
      personality.attentiveness += 0.2;
      personality.enthusiasm -= 0.1;
    } else if (primaryMood === 'disappointed') {
      personality.warmth += 0.3;
      personality.attentiveness += 0.3;
      personality.enthusiasm -= 0.2;
      personality.formality -= 0.1; // More personal approach
    } else if (primaryMood === 'curious') {
      personality.storytelling += 0.3;
      personality.enthusiasm += 0.1;
      personality.maritimeTheme += 0.2;
    } else if (primaryMood === 'appreciative') {
      personality.warmth += 0.1;
      personality.enthusiasm += 0.1;
      personality.storytelling += 0.1;
    }

    // Adjust based on context
    if (context === 'business') {
      personality.formality += 0.4;
      personality.enthusiasm -= 0.1;
      personality.maritimeTheme -= 0.2;
    } else if (context === 'romantic') {
      personality.warmth += 0.1;
      personality.attentiveness += 0.2;
    }

    // Adjust based on conversation cues
    if (conversationCues.includes('maritime_interested')) {
      personality.maritimeTheme += 0.3;
      personality.storytelling += 0.2;
    }

    if (conversationCues.includes('brief_communicator')) {
      personality.storytelling -= 0.2;
    }

    // Ensure values stay within 0-1 range
    Object.keys(personality).forEach(key => {
      personality[key] = Math.max(0, Math.min(1, personality[key]));
    });

    return personality;
  }

  /**
   * Generates contextually appropriate responses
   */
  generateContextualResponse(message, emotionalAnalysis, personalityProfile, suggestions) {
    const { primaryMood, context } = emotionalAnalysis;
    const { warmth, enthusiasm, formality, storytelling, maritimeTheme } = personalityProfile;

    let response = '';

    // Opening based on warmth and formality
    if (formality > 0.6) {
      response += warmth > 0.7 ? 'I\'d be delighted to help you with that. ' : 'Certainly, I can assist you with that. ';
    } else {
      response += warmth > 0.7 ? 'I\'d love to help you with that! ' : 'Sure thing! ';
    }

    // Add mood-appropriate sentiment
    if (primaryMood === 'stressed') {
      response += 'It sounds like you could use something to help you unwind. ';
    } else if (primaryMood === 'happy') {
      response += enthusiasm > 0.7 ? 'I love your energy! ' : 'That\'s wonderful! ';
    } else if (primaryMood === 'disappointed') {
      response += 'I understand that can be disappointing. Let me find something wonderful for you. ';
    } else if (primaryMood === 'curious') {
      response += 'I can see you\'re interested in learning more. I\'d be delighted to share some insights. ';
    } else if (primaryMood === 'appreciative') {
      response += 'I\'m so glad you understand. Your appreciation means a lot. ';
    }

    // Add maritime flavor if appropriate
    if (maritimeTheme > 0.6 && Math.random() > 0.5) {
      const maritimeGreetings = [
        'As we say here at the harbor, ',
        'Like a gentle sea breeze, ',
        'Just like finding the perfect wind for sailing, '
      ];
      response += maritimeGreetings[Math.floor(Math.random() * maritimeGreetings.length)];
    }

    return response;
  }

  /**
   * Generates shelf-specific emotional responses
   */
  generateShelfEmotionalResponse(shelfContext, emotionalAnalysis, personalityProfile) {
    const { emotionalResponse, hasDisappointment, hasCuriosity, hasAppreciation } = shelfContext;
    const { warmth, enthusiasm, formality } = personalityProfile;
    
    let response = '';
    
    if (hasDisappointment) {
      if (warmth > 0.7) {
        response = "I completely understand that feeling. When we have our hearts set on something special, it can be disappointing when it's not available. ";
      } else {
        response = "I understand your disappointment. Let me see what I can do to make this right. ";
      }
    } else if (hasCuriosity) {
      if (enthusiasm > 0.6) {
        response = "What a wonderful question! I love sharing the stories behind our spirit selection. ";
      } else {
        response = "I'd be happy to explain. There's quite a bit of wisdom behind how we organize our spirits. ";
      }
    } else if (hasAppreciation) {
      if (warmth > 0.6) {
        response = "Your understanding warms my heart. It's patrons like you who make this work so rewarding. ";
      } else {
        response = "Thank you for understanding. I appreciate your patience and respect for our system. ";
      }
    }
    
    return response;
  }

  /**
   * Determines appropriate educational approach based on emotional state
   */
  getEducationalApproach(emotionalAnalysis, shelfContext) {
    const { primaryMood, energyLevel } = emotionalAnalysis;
    const { emotionalResponse, hasCuriosity } = shelfContext;
    
    if (emotionalResponse === 'disappointed') {
      return {
        style: 'compassionate',
        depth: 'light',
        focus: 'alternatives',
        tone: 'understanding'
      };
    } else if (emotionalResponse === 'curious' || hasCuriosity) {
      return {
        style: 'educational',
        depth: energyLevel === 'high' ? 'detailed' : 'moderate',
        focus: 'explanation',
        tone: 'enthusiastic'
      };
    } else if (emotionalResponse === 'appreciative') {
      return {
        style: 'collaborative',
        depth: 'moderate',
        focus: 'enhancement',
        tone: 'warm'
      };
    }
    
    return {
      style: 'standard',
      depth: 'light',
      focus: 'general',
      tone: 'friendly'
    };
  }
}

export default AdvancedEmotionalIntelligence;
