/**
 * ChatInterface Component
 * Chat interface for interacting with D-ID avatar
 */

import React, { useState, useRef, useEffect } from 'react';

const ChatInterface = ({
  onSendMessage,
  onQueueMessage,
  chatHistory = [],
  isReady = false,
  currentMessage = '',
  theme = 'teal',
  className = '',
  placeholder = 'Type your message to the bartender...',
  showQueueOption = true,
  maxHeight = '300px'
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sendMode, setSendMode] = useState('immediate'); // 'immediate' or 'queue'
  
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const themeClasses = {
    teal: {
      primary: 'bg-teal-600 hover:bg-teal-700 text-white',
      secondary: 'bg-teal-100 hover:bg-teal-200 text-teal-700',
      input: 'border-teal-300 focus:border-teal-500 focus:ring-teal-500',
      accent: 'text-teal-600',
      bg: 'bg-teal-50'
    },
    navy: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
      input: 'border-blue-300 focus:border-blue-500 focus:ring-blue-500',
      accent: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    gray: {
      primary: 'bg-gray-600 hover:bg-gray-700 text-white',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
      input: 'border-gray-300 focus:border-gray-500 focus:ring-gray-500',
      accent: 'text-gray-600',
      bg: 'bg-gray-50'
    }
  };

  const currentTheme = themeClasses[theme] || themeClasses.teal;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !isReady) {
      return;
    }

    const message = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);

    try {
      if (sendMode === 'immediate') {
        await onSendMessage(message);
      } else {
        onQueueMessage(message);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const getMessageStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        );
      case 'processing':
        return (
          <div className="w-4 h-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
          </div>
        );
      case 'queued':
        return (
          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`chat-interface bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Chat Header */}
      <div className={`${currentTheme.bg} px-4 py-2 rounded-t-lg border-b border-gray-200`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-semibold ${currentTheme.accent}`}>
            Chat with Avatar
          </h3>
          <div className="flex items-center space-x-2">
            {showQueueOption && (
              <div className="flex items-center">
                <label className="text-xs text-gray-600 mr-2">Send Mode:</label>
                <select
                  value={sendMode}
                  onChange={(e) => setSendMode(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="immediate">Immediate</option>
                  <option value="queue">Queue</option>
                </select>
              </div>
            )}
            <div className={`flex items-center px-2 py-1 rounded-full text-xs ${
              isReady ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-1 ${
                isReady ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              {isReady ? 'Ready' : 'Not Ready'}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="chat-messages p-4 overflow-y-auto"
        style={{ maxHeight }}
      >
        {chatHistory.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">No messages yet. Start a conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chatHistory.map((entry) => (
              <div key={entry.id} className="message-entry">
                <div className="flex items-start space-x-2">
                  {/* User Avatar */}
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  
                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <p className="text-sm text-gray-800">{entry.message}</p>
                    </div>
                    
                    {/* Message Metadata */}
                    <div className="flex items-center mt-1 space-x-2">
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                      <div className="flex items-center">
                        {getMessageStatusIcon(entry.status)}
                        <span className="text-xs text-gray-500 ml-1 capitalize">
                          {entry.status}
                        </span>
                      </div>
                      {entry.error && (
                        <span className="text-xs text-red-500" title={entry.error}>
                          ⚠ Error
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Typing Indicator */}
        {(isTyping || currentMessage) && (
          <div className="flex items-center space-x-2 mt-3">
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="bg-teal-100 rounded-lg px-3 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="chat-input border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isReady ? placeholder : 'Avatar is not ready...'}
              disabled={!isReady || isTyping}
              rows={1}
              className={`w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 ${currentTheme.input} ${
                !isReady || isTyping ? 'bg-gray-100 text-gray-500' : ''
              }`}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            type="submit"
            disabled={!isReady || !inputMessage.trim() || isTyping}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              !isReady || !inputMessage.trim() || isTyping
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : currentTheme.primary
            }`}
          >
            {isTyping ? (
              <div className="w-5 h-5">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              </div>
            ) : sendMode === 'queue' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
        
        {/* Input Help Text */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>
            Mode: <span className="font-medium">{sendMode === 'queue' ? 'Queue' : 'Immediate'}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;