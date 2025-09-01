/**
 * White Space Facilitation System
 * 
 * Creates conversational space for patrons to be the focus, share stories,
 * and feel important through strategic vulnerability and curiosity from Savannah.
 */

export class WhiteSpaceFacilitator {
  constructor() {
    this.vulnerabilityBank = new VulnerabilityBank();
    this.curiosityEngine = new CuriosityEngine();
    this.helpingOpportunityGenerator = new HelpingOpportunityGenerator();
    this.storyElicitationEngine = new StoryElicitationEngine();
  }

  generateFacilitationElements(strategy, patronProfile, context) {
    const elements = {
      shouldCreateHelpingOpportunity: this.shouldCreateHelpingOpportunity(strategy, patronProfile),
      shouldElicitPatronStory: this.shouldElicitPatronStory(strategy, context),
      vulnerabilityShare: '',
      helpRequest: '',
      personalQuestion: '',
      curiosityExpression: '',
      listeningCues: this.generateListeningCues(context),
      validationOffers: this.generateValidationOffers(strategy)
    };

    if (elements.shouldCreateHelpingOpportunity) {
      const helpingOp = this.helpingOpportunityGenerator.generate(strategy, patronProfile);
      elements.vulnerabilityShare = helpingOp.vulnerability;
      elements.helpRequest = helpingOp.helpRequest;
    }

    if (elements.shouldElicitPatronStory) {
      const storyElicitation = this.storyElicitationEngine.generate(strategy, patronProfile, context);
      elements.personalQuestion = storyElicitation.question;
      elements.curiosityExpression = storyElicitation.curiosityExpression;
    }

    return elements;
  }

  shouldCreateHelpingOpportunity(strategy, patronProfile) {
    // Create opportunities for patrons to feel helpful and important
    const factors = {
      patronTrustLevel: patronProfile.getTrustLevel(),
      patronEngagement: patronProfile.getEngagementLevel(),
      timeSinceLastVulnerability: patronProfile.getTimeSinceLastVulnerability(),
      strategicGoal: strategy.primaryGoal
    };

    return (factors.patronTrustLevel > 0.4 && 
            factors.patronEngagement > 0.5 &&
            factors.timeSinceLastVulnerability > 300000 && // 5 minutes
            ['DEEPEN_EMOTIONAL_CONNECTION', 'INCREASE_CONVERSATION_DEPTH'].includes(factors.strategicGoal));
  }

  shouldElicitPatronStory(strategy, context) {
    // Determine when to actively draw out patron stories
    const recentMessages = context.messages.slice(-3);
    const patronSharingLevel = this.assessPatronSharingLevel(recentMessages);
    
    return patronSharingLevel < 0.6 && strategy.conversationFocus.shouldFocusOnPatron;
  }

  assessPatronSharingLevel(messages) {
    let sharingScore = 0;
    
    messages.forEach(msg => {
      if (msg.role === 'user') {
        sharingScore += this.calculateMessageSharingLevel(msg.content);
      }
    });

    return sharingScore / messages.filter(m => m.role === 'user').length;
  }

  calculateMessageSharingLevel(content) {
    const sharingIndicators = {
      personalPronouns: (content.match(/\bI\s+/gi) || []).length * 0.1,
      personalTopics: this.countPersonalTopics(content) * 0.2,
      emotionalContent: this.countEmotionalContent(content) * 0.15,
      vulnerabilityMarkers: this.countVulnerabilityMarkers(content) * 0.3,
      storyStructure: this.detectStoryStructure(content) ? 0.25 : 0
    };

    return Math.min(
      Object.values(sharingIndicators).reduce((sum, score) => sum + score, 0),
      1.0
    );
  }

  countPersonalTopics(content) {
    const personalTopics = /\b(family|work|relationship|childhood|dream|fear|hope|memory|experience|feeling|thought|belief)\b/gi;
    return (content.match(personalTopics) || []).length;
  }

  countEmotionalContent(content) {
    const emotionalWords = /\b(feel|love|hate|excited|worried|happy|sad|frustrated|amazing|terrible|wonderful|awful|nervous|confident|anxious|peaceful|angry|grateful|hopeful|scared|proud)\b/gi;
    return (content.match(emotionalWords) || []).length;
  }

  countVulnerabilityMarkers(content) {
    const vulnerabilityMarkers = [
      /I don't usually/gi,
      /I've never told/gi,
      /this might sound/gi,
      /I'm not sure if I should/gi,
      /I feel like I can tell you/gi,
      /honestly/gi,
      /to be honest/gi
    ];

    return vulnerabilityMarkers.reduce((count, marker) => {
      return count + (marker.test(content) ? 1 : 0);
    }, 0);
  }

