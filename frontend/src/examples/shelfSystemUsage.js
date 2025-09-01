/**
 * Example Usage: Spirits Shelf System Integration
 * Demonstrates how to use the shelf-aware conversation system
 */

import { ConversationFlow } from '../utils/conversationPatterns.js';
import { ConversationContextService } from '../services/conversationContextService.js';
import AdvancedEmotionalIntelligence from '../utils/advancedEmotionalIntelligence.js';
import SpiritShelfManager from '../utils/spiritShelfManager.js';
import { maritimeStories } from '../data/maritimeStories.js';

/**
 * Complete Shelf-Aware Conversation Handler
 */
export class ShelfAwareConversationHandler {
  constructor() {
    this.conversationFlow = new ConversationFlow();
    this.contextService = new ConversationContextService();
    this.emotionalIntelligence = new AdvancedEmotionalIntelligence();
    this.shelfManager = new SpiritShelfManager();
  }

  /**
   * Process a patron's message with full shelf awareness
   */
  async processPatronMessage(message, voiceMetrics = null) {
    // 1. Analyze emotional state and detect shelf requests
    const emotionalAnalysis = this.emotionalIntelligence.analyzeMood(message, voiceMetrics);
    const { primaryMood, shelfContext } = emotionalAnalysis;
    
    // 2. Update conversation context
    this.contextService.addToHistory(message, 'patron', {
      mood: primaryMood,
      topics: this.extractTopics(message),
      ...emotionalAnalysis
    });

    // 3. Check for shelf-related requests
    if (shelfContext.hasShelfRequest || shelfContext.hasAuthorizationConcern) {
      return await this.handleShelfRequest(message, emotionalAnalysis);
    }

    // 4. Handle regular conversation
    return this.generateRegularResponse(message, emotionalAnalysis);
  }

  /**
   * Handle shelf-specific requests and authorization
   */
  async handleShelfRequest(message, emotionalAnalysis) {
    const { primaryMood, shelfContext } = emotionalAnalysis;
    const spiritRequested = this.extractSpiritFromMessage(message);
    const shelfLevel = this.determineShelfLevel(message);

    let response = '';

    if (shelfLevel === 'ultra') {
      // Check if authorization already exists
      const existingAuth = this.checkExistingAuthorization(spiritRequested);
      
      if (existingAuth) {
        response = this.shelfManager.generateAuthorizationResponse(
          existingAuth.status, 
          spiritRequested
        );
      } else {
        // Request new authorization
        const requestId = this.contextService.recordAuthorizationRequest(spiritRequested);
        response = this.shelfManager.generateAuthorizationRequest(spiritRequested);
        
        // Simulate authorization process (in real app, this would be async)
        setTimeout(() => this.processAuthorization(requestId, spiritRequested), 2000);
      }
    } else {
      // Handle non-ultra shelf requests normally
      const order = { spirit: spiritRequested, shelfLevel };
      response = this.conversationFlow.generateRecommendation(order, primaryMood);
    }

    // Add educational content if appropriate
    if (this.shouldIncludeEducation(emotionalAnalysis)) {
      response += '\n\n' + this.generateShelfEducation(emotionalAnalysis);
    }

    // Add maritime story if patron seems interested
    if (this.shouldIncludeStory(emotionalAnalysis)) {
      response += '\n\n' + this.selectAppropriateStory(shelfLevel, primaryMood);
    }

    this.contextService.addToHistory(response, 'savannah');
    return {
      response,
      emotionalTone: this.determineResponseTone(emotionalAnalysis),
      actions: this.suggestFollowUpActions(emotionalAnalysis, shelfLevel)
    };
  }

  /**
   * Generate regular conversation response
   */
  generateRegularResponse(message, emotionalAnalysis) {
    const { primaryMood } = emotionalAnalysis;
    const response = this.conversationFlow.generateResponse(message);
    
    this.contextService.addToHistory(response, 'savannah');
    return {
      response,
      emotionalTone: this.determineResponseTone(emotionalAnalysis),
      actions: []
    };
  }

  /**
   * Process authorization request (simulated)
   */
  async processAuthorization(requestId, spiritName) {
    // Simulate captain's decision (in real app, this would involve actual authorization)
    const isSpecialOccasion = Math.random() > 0.7; // 30% approval rate
    const status = isSpecialOccasion ? 'approved' : 'denied';
    
    let alternative = null;
    if (status === 'denied') {
      alternative = this.shelfManager.getAlternative(spiritName, 'top').name;
    }
    
    this.contextService.updateAuthorizationStatus(requestId, status, alternative);
    
    // Generate follow-up response
    const followUpResponse = this.shelfManager.generateAuthorizationResponse(status, spiritName);
    
    this.contextService.addToHistory(followUpResponse, 'savannah');
    
    // In real app, you would emit this response to the UI
    return {
      response: followUpResponse,
      status,
      alternative
    };
  }

  /**
   * Extract spirit name from patron's message
   */
  extractSpiritFromMessage(message) {
    const spirits = [
      'whiskey', 'bourbon', 'scotch', 'rye', 'irish whiskey',
      'rum', 'aged rum', 'spiced rum', 'white rum',
      'gin', 'london dry', 'botanical gin',
      'vodka', 'potato vodka', 'wheat vodka',
      'tequila', 'mezcal', 'añejo', 'reposado',
      'cognac', 'brandy', 'armagnac'
    ];

    const lowerMessage = message.toLowerCase();
    for (const spirit of spirits) {
      if (lowerMessage.includes(spirit)) {
        return spirit;
      }
    }
    
    return 'premium spirit';
  }

