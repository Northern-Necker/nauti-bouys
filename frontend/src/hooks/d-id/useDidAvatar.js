/**
 * useDidAvatar Hook
 * React hook for managing D-ID avatar state and interactions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import didAvatarService from '../../services/d-id/DidAvatarService.js';

export const useDidAvatar = (initialConfig = {}) => {
  // State management
  const [avatar, setAvatar] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [metrics, setMetrics] = useState(null);
  
  // Refs for cleanup and state management
  const avatarIdRef = useRef(null);
  const sessionIdRef = useRef(null);
  const metricsIntervalRef = useRef(null);

  /**
   * Initialize avatar with configuration
   */
  const initializeAvatar = useCallback(async (config = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const mergedConfig = { ...initialConfig, ...config };
      const result = await didAvatarService.initializeAvatar(mergedConfig);

      if (result.success) {
        setAvatar(result.avatar);
        avatarIdRef.current = result.avatarId;
        setIsConnected(true);
      } else {
        setError(result.error);
        setIsConnected(false);
      }

      return result;
    } catch (err) {
      const errorMessage = err.message || 'Avatar initialization failed';
      setError(errorMessage);
      setIsConnected(false);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [initialConfig]);

  /**
   * Create streaming session for real-time interaction
   */
  const createSession = useCallback(async () => {
    if (!avatarIdRef.current) {
      throw new Error('Avatar not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await didAvatarService.createStreamingSession(avatarIdRef.current);

      if (result.success) {
        setSession(result.streamData);
        sessionIdRef.current = result.sessionId;
        setIsConnected(true);
      } else {
        setError(result.error);
        setIsConnected(false);
      }

      return result;
    } catch (err) {
      const errorMessage = err.message || 'Session creation failed';
      setError(errorMessage);
      setIsConnected(false);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Send message to avatar with lip-sync
   */
  const speak = useCallback(async (message, options = {}) => {
    if (!sessionIdRef.current) {
      throw new Error('No active session');
    }

    setIsSpeaking(true);
    setError(null);

    try {
      const result = await didAvatarService.sendMessage(
        sessionIdRef.current,
        message,
        options
      );

      if (!result.success) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const errorMessage = err.message || 'Message sending failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  /**
   * Queue message for batch processing
   */
  const queueSpeak = useCallback((message, options = {}) => {
    if (!sessionIdRef.current) {
      setError('No active session for queuing');
      return false;
    }

    try {
      didAvatarService.queueMessage(sessionIdRef.current, message, options);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  /**
   * Close current session
   */
  const closeSession = useCallback(async () => {
    if (!sessionIdRef.current) return { success: true };

    try {
      const result = await didAvatarService.closeSession(sessionIdRef.current);
      
      if (result.success) {
        setSession(null);
        sessionIdRef.current = null;
        setIsConnected(false);
        setIsSpeaking(false);
      }

      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Get current avatar information
   */
  const getAvatarInfo = useCallback(() => {
    if (!avatarIdRef.current) return null;
    return didAvatarService.getAvatarInfo(avatarIdRef.current);
  }, []);

  /**
   * Reset avatar state
   */
  const reset = useCallback(async () => {
    await closeSession();
    setAvatar(null);
    setError(null);
    setIsConnected(false);
    setIsSpeaking(false);
    avatarIdRef.current = null;
  }, [closeSession]);

  /**
   * Update metrics periodically
   */
  const updateMetrics = useCallback(() => {
    const newMetrics = didAvatarService.getMetrics();
    setMetrics(newMetrics);
  }, []);

  // Effects
  useEffect(() => {
    // Start metrics updates
    metricsIntervalRef.current = setInterval(updateMetrics, 5000);
    
    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, [updateMetrics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionIdRef.current) {
        didAvatarService.closeSession(sessionIdRef.current).catch(console.error);
      }
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, []);

  // Auto-initialize if config provided
  useEffect(() => {
    if (initialConfig && Object.keys(initialConfig).length > 0 && !avatar) {
      initializeAvatar().catch(console.error);
    }
  }, [initialConfig, avatar, initializeAvatar]);

  return {
    // State
    avatar,
    session,
    isLoading,
    error,
    isConnected,
    isSpeaking,
    metrics,
    
    // Actions
    initializeAvatar,
    createSession,
    speak,
    queueSpeak,
    closeSession,
    getAvatarInfo,
    reset,
    updateMetrics,
    
    // Computed values
    isReady: !!(avatar && isConnected),
    canSpeak: !!(session && isConnected && !isSpeaking),
    avatarId: avatarIdRef.current,
    sessionId: sessionIdRef.current
  };
};