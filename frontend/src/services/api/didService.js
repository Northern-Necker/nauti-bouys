import axios from 'axios'

class DIDService {
  constructor() {
    this.baseURL = 'https://api.d-id.com'
    this.apiKey = 'bWV0b3JiZXJ0QGdtYWlsLmNvbQ:JAn6hh4wQ2TFoOAl-GD4F'
    this.sessionData = null
    this.streamingConnection = null
  }

  // Initialize D-ID streaming session
  async createStreamingSession() {
    try {
      const response = await axios.post(
        `${this.baseURL}/talks/streams`,
        {
          source_url: "https://d-id-public-bucket.s3.amazonaws.com/alice.jpg",
          config: {
            fluent: true,
            pad_audio: 0.0,
            driver_expressions: {
              expressions: [
                { start_frame: 0, expression: "neutral", intensity: 1.0 },
                { start_frame: 30, expression: "happy", intensity: 0.7 }
              ]
            },
            align_driver: true,
            auto_match: true,
            motion_factor: 1.0,
            normalize_audio: true,
            sharpen: true,
            stitch: true,
            result_format: "webm"
          }
        },
        {
          headers: {
            'Authorization': `Basic ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      )

      this.sessionData = response.data
      return {
        success: true,
        sessionId: response.data.id,
        iceServers: response.data.ice_servers,
        offerSdp: response.data.offer,
        streamUrl: response.data.stream_url
      }
    } catch (error) {
      console.error('D-ID session creation failed:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create D-ID session'
      }
    }
  }

  // Send text to D-ID for speech synthesis and avatar animation
  async sendMessage(sessionId, text, config = {}) {
    try {
      const response = await axios.post(
        `${this.baseURL}/talks/streams/${sessionId}`,
        {
          script: {
            type: "text",
            subtitles: "false",
            provider: {
              type: "microsoft",
              voice_id: "en-US-JennyNeural",
              voice_config: {
                style: "friendly",
                rate: "1.0",
                pitch: "1.0"
              }
            },
            ssml: false,
            input: text
          },
          config: {
            stitch: true,
            ...config
          }
        },
        {
          headers: {
            'Authorization': `Basic ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('D-ID message send failed:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send message to D-ID'
      }
    }
  }

  // Destroy streaming session
  async destroySession(sessionId) {
    try {
      await axios.delete(
        `${this.baseURL}/talks/streams/${sessionId}`,
        {
          headers: {
            'Authorization': `Basic ${this.apiKey}`
          }
        }
      )
      return { success: true }
    } catch (error) {
      console.error('D-ID session destruction failed:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to destroy D-ID session'
      }
    }
  }

  // Analyze emotion from video feed (placeholder for emotion detection)
  async analyzeEmotion(videoFrame) {
    // This would integrate with emotion detection APIs
    // For now, returning mock data
    return {
      success: true,
      emotion: {
        primary: 'neutral',
        confidence: 0.85,
        emotions: {
          happy: 0.2,
          sad: 0.1,
          neutral: 0.6,
          excited: 0.1
        }
      }
    }
  }

  // Create WebRTC connection for interactive session
  createWebRTCConnection(iceServers) {
    return new RTCPeerConnection({
      iceServers: iceServers || [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    })
  }

  // Get available voices for the D-ID avatar
  async getAvailableVoices() {
    try {
      const response = await axios.get(
        `${this.baseURL}/tts/voices`,
        {
          headers: {
            'Authorization': `Basic ${this.apiKey}`
          }
        }
      )

      return {
        success: true,
        voices: response.data
      }
    } catch (error) {
      console.error('Failed to fetch D-ID voices:', error)
      return {
        success: false,
        error: 'Failed to fetch available voices',
        voices: [
          { id: 'en-US-JennyNeural', name: 'Jenny (Friendly)', language: 'en-US' },
          { id: 'en-US-AriaNeural', name: 'Aria (Professional)', language: 'en-US' }
        ]
      }
    }
  }

  // Health check for D-ID service
  async healthCheck() {
    try {
      const response = await axios.get(
        `${this.baseURL}/credits`,
        {
          headers: {
            'Authorization': `Basic ${this.apiKey}`
          }
        }
      )

      return {
        success: true,
        credits: response.data.remaining_credits,
        status: 'healthy'
      }
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        error: error.message
      }
    }
  }
}

export default new DIDService()