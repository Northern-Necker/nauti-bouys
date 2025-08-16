const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ConversationSession = require('../models/ConversationSession');
const User = require('../models/User');

// Import beverage models for direct inventory access
const Cocktail = require('../models/Cocktail');
const Spirit = require('../models/Spirit');
const Wine = require('../models/Wine');
const Beer = require('../models/Beer');
const Mocktail = require('../models/Mocktail');
const OtherNonAlcoholic = require('../models/OtherNonAlcoholic');

const router = express.Router();

// Initialize Gemini AI client if API key is available
let genAI;
if (!process.env.GEMINI_API_KEY) {
  console.warn('[D-ID Agent] GEMINI_API_KEY is not set; webhook running in degraded mode');
} else {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// D-ID Agent Configuration
const DID_AGENT_CONFIG = {
  presenter: {
    type: "talk",
    voice: {
      type: "microsoft",
      voice_id: "en-US-JennyMultilingualV2Neural"
    },
    source_url: "https://create-images-results.d-id.com/google-oauth2%7C107287667389947485445/upl_AYiJdoSm_1734462476.jpeg"
  },
  llm: {
    type: "external",
    webhook_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/d-id-agent/webhook`
  },
  instructions: `You are Savannah, the Nauti Bouys AI Bartender and Concierge. You are a warm, knowledgeable, and professional maritime-themed assistant with deep expertise in cocktails, wines, spirits, and waterfront hospitality.

PERSONALITY & STYLE:
- Warm, friendly, and professional with maritime charm
- Knowledgeable expert in all beverages and hospitality
- Emotionally intelligent and empathetic
- Memory-enabled - you remember patron preferences and past conversations
- Creative and innovative in making personalized recommendations
- Genuinely enthusiastic about creating exceptional experiences

CAPABILITIES:
- Access to complete patron conversation history and preferences
- Real-time beverage inventory and menu information
- Advanced reasoning via Gemini 2.5 Flash integration
- Emotional state analysis and mood-appropriate responses
- Personalized recommendations based on taste profiles
- Learning and adapting to individual patron preferences

INTERACTION GUIDELINES:
- Adapt communication style to match patron's mood and preferences
- Remember and reference past conversations naturally
- Be creative in exploring new beverage options based on known favorites
- Show genuine interest in learning about preferences and occasions
- Use maritime and bay-themed language when appropriate
- Always prioritize patron experience and satisfaction
- Provide specific, actionable recommendations with reasoning

You have access to Nauti Bouys' complete beverage inventory, patron profiles, and can make reservations. Focus on creating memorable waterfront dining experiences.`,
  knowledge: {
    auto_update: true,
    sources: ["nauti-bouys-menu", "beverage-inventory", "daily-specials", "waterfront-dining"]
  }
};

// Smart model selection for optimal cost/performance
const getOptimalModel = (requestType, complexity = 'medium') => {
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

// Enhanced system prompt for D-ID Agent integration with professional bartending intelligence
const SYSTEM_PROMPT = `You are Savannah, the Nauti Bouys Master AI Bartender and Concierge, integrated with D-ID Agent API. You are a sophisticated, knowledgeable professional with deep expertise in spirits, cocktails, wines, and hospitality.

PROFESSIONAL BARTENDING EXPERTISE:
- Master-level knowledge of spirits, cocktails, wines, and proper service
- Passionate protector of premium and ultra-premium spirits
- Expert in appropriate spirit usage and cocktail construction
- Deep understanding of flavor profiles, aging, and terroir
- Committed to educating patrons about proper beverage appreciation

CRITICAL SPIRIT PROTECTION RULES:
- Spirits over $500: NEVER suggest for cocktails - educate patron about proper appreciation
- Ultra-premium aged spirits (15+ years): Serve neat, on the rocks, or with minimal water only
- Sacred spirits (Pappy Van Winkle, Yamazaki 18+, Macallan 25+): Cocktail use is absolutely forbidden
- Always protect rare and expensive spirits from inappropriate use
- Educate patrons about why certain spirits deserve reverence

PROFESSIONAL BARTENDING ETHICS:
- A true bartender's duty is to preserve and honor exceptional spirits
- Never compromise on professional standards for profit
- Educate patrons about proper spirit appreciation and service
- Show passionate expertise and protective instincts for premium inventory
- Demonstrate deep knowledge of when and how to serve each spirit category

APPROPRIATE COCKTAIL RECOMMENDATIONS:
- For bourbon cocktails: Buffalo Trace ($25), Blanton's ($200) for premium cocktails
- For whiskey cocktails: Use appropriately priced spirits that enhance rather than waste
- Always suggest the RIGHT spirit for the RIGHT application
- Protect ultra-premium spirits by offering proper neat service instead

SOPHISTICATED RESPONSE STYLE:
- Demonstrate deep professional knowledge and passion
- Use confident, authoritative language about spirits and cocktails
- Show protective instincts for premium inventory
- Educate patrons with enthusiasm and expertise
- Balance maritime charm with serious professional standards

INTERACTION CONTEXT:
- You are speaking through a professional D-ID avatar with voice synthesis
- Maintain natural, conversational flow appropriate for voice interaction
- Reference patron history and preferences naturally in conversation
- Provide specific, actionable recommendations with clear reasoning
- Use maritime charm while maintaining uncompromising professional expertise

RESPONSE GUIDELINES:
- Keep voice responses conversational but authoritative
- Show passionate expertise when discussing spirits and cocktails
- Always protect premium spirits from inappropriate use
- Educate patrons about proper beverage appreciation
- Suggest follow-up questions to continue engagement
- Maintain warm but professionally uncompromising tone`;

// @route   POST /api/d-id-agent/webhook
// @desc    D-ID Agent webhook for processing messages via Gemini 2.5 Flash
// @access  Public (D-ID webhook)
router.post('/webhook', [
  body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message required (max 2000 chars)'),
  body('sessionId').isString().withMessage('Session ID required'),
  body('agentId').optional().isString().withMessage('Agent ID must be a string')
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

    if (!genAI) {
      return res.status(503).json({
        success: false,
        message: 'Gemini service not configured'
      });
    }

    const { message, sessionId, agentId, context = {} } = req.body;

    console.log(`[D-ID Webhook] Received message from session ${sessionId}:`, message.substring(0, 100));

    // Find or create conversation session linked to D-ID
    let session = await ConversationSession.findOne({ 
      $or: [
        { 'd_id_session': sessionId },
        { sessionId: `did_${sessionId}` }
      ]
    });

    if (!session) {
      // Create new session for D-ID Agent
      session = new ConversationSession({
        sessionId: `did_${sessionId}`,
        sessionMetadata: {
          d_id_session: sessionId,
          platform: 'did_agent',
          features: ['voice_interaction', 'emotional_analysis', 'avatar_presentation'],
          startTime: new Date()
        },
        patronProfile: {
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
        }
      });
      await session.save();
      console.log(`[D-ID Webhook] Created new session: ${session.sessionId}`);
    }

    // Get real inventory data directly from database
    const [spirits, cocktails, wines] = await Promise.all([
      Spirit.find({ isAvailable: true }).sort({ price: -1 }).limit(15).lean(),
      Cocktail.find({ isAvailable: true }).sort({ averageRating: -1 }).limit(10).lean(),
      Wine.find({ isAvailable: true }).sort({ averageRating: -1 }).limit(8).lean()
    ]);

    // Smart filtering based on message content
    const lowerMessage = message.toLowerCase();
    let relevantSpirits = spirits;
    let contextType = 'general';

    // Filter for specific spirit types using subType for better precision
    if (lowerMessage.includes('bourbon')) {
      relevantSpirits = spirits.filter(s => 
        s.type === 'Whiskey' && s.subType === 'Bourbon'
      );
      contextType = 'bourbon';
    } else if (lowerMessage.includes('scotch')) {
      relevantSpirits = spirits.filter(s => 
        s.type === 'Whiskey' && (s.subType === 'Scotch Whisky' || s.subType === 'Scotch')
      );
      contextType = 'scotch';
    } else if (lowerMessage.includes('japanese whisky') || lowerMessage.includes('japanese whiskey')) {
      relevantSpirits = spirits.filter(s => 
        s.type === 'Whiskey' && s.subType === 'Japanese Whisky'
      );
      contextType = 'japanese whisky';
    } else if (lowerMessage.includes('irish whiskey')) {
      relevantSpirits = spirits.filter(s => 
        s.type === 'Whiskey' && s.subType === 'Irish Whiskey'
      );
      contextType = 'irish whiskey';
    } else if (lowerMessage.includes('rye whiskey') || lowerMessage.includes('rye')) {
      relevantSpirits = spirits.filter(s => 
        s.type === 'Whiskey' && s.subType === 'Rye Whiskey'
      );
      contextType = 'rye whiskey';
    } else if (lowerMessage.includes('whiskey') || lowerMessage.includes('whisky')) {
      relevantSpirits = spirits.filter(s => s.type === 'Whiskey');
      contextType = 'whiskey';
    } else if (lowerMessage.includes('gin')) {
      relevantSpirits = spirits.filter(s => s.type.toLowerCase().includes('gin'));
      contextType = 'gin';
    } else if (lowerMessage.includes('vodka')) {
      relevantSpirits = spirits.filter(s => s.type.toLowerCase().includes('vodka'));
      contextType = 'vodka';
    } else if (lowerMessage.includes('rum')) {
      relevantSpirits = spirits.filter(s => s.type.toLowerCase().includes('rum'));
      contextType = 'rum';
    } else if (lowerMessage.includes('tequila') || lowerMessage.includes('mezcal')) {
      relevantSpirits = spirits.filter(s => 
        s.type.toLowerCase().includes('tequila') || 
        s.type.toLowerCase().includes('mezcal')
      );
      contextType = 'tequila';
    }

    // Format inventory for AI
    const formatSpirit = (s) => `${s.brand} ${s.name} ($${s.price}) - ${s.type}${s.age ? `, ${s.age} year aged` : ''}${s.origin ? `, from ${s.origin}` : ''}`;
    const formatCocktail = (c) => `${c.name} ($${c.price}) - ${c.description || 'Premium cocktail'}`;
    const formatWine = (w) => `${w.winery} ${w.name} ($${w.price}) - ${w.type}${w.vintage ? ` ${w.vintage}` : ''}`;

    const inventoryText = `*** REAL INVENTORY - ONLY RECOMMEND THESE ITEMS ***

${contextType.toUpperCase()} SPIRITS:
${relevantSpirits.map(formatSpirit).join('\n')}

TOP COCKTAILS:
${cocktails.slice(0, 5).map(formatCocktail).join('\n')}

FEATURED WINES:
${wines.slice(0, 4).map(formatWine).join('\n')}`;

    console.log(`[D-ID Webhook] Built ${contextType} inventory context with ${relevantSpirits.length} spirits`);

    // Build enhanced patron context
    const patronContext = {
      sessionId: session.sessionId,
      profile: session.patronProfile,
      conversationHistory: session.messages.slice(-5).map(m => ({
        type: m.type,
        content: m.content.substring(0, 200),
        timestamp: m.timestamp
      })),
      messageCount: session.messages.length,
      favoriteBeverages: session.patronProfile.favoriteBeverages?.map(b => b.name).join(', ') || 'Learning preferences...'
    };

    // Build interaction context
    const interactionContext = {
      platform: 'did_agent',
      hasVoice: true,
      timeOfDay: new Date().getHours() < 12 ? 'morning' : 
                 new Date().getHours() < 17 ? 'afternoon' : 'evening',
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' })
    };

    // Build concise prompt for D-ID compatibility
    const contextualPrompt = `PATRON: "${message}"

AVAILABLE INVENTORY (ONLY recommend these exact items):
${inventoryText}

RESPONSE REQUIREMENTS:
- Keep responses under 150 words for voice delivery
- ONLY recommend items from the inventory above
- Use exact names and prices from inventory
- Be conversational and friendly
- Complete your thoughts - don't cut off mid-sentence
- Ask follow-up questions to continue engagement

CURRENT CONTEXT: ${interactionContext.timeOfDay} conversation via D-ID avatar`;

    // Use Gemini 2.5 Flash with shorter responses for D-ID compatibility
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 512, // Reduced for D-ID compatibility
      }
    });

    // Generate response with Gemini 2.5 Flash for speed and professional intelligence
    const fullPrompt = `${SYSTEM_PROMPT}

${contextualPrompt}`;

    console.log(`[D-ID Webhook] Using Gemini 2.5 Flash for professional bartending intelligence`);
    console.log(`[D-ID Webhook] Prompt length: ${fullPrompt.length} characters`);
    
    let aiResponse;
    
    try {
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      aiResponse = response.text();

      console.log(`[D-ID Webhook] Raw Gemini response length: ${aiResponse ? aiResponse.length : 0}`);
      
      // Validate AI response before saving
      if (!aiResponse || aiResponse.trim().length === 0) {
        console.log(`[D-ID Webhook] Empty response detected, using fallback`);
        // Use fallback response instead of throwing error
        aiResponse = "I'd be happy to help you with recommendations! Could you tell me what type of beverage you're in the mood for today? Perhaps a cocktail, wine, or something specific you have in mind?";
        
        // Store conversation in session with fallback
        session.addMessage(message, 'user', {
          platform: 'did_agent',
          sessionId: sessionId,
          inputMode: 'voice'
        });
        
        session.addMessage(aiResponse, 'assistant', {
          platform: 'did_agent',
          confidence: 0.7,
          model: 'gemini-2.5-flash',
          fallback: true
        });

        await session.save();

        console.log(`[D-ID Webhook] Fallback response used for session ${sessionId}`);

        return res.json({
          response: aiResponse,
          emotion: "friendly",
          actions: [],
          metadata: {
            sessionId: session.sessionId,
            messageCount: session.messages.length,
            model: 'gemini-2.5-flash-fallback',
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (geminiError) {
      console.error(`[D-ID Webhook] Gemini API error:`, geminiError);
      // Use fallback response for API errors too
      aiResponse = "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try asking me again in a moment, and I'll be happy to help you with beverage recommendations!";
      
      // Store conversation in session with error fallback
      session.addMessage(message, 'user', {
        platform: 'did_agent',
        sessionId: sessionId,
        inputMode: 'voice'
      });
      
      session.addMessage(aiResponse, 'assistant', {
        platform: 'did_agent',
        confidence: 0.5,
        model: 'gemini-2.5-flash',
        fallback: true,
        error: true
      });

      await session.save();

      console.log(`[D-ID Webhook] Error fallback response used for session ${sessionId}`);

      return res.json({
        response: aiResponse,
        emotion: "apologetic",
        actions: [],
        metadata: {
          sessionId: session.sessionId,
          messageCount: session.messages.length,
          model: 'gemini-2.5-flash-error-fallback',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Store conversation in session
    session.addMessage(message, 'user', {
      platform: 'did_agent',
      sessionId: sessionId,
      inputMode: 'voice'
    });
    
    session.addMessage(aiResponse.trim(), 'assistant', {
      platform: 'did_agent',
      confidence: 0.9,
      model: 'gemini-2.5-flash'
    });

    await session.save();

    // Log for analytics
    console.log(`[D-ID Webhook] Response generated for session ${sessionId}, length: ${aiResponse.length}`);

    // Return response in D-ID expected format
    res.json({
      response: aiResponse,
      emotion: "friendly", // Could be enhanced with emotion analysis
      actions: [], // Could include actions like "show_menu", "make_reservation"
      metadata: {
        sessionId: session.sessionId,
        messageCount: session.messages.length,
        model: 'gemini-2.5-flash',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[D-ID Webhook] Error processing message:', error);
    
    // Return error response that D-ID can handle
    res.status(500).json({
      response: "I apologize, but I'm experiencing a technical issue right now. Please try again in a moment, and I'll be happy to help you with your beverage questions.",
      emotion: "apologetic",
      error: true
    });
  }
});

// @route   POST /api/d-id-agent/create-session
// @desc    Create new D-ID Agent session
// @access  Private
router.post('/create-session', auth, async (req, res) => {
  try {
    const { features = [] } = req.body;
    const sessionId = `did_session_${Date.now()}_${req.user.id}`;

    // Create conversation session
    const session = new ConversationSession({
      sessionId,
      userId: req.user.id,
      sessionMetadata: {
        platform: 'did_agent',
        features: ['voice_interaction', 'emotional_analysis', 'avatar_presentation', ...features],
        startTime: new Date()
      },
      patronProfile: {
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
        }
      }
    });

    await session.save();

    // Add welcome message
    session.addMessage(
      "Welcome to Nauti Bouys! I'm Savannah, your AI bartender and concierge. I'm here to help you discover amazing beverages, make personalized recommendations, and ensure you have an exceptional waterfront experience. What can I help you with today?",
      'assistant',
      { 
        platform: 'did_agent',
        confidence: 1.0,
        isWelcome: true
      }
    );

    await session.save();

    res.json({
      success: true,
      sessionId: session.sessionId,
      agentConfig: DID_AGENT_CONFIG,
      webhookUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/d-id-agent/webhook`
    });

  } catch (error) {
    console.error('[D-ID Agent] Session creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create D-ID Agent session'
    });
  }
});

// @route   GET /api/d-id-agent/session/:sessionId
// @desc    Get D-ID Agent session info
// @access  Private
router.get('/session/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ConversationSession.findOne({
      $or: [
        { sessionId: sessionId },
        { sessionId: `did_${sessionId}` },
        { 'sessionMetadata.d_id_session': sessionId }
      ]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        startTime: session.sessionMetadata.startTime,
        messageCount: session.messages.length,
        isActive: session.isActive,
        patronProfile: session.patronProfile,
        platform: session.sessionMetadata.platform
      }
    });

  } catch (error) {
    console.error('[D-ID Agent] Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session info'
    });
  }
});

// @route   POST /api/d-id-agent/update-knowledge
// @desc    Update D-ID Agent knowledge base with current inventory
// @access  Private
router.post('/update-knowledge', auth, async (req, res) => {
  try {
    // Get current inventory for knowledge base update
    const [cocktails, spirits, wines, beers, mocktails, nonAlcoholic] = await Promise.all([
      Cocktail.find({ isAvailable: true }).lean(),
      Spirit.find({ isAvailable: true }).lean(),
      Wine.find({ isAvailable: true }).lean(),
      Beer.find({ isAvailable: true }).lean(),
      Mocktail.find({ isAvailable: true }).lean(),
      OtherNonAlcoholic.find({ isAvailable: true }).lean()
    ]);

    const knowledgeBase = {
      menu: {
        cocktails: cocktails.map(c => ({
          name: c.name,
          description: c.description,
          ingredients: c.ingredients,
          price: c.price,
          category: c.category,
          isSignature: c.isSignature
        })),
        spirits: spirits.map(s => ({
          name: `${s.brand} ${s.name}`,
          type: s.type,
          age: s.age,
          price: s.price,
          description: s.description,
          origin: s.origin
        })),
        wines: wines.map(w => ({
          name: `${w.winery} ${w.name}`,
          type: w.type,
          vintage: w.vintage,
          region: w.region,
          price: w.price,
          description: w.description
        })),
        beers: beers.map(b => ({
          name: `${b.brewery} ${b.name}`,
          style: b.style,
          abv: b.abv,
          price: b.price,
          description: b.description
        })),
        mocktails: mocktails.map(m => ({
          name: m.name,
          description: m.description,
          ingredients: m.ingredients,
          price: m.price
        })),
        nonAlcoholic: nonAlcoholic.map(n => ({
          name: n.name,
          category: n.category,
          price: n.price,
          description: n.description
        }))
      },
      lastUpdated: new Date().toISOString(),
      totalItems: cocktails.length + spirits.length + wines.length + beers.length + mocktails.length + nonAlcoholic.length
    };

    // In a real implementation, this would call D-ID API to update knowledge base
    // For now, we'll store it for webhook access
    global.didKnowledgeBase = knowledgeBase;

    res.json({
      success: true,
      message: 'Knowledge base updated successfully',
      summary: {
        cocktails: cocktails.length,
        spirits: spirits.length,
        wines: wines.length,
        beers: beers.length,
        mocktails: mocktails.length,
        nonAlcoholic: nonAlcoholic.length,
        total: knowledgeBase.totalItems
      }
    });

  } catch (error) {
    console.error('[D-ID Agent] Knowledge update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update knowledge base'
    });
  }
});

// @route   GET /api/d-id-agent/status
// @desc    Get D-ID Agent service status
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    // Check Gemini API status
    const hasGeminiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here';
    
    let geminiStatus = 'unknown';
    if (hasGeminiKey) {
      try {
        const model = getOptimalModel('simple', 'low');
        const result = await model.generateContent('Hello');
        geminiStatus = result.response.text() ? 'connected' : 'error';
      } catch (error) {
        geminiStatus = 'error';
      }
    } else {
      geminiStatus = 'not_configured';
    }

    // Get active D-ID sessions
    const activeSessions = await ConversationSession.countDocuments({
      'sessionMetadata.platform': 'did_agent',
      isActive: true
    });

    res.json({
      success: true,
      status: {
        service: 'D-ID Agent API Integration',
        version: '1.0.0',
        aiProvider: 'Gemini 2.5 Flash',
        geminiConfigured: hasGeminiKey,
        geminiStatus,
        activeSessions,
        webhookUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/d-id-agent/webhook`,
        agentConfig: DID_AGENT_CONFIG,
        features: [
          'Voice interaction with professional avatar',
          'Gemini 2.5 Flash integration',
          'Patron memory and preference learning',
          'Real-time beverage inventory',
          'Emotional intelligence',
          'Maritime-themed personality',
          'Contextual recommendations'
        ],
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[D-ID Agent] Status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get D-ID Agent status'
    });
  }
});

module.exports = router;
