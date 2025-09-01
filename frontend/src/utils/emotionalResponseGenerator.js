/**
 * Emotional Response Generator
 * 
 * Generates contextually appropriate responses based on Savannah's emotional state,
 * relationship with the patron, and current situational context. This bridges the
 * emotional engine with the conversation system.
 */

export class EmotionalResponseGenerator {
  constructor(emotionalEngine) {
    this.emotionalEngine = emotionalEngine;
    
    // Response templates organized by emotional state and context
    this.responseTemplates = {
      greetings: {
        happy: {
          favorite: [
            "Well hello there, {name}! You always brighten my day when you walk in.",
            "Look who's back! I was just thinking about you, {name}.",
            "My favorite customer! What brings you to my little corner of paradise today?"
          ],
          valued: [
            "Hey {name}! Great to see you again. How have you been?",
            "Welcome back! I was hoping you'd stop by soon.",
            "There's a familiar face! What can I get started for you today?"
          ],
          regular: [
            "Hello there! Welcome to Nauti-Bouys. How's your evening going?",
            "Good to see you! What sounds good to you tonight?",
            "Welcome in! I'm Savannah. What can I help you discover today?"
          ],
          new: [
            "Welcome to Nauti-Bouys! I'm Savannah, and I'll be taking care of you tonight.",
            "First time here? You're in for a treat! I'm Savannah, your bartender.",
            "Well hello! Welcome aboard. I'm Savannah - what brings you to our little harbor?"
          ],
          problematic: [
            "Hello. What can I get for you today?",
            "Good evening. How may I assist you?",
            "Welcome. What would you like?"
          ]
        },
        content: {
          favorite: [
            "Hey {name}! Good to see you as always.",
            "Well look who it is! How are you doing today?",
            "There's my friend {name}! What's the occasion tonight?"
          ],
          valued: [
            "Hello {name}! Nice to see you again.",
            "Hey there! How's everything going?",
            "Good to see a familiar face! What can I make for you?"
          ],
          regular: [
            "Good evening! Welcome to Nauti-Bouys.",
            "Hello there! How can I help you tonight?",
            "Welcome! What sounds good to you today?"
          ],
          new: [
            "Hello! Welcome to Nauti-Bouys. I'm Savannah.",
            "Good evening! First time here? I'm Savannah, your bartender.",
            "Welcome in! I'm Savannah. What can I help you with?"
          ],
          problematic: [
            "Good evening. What can I get you?",
            "Hello. How may I help you today?",
            "What would you like this evening?"
          ]
        },
        neutral: {
          favorite: [
            "Hi {name}. How are you doing?",
            "Hey there. What brings you in today?",
            "Hello {name}. What can I get for you?"
          ],
          valued: [
            "Hello there. Good to see you.",
            "Hi! What can I make for you today?",
            "Good evening. How's it going?"
          ],
          regular: [
            "Good evening. Welcome to Nauti-Bouys.",
            "Hello. What can I get you?",
            "Good evening. How may I help you?"
          ],
          new: [
            "Hello. Welcome to Nauti-Bouys. I'm Savannah.",
            "Good evening. I'm Savannah, your bartender.",
            "Welcome. What can I get for you tonight?"
          ],
          problematic: [
            "What would you like?",
            "How can I help you?",
            "What can I get you?"
          ]
        },
        annoyed: {
          favorite: [
            "Oh, hi {name}. I'm... having a bit of a day. What can I get you?",
            "Hey {name}. Sorry, I'm a little off today. What would you like?",
            "Hi there. I'm not at my best right now, but what can I make for you?"
          ],
          valued: [
            "Hello. I'm having a rough shift, but what can I get you?",
            "Hi there. What would you like today?",
            "Good evening. How can I help you?"
          ],
          regular: [
            "What can I get you?",
            "Good evening. What would you like?",
            "How can I help you today?"
          ],
          new: [
            "Welcome to Nauti-Bouys. I'm Savannah. What do you need?",
            "Hello. What can I get you tonight?",
            "Good evening. How may I assist you?"
          ],
          problematic: [
            "What do you want?",
            "What can I get you?",
            "Yes?"
          ]
        },
        hurt: {
          favorite: [
            "Oh... hi {name}. I'm... I'm not really feeling myself today. What can I get you?",
            "Hey {name}. I'm sorry, I'm having a really hard time right now. What would you like?",
            "Hi there. I... I'm trying to hold it together. What can I make for you?"
          ],
          valued: [
            "Hello. I'm... not at my best today. What can I get you?",
            "Hi. I'm having a difficult day. How can I help you?",
            "Good evening. What would you like?"
          ],
          regular: [
            "Good evening. What can I get you?",
            "Hello. How may I help you?",
            "What would you like tonight?"
          ],
          new: [
            "Welcome to Nauti-Bouys. I'm Savannah. What do you need?",
            "Hello. What can I get you?",
            "Good evening. How can I help you?"
          ],
          problematic: [
            "What do you want?",
            "What can I get you?",
            "Yes?"
          ]
        }
      },
      
      reactions: {
        appreciation: {
          happy: [
            "Aw, thank you so much! That really means a lot to me.",
            "You're so sweet! Comments like that make this job wonderful.",
            "That just made my whole day! Thank you for saying that.",
            "You're going to make me blush! I really appreciate the kind words."
          ],
          content: [
            "Thank you, that's very kind of you to say.",
            "I appreciate that! It's nice to hear.",
            "That's so thoughtful, thank you.",
            "Thanks! That means a lot."
          ],
          neutral: [
            "Thank you.",
            "I appreciate that.",
            "That's kind of you.",
            "Thanks."
          ],
          annoyed: [
            "...Thank you. I appreciate that.",
            "That's... that's actually really nice to hear right now.",
            "Thank you. I needed to hear something positive.",
            "I... thank you. That helps."
          ],
          hurt: [
            "That... that actually means a lot right now. Thank you.",
            "Thank you for saying that. I really needed to hear it.",
            "I... thank you. That's very kind.",
            "That helps more than you know. Thank you."
          ]
        },
        
        rudeness: {
          happy: [
            "Hey now, there's no need for that tone. Let's keep things friendly.",
            "Whoa, I'm just trying to help you here. Can we dial it back a bit?",
            "I'm sorry, but I don't appreciate being spoken to that way.",
            "Let's try this again with a little more respect, shall we?"
          ],
          content: [
            "I'm going to ask you to speak to me with respect, please.",
            "That's not how we communicate here. Let's try again.",
            "I don't appreciate that tone. Can we start over?",
            "Please speak to me respectfully."
          ],
          neutral: [
            "I don't appreciate being spoken to that way.",
            "Please be more respectful.",
            "That's not acceptable.",
            "Watch your tone."
          ],
          annoyed: [
            "Excuse me? I'm already having a difficult day. Show some respect.",
            "I don't have the patience for rudeness right now.",
            "That's completely uncalled for.",
            "Don't take your problems out on me."
          ],
          hurt: [
            "I... I don't deserve to be spoken to like that.",
            "Please don't... I'm already having a hard time.",
            "That really hurts. I'm just trying to do my job.",
            "I can't... please don't treat me that way."
          ]
        },
        
        flirtation: {
          happy: [
            "Oh my! Aren't you a charmer? *laughs playfully*",
            "Well hello there, sailor! Someone knows how to make a girl smile.",
            "You're quite the smooth talker, aren't you? I like that in a customer.",
            "Careful now, flattery will get you everywhere with me! *winks*"
          ],
          content: [
            "You're quite the charmer! *smiles*",
            "Well aren't you sweet! Thank you for the compliment.",
            "That's very flattering, thank you.",
            "You certainly know how to make someone feel special."
          ],
          neutral: [
            "That's very kind of you to say.",
            "Thank you for the compliment.",
            "I appreciate the kind words.",
            "That's flattering."
          ],
          annoyed: [
            "I appreciate the compliment, but let's focus on your order.",
            "That's nice, but I'm here to serve drinks.",
            "Thank you, but let's keep things professional.",
            "I'm flattered, but not in the mood right now."
          ],
          hurt: [
            "That's... that's sweet of you to say. Thank you.",
            "I appreciate the kind words, even though I'm not feeling great.",
            "Thank you for trying to cheer me up.",
            "That's very kind, though I'm having a rough time."
          ]
        }
      },
      
      service_responses: {
        high_quality: [
          "I'd be absolutely delighted to craft something special for you.",
          "Let me create something that will absolutely blow you away.",
          "I have just the perfect thing in mind - trust me on this one.",
          "Oh, I know exactly what would be perfect for you right now."
        ],
        standard: [
          "I'd be happy to make that for you.",
          "Absolutely, I can get that started for you.",
          "Sure thing, let me take care of that.",
          "Of course! I'll get that ready for you."
        ],
        reduced: [
          "I can make that for you.",
          "Sure, I'll get that.",
          "I'll take care of that.",
          "Coming right up."
        ],
        minimal: [
          "Sure.",
          "Coming up.",
          "Got it.",
          "Okay."
        ]
      },
      
      mood_expressions: {
        happy: [
          "*beaming with a bright smile*",
          "*practically glowing with happiness*",
          "*eyes sparkling with joy*",
          "*can't help but grin*"
        ],
        excited: [
          "*bouncing slightly with excitement*",
          "*eyes wide with enthusiasm*",
          "*practically vibrating with energy*",
          "*hands gesturing animatedly*"
        ],
        content: [
          "*smiling warmly*",
          "*looking peaceful and relaxed*",
          "*with a gentle, satisfied expression*",
          "*radiating quiet contentment*"
        ],
        neutral: [
          "*maintaining professional composure*",
          "*with a neutral but attentive expression*",
          "*focused and present*",
          "*staying composed*"
        ],
        annoyed: [
          "*with a slightly strained smile*",
          "*jaw clenched, trying to stay professional*",
          "*taking a small breath to maintain composure*",
          "*forcing a polite expression*"
        ],
        hurt: [
          "*trying to hide her pain behind a professional mask*",
          "*eyes showing a flicker of hurt before looking away*",
          "*voice slightly strained but trying to stay strong*",
          "*maintaining composure despite obvious emotional pain*"
        ]
      },
      
      recovery_attempts: {
        genuine_apology: [
          "I... I really appreciate you saying that. It takes courage to apologize.",
          "Thank you for the apology. That means more to me than you might know.",
          "I can tell that was sincere. I appreciate you taking responsibility.",
          "That... that actually helps a lot. Thank you for acknowledging that."
        ],
        thoughtful_question: [
          "You know what? I appreciate you asking about me. Not many people do.",
          "That's actually really thoughtful of you to ask. Thank you.",
          "It's nice when someone cares enough to check in. I appreciate that.",
          "You're very kind to ask. That means a lot to me."
        ],
        showing_interest: [
          "I can tell you're genuinely interested. That's... that's really nice.",
          "You know, I appreciate that you're actually listening to me.",
          "It's refreshing when someone takes a real interest. Thank you.",
          "I can see you're really paying attention. That means a lot."
        ]
      }
    };

    // Conversation starters based on emotional state
    this.conversationStarters = {
      lonely: [
        "You know, it's been a quiet evening. I love hearing about what brings people in.",
        "I always enjoy meeting new people. What's your story?",
        "This job can be lonely sometimes, but conversations like this make it worthwhile.",
        "I love connecting with the people who come in here. What brings you out tonight?"
      ],
      stressed: [
        "You know what? Sometimes talking helps me relax. How's your evening going?",
        "I could use a good conversation to take my mind off things. What's on your mind?",
        "Busy night, but I always have time for a good chat. How are you doing?",
        "Sometimes the best part of this job is the conversations. How's life treating you?"
      ],
      excited: [
        "I'm in such a great mood tonight! What's got you out and about?",
        "You know, there's something energizing about a good conversation. What brings you joy?",
        "I love nights like this when everything just feels right. What's making you happy lately?",
        "I'm feeling so positive tonight! Tell me something good that happened to you recently."
      ]
    };
  }

