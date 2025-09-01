/**
 * Conversation Context Service
 * Manages conversation memory, context tracking, and patron profiling
 */

export class ConversationContextService {
  constructor() {
    this.conversationHistory = [];
    this.patronProfile = {
      preferences: {},
      conversationStyle: 'casual',
      emotionalJourney: [],
      interactions: 0,
      favoriteTopics: [],
      drinkPreferences: [],
      visitHistory: []
    };
    this.sessionContext = {
      startTime: new Date(),
      currentMood: 'neutral',
      energyLevel: 'medium',
      topics: [],
      drinks: [],
      stories: [],
      engagementLevel: 'medium',
      shelfRequests: [],
      authorizationStatus: {},
      alternativesOffered: []
    };
    this.memoryLimit = 50; // Maximum conversation history entries
  }

  /**
   * Adds a message to conversation history with metadata
   */
  addToHistory(message, role, metadata = {}) {
    const entry = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      role, // 'patron' or 'savannah'
      message,
      metadata: {
        mood: metadata.mood || 'neutral',
        energyLevel: metadata.energyLevel || 'medium',
        confidence: metadata.confidence || 0,
        topics: metadata.topics || [],
        ...metadata
      }
    };

    this.conversationHistory.push(entry);

    // Maintain memory limit
    if (this.conversationHistory.length > this.memoryLimit) {
      this.conversationHistory = this.conversationHistory.slice(-this.memoryLimit);
    }

    // Update session context
    this.updateSessionContext(entry);

