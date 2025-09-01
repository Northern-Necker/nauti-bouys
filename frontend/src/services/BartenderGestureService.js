/**
 * Bartender Gesture Service
 * Professional gesture management for avatar bartending interactions
 * Integrates with TalkingHead's playGesture system
 */

import { getAvatarById } from '../utils/avatarManager.js';

class BartenderGestureService {
  constructor() {
    this.talkingHeadInstance = null;
    this.currentGesture = null;
    this.gestureQueue = [];
    this.isGesturing = false;
    this.avatarConfig = null;
    
    // Professional bartender gesture mappings
    this.bartenderGestures = {
      // Service gestures
      welcome: { gesture: 'handup', duration: 2.5, context: 'greeting' },
      recommend: { gesture: 'index', duration: 3.0, context: 'suggestion' },
      present: { gesture: 'side', duration: 2.0, context: 'presentation' },
      
      // Approval/feedback gestures
      approve: { gesture: 'thumbup', duration: 2.0, context: 'positive' },
      perfect: { gesture: 'ok', duration: 2.0, context: 'excellent' },
      disapprove: { gesture: 'thumbdown', duration: 2.5, context: 'negative' },
      
      // Communication gestures
      explain: { gesture: 'side', duration: 3.5, context: 'explanation' },
      confused: { gesture: 'shrug', duration: 2.5, context: 'uncertainty' },
      greeting: { gesture: 'namaste', duration: 3.0, context: 'formal_greeting' },
      
      // Specific bartender actions
      pour: { gesture: 'side', duration: 4.0, context: 'bartending' },
      shake: { gesture: 'handup', duration: 3.0, context: 'cocktail_making' },
      stir: { gesture: 'index', duration: 2.5, context: 'mixing' },
      taste: { gesture: 'ok', duration: 2.0, context: 'quality_check' },
      cheers: { gesture: 'handup', duration: 2.5, context: 'celebration' }
    };
    
    // Context-based gesture selection
    this.contextualMappings = {
      cocktail_recommendation: ['recommend', 'present', 'explain'],
      order_confirmation: ['approve', 'perfect', 'welcome'],
      ingredient_explanation: ['explain', 'present', 'recommend'],
      quality_assurance: ['taste', 'approve', 'perfect'],
      greeting_customer: ['welcome', 'greeting', 'approve'],
      bartending_action: ['pour', 'shake', 'stir', 'present'],
      positive_feedback: ['approve', 'perfect', 'cheers'],
      negative_feedback: ['disapprove', 'confused', 'explain']
    };
  }

  /**
   * Initialize the gesture service with TalkingHead instance
   * @param {Object} talkingHeadInstance - Active TalkingHead instance
   * @param {string} avatarId - Avatar identifier for configuration
   */
  initialize(talkingHeadInstance, avatarId = 'savannah') {
    this.talkingHeadInstance = talkingHeadInstance;
    this.avatarConfig = getAvatarById(avatarId);
    
    if (!this.avatarConfig?.gestures?.enabled) {
      console.warn('Gesture support not enabled for avatar:', avatarId);
      return false;
    }
    
    console.log('BartenderGestureService initialized for:', avatarId);
    return true;
  }

  /**
   * Play a specific bartender gesture
   * @param {string} actionName - Bartender action name
   * @param {Object} options - Gesture options
   * @returns {Promise<boolean>} Success status
   */
  async playBartenderGesture(actionName, options = {}) {
    if (!this.talkingHeadInstance) {
      console.error('TalkingHead instance not available');
      return false;
    }

    const gestureConfig = this.bartenderGestures[actionName];
    if (!gestureConfig) {
      console.warn(`Unknown bartender gesture: ${actionName}`);
      return false;
    }

    try {
      const duration = options.duration || gestureConfig.duration;
      const mirror = options.mirror || false;
      const transitionTime = options.transitionTime || 
        this.avatarConfig?.gestures?.timing?.transitionTime || 500;

      console.log(`Playing bartender gesture: ${actionName} (${gestureConfig.gesture})`);
      
      // Set current gesture state
      this.currentGesture = {
        action: actionName,
        gesture: gestureConfig.gesture,
        context: gestureConfig.context,
        startTime: Date.now()
      };
      this.isGesturing = true;

      // Play the gesture using TalkingHead's playGesture method
      this.talkingHeadInstance.playGesture(
        gestureConfig.gesture,
        duration,
        mirror,
        transitionTime
      );

      // Set timeout to clear gesture state
      setTimeout(() => {
        this.isGesturing = false;
        this.currentGesture = null;
        this.processGestureQueue();
      }, duration * 1000);

      return true;
    } catch (error) {
      console.error('Error playing bartender gesture:', error);
      this.isGesturing = false;
      this.currentGesture = null;
      return false;
    }
  }