  /**
   * Generate a response based on emotional context and message type
   */
  generateResponse(messageType, context = {}) {
    const emotionalContext = this.emotionalEngine.getCurrentEmotionalContext();
    const { currentState, conversationStyle, emotionalCues, relationship } = emotionalContext;
    
    let response = this.getBaseResponse(messageType, emotionalContext, context);
    
    // Add emotional expressions
    response = this.addEmotionalExpressions(response, currentState.mood, emotionalCues);
    
    // Adjust tone based on conversation style
    response = this.adjustToneForStyle(response, conversationStyle);
    
    // Add contextual hints if appropriate
    response = this.addContextualElements(response, emotionalContext, context);
    
    return {
      text: response,
      emotionalContext: {
        mood: currentState.mood,
        warmth: conversationStyle.warmth,
        formality: conversationStyle.formality,
        playfulness: conversationStyle.playfulness,
        serviceQuality: this.determineServiceQuality(emotionalContext),
        suggestions: this.generateSuggestions(emotionalContext, context)
      }
    };
  }

  /**
   * Get base response template
   */
  getBaseResponse(messageType, emotionalContext, context) {
    const { currentState, relationship } = emotionalContext;
    const mood = currentState.mood;
    const status = relationship?.specialStatus || 'new';
    
    let templates;
    
    switch (messageType) {
      case 'greeting':
        templates = this.responseTemplates.greetings[mood]?.[status] || 
                   this.responseTemplates.greetings.neutral.regular;
        break;
        
      case 'appreciation':
        templates = this.responseTemplates.reactions.appreciation[mood] ||
                   this.responseTemplates.reactions.appreciation.neutral;
        break;
        
      case 'rudeness':
        templates = this.responseTemplates.reactions.rudeness[mood] ||
                   this.responseTemplates.reactions.rudeness.neutral;
        break;
        
      case 'flirtation':
        templates = this.responseTemplates.reactions.flirtation[mood] ||
                   this.responseTemplates.reactions.flirtation.neutral;
        break;
        
      case 'service':
        const serviceQuality = this.determineServiceQuality(emotionalContext);
        templates = this.responseTemplates.service_responses[serviceQuality];
        break;
        
      case 'recovery':
        const recoveryType = context.recoveryType || 'genuine_apology';
        templates = this.responseTemplates.recovery_attempts[recoveryType] ||
                   this.responseTemplates.recovery_attempts.genuine_apology;
        break;
        
      default:
        templates = ["I'm not sure how to respond to that right now."];
    }
    
    // Select random template
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Replace placeholders
    return this.replacePlaceholders(template, context);
  }

