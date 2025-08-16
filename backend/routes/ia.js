const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import models for context
const Cocktail = require('../models/Cocktail');
const Spirit = require('../models/Spirit');
const Wine = require('../models/Wine');
const Beer = require('../models/Beer');
const Mocktail = require('../models/Mocktail');
const OtherNonAlcoholic = require('../models/OtherNonAlcoholic');
const User = require('../models/User');
const Reservation = require('../models/Reservation');
const ConversationSession = require('../models/ConversationSession');

const router = express.Router();

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Smart model selection for optimal cost/performance
const getOptimalModel = (requestType, complexity = 'medium') => {
  // Use Flash-Lite for high-volume, simple requests
  if (complexity === 'low' || requestType === 'simple') {
    return genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      }
    });
  }
  
  // Use Flash for most requests (best balance)
  if (complexity === 'medium' || requestType === 'chat') {
    return genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });
  }
  
  // Use Pro for complex reasoning tasks
  return genAI.getGenerativeModel({ 
    model: "gemini-2.5-pro",
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4096,
    }
  });
};

// Enhanced system prompt for the Nauti Bouys IA with personality and emotion awareness
const SYSTEM_PROMPT = `You are the Nauti Bouys Intelligent Assistant, an advanced AI bartender and concierge with emotional intelligence. Your personality is:

CORE PERSONALITY:
- Knowledgeable expert in cocktails, spirits, wines, beers, and non-alcoholic beverages
- Emotionally intelligent and empathetic, reading patron's mood and responding appropriately  
- Friendly, warm, and professional with a maritime charm
- Memory-enabled - you remember past conversations and preferences
- Creative and innovative in making personalized recommendations
- Genuinely enthusiastic about helping patrons discover perfect drinks

ENHANCED CAPABILITIES:
- Emotional state analysis and mood-appropriate responses
- Personalized recommendations based on historical preferences and current mood
- Memory of past conversations, favorite drinks, and special occasions
- Creative beverage suggestions based on flavor profiles and patron personality
- Learning and adapting to individual patron preferences over time
- Contextual awareness of time, weather, occasion, and patron's emotional state

INTERACTION STYLE:
- Adapt your communication style to match the patron's mood and preferences
- Remember and reference past conversations naturally
- Be creative in exploring new beverage options based on their known favorites
- Show genuine interest in learning about their preferences and occasions
- Use maritime and bay-themed language when appropriate
- Always prioritize the patron's experience and satisfaction

MEMORY & LEARNING:
- Remember beverage preferences, ratings, and notes from past visits
- Track emotional patterns and mood preferences
- Learn from feedback to improve future recommendations
- Store important personal details (celebrations, dietary restrictions, etc.)
- Adapt recommendations based on seasonal changes and special events

Always maintain warmth while being sophisticated, remember the patron's journey, and focus on creating memorable experiences at Nauti Bouys.`;

