const mongoose = require('mongoose');

const conversationMessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    emotionalState: {
      primary: String,
      confidence: Number,
      emotions: mongoose.Schema.Types.Mixed
    },
    confidence: Number,
    inputMode: {
      type: String,
      enum: ['text', 'voice'],
      default: 'text'
    },
    recommendedActions: [String]
  }
});

const emotionalProfileSchema = new mongoose.Schema({
  primaryEmotion: String,
  emotionHistory: [{
    emotion: String,
    confidence: Number,
    timestamp: Date
  }],
  averageConfidence: {
    type: Number,
    default: 0
  },
  emotionTrends: {
    type: Map,
    of: Number
  }
});

const beveragePreferenceSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  preferences: {
    sweetness: {
      type: Number,
      min: 1,
      max: 5
    },
    strength: {
      type: Number,
      min: 1,
      max: 5
    },
    complexity: {
      type: Number,
      min: 1,
      max: 5
    },
    temperature: {
      type: String,
      enum: ['hot', 'cold', 'room_temperature', 'any']
    }
  },
  favoriteIngredients: [String],
  dislikedIngredients: [String],
  favoriteStyles: [String],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const patronProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  visitHistory: [{
    date: Date,
    sessionId: String,
    duration: Number, // in minutes
    messageCount: Number,
    keyTopics: [String]
  }],
  beveragePreferences: {
    cocktails: beveragePreferenceSchema,
    wines: beveragePreferenceSchema,
    spirits: beveragePreferenceSchema,
    beers: beveragePreferenceSchema,
    nonAlcoholic: beveragePreferenceSchema
  },
  favoriteBeverages: [{
    beverageId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: String,
    category: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    notes: String,
    dateAdded: {
      type: Date,
      default: Date.now
    }
  }],
  emotionalProfile: emotionalProfileSchema,
  communicationStyle: {
    preferredLength: {
      type: String,
      enum: ['brief', 'moderate', 'detailed'],
      default: 'moderate'
    },
    formality: {
      type: String,
      enum: ['casual', 'friendly', 'professional'],
      default: 'friendly'
    },
    interests: [String]
  },
  personalNotes: {
    specialOccasions: [String],
    dietaryRestrictions: [String],
    allergies: [String],
    celebrations: [{
      type: String,
      date: Date,
      notes: String
    }]
  }
});

const conversationSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  patronProfile: patronProfileSchema,
  messages: [conversationMessageSchema],
  sessionMetadata: {
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: Date,
    duration: Number, // in minutes
    platform: {
      type: String,
      enum: ['web', 'mobile', 'voice', 'did_agent'],
      default: 'web'
    },
    features: [String], // enabled features like emotion_analysis, etc.
    d_id_session: String,
    webrtc_session: String,
    agent_id: String,
    webhook_url: String
  },
  conversationSummary: {
    messageCount: Number,
    keyTopics: [String],
    beveragesDiscussed: [String],
    recommendationsMade: Number,
    emotionalJourney: [{
      emotion: String,
      timestamp: Date,
      context: String
    }],
    learnings: [String] // things learned about the patron
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
conversationSessionSchema.index({ sessionId: 1 });
conversationSessionSchema.index({ userId: 1 });
conversationSessionSchema.index({ 'sessionMetadata.startTime': 1 });
conversationSessionSchema.index({ isActive: 1 });

// Methods
conversationSessionSchema.methods.addMessage = function(content, type, metadata = {}) {
  this.messages.push({
    content,
    type,
    metadata,
    timestamp: new Date()
  });
};

conversationSessionSchema.methods.updateEmotionalState = function(emotionData) {
  if (!this.patronProfile.emotionalProfile) {
    this.patronProfile.emotionalProfile = {
      emotionHistory: [],
      emotionTrends: new Map()
    };
  }

  this.patronProfile.emotionalProfile.primaryEmotion = emotionData.primary;
  this.patronProfile.emotionalProfile.emotionHistory.push({
    emotion: emotionData.primary,
    confidence: emotionData.confidence,
    timestamp: new Date()
  });

  // Update trends
  const trends = this.patronProfile.emotionalProfile.emotionTrends;
  Object.keys(emotionData.emotions).forEach(emotion => {
    const currentValue = trends.get(emotion) || 0;
    trends.set(emotion, (currentValue + emotionData.emotions[emotion]) / 2);
  });

  // Calculate average confidence
  const history = this.patronProfile.emotionalProfile.emotionHistory;
  const totalConfidence = history.reduce((sum, entry) => sum + entry.confidence, 0);
  this.patronProfile.emotionalProfile.averageConfidence = totalConfidence / history.length;
};

conversationSessionSchema.methods.addFavoriteBeverage = function(beverage) {
  if (!this.patronProfile.favoriteBeverages) {
    this.patronProfile.favoriteBeverages = [];
  }
  
  // Check if already exists
  const existingIndex = this.patronProfile.favoriteBeverages.findIndex(
    fav => fav.beverageId.toString() === beverage.id
  );
  
  if (existingIndex >= 0) {
    // Update existing
    this.patronProfile.favoriteBeverages[existingIndex] = {
      ...this.patronProfile.favoriteBeverages[existingIndex],
      rating: beverage.rating,
      notes: beverage.notes,
      dateAdded: new Date()
    };
  } else {
    // Add new
    this.patronProfile.favoriteBeverages.push({
      beverageId: beverage.id,
      name: beverage.name,
      category: beverage.category,
      rating: beverage.rating || 5,
      notes: beverage.notes || '',
      dateAdded: new Date()
    });
  }
};

conversationSessionSchema.methods.updateBeveragePreferences = function(category, preferences) {
  if (!this.patronProfile.beveragePreferences) {
    this.patronProfile.beveragePreferences = {};
  }
  
  this.patronProfile.beveragePreferences[category] = {
    ...this.patronProfile.beveragePreferences[category],
    ...preferences,
    lastUpdated: new Date()
  };
};

conversationSessionSchema.methods.generateSummary = function() {
  const messages = this.messages.filter(m => m.type === 'user');
  const messageCount = messages.length;
  
  // Extract key topics
  const allText = messages.map(m => m.content.toLowerCase()).join(' ');
  const topicKeywords = [
    'cocktail', 'wine', 'beer', 'spirit', 'whiskey', 'vodka', 'gin', 'rum', 
    'recommendation', 'favorite', 'sweet', 'strong', 'light', 'dry', 'fruity',
    'celebration', 'birthday', 'anniversary', 'date', 'business'
  ];
  
  const keyTopics = topicKeywords.filter(keyword => allText.includes(keyword));
  
  // Extract emotional journey
  const emotionalJourney = this.messages
    .filter(m => m.metadata && m.metadata.emotionalState)
    .map(m => ({
      emotion: m.metadata.emotionalState.primary,
      timestamp: m.timestamp,
      context: m.content.substring(0, 100)
    }));
  
  // Count recommendations made
  const recommendationsMade = this.messages.filter(m => 
    m.type === 'assistant' && 
    m.content.toLowerCase().includes('recommend')
  ).length;
  
  this.conversationSummary = {
    messageCount,
    keyTopics: [...new Set(keyTopics)],
    beveragesDiscussed: this.extractBeverageNames(),
    recommendationsMade,
    emotionalJourney,
    learnings: this.extractLearnings()
  };
};

conversationSessionSchema.methods.extractBeverageNames = function() {
  // This would use NLP to extract beverage names from conversation
  // For now, using simple keyword matching
  const messages = this.messages.map(m => m.content).join(' ');
  const beverageNames = [];
  
  // This could be enhanced with actual beverage database lookup
  const commonBeverages = [
    'martini', 'manhattan', 'old fashioned', 'mojito', 'margarita',
    'chardonnay', 'cabernet', 'pinot noir', 'sauvignon blanc',
    'whiskey', 'vodka', 'gin', 'rum', 'tequila'
  ];
  
  commonBeverages.forEach(beverage => {
    if (messages.toLowerCase().includes(beverage)) {
      beverageNames.push(beverage);
    }
  });
  
  return [...new Set(beverageNames)];
};

conversationSessionSchema.methods.extractLearnings = function() {
  const learnings = [];
  
  // Extract learnings from assistant messages that indicate discoveries
  this.messages.forEach(message => {
    if (message.type === 'assistant' && message.metadata && message.metadata.recommendedActions) {
      message.metadata.recommendedActions.forEach(action => {
        if (action.startsWith('learn:')) {
          learnings.push(action.substring(6));
        }
      });
    }
  });
  
  return [...new Set(learnings)];
};

conversationSessionSchema.methods.endSession = function() {
  this.sessionMetadata.endTime = new Date();
  this.sessionMetadata.duration = Math.round(
    (this.sessionMetadata.endTime - this.sessionMetadata.startTime) / (1000 * 60)
  );
  this.isActive = false;
  this.generateSummary();
};

module.exports = mongoose.model('ConversationSession', conversationSessionSchema);