    return entry;
  }

  /**
   * Updates current session context based on new message
   */
  updateSessionContext(entry) {
    if (entry.role === 'patron') {
      this.sessionContext.currentMood = entry.metadata.mood;
      this.sessionContext.energyLevel = entry.metadata.energyLevel;
      
      // Track topics mentioned
      if (entry.metadata.topics) {
        this.sessionContext.topics.push(...entry.metadata.topics);
      }

      // Update engagement level based on message characteristics
      this.updateEngagementLevel(entry.message);
    }

    // Track drinks and stories mentioned
    this.trackMentions(entry.message);
  }

  /**
   * Updates engagement level based on patron's message characteristics
   */
  updateEngagementLevel(message) {
    const questionCount = (message.match(/\?/g) || []).length;
    const wordCount = message.split(/\s+/).length;
    const exclamationCount = (message.match(/!/g) || []).length;

    let engagement = 0;
    
    // Questions indicate interest
    engagement += questionCount * 0.3;
    
    // Longer messages indicate engagement
    if (wordCount > 20) engagement += 0.2;
    else if (wordCount > 10) engagement += 0.1;
    
    // Enthusiasm indicators
    engagement += exclamationCount * 0.1;

    // Set engagement level
    if (engagement > 0.5) this.sessionContext.engagementLevel = 'high';
    else if (engagement > 0.2) this.sessionContext.engagementLevel = 'medium';
    else this.sessionContext.engagementLevel = 'low';
  }

  /**
   * Tracks mentions of drinks, food, and stories in conversation
   */
  trackMentions(message) {
    const lowerMessage = message.toLowerCase();

    // Common drink keywords
    const drinkKeywords = [
      'beer', 'wine', 'cocktail', 'whiskey', 'bourbon', 'gin', 'vodka', 'rum',
      'tequila', 'martini', 'manhattan', 'old fashioned', 'mojito', 'margarita'
    ];
    
    // Shelf-related keywords
    const shelfKeywords = [
      'ultra shelf', 'top shelf', 'premium', 'reserve', 'special', 'rare',
      'authorization', 'captain', 'permission', 'approval'
    ];

    // Story keywords
    const storyKeywords = [
      'story', 'tale', 'adventure', 'maritime', 'sailing', 'captain', 'ship',
      'ocean', 'harbor', 'lighthouse', 'treasure'
    ];

    drinkKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) {
        if (!this.sessionContext.drinks.includes(keyword)) {
          this.sessionContext.drinks.push(keyword);
        }
      }
    });

    storyKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) {
        if (!this.sessionContext.stories.includes(keyword)) {
          this.sessionContext.stories.push(keyword);
        }
      }
    });
    
    // Track shelf-related mentions
    shelfKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) {
        this.trackShelfMention(keyword, message);
      }
    });
  }

  /**
   * Updates patron profile based on conversation patterns
   */
  updatePatronProfile(emotionalAnalysis, conversationStyle) {
    this.patronProfile.interactions++;
    
    // Update conversation style preference
    if (conversationStyle) {
      this.patronProfile.conversationStyle = conversationStyle.responseStyle || 'casual';
    }

    // Track emotional journey
    this.patronProfile.emotionalJourney.push({
      timestamp: new Date(),
      mood: emotionalAnalysis.primaryMood,
      energy: emotionalAnalysis.energyLevel,
      context: emotionalAnalysis.context
    });

    // Limit emotional journey history
    if (this.patronProfile.emotionalJourney.length > 20) {
      this.patronProfile.emotionalJourney = this.patronProfile.emotionalJourney.slice(-20);
    }

    // Update favorite topics based on conversation cues
    if (emotionalAnalysis.conversationCues.includes('maritime_interested')) {
      this.addToFavorites('maritime_stories');
    }

    // Update drink preferences based on session
    this.sessionContext.drinks.forEach(drink => {
      this.addToDrinkPreferences(drink);
    });
    
    // Update shelf interaction patterns
    if (this.sessionContext.shelfRequests.length > 0) {
      this.updateShelfInteractionProfile();
    }
  }

  /**
   * Adds topic to favorite topics with frequency tracking
   */
  addToFavorites(topic) {
    const existing = this.patronProfile.favoriteTopics.find(t => t.topic === topic);
    if (existing) {
      existing.frequency++;
    } else {
      this.patronProfile.favoriteTopics.push({
        topic,
        frequency: 1,
        lastMentioned: new Date()
      });
    }

    // Sort by frequency
    this.patronProfile.favoriteTopics.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Adds drink to preferences with frequency tracking
   */
  addToDrinkPreferences(drink) {
    const existing = this.patronProfile.drinkPreferences.find(d => d.drink === drink);
    if (existing) {
      existing.frequency++;
      existing.lastOrdered = new Date();
    } else {
      this.patronProfile.drinkPreferences.push({
        drink,
        frequency: 1,
        lastOrdered: new Date()
      });
    }

    // Sort by frequency
    this.patronProfile.drinkPreferences.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Tracks shelf-related mentions and requests
   */
  trackShelfMention(keyword, fullMessage) {
    const mention = {
      keyword,
      message: fullMessage,
      timestamp: new Date(),
      type: this.categorizeShelfMention(keyword)
    };
    
    this.sessionContext.shelfRequests.push(mention);
    
    // Limit shelf request history
    if (this.sessionContext.shelfRequests.length > 10) {
      this.sessionContext.shelfRequests = this.sessionContext.shelfRequests.slice(-10);
    }
  }

  /**
   * Categorizes shelf mentions by type
   */
  categorizeShelfMention(keyword) {
    const categories = {
      request: ['ultra shelf', 'top shelf', 'premium', 'reserve', 'special', 'rare'],
      authorization: ['authorization', 'captain', 'permission', 'approval'],
      general: ['quality', 'finest', 'best']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.includes(keyword.toLowerCase())) {
        return category;
      }
    }
    
    return 'general';
  }

  /**
   * Records authorization request and status
   */
  recordAuthorizationRequest(spiritName, requestType = 'ultra_shelf') {
    const requestId = `${spiritName}_${Date.now()}`;
    
    this.sessionContext.authorizationStatus[requestId] = {
      spirit: spiritName,
      type: requestType,
      status: 'pending',
      requestTime: new Date(),
      responseTime: null
    };
    
    return requestId;
  }

  /**
   * Updates authorization status
   */
  updateAuthorizationStatus(requestId, status, alternativeOffered = null) {
    if (this.sessionContext.authorizationStatus[requestId]) {
      this.sessionContext.authorizationStatus[requestId].status = status;
      this.sessionContext.authorizationStatus[requestId].responseTime = new Date();
      
      if (alternativeOffered && status === 'denied') {
        this.sessionContext.alternativesOffered.push({
          original: this.sessionContext.authorizationStatus[requestId].spirit,
          alternative: alternativeOffered,
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Updates patron profile based on shelf interactions
   */
  updateShelfInteractionProfile() {
    const shelfRequests = this.sessionContext.shelfRequests.filter(req => req.type === 'request');
    const authRequests = this.sessionContext.shelfRequests.filter(req => req.type === 'authorization');
    
    // Initialize shelf interaction profile if not exists
    if (!this.patronProfile.shelfInteractions) {
      this.patronProfile.shelfInteractions = {
        ultraShelfRequests: 0,
        authorizationRequests: 0,
        alternativesAccepted: 0,
        educationInterest: 0,
        preferredApproach: 'standard'
      };
    }
    
    // Update counters
    this.patronProfile.shelfInteractions.ultraShelfRequests += shelfRequests.length;
    this.patronProfile.shelfInteractions.authorizationRequests += authRequests.length;
    
    // Determine preferred approach based on patterns
    const totalRequests = this.patronProfile.shelfInteractions.ultraShelfRequests;
    if (totalRequests > 3) {
      this.patronProfile.shelfInteractions.preferredApproach = 'knowledgeable';
    } else if (totalRequests > 1) {
      this.patronProfile.shelfInteractions.preferredApproach = 'educational';
    }
  }

  /**
   * Gets conversation continuity context for seamless flow
   */
  getContinuityContext() {
    const recentHistory = this.conversationHistory.slice(-5);
    const currentTopics = [...new Set(this.sessionContext.topics.slice(-3))];
    const recentMoods = this.patronProfile.emotionalJourney.slice(-3);

    return {
      recentMessages: recentHistory,
      activeTopics: currentTopics,
      moodProgression: recentMoods,
      sessionLength: Date.now() - this.sessionContext.startTime.getTime(),
      engagementTrend: this.calculateEngagementTrend(),
      conversationFlow: this.analyzeConversationFlow()
    };
  }

  /**
   * Calculates engagement trend over the conversation
   */
  calculateEngagementTrend() {
    if (this.conversationHistory.length < 3) return 'stable';

    const recentEngagement = this.conversationHistory.slice(-3)
      .filter(entry => entry.role === 'patron')
      .map(entry => {
        const wordCount = entry.message.split(/\s+/).length;
        const questionCount = (entry.message.match(/\?/g) || []).length;
        return wordCount + (questionCount * 5);
      });

    if (recentEngagement.length < 2) return 'stable';

    const trend = recentEngagement[recentEngagement.length - 1] - recentEngagement[0];
    
    if (trend > 5) return 'increasing';
    if (trend < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Analyzes conversation flow patterns
   */
  analyzeConversationFlow() {
    const patronMessages = this.conversationHistory
      .filter(entry => entry.role === 'patron')
      .slice(-5);

    if (patronMessages.length < 2) return 'initiated';

    const avgResponseTime = this.calculateAvgResponseTime(patronMessages);
    const topicChanges = this.countTopicChanges(patronMessages);
    const questionRatio = this.calculateQuestionRatio(patronMessages);

    return {
      pace: avgResponseTime < 30000 ? 'fast' : avgResponseTime < 120000 ? 'moderate' : 'slow',
      topicStability: topicChanges < 2 ? 'focused' : 'exploratory',
      interactivity: questionRatio > 0.3 ? 'high' : questionRatio > 0.1 ? 'medium' : 'low',
      needsStoryPrompt: this.shouldOfferStory(),
      needsDrinkSuggestion: this.shouldSuggestDrink()
    };
  }

  /**
   * Calculates average response time between messages
   */
  calculateAvgResponseTime(messages) {
    if (messages.length < 2) return 0;

    const intervals = [];
    for (let i = 1; i < messages.length; i++) {
      const interval = messages[i].timestamp - messages[i-1].timestamp;
      intervals.push(interval);
    }

    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  /**
   * Counts topic changes in recent conversation
   */
  countTopicChanges(messages) {
    if (messages.length < 2) return 0;

    let changes = 0;
    let lastTopics = messages[0].metadata.topics || [];

    for (let i = 1; i < messages.length; i++) {
      const currentTopics = messages[i].metadata.topics || [];
      const overlap = currentTopics.filter(topic => lastTopics.includes(topic));
      
      if (overlap.length === 0 && currentTopics.length > 0) {
        changes++;
      }
      
      lastTopics = currentTopics;
    }

    return changes;
  }

  /**
   * Calculates ratio of questions to total messages
   */
  calculateQuestionRatio(messages) {
    if (messages.length === 0) return 0;

    const questionsCount = messages.reduce((count, message) => {
      return count + (message.message.match(/\?/g) || []).length;
    }, 0);

    return questionsCount / messages.length;
  }

  /**
   * Determines if Savannah should offer a maritime story
   */
  shouldOfferStory() {
    const recentMessages = this.conversationHistory.slice(-3);
    const avgLength = recentMessages.reduce((sum, msg) => sum + msg.message.length, 0) / recentMessages.length;
    
    // Offer story if conversation is slowing down or patron shows maritime interest
    return avgLength < 50 || 
           this.sessionContext.stories.length > 0 ||
           this.patronProfile.favoriteTopics.some(topic => topic.topic === 'maritime_stories');
  }

  /**
   * Determines if Savannah should suggest a drink
   */
  shouldSuggestDrink() {
    const sessionDuration = Date.now() - this.sessionContext.startTime.getTime();
    const hasDrinkMentions = this.sessionContext.drinks.length > 0;
    const isAppropriateTime = new Date().getHours() >= 16; // After 4 PM

    return (sessionDuration > 120000 && !hasDrinkMentions && isAppropriateTime) || // 2 minutes without drink mention
           this.sessionContext.currentMood === 'stressed' ||
           this.sessionContext.currentMood === 'happy';
  }

  /**
   * Determines if Savannah should offer shelf education
   */
  shouldOfferShelfEducation() {
    const hasShelfRequests = this.sessionContext.shelfRequests.length > 0;
    const hasDeniedRequests = Object.values(this.sessionContext.authorizationStatus)
      .some(auth => auth.status === 'denied');
    const isKnowledgeablePatron = this.patronProfile.shelfInteractions?.preferredApproach === 'knowledgeable';
    
    return (hasShelfRequests && !isKnowledgeablePatron) || hasDeniedRequests;
  }

  /**
   * Gets shelf interaction context for response generation
   */
  getShelfContext() {
    return {
      recentRequests: this.sessionContext.shelfRequests.slice(-3),
      pendingAuthorizations: Object.values(this.sessionContext.authorizationStatus)
        .filter(auth => auth.status === 'pending'),
      recentAlternatives: this.sessionContext.alternativesOffered.slice(-2),
      patronApproach: this.patronProfile.shelfInteractions?.preferredApproach || 'standard',
      educationLevel: this.patronProfile.shelfInteractions?.educationInterest || 0
    };
  }

  /**
   * Suggests appropriate alternatives based on patron history
   */
  suggestAlternatives(originalSpirit, shelfLevel = 'top') {
    const alternatives = {
      whiskey: {
        top: ['single barrel bourbon', 'small batch rye', 'highland single malt'],
        call: ['premium blended whiskey', 'quality bourbon', 'smooth Irish whiskey']
      },
      rum: {
        top: ['aged Caribbean rum', 'premium spiced rum', 'artisanal white rum'],
        call: ['quality dark rum', 'smooth aged rum', 'traditional Cuban-style rum']
      },
      gin: {
        top: ['artisanal botanical gin', 'premium London Dry', 'craft distilled gin'],
        call: ['quality London Dry', 'smooth gin', 'classic juniper gin']
      },
      vodka: {
        top: ['premium wheat vodka', 'artisanal potato vodka', 'craft distilled vodka'],
        call: ['quality vodka', 'smooth grain vodka', 'clean neutral vodka']
      }
    };
    
    const spiritType = this.identifySpiritType(originalSpirit);
    const options = alternatives[spiritType]?.[shelfLevel] || ['premium selection'];
    
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Identifies base spirit type from spirit name
   */
  identifySpiritType(spiritName) {
    const name = spiritName.toLowerCase();
    
    if (name.includes('whiskey') || name.includes('bourbon') || name.includes('scotch') || name.includes('rye')) {
      return 'whiskey';
    } else if (name.includes('rum')) {
      return 'rum';
    } else if (name.includes('gin')) {
      return 'gin';
    } else if (name.includes('vodka')) {
      return 'vodka';
    } else if (name.includes('tequila')) {
      return 'tequila';
    } else if (name.includes('cognac') || name.includes('brandy')) {
      return 'cognac';
    }
    
    return 'spirit';
  }

  /**
   * Gets personalized recommendations based on patron profile
   */
  getPersonalizedRecommendations() {
    const recommendations = {
      drinks: [],
      topics: [],
      stories: [],
      approach: 'standard'
    };

    // Drink recommendations based on history
    if (this.patronProfile.drinkPreferences.length > 0) {
      const topDrinks = this.patronProfile.drinkPreferences.slice(0, 3);
      recommendations.drinks = topDrinks.map(d => d.drink);
    }

    // Topic recommendations based on favorites
    if (this.patronProfile.favoriteTopics.length > 0) {
      const topTopics = this.patronProfile.favoriteTopics.slice(0, 3);
      recommendations.topics = topTopics.map(t => t.topic);
    }

    // Approach based on conversation style
    if (this.patronProfile.conversationStyle === 'formal') {
      recommendations.approach = 'professional';
    } else if (this.patronProfile.interactions > 5) {
      recommendations.approach = 'familiar';
    }

    return recommendations;
  }

  /**
   * Exports conversation data for analysis or persistence
   */
  exportConversationData() {
    return {
      history: this.conversationHistory,
      profile: this.patronProfile,
      session: this.sessionContext,
      continuity: this.getContinuityContext(),
      recommendations: this.getPersonalizedRecommendations(),
      exportedAt: new Date()
    };
  }

  /**
   * Resets session data while preserving patron profile
   */
  resetSession() {
    this.conversationHistory = [];
    this.sessionContext = {
      startTime: new Date(),
      currentMood: 'neutral',
      energyLevel: 'medium',
      topics: [],
      drinks: [],
      stories: [],
      engagementLevel: 'medium',
      shelfRequests: [],
      authorizationStatus: {},
      alternativesOffered: []
    };
  }

  /**
   * Loads conversation data from previous session
   */
  loadConversationData(data) {
    if (data.profile) {
      this.patronProfile = { ...this.patronProfile, ...data.profile };
    }
    if (data.history) {
      this.conversationHistory = data.history;
    }
    if (data.session) {
      this.sessionContext = { ...this.sessionContext, ...data.session };
    }
  }
}

export default ConversationContextService;