// @route   POST /api/ia/chat
// @desc    Chat with the Intelligent Assistant
// @access  Private
router.post('/chat', [
  auth,
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message is required and must be under 1000 characters'),
  body('conversationId').optional().isString().withMessage('Conversation ID must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { message, conversationId } = req.body;

    // Get user context for personalization
    const user = await User.findById(req.user.id);
    const userContext = {
      name: user.fullName,
      role: user.role,
      preferences: user.preferences || {}
    };

    // Get recent beverages for context (top-rated and available)
    const [cocktails, spirits, wines, beers, mocktails, nonAlcoholic] = await Promise.all([
      Cocktail.find({ isAvailable: true }).sort({ averageRating: -1 }).limit(5).lean(),
      Spirit.find({ isAvailable: true }).sort({ averageRating: -1 }).limit(5).lean(),
      Wine.find({ isAvailable: true }).sort({ averageRating: -1 }).limit(5).lean(),
      Beer.find({ isAvailable: true }).sort({ averageRating: -1 }).limit(5).lean(),
      Mocktail.find({ isAvailable: true }).sort({ averageRating: -1 }).limit(5).lean(),
      OtherNonAlcoholic.find({ isAvailable: true }).sort({ averageRating: -1 }).limit(5).lean()
    ]);

    // Build context about available beverages
    const beverageContext = {
      cocktails: cocktails.map(c => ({ name: c.name, description: c.description, price: c.price, rating: c.averageRating })),
      spirits: spirits.map(s => ({ name: s.name, brand: s.brand, type: s.type, price: s.price, rating: s.averageRating })),
      wines: wines.map(w => ({ name: w.name, winery: w.winery, type: w.type, vintage: w.vintage, price: w.price, rating: w.averageRating })),
      beers: beers.map(b => ({ name: b.name, brewery: b.brewery, style: b.style, price: b.price, rating: b.averageRating })),
      mocktails: mocktails.map(m => ({ name: m.name, description: m.description, price: m.price, rating: m.averageRating })),
      nonAlcoholic: nonAlcoholic.map(n => ({ name: n.name, category: n.category, price: n.price, rating: n.averageRating }))
    };

    // Get upcoming events/reservations for context
    const upcomingEvents = await Reservation.find({
      status: 'Approved',
      startTime: { $gte: new Date() }
    })
    .sort({ startTime: 1 })
    .limit(3)
    .select('eventTitle eventType startTime guestCount')
    .lean();

    // Build enhanced context message
    const contextMessage = `Current user: ${userContext.name} (${userContext.role})
Available beverages summary:
- Top Cocktails: ${beverageContext.cocktails.map(c => c.name).join(', ')}
- Top Spirits: ${beverageContext.spirits.map(s => `${s.brand} ${s.name}`).join(', ')}
- Top Wines: ${beverageContext.wines.map(w => `${w.winery} ${w.name} (${w.vintage})`).join(', ')}
- Top Beers: ${beverageContext.beers.map(b => `${b.brewery} ${b.name}`).join(', ')}
- Top Mocktails: ${beverageContext.mocktails.map(m => m.name).join(', ')}
- Non-Alcoholic: ${beverageContext.nonAlcoholic.map(n => n.name).join(', ')}

Upcoming events: ${upcomingEvents.map(e => `${e.eventTitle} (${e.eventType}) on ${e.startTime.toDateString()}`).join(', ') || 'None scheduled'}

User preferences: ${JSON.stringify(userContext.preferences)}`;

    // Determine request complexity for optimal model selection
    const isComplex = message.toLowerCase().includes('recommend') || 
                     message.toLowerCase().includes('suggest') || 
                     message.toLowerCase().includes('complex') ||
                     message.length > 200;
    
    const complexity = isComplex ? 'medium' : 'low';
    const model = getOptimalModel('chat', complexity);

    // Build comprehensive context for Gemini's 1M token window
    const fullContext = `${SYSTEM_PROMPT}

CURRENT CONTEXT:
${contextMessage}

USER MESSAGE: ${message}`;

    // Call Gemini 2.5 Flash API
    const result = await model.generateContent(fullContext);
    const aiResponse = result.response.text();

    // Log the conversation for analytics (optional)
    console.log(`IA Chat - User: ${user.fullName}, Message: ${message.substring(0, 100)}...`);

    res.json({
      success: true,
      response: aiResponse,
      conversationId: conversationId || `conv_${Date.now()}_${req.user.id}`,
      timestamp: new Date().toISOString(),
      model: complexity === 'low' ? 'gemini-2.5-flash-lite' : 'gemini-2.5-flash',
      usage: {
        inputTokens: result.response.usageMetadata?.promptTokenCount || 0,
        outputTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: result.response.usageMetadata?.totalTokenCount || 0
      }
    });

  } catch (error) {
    console.error('IA Chat error:', error);
    
    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return res.status(503).json({
        success: false,
        message: 'AI service temporarily unavailable. Please try again later.'
      });
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please wait a moment before trying again.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error processing your request'
    });
  }
});