  /**
   * Determine shelf level from message context
   */
  determineShelfLevel(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('ultra') || 
        lowerMessage.includes('finest') || 
        lowerMessage.includes('best') ||
        lowerMessage.includes('special') ||
        lowerMessage.includes('rare')) {
      return 'ultra';
    } else if (lowerMessage.includes('top shelf') || 
               lowerMessage.includes('premium')) {
      return 'top';
    } else if (lowerMessage.includes('call') || 
               lowerMessage.includes('quality')) {
      return 'call';
    }
    
    return 'well';
  }

  /**
   * Check for existing authorization
   */
  checkExistingAuthorization(spiritName) {
    const authStatuses = Object.values(this.contextService.sessionContext.authorizationStatus);
    return authStatuses.find(auth => 
      auth.spirit.toLowerCase().includes(spiritName.toLowerCase()) && 
      auth.status !== 'pending'
    );
  }

  /**
   * Determine if education should be included
   */
  shouldIncludeEducation(emotionalAnalysis) {
    const { shelfContext, primaryMood } = emotionalAnalysis;
    return shelfContext.hasCuriosity || 
           primaryMood === 'curious' || 
           shelfContext.hasDisappointment ||
           this.contextService.shouldOfferShelfEducation();
  }

  /**
   * Generate contextual shelf education
   */
  generateShelfEducation(emotionalAnalysis) {
    const approach = this.emotionalIntelligence.getEducationalApproach(
      emotionalAnalysis, 
      emotionalAnalysis.shelfContext
    );
    
    if (approach.style === 'compassionate') {
      return this.shelfManager.generateShelfEducation() + 
             ' But don\'t worry - I have something wonderful that will be perfect for your cocktail.';
    } else if (approach.style === 'educational') {
      return this.shelfManager.generateShelfEducation() + 
             ' Would you like to know more about how we select our spirits?';
    }
    
    return this.shelfManager.generateShelfEducation();
  }

  /**
   * Determine if maritime story should be included
   */
  shouldIncludeStory(emotionalAnalysis) {
    const { conversationCues, energyLevel } = emotionalAnalysis;
    return conversationCues.includes('maritime_interested') || 
           energyLevel === 'high' ||
           this.contextService.shouldOfferStory();
  }

  /**
   * Select appropriate maritime story
   */
  selectAppropriateStory(shelfLevel, mood) {
    if (shelfLevel === 'ultra') {
      const shelfStories = maritimeStories.spiritAppréciation;
      const storyKeys = Object.keys(shelfStories);
      const randomStory = shelfStories[storyKeys[Math.floor(Math.random() * storyKeys.length)]];
      return randomStory.story;
    }
    
    return this.conversationFlow.selectStory(null, mood)?.story || '';
  }

  /**
   * Extract topics from message
   */
  extractTopics(message) {
    const topics = [];
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('cocktail') || lowerMessage.includes('mixed')) topics.push('cocktails');
    if (lowerMessage.includes('story') || lowerMessage.includes('history')) topics.push('stories');
    if (lowerMessage.includes('premium') || lowerMessage.includes('quality')) topics.push('quality');
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) topics.push('recommendations');
    
    return topics;
  }

  /**
   * Determine response emotional tone
   */
  determineResponseTone(emotionalAnalysis) {
    const { primaryMood, shelfContext } = emotionalAnalysis;
    
    if (shelfContext.hasDisappointment) return 'compassionate';
    if (shelfContext.hasCuriosity) return 'educational';
    if (shelfContext.hasAppreciation) return 'warm';
    if (primaryMood === 'happy') return 'enthusiastic';
    if (primaryMood === 'stressed') return 'calming';
    
    return 'friendly';
  }

  /**
   * Suggest follow-up actions
   */
  suggestFollowUpActions(emotionalAnalysis, shelfLevel) {
    const actions = [];
    const { shelfContext, primaryMood } = emotionalAnalysis;
    
    if (shelfLevel === 'ultra' && shelfContext.hasAuthorizationConcern) {
      actions.push('await_authorization');
    }
    
    if (shelfContext.hasDisappointment) {
      actions.push('offer_alternative', 'provide_comfort');
    }
    
    if (shelfContext.hasCuriosity) {
      actions.push('offer_education', 'share_story');
    }
    
    if (primaryMood === 'happy') {
      actions.push('celebrate', 'suggest_upgrade');
    }
    
    return actions;
  }
}

// Example usage:
export const createShelfAwareConversation = () => {
  const handler = new ShelfAwareConversationHandler();
  
  return {
    // Process patron message
    processMessage: (message, voiceMetrics) => 
      handler.processPatronMessage(message, voiceMetrics),
    
    // Get conversation context
    getContext: () => handler.contextService.getContinuityContext(),
    
    // Get shelf context
    getShelfContext: () => handler.contextService.getShelfContext(),
    
    // Reset conversation
    reset: () => handler.contextService.resetSession()
  };
};

export default ShelfAwareConversationHandler;