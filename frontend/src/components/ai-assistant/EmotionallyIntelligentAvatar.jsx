/**
 * Emotionally Intelligent Avatar Component
 * 
 * Integrates the emotional engagement system with the existing avatar components
 * to create a truly interactive and emotionally responsive Savannah experience.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import InteractiveAvatar from '../avatar3d/InteractiveAvatar.jsx';
import SavannahEmotionalEngine from '../../services/SavannahEmotionalEngine.js';
import EmotionalResponseGenerator from '../../utils/emotionalResponseGenerator.js';
import PatronEngagementMechanics from '../../utils/patronEngagementMechanics.js';
import ConversationContextService from '../../services/conversationContextService.js';

export default function EmotionallyIntelligentAvatar({
  patronId = 'default_patron',
  onEmotionalStateChange = null,
  onRelationshipChange = null,
  className = '',
  showEmotionalDebugInfo = false,
  enableEngagementMechanics = true,
  balanceSettings = {
    favor_difficulty: 'realistic',
    damage_sensitivity: 'realistic',
    memory_settings: 'realistic'
  }
}) {
  // Core emotional systems
  const [emotionalEngine] = useState(() => new SavannahEmotionalEngine());
  const [responseGenerator] = useState(() => new EmotionalResponseGenerator(emotionalEngine));
  const [engagementMechanics] = useState(() => new PatronEngagementMechanics(emotionalEngine));
  const [conversationContext] = useState(() => new ConversationContextService());
  
  // Component state
  const [currentEmotionalState, setCurrentEmotionalState] = useState(null);
  const [currentRelationship, setCurrentRelationship] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isProcessingMessage, setIsProcessingMessage] = useState(false);
  const [avatarReady, setAvatarReady] = useState(false);
  const [gestureService, setGestureService] = useState(null);
  
  // Refs for managing state
  const sessionActive = useRef(false);
  const lastMessageTime = useRef(Date.now());
  const emotionalUpdateInterval = useRef(null);

  // Initialize session when component mounts
  useEffect(() => {
    if (!sessionActive.current && patronId) {
      startEmotionalSession();
    }

    return () => {
      if (sessionActive.current) {
        endEmotionalSession();
      }
    };
  }, [patronId]);

  // Apply balance settings
  useEffect(() => {
    if (enableEngagementMechanics) {
      Object.entries(balanceSettings).forEach(([setting, value]) => {
        engagementMechanics.adjustBalance(setting, value);
      });
    }
  }, [balanceSettings, enableEngagementMechanics, engagementMechanics]);

  // Start emotional session
  const startEmotionalSession = useCallback(() => {
    try {
      const emotionalContext = emotionalEngine.startSession(patronId);
      const relationship = emotionalEngine.getPatronRelationship(patronId);
      
      setCurrentEmotionalState(emotionalContext);
      setCurrentRelationship(relationship);
      sessionActive.current = true;

      // Start emotional update loop
      if (emotionalUpdateInterval.current) {
        clearInterval(emotionalUpdateInterval.current);
      }
      
      emotionalUpdateInterval.current = setInterval(() => {
        updateEmotionalContext();
      }, 30000); // Update every 30 seconds

      // Generate initial greeting
      generateInitialGreeting(emotionalContext, relationship);

      console.log('Emotional session started for patron:', patronId);
    } catch (error) {
      console.error('Failed to start emotional session:', error);
    }
  }, [patronId, emotionalEngine]);

  // End emotional session
  const endEmotionalSession = useCallback(() => {
    if (sessionActive.current) {
      try {
        const sessionSummary = emotionalEngine.endSession();
        sessionActive.current = false;

        if (emotionalUpdateInterval.current) {
          clearInterval(emotionalUpdateInterval.current);
          emotionalUpdateInterval.current = null;
        }

        console.log('Emotional session ended:', sessionSummary);
      } catch (error) {
        console.error('Error ending emotional session:', error);
      }
    }
  }, [emotionalEngine]);

  // Generate initial greeting based on relationship
  const generateInitialGreeting = useCallback((emotionalContext, relationship) => {
    const greeting = responseGenerator.generateResponse('greeting', {
      patronName: relationship.specialStatus !== 'new' ? patronId : null,
      timeOfDay: getTimeOfDay()
    });

    addToConversationHistory('savannah', greeting.text, greeting.emotionalContext);
  }, [responseGenerator, patronId]);

  // Process incoming patron message
  const processPatronMessage = useCallback(async (message, metadata = {}) => {
    if (!sessionActive.current) {
      console.warn('No active emotional session');
      return null;
    }

    setIsProcessingMessage(true);
    lastMessageTime.current = Date.now();

    try {
      // Process message through emotional engine
      const emotionalContext = emotionalEngine.processPatronMessage(message, metadata);
      
      // Update conversation context
      const conversationAnalysis = conversationContext.addToHistory(message, 'patron', metadata);
      
      // Process through engagement mechanics if enabled
      let engagementResult = null;
      if (enableEngagementMechanics) {
        const action = detectPatronAction(message, metadata);
        if (action) {
          engagementResult = engagementMechanics.processPatronAction(action, {
            sincerity: metadata.sincerity || 0.7,
            timing: metadata.timing || 'normal',
            public: metadata.public || false
          });
        }
      }

      // Generate response
      const response = generateEmotionalResponse(message, emotionalContext, engagementResult);
      
      // Add to conversation history
      addToConversationHistory('patron', message, metadata);
      addToConversationHistory('savannah', response.text, response.emotionalContext);

      // Update component state
      setCurrentEmotionalState(emotionalContext);
      setCurrentRelationship(emotionalEngine.getPatronRelationship(patronId));

      // Trigger emotion-based gestures if avatar is ready
      if (gestureService && avatarReady) {
        triggerEmotionalGestures(emotionalContext, response);
      }

      // Notify parent components of changes
      if (onEmotionalStateChange) {
        onEmotionalStateChange(emotionalContext);
      }
      
      if (onRelationshipChange && engagementResult?.favorLevelChanged) {
        onRelationshipChange({
          relationship: currentRelationship,
          engagementResult,
          newFavorLevel: engagementResult.newLevel
        });
      }

      return {
        response: response.text,
        emotionalContext,
        engagementResult,
        conversationAnalysis
      };

    } catch (error) {
      console.error('Error processing patron message:', error);
      return null;
    } finally {
      setIsProcessingMessage(false);
    }
  }, [emotionalEngine, conversationContext, enableEngagementMechanics, engagementMechanics, 
      patronId, gestureService, avatarReady, currentRelationship, onEmotionalStateChange, onRelationshipChange]);

  // Generate emotional response
  const generateEmotionalResponse = useCallback((message, emotionalContext, engagementResult) => {
    // Determine response type based on message content and emotional analysis
    let responseType = 'service';
    
    if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
      responseType = 'greeting';
    } else if (detectAppreciation(message)) {
      responseType = 'appreciation';
    } else if (detectRudeness(message)) {
      responseType = 'rudeness';
    } else if (detectFlirtation(message)) {
      responseType = 'flirtation';
    } else if (engagementResult?.action?.includes('apology')) {
      responseType = 'recovery';
    }

    return responseGenerator.generateResponse(responseType, {
      patronName: currentRelationship?.specialStatus !== 'new' ? patronId : null,
      originalMessage: message,
      engagementResult,
      timeOfDay: getTimeOfDay(),
      drinkRelated: detectDrinkMention(message)
    });
  }, [responseGenerator, currentRelationship, patronId]);

  // Detect patron actions for engagement system
  const detectPatronAction = useCallback((message, metadata) => {
    const lowerMessage = message.toLowerCase();
    
    // Appreciation detection
    if (lowerMessage.includes('thank you') || lowerMessage.includes('thanks')) {
      return 'genuine_thanks';
    }
    
    if (lowerMessage.includes('amazing') || lowerMessage.includes('wonderful') || lowerMessage.includes('perfect')) {
      return 'specific_compliment';
    }
    
    // Rudeness detection
    if (lowerMessage.includes('hurry up') || lowerMessage.includes('whatever') || lowerMessage.includes('just give me')) {
      return 'being_rude';
    }
    
    // Interest detection
    if (lowerMessage.includes('tell me more') || lowerMessage.includes('interesting') || lowerMessage.includes('how')) {
      return 'asking_about_her_day';
    }
    
    // Professional respect
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('advice')) {
      return 'trusting_recommendations';
    }
    
    return null;
  }, []);

  // Helper functions for message analysis
  const detectAppreciation = (message) => {
    const appreciationWords = ['thank', 'appreciate', 'grateful', 'wonderful', 'amazing', 'excellent'];
    return appreciationWords.some(word => message.toLowerCase().includes(word));
  };

  const detectRudeness = (message) => {
    const rudeWords = ['whatever', 'hurry up', 'stupid', 'annoying', 'shut up'];
    return rudeWords.some(word => message.toLowerCase().includes(word));
  };

  const detectFlirtation = (message) => {
    const flirtWords = ['beautiful', 'gorgeous', 'stunning', 'cute', 'lovely', 'charming'];
    return flirtWords.some(word => message.toLowerCase().includes(word));
  };

  const detectDrinkMention = (message) => {
    const drinkWords = ['drink', 'cocktail', 'beer', 'wine', 'whiskey', 'vodka', 'rum', 'gin', 'recommend'];
    return drinkWords.some(word => message.toLowerCase().includes(word));
  };

  // Trigger emotional gestures based on response
  const triggerEmotionalGestures = useCallback((emotionalContext, response) => {
    if (!gestureService) return;

    const mood = emotionalContext.currentState.mood;
    const warmth = emotionalContext.conversationStyle.warmth;

    // Map emotions to gestures
    try {
      if (mood === 'happy' && warmth > 0.7) {
        gestureService.testGesture('welcome');
      } else if (mood === 'excited') {
        gestureService.testGesture('enthusiastic');
      } else if (mood === 'annoyed') {
        gestureService.testGesture('reserved');
      } else if (response.text.includes('*smile*') || response.text.includes('*grin*')) {
        gestureService.testGesture('friendly');
      }
    } catch (error) {
      console.warn('Gesture trigger error:', error);
    }
  }, [gestureService]);

  // Update emotional context periodically
  const updateEmotionalContext = useCallback(() => {
    if (sessionActive.current) {
      const context = emotionalEngine.getCurrentEmotionalContext();
      setCurrentEmotionalState(context);
      
      // Check for relationship updates
      const relationship = emotionalEngine.getPatronRelationship(patronId);
      setCurrentRelationship(relationship);
    }
  }, [emotionalEngine, patronId]);

  // Add message to conversation history
  const addToConversationHistory = useCallback((role, message, metadata = {}) => {
    const entry = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      role,
      message,
      metadata
    };

    setConversationHistory(prev => [...prev, entry]);
  }, []);

  // Get time of day for contextual responses
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  };

  // Handle avatar ready callback
  const handleAvatarReady = useCallback(({ gestureService: gs }) => {
    setGestureService(gs);
    setAvatarReady(true);
    console.log('Emotionally intelligent avatar ready with gesture support');
  }, []);

  // Attempt relationship recovery
  const attemptRecovery = useCallback((recoveryType, context = {}) => {
    if (!enableEngagementMechanics) return null;
    
    try {
      const result = engagementMechanics.attemptRecovery(patronId, recoveryType, context);
      
      if (result.success) {
        // Update state and generate recovery response
        updateEmotionalContext();
        
        const response = responseGenerator.generateResponse('recovery', {
          recoveryType,
          ...context
        });
        
        addToConversationHistory('savannah', response.text, response.emotionalContext);
        
        if (onRelationshipChange) {
          onRelationshipChange({
            relationship: currentRelationship,
            recoveryResult: result,
            recovered: true
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Recovery attempt failed:', error);
      return null;
    }
  }, [enableEngagementMechanics, engagementMechanics, patronId, responseGenerator, 
      currentRelationship, onRelationshipChange]);

  // Get current engagement summary
  const getEngagementSummary = useCallback(() => {
    if (!enableEngagementMechanics) return null;
    return engagementMechanics.getEngagementSummary(patronId);
  }, [enableEngagementMechanics, engagementMechanics, patronId]);

  // Expose API for parent components
  useEffect(() => {
    // Attach functions to window for development/testing
    if (window && showEmotionalDebugInfo) {
      window.savannahEmotionalAPI = {
        processMessage: processPatronMessage,
        attemptRecovery,
        getEngagementSummary,
        getCurrentState: () => currentEmotionalState,
        getRelationship: () => currentRelationship,
        getConversationHistory: () => conversationHistory
      };

      console.log('Savannah Emotional API available at window.savannahEmotionalAPI');
    }

    return () => {
      if (window?.savannahEmotionalAPI) {
        delete window.savannahEmotionalAPI;
      }
    };
  }, [processPatronMessage, attemptRecovery, getEngagementSummary, 
      currentEmotionalState, currentRelationship, conversationHistory, showEmotionalDebugInfo]);

  return (
    <div className={`emotionally-intelligent-avatar ${className}`}>
      {/* Main Avatar Component */}
      <InteractiveAvatar
        onAvatarReady={handleAvatarReady}
        gestureEnabled={true}
        avatarId={patronId}
        className="emotional-avatar"
      />

      {/* Emotional State Indicator */}
      {currentEmotionalState && (
        <div className="emotional-state-indicator">
          <div className="mood-display">
            <span className={`mood-icon mood-${currentEmotionalState.currentState.mood}`}>
              {getMoodEmoji(currentEmotionalState.currentState.mood)}
            </span>
            <span className="mood-text">{currentEmotionalState.currentState.mood}</span>
          </div>
          
          {currentRelationship && (
            <div className="relationship-display">
              <span className="relationship-status">{currentRelationship.specialStatus}</span>
              <div className="relationship-meter">
                <div 
                  className="relationship-fill"
                  style={{ 
                    width: `${Math.max(0, (currentRelationship.relationshipLevel + 2) / 4 * 100)}%`,
                    backgroundColor: getRelationshipColor(currentRelationship.relationshipLevel)
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Debug Information */}
      {showEmotionalDebugInfo && currentEmotionalState && (
        <div className="emotional-debug-panel">
          <h4>Emotional Debug Info</h4>
          <div className="debug-section">
            <strong>Current State:</strong>
            <pre>{JSON.stringify(currentEmotionalState.currentState, null, 2)}</pre>
          </div>
          
          {enableEngagementMechanics && (
            <div className="debug-section">
              <strong>Engagement Summary:</strong>
              <pre>{JSON.stringify(getEngagementSummary(), null, 2)}</pre>
            </div>
          )}
          
          <div className="debug-section">
            <strong>Service Modifiers:</strong>
            <pre>{JSON.stringify(currentEmotionalState.serviceModifiers, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessingMessage && (
        <div className="processing-indicator">
          <div className="processing-spinner"></div>
          <span>Savannah is thinking...</span>
        </div>
      )}

      <style>{`
        .emotionally-intelligent-avatar {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .emotional-avatar {
          width: 100%;
          height: 100%;
        }

        .emotional-state-indicator {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 12px;
          border-radius: 8px;
          min-width: 180px;
        }

        .mood-display {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }

        .mood-icon {
          font-size: 24px;
          margin-right: 8px;
        }

        .mood-text {
          font-weight: bold;
          text-transform: capitalize;
        }

        .relationship-display {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .relationship-status {
          font-size: 12px;
          text-transform: capitalize;
          color: #ccc;
        }

        .relationship-meter {
          flex: 1;
          height: 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          overflow: hidden;
        }

        .relationship-fill {
          height: 100%;
          transition: width 0.3s ease, background-color 0.3s ease;
        }

        .emotional-debug-panel {
          position: absolute;
          bottom: 16px;
          left: 16px;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 16px;
          border-radius: 8px;
          max-width: 400px;
          max-height: 300px;
          overflow-y: auto;
          font-family: monospace;
          font-size: 12px;
        }

        .debug-section {
          margin-bottom: 16px;
        }

        .debug-section pre {
          margin: 4px 0;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .processing-indicator {
          position: absolute;
          bottom: 50%;
          left: 50%;
          transform: translate(-50%, 50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 12px 24px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .processing-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #ffffff40;
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Mood-specific styling */
        .mood-happy { color: #ffeb3b; }
        .mood-excited { color: #ff9800; }
        .mood-content { color: #4caf50; }
        .mood-neutral { color: #9e9e9e; }
        .mood-annoyed { color: #ff5722; }
        .mood-hurt { color: #f44336; }
        .mood-playful { color: #e91e63; }
      `}</style>
    </div>
  );

  // Helper function to get mood emoji
  function getMoodEmoji(mood) {
    const moodEmojis = {
      happy: '😊',
      excited: '🤩',
      content: '😌',
      neutral: '😐',
      annoyed: '😤',
      hurt: '😢',
      playful: '😏'
    };
    return moodEmojis[mood] || '😐';
  }

  // Helper function to get relationship color
  function getRelationshipColor(level) {
    if (level > 1.5) return '#4caf50'; // Green for great relationship
    if (level > 1.0) return '#8bc34a'; // Light green for good relationship
    if (level > 0.5) return '#ffeb3b'; // Yellow for okay relationship
    if (level > 0) return '#ff9800';   // Orange for neutral
    if (level > -0.5) return '#ff5722'; // Red-orange for poor
    return '#f44336'; // Red for very poor relationship
  }
}

// Export additional utilities for external use
export const EmotionalAvatarAPI = {
  SavannahEmotionalEngine,
  EmotionalResponseGenerator,
  PatronEngagementMechanics,
  ConversationContextService
};