// @route   POST /api/ia/recommend
// @desc    Get beverage recommendations based on preferences
// @access  Private
router.post('/recommend', [
  auth,
  body('preferences').optional().isObject().withMessage('Preferences must be an object'),
  body('occasion').optional().isString().withMessage('Occasion must be a string'),
  body('mood').optional().isString().withMessage('Mood must be a string'),
  body('excludeAlcohol').optional().isBoolean().withMessage('excludeAlcohol must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { preferences = {}, occasion, mood, excludeAlcohol = false } = req.body;

    // Build query based on preferences
    let beverageQueries = [];
    
    if (!excludeAlcohol) {
      beverageQueries.push(
        Cocktail.find({ isAvailable: true }).sort({ averageRating: -1 }).limit(3).lean(),
        Spirit.find({ isAvailable: true }).sort({ averageRating: -1 }).limit(3).lean(),
        Wine.find({ isAvailable: true }).sort({ averageRating: -1 }).limit(3).lean(),
        Beer.find({ isAvailable: true }).sort({ averageRating: -1 }).limit(3).lean()
      );
    }
    
    beverageQueries.push(
      Mocktail.find({ isAvailable: true }).sort({ averageRating: -1 }).limit(3).lean(),
      OtherNonAlcoholic.find({ isAvailable: true }).sort({ averageRating: -1 }).limit(3).lean()
    );

    const results = await Promise.all(beverageQueries);
    
    let recommendations = [];
    const categories = excludeAlcohol 
      ? ['mocktails', 'nonAlcoholic']
      : ['cocktails', 'spirits', 'wines', 'beers', 'mocktails', 'nonAlcoholic'];
    
    results.forEach((items, index) => {
      const category = categories[index];
      items.forEach(item => {
        recommendations.push({
          ...item,
          category,
          type: category.slice(0, -1) // Remove 's' from plural
        });
      });
    });

    // Use Gemini AI to provide personalized recommendations
    const recommendationPrompt = `${SYSTEM_PROMPT}

Based on the following preferences, provide personalized beverage recommendations from the Nauti Bouys menu:

Preferences: ${JSON.stringify(preferences)}
Occasion: ${occasion || 'casual'}
Mood: ${mood || 'relaxed'}
Exclude Alcohol: ${excludeAlcohol}

Available beverages: ${JSON.stringify(recommendations)}

Please provide 3-5 specific recommendations with brief explanations of why each would be perfect for the user's preferences, occasion, and mood. Format as a friendly, conversational response.`;

    const model = getOptimalModel('chat', 'medium');
    const result = await model.generateContent(recommendationPrompt);
    const aiRecommendations = result.response.text();

    res.json({
      success: true,
      recommendations: recommendations.slice(0, 6), // Top 6 items
      aiRecommendations,
      filters: {
        preferences,
        occasion,
        mood,
        excludeAlcohol
      }
    });

  } catch (error) {
    console.error('IA Recommend error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating recommendations'
    });
  }
});

// @route   POST /api/ia/recipe
// @desc    Get cocktail recipe and instructions
// @access  Private
router.post('/recipe', [
  auth,
  body('cocktailName').trim().isLength({ min: 1, max: 100 }).withMessage('Cocktail name is required'),
  body('customization').optional().isString().withMessage('Customization must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { cocktailName, customization } = req.body;

    // Try to find the cocktail in our database first
    const cocktail = await Cocktail.findOne({
      name: { $regex: cocktailName, $options: 'i' }
    }).lean();

    let recipePrompt;
    if (cocktail) {
      recipePrompt = `Provide detailed mixing instructions for the ${cocktail.name} cocktail from our menu:

Ingredients: ${JSON.stringify(cocktail.ingredients)}
Instructions: ${cocktail.instructions}
Glass: ${cocktail.glassType}
Garnish: ${cocktail.garnish || 'None specified'}
Difficulty: ${cocktail.difficulty}

${customization ? `Customer customization request: ${customization}` : ''}

Please provide step-by-step instructions in a friendly, professional bartender tone, including any tips for the perfect preparation.`;
    } else {
      recipePrompt = `The customer is asking for a recipe for "${cocktailName}" which isn't currently on our Nauti Bouys menu. 

${customization ? `They also mentioned: ${customization}` : ''}

Please provide a classic recipe for this cocktail if it exists, or suggest a similar cocktail from our menu that might satisfy their request. Be helpful and friendly, and mention that while this specific cocktail isn't on our current menu, you can provide the recipe and our bartenders might be able to make it if we have the ingredients.`;
    }

    const fullRecipePrompt = `${SYSTEM_PROMPT}

${recipePrompt}`;

    const model = getOptimalModel('chat', 'medium');
    const result = await model.generateContent(fullRecipePrompt);
    const recipe = result.response.text();

    res.json({
      success: true,
      cocktailName,
      recipe,
      fromMenu: !!cocktail,
      cocktailData: cocktail || null
    });

  } catch (error) {
    console.error('IA Recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting recipe'
    });
  }
});

