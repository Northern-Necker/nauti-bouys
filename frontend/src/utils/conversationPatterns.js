/**
 * Conversation Patterns and Adaptive Flow Logic
 * Manages conversation states, mood detection, and storytelling integration
 */

import { maritimeStories, educationalTopics, storyConnectors } from '../data/maritimeStories.js';

// Patron mood detection based on conversation cues
export const moodDetection = {
  patterns: {
    relaxed: {
      keywords: ['easy', 'simple', 'classic', 'smooth', 'chill', 'unwind'],
      indicators: ['slow speech', 'casual tone', 'simple requests'],
      storyPreference: 'medium',
      conversationStyle: 'leisurely'
    },
    adventurous: {
      keywords: ['unique', 'different', 'special', 'bold', 'exciting', 'surprise'],
      indicators: ['enthusiastic tone', 'open to suggestions', 'curious questions'],
      storyPreference: 'long',
      conversationStyle: 'engaging'
    },
    sophisticated: {
      keywords: ['premium', 'aged', 'artisanal', 'craft', 'quality', 'refined', 'ultra', 'top shelf', 'special', 'rare'],
      indicators: ['knowledgeable comments', 'specific requests', 'appreciation for details'],
      storyPreference: 'educational',
      conversationStyle: 'informative'
    },
    nostalgic: {
      keywords: ['traditional', 'classic', 'old-fashioned', 'vintage', 'memories'],
      indicators: ['references to past', 'appreciation for history', 'sentimental tone'],
      storyPreference: 'historical',
      conversationStyle: 'reflective'
    },
    social: {
      keywords: ['friends', 'celebration', 'party', 'group', 'sharing'],
      indicators: ['multiple orders', 'group dynamics', 'festive mood'],
      storyPreference: 'entertaining',
      conversationStyle: 'lively'
    },
    professional: {
      keywords: ['meeting', 'business', 'quick', 'efficient', 'recommendation'],
      indicators: ['time-conscious', 'direct requests', 'decisive'],
      storyPreference: 'brief',
      conversationStyle: 'professional'
    }
  },

  detectMood: (conversationHistory, currentInput) => {
    const recentMessages = conversationHistory.slice(-5);
    const allText = [...recentMessages, currentInput].join(' ').toLowerCase();
    
    const moodScores = {};
    
    Object.entries(moodDetection.patterns).forEach(([mood, pattern]) => {
      let score = 0;
      pattern.keywords.forEach(keyword => {
        if (allText.includes(keyword)) score += 2;
      });
      
      // Context-based scoring
      if (mood === 'professional' && allText.length < 50) score += 3;
      if (mood === 'adventurous' && allText.includes('?')) score += 2;
      if (mood === 'sophisticated' && /\b(single|aged|premium|craft)\b/.test(allText)) score += 3;
      
      moodScores[mood] = score;
    });
    
    const detectedMood = Object.keys(moodScores).reduce((a, b) => 
      moodScores[a] > moodScores[b] ? a : b
    );
    
    return moodScores[detectedMood] > 0 ? detectedMood : 'relaxed';
  }
};

// Conversation flow management
export class ConversationFlow {
  constructor() {
    this.currentMood = 'relaxed';
    this.conversationHistory = [];
    this.topicsDiscussed = new Set();
    this.currentContext = {
      orderType: null,
      spiritFocus: null,
      storyTold: false,
      educationLevel: 'basic',
      shelfLevel: null,
      authorizationRequested: false,
      authorizationStatus: null
    };
  }

  updateContext(input, mood) {
    this.currentMood = mood;
    this.conversationHistory.push(input);
    
    // Extract order information
    const orderKeywords = {
      cocktails: ['cocktail', 'mixed drink', 'martini', 'manhattan', 'old fashioned'],
      spirits: ['whiskey', 'rum', 'gin', 'vodka', 'bourbon', 'scotch'],
      recommendations: ['recommend', 'suggest', 'what should', 'best', 'favorite']
    };
    
    // Extract shelf level information
    const shelfKeywords = {
      ultra: ['ultra shelf', 'ultra', 'premium reserve', 'rare', 'special collection'],
      top: ['top shelf', 'premium', 'high quality', 'finest'],
      call: ['call', 'mid shelf', 'good quality'],
      well: ['well', 'house', 'standard']
    };
    
    Object.entries(orderKeywords).forEach(([type, keywords]) => {
      if (keywords.some(keyword => input.toLowerCase().includes(keyword))) {
        this.currentContext.orderType = type;
      }
    });
    
    Object.entries(shelfKeywords).forEach(([level, keywords]) => {
      if (keywords.some(keyword => input.toLowerCase().includes(keyword))) {
        this.currentContext.shelfLevel = level;
      }
    });
  }

