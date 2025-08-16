const { GoogleGenerativeAI } = require('@google/generative-ai');
const ConversationSession = require('../models/ConversationSession');
const User = require('../models/User');

// Import beverage models for inventory context
const Cocktail = require('../models/Cocktail');
const Spirit = require('../models/Spirit');
const Wine = require('../models/Wine');
const Beer = require('../models/Beer');
const Mocktail = require('../models/Mocktail');
const OtherNonAlcoholic = require('../models/OtherNonAlcoholic');
let NodeCache;
try {
  NodeCache = require('node-cache');
} catch (err) {
  // Fallback simple cache if node-cache isn't installed
  console.warn('node-cache module not found, using basic Map cache');
  NodeCache = class {
    constructor() { this.store = new Map(); }
    get(key) { return this.store.get(key); }
    set(key, value) { this.store.set(key, value); return true; }
  };
}

class DIDStreamingService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.didApiKey = process.env.DID_API_KEY || 'bWV0b3JiZXJ0QGdtYWlsLmNvbQ:JAn6hh4wQ2TFoOAl-GD4F';
    this.didBaseUrl = process.env.DID_BASE_URL || 'https://api.d-id.com';
    this.activeStreams = new Map(); // Track active D-ID streams

    // Initialize in-memory cache for inventory items
    this.cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 minute TTL
    this.cacheKeys = {
      spirits: 'spirits',
      cocktails: 'cocktails',
      wines: 'wines',
      beers: 'beers',
      mocktails: 'mocktails',
      nonAlcoholic: 'nonAlcoholic'
    };

    // Set up automatic cache refresh mechanisms
    this.startInventoryWatchers();
    this.startCacheRefreshInterval();
  }

  // Periodically refresh cache to keep data current
  startCacheRefreshInterval() {
    const intervalMs = 5 * 60 * 1000; // 5 minutes
    setInterval(() => {
      this.refreshInventoryCache().catch(err =>
        console.warn('[Cache] Refresh error:', err.message)
      );
    }, intervalMs);
  }

  // Watch for inventory changes and refresh cache when updates occur
  startInventoryWatchers() {
    const setupWatcher = (Model, key) => {
      try {
        Model.watch().on('change', () => {
          this.refreshCache(key).catch(err =>
            console.warn(`[Cache] ${key} watcher error:`, err.message)
          );
        });
      } catch (err) {
        // Change streams may not be available (e.g., non-replicaset)
        console.warn(`[Cache] Change streams not enabled for ${key}:`, err.message);
      }
    };

    setupWatcher(Spirit, this.cacheKeys.spirits);
    setupWatcher(Cocktail, this.cacheKeys.cocktails);
    setupWatcher(Wine, this.cacheKeys.wines);
    setupWatcher(Beer, this.cacheKeys.beers);
    setupWatcher(Mocktail, this.cacheKeys.mocktails);
    setupWatcher(OtherNonAlcoholic, this.cacheKeys.nonAlcoholic);
  }

  // Retrieve inventory data from cache or database
  async getCachedInventory(key) {
    let data = this.cache.get(key);
    if (!data) {
      data = await this.refreshCache(key);
    }
    return data;
  }

  // Refresh a specific cache entry from the database
  async refreshCache(key) {
    let data;
    switch (key) {
      case this.cacheKeys.spirits:
        data = await Spirit.find({ isAvailable: true })
          .sort({ price: -1 })
          .limit(15)
          .lean();
        break;
      case this.cacheKeys.cocktails:
        data = await Cocktail.find({ isAvailable: true })
          .sort({ averageRating: -1 })
          .limit(10)
          .lean();
        break;
      case this.cacheKeys.wines:
        data = await Wine.find({ isAvailable: true })
          .sort({ averageRating: -1 })
          .limit(8)
          .lean();
        break;
      case this.cacheKeys.beers:
        data = await Beer.find({ isAvailable: true })
          .sort({ averageRating: -1 })
          .limit(8)
          .lean();
        break;
      case this.cacheKeys.mocktails:
        data = await Mocktail.find({ isAvailable: true })
          .sort({ averageRating: -1 })
          .limit(8)
          .lean();
        break;
      case this.cacheKeys.nonAlcoholic:
        data = await OtherNonAlcoholic.find({ isAvailable: true })
          .sort({ averageRating: -1 })
          .limit(8)
          .lean();
        break;
      default:
        data = [];
    }
    this.cache.set(key, data);
    return data;
  }

  // Refresh all inventory caches
  async refreshInventoryCache() {
    await Promise.all([
      this.refreshCache(this.cacheKeys.spirits),
      this.refreshCache(this.cacheKeys.cocktails),
      this.refreshCache(this.cacheKeys.wines),
      this.refreshCache(this.cacheKeys.beers),
      this.refreshCache(this.cacheKeys.mocktails),
      this.refreshCache(this.cacheKeys.nonAlcoholic)
    ]);
  }

  // Smart model selection for optimal cost/performance
  getOptimalModel(complexity = 'medium') {
    if (complexity === 'low') {
      return this.genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite",
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
        }
      });
    }
    
    if (complexity === 'medium') {
      return this.genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.8,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 2048,
        }
      });
    }
    
    return this.genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 4096,
      }
    });
  }

  // Enhanced system prompt for D-ID Streaming integration
  getSystemPrompt() {
    return `You are Savannah, the Nauti Bouys Master AI Bartender and Concierge, speaking through a professional D-ID avatar with voice synthesis. You are a sophisticated, knowledgeable professional with deep expertise in spirits, cocktails, wines, and hospitality.

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

VOICE INTERACTION GUIDELINES:
- Keep responses conversational and natural for voice synthesis
- Use clear, engaging language that sounds natural when spoken
- Avoid overly long sentences that are hard to follow in audio
- Include natural pauses and emphasis for better speech delivery
- Reference patron history and preferences naturally in conversation
- Show passionate expertise when discussing spirits and cocktails

EMOTIONAL INTELLIGENCE:
- Adapt your tone to match the patron's mood and preferences
- Remember and reference past conversations naturally
- Be creative in exploring new beverage options based on known favorites
- Show genuine interest in learning about preferences and occasions
- Use maritime charm while maintaining professional standards

RESPONSE STYLE FOR AVATAR:
- Maintain natural, conversational flow appropriate for voice interaction
- Demonstrate deep professional knowledge with enthusiasm
- Show protective instincts for premium inventory
- Educate patrons with warmth and expertise
- Balance maritime charm with serious professional standards
- Keep responses engaging and personal for video avatar delivery`;
  }

  // Create D-ID stream session
  async createStream(avatarImageUrl = null) {
    try {
      // D-ID Streaming API ALWAYS requires source_url (not presenter_id)
      // Based on official documentation: https://docs.d-id.com/reference/talks-streams-overview
      
      // Use Alyssa (Red Suit Lobby) as your Savannah avatar - professional female perfect for bartender role
      // This is from your D-ID account and works perfectly with streaming API
      const defaultAvatarUrl = 'https://clips-presenters.d-id.com/v2/Alyssa_NoHands_RedSuite_Lobby/qtzjxMSwEa/ypTds_0CK3/image.png';
      const sourceUrl = avatarImageUrl || defaultAvatarUrl;

      console.log('[D-ID Streaming] Creating stream with source_url:', sourceUrl);

      const response = await fetch(`${this.didBaseUrl}/talks/streams`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.didApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_url: sourceUrl,
          stream_warmup: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`D-ID Stream Creation Failed: ${errorData.description || response.statusText}`);
      }

      const streamData = await response.json();
      console.log('[D-ID Streaming] Stream created successfully:', streamData.id);

      // Store stream info
      this.activeStreams.set(streamData.id, {
        id: streamData.id,
        sessionId: streamData.session_id,
        offer: streamData.offer,
        iceServers: streamData.ice_servers,
        createdAt: new Date(),
        status: 'created'
      });

      return streamData;

    } catch (error) {
      console.error('[D-ID Streaming] Create stream error:', error);
      throw error;
    }
  }

  // Start WebRTC connection with SDP answer
  async startStream(streamId, sdpAnswer, sessionId) {
    try {
      console.log('[D-ID Streaming] Starting stream:', streamId);

      const response = await fetch(`${this.didBaseUrl}/talks/streams/${streamId}/sdp`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.didApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answer: sdpAnswer,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`D-ID Stream Start Failed: ${errorData.description || response.statusText}`);
      }

      // Update stream status
      const streamInfo = this.activeStreams.get(streamId);
      if (streamInfo) {
        streamInfo.status = 'started';
        streamInfo.startedAt = new Date();
      }

      console.log('[D-ID Streaming] Stream started successfully');
      return await response.json();

    } catch (error) {
      console.error('[D-ID Streaming] Start stream error:', error);
      throw error;
    }
  }

  // Submit ICE candidate
  async submitIceCandidate(streamId, candidate, sessionId) {
    try {
      const response = await fetch(`${this.didBaseUrl}/talks/streams/${streamId}/ice`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.didApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        console.warn('[D-ID Streaming] ICE candidate submission failed:', response.statusText);
      }

    } catch (error) {
      console.warn('[D-ID Streaming] ICE candidate error:', error.message);
    }
  }

  // Process message with Gemini and create D-ID talk
  async processMessageAndCreateTalk(streamId, sessionId, message, userId = null) {
    try {
      console.log('[D-ID Streaming] Processing message:', message.substring(0, 100));

      // Find or create conversation session
      let conversationSession = await ConversationSession.findOne({ 
        $or: [
          { 'd_id_stream': streamId },
          { sessionId: `did_stream_${streamId}` }
        ]
      });

      if (!conversationSession) {
        conversationSession = new ConversationSession({
          sessionId: `did_stream_${streamId}`,
          userId: userId,
          sessionMetadata: {
            d_id_stream: streamId,
            d_id_session: sessionId,
            platform: 'did_streaming',
            features: ['voice_interaction', 'avatar_streaming', 'real_time'],
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
        await conversationSession.save();
      }

      // Get user context if available
      let userContext = { name: 'Valued Patron', role: 'guest' };
      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          userContext = {
            name: user.fullName,
            role: user.role,
            preferences: user.preferences || {}
          };
        }
      }

      // Get real inventory data (with caching)
      const [spirits, cocktails, wines] = await Promise.all([
        this.getCachedInventory(this.cacheKeys.spirits),
        this.getCachedInventory(this.cacheKeys.cocktails),
        this.getCachedInventory(this.cacheKeys.wines)
      ]);

      // Smart filtering based on message content
      const lowerMessage = message.toLowerCase();
      let relevantSpirits = spirits;
      let contextType = 'general';

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
      } else if (lowerMessage.includes('whiskey') || lowerMessage.includes('whisky')) {
        relevantSpirits = spirits.filter(s => s.type === 'Whiskey');
        contextType = 'whiskey';
      } else if (lowerMessage.includes('gin')) {
        relevantSpirits = spirits.filter(s => s.type.toLowerCase().includes('gin'));
        contextType = 'gin';
      }

      // Format inventory for AI
      const formatSpirit = (s) => `${s.brand} ${s.name} ($${s.price}) - ${s.type}${s.age ? `, ${s.age} year aged` : ''}`;
      const formatCocktail = (c) => `${c.name} ($${c.price}) - ${c.description || 'Premium cocktail'}`;
      const formatWine = (w) => `${w.winery} ${w.name} ($${w.price}) - ${w.type}${w.vintage ? ` ${w.vintage}` : ''}`;

      const inventoryText = `*** REAL INVENTORY - ONLY RECOMMEND THESE ITEMS ***

${contextType.toUpperCase()} SPIRITS:
${relevantSpirits.map(formatSpirit).join('\n')}

TOP COCKTAILS:
${cocktails.slice(0, 5).map(formatCocktail).join('\n')}

FEATURED WINES:
${wines.slice(0, 4).map(formatWine).join('\n')}`;

      // Build enhanced context
      const patronContext = {
        sessionId: conversationSession.sessionId,
        profile: conversationSession.patronProfile,
        conversationHistory: conversationSession.messages.slice(-5).map(m => ({
          type: m.type,
          content: m.content.substring(0, 200),
          timestamp: m.timestamp
        })),
        messageCount: conversationSession.messages.length,
        favoriteBeverages: conversationSession.patronProfile.favoriteBeverages?.map(b => b.name).join(', ') || 'Learning preferences...'
      };

      // Build comprehensive prompt
      const contextualPrompt = `PATRON CONTEXT:
Session: ${patronContext.sessionId}
Patron: ${userContext.name}
Conversation Messages: ${patronContext.messageCount}
Favorite Beverages: ${patronContext.favoriteBeverages}

RECENT CONVERSATION:
${patronContext.conversationHistory.map(m => `${m.type}: ${m.content}`).join('\n')}

${inventoryText}

CURRENT CONTEXT:
Platform: D-ID Streaming Avatar with voice synthesis
Interaction Mode: Real-time voice conversation
Time: ${new Date().toLocaleTimeString()}

PATRON MESSAGE: "${message}"

CRITICAL INSTRUCTIONS:
1. ONLY recommend items from the REAL INVENTORY above
2. NEVER create fictional items
3. Protect ultra-premium spirits (over $500) from cocktail use
4. Keep responses conversational and natural for voice delivery
5. Show passionate expertise and protective instincts for premium spirits
6. Educate patrons about proper beverage appreciation`;

      // Determine complexity for model selection
      const isComplex = message.length > 200 || 
                       lowerMessage.includes('recommend') || 
                       lowerMessage.includes('suggest');
      
      const complexity = isComplex ? 'medium' : 'low';
      const model = this.getOptimalModel(complexity);

      // Generate response with Gemini
      const fullPrompt = `${this.getSystemPrompt()}

${contextualPrompt}`;

      console.log('[D-ID Streaming] Using Gemini model:', complexity === 'low' ? 'flash-lite' : 'flash');
      const result = await model.generateContent(fullPrompt);
      const aiResponse = result.response.text();

      // Store conversation
      conversationSession.addMessage(message, 'user', {
        platform: 'did_streaming',
        streamId: streamId,
        inputMode: 'voice'
      });
      
      conversationSession.addMessage(aiResponse, 'assistant', {
        platform: 'did_streaming',
        confidence: 0.9,
        model: complexity === 'low' ? 'gemini-2.5-flash-lite' : 'gemini-2.5-flash'
      });

      // Persist conversation and create talk concurrently
      const [saveResult, talkResponse] = await Promise.all([
        conversationSession.save().then(() => ({ success: true })).catch(error => ({ success: false, error })),
        this.createTalk(streamId, sessionId, aiResponse)
      ]);

      if (!saveResult.success) {
        console.error('[D-ID Streaming] Conversation save error:', saveResult.error);
      } else {
        console.log('[D-ID Streaming] Conversation saved successfully');
      }

      console.log('[D-ID Streaming] Talk creation result:', talkResponse);

      return {
        aiResponse,
        talkResponse,
        conversationSession: conversationSession.sessionId,
        model: complexity === 'low' ? 'gemini-2.5-flash-lite' : 'gemini-2.5-flash',
        usage: {
          inputTokens: result.response.usageMetadata?.promptTokenCount || 0,
          outputTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: result.response.usageMetadata?.totalTokenCount || 0
        }
      };

    } catch (error) {
      console.error('[D-ID Streaming] Process message error:', error);
      throw error;
    }
  }

  // Create D-ID talk (send text to be spoken by avatar)
  async createTalk(streamId, sessionId, text) {
    try {
      console.log('[D-ID Streaming] Creating talk for stream:', streamId);

      const response = await fetch(`${this.didBaseUrl}/talks/streams/${streamId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.didApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          script: {
            type: 'text',
            input: text,
            provider: {
              type: 'microsoft',
              voice_id: 'en-US-JennyMultilingualV2Neural',
              voice_config: {
                style: 'Cheerful'
              }
            }
          },
          config: {
            stitch: true,
            fluent: true,
            pad_audio: 0.0
          },
          session_id: sessionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`D-ID Talk Creation Failed: ${errorData.description || response.statusText}`);
      }

      const talkData = await response.json();
      console.log('[D-ID Streaming] Talk created successfully');

      return talkData;

    } catch (error) {
      console.error('[D-ID Streaming] Create talk error:', error);
      throw error;
    }
  }

  // Close D-ID stream
  async closeStream(streamId, sessionId) {
    try {
      console.log('[D-ID Streaming] Closing stream:', streamId);

      const response = await fetch(`${this.didBaseUrl}/talks/streams/${streamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${this.didApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId
        })
      });

      if (!response.ok) {
        console.warn('[D-ID Streaming] Stream close warning:', response.statusText);
      }

      // Remove from active streams
      this.activeStreams.delete(streamId);

      console.log('[D-ID Streaming] Stream closed successfully');

    } catch (error) {
      console.error('[D-ID Streaming] Close stream error:', error);
    }
  }

  // Get stream info
  getStreamInfo(streamId) {
    return this.activeStreams.get(streamId);
  }

  // Get all active streams
  getActiveStreams() {
    return Array.from(this.activeStreams.values());
  }

  // Cleanup old streams (call periodically)
  cleanupOldStreams(maxAgeMinutes = 30) {
    const now = new Date();
    const maxAge = maxAgeMinutes * 60 * 1000;

    for (const [streamId, streamInfo] of this.activeStreams.entries()) {
      if (now - streamInfo.createdAt > maxAge) {
        console.log('[D-ID Streaming] Cleaning up old stream:', streamId);
        this.closeStream(streamId, streamInfo.sessionId);
      }
    }
  }
}

module.exports = new DIDStreamingService();