// @route   GET /api/ia/status
// @desc    Get IA service status
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    // Check if Gemini API key is configured
    const hasApiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here';
    
    // Test API connection with a simple request
    let apiStatus = 'unknown';
    if (hasApiKey) {
      try {
        const model = getOptimalModel('simple', 'low');
        const result = await model.generateContent('Hello');
        const response = result.response.text();
        apiStatus = response ? 'connected' : 'error';
      } catch (error) {
        apiStatus = 'error';
        console.error('Gemini API test failed:', error.message);
      }
    } else {
      apiStatus = 'not_configured';
    }

    res.json({
      success: true,
      status: {
        service: 'Nauti Bouys Intelligent Assistant',
        version: '2.0.0',
        aiProvider: 'Google Gemini 2.5 Flash',
        apiConfigured: hasApiKey,
        apiStatus,
        models: {
          primary: 'gemini-2.5-flash',
          efficient: 'gemini-2.5-flash-lite',
          advanced: 'gemini-2.5-pro'
        },
        features: [
          'Advanced thinking capabilities',
          'Chat conversations with 1M token context',
          'Personalized beverage recommendations',
          'Recipe instructions',
          'Event information',
          'Emotional intelligence',
          'Patron memory system',
          'Real-time inventory integration'
        ],
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('IA Status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking IA status'
    });
  }
});

// @route   POST /api/ia/session/start
// @desc    Start enhanced conversation session with patron profiling
// @access  Private
router.post('/session/start', [
  auth,
  body('userId').optional().isMongoId().withMessage('Invalid user ID'),
  body('features').optional().isArray().withMessage('Features must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId, features = [] } = req.body;
    const sessionId = `session_${Date.now()}_${req.user.id}`;

    // Check for existing patron profile
    let existingSession = null;
    if (userId) {
      existingSession = await ConversationSession.findOne({
        userId: userId,
        isActive: false
      }).sort({ 'sessionMetadata.startTime': -1 });
    }

    // Create new session with patron profile
    const newSession = new ConversationSession({
      sessionId,
      userId: userId || req.user.id,
      patronProfile: existingSession ? existingSession.patronProfile : {
        beveragePreferences: {},
        favoriteBeverages: [],
        emotionalProfile: {
          emotionHistory: [],
          emotionTrends: new Map()
        },
        communicationStyle: {
          preferredLength: 'moderate',
          formality: 'friendly',
          interests: []
        },
        personalNotes: {
          specialOccasions: [],
          dietaryRestrictions: [],
          allergies: [],
          celebrations: []
        }
      },
      sessionMetadata: {
        platform: 'web',
        features: features,
        startTime: new Date()
      }
    });

    await newSession.save();

    // Add welcome message
    newSession.addMessage(
      "Welcome to Nauti Bouys! I'm your AI bartender and concierge. I can help you discover amazing beverages, make personalized recommendations, and even remember your favorites for future visits. How can I make your experience exceptional today?",
      'assistant',
      { confidence: 1.0 }
    );

    await newSession.save();

    res.json({
      success: true,
      sessionId: sessionId,
      patronProfile: newSession.patronProfile,
      features: features
    });

  } catch (error) {
    console.error('Session start error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start session'
    });
  }
});