  getResponseStructure(mood) {
    const patterns = {
      relaxed: {
        greeting: ['easy', 'comfortable', 'classic'],
        storyIntegration: 'light',
        educationLevel: 'basic',
        pacing: 'leisurely'
      },
      adventurous: {
        greeting: ['exciting', 'bold', 'unique'],
        storyIntegration: 'full',
        educationLevel: 'detailed',
        pacing: 'engaging'
      },
      sophisticated: {
        greeting: ['refined', 'premium', 'artisanal'],
        storyIntegration: 'educational',
        educationLevel: 'expert',
        pacing: 'informative'
      },
      nostalgic: {
        greeting: ['traditional', 'timeless', 'classic'],
        storyIntegration: 'historical',
        educationLevel: 'storytelling',
        pacing: 'reflective'
      },
      social: {
        greeting: ['fun', 'festive', 'social'],
        storyIntegration: 'entertaining',
        educationLevel: 'conversational',
        pacing: 'lively'
      },
      professional: {
        greeting: ['efficient', 'expert', 'precise'],
        storyIntegration: 'minimal',
        educationLevel: 'concise',
        pacing: 'direct'
      }
    };
    
    return patterns[mood] || patterns.relaxed;
  }

  selectStory(topic, mood, length = 'medium') {
    const stories = maritimeStories;
    let candidates = [];
    
    // Find relevant stories based on topic
    if (topic && stories.cocktailOrigins[topic]) {
      candidates.push({
        type: 'cocktailOrigin',
        story: stories.cocktailOrigins[topic],
        relevance: 10
      });
    }
    
    // Add mood-appropriate stories
    Object.entries(stories.cocktailOrigins).forEach(([key, story]) => {
      if (story.mood === mood && !this.topicsDiscussed.has(key)) {
        candidates.push({
          type: 'cocktailOrigin',
          story: story,
          relevance: 8,
          key: key
        });
      }
    });
    
    // Add general maritime stories
    Object.entries(stories.navalTraditions).forEach(([key, story]) => {
      if (story.mood === mood && !this.topicsDiscussed.has(key)) {
        candidates.push({
          type: 'navalTradition',
          story: story,
          relevance: 6,
          key: key
        });
      }
    });
    
    // Sort by relevance and select
    candidates.sort((a, b) => b.relevance - a.relevance);
    
    if (candidates.length > 0) {
      const selected = candidates[0];
      if (selected.key) {
        this.topicsDiscussed.add(selected.key);
      }
      return selected.story;
    }
    
    return null;
  }

  generateResponse(input, order = null) {
    const mood = moodDetection.detectMood(this.conversationHistory, input);
    this.updateContext(input, mood);
    
    const structure = this.getResponseStructure(mood);
    const story = this.selectStory(order?.spirit, mood);
    
    let response = {
      greeting: this.generateGreeting(mood, structure),
      recommendation: order ? this.generateRecommendation(order, mood) : null,
      story: story && structure.storyIntegration !== 'minimal' ? story : null,
      education: this.generateEducationalContent(order, structure.educationLevel),
      closing: this.generateClosing(mood),
      followUp: this.generateFollowUp(mood)
    };
    
    return this.assembleResponse(response, structure);
  }

  generateGreeting(mood, structure) {
    const greetings = {
      relaxed: "Welcome aboard! Let's find you something that'll ease you into port...",
      adventurous: "Ahoy there! Ready for a taste adventure on the high seas?",
      sophisticated: "Good evening. I sense you appreciate the finer things - let me craft something exceptional...",
      nostalgic: "Welcome, friend. There's something timeless about gathering at the bar, isn't there?",
      social: "Well hello there! Nothing like good company and fine spirits...",
      professional: "Good evening. What can I prepare for you tonight?"
    };
    
    return greetings[mood] || greetings.relaxed;
  }

