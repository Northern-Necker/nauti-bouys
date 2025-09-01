import React, { useState, useCallback } from 'react';
import EnhancedAvatar3D from '../components/avatar3d/EnhancedAvatar3D';

export default function Avatar3DDemo() {
  const [avatarState, setAvatarState] = useState('idle');
  const [gestureType, setGestureType] = useState(null);
  const [emotionalState, setEmotionalState] = useState('neutral');
  const [speechText, setSpeechText] = useState('');
  const [isReady, setIsReady] = useState(false);
  
  const handleAvatarReady = useCallback(() => {
    setIsReady(true);
    console.log('✅ Avatar is ready!');
  }, []);
  
  const handleSpeak = (text) => {
    setSpeechText(text);
    setAvatarState('speaking');
    setTimeout(() => {
      setAvatarState('idle');
      setSpeechText('');
    }, 3000);
  };
  
  const demos = [
    {
      title: 'Welcome Greeting',
      action: () => {
        setEmotionalState('happy');
        setGestureType('welcome');
        handleSpeak("Welcome to Nauti Bouys!");
      }
    },
    {
      title: 'Thinking Pose',
      action: () => {
        setEmotionalState('thinking');
        setGestureType('thinking');
        setAvatarState('thinking');
        handleSpeak("Let me think about that...");
      }
    },
    {
      title: 'Happy Wave',
      action: () => {
        setEmotionalState('happy');
        setGestureType('wave');
        handleSpeak("Hello there!");
      }
    },
    {
      title: 'Pointing Gesture',
      action: () => {
        setEmotionalState('neutral');
        setGestureType('point');
        handleSpeak("Check out our menu!");
      }
    },
    {
      title: 'Surprised Reaction',
      action: () => {
        setEmotionalState('surprised');
        setGestureType(null);
        handleSpeak("Oh wow!");
      }
    },
    {
      title: 'Listening Mode',
      action: () => {
        setEmotionalState('neutral');
        setGestureType(null);
        setAvatarState('listening');
        setSpeechText("I'm listening...");
      }
    }
  ];
  
  return (
    <div className="avatar-demo-page">
      <div className="demo-header">
        <h1>3D Avatar Demo - Savannah</h1>
        <p className="subtitle">Interactive bartender avatar with emotions and gestures</p>
        {isReady && <span className="ready-badge">✅ Avatar Ready</span>}
      </div>
      
      <div className="demo-container">
        <div className="avatar-wrapper">
          <EnhancedAvatar3D
            avatarState={avatarState}
            speechText={speechText}
            gestureType={gestureType}
            emotionalState={emotionalState}
            onReady={handleAvatarReady}
            enableControls={true}
          />
        </div>
        
        <div className="controls-panel">
          <h2>Avatar Controls</h2>
          
          <div className="control-section">
            <h3>Quick Demos</h3>
            <div className="demo-buttons">
              {demos.map((demo, index) => (
                <button
                  key={index}
                  onClick={demo.action}
                  className="demo-button"
                  disabled={!isReady}
                >
                  {demo.title}
                </button>
              ))}
            </div>
          </div>
          
          <div className="control-section">
            <h3>Avatar State</h3>
            <div className="state-buttons">
              {['idle', 'speaking', 'listening', 'thinking'].map(state => (
                <button
                  key={state}
                  onClick={() => setAvatarState(state)}
                  className={`state-button ${avatarState === state ? 'active' : ''}`}
                  disabled={!isReady}
                >
                  {state.charAt(0).toUpperCase() + state.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="control-section">
            <h3>Emotions</h3>
            <div className="emotion-buttons">
              {['neutral', 'happy', 'sad', 'surprised', 'thinking'].map(emotion => (
                <button
                  key={emotion}
                  onClick={() => setEmotionalState(emotion)}
                  className={`emotion-button ${emotionalState === emotion ? 'active' : ''}`}
                  disabled={!isReady}
                >
                  {emotion === 'neutral' ? '😐' : 
                   emotion === 'happy' ? '😊' :
                   emotion === 'sad' ? '😢' :
                   emotion === 'surprised' ? '😮' : '🤔'}
                  <span>{emotion}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="control-section">
            <h3>Gestures</h3>
            <div className="gesture-buttons">
              <button 
                onClick={() => setGestureType(null)}
                className={`gesture-button ${!gestureType ? 'active' : ''}`}
                disabled={!isReady}
              >
                None
              </button>
              {['wave', 'point', 'thinking', 'welcome'].map(gesture => (
                <button
                  key={gesture}
                  onClick={() => setGestureType(gesture)}
                  className={`gesture-button ${gestureType === gesture ? 'active' : ''}`}
                  disabled={!isReady}
                >
                  {gesture.charAt(0).toUpperCase() + gesture.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="control-section">
            <h3>Custom Speech</h3>
            <input
              type="text"
              placeholder="Enter text to speak..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  handleSpeak(e.target.value);
                  e.target.value = '';
                }
              }}
              disabled={!isReady}
              className="speech-input"
            />
          </div>
          
          <div className="status-section">
            <h3>Current Status</h3>
            <div className="status-info">
              <div>State: <strong>{avatarState}</strong></div>
              <div>Emotion: <strong>{emotionalState}</strong></div>
              <div>Gesture: <strong>{gestureType || 'none'}</strong></div>
              <div>Speech: <strong>{speechText || 'none'}</strong></div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .avatar-demo-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          padding: 20px;
        }
        
        .demo-header {
          text-align: center;
          color: white;
          margin-bottom: 30px;
        }
        
        .demo-header h1 {
          font-size: 2.5rem;
          margin-bottom: 10px;
        }
        
        .subtitle {
          font-size: 1.2rem;
          color: #94a3b8;
        }
        
        .ready-badge {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          margin-top: 10px;
          font-size: 0.9rem;
        }
        
        .demo-container {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 30px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .avatar-wrapper {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 20px;
          height: 700px;
        }
        
        .controls-panel {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 25px;
          height: 700px;
          overflow-y: auto;
        }
        
        .controls-panel h2 {
          color: #1e293b;
          margin-bottom: 20px;
          font-size: 1.5rem;
        }
        
        .control-section {
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .control-section h3 {
          color: #475569;
          margin-bottom: 12px;
          font-size: 1.1rem;
        }
        
        .demo-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        
        .demo-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9rem;
        }
        
        .demo-button:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-2px);
        }
        
        .demo-button:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }
        
        .state-buttons,
        .gesture-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .state-button,
        .gesture-button {
          background: #f1f5f9;
          color: #475569;
          border: 2px solid transparent;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .state-button:hover:not(:disabled),
        .gesture-button:hover:not(:disabled) {
          background: #e2e8f0;
        }
        
        .state-button.active,
        .gesture-button.active {
          background: #3b82f6;
          color: white;
          border-color: #2563eb;
        }
        
        .state-button:disabled,
        .gesture-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .emotion-buttons {
          display: flex;
          gap: 10px;
        }
        
        .emotion-button {
          background: #f1f5f9;
          border: 2px solid transparent;
          padding: 10px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 1.5rem;
        }
        
        .emotion-button span {
          font-size: 0.7rem;
          margin-top: 4px;
          color: #64748b;
        }
        
        .emotion-button:hover:not(:disabled) {
          background: #e2e8f0;
          transform: scale(1.1);
        }
        
        .emotion-button.active {
          background: #fef3c7;
          border-color: #f59e0b;
        }
        
        .emotion-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .speech-input {
          width: 100%;
          padding: 10px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
        }
        
        .speech-input:focus {
          outline: none;
          border-color: #3b82f6;
        }
        
        .speech-input:disabled {
          background: #f9fafb;
          cursor: not-allowed;
        }
        
        .status-section {
          margin-top: 20px;
        }
        
        .status-info {
          background: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          font-size: 0.9rem;
        }
        
        .status-info div {
          margin-bottom: 8px;
          color: #64748b;
        }
        
        .status-info strong {
          color: #1e293b;
          font-weight: 600;
        }
        
        @media (max-width: 1024px) {
          .demo-container {
            grid-template-columns: 1fr;
          }
          
          .avatar-wrapper {
            height: 500px;
          }
          
          .controls-panel {
            height: auto;
          }
        }
      `}</style>
    </div>
  );
}