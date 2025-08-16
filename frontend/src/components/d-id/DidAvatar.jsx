/**
 * DidAvatar Component
 * Main embedded D-ID avatar component with lip-sync functionality
 */

import React, { useEffect, useRef, useState } from 'react';
import { useDidLipSync } from '../../hooks/d-id/useDidLipSync.js';
import AvatarControls from './AvatarControls.jsx';
import AvatarStatus from './AvatarStatus.jsx';
import ChatInterface from './ChatInterface.jsx';

const DidAvatar = ({ 
  config = {},
  onMessageSent = () => {},
  onError = () => {},
  onStatusChange = () => {},
  className = '',
  showControls = true,
  showChat = true,
  autoInitialize = true,
  theme = 'teal'
}) => {
  // D-ID lip-sync hook
  const lipSync = useDidLipSync(config);
  
  // Local state
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  
  // Refs
  const containerRef = useRef(null);
  const initializationAttempted = useRef(false);

  /**
   * Initialize avatar on mount
   */
  useEffect(() => {
    if (autoInitialize && !isInitialized && !initializationAttempted.current) {
      initializationAttempted.current = true;
      initializeAvatar();
    }
  }, [autoInitialize, isInitialized]);

  /**
   * Handle status changes
   */
  useEffect(() => {
    onStatusChange({
      isReady: lipSync.isReady,
      isConnected: lipSync.isConnected,
      isPlaying: lipSync.isPlaying,
      error: lipSync.error,
      queueLength: lipSync.queueLength
    });
  }, [
    lipSync.isReady, 
    lipSync.isConnected, 
    lipSync.isPlaying, 
    lipSync.error, 
    lipSync.queueLength,
    onStatusChange
  ]);

  /**
   * Handle errors
   */
  useEffect(() => {
    if (lipSync.error) {
      onError(lipSync.error);
    }
  }, [lipSync.error, onError]);

  /**
   * Initialize avatar
   */
  const initializeAvatar = async () => {
    try {
      const result = await lipSync.initializeLipSync(config);
      if (result.success) {
        setIsInitialized(true);
        console.log('D-ID Avatar initialized successfully');
      } else {
        console.error('Avatar initialization failed:', result.error);
        onError(result.error);
      }
    } catch (error) {
      console.error('Avatar initialization error:', error);
      onError(error.message);
    }
  };

  /**
   * Send message to avatar
   */
  const sendMessage = async (message, options = {}) => {
    if (!lipSync.canSpeak) {
      console.warn('Avatar not ready to speak');
      return false;
    }

    try {
      setCurrentMessage(message);
      
      // Add to chat history
      const chatEntry = {
        id: Date.now(),
        type: 'user',
        message,
        timestamp: new Date(),
        status: 'processing'
      };
      setChatHistory(prev => [...prev, chatEntry]);

      // Send message with lip-sync
      const result = await lipSync.speakWithLipSync(message, options);
      
      if (result.success) {
        // Update chat history with success
        setChatHistory(prev => prev.map(entry => 
          entry.id === chatEntry.id 
            ? { ...entry, status: 'completed', videoUrl: result.videoUrl }
            : entry
        ));
        
        onMessageSent({ message, result });
        return true;
      } else {
        // Update chat history with error
        setChatHistory(prev => prev.map(entry => 
          entry.id === chatEntry.id 
            ? { ...entry, status: 'error', error: result.error }
            : entry
        ));
        
        onError(result.error);
        return false;
      }
    } catch (error) {
      console.error('Message sending error:', error);
      onError(error.message);
      return false;
    } finally {
      setCurrentMessage('');
    }
  };

  /**
   * Queue message for later playback
   */
  const queueMessage = (message, options = {}) => {
    const messageId = lipSync.queueMessage(message, options);
    
    // Add to chat history
    const chatEntry = {
      id: messageId,
      type: 'user',
      message,
      timestamp: new Date(),
      status: 'queued'
    };
    setChatHistory(prev => [...prev, chatEntry]);
    
    return messageId;
  };

  /**
   * Clear chat history
   */
  const clearChat = () => {
    setChatHistory([]);
    lipSync.clearQueue();
  };

  /**
   * Restart avatar
   */
  const restart = async () => {
    await lipSync.reset();
    setIsInitialized(false);
    setChatHistory([]);
    setCurrentMessage('');
    initializationAttempted.current = false;
    
    if (autoInitialize) {
      setTimeout(initializeAvatar, 1000);
    }
  };

  // Theme classes
  const themeClasses = {
    teal: {
      container: 'border-teal-200 bg-teal-50',
      video: 'ring-teal-300',
      accent: 'text-teal-600'
    },
    navy: {
      container: 'border-blue-200 bg-blue-50',
      video: 'ring-blue-300',
      accent: 'text-blue-600'
    },
    gray: {
      container: 'border-gray-200 bg-gray-50',
      video: 'ring-gray-300',
      accent: 'text-gray-600'
    }
  };

  const currentTheme = themeClasses[theme] || themeClasses.teal;

  return (
    <div 
      ref={containerRef}
      className={`did-avatar-container rounded-lg border-2 p-4 ${currentTheme.container} ${className}`}
    >
      {/* Avatar Video Display */}
      <div className="avatar-video-wrapper relative mb-4 flex justify-center">
        <div className={`relative rounded-lg overflow-hidden ring-2 ${currentTheme.video}`}>
          {lipSync.currentVideo ? (
            <video
              ref={lipSync.videoElementRef}
              src={lipSync.currentVideo.url}
              className="w-full max-w-md h-auto"
              muted={false}
              playsInline
              autoPlay
              onLoadStart={() => console.log('Video loading...')}
              onCanPlay={() => console.log('Video ready to play')}
              onError={(e) => console.error('Video error:', e)}
            />
          ) : (
            <div className="w-full max-w-md h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-lg">
              {lipSync.isLoading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"></div>
                  <p className={`text-sm ${currentTheme.accent}`}>Initializing Avatar...</p>
                </div>
              ) : lipSync.error ? (
                <div className="text-center text-red-600">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">Avatar Error</p>
                </div>
              ) : !isInitialized ? (
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-sm text-gray-500">Avatar Ready</p>
                  <button 
                    onClick={initializeAvatar}
                    className="mt-2 px-3 py-1 bg-teal-600 text-white rounded text-xs hover:bg-teal-700"
                  >
                    Initialize
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-sm text-teal-600">Ready to Chat</p>
                </div>
              )}
            </div>
          )}
          
          {/* Playing indicator */}
          {lipSync.isPlaying && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
              Speaking...
            </div>
          )}
          
          {/* Queue indicator */}
          {lipSync.hasQueue && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs">
              Queue: {lipSync.queueLength}
            </div>
          )}
        </div>
      </div>

      {/* Status Component */}
      {showControls && (
        <AvatarStatus
          status={{
            isReady: lipSync.isReady,
            isConnected: lipSync.isConnected,
            isPlaying: lipSync.isPlaying,
            error: lipSync.error,
            metrics: lipSync.metrics,
            syncMetrics: lipSync.syncMetrics
          }}
          theme={theme}
        />
      )}

      {/* Controls Component */}
      {showControls && (
        <AvatarControls
          onRestart={restart}
          onClearQueue={lipSync.clearQueue}
          onClearChat={clearChat}
          isReady={lipSync.isReady}
          hasQueue={lipSync.hasQueue}
          theme={theme}
        />
      )}

      {/* Chat Interface */}
      {showChat && (
        <ChatInterface
          onSendMessage={sendMessage}
          onQueueMessage={queueMessage}
          chatHistory={chatHistory}
          isReady={lipSync.canSpeak}
          currentMessage={currentMessage}
          theme={theme}
        />
      )}
    </div>
  );
};

export default DidAvatar;