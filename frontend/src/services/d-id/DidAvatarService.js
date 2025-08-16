/**
 * D-ID Avatar Service
 * High-level service for managing avatar interactions and lip-sync functionality
 */

import didApiService from './DidApiService.js';
import { v4 as uuidv4 } from 'uuid';

class DidAvatarService {
  constructor() {
    this.currentSession = null;
    this.activeStreams = new Map();
    this.avatarProfiles = new Map();
    this.messageQueue = [];
    this.isProcessing = false;
    
    // Default avatar configuration
    this.defaultAvatar = {
      sourceUrl: 'https://d-id-public-bucket.s3.amazonaws.com/alice.jpg',
      voiceId: 'en-US-JennyNeural',
      name: 'Nauti Assistant',
      personality: 'friendly bartender'
    };

    // Performance metrics
    this.metrics = {
      sessionsCreated: 0,
      messagesProcessed: 0,
      averageResponseTime: 0,
      lastInteraction: null
    };
  }

  /**
   * Initialize avatar with specific configuration
   * @param {Object} avatarConfig - Avatar configuration
   * @returns {Promise<Object>} - Avatar initialization result
   */
  async initializeAvatar(avatarConfig = {}) {
    const config = { ...this.defaultAvatar, ...avatarConfig };
    const avatarId = uuidv4();
    
    try {
      // Store avatar profile
      this.avatarProfiles.set(avatarId, {
        id: avatarId,
        ...config,
        createdAt: new Date(),
        status: 'initializing'
      });

      // Test connection and validate avatar source
      const isConnected = await didApiService.testConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to D-ID service');
      }

      // Update avatar status
      const avatar = this.avatarProfiles.get(avatarId);
      avatar.status = 'ready';
      avatar.initializedAt = new Date();

      this.metrics.sessionsCreated++;

      return {
        success: true,
        avatarId,
        avatar,
        capabilities: [
          'text-to-speech',
          'lip-sync',
          'real-time-interaction',
          'streaming'
        ]
      };

    } catch (error) {
      console.error('Avatar initialization failed:', error);
      
      // Update avatar status to error
      if (this.avatarProfiles.has(avatarId)) {
        this.avatarProfiles.get(avatarId).status = 'error';
      }

      return {
        success: false,
        error: error.message,
        avatarId
      };
    }
  }

  /**
   * Create streaming session for real-time avatar interaction
   * @param {string} avatarId - Avatar ID
   * @returns {Promise<Object>} - Session creation result
   */
  async createStreamingSession(avatarId) {
    const avatar = this.avatarProfiles.get(avatarId);
    if (!avatar || avatar.status !== 'ready') {
      throw new Error('Avatar not ready for streaming');
    }

    try {
      const sessionConfig = {
        sourceUrl: avatar.sourceUrl,
        sessionId: uuidv4(),
        customConfig: {
          stitch: true,
          fluent: true,
          pad_audio: 0,
          align_driver: true,
          auto_match: true
        }
      };

      const session = await didApiService.createStreamingSession(sessionConfig);
      
      const streamData = {
        sessionId: session.id,
        avatarId,
        status: 'active',
        createdAt: new Date(),
        messagesCount: 0,
        webSocketUrl: session.session_id ? `wss://api.d-id.com/ws/${session.session_id}` : null
      };

      this.activeStreams.set(session.id, streamData);
      this.currentSession = session.id;

      return {
        success: true,
        sessionId: session.id,
        streamData,
        webSocketUrl: streamData.webSocketUrl
      };

    } catch (error) {
      console.error('Streaming session creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send message to avatar with lip-sync
   * @param {string} sessionId - Streaming session ID
   * @param {string} message - Message text
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Message sending result
   */
  async sendMessage(sessionId, message, options = {}) {
    const stream = this.activeStreams.get(sessionId);
    if (!stream || stream.status !== 'active') {
      throw new Error('Stream session not active');
    }

    const avatar = this.avatarProfiles.get(stream.avatarId);
    const startTime = Date.now();

    try {
      const messageData = {
        text: message,
        voiceId: options.voiceId || avatar.voiceId,
        config: {
          stitch: true,
          fluent: true,
          pad_audio: 0,
          ...options.config
        }
      };

      const response = await didApiService.sendStreamingMessage(sessionId, messageData);
      
      // Update stream metrics
      stream.messagesCount++;
      stream.lastMessage = new Date();
      
      // Update global metrics
      this.metrics.messagesProcessed++;
      const responseTime = Date.now() - startTime;
      this.metrics.averageResponseTime = (this.metrics.averageResponseTime + responseTime) / 2;
      this.metrics.lastInteraction = new Date();

      return {
        success: true,
        messageId: response.id,
        status: response.status,
        videoUrl: response.result_url,
        duration: response.audio_duration,
        responseTime
      };

    } catch (error) {
      console.error('Message sending failed:', error);
      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Process message queue for batch operations
   * @returns {Promise<void>}
   */
  async processMessageQueue() {
    if (this.isProcessing || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.messageQueue.length > 0) {
        const queueItem = this.messageQueue.shift();
        await this.sendMessage(queueItem.sessionId, queueItem.message, queueItem.options);
        
        // Add small delay between messages
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Message queue processing failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Queue message for later processing
   * @param {string} sessionId - Session ID
   * @param {string} message - Message text
   * @param {Object} options - Message options
   */
  queueMessage(sessionId, message, options = {}) {
    this.messageQueue.push({
      sessionId,
      message,
      options,
      queuedAt: new Date()
    });

    // Auto-process if not already processing
    if (!this.isProcessing) {
      setTimeout(() => this.processMessageQueue(), 50);
    }
  }

  /**
   * Close streaming session
   * @param {string} sessionId - Session ID to close
   * @returns {Promise<Object>} - Close result
   */
  async closeSession(sessionId) {
    try {
      await didApiService.closeStreamingSession(sessionId);
      
      const stream = this.activeStreams.get(sessionId);
      if (stream) {
        stream.status = 'closed';
        stream.closedAt = new Date();
      }

      if (this.currentSession === sessionId) {
        this.currentSession = null;
      }

      return { success: true };
    } catch (error) {
      console.error('Session closing failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get avatar status and information
   * @param {string} avatarId - Avatar ID
   * @returns {Object} - Avatar information
   */
  getAvatarInfo(avatarId) {
    const avatar = this.avatarProfiles.get(avatarId);
    if (!avatar) {
      return null;
    }

    const activeSessions = Array.from(this.activeStreams.values())
      .filter(stream => stream.avatarId === avatarId && stream.status === 'active');

    return {
      ...avatar,
      activeSessions: activeSessions.length,
      totalMessages: activeSessions.reduce((sum, session) => sum + session.messagesCount, 0)
    };
  }

  /**
   * Get service metrics and performance data
   * @returns {Object} - Service metrics
   */
  getMetrics() {
    const apiMetrics = didApiService.getMetrics();
    
    return {
      avatar: this.metrics,
      api: apiMetrics,
      streams: {
        active: Array.from(this.activeStreams.values()).filter(s => s.status === 'active').length,
        total: this.activeStreams.size
      },
      avatars: {
        total: this.avatarProfiles.size,
        ready: Array.from(this.avatarProfiles.values()).filter(a => a.status === 'ready').length
      },
      queue: {
        pending: this.messageQueue.length,
        processing: this.isProcessing
      }
    };
  }

  /**
   * Clean up inactive sessions and avatars
   * @param {number} maxAge - Max age in milliseconds
   */
  cleanup(maxAge = 30 * 60 * 1000) { // 30 minutes default
    const now = Date.now();
    
    // Clean up inactive streams
    for (const [sessionId, stream] of this.activeStreams.entries()) {
      const age = now - stream.createdAt.getTime();
      if (age > maxAge && stream.status !== 'active') {
        this.activeStreams.delete(sessionId);
      }
    }

    // Clean up error avatars
    for (const [avatarId, avatar] of this.avatarProfiles.entries()) {
      const age = now - avatar.createdAt.getTime();
      if (age > maxAge && avatar.status === 'error') {
        this.avatarProfiles.delete(avatarId);
      }
    }
  }

  /**
   * Dispose of all resources
   */
  dispose() {
    // Close all active sessions
    for (const sessionId of this.activeStreams.keys()) {
      this.closeSession(sessionId).catch(console.error);
    }

    // Clear all data
    this.activeStreams.clear();
    this.avatarProfiles.clear();
    this.messageQueue = [];
    this.currentSession = null;
    this.isProcessing = false;
  }
}

// Create singleton instance
const didAvatarService = new DidAvatarService();

export default didAvatarService;