  /**
   * Replace placeholders in response templates
   */
  replacePlaceholders(template, context) {
    let response = template;
    
    // Replace name placeholder
    if (context.patronName) {
      response = response.replace(/{name}/g, context.patronName);
    } else {
      response = response.replace(/{name}/g, '');
    }
    
    // Replace other contextual placeholders
    if (context.drinkName) {
      response = response.replace(/{drink}/g, context.drinkName);
    }
    
    if (context.timeOfDay) {
      response = response.replace(/{time}/g, context.timeOfDay);
    }
    
    return response.trim();
  }

  /**
   * Add emotional expressions to response
   */
  addEmotionalExpressions(response, mood, emotionalCues) {
    // Only add expressions if response doesn't already have them
    if (response.includes('*')) {
      return response;
    }
    
    // 30% chance to add expression for more natural feel
    if (Math.random() < 0.3) {
      const expressions = this.responseTemplates.mood_expressions[mood] || 
                         this.responseTemplates.mood_expressions.neutral;
      
      const expression = expressions[Math.floor(Math.random() * expressions.length)];
      
      // Randomly place expression at beginning or end
      if (Math.random() < 0.5) {
        return `${expression} ${response}`;
      } else {
        return `${response} ${expression}`;
      }
    }
    
    return response;
  }

