import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Text } from '@react-three/drei';
import Avatar3DScene from './Avatar3DScene';
import Avatar3DSpeech from './Avatar3DSpeech';
import Avatar3DControls from './Avatar3DControls';

const Avatar3DEngine = ({ 
  onMessage, 
  initialMessage = "Welcome to Nauti Bouys! I'm Savannah, your AI bartender. How can I help you today?",
  className = ""
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [avatarState, setAvatarState] = useState('idle'); // idle, listening, speaking, thinking
  const [error, setError] = useState(null);
  
  const canvasRef = useRef();
  const speechRef = useRef();

  useEffect(() => {
    // Initialize avatar
    const initializeAvatar = async () => {
      try {
        setIsLoading(true);
        // Simulate loading time for 3D model
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Set initial message
        setCurrentMessage(initialMessage);
        setAvatarState('speaking');
        
        // Speak initial message
        if (speechRef.current) {
          await speechRef.current.speak(initialMessage);
        }
        
        setAvatarState('idle');
        setIsLoading(false);
      } catch (err) {
        console.error('Avatar initialization error:', err);
        setError('Failed to initialize 3D avatar');
        setIsLoading(false);
      }
    };

    initializeAvatar();
  }, [initialMessage]);

  const handleUserMessage = async (message) => {
    try {
      setAvatarState('thinking');
      setCurrentMessage('');
      
      // Send message to backend AI
      if (onMessage) {
        const response = await onMessage(message);
        
        // Display text response immediately
        setCurrentMessage(response);
        setAvatarState('speaking');
        
        // Generate speech in parallel
        if (speechRef.current) {
          await speechRef.current.speak(response);
        }
        
        setAvatarState('idle');
      }
    } catch (err) {
      console.error('Message processing error:', err);
      setError('Failed to process message');
      setAvatarState('idle');
    }
  };

  const handleStartListening = () => {
    setIsListening(true);
    setAvatarState('listening');
  };

  const handleStopListening = () => {
    setIsListening(false);
    setAvatarState('idle');
  };

  if (error) {
    return (
      <div className={`avatar-3d-error ${className}`}>
        <div className="error-message">
          <h3>Avatar Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`avatar-3d-engine ${className}`}>
      {/* 3D Canvas */}
      <div className="avatar-3d-canvas">
        <Canvas
          ref={canvasRef}
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ width: '100%', height: '600px' }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          
          {/* 3D Avatar Scene */}
          <Avatar3DScene 
            avatarState={avatarState}
            isLoading={isLoading}
            currentMessage={currentMessage}
          />
          
          {/* Environment */}
          <Environment preset="studio" />
          
          {/* Controls */}
          <OrbitControls 
            enablePan={false}
            enableZoom={false}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 3}
          />
        </Canvas>
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="avatar-loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading Savannah...</p>
          </div>
        )}
      </div>

      {/* Text Display */}
      <div className="avatar-text-display">
        <div className={`message-bubble ${avatarState}`}>
          {currentMessage || (avatarState === 'thinking' ? 'Thinking...' : 'Ready to chat!')}
        </div>
      </div>

      {/* Speech Component */}
      <Avatar3DSpeech
        ref={speechRef}
        onSpeakStart={() => setIsSpeaking(true)}
        onSpeakEnd={() => setIsSpeaking(false)}
      />

      {/* User Controls */}
      <Avatar3DControls
        onMessage={handleUserMessage}
        onStartListening={handleStartListening}
        onStopListening={handleStopListening}
        isListening={isListening}
        isProcessing={avatarState === 'thinking'}
        disabled={isLoading}
      />

      {/* Styles */}
      <style jsx>{`
        .avatar-3d-engine {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .avatar-3d-canvas {
          position: relative;
          width: 100%;
          background: linear-gradient(180deg, #87ceeb 0%, #4682b4 100%);
        }

        .avatar-loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          z-index: 10;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .avatar-text-display {
          width: 100%;
          padding: 20px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
        }

        .message-bubble {
          background: white;
          padding: 16px 20px;
          border-radius: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          font-size: 16px;
          line-height: 1.5;
          color: #1f2937;
          min-height: 60px;
          display: flex;
          align-items: center;
          transition: all 0.3s ease;
        }

        .message-bubble.thinking {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
        }

        .message-bubble.speaking {
          background: #dbeafe;
          border-left: 4px solid #3b82f6;
        }

        .message-bubble.listening {
          background: #dcfce7;
          border-left: 4px solid #10b981;
        }

        .avatar-3d-error {
