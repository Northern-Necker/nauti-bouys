/**
 * useDidWebSocket Hook
 * React hook for managing WebSocket connections to D-ID streaming API
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export const useDidWebSocket = (webSocketUrl) => {
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected'); // disconnected, connecting, connected, error
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const [messageHistory, setMessageHistory] = useState([]);
  
  // Refs for WebSocket and reconnection
  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // Start with 1 second

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    if (!webSocketUrl) return;
    
    if (ws.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setConnectionState('connecting');
    setError(null);

    try {
      ws.current = new WebSocket(webSocketUrl);

      ws.current.onopen = () => {
        console.log('D-ID WebSocket connected');
        setIsConnected(true);
        setConnectionState('connected');
        setError(null);
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          setMessageHistory(prev => [...prev.slice(-49), data]); // Keep last 50 messages
          
          console.log('D-ID WebSocket message:', data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
          setError('Failed to parse message');
        }
      };

      ws.current.onclose = (event) => {
        console.log('D-ID WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setConnectionState('disconnected');
        
        // Attempt to reconnect if not a clean close
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = reconnectDelay * Math.pow(2, reconnectAttempts.current);
          console.log(`Attempting to reconnect in ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError('Max reconnection attempts reached');
          setConnectionState('error');
        }
      };

      ws.current.onerror = (error) => {
        console.error('D-ID WebSocket error:', error);
        setError('WebSocket connection error');
        setConnectionState('error');
      };

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to create connection');
      setConnectionState('error');
    }
  }, [webSocketUrl]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (ws.current) {
      ws.current.close(1000, 'Manual disconnect');
      ws.current = null;
    }

    setIsConnected(false);
    setConnectionState('disconnected');
    setError(null);
    reconnectAttempts.current = 0;
  }, []);

  /**
   * Send message through WebSocket
   */
  const sendMessage = useCallback((message) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket not connected');
      return false;
    }

    try {
      const messageData = typeof message === 'string' ? message : JSON.stringify(message);
      ws.current.send(messageData);
      return true;
    } catch (err) {
      console.error('Failed to send WebSocket message:', err);
      setError('Failed to send message');
      return false;
    }
  }, []);

  /**
   * Clear message history
   */
  const clearHistory = useCallback(() => {
    setMessageHistory([]);
    setLastMessage(null);
  }, []);

  /**
   * Manual reconnect
   */
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      reconnectAttempts.current = 0;
      connect();
    }, 100);
  }, [disconnect, connect]);

  // Auto-connect when URL is provided
  useEffect(() => {
    if (webSocketUrl) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [webSocketUrl, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    isConnected,
    connectionState,
    lastMessage,
    error,
    messageHistory,
    
    // Actions
    connect,
    disconnect,
    sendMessage,
    clearHistory,
    reconnect,
    
    // Computed values
    canSend: isConnected && connectionState === 'connected',
    reconnectAttempts: reconnectAttempts.current,
    hasError: !!error || connectionState === 'error'
  };
};