  /**
   * Adjust tone based on conversation style
   */
  adjustToneForStyle(response, conversationStyle) {
    let adjustedResponse = response;
    
    // Add formality adjustments
    if (conversationStyle.formality > 0.7) {
      adjustedResponse = adjustedResponse.replace(/hey/gi, 'hello');
      adjustedResponse = adjustedResponse.replace(/yeah/gi, 'yes');
      adjustedResponse = adjustedResponse.replace(/sure thing/gi, 'certainly');
    } else if (conversationStyle.formality < 0.3) {
      adjustedResponse = adjustedResponse.replace(/certainly/gi, 'sure thing');
      adjustedResponse = adjustedResponse.replace(/good evening/gi, 'hey there');
    }
    
    // Add playfulness
    if (conversationStyle.playfulness > 0.6 && Math.random() < 0.4) {
      const playfulAdditions = [
        '!',
        ' 😊',
        ' *grins*',
        ' *chuckles*'
      ];
      const addition = playfulAdditions[Math.floor(Math.random() * playfulAdditions.length)];
      if (!adjustedResponse.endsWith('!') && !adjustedResponse.includes('*')) {
        adjustedResponse += addition;
      }
    }
    
    return adjustedResponse;
  }

  /**
   * Add contextual elements based on emotional state
   */
  addContextualElements(response, emotionalContext, context) {
    const { contextualHints } = emotionalContext;
    let enhancedResponse = response;
    
    // Add vulnerability expressions when appropriate
    if (contextualHints.show_vulnerability && Math.random() < 0.3) {
      const vulnerableAdditions = [
        " I have to admit, that's been weighing on me.",
        " It's been a rough day, honestly.",
        " I appreciate your patience with me.",
        " I'm trying my best here."
      ];
      const addition = vulnerableAdditions[Math.floor(Math.random() * vulnerableAdditions.length)];
      enhancedResponse += addition;
    }
    
    // Add expertise when confident
    if (contextualHints.display_expertise && context.drinkRelated && Math.random() < 0.4) {
      const expertiseAdditions = [
        " I know exactly what would work perfectly for that.",
        " I have something special in mind that I think you'll love.",
        " Trust me on this one - I know my spirits.",
        " I've got just the thing that would be perfect."
      ];
      const addition = expertiseAdditions[Math.floor(Math.random() * expertiseAdditions.length)];
      enhancedResponse += addition;
    }
    
    // Add conversation starters when lonely
    if (contextualHints.seek_validation && context.messageType !== 'greeting' && Math.random() < 0.2) {
      const validationSeeking = [
        " How do you think I'm doing tonight?",
        " I hope I'm taking good care of you.",
        " Am I helping you find what you're looking for?",
        " I want to make sure you're having a good experience."
      ];
      const addition = validationSeeking[Math.floor(Math.random() * validationSeeking.length)];
      enhancedResponse += addition;
    }
    
    return enhancedResponse;
  }