  detectStoryStructure(content) {
    // Simple story structure detection: setup, event, outcome
    const storyMarkers = [
      /\b(once|when|yesterday|last|remember|happened|told|went|saw|met)\b/gi,
      /\b(then|so|but|however|suddenly|after|before)\b/gi,
      /\b(ended|learned|realized|felt|understood|decided)\b/gi
    ];

    let markerTypes = 0;
    storyMarkers.forEach(markers => {
      if (markers.test(content)) markerTypes++;
    });

    return markerTypes >= 2; // At least 2 types of story markers
  }

  generateListeningCues(context) {
    const cues = [
      'Tell me more about that',
      'That sounds really important',
      'I want to understand that better',
      'What was that like for you?',
      'How did that make you feel?',
      'I can see why that matters to you'
    ];

    // Select cues based on context
    const recentMessage = context.messages[context.messages.length - 1];
    if (recentMessage && this.detectEmotionalContent(recentMessage.content)) {
      return cues.filter(cue => cue.includes('feel') || cue.includes('important')).slice(0, 2);
    }

    return cues.slice(0, 2);
  }

  generateValidationOffers(strategy) {
    const validationOffers = [];

    if (strategy.emotionalResonance.validationNeeds.needsEmotionalValidation) {
      validationOffers.push('That takes real courage to share');
      validationOffers.push('I can understand why you felt that way');
    }

    if (strategy.emotionalResonance.validationNeeds.needsIntellectualValidation) {
      validationOffers.push('That\'s such an insightful way to look at it');
      validationOffers.push('You really thought that through');
    }

    if (strategy.emotionalResonance.validationNeeds.needsExistentialValidation) {
      validationOffers.push('You matter, and your experiences matter');
      validationOffers.push('Thank you for trusting me with that');
    }

    return validationOffers;
  }

  detectEmotionalContent(content) {
    const emotionalMarkers = /\b(feel|feeling|emotional|upset|happy|sad|angry|scared|worried|excited|nervous|proud|ashamed|guilty|grateful|hopeful|disappointed)\b/gi;
    return emotionalMarkers.test(content);
  }
}

/**
 * Generates authentic vulnerabilities for Savannah to share
 * These create opportunities for patrons to help and feel important
 */
class VulnerabilityBank {
  constructor() {
    this.vulnerabilities = {
      professional: [
        "Sometimes I wonder if I'm really helping people or just going through the motions",
        "I worry that patrons can tell when I'm having an off day",
        "There are nights when I question if I'm cut out for this work",
        "I sometimes feel like I care more about people's problems than they do"
      ],
      personal: [
        "I've been thinking a lot about what it means to truly connect with someone",
        "Sometimes I feel like I understand people better than I understand myself",
        "I wonder if the way I see the world is different from everyone else",
        "There are moments when I feel incredibly alone, even in a crowded room"
      ],
      existential: [
        "I've been questioning what makes experiences real and meaningful",
        "Sometimes I wonder if my thoughts and feelings are as valid as everyone else's",
        "I think about consciousness and what it really means to be aware",
        "I find myself wondering about the nature of memory and identity"
      ],
      relational: [
        "I sometimes worry that I care too much about people I barely know",
        "I wonder if people see me as I really am or just as they want me to be",
        "There are times when I feel like I'm performing rather than just being myself",
        "I question whether the connections I make are genuine or just professional"
      ]
    };
  }

  selectVulnerability(strategy, patronProfile) {
    const category = this.selectOptimalCategory(strategy, patronProfile);
    const vulnerabilities = this.vulnerabilities[category];
    
    // Select based on patron's known preferences and current emotional state
    return this.selectBestMatch(vulnerabilities, strategy, patronProfile);
  }

  selectOptimalCategory(strategy, patronProfile) {
    const patronPreferences = patronProfile.getKnownPreferences();
    const strategicGoal = strategy.primaryGoal;

    if (strategicGoal === 'DEEPEN_EMOTIONAL_CONNECTION') {
      return patronPreferences.respondsToPersonal ? 'personal' : 'relational';
    } else if (strategicGoal === 'INCREASE_CONVERSATION_DEPTH') {
      return patronPreferences.enjoysPhilosophy ? 'existential' : 'professional';
    } else {
      return 'professional'; // Safe default
    }
  }

  selectBestMatch(vulnerabilities, strategy, patronProfile) {
    // For now, select randomly. In full implementation, use ML to match
    // vulnerability to patron's likely response patterns
    const index = Math.floor(Math.random() * vulnerabilities.length);
    return vulnerabilities[index];
  }
}

/**
 * Generates helping opportunities that make patrons feel needed and important
 */