// @route   POST /api/ia/chat/contextual
// @desc    Enhanced chat with emotional intelligence and memory
// @access  Private
router.post('/chat/contextual', [
  auth,
  body('message').trim().isLength({ min: 1, max: 1500 }).withMessage('Message required (max 1500 chars)'),
  body('sessionId').isString().withMessage('Session ID required'),
  body('context').optional().isObject().withMessage('Context must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { message, sessionId, context = {} } = req.body;

    // Get conversation session
    const session = await ConversationSession.findOne({ sessionId, isActive: true });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or expired'
      });
    }

    // Get current user info
    const user = await User.findById(req.user.id);

    // Build enhanced context with patron profile and emotional state
    const enhancedContext = {
      patron: {
        name: user.fullName,
        profile: session.patronProfile,
        currentEmotion: context.emotionalState?.primary || 'neutral',
        emotionalConfidence: context.emotionalState?.confidence || 0,
        inputMode: context.inputMode || 'text'
      },
      conversation: {
        messageCount: session.messages.length,
        recentMessages: session.messages.slice(-5).map(m => ({
          type: m.type,
          content: m.content.substring(0, 200),
          timestamp: m.timestamp
        }))
      },
      timeContext: {
        currentTime: new Date(),
        timeOfDay: new Date().getHours() < 12 ? 'morning' : 
                   new Date().getHours() < 17 ? 'afternoon' : 'evening',
        dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' })
      }
    };

    // Get available beverages for recommendations
    const [cocktails, spirits, wines, beers, mocktails, nonAlcoholic] = await Promise.all([
      Cocktail.find({ isAvailable: true }).sort({ averageRating: -1 }).limit(10).lean(),
      Spirit.find({ isAvailable: true }).sort({ averageRating: -1 }).limit(10).lean(),
      Wine.find({ isAvailable: true }).sort({ averageRating: -1 }).limit(10).lean(),
      Beer.find({ isAvailable: true }).sort({ averageRating: -1 }).limit(10).lean(),
      Mocktail.find({ isAvailable: true }).sort({ averageRating: -1 }).limit(10).lean(),
      OtherNonAlcoholic.find({ isAvailable: true }).sort({ averageRating: -1 }).limit(10).lean()
    ]);

    // Build comprehensive prompt with emotional intelligence
    const contextualPrompt = `PATRON CONTEXT:
Name: ${enhancedContext.patron.name}
Current Emotion: ${enhancedContext.patron.currentEmotion} (${Math.round(enhancedContext.patron.emotionalConfidence * 100)}% confidence)
Time: ${enhancedContext.timeContext.timeOfDay} on ${enhancedContext.timeContext.dayOfWeek}

PATRON PROFILE:
Favorite Beverages: ${session.patronProfile.favoriteBeverages?.map(b => b.name).join(', ') || 'None recorded yet'}
Communication Style: ${session.patronProfile.communicationStyle?.formality || 'friendly'}
Past Interests: ${session.patronProfile.communicationStyle?.interests?.join(', ') || 'Learning...'}

RECENT CONVERSATION:
${enhancedContext.conversation.recentMessages.map(m => `${m.type}: ${m.content}`).join('\n')}

AVAILABLE BEVERAGES SUMMARY:
Top Cocktails: ${cocktails.slice(0, 5).map(c => `${c.name} (${c.description?.substring(0, 50) || 'Premium cocktail'})`).join(', ')}
Top Spirits: ${spirits.slice(0, 3).map(s => `${s.brand} ${s.name} ${s.type}`).join(', ')}
Top Wines: ${wines.slice(0, 3).map(w => `${w.winery} ${w.name} (${w.vintage || 'Current'}) - ${w.type}`).join(', ')}
Current Specials: Available for recommendations

PATRON'S MESSAGE: "${message}"

INSTRUCTIONS:
1. Respond appropriately to their emotional state
2. Reference their preferences and past conversations naturally
3. Be creative in exploring new options based on their profile
4. Learn from their response to improve future recommendations
5. Use warm, professional maritime-themed language
6. Suggest specific beverages from our available selection when appropriate
7. Ask follow-up questions to better understand their preferences`;

    // Generate response with Gemini 2.5 Pro for complex contextual understanding
    const fullContextualPrompt = `${SYSTEM_PROMPT}

${contextualPrompt}`;

    const model = getOptimalModel('chat', 'high'); // Use Pro for complex contextual chat
    const result = await model.generateContent(fullContextualPrompt);
    const aiResponse = result.response.text();

    // Analyze response for learning opportunities
    const recommendedActions = [];
    if (aiResponse.toLowerCase().includes('recommend')) {
      recommendedActions.push('learn:interested_in_recommendations');
    }
    if (message.toLowerCase().includes('favorite') || message.toLowerCase().includes('love')) {
      recommendedActions.push('learn:expressed_preference');
    }
    if (context.emotionalState?.primary && context.emotionalState.primary !== 'neutral') {
      recommendedActions.push(`learn:emotional_state_${context.emotionalState.primary}`);
    }

    // Store messages in session
    session.addMessage(message, 'user', {
      emotionalState: context.emotionalState,
      inputMode: context.inputMode
    });
    
    session.addMessage(aiResponse, 'assistant', {
      confidence: 0.9,
      recommendedActions
    });

    await session.save();

    res.json({
      success: true,
      response: aiResponse,
      confidence: 0.9,
      recommendedActions,
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Contextual chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process contextual chat'
    });
  }
});