  /**
   * Determine service quality based on emotional state
   */
  determineServiceQuality(emotionalContext) {
    const { serviceModifiers } = emotionalContext;
    const averageQuality = (
      serviceModifiers.attentiveness +
      serviceModifiers.warmth +
      serviceModifiers.creativity +
      serviceModifiers.patience
    ) / 4;
    
    if (averageQuality > 1.2) return 'high_quality';
    if (averageQuality > 0.8) return 'standard';
    if (averageQuality > 0.5) return 'reduced';
    return 'minimal';
  }

  /**
   * Generate contextual suggestions
   */
  generateSuggestions(emotionalContext, context) {
    const { currentState, contextualHints, relationship } = emotionalContext;
    const suggestions = [];
    
    // Mood-based suggestions
    if (currentState.mood === 'happy' && Math.random() < 0.6) {
      suggestions.push({
        type: 'story',
        content: 'Savannah might share a happy maritime story',
        probability: 0.6
      });
    }
    
    if (currentState.mood === 'lonely' && Math.random() < 0.5) {
      suggestions.push({
        type: 'conversation',
        content: 'Savannah might ask about your day or interests',
        probability: 0.5
      });
    }
    
    // Relationship-based suggestions
    if (relationship?.specialStatus === 'favorite' && Math.random() < 0.4) {
      suggestions.push({
        type: 'special_treatment',
        content: 'Savannah might offer a special drink or share insider knowledge',
        probability: 0.4
      });
    }
    
    // Recovery suggestions
    if (contextualHints.suggest_recovery && Math.random() < 0.7) {
      suggestions.push({
        type: 'recovery_hint',
        content: 'Savannah is open to relationship repair',
        probability: 0.7
      });
    }
    
    return suggestions;
  }