  /**
   * Get appropriate gesture for conversation context
   * @param {string} messageContent - User or AI message content
   * @param {string} context - Conversation context
   * @returns {string|null} Recommended gesture action
   */
  getContextualGesture(messageContent, context = 'general') {
    const content = messageContent.toLowerCase();
    
    // Keywords that trigger specific gestures
    const gestureKeywords = {
      welcome: ['hello', 'hi', 'welcome', 'good morning', 'good evening'],
      recommend: ['recommend', 'suggest', 'what about', 'try this', 'how about'],
      approve: ['great', 'excellent', 'perfect', 'good choice', 'love it'],
      perfect: ['perfect', 'exactly', 'spot on', 'brilliant', 'outstanding'],
      explain: ['because', 'this is', 'you see', 'basically', 'ingredient'],
      confused: ['hmm', 'not sure', 'maybe', 'difficult', 'problem'],
      pour: ['pour', 'serving', 'here is', 'your drink'],
      shake: ['shake', 'shaken', 'cocktail', 'mixing'],
      cheers: ['cheers', 'enjoy', 'celebration', 'toast']
    };

    // Check for keyword matches
    for (const [action, keywords] of Object.entries(gestureKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return action;
      }
    }

    // Use contextual mappings
    const contextGestures = this.contextualMappings[context];
    if (contextGestures && contextGestures.length > 0) {
      // Return first gesture from context, or random selection
      return contextGestures[0];
    }

    return null;
  }

  /**
   * Queue a gesture to play after current one finishes
   * @param {string} actionName - Bartender action name
   * @param {Object} options - Gesture options
   */
  queueGesture(actionName, options = {}) {
    if (this.isGesturing) {
      this.gestureQueue.push({ actionName, options });
      console.log(`Queued gesture: ${actionName}`);
    } else {
      this.playBartenderGesture(actionName, options);
    }
  }

  /**
   * Process queued gestures
   */
  processGestureQueue() {
    if (this.gestureQueue.length > 0 && !this.isGesturing) {
      const next = this.gestureQueue.shift();
      this.playBartenderGesture(next.actionName, next.options);
    }
  }

  /**
   * Stop current gesture
   */
  stopCurrentGesture() {
    if (this.talkingHeadInstance && this.isGesturing) {
      try {
        this.talkingHeadInstance.stopGesture();
        this.isGesturing = false;
        this.currentGesture = null;
        console.log('Stopped current gesture');
      } catch (error) {
        console.error('Error stopping gesture:', error);
      }
    }
  }

  /**
   * Clear gesture queue
   */
  clearGestureQueue() {
    this.gestureQueue = [];
    console.log('Cleared gesture queue');
  }

  /**
   * Get current gesture status
   * @returns {Object} Current gesture information
   */
  getGestureStatus() {
    return {
      isGesturing: this.isGesturing,
      currentGesture: this.currentGesture,
      queueLength: this.gestureQueue.length,
      availableGestures: Object.keys(this.bartenderGestures)
    };
  }

  /**
   * Handle conversation-triggered gestures
   * @param {string} messageContent - Message content
   * @param {string} messageType - 'user' or 'assistant'
   * @param {Object} context - Additional context
   */
  handleConversationGesture(messageContent, messageType, context = {}) {
    // Only trigger gestures for assistant responses
    if (messageType !== 'assistant') {
      return;
    }

    const gestureAction = this.getContextualGesture(
      messageContent, 
      context.conversationContext || 'general'
    );

    if (gestureAction) {
      const delay = context.delay || 500; // Small delay for natural timing
      setTimeout(() => {
        this.queueGesture(gestureAction, {
          duration: context.duration,
          context: context.conversationContext
        });
      }, delay);
    }
  }

  /**
   * Get available bartender gestures
   * @returns {Array} List of available gesture actions
   */
  getAvailableGestures() {
    return Object.keys(this.bartenderGestures).map(action => ({
      action,
      gesture: this.bartenderGestures[action].gesture,
      context: this.bartenderGestures[action].context,
      duration: this.bartenderGestures[action].duration
    }));
  }

  /**
   * Test gesture functionality
   * @param {string} gestureAction - Gesture to test
   */
  testGesture(gestureAction = 'welcome') {
    console.log(`Testing gesture: ${gestureAction}`);
    return this.playBartenderGesture(gestureAction, { duration: 2.0 });
  }
}

// Export singleton instance
export default new BartenderGestureService();