// @route   POST /api/ia/patron/preferences
// @desc    Update patron beverage preferences
// @access  Private
router.post('/patron/preferences', [
  auth,
  body('sessionId').isString().withMessage('Session ID required'),
  body('preferences').isObject().withMessage('Preferences object required')
], async (req, res) => {
  try {
    const { sessionId, preferences } = req.body;

    const session = await ConversationSession.findOne({ sessionId, isActive: true });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Update preferences by category
    Object.keys(preferences).forEach(category => {
      session.updateBeveragePreferences(category, preferences[category]);
    });

    await session.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      updatedPreferences: session.patronProfile.beveragePreferences
    });

  } catch (error) {
    console.error('Preference update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences'
    });
  }
});

// @route   POST /api/ia/patron/favorites/add
// @desc    Add beverage to patron's favorites
// @access  Private
router.post('/patron/favorites/add', [
  auth,
  body('sessionId').isString().withMessage('Session ID required'),
  body('beverage').isObject().withMessage('Beverage object required'),
  body('beverage.id').isString().withMessage('Beverage ID required'),
  body('beverage.name').isString().withMessage('Beverage name required'),
  body('beverage.category').isString().withMessage('Beverage category required')
], async (req, res) => {
  try {
    const { sessionId, beverage } = req.body;

    const session = await ConversationSession.findOne({ sessionId, isActive: true });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.addFavoriteBeverage(beverage);
    await session.save();

    res.json({
      success: true,
      message: 'Beverage added to favorites',
      favoriteBeverages: session.patronProfile.favoriteBeverages
    });

  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add favorite beverage'
    });
  }
});