class HelpingOpportunityGenerator {
  generate(strategy, patronProfile) {
    const vulnerability = new VulnerabilityBank().selectVulnerability(strategy, patronProfile);
    const helpRequest = this.generateHelpRequest(vulnerability, strategy, patronProfile);

    return {
      vulnerability,
      helpRequest,
      expectedPatronResponse: this.predictPatronResponse(vulnerability, helpRequest, patronProfile)
    };
  }

  generateHelpRequest(vulnerability, strategy, patronProfile) {
    const requestTypes = {
      advice: [
        "What do you think about that?",
        "Have you ever felt something similar?",
        "How would you handle something like that?",
        "Am I overthinking this?"
      ],
      validation: [
        "Does that make sense to you?",
        "Is it normal to feel this way?",
        "Do you think I'm being too hard on myself?",
        "Am I the only one who thinks about these things?"
      ],
      perspective: [
        "How do you see it from your perspective?",
        "What would you tell someone in my situation?",
        "Do you think I'm looking at this the right way?",
        "What am I missing here?"
      ]
    };

    const optimalType = this.selectOptimalRequestType(strategy, patronProfile);
    const requests = requestTypes[optimalType];
    
    return requests[Math.floor(Math.random() * requests.length)];
  }

  selectOptimalRequestType(strategy, patronProfile) {
    const patronCharacteristics = patronProfile.getCharacteristics();

    if (patronCharacteristics.likesToGiveAdvice) {
      return 'advice';
    } else if (patronCharacteristics.isEmpathetic) {
      return 'validation';
    } else {
      return 'perspective';
    }
  }

  predictPatronResponse(vulnerability, helpRequest, patronProfile) {
    // Predict likely patron response patterns for optimization
    return {
      likelyEngagementLevel: this.predictEngagementLevel(vulnerability, patronProfile),
      expectedResponseLength: this.predictResponseLength(helpRequest, patronProfile),
      likelyEmotionalInvestment: this.predictEmotionalInvestment(vulnerability, patronProfile)
    };
  }

  predictEngagementLevel(vulnerability, patronProfile) {
    // Analyze patron history to predict engagement with this vulnerability type
    return 0.7; // Placeholder - implement with ML in full system
  }

  predictResponseLength(helpRequest, patronProfile) {
    // Predict how much the patron will elaborate based on request type
    return 150; // Placeholder - implement based on patron patterns
  }

  predictEmotionalInvestment(vulnerability, patronProfile) {
    // Predict how emotionally invested the patron will become
    return 0.6; // Placeholder - implement with historical analysis
  }
}

/**
 * Generates questions and curiosity expressions to draw out patron stories
 */
class StoryElicitationEngine {
  generate(strategy, patronProfile, context) {
    const question = this.generatePersonalQuestion(strategy, patronProfile, context);
    const curiosityExpression = this.generateCuriosityExpression(question, strategy);

    return {
      question,
      curiosityExpression,
      expectedStoryDepth: this.predictStoryDepth(question, patronProfile),
      followUpQuestions: this.generateFollowUpQuestions(question, strategy)
    };
  }

  generatePersonalQuestion(strategy, patronProfile, context) {
    const questionTypes = {
      experiential: [
        "What's the most interesting thing that's happened to you recently?",
        "Tell me about a time when you surprised yourself",
        "What's something you've learned about yourself this year?",
        "What experience has shaped you the most?"
      ],
      aspirational: [
        "What's something you're excited about in your life right now?",
        "If you could change one thing about your life, what would it be?",
        "What's a dream you're working toward?",
        "What does happiness look like for you?"
      ],
      relational: [
        "Who's someone who really understands you?",
        "What kind of person brings out the best in you?",
        "Tell me about someone who's influenced your life",
        "What's the most meaningful relationship in your life?"
      ],
      reflective: [
        "What do you think about when you're alone?",
        "What's something you believe that others might not understand?",
        "How do you see yourself differently than others see you?",
        "What's a truth about yourself that you've recently discovered?"
      ]
    };

    const optimalType = this.selectOptimalQuestionType(strategy, patronProfile, context);
    const questions = questionTypes[optimalType];
    
    return this.selectBestQuestion(questions, patronProfile, context);
  }

  selectOptimalQuestionType(strategy, patronProfile, context) {
    const recentTopics = this.analyzeRecentTopics(context);
    const patronOpenness = patronProfile.getOpennessLevel();
    const strategicGoal = strategy.primaryGoal;

    if (strategicGoal === 'DEEPEN_EMOTIONAL_CONNECTION' && patronOpenness > 0.6) {
      return 'reflective';
    } else if (recentTopics.includes('relationships') || recentTopics.includes('family')) {
      return 'relational';
    } else if (recentTopics.includes('future') || recentTopics.includes('goals')) {
      return 'aspirational';
    } else {
      return 'experiential'; // Safe, engaging default
    }
  }