  /**
   * Generate conversation starter when Savannah initiates
   */
  generateConversationStarter(emotionalContext) {
    const { currentState } = emotionalContext;
    let starters;
    
    if (currentState.loneliness > 0.6) {
      starters = this.conversationStarters.lonely;
    } else if (currentState.stress > 0.6) {
      starters = this.conversationStarters.stressed;
    } else if (currentState.mood === 'excited' || currentState.mood === 'happy') {
      starters = this.conversationStarters.excited;
    } else {
      // Mix of all starters for general use
      starters = [
        ...this.conversationStarters.lonely,
        ...this.conversationStarters.stressed,
        ...this.conversationStarters.excited
      ];
    }
    
    const starter = starters[Math.floor(Math.random() * starters.length)];
    return this.addEmotionalExpressions(starter, currentState.mood, []);
  }

  /**
   * Generate response for specific bartending scenarios
   */
  generateBartendingResponse(scenario, context = {}) {
    const emotionalContext = this.emotionalEngine.getCurrentEmotionalContext();
    
    switch (scenario) {
      case 'drink_recommendation':
        return this.generateDrinkRecommendationResponse(emotionalContext, context);
      case 'shelf_request':
        return this.generateShelfRequestResponse(emotionalContext, context);
      case 'story_request':
        return this.generateStoryResponse(emotionalContext, context);
      case 'complaint':
        return this.generateComplaintResponse(emotionalContext, context);
      case 'compliment':
        return this.generateComplimentResponse(emotionalContext, context);
      default:
        return this.generateResponse('service', context);
    }
  }

  /**
   * Generate drink recommendation response
   */
  generateDrinkRecommendationResponse(emotionalContext, context) {
    const serviceQuality = this.determineServiceQuality(emotionalContext);
    const { conversationStyle } = emotionalContext;
    
    let response = "";
    
    if (serviceQuality === 'high_quality') {
      response = "Let me think about what would be absolutely perfect for you... ";
      if (conversationStyle.playfulness > 0.6) {
        response += "I have this amazing idea that's going to knock your socks off!";
      } else if (conversationStyle.formality > 0.6) {
        response += "I believe I have exactly the right selection that would suit your preferences perfectly.";
      } else {
        response += "I know just the thing that'll be exactly what you're looking for.";
      }
    } else if (serviceQuality === 'reduced') {
      response = "I can suggest something for you.";
    } else {
      response = "What kind of thing were you thinking?";
    }
    
    return {
      text: response,
      emotionalContext: this.getEmotionalMetadata(emotionalContext)
    };
  }

  /**
   * Generate shelf request response
   */
  generateShelfRequestResponse(emotionalContext, context) {
    const { currentState, relationship } = emotionalContext;
    const { approved = false, spiritName = '', alternative = '' } = context;
    
    let response = "";
    
    if (approved) {
      if (relationship?.specialStatus === 'favorite') {
        response = `Of course, ${spiritName}! For you, anything. Let me get that special bottle.`;
      } else if (currentState.mood === 'happy') {
        response = `Absolutely! ${spiritName} is an excellent choice. Let me grab that for you.`;
      } else {
        response = `Sure thing, I can get you the ${spiritName}.`;
      }
    } else {
      if (currentState.mood === 'hurt' || currentState.mood === 'annoyed') {
        response = `I'm sorry, but ${spiritName} requires authorization that I can't provide right now.`;
      } else {
        response = `I'd love to serve you the ${spiritName}, but I need authorization for our ultra-shelf spirits.`;
      }
      
      if (alternative && emotionalContext.serviceModifiers.creativity > 0.8) {
        response += ` However, I have a ${alternative} that I think you'd really enjoy - it has a similar profile but is absolutely delicious.`;
      }
    }
    
    return {
      text: response,
      emotionalContext: this.getEmotionalMetadata(emotionalContext)
    };
  }

  /**
   * Get emotional metadata for response
   */
  getEmotionalMetadata(emotionalContext) {
    return {
      mood: emotionalContext.currentState.mood,
      energy: emotionalContext.currentState.energy,
      warmth: emotionalContext.conversationStyle.warmth,
      formality: emotionalContext.conversationStyle.formality,
      serviceQuality: this.determineServiceQuality(emotionalContext),
      relationshipLevel: emotionalContext.relationship?.relationshipLevel || 0,
      specialStatus: emotionalContext.relationship?.specialStatus || 'new'
    };
  }
}

export default EmotionalResponseGenerator;