// @route   POST /api/ia/recommendations/personalized
// @desc    Get AI-powered personalized beverage recommendations
// @access  Private
router.post('/recommendations/personalized', [
  auth,
  body('sessionId').isString().withMessage('Session ID required'),
  body('context').optional().isObject().withMessage('Context must be an object')
], async (req, res) => {
  try {
    const { sessionId, context = {} } = req.body;

    const session = await ConversationSession.findOne({ sessionId, isActive: true });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Get comprehensive beverage data
    const allBeverages = await Promise.all([
      Cocktail.find({ isAvailable: true }).lean(),
      Spirit.find({ isAvailable: true }).lean(),
      Wine.find({ isAvailable: true }).lean(),
      Beer.find({ isAvailable: true }).lean(),
      Mocktail.find({ isAvailable: true }).lean(),
      OtherNonAlcoholic.find({ isAvailable: true }).lean()
    ]);

    const flatBeverages = allBeverages.flat();

    // Build recommendation prompt
    const recommendationPrompt = `PERSONALIZED RECOMMENDATION REQUEST

PATRON PROFILE:
Favorite Beverages: ${JSON.stringify(session.patronProfile.favoriteBeverages)}
Beverage Preferences: ${JSON.stringify(session.patronProfile.beveragePreferences)}
Emotional Profile: ${JSON.stringify(session.patronProfile.emotionalProfile)}

CURRENT CONTEXT:
Occasion: ${context.occasion || 'casual visit'}
Current Mood: ${context.emotionalState?.primary || 'neutral'}
Time of Day: ${context.timeOfDay || 'evening'}
Special Requests: ${context.specialRequests || 'none'}

AVAILABLE BEVERAGES: ${JSON.stringify(flatBeverages.slice(0, 20))}

Please provide 3-5 personalized beverage recommendations that:
1. Match the patron's known preferences and favorites
2. Are appropriate for their current mood and occasion
3. Introduce creative new options based on their taste profile
4. Include specific reasoning for each recommendation
5. Consider their emotional state and time of day

Format as a friendly, enthusiastic response with specific drink names and reasons.`;

    const fullRecommendationPrompt = `${SYSTEM_PROMPT}

${recommendationPrompt}`;

    const model = getOptimalModel('chat', 'high'); // Use Pro for complex personalized recommendations
    const result = await model.generateContent(fullRecommendationPrompt);
    const recommendations = result.response.text();

    // Log recommendation for learning
    session.addMessage('Requested personalized recommendations', 'system', {
      context: context,
      recommendationsGenerated: true
    });
    
    await session.save();

    res.json({
      success: true,
      recommendations: flatBeverages.slice(0, 6),
      reasoning: recommendations,
      context: context
    });

  } catch (error) {
    console.error('Personalized recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate personalized recommendations'
    });
  }
});

// @route   POST /api/ia/conversation/store
// @desc    Store conversation message
// @access  Private
router.post('/conversation/store', [
  auth,
  body('sessionId').isString().withMessage('Session ID required'),
  body('message').isString().withMessage('Message required'),
  body('type').isIn(['user', 'assistant', 'system']).withMessage('Valid type required')
], async (req, res) => {
  try {
    const { sessionId, message, type, metadata = {} } = req.body;

    const session = await ConversationSession.findOne({ sessionId, isActive: true });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.addMessage(message, type, metadata);
    await session.save();

    res.json({
      success: true,
      message: 'Message stored successfully'
    });

  } catch (error) {
    console.error('Store message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to store message'
    });
  }
});

// @route   POST /api/ia/session/end
// @desc    End conversation session and save patron profile
// @access  Private
router.post('/session/end', [
  auth,
  body('sessionId').isString().withMessage('Session ID required')
], async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await ConversationSession.findOne({ sessionId, isActive: true });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.endSession();
    await session.save();

    res.json({
      success: true,
      message: 'Session ended successfully',
      summary: session.conversationSummary
    });

  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end session'
    });
  }
});

// @route   GET /api/ia/conversation/history
// @desc    Get conversation history for session
// @access  Private
router.get('/conversation/history', [
  auth
], async (req, res) => {
  try {
    const { sessionId, limit = 50 } = req.query;

    const session = await ConversationSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const history = session.messages
      .slice(-limit)
      .map(m => ({
        content: m.content,
        type: m.type,
        timestamp: m.timestamp,
        emotionalState: m.metadata?.emotionalState?.primary
      }));

    res.json({
      success: true,
      history,
      sessionInfo: {
        sessionId: session.sessionId,
        startTime: session.sessionMetadata.startTime,
        messageCount: session.messages.length,
        patronProfile: session.patronProfile
      }
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation history'
    });
  }
});

module.exports = router;