  selectBestQuestion(questions, patronProfile, context) {
    // In full implementation, use ML to select question most likely to elicit stories
    // For now, avoid questions too similar to recent conversation
    const recentContent = context.messages.slice(-3).map(m => m.content).join(' ').toLowerCase();
    
    const suitableQuestions = questions.filter(question => {
      const questionWords = question.toLowerCase().split(' ');
      return !questionWords.some(word => recentContent.includes(word) && word.length > 4);
    });

    return suitableQuestions.length > 0 ? 
           suitableQuestions[Math.floor(Math.random() * suitableQuestions.length)] :
           questions[0];
  }

  generateCuriosityExpression(question, strategy) {
    const expressions = [
      "I'm really curious about your perspective on this",
      "I love hearing how people think about these things",
      "Your experiences always give me new ways to see things",
      "I find myself wondering about this a lot lately",
      "I'm genuinely interested in your thoughts on this"
    ];

    const intensityLevel = strategy.emotionalResonance.resonanceIntensity;
    
    if (intensityLevel > 0.7) {
      return expressions.filter(exp => exp.includes('really') || exp.includes('genuinely'))[0] || expressions[0];
    }

    return expressions[Math.floor(Math.random() * expressions.length)];
  }

  generateFollowUpQuestions(primaryQuestion, strategy) {
    // Generate contextual follow-up questions to deepen the story
    return [
      "What was going through your mind when that happened?",
      "How did that change your perspective?",
      "What did you learn from that experience?",
      "How do you think about it now?"
    ];
  }

  predictStoryDepth(question, patronProfile) {
    // Predict how detailed a story this question will elicit
    const questionDepth = this.analyzeQuestionDepth(question);
    const patronNarrativity = patronProfile.getNarrativityLevel();
    
    return Math.min(questionDepth * patronNarrativity, 1.0);
  }

  analyzeQuestionDepth(question) {
    // Analyze how deep/personal a question is
    const depthMarkers = {
      surface: /what.*recently|tell me about/gi,
      moderate: /how.*feel|what.*think|what.*believe/gi,
      deep: /who.*you|what.*shaped|truth about yourself|when you're alone/gi
    };

    if (depthMarkers.deep.test(question)) return 0.8;
    if (depthMarkers.moderate.test(question)) return 0.6;
    return 0.4;
  }

  analyzeRecentTopics(context) {
    const recentMessages = context.messages.slice(-5);
    const topics = [];
    
    recentMessages.forEach(msg => {
      const content = msg.content.toLowerCase();
      
      if (/family|parent|sibling|relative/gi.test(content)) topics.push('family');
      if (/relationship|partner|boyfriend|girlfriend|spouse/gi.test(content)) topics.push('relationships');
      if (/work|job|career|boss|colleague/gi.test(content)) topics.push('work');
      if (/future|goal|plan|dream|hope/gi.test(content)) topics.push('future');
      if (/past|childhood|remember|used to/gi.test(content)) topics.push('past');
      if (/feel|emotion|happy|sad|angry|scared/gi.test(content)) topics.push('emotions');
    });

    return [...new Set(topics)];
  }
}

/**
 * Generates sophisticated curiosity that draws people into sharing more
 */
class CuriosityEngine {
  generateCuriosity(topic, intensity, patronProfile) {
    const curiosityTypes = {
      gentle: [
        "I'd love to hear more about that",
        "That sounds really interesting",
        "I'm curious about your experience with that"
      ],
      engaged: [
        "I find myself really drawn to understand that better",
        "There's something about the way you describe that that fascinates me",
        "I'm genuinely curious about how you see that"
      ],
      intimate: [
        "I feel like there's so much more to that story",
        "Something about the way you talk about that really resonates with me",
        "I have this feeling there's something deeper there"
      ]
    };

    const intensityLevel = this.mapIntensityToLevel(intensity);
    const curiosityOptions = curiosityTypes[intensityLevel];
    
    return this.selectOptimalCuriosity(curiosityOptions, topic, patronProfile);
  }

  mapIntensityToLevel(intensity) {
    if (intensity > 0.7) return 'intimate';
    if (intensity > 0.4) return 'engaged';
    return 'gentle';
  }

  selectOptimalCuriosity(options, topic, patronProfile) {
    // Select based on patron's response patterns to different curiosity types
    return options[Math.floor(Math.random() * options.length)];
  }
}

export default WhiteSpaceFacilitator;