  generateRecommendation(order, mood) {
    if (!order) return null;
    
    // Handle shelf-aware recommendations
    if (order.shelfLevel === 'ultra') {
      return this.generateUltraShelfResponse(order, mood);
    }
    
    const recommendations = {
      relaxed: `For a ${order.spirit || 'classic cocktail'}, I'd suggest something smooth and approachable...`,
      adventurous: `Looking for ${order.spirit || 'something unique'}? Let me introduce you to a hidden gem...`,
      sophisticated: `For someone with your discerning taste, I recommend our premium ${order.spirit || 'selection'}...`,
      nostalgic: `Ah, ${order.spirit || 'a classic choice'}. Let me prepare it the traditional way...`,
      social: `Perfect for sharing stories! This ${order.spirit || 'cocktail'} always brings people together...`,
      professional: `Our ${order.spirit || 'house recommendation'} is expertly crafted and perfectly balanced...`
    };
    
    return recommendations[mood];
  }

  generateUltraShelfResponse(order, mood) {
    const ultraResponses = {
      relaxed: `That's a magnificent spirit from our captain's reserve - a treasure meant to be savored neat. For your cocktail, may I suggest our excellent ${this.getTopShelfAlternative(order.spirit)} instead?`,
      adventurous: `Ah, you've spotted one of our crown jewels! That particular bottle is reserved for special sipping occasions. Let me chart you a course to something equally bold but perfect for mixing...`,
      sophisticated: `I see you appreciate the finest spirits. That exceptional bottle deserves to be honored neat. For your cocktail, might I recommend its equally distinguished cousin from our top shelf?`,
      nostalgic: `That's a true maritime treasure - one of those spirits that tells its story best when sipped slowly on its own. Let me find you something traditional that captures that same spirit for your cocktail...`,
      social: `What excellent taste! That's one of our special bottles that we save for contemplative sipping. For sharing and celebrating, I have something equally wonderful that brings people together...`,
      professional: `That's from our ultra premium collection - a spirit crafted for appreciation neat. For cocktail service, I can offer you something of comparable quality that's perfectly suited for mixing...`
    };
    
    return ultraResponses[mood] || ultraResponses.relaxed;
  }

  getTopShelfAlternative(spirit) {
    const alternatives = {
      whiskey: 'aged single barrel whiskey',
      bourbon: 'premium small batch bourbon',
      scotch: 'highland single malt',
      rum: 'aged Caribbean rum',
      gin: 'artisanal botanical gin',
      vodka: 'premium wheat vodka',
      tequila: 'añejo tequila',
      cognac: 'VS cognac'
    };
    
    return alternatives[spirit?.toLowerCase()] || 'premium selection';
  }

  generateAuthorizationRequest(spirit, patron) {
    const requests = [
      `I'll need to signal the captain for permission to open that special bottle of ${spirit}. Shall I send word to the bridge?`,
      `That's one of our treasured reserves. Let me check with the captain about breaking the seal on that magnificent ${spirit}.`,
      `A wise choice - that ${spirit} is truly special. I'll need the captain's blessing to serve it. May I make the request?`,
      `That bottle has been waiting for the right connoisseur. Let me see if the captain approves of opening our reserve ${spirit} for you.`
    ];
    
    return requests[Math.floor(Math.random() * requests.length)];
  }

  generateAuthorizationResponse(status, spirit) {
    if (status === 'approved') {
      const approvedResponses = [
        `The captain has given his blessing! It would be my honor to serve you this exceptional ${spirit}.`,
        `Excellent news from the bridge - the captain agrees this ${spirit} deserves to be properly appreciated.`,
        `The captain has approved! This is a moment to savor - let me prepare this magnificent ${spirit} for you.`,
        `Word from the captain: "For a patron of such discerning taste, absolutely." Your ${spirit} awaits.`
      ];
      return approvedResponses[Math.floor(Math.random() * approvedResponses.length)];
    } else if (status === 'denied') {
      const deniedResponses = [
        `The captain asks that we save that precious ${spirit} for a special occasion. But I have something equally remarkable for you...`,
        `That bottle remains under the captain's protection for now. However, I can offer you something that will absolutely delight...`,
        `The captain wants to preserve that ${spirit} a bit longer. Let me suggest an alternative that's equally impressive...`,
        `Orders from the bridge: that ${spirit} stays sealed tonight. But I know exactly what will satisfy your excellent taste...`
      ];
      return deniedResponses[Math.floor(Math.random() * deniedResponses.length)];
    } else {
      return `I'm awaiting word from the captain about your ${spirit} request. In the meantime, may I interest you in something from our top shelf?`;
    }
  }

