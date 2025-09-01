/**
 * Integration Test for Spirits Shelf System
 * Tests the complete conversation flow with shelf-aware responses
 */

import { ConversationFlow } from '../utils/conversationPatterns.js';
import { ConversationContextService } from '../services/conversationContextService.js';
import AdvancedEmotionalIntelligence from '../utils/advancedEmotionalIntelligence.js';
import SpiritShelfManager from '../utils/spiritShelfManager.js';

describe('Spirits Shelf System Integration', () => {
  let conversationFlow;
  let contextService;
  let emotionalIntelligence;
  let shelfManager;

  beforeEach(() => {
    conversationFlow = new ConversationFlow();
    contextService = new ConversationContextService();
    emotionalIntelligence = new AdvancedEmotionalIntelligence();
    shelfManager = new SpiritShelfManager();
  });

  describe('Ultra Shelf Request Flow', () => {
    test('should detect ultra shelf request and offer alternatives', () => {
      const patronMessage = "I'd like your finest bourbon for a Manhattan";
      
      // Analyze the message
      const emotionalAnalysis = emotionalIntelligence.analyzeMood(patronMessage);
      const moodDetected = emotionalAnalysis.primaryMood;
      
      // Track the conversation
      contextService.addToHistory(patronMessage, 'patron', {
        mood: moodDetected,
        topics: ['bourbon', 'manhattan', 'premium']
      });
      
      // Generate response with shelf awareness
      const order = { spirit: 'bourbon', shelfLevel: 'ultra' };
      const response = conversationFlow.generateRecommendation(order, moodDetected);
      
      expect(response).toContain('captain\'s reserve');
      expect(response).toContain('alternative');
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(50);
    });

    test('should handle authorization request naturally', () => {
      const spiritName = "25-Year Pappy Van Winkle";
      
      const authRequest = shelfManager.generateAuthorizationRequest(spiritName);
      
      expect(authRequest).toContain(spiritName);
      expect(authRequest).toContain('captain');
      expect(authRequest.toLowerCase()).toMatch(/permission|blessing|approval/);
    });

    test('should provide appropriate alternatives when denied', () => {
      const spiritName = "Ultra Premium Bourbon";
      const deniedResponse = shelfManager.generateAuthorizationResponse('denied', spiritName);
      
      expect(deniedResponse).toContain('captain');
      expect(deniedResponse).toContain('alternative');
      expect(deniedResponse).not.toContain('sorry');  // Should be positive
    });
  });

  describe('Educational Responses', () => {
    test('should explain shelf system when patron is curious', () => {
      const curiousMessage = "Why can't I have that whiskey for my cocktail?";
      
      const emotionalAnalysis = emotionalIntelligence.analyzeMood(curiousMessage);
      const shelfContext = emotionalAnalysis.shelfContext;
      
      expect(shelfContext.hasCuriosity).toBe(true);
      expect(shelfContext.emotionalResponse).toBe('curious');
      
      const education = shelfManager.generateShelfEducation();
      expect(education).toContain('spirit');
      expect(education.length).toBeGreaterThan(100);
    });

    test('should adapt education style based on emotional state', () => {
      const disappointedMessage = "I'm disappointed I can't get that premium rum";
      
      const emotionalAnalysis = emotionalIntelligence.analyzeMood(disappointedMessage);
      const approach = emotionalIntelligence.getEducationalApproach(
        emotionalAnalysis, 
        emotionalAnalysis.shelfContext
      );
      
      expect(approach.style).toBe('compassionate');
      expect(approach.tone).toBe('understanding');
      expect(approach.focus).toBe('alternatives');
    });
  });

  describe('Alternative Suggestion Logic', () => {
    test('should map ultra whiskey to appropriate top shelf alternative', () => {
      const alternative = shelfManager.getAlternative('Premium Bourbon', 'top');
      
      expect(alternative).toHaveProperty('name');
      expect(alternative).toHaveProperty('story');
      expect(alternative.name).toContain('Bourbon');
      expect(alternative.story.length).toBeGreaterThan(20);
    });

    test('should handle different spirit types correctly', () => {
      const rumAlternative = shelfManager.getAlternative('Ultra Aged Rum', 'top');
      const ginAlternative = shelfManager.getAlternative('Rare Gin', 'top');
      
      expect(rumAlternative.name.toLowerCase()).toContain('rum');
      expect(ginAlternative.name.toLowerCase()).toContain('gin');
    });
  });

  describe('Context Tracking', () => {
    test('should track shelf requests and authorization status', () => {
      const requestId = contextService.recordAuthorizationRequest('Premium Scotch');
      
      expect(requestId).toContain('Premium Scotch');
      expect(contextService.sessionContext.authorizationStatus[requestId]).toBeDefined();
      expect(contextService.sessionContext.authorizationStatus[requestId].status).toBe('pending');
      
      contextService.updateAuthorizationStatus(requestId, 'approved');
      expect(contextService.sessionContext.authorizationStatus[requestId].status).toBe('approved');
    });

    test('should track alternatives offered when authorization denied', () => {
      const requestId = contextService.recordAuthorizationRequest('Ultra Whiskey');
      contextService.updateAuthorizationStatus(requestId, 'denied', 'Premium Single Barrel');
      
      expect(contextService.sessionContext.alternativesOffered).toHaveLength(1);
      expect(contextService.sessionContext.alternativesOffered[0].alternative).toBe('Premium Single Barrel');
    });
  });

  describe('Complete Conversation Flow', () => {
    test('should handle complete ultra shelf interaction naturally', () => {
      // Step 1: Patron requests ultra shelf spirit
      const initialRequest = "I'd like your best aged rum for sipping";
      
      // Step 2: System detects ultra shelf request
      const order = { spirit: 'rum', shelfLevel: 'ultra' };
      const mood = 'sophisticated';
      
      // Step 3: Generate authorization request
      const authRequest = conversationFlow.generateUltraShelfResponse(order, mood);
      expect(authRequest).toContain('captain');
      
      // Step 4: Track the interaction
      contextService.addToHistory(initialRequest, 'patron');
      const requestId = contextService.recordAuthorizationRequest('25-Year Aged Rum');
      
      // Step 5: Authorization denied, offer alternative
      const alternative = shelfManager.getAlternative('25-Year Aged Rum', 'top');
      contextService.updateAuthorizationStatus(requestId, 'denied', alternative.name);
      
      const deniedResponse = shelfManager.generateAuthorizationResponse('denied', '25-Year Aged Rum');
      
      // Verify complete flow
      expect(deniedResponse).toContain('captain');
      expect(deniedResponse).toContain('alternative');
      expect(contextService.sessionContext.alternativesOffered).toHaveLength(1);
    });
  });

  describe('Maritime Storytelling Integration', () => {
    test('should connect shelf education with maritime stories', () => {
      const response = shelfManager.createShelfResponse({
        spiritName: 'Captain\'s Reserve Whiskey',
        shelfLevel: 'ultra',
        authorizationStatus: 'pending',
        conversationStyle: 'storytelling',
        includeEducation: true
      });
      
      expect(response).toContain('Captain\'s Reserve Whiskey');
      expect(response).toContain('maritime');
      expect(response.length).toBeGreaterThan(200);
    });
  });

  describe('Patron Profile Integration', () => {
    test('should adapt approach based on patron interaction history', () => {
      // Simulate returning patron with shelf interaction history
      contextService.patronProfile.shelfInteractions = {
        ultraShelfRequests: 3,
        preferredApproach: 'knowledgeable'
      };
      
      const shelfContext = contextService.getShelfContext();
      expect(shelfContext.patronApproach).toBe('knowledgeable');
      
      const shouldEducate = contextService.shouldOfferShelfEducation();
      expect(shouldEducate).toBe(false); // Knowledgeable patron doesn't need basic education
    });
  });
});

export default 'Spirits Shelf System Integration Tests';