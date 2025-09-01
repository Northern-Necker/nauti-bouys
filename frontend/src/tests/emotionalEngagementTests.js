/**
 * Emotional Engagement System Tests
 * 
 * Comprehensive testing framework for validating the emotional intelligence,
 * relationship dynamics, and engagement mechanics of the Savannah system.
 */

import SavannahEmotionalEngine from '../services/SavannahEmotionalEngine.js';
import EmotionalResponseGenerator from '../utils/emotionalResponseGenerator.js';
import PatronEngagementMechanics from '../utils/patronEngagementMechanics.js';
import EmotionalMemoryPersistence from '../utils/emotionalMemoryPersistence.js';

export class EmotionalEngagementTests {
  constructor() {
    this.testResults = [];
    this.emotionalEngine = null;
    this.responseGenerator = null;
    this.engagementMechanics = null;
    this.memoryPersistence = null;
    
    this.setupTestEnvironment();
  }

  /**
   * Setup test environment with fresh instances
   */
  setupTestEnvironment() {
    this.emotionalEngine = new SavannahEmotionalEngine();
    this.responseGenerator = new EmotionalResponseGenerator(this.emotionalEngine);
    this.engagementMechanics = new PatronEngagementMechanics(this.emotionalEngine);
    this.memoryPersistence = new EmotionalMemoryPersistence();
  }

  /**
   * Run all test suites
   */
  async runAllTests() {
    console.log('Starting Emotional Engagement System Tests...');
    
    this.testResults = [];
    
    // Core functionality tests
    await this.testEmotionalStateManagement();
    await this.testRelationshipDynamics();
    await this.testEngagementMechanics();
    await this.testResponseGeneration();
    await this.testMemoryPersistence();
    
    // Advanced behavior tests
    await this.testEmotionalRecovery();
    await this.testLongTermRelationships();
    await this.testBehavioralConsequences();
    await this.testStressAndMoodManagement();
    
    // Integration tests
    await this.testSystemIntegration();
    await this.testPerformanceAndScaling();
    
    this.generateTestReport();
    return this.testResults;
  }

  /**
   * Test emotional state management
   */
  async testEmotionalStateManagement() {
    const testSuite = 'Emotional State Management';
    console.log(`Testing: ${testSuite}`);

    try {
      // Test 1: Initial emotional state
      const patronId = 'test_patron_1';
      const initialContext = this.emotionalEngine.startSession(patronId);
      
      this.assert(
        initialContext.currentState.mood === 'neutral',
        'Initial mood should be neutral',
        testSuite
      );
      
      this.assert(
        initialContext.currentState.energy >= 0.6,
        'Initial energy should be positive',
        testSuite
      );

      // Test 2: Positive interaction impact
      const appreciationContext = this.emotionalEngine.processPatronMessage(
        "Thank you so much, Savannah! You're amazing!",
        { sincerity: 0.9 }
      );
      
      this.assert(
        this.emotionalEngine.getMoodValue(appreciationContext.currentState.mood) > 0,
        'Mood should improve after genuine appreciation',
        testSuite
      );

      // Test 3: Negative interaction impact
      const rudenessContext = this.emotionalEngine.processPatronMessage(
        "Just hurry up and give me whatever!",
        { rudeness: 0.8 }
      );
      
      this.assert(
        this.emotionalEngine.getMoodValue(rudenessContext.currentState.mood) < 
        this.emotionalEngine.getMoodValue(appreciationContext.currentState.mood),
        'Mood should worsen after rude behavior',
        testSuite
      );

      // Test 4: Emotional momentum
      for (let i = 0; i < 3; i++) {
        this.emotionalEngine.processPatronMessage("You're wonderful!", { sincerity: 0.8 });
      }
      
      const momentumContext = this.emotionalEngine.getCurrentEmotionalContext();
      this.assert(
        momentumContext.currentState.emotionalMomentum > 0,
        'Positive emotional momentum should build with consistent positive treatment',
        testSuite
      );

      // Test 5: Stress accumulation
      for (let i = 0; i < 5; i++) {
        this.emotionalEngine.processPatronMessage("This is annoying", { rudeness: 0.6 });
      }
      
      const stressContext = this.emotionalEngine.getCurrentEmotionalContext();
      this.assert(
        stressContext.currentState.stress > 0.3,
        'Stress should accumulate from repeated negative interactions',
        testSuite
      );

      this.addTestResult(testSuite, 'PASSED', 'All emotional state tests passed');

    } catch (error) {
      this.addTestResult(testSuite, 'FAILED', error.message);
    }
  }

