/**
 * Spirit Shelf Management and Alternative Suggestion System
 * Handles ultra shelf restrictions, alternative mappings, and educational responses
 */

export class SpiritShelfManager {
  constructor() {
    this.shelfLevels = {
      ultra: {
        description: "Captain's Reserve - Exceptional spirits meant for contemplative sipping",
        restrictions: "Authorization required, typically served neat",
        educationalMessage: "These treasures are preserved for special moments and proper appreciation"
      },
      top: {
        description: "Premium Selection - High-quality spirits perfect for both sipping and mixing",
        restrictions: "No restrictions, excellent for cocktails",
        educationalMessage: "Our finest readily available spirits, crafted for excellence"
      },
      call: {
        description: "Quality Standards - Reliable, well-made spirits for everyday enjoyment",
        restrictions: "No restrictions, great value",
        educationalMessage: "Dependable choices that deliver consistent quality"
      },
      well: {
        description: "House Selection - Our standard offerings for classic cocktails",
        restrictions: "No restrictions, house standards",
        educationalMessage: "Time-tested selections for traditional preparations"
      }
    };

    this.spiritAlternatives = {
      whiskey: {
        ultra_to_top: [
          { name: "Single Barrel Reserve Bourbon", story: "Like its ultra cousin, this showcases the master distiller's art" },
          { name: "Highland Single Malt", story: "Aged in oak with the same patience and care" },
          { name: "Small Batch Rye", story: "Crafted with the same attention to detail and tradition" }
        ],
        ultra_to_call: [
          { name: "Premium Blended Whiskey", story: "A harmonious blend that honors the whiskey-making tradition" },
          { name: "Quality Bourbon", story: "Smooth and approachable, perfect for your cocktail" }
        ]
      },
      rum: {
        ultra_to_top: [
          { name: "Aged Caribbean Rum", story: "Aged in the same tropical climate with equal dedication" },
          { name: "Premium Spiced Rum", story: "A master blender's creation with exotic spices" },
          { name: "Artisanal White Rum", story: "Distilled with the same care and traditional methods" }
        ],
        ultra_to_call: [
          { name: "Quality Dark Rum", story: "Rich and smooth, perfect for your cocktail adventure" },
          { name: "Traditional Cuban-Style Rum", story: "Classic flavor profile that honors rum's heritage" }
        ]
      },
      gin: {
        ultra_to_top: [
          { name: "Artisanal Botanical Gin", story: "Hand-crafted with rare botanicals from around the world" },
          { name: "Premium London Dry", story: "Distilled with traditional methods and perfect balance" },
          { name: "Small Batch Navy Strength", story: "Bold and complex, just like the spirits sailors treasured" }
        ],
        ultra_to_call: [
          { name: "Quality London Dry", story: "Clean and crisp, perfect for classic cocktails" },
          { name: "Traditional Juniper Gin", story: "Time-tested recipe that delivers consistent excellence" }
        ]
      },
      vodka: {
        ultra_to_top: [
          { name: "Premium Wheat Vodka", story: "Smooth as silk, distilled with meticulous care" },
          { name: "Artisanal Potato Vodka", story: "Rich and creamy, a true craftsman's expression" },
          { name: "Small Batch Filtered", story: "Multiple distillations create unparalleled purity" }
        ],
        ultra_to_call: [
          { name: "Quality Grain Vodka", story: "Clean and neutral, perfect for mixing adventures" },
          { name: "Smooth Premium Vodka", story: "Reliable excellence in every pour" }
        ]
      },
      tequila: {
        ultra_to_top: [
          { name: "Añejo Tequila", story: "Aged in oak like fine whiskey, with agave's unique character" },
          { name: "Reposado Premium", story: "Rested to perfection, balancing youth and maturity" },
          { name: "Small Batch Blanco", story: "Pure agave expression from master distillers" }
        ],
        ultra_to_call: [
          { name: "Quality Blanco Tequila", story: "Crisp and clean, showcasing pure agave flavor" },
          { name: "Traditional Reposado", story: "Smooth and approachable, perfect for cocktails" }
        ]
      },
      cognac: {
        ultra_to_top: [
          { name: "VSOP Cognac", story: "Aged in French oak with generations of expertise" },
          { name: "Premium Brandy", story: "Distilled and aged with the same dedication" },
          { name: "Artisanal Armagnac", story: "From another noble French tradition" }
        ],
        ultra_to_call: [
          { name: "VS Cognac", story: "Classic French brandy with reliable quality" },
          { name: "Quality Brandy", story: "Smooth and warming, perfect for cocktails" }
        ]
      }
    };

    this.responseTemplates = {
      authorization_request: [
        "I'll need to signal the captain for permission to open that magnificent {spirit}. The {spirit} you've chosen is from our special reserve. Shall I send word to the bridge?",
        "That {spirit} is one of our treasured bottles from the captain's private collection. Let me check with the captain about serving this exceptional spirit.",
        "Excellent choice - that {spirit} is truly special. I'll need the captain's blessing to serve it. May I make the request on your behalf?",
        "A connoisseur's selection! That {spirit} requires the captain's approval. Let me see if we can open that remarkable bottle for you."
      ],
      authorization_approved: [
        "Wonderful news from the bridge! The captain has given permission to serve this exceptional {spirit}. It would be my honor to pour this for you.",
        "The captain agrees - a spirit of this caliber deserves a patron of your discerning taste. Let me prepare this magnificent {spirit}.",
        "Excellent! The captain's response was 'For someone who appreciates such quality, absolutely.' Your {spirit} awaits.",
        "The captain has approved! This is indeed a special moment. Let me present this treasured {spirit} properly."
      ],
      authorization_denied: [
        "The captain asks that we preserve that precious {spirit} for now. However, I have something equally remarkable: {alternative}. {story}",
        "Orders from the bridge are to keep that {spirit} sealed tonight. But let me suggest our {alternative} - {story}",
        "That bottle remains under the captain's protection. Instead, may I offer you our {alternative}? {story}",
        "The captain wants to save that {spirit} for a special occasion. Our {alternative} is equally impressive - {story}"
      ],
      authorization_pending: [
        "I'm awaiting word from the captain about your {spirit} request. In the meantime, may I interest you in our {alternative}?",
        "The message has been sent to the bridge regarding your {spirit}. While we wait, perhaps you'd enjoy our {alternative}?",
        "I've signaled the captain about the {spirit}. Shall I prepare something from our top shelf while we await permission?",
        "Your request for {spirit} is with the captain. May I suggest our {alternative} as we wait for authorization?"
      ],
      educational_explanation: [
        "These ultra-shelf spirits are like maritime treasures - meant to be savored and appreciated in their purest form. Each one tells a story best experienced neat, allowing you to taste the master's craft without interference.",
        "Think of it like the difference between reading a love letter aloud at a party versus reading it quietly by candlelight. These spirits deserve that intimate attention.",
        "Just as a ship captain saves the finest charts for treacherous waters, we preserve our finest spirits for moments that deserve them most.",
        "In the maritime tradition, the captain's private stock wasn't hoarded - it was honored. These spirits have earned that same respect."
      ]
    };
  }