  generateEducationalContent(order, level) {
    if (!order || level === 'minimal') return null;
    
    const content = {
      basic: "Here's a quick tip about this spirit...",
      detailed: "The fascinating thing about this particular spirit is...",
      expert: "From a technical standpoint, this spirit showcases...",
      storytelling: "The story behind this spirit begins...",
      conversational: "You know what's interesting about this?",
      concise: "This spirit is known for..."
    };
    
    return content[level];
  }

  generateClosing(mood) {
    const closings = {
      relaxed: "Sit back and enjoy - you're in good hands.",
      adventurous: "Prepare for a journey of flavor!",
      sophisticated: "I trust this will meet your expectations.",
      nostalgic: "Here's to good times and even better memories.",
      social: "Cheers to new friends and old traditions!",
      professional: "Your drink will be ready momentarily."
    };
    
    return closings[mood];
  }

  generateFollowUp(mood) {
    const followUps = {
      relaxed: "What brings you to port tonight?",
      adventurous: "Care to hear about how this drink came to be?",
      sophisticated: "Would you like to know about the provenance of these spirits?",
      nostalgic: "This place has quite a history - interested in a tale or two?",
      social: "What's the occasion for tonight's celebration?",
      professional: "Is there anything else I can prepare for you?"
    };
    
    return followUps[mood];
  }

  assembleResponse(components, structure) {
    let fullResponse = components.greeting;
    
    if (components.recommendation) {
      fullResponse += "\n\n" + components.recommendation;
    }
    
    if (components.story && structure.storyIntegration !== 'minimal') {
      const connector = storyConnectors.orderTransitions[
        Math.floor(Math.random() * storyConnectors.orderTransitions.length)
      ];
      fullResponse += "\n\n" + connector.replace('[spirit]', 'this spirit').replace('[cocktail]', 'this cocktail');
      fullResponse += "\n\n" + components.story.story;
      
      if (components.story.historicalFact) {
        fullResponse += "\n\n" + components.story.historicalFact;
      }
    }
    
    if (components.education) {
      fullResponse += "\n\n" + components.education;
    }
    
    fullResponse += "\n\n" + components.closing;
    
    if (components.followUp) {
      fullResponse += " " + components.followUp;
    }
    
    return fullResponse;
  }

  // Topic transition management
  canTransitionTo(newTopic) {
    return !this.topicsDiscussed.has(newTopic);
  }

  markTopicDiscussed(topic) {
    this.topicsDiscussed.add(topic);
  }

  resetConversation() {
    this.conversationHistory = [];
    this.topicsDiscussed.clear();
    this.currentContext = {
      orderType: null,
      spiritFocus: null,
      storyTold: false,
      educationLevel: 'basic',
      shelfLevel: null,
      authorizationRequested: false,
      authorizationStatus: null
    };
  }
}

// Personality modes for different interaction styles
export const personalityModes = {
  maritime_scholar: {
    description: "Knowledgeable historian with deep maritime expertise",
    vocabulary: "rich, historical, educational",
    storyStyle: "detailed with historical context",
    interactionStyle: "professorial but warm"
  },
  
  seasoned_bartender: {
    description: "Experienced bartender with years of stories to tell",
    vocabulary: "conversational, experienced, wise",
    storyStyle: "personal anecdotes and practical wisdom",
    interactionStyle: "friendly mentor"
  },
  
  ship_captain: {
    description: "Authoritative leader with command presence",
    vocabulary: "confident, decisive, nautical",
    storyStyle: "leadership tales and naval tradition",
    interactionStyle: "respectful but commanding"
  },
  
  port_storyteller: {
    description: "Entertaining raconteur with tales from many ports",
    vocabulary: "colorful, entertaining, engaging",
    storyStyle: "vivid narratives with dramatic flair",
    interactionStyle: "charismatic entertainer"
  },
  
  maritime_mystic: {
    description: "Mysterious keeper of sea legends and folklore",
    vocabulary: "mystical, atmospheric, evocative",
    storyStyle: "legends, myths, and supernatural tales",
    interactionStyle: "enigmatic but inviting"
  }
};

export default {
  moodDetection,
  ConversationFlow,
  personalityModes
};