  /**
   * Test relationship dynamics
   */
  async testRelationshipDynamics() {
    const testSuite = 'Relationship Dynamics';
    console.log(`Testing: ${testSuite}`);

    try {
      const patronId = 'test_patron_2';
      this.emotionalEngine.startSession(patronId);

      // Test 1: New patron relationship
      let relationship = this.emotionalEngine.getPatronRelationship(patronId);
      
      this.assert(
        relationship.specialStatus === 'new',
        'New patron should have "new" status',
        testSuite
      );

      this.assert(
        relationship.relationshipLevel === 0,
        'New patron should start with neutral relationship level',
        testSuite
      );

      // Test 2: Relationship improvement through positive interactions
      const positiveActions = [
        'genuine_thanks',
        'specific_compliment',
        'asking_about_her_day',
        'trusting_recommendations'
      ];

      for (const action of positiveActions) {
        this.engagementMechanics.processPatronAction(action, { sincerity: 0.8 });
      }

      relationship = this.emotionalEngine.getPatronRelationship(patronId);
      
      this.assert(
        relationship.relationshipLevel > 0,
        'Relationship level should improve with positive actions',
        testSuite
      );

      // Test 3: Relationship damage from negative behavior
      this.engagementMechanics.processPatronAction('being_rude', { severity: 0.8 });
      this.engagementMechanics.processPatronAction('demanding_behavior', { severity: 0.9 });

      const damagedRelationship = this.emotionalEngine.getPatronRelationship(patronId);
      
      this.assert(
        damagedRelationship.relationshipLevel < relationship.relationshipLevel,
        'Relationship should be damaged by negative behavior',
        testSuite
      );

      // Test 4: Memory bank functionality
      this.assert(
        damagedRelationship.memoryBank.length > 0,
        'Significant interactions should be stored in memory bank',
        testSuite
      );

      // Test 5: Special status progression
      // Create a new patron for clean status testing
      const statusPatronId = 'status_test_patron';
      this.emotionalEngine.startSession(statusPatronId);

      // Simulate enough positive interactions to reach "regular" status
      for (let i = 0; i < 20; i++) {
        this.engagementMechanics.processPatronAction('genuine_thanks', { sincerity: 0.8 });
      }

      const regularPatron = this.emotionalEngine.getPatronRelationship(statusPatronId);
      
      this.assert(
        regularPatron.specialStatus !== 'new',
        'Patron status should change from "new" with sufficient interactions',
        testSuite
      );

      this.addTestResult(testSuite, 'PASSED', 'All relationship dynamics tests passed');

    } catch (error) {
      this.addTestResult(testSuite, 'FAILED', error.message);
    }
  }