  /**
   * Determines appropriate alternative for ultra shelf request
   */
  getAlternative(spiritName, targetShelf = 'top') {
    const spiritType = this.identifySpiritType(spiritName);
    const alternatives = this.spiritAlternatives[spiritType];
    
    if (!alternatives) {
      return {
        name: "our premium selection",
        story: "crafted with the same attention to quality and tradition"
      };
    }

    const altKey = `ultra_to_${targetShelf}`;
    const options = alternatives[altKey] || alternatives.ultra_to_top;
    
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Identifies spirit type from name
   */
  identifySpiritType(spiritName) {
    const name = spiritName.toLowerCase();
    
    const typeMap = {
      whiskey: ['whiskey', 'whisky', 'bourbon', 'scotch', 'rye', 'irish'],
      rum: ['rum'],
      gin: ['gin'],
      vodka: ['vodka'],
      tequila: ['tequila', 'mezcal'],
      cognac: ['cognac', 'brandy', 'armagnac']
    };

    for (const [type, keywords] of Object.entries(typeMap)) {
      if (keywords.some(keyword => name.includes(keyword))) {
        return type;
      }
    }

    return 'whiskey'; // Default fallback
  }

  /**
   * Generates authorization request message
   */
  generateAuthorizationRequest(spiritName) {
    const template = this.responseTemplates.authorization_request[
      Math.floor(Math.random() * this.responseTemplates.authorization_request.length)
    ];
    
    return template.replace(/{spirit}/g, spiritName);
  }

  /**
   * Generates response for authorization status
   */
  generateAuthorizationResponse(status, spiritName, alternativeLevel = 'top') {
    const templates = this.responseTemplates[`authorization_${status}`];
    
    if (!templates) {
      return `Your request for ${spiritName} is being processed.`;
    }

    const template = templates[Math.floor(Math.random() * templates.length)];
    
    if (status === 'denied' || status === 'pending') {
      const alternative = this.getAlternative(spiritName, alternativeLevel);
      return template
        .replace(/{spirit}/g, spiritName)
        .replace(/{alternative}/g, alternative.name)
        .replace(/{story}/g, alternative.story);
    }
    
    return template.replace(/{spirit}/g, spiritName);
  }

  /**
   * Generates educational explanation about shelf system
   */
  generateShelfEducation(context = 'general') {
    const explanations = this.responseTemplates.educational_explanation;
    return explanations[Math.floor(Math.random() * explanations.length)];
  }

  /**
   * Creates a complete shelf-aware response
   */
  createShelfResponse(request) {
    const {
      spiritName,
      shelfLevel,
      authorizationStatus,
      patronMood,
      conversationStyle,
      includeEducation = false
    } = request;

    let response = '';

    // Base response based on authorization status
    if (authorizationStatus === 'pending') {
      response = this.generateAuthorizationResponse('pending', spiritName);
    } else if (authorizationStatus === 'approved') {
      response = this.generateAuthorizationResponse('approved', spiritName);
    } else if (authorizationStatus === 'denied') {
      response = this.generateAuthorizationResponse('denied', spiritName);
    } else if (shelfLevel === 'ultra') {
      response = this.generateAuthorizationRequest(spiritName);
    }

    // Add educational content if requested or appropriate
    if (includeEducation || patronMood === 'curious') {
      response += '\n\n' + this.generateShelfEducation();
    }

    // Add maritime story connector if appropriate
    if (conversationStyle === 'storytelling') {
      response += '\n\nYou know, this reminds me of an old maritime tradition...';
    }

    return response;
  }

  /**
   * Gets shelf information for a given level
   */
  getShelfInfo(level) {
    return this.shelfLevels[level] || this.shelfLevels.well;
  }

  /**
   * Validates if a shelf request is appropriate
   */
  validateShelfAccess(spiritName, shelfLevel, patronProfile = {}) {
    if (shelfLevel !== 'ultra') {
      return { allowed: true, reason: 'No restrictions' };
    }

    // Ultra shelf requires special consideration
    const hasSpecialOccasion = patronProfile.context === 'celebration' || 
                              patronProfile.context === 'romantic';
    const isKnowledgeablePatron = patronProfile.interactions > 5;
    const isNeatRequest = patronProfile.currentOrder?.preparation === 'neat';

    if (hasSpecialOccasion && isNeatRequest) {
      return { allowed: true, reason: 'Special occasion with proper appreciation' };
    }

    if (isKnowledgeablePatron && isNeatRequest) {
      return { allowed: true, reason: 'Knowledgeable patron requesting proper service' };
    }

    return { 
      allowed: false, 
      reason: 'Ultra shelf spirits are reserved for neat service on special occasions',
      suggestAlternative: true
    };
  }
}

export default SpiritShelfManager;