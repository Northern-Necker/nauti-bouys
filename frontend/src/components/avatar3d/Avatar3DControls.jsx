import React, { useState, useRef, useEffect } from 'react';

export default function Avatar3DControls({ 
  onMessage, 
  onStartListening, 
  onStopListening, 
  isListening, 
  isProcessing, 
  disabled 
}) {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  
  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setIsRecording(true);
        if (onStartListening) onStartListening();
      };
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInputText(transcript);
      };
      
      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsRecording(false);
        if (onStopListening) onStopListening();
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (onStopListening) onStopListening();
      };
    }
  }, [onStartListening, onStopListening]);
  
  const handleSend = () => {
    if (inputText.trim() && onMessage) {
      onMessage(inputText.trim());
      setInputText('');
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser');
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };
  
  return (
    <div className="avatar-controls">
      <div className="input-container">
        <textarea
          className="message-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message or click the mic to speak..."
          disabled={disabled || isProcessing}
          rows={2}
        />
        
        <div className="button-group">
          <button
            className={`mic-button ${isRecording ? 'recording' : ''}`}
            onClick={toggleListening}
            disabled={disabled || isProcessing}
            title={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? '🔴' : '🎤'}
          </button>
          
          <button
            className="send-button"
            onClick={handleSend}
            disabled={disabled || isProcessing || !inputText.trim()}
          >
            {isProcessing ? '⏳' : '📤'} Send
          </button>
        </div>
      </div>
      
      {isRecording && (
        <div className="recording-indicator">
          <span className="pulse"></span>
          Listening...
        </div>
      )}
      
      <style jsx>{`
        .avatar-controls {
          width: 100%;
          padding: 20px;
          background: white;
          border-top: 1px solid #e5e7eb;
        }
        
        .input-container {
          max-width: 600px;
          margin: 0 auto;
        }
        
        .message-input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 16px;
          resize: none;
          outline: none;
          transition: border-color 0.2s;
        }
        
        .message-input:focus {
          border-color: #3b82f6;
        }
        
        .message-input:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }
        
        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 12px;
        }
        
        .mic-button,
        .send-button {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .mic-button {
          background: #f3f4f6;
          color: #1f2937;
          min-width: 60px;
        }
        
        .mic-button:hover:not(:disabled) {
          background: #e5e7eb;
        }
        
        .mic-button.recording {
          background: #fee2e2;
          color: #dc2626;
          animation: pulse 1.5s infinite;
        }
        
        .send-button {
          flex: 1;
          background: #3b82f6;
          color: white;
        }
        
        .send-button:hover:not(:disabled) {
          background: #2563eb;
        }
        
        .send-button:disabled,
        .mic-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .recording-indicator {
          text-align: center;
          margin-top: 12px;
          color: #dc2626;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .pulse {
          display: inline-block;
          width: 8px;
          height: 8px;
          background: #dc2626;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(220, 38, 38, 0);
            transform: scale(1.1);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0);
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}