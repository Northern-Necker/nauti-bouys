/**
 * useDidLipSync Hook
 * React hook for managing lip-sync functionality with D-ID avatars
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDidAvatar } from './useDidAvatar.js';
import { useDidWebSocket } from './useDidWebSocket.js';

export const useDidLipSync = (avatarConfig = {}) => {
  // Avatar and WebSocket hooks
  const avatar = useDidAvatar(avatarConfig);
  const webSocket = useDidWebSocket(avatar.session?.webSocketUrl);
  
  // Lip-sync specific state
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);
  const [processingQueue, setProcessingQueue] = useState(false);
  const [syncMetrics, setSyncMetrics] = useState({
    latency: 0,
    accuracy: 0,
    droppedFrames: 0,
    totalMessages: 0
  });
  
  // Refs for video and audio management
  const videoElementRef = useRef(null);
  const audioElementRef = useRef(null);
  const currentMessageRef = useRef(null);
  const performanceStartRef = useRef(null);

  /**
   * Initialize lip-sync system
   */
  const initializeLipSync = useCallback(async (config = {}) => {
    try {
      // Initialize avatar first
      const avatarResult = await avatar.initializeAvatar(config);
      if (!avatarResult.success) {
        throw new Error(avatarResult.error);
      }

      // Create streaming session
      const sessionResult = await avatar.createSession();
      if (!sessionResult.success) {
        throw new Error(sessionResult.error);
      }

      return {
        success: true,
        avatarId: avatar.avatarId,
        sessionId: avatar.sessionId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }, [avatar]);

  /**
   * Speak with lip-sync animation
   */
  const speakWithLipSync = useCallback(async (text, options = {}) => {
    if (!avatar.canSpeak) {
      throw new Error('Avatar not ready for speaking');
    }

    performanceStartRef.current = performance.now();
    currentMessageRef.current = {
      text,
      timestamp: Date.now(),
      options
    };

    try {
      // Send message to D-ID
      const result = await avatar.speak(text, {
        ...options,
        config: {
          stitch: true,
          fluent: true,
          pad_audio: 0,
          result_format: 'mp4',
          ...options.config
        }
      });

      if (result.success) {
        // Update current video
        setCurrentVideo({
          url: result.videoUrl,
          duration: result.duration,
          messageId: result.messageId,
          text,
          timestamp: Date.now()
        });

        // Calculate latency
        const latency = performance.now() - performanceStartRef.current;
        setSyncMetrics(prev => ({
          ...prev,
          latency: (prev.latency + latency) / 2, // Running average
          totalMessages: prev.totalMessages + 1
        }));

        setIsPlaying(true);
      }

      return result;
    } catch (error) {
      setSyncMetrics(prev => ({
        ...prev,
        droppedFrames: prev.droppedFrames + 1
      }));
      throw error;
    } finally {
      currentMessageRef.current = null;
    }
  }, [avatar]);

  /**
   * Queue message for sequential playback
   */
  const queueMessage = useCallback((text, options = {}) => {
    const messageId = Date.now() + Math.random();
    
    setQueue(prev => [...prev, {
      id: messageId,
      text,
      options,
      timestamp: Date.now(),
      status: 'queued'
    }]);

    return messageId;
  }, []);

  /**
   * Process queued messages
   */
  const processQueue = useCallback(async () => {
    if (processingQueue || queue.length === 0 || !avatar.canSpeak) {
      return;
    }

    setProcessingQueue(true);

    try {
      const nextMessage = queue[0];
      setQueue(prev => prev.slice(1));

      // Update message status
      setQueue(prev => prev.map(msg => 
        msg.id === nextMessage.id 
          ? { ...msg, status: 'processing' }
          : msg
      ));

      await speakWithLipSync(nextMessage.text, nextMessage.options);

      // Wait for video to finish playing before processing next
      if (videoElementRef.current) {
        await new Promise(resolve => {
          const video = videoElementRef.current;
          const handleEnded = () => {
            video.removeEventListener('ended', handleEnded);
            resolve();
          };
          video.addEventListener('ended', handleEnded);
        });
      }

    } catch (error) {
      console.error('Queue processing error:', error);
    } finally {
      setProcessingQueue(false);
      
      // Continue processing if more messages in queue
      if (queue.length > 0) {
        setTimeout(processQueue, 100);
      }
    }
  }, [processingQueue, queue, avatar.canSpeak, speakWithLipSync]);

  /**
   * Clear message queue
   */
  const clearQueue = useCallback(() => {
    setQueue([]);
    setProcessingQueue(false);
  }, []);

  /**
   * Handle video element events
   */
  const handleVideoEvents = useCallback(() => {
    const video = videoElementRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      console.log('Video loading started');
    };

    const handleCanPlay = () => {
      console.log('Video can play');
      video.play().catch(console.error);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentVideo(null);
    };

    const handleError = (e) => {
      console.error('Video playback error:', e);
      setSyncMetrics(prev => ({
        ...prev,
        droppedFrames: prev.droppedFrames + 1
      }));
      setIsPlaying(false);
    };

    // Add event listeners
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    // Cleanup function
    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, []);

  // Auto-process queue when new messages arrive
  useEffect(() => {
    if (queue.length > 0 && !processingQueue && avatar.canSpeak) {
      processQueue();
    }
  }, [queue.length, processingQueue, avatar.canSpeak, processQueue]);

  // Setup video event listeners
  useEffect(() => {
    if (videoElementRef.current) {
      return handleVideoEvents();
    }
  }, [handleVideoEvents, videoElementRef.current]);

  // WebSocket message handling for real-time updates
  useEffect(() => {
    if (webSocket.lastMessage) {
      const message = webSocket.lastMessage;
      
      // Handle different message types from D-ID WebSocket
      switch (message.type) {
        case 'video_ready':
          setCurrentVideo(prev => prev ? { ...prev, ready: true } : null);
          break;
        case 'playback_started':
          setIsPlaying(true);
          break;
        case 'playback_ended':
          setIsPlaying(false);
          break;
        case 'error':
          setSyncMetrics(prev => ({
            ...prev,
            droppedFrames: prev.droppedFrames + 1
          }));
          break;
        default:
          break;
      }
    }
  }, [webSocket.lastMessage]);

  return {
    // Avatar state
    ...avatar,
    
    // WebSocket state
    webSocketConnected: webSocket.isConnected,
    webSocketError: webSocket.error,
    
    // Lip-sync specific state
    currentVideo,
    isPlaying,
    queue,
    processingQueue,
    syncMetrics,
    
    // Actions
    initializeLipSync,
    speakWithLipSync,
    queueMessage,
    processQueue,
    clearQueue,
    
    // Refs for components
    videoElementRef,
    audioElementRef,
    
    // Computed values
    isReady: avatar.isReady && !avatar.isLoading,
    canSpeak: avatar.canSpeak && !processingQueue,
    hasQueue: queue.length > 0,
    queueLength: queue.length
  };
};