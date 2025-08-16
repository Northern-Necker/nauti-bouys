/**
 * D-ID API Service
 * Handles all API interactions with D-ID for avatar creation and animation
 */

class DidApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_DID_BASE_URL;
    this.apiKey = import.meta.env.VITE_DID_API_KEY;
    this.defaultHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Basic ${this.apiKey}`
    };
    
    // Performance tracking
    this.requestCount = 0;
    this.errorCount = 0;
    this.lastRequestTime = null;
  }

  /**
   * Make authenticated API request to D-ID
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - API response
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      }
    };

    try {
      this.requestCount++;
      this.lastRequestTime = Date.now();
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`D-ID API Error: ${response.status} - ${errorData.message || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      this.errorCount++;
      console.error('D-ID API Request failed:', error);
      throw error;
    }
  }

  /**
   * Create a new talk (video generation) with D-ID
   * @param {Object} talkData - Talk configuration
   * @returns {Promise<Object>} - Talk creation response
   */
  async createTalk(talkData) {
    const payload = {
      source_url: talkData.sourceUrl || talkData.image,
      script: {
        type: 'text',
        subtitles: 'false',
        provider: {
          type: 'microsoft',
          voice_id: talkData.voiceId || 'en-US-JennyNeural'
        },
        input: talkData.text
      },
      config: {
        fluent: true,
        pad_audio: 0,
        stitch: true,
        align_driver: true,
        sharpen: true,
        auto_match: true,
        normalization_factor: 1,
        logo: {
          url: talkData.logoUrl || null,
          position: [10, 10]
        },
        result_format: 'mp4'
      },
      ...talkData.customConfig
    };

    return await this.makeRequest('/talks', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Get talk status and results
   * @param {string} talkId - Talk ID
   * @returns {Promise<Object>} - Talk status response
   */
  async getTalkStatus(talkId) {
    return await this.makeRequest(`/talks/${talkId}`);
  }

  /**
   * Delete a talk
   * @param {string} talkId - Talk ID
   * @returns {Promise<Object>} - Deletion response
   */
  async deleteTalk(talkId) {
    return await this.makeRequest(`/talks/${talkId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get available voices
   * @returns {Promise<Object>} - Available voices
   */
  async getVoices() {
    return await this.makeRequest('/voices');
  }

  /**
   * Upload image for avatar
   * @param {File} imageFile - Image file
   * @returns {Promise<string>} - Image URL
   */
  async uploadImage(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    return await this.makeRequest('/images', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${this.apiKey}`,
        // Don't set Content-Type for FormData
      },
      body: formData
    });
  }

  /**
   * Create streaming session for real-time interaction
   * @param {Object} sessionData - Session configuration
   * @returns {Promise<Object>} - Session response
   */
  async createStreamingSession(sessionData) {
    const payload = {
      source_url: sessionData.sourceUrl,
      config: {
        stitch: true,
        fluent: true,
        pad_audio: 0
      },
      session_id: sessionData.sessionId || null,
      ...sessionData.customConfig
    };

    return await this.makeRequest('/streams', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Send streaming message
   * @param {string} sessionId - Streaming session ID
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} - Streaming response
   */
  async sendStreamingMessage(sessionId, messageData) {
    const payload = {
      script: {
        type: 'text',
        input: messageData.text,
        provider: {
          type: 'microsoft',
          voice_id: messageData.voiceId || 'en-US-JennyNeural'
        }
      },
      config: messageData.config || {},
      session_id: sessionId
    };

    return await this.makeRequest(`/streams/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Close streaming session
   * @param {string} sessionId - Session ID to close
   * @returns {Promise<Object>} - Close response
   */
  async closeStreamingSession(sessionId) {
    return await this.makeRequest(`/streams/${sessionId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get service health and performance metrics
   * @returns {Object} - Service metrics
   */
  getMetrics() {
    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      successRate: this.requestCount > 0 ? ((this.requestCount - this.errorCount) / this.requestCount * 100).toFixed(2) + '%' : '0%',
      lastRequestTime: this.lastRequestTime,
      isHealthy: this.apiKey && this.baseURL
    };
  }

  /**
   * Validate API configuration
   * @returns {Object} - Validation results
   */
  validateConfig() {
    const issues = [];
    
    if (!this.apiKey) issues.push('Missing D-ID API key');
    if (!this.baseURL) issues.push('Missing D-ID base URL');
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Test API connectivity
   * @returns {Promise<boolean>} - Connection test result
   */
  async testConnection() {
    try {
      await this.getVoices();
      return true;
    } catch (error) {
      console.error('D-ID connection test failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const didApiService = new DidApiService();

export default didApiService;