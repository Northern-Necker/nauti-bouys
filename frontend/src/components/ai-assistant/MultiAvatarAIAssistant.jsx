/**
 * Multi-Avatar AI Assistant System
 * Scalable AI Assistant component supporting multiple avatar selection
 * Designed for future expansion with various avatar personalities and appearances
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  VisemeToActorCore,
  applyBlendShape,
  debugMorphMapping,
  getMorphTargetMapping,
  getAvailableMorphTargets
} from '../../utils/enhancedActorCoreLipSync';

// Import avatar configurations and speech processing
import { 
  getAvatarById, 
  saveAvatarToStorage, 
  resetAvatarToDefault 
} from '../../utils/avatarManager';
import { synthesizeSpeech, textToVisemes } from '../../utils/speechProcessing';

// Import conversation service (commented out for testing)
// import { sendMessage } from '../../services/api/conversationService';

// Import personality editor
import AvatarPersonalityEditor from '../settings/AvatarPersonalityEditor';

// Generic Avatar Component that works with any avatar model
function GenericAvatar({ 
  avatarConfig,
  currentViseme, 
  animationSpeed = 0.15,
  isListening = false,
  isSpeaking = false 
}) {
  const { scene } = useGLTF(avatarConfig.modelPath);
  const avatarRef = useRef();
  const blendShapeRef = useRef([]);
  const idleAnimationRef = useRef(0);
  
  // Apply viseme to morph targets
  useEffect(() => {
    if (currentViseme && avatarRef.current) {
      const blendShape = VisemeToActorCore(currentViseme, blendShapeRef);
      applyBlendShape(blendShape, animationSpeed, avatarRef.current);
    }
  }, [currentViseme, animationSpeed]);

  // Animation loop for smooth transitions and idle animations
  useFrame((state) => {
    if (avatarRef.current) {
      // Apply lip sync blend shapes
      if (blendShapeRef.current.length > 0) {
        const latestBlendShape = blendShapeRef.current[blendShapeRef.current.length - 1];
        applyBlendShape(latestBlendShape, animationSpeed, avatarRef.current);
        
        // Keep only recent blend shapes to prevent memory buildup
        if (blendShapeRef.current.length > 10) {
          blendShapeRef.current = blendShapeRef.current.slice(-5);
        }
      }

      // Idle animations when not speaking
      if (!isSpeaking) {
        idleAnimationRef.current += 0.01;
        
        // Subtle breathing animation
        const breathingScale = 1 + Math.sin(idleAnimationRef.current * 0.5) * 0.02;
        avatarRef.current.scale.y = breathingScale;
        
        // Occasional blink
        if (Math.random() < 0.001) {
          avatarRef.current.traverse((child) => {
            if (child.isSkinnedMesh && child.morphTargetDictionary) {
              const blinkLIndex = child.morphTargetDictionary['Eye_Blink_L'];
              const blinkRIndex = child.morphTargetDictionary['Eye_Blink_R'];
              if (blinkLIndex !== undefined) {
                child.morphTargetInfluences[blinkLIndex] = 1.0;
                setTimeout(() => {
                  child.morphTargetInfluences[blinkLIndex] = 0.0;
                }, 150);
              }
              if (blinkRIndex !== undefined) {
                child.morphTargetInfluences[blinkRIndex] = 1.0;
                setTimeout(() => {
                  child.morphTargetInfluences[blinkRIndex] = 0.0;
                }, 150);
              }
            }
          });
        }
      }

      // Listening animation (subtle head movement)
      if (isListening) {
        const listenAnimation = Math.sin(state.clock.elapsedTime * 2) * 0.05;
        avatarRef.current.rotation.y = listenAnimation;
      }
    }
  });

  return (
    <primitive 
      ref={avatarRef}
      object={scene} 
      scale={[1, 1, 1]} 
      position={[0, -1, 0]}
    />
  );
}

// Avatar Selection Component
function AvatarSelector({ availableAvatars, selectedAvatar, onAvatarSelect }) {
  return (
    <div className="avatar-selector">
      <h3>Choose Your AI Assistant</h3>
      <div className="avatar-grid">
        {availableAvatars.map(avatarId => {
          const config = getAvatarById(avatarId);
          if (!config) return null;
          
          return (
            <div 
              key={avatarId}
              className={`avatar-option ${selectedAvatar === avatarId ? 'selected' : ''}`}
              onClick={() => onAvatarSelect(avatarId)}
            >
              <div className="avatar-thumbnail">
                <img 
                  src={config.appearance.thumbnail} 
                  alt={config.name}
                  onError={(e) => {
                    e.target.src = '/assets/thumbnails/default-avatar.jpg';
                  }}
                />
              </div>
              <div className="avatar-info">
                <h4>{config.name}</h4>
                <p className="avatar-role">{config.role}</p>
                <p className="avatar-description">{config.appearance.description}</p>
                <div className="avatar-specialties">
                  {config.personality.specialties.slice(0, 2).map(specialty => (
                    <span key={specialty} className="specialty-tag">{specialty}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Main Multi-Avatar AI Assistant Component
export default function MultiAvatarAIAssistant({ 
  availableAvatars = ['savannah'], // Default to Savannah, easily expandable
  allowAvatarSelection = true,
  defaultAvatar = 'savannah'
}) {
  const [selectedAvatar, setSelectedAvatar] = useState(defaultAvatar);
  const [currentViseme, setCurrentViseme] = useState({ 0: 1.0 }); // Silence
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showPersonalityEditor, setShowPersonalityEditor] = useState(false);
  const [avatarConfigVersion, setAvatarConfigVersion] = useState(0);

  const currentAvatarConfig = getAvatarById(selectedAvatar);

  // Listen for avatar updates from personality editor
  useEffect(() => {
    const handleAvatarUpdate = (event) => {
      if (event.detail.avatarId === selectedAvatar) {
        // Force re-render by updating version
        setAvatarConfigVersion(prev => prev + 1);
        // Re-initialize with updated personality
        setIsInitialized(false);
      }
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, [selectedAvatar]);

  // Initialize the AI Assistant
  useEffect(() => {
    if (currentAvatarConfig && !isInitialized) {
      // Send greeting message
      const greeting = currentAvatarConfig.personality.greeting;
      setConversationHistory([{
        type: 'assistant',
        message: greeting,
        timestamp: new Date(),
        avatar: selectedAvatar
      }]);
      
      // Speak the greeting (if speech synthesis is available)
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(greeting);
        utterance.pitch = currentAvatarConfig.personality.voice.pitch;
        utterance.rate = currentAvatarConfig.personality.voice.rate;
        utterance.volume = currentAvatarConfig.personality.voice.volume;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        
        speechSynthesis.speak(utterance);
      }
      
      setIsInitialized(true);
    }
  }, [currentAvatarConfig, isInitialized, selectedAvatar, avatarConfigVersion]);

  // Handle avatar selection
  const handleAvatarSelect = useCallback((avatarId) => {
    if (avatarId !== selectedAvatar) {
      setSelectedAvatar(avatarId);
      setIsInitialized(false); // Trigger re-initialization with new avatar
      setConversationHistory([]); // Clear conversation history
    }
  }, [selectedAvatar]);

  // Handle user message (simplified for testing)
  const handleSendMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    // Add user message to history
    const userMessage = {
      type: 'user',
      message: message,
      timestamp: new Date()
    };
    
    setConversationHistory(prev => [...prev, userMessage]);
    setCurrentMessage('');

    // Simple echo response for testing personality editor
    const responses = [
      `Thanks for your message! As ${currentAvatarConfig?.name}, I appreciate you reaching out.`,
      `That's interesting! My personality traits include: ${currentAvatarConfig?.personality.traits.join(', ')}.`,
      `I specialize in: ${currentAvatarConfig?.personality.specialties.join(', ')}. How can I help you with that?`,
      `My conversation style is ${currentAvatarConfig?.personality.conversationStyle.formality} and ${currentAvatarConfig?.personality.conversationStyle.enthusiasm} enthusiasm.`
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Add assistant response to history
    const assistantMessage = {
      type: 'assistant',
      message: randomResponse,
      timestamp: new Date(),
      avatar: selectedAvatar
    };
    
    setTimeout(() => {
      setConversationHistory(prev => [...prev, assistantMessage]);

      // Speak the response
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(randomResponse);
        utterance.pitch = currentAvatarConfig.personality.voice.pitch;
        utterance.rate = currentAvatarConfig.personality.voice.rate;
        utterance.volume = currentAvatarConfig.personality.voice.volume;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        
        speechSynthesis.speak(utterance);
      }
    }, 1000); // Simulate response delay
  }, [selectedAvatar, currentAvatarConfig]);

  // Start voice recognition
  const startListening = useCallback(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleSendMessage(transcript);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognition.start();
    }
  }, [handleSendMessage]);

  return (
    <div className="multi-avatar-ai-assistant">
      {allowAvatarSelection && (
        <AvatarSelector
          availableAvatars={availableAvatars}
          selectedAvatar={selectedAvatar}
          onAvatarSelect={handleAvatarSelect}
        />
      )}

      <div className="ai-assistant-interface">
        <div className="avatar-display">
          <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <GenericAvatar 
              avatarConfig={currentAvatarConfig}
              currentViseme={currentViseme}
              isListening={isListening}
              isSpeaking={isSpeaking}
            />
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
            />
          </Canvas>
          
          <div className="avatar-status">
            <h3>{currentAvatarConfig?.name}</h3>
            <p>{currentAvatarConfig?.role}</p>
            {isListening && <div className="listening-indicator">🎤 Listening...</div>}
            {isSpeaking && <div className="speaking-indicator">💬 Speaking...</div>}
            <button 
              className="personality-edit-btn"
              onClick={() => setShowPersonalityEditor(true)}
              title="Edit Avatar Personality"
            >
              ⚙️ Edit Personality
            </button>
          </div>
        </div>

        <div className="conversation-panel">
          <div className="conversation-history">
            {conversationHistory.map((entry, index) => (
              <div key={index} className={`message ${entry.type}`}>
                <div className="message-header">
                  <span className="sender">
                    {entry.type === 'user' ? 'You' : currentAvatarConfig?.name}
                  </span>
                  <span className="timestamp">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-content">{entry.message}</div>
              </div>
            ))}
          </div>

          <div className="message-input">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(currentMessage)}
              placeholder={`Ask ${currentAvatarConfig?.name} anything...`}
              disabled={isSpeaking}
            />
            <button 
              onClick={() => handleSendMessage(currentMessage)}
              disabled={!currentMessage.trim() || isSpeaking}
            >
              Send
            </button>
            <button 
              onClick={startListening}
              disabled={isListening || isSpeaking}
              className="voice-button"
            >
              🎤
            </button>
          </div>
        </div>
      </div>

      {/* Personality Editor Modal */}
      {showPersonalityEditor && (
        <div className="personality-editor-modal">
          <div className="modal-backdrop" onClick={() => setShowPersonalityEditor(false)} />
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Avatar Personality</h2>
              <button 
                className="modal-close"
                onClick={() => setShowPersonalityEditor(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <AvatarPersonalityEditor />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .multi-avatar-ai-assistant {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #f8f9fa;
        }

        .avatar-selector {
          padding: 20px;
          background: white;
          border-bottom: 1px solid #dee2e6;
        }

        .avatar-selector h3 {
          margin: 0 0 15px 0;
          color: #2c3e50;
        }

        .avatar-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 15px;
        }

        .avatar-option {
          display: flex;
          padding: 15px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }

        .avatar-option:hover {
          border-color: #007bff;
          box-shadow: 0 4px 8px rgba(0,123,255,0.1);
        }

        .avatar-option.selected {
          border-color: #007bff;
          background: #f8f9ff;
        }

        .avatar-thumbnail {
          width: 80px;
          height: 80px;
          margin-right: 15px;
          border-radius: 50%;
          overflow: hidden;
          background: #e9ecef;
        }

        .avatar-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-info h4 {
          margin: 0 0 5px 0;
          color: #2c3e50;
        }

        .avatar-role {
          margin: 0 0 8px 0;
          color: #6c757d;
          font-weight: 500;
        }

        .avatar-description {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #495057;
        }

        .specialty-tag {
          display: inline-block;
          padding: 2px 8px;
          margin: 2px 4px 2px 0;
          background: #e9ecef;
          border-radius: 12px;
          font-size: 12px;
          color: #495057;
        }

        .ai-assistant-interface {
          display: grid;
          grid-template-columns: 1fr 400px;
          flex: 1;
          overflow: hidden;
        }

        .avatar-display {
          position: relative;
          background: #f8f9fa;
        }

        .avatar-status {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(255,255,255,0.9);
          padding: 15px;
          border-radius: 8px;
          backdrop-filter: blur(10px);
        }

        .avatar-status h3 {
          margin: 0 0 5px 0;
          color: #2c3e50;
        }

        .avatar-status p {
          margin: 0;
          color: #6c757d;
        }

        .listening-indicator, .speaking-indicator {
          margin-top: 10px;
          padding: 5px 10px;
          border-radius: 15px;
          font-size: 12px;
          font-weight: 500;
        }

        .listening-indicator {
          background: #d4edda;
          color: #155724;
        }

        .speaking-indicator {
          background: #cce5ff;
          color: #004085;
        }

        .conversation-panel {
          display: flex;
          flex-direction: column;
          background: white;
          border-left: 1px solid #dee2e6;
        }

        .conversation-history {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .message {
          margin-bottom: 15px;
          padding: 12px;
          border-radius: 8px;
        }

        .message.user {
          background: #e3f2fd;
          margin-left: 20px;
        }

        .message.assistant {
          background: #f1f8e9;
          margin-right: 20px;
        }

        .message.error {
          background: #ffebee;
          color: #c62828;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 12px;
          color: #6c757d;
        }

        .sender {
          font-weight: 500;
        }

        .message-content {
          color: #2c3e50;
        }

        .message-input {
          display: flex;
          padding: 20px;
          border-top: 1px solid #dee2e6;
          gap: 10px;
        }

        .message-input input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }

        .message-input button {
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }

        .message-input button:first-of-type {
          background: #007bff;
          color: white;
        }

        .message-input button:first-of-type:hover:not(:disabled) {
          background: #0056b3;
        }

        .voice-button {
          background: #28a745;
          color: white;
        }

        .voice-button:hover:not(:disabled) {
          background: #1e7e34;
        }

        .message-input button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .personality-edit-btn {
          margin-top: 10px;
          padding: 8px 12px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: background-color 0.2s;
        }

        .personality-edit-btn:hover {
          background: #5a6268;
        }

        .personality-editor-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }

        .modal-content {
          position: relative;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          max-width: 90vw;
          max-height: 90vh;
          width: 1200px;
          overflow: hidden;
          z-index: 1001;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 30px;
          border-bottom: 1px solid #dee2e6;
          background: #f8f9fa;
        }

        .modal-header h2 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.5rem;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6c757d;
          padding: 5px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .modal-close:hover {
          background: #e9ecef;
          color: #495057;
        }

        .modal-body {
          padding: 0;
          max-height: calc(90vh - 80px);
          overflow-y: auto;
        }

        @media (max-width: 1200px) {
          .ai-assistant-interface {
            grid-template-columns: 1fr;
            grid-template-rows: 60vh 40vh;
          }
          
          .avatar-grid {
            grid-template-columns: 1fr;
          }

          .modal-content {
            width: 95vw;
            max-height: 95vh;
          }

          .modal-header {
            padding: 15px 20px;
          }

          .modal-header h2 {
            font-size: 1.3rem;
          }
        }
      `}</style>
    </div>
  );
}