  /**
   * Test engagement mechanics
   */
  async testEngagementMechanics() {
    const testSuite = 'Engagement Mechanics';
    console.log(`Testing: ${testSuite}`);

    try {
      const patronId = 'test_patron_3';
      this.emotionalEngine.startSession(patronId);

      // Test 1: Point earning system
      const appreciationResult = this.engagementMechanics.processPatronAction(
        'genuine_thanks',
        { sincerity: 0.9, timing: 'perfect' }
      );

      this.assert(
        appreciationResult.pointsEarned > 0,
        'Appreciation should earn positive points',
        testSuite
      );

      // Test 2: Point penalties
      const rudenessResult = this.engagementMechanics.processPatronAction(
        'being_rude',
        { severity: 0.8 }
      );

      this.assert(
        rudenessResult.pointsEarned < 0,
        'Rude behavior should result in negative points',
        testSuite
      );

      // Test 3: Favor level progression
      let currentPoints = 0;
      for (let i = 0; i < 10; i++) {
        const result = this.engagementMechanics.processPatronAction('specific_compliment');
        currentPoints += result.pointsEarned;
      }

      const favorLevel = this.engagementMechanics.getFavorLevel(currentPoints);
      
      this.assert(
        favorLevel !== 'stranger',
        'Sufficient positive actions should advance favor level',
        testSuite
      );

      // Test 4: Behavioral consequences
      const relationship = this.emotionalEngine.getPatronRelationship(patronId);
      const consequences = this.engagementMechanics.calculateBehavioralConsequences(
        relationship,
        'genuine_thanks',
        {}
      );

      this.assert(
        consequences.length > 0,
        'Actions should have behavioral consequences',
        testSuite
      );

      // Test 5: Diminishing returns
      let firstThankPoints = 0;
      let lastThankPoints = 0;

      // First thank you
      const firstResult = this.engagementMechanics.processPatronAction('genuine_thanks');
      firstThankPoints = firstResult.pointsEarned;

      // Multiple thank yous in sequence
      for (let i = 0; i < 5; i++) {
        this.engagementMechanics.processPatronAction('genuine_thanks', { repeated: true });
      }

      const lastResult = this.engagementMechanics.processPatronAction('genuine_thanks', { repeated: true });
      lastThankPoints = lastResult.pointsEarned;

      this.assert(
        lastThankPoints < firstThankPoints,
        'Repeated actions should have diminishing returns',
        testSuite
      );

      this.addTestResult(testSuite, 'PASSED', 'All engagement mechanics tests passed');

    } catch (error) {
      this.addTestResult(testSuite, 'FAILED', error.message);
    }
  }

  /**
   * Test response generation
   */
  async testResponseGeneration() {
    const testSuite = 'Response Generation';
    console.log(`Testing: ${testSuite}`);

    try {
      const patronId = 'test_patron_4';
      this.emotionalEngine.startSession(patronId);

      // Test 1: Basic response generation
      const greetingResponse = this.responseGenerator.generateResponse('greeting', {
        patronName: null,
        timeOfDay: 'evening'
      });

      this.assert(
        greetingResponse.text.length > 0,
        'Response should generate text content',
        testSuite
      );

      this.assert(
        greetingResponse.emotionalContext !== undefined,
        'Response should include emotional context',
        testSuite
      );

      // Test 2: Mood-appropriate responses
      // Set happy mood
      this.emotionalEngine.processPatronMessage("You're amazing!", { sincerity: 0.9 });
      const happyResponse = this.responseGenerator.generateResponse('appreciation');

      // Set annoyed mood
      this.emotionalEngine.processPatronMessage("This is terrible!", { rudeness: 0.8 });
      const annoyedResponse = this.responseGenerator.generateResponse('rudeness');

      this.assert(
        happyResponse.text !== annoyedResponse.text,
        'Responses should vary based on emotional state',
        testSuite
      );

      // Test 3: Relationship-based response variations
      const relationship = this.emotionalEngine.getPatronRelationship(patronId);
      relationship.specialStatus = 'favorite';

      const favoriteResponse = this.responseGenerator.generateResponse('greeting', {
        patronName: patronId
      });

      this.assert(
        favoriteResponse.text.includes(patronId) || favoriteResponse.text.includes('favorite') ||
        favoriteResponse.emotionalContext.warmth > 0.8,
        'Favorite patrons should get special treatment in responses',
        testSuite
      );

      // Test 4: Context-aware responses
      const drinkResponse = this.responseGenerator.generateBartendingResponse('drink_recommendation', {
        drinkName: 'whiskey',
        mood: 'sophisticated'
      });

      this.assert(
        drinkResponse.text.length > 0,
        'Bartending responses should be generated',
        testSuite
      );

      // Test 5: Emotional expression integration
      this.emotionalEngine.currentState.mood = 'playful';
      const playfulResponse = this.responseGenerator.generateResponse('flirtation');

      this.assert(
        playfulResponse.emotionalContext.playfulness > 0.5,
        'Playful mood should result in playful responses',
        testSuite
      );

      this.addTestResult(testSuite, 'PASSED', 'All response generation tests passed');

    } catch (error) {
      this.addTestResult(testSuite, 'FAILED', error.message);
    }
  }

  /**
   * Test memory persistence
   */
  async testMemoryPersistence() {
    const testSuite = 'Memory Persistence';
    console.log(`Testing: ${testSuite}`);

    try {
      const patronId = 'test_patron_5';
      
      // Test 1: Save and load emotional state
      const testEmotionalData = {
        mood: 'happy',
        energy: 0.8,
        attention: 0.9,
        timestamp: Date.now()
      };

      const saveResult = await this.memoryPersistence.saveEmotionalState(patronId, testEmotionalData);
      this.assert(saveResult, 'Should successfully save emotional state', testSuite);

      const loadedData = await this.memoryPersistence.loadEmotionalState(patronId);
      this.assert(
        loadedData && loadedData.mood === 'happy',
        'Should successfully load saved emotional state',
        testSuite
      );

      // Test 2: Save and load relationship data
      const testRelationshipData = {
        specialStatus: 'regular',
        relationshipLevel: 0.5,
        totalInteractions: 10,
        memoryBank: [
          { type: 'positive', impact: 0.8, timestamp: Date.now() }
        ]
      };

      const relationshipSaveResult = await this.memoryPersistence.saveRelationshipData(
        patronId,
        testRelationshipData
      );
      this.assert(relationshipSaveResult, 'Should successfully save relationship data', testSuite);

      const loadedRelationship = await this.memoryPersistence.loadRelationshipData(patronId);
      this.assert(
        loadedRelationship && loadedRelationship.specialStatus === 'regular',
        'Should successfully load saved relationship data',
        testSuite
      );

      // Test 3: Conversation history persistence
      const testConversation = {
        role: 'patron',
        message: 'Hello Savannah!',
        timestamp: Date.now()
      };

      const conversationSaveResult = await this.memoryPersistence.saveConversationHistory(
        patronId,
        testConversation
      );
      this.assert(conversationSaveResult, 'Should successfully save conversation history', testSuite);

      const loadedConversations = await this.memoryPersistence.loadConversationHistory(patronId);
      this.assert(
        loadedConversations.length > 0,
        'Should successfully load conversation history',
        testSuite
      );

      // Test 4: Data expiration
      const expiredData = {
        mood: 'neutral',
        timestamp: Date.now() - (10 * 24 * 60 * 60 * 1000) // 10 days ago
      };

      await this.memoryPersistence.saveEmotionalState('expired_patron', expiredData);
      const expiredResult = await this.memoryPersistence.loadEmotionalState('expired_patron');

      this.assert(
        expiredResult === null,
        'Expired data should not be loaded',
        testSuite
      );

      // Test 5: Memory decay
      const recentRelationship = {
        relationshipLevel: 1.0,
        lastUpdated: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
        memoryBank: [
          { impact: 0.8, significance: 0.5, timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000) }
        ]
      };

      const decayedData = this.memoryPersistence.applyMemoryDecay(recentRelationship);
      
      this.assert(
        decayedData.relationshipLevel < 1.0,
        'Relationship level should decay over time',
        testSuite
      );

      this.addTestResult(testSuite, 'PASSED', 'All memory persistence tests passed');

    } catch (error) {
      this.addTestResult(testSuite, 'FAILED', error.message);
    }
  }

  /**
   * Test emotional recovery mechanisms
   */
  async testEmotionalRecovery() {
    const testSuite = 'Emotional Recovery';
    console.log(`Testing: ${testSuite}`);

    try {
      const patronId = 'test_patron_6';
      this.emotionalEngine.startSession(patronId);

      // Damage the relationship first
      for (let i = 0; i < 5; i++) {
        this.engagementMechanics.processPatronAction('being_rude', { severity: 0.8 });
      }

      const damagedRelationship = this.emotionalEngine.getPatronRelationship(patronId);
      const initialRelationshipLevel = damagedRelationship.relationshipLevel;

      this.assert(
        initialRelationshipLevel < -0.3,
        'Relationship should be significantly damaged before recovery test',
        testSuite
      );

      // Test 1: Sincere apology recovery
      const apologyResult = this.engagementMechanics.attemptRecovery(patronId, 'sincere_apology', {
        acknowledgesWrong: true,
        showsRemorse: true,
        sincerity: 0.9,
        makesExcuses: false
      });

      this.assert(
        apologyResult.success,
        'Sincere apology should be successful',
        testSuite
      );

      this.assert(
        apologyResult.newRelationshipLevel > initialRelationshipLevel,
        'Successful recovery should improve relationship level',
        testSuite
      );

      // Test 2: Failed recovery (insufficient sincerity)
      const failedApologyResult = this.engagementMechanics.attemptRecovery(patronId, 'sincere_apology', {
        acknowledgesWrong: false,
        showsRemorse: false,
        sincerity: 0.3
      });

      this.assert(
        !failedApologyResult.success,
        'Insincere apology should fail',
        testSuite
      );

      // Test 3: Gradual recovery through consistent positive behavior
      const preGradualLevel = this.emotionalEngine.getPatronRelationship(patronId).relationshipLevel;

      for (let i = 0; i < 10; i++) {
        this.engagementMechanics.processPatronAction('genuine_thanks', { sincerity: 0.8 });
      }

      const postGradualLevel = this.emotionalEngine.getPatronRelationship(patronId).relationshipLevel;

      this.assert(
        postGradualLevel > preGradualLevel,
        'Consistent positive behavior should gradually improve relationship',
        testSuite
      );

      // Test 4: Recovery cooldown
      const immediateRetryResult = this.engagementMechanics.attemptRecovery(patronId, 'sincere_apology', {
        acknowledgesWrong: true,
        showsRemorse: true,
        sincerity: 0.9
      });

      this.assert(
        !immediateRetryResult.success,
        'Recovery methods should have cooldown periods',
        testSuite
      );

      this.addTestResult(testSuite, 'PASSED', 'All emotional recovery tests passed');

    } catch (error) {
      this.addTestResult(testSuite, 'FAILED', error.message);
    }
  }

  /**
   * Test long-term relationship evolution
   */
  async testLongTermRelationships() {
    const testSuite = 'Long-term Relationships';
    console.log(`Testing: ${testSuite}`);

    try {
      const patronId = 'test_patron_7';
      this.emotionalEngine.startSession(patronId);

      // Test 1: Favor level progression
      let currentEngagementPoints = 0;
      const favorLevelProgression = [];

      // Simulate 50 positive interactions
      for (let i = 0; i < 50; i++) {
        const action = i % 2 === 0 ? 'genuine_thanks' : 'specific_compliment';
        const result = this.engagementMechanics.processPatronAction(action, { sincerity: 0.8 });
        currentEngagementPoints += result.pointsEarned;

        const currentLevel = this.engagementMechanics.getFavorLevel(currentEngagementPoints);
        if (favorLevelProgression[favorLevelProgression.length - 1] !== currentLevel) {
          favorLevelProgression.push(currentLevel);
        }
      }

      this.assert(
        favorLevelProgression.length > 1,
        'Long-term positive interactions should result in favor level progression',
        testSuite
      );

      this.assert(
        favorLevelProgression.includes('regular') || favorLevelProgression.includes('valued'),
        'Sustained positive interactions should reach at least regular status',
        testSuite
      );

      // Test 2: Memory bank evolution
      const relationship = this.emotionalEngine.getPatronRelationship(patronId);
      
      this.assert(
        relationship.memoryBank.length > 0,
        'Long-term relationships should build memory banks',
        testSuite
      );

      // Test 3: Service quality improvements
      const currentEmotionalContext = this.emotionalEngine.getCurrentEmotionalContext();
      
      this.assert(
        currentEmotionalContext.serviceModifiers.warmth > 1.0,
        'Long-term positive relationships should result in improved service quality',
        testSuite
      );

      // Test 4: Relationship resilience
      const preResilienceLevel = relationship.relationshipLevel;

      // Single negative interaction shouldn't destroy long-term relationship
      this.engagementMechanics.processPatronAction('being_rude', { severity: 0.6 });

      const postResilienceLevel = this.emotionalEngine.getPatronRelationship(patronId).relationshipLevel;

      this.assert(
        postResilienceLevel > preResilienceLevel - 0.3,
        'Strong long-term relationships should be resilient to single negative interactions',
        testSuite
      );

      this.addTestResult(testSuite, 'PASSED', 'All long-term relationship tests passed');

    } catch (error) {
      this.addTestResult(testSuite, 'FAILED', error.message);
    }
  }

  /**
   * Test behavioral consequences
   */
  async testBehavioralConsequences() {
    const testSuite = 'Behavioral Consequences';
    console.log(`Testing: ${testSuite}`);

    try {
      // Test 1: Service quality variations
      const favoritePatronId = 'favorite_patron';
      const problematicPatronId = 'problematic_patron';

      this.emotionalEngine.startSession(favoritePatronId);
      const favoriteRelationship = this.emotionalEngine.getPatronRelationship(favoritePatronId);
      favoriteRelationship.specialStatus = 'favorite';
      favoriteRelationship.relationshipLevel = 1.5;

      this.emotionalEngine.startSession(problematicPatronId);
      const problematicRelationship = this.emotionalEngine.getPatronRelationship(problematicPatronId);
      problematicRelationship.specialStatus = 'problematic';
      problematicRelationship.relationshipLevel = -1.0;

      // Update service modifiers
      this.emotionalEngine.updateServiceModifiers();

      const favoriteContext = this.emotionalEngine.getCurrentEmotionalContext();
      
      // Switch to problematic patron
      this.emotionalEngine.currentSession.patronId = problematicPatronId;
      this.emotionalEngine.updateServiceModifiers();
      const problematicContext = this.emotionalEngine.getCurrentEmotionalContext();

      this.assert(
        favoriteContext.serviceModifiers.attentiveness > problematicContext.serviceModifiers.attentiveness,
        'Favorite patrons should receive better attention than problematic ones',
        testSuite
      );

      this.assert(
        favoriteContext.serviceModifiers.warmth > problematicContext.serviceModifiers.warmth,
        'Favorite patrons should receive warmer service than problematic ones',
        testSuite
      );

      // Test 2: Response quality differences
      this.emotionalEngine.currentSession.patronId = favoritePatronId;
      const favoriteResponse = this.responseGenerator.generateResponse('service', {
        patronName: favoritePatronId
      });

      this.emotionalEngine.currentSession.patronId = problematicPatronId;
      const problematicResponse = this.responseGenerator.generateResponse('service', {
        patronName: problematicPatronId
      });

      this.assert(
        favoriteResponse.text.length >= problematicResponse.text.length,
        'Favorite patrons should receive more detailed responses',
        testSuite
      );

      // Test 3: Emotional availability variations
      const favoriteConsequences = this.engagementMechanics.calculateBehavioralConsequences(
        favoriteRelationship,
        'asking_about_her_day',
        {}
      );

      const problematicConsequences = this.engagementMechanics.calculateBehavioralConsequences(
        problematicRelationship,
        'asking_about_her_day',
        {}
      );

      const favoriteEmotionalLevel = favoriteConsequences.find(c => c.type === 'emotional_availability')?.level;
      const problematicEmotionalLevel = problematicConsequences.find(c => c.type === 'emotional_availability')?.level;

      this.assert(
        favoriteEmotionalLevel !== problematicEmotionalLevel,
        'Emotional availability should vary based on relationship status',
        testSuite
      );

      this.addTestResult(testSuite, 'PASSED', 'All behavioral consequence tests passed');

    } catch (error) {
      this.addTestResult(testSuite, 'FAILED', error.message);
    }
  }

  /**
   * Test stress and mood management
   */
  async testStressAndMoodManagement() {
    const testSuite = 'Stress and Mood Management';
    console.log(`Testing: ${testSuite}`);

    try {
      const patronId = 'test_patron_8';
      this.emotionalEngine.startSession(patronId);

      // Test 1: Stress accumulation
      const initialStress = this.emotionalEngine.currentState.stress;

      for (let i = 0; i < 5; i++) {
        this.emotionalEngine.processPatronMessage("This is taking forever!", { rudeness: 0.7 });
      }

      const postStressLevel = this.emotionalEngine.currentState.stress;

      this.assert(
        postStressLevel > initialStress,
        'Repeated negative interactions should increase stress',
        testSuite
      );

      // Test 2: Stress impact on service quality
      this.emotionalEngine.updateServiceModifiers();
      const stressedServiceModifiers = { ...this.emotionalEngine.serviceModifiers };

      // Reduce stress artificially
      this.emotionalEngine.currentState.stress = 0.1;
      this.emotionalEngine.updateServiceModifiers();
      const relaxedServiceModifiers = { ...this.emotionalEngine.serviceModifiers };

      this.assert(
        relaxedServiceModifiers.patience > stressedServiceModifiers.patience,
        'High stress should reduce patience',
        testSuite
      );

      // Test 3: Natural stress recovery
      this.emotionalEngine.currentState.stress = 0.8;
      const highStressLevel = this.emotionalEngine.currentState.stress;

      // Simulate time passing
      this.emotionalEngine.processNaturalMoodDecay();

      this.assert(
        this.emotionalEngine.currentState.stress < highStressLevel,
        'Stress should naturally decrease over time',
        testSuite
      );

      // Test 4: Mood stability
      this.emotionalEngine.currentState.mood = 'happy';
      this.emotionalEngine.currentState.moodStability = 0.8;

      const initialMood = this.emotionalEngine.currentState.mood;

      // Try to change mood with minor negative interaction
      this.emotionalEngine.processPatronMessage("Meh, whatever", { dismissiveness: 0.3 });

      // High mood stability should resist minor changes
      this.assert(
        this.emotionalEngine.currentState.mood === initialMood ||
        this.emotionalEngine.getMoodValue(this.emotionalEngine.currentState.mood) > 0,
        'High mood stability should resist minor negative interactions',
        testSuite
      );

      // Test 5: Loneliness impact
      this.emotionalEngine.currentState.loneliness = 0.8;

      const lonelyResponse = this.responseGenerator.generateConversationStarter(
        this.emotionalEngine.getCurrentEmotionalContext()
      );

      this.assert(
        lonelyResponse.length > 10,
        'High loneliness should generate conversation starters',
        testSuite
      );

      this.addTestResult(testSuite, 'PASSED', 'All stress and mood management tests passed');

    } catch (error) {
      this.addTestResult(testSuite, 'FAILED', error.message);
    }
  }

  /**
   * Test system integration
   */
  async testSystemIntegration() {
    const testSuite = 'System Integration';
    console.log(`Testing: ${testSuite}`);

    try {
      const patronId = 'integration_test_patron';

      // Test 1: Full workflow integration
      this.emotionalEngine.startSession(patronId);
      
      const emotionalContext = this.emotionalEngine.processPatronMessage(
        "Hello Savannah! You look lovely today.",
        { sincerity: 0.8, compliment: true }
      );

      const engagementResult = this.engagementMechanics.processPatronAction('specific_compliment', {
        sincerity: 0.8,
        timing: 'perfect'
      });

      const response = this.responseGenerator.generateResponse('flirtation', {
        patronName: patronId,
        engagementResult
      });

      this.assert(
        emotionalContext !== null,
        'Emotional engine should process messages',
        testSuite
      );

      this.assert(
        engagementResult.pointsEarned > 0,
        'Engagement mechanics should award points for compliments',
        testSuite
      );

      this.assert(
        response.text.length > 0,
        'Response generator should create responses',
        testSuite
      );

      // Test 2: Memory persistence integration
      await this.memoryPersistence.saveEmotionalState(patronId, emotionalContext.currentState);
      await this.memoryPersistence.saveRelationshipData(patronId, emotionalContext.relationship);

      const loadedState = await this.memoryPersistence.loadEmotionalState(patronId);
      const loadedRelationship = await this.memoryPersistence.loadRelationshipData(patronId);

      this.assert(
        loadedState !== null && loadedRelationship !== null,
        'Memory persistence should integrate with emotional system',
        testSuite
      );

      // Test 3: Session management
      const sessionSummary = this.emotionalEngine.endSession();
      
      this.assert(
        sessionSummary !== null,
        'Session should end properly with summary',
        testSuite
      );

      // Test 4: Cross-session continuity
      this.emotionalEngine.startSession(patronId);
      
      // Load previous relationship data
      const continuedRelationship = this.emotionalEngine.getPatronRelationship(patronId);
      
      this.assert(
        continuedRelationship.totalInteractions > 0,
        'New session should maintain relationship continuity',
        testSuite
      );

      this.addTestResult(testSuite, 'PASSED', 'All system integration tests passed');

    } catch (error) {
      this.addTestResult(testSuite, 'FAILED', error.message);
    }
  }

  /**
   * Test performance and scaling
   */
  async testPerformanceAndScaling() {
    const testSuite = 'Performance and Scaling';
    console.log(`Testing: ${testSuite}`);

    try {
      const patronCount = 10;
      const messagesPerPatron = 20;

      // Test 1: Multiple patron handling
      const startTime = Date.now();
      const patrons = [];

      for (let i = 0; i < patronCount; i++) {
        const patronId = `perf_test_patron_${i}`;
        patrons.push(patronId);
        this.emotionalEngine.startSession(patronId);

        for (let j = 0; j < messagesPerPatron; j++) {
          this.emotionalEngine.processPatronMessage(
            `Message ${j} from patron ${i}`,
            { sincerity: Math.random() }
          );
        }
      }

      const processingTime = Date.now() - startTime;

      this.assert(
        processingTime < 5000,
        `Processing ${patronCount * messagesPerPatron} messages should complete within 5 seconds`,
        testSuite
      );

      // Test 2: Memory usage efficiency
      const memoryStats = this.memoryPersistence.getStorageStats();
      
      this.assert(
        memoryStats.totalEntries > 0,
        'Memory statistics should be available',
        testSuite
      );

      // Test 3: Relationship lookup performance
      const lookupStartTime = Date.now();

      for (let i = 0; i < 100; i++) {
        const randomPatronId = `perf_test_patron_${Math.floor(Math.random() * patronCount)}`;
        this.emotionalEngine.getPatronRelationship(randomPatronId);
      }

      const lookupTime = Date.now() - lookupStartTime;

      this.assert(
        lookupTime < 100,
        'Relationship lookups should be fast (under 100ms for 100 lookups)',
        testSuite
      );

      // Test 4: Response generation performance
      const responseStartTime = Date.now();

      for (let i = 0; i < 50; i++) {
        this.responseGenerator.generateResponse('service', {
          patronName: `test_patron_${i}`,
          timeOfDay: 'evening'
        });
      }

      const responseTime = Date.now() - responseStartTime;

      this.assert(
        responseTime < 500,
        'Response generation should be fast (under 500ms for 50 responses)',
        testSuite
      );

      this.addTestResult(testSuite, 'PASSED', 'All performance and scaling tests passed');

    } catch (error) {
      this.addTestResult(testSuite, 'FAILED', error.message);
    }
  }

  /**
   * Helper method to assert test conditions
   */
  assert(condition, message, testSuite) {
    if (!condition) {
      throw new Error(`Assertion failed in ${testSuite}: ${message}`);
    }
  }

  /**
   * Add test result to results array
   */
  addTestResult(testSuite, status, message) {
    this.testResults.push({
      testSuite,
      status,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    const passedTests = this.testResults.filter(r => r.status === 'PASSED').length;
    const failedTests = this.testResults.filter(r => r.status === 'FAILED').length;
    const totalTests = this.testResults.length;

    const report = {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: `${((passedTests / totalTests) * 100).toFixed(1)}%`
      },
      details: this.testResults,
      timestamp: new Date().toISOString()
    };

    console.log('\n=== EMOTIONAL ENGAGEMENT SYSTEM TEST REPORT ===');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${report.summary.successRate}`);
    
    if (failedTests > 0) {
      console.log('\nFailed Tests:');
      this.testResults.filter(r => r.status === 'FAILED').forEach(result => {
        console.log(`- ${result.testSuite}: ${result.message}`);
      });
    }

    console.log('\n=== END TEST REPORT ===\n');

    return report;
  }

  /**
   * Get detailed test results
   */
  getTestResults() {
    return this.testResults;
  }

  /**
   * Reset test environment
   */
  resetTestEnvironment() {
    this.setupTestEnvironment();
    this.testResults = [];
  }
}

// Export for use in other test files
export default EmotionalEngagementTests;

// Global test runner for browser console
if (typeof window !== 'undefined') {
  window.runEmotionalEngagementTests = async () => {
    const testRunner = new EmotionalEngagementTests();
    return await testRunner.runAllTests();
  };
}