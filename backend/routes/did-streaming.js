const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const didStreamingService = require('../services/didStreamingService');

const router = express.Router();

// @route   POST /api/did-streaming/create-stream
// @desc    Create new D-ID streaming session
// @access  Private
router.post('/create-stream', [
  auth,
  body('avatarImageUrl').optional().custom((value) => {
    if (value && !value.match(/^https?:\/\/.+/)) {
      throw new Error('Avatar image URL must be a valid URL');
    }
    return true;
  }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { avatarImageUrl } = req.body;

    console.log(`[D-ID Streaming API] Creating stream for user: ${req.user.id}`);

    const streamData = await didStreamingService.createStream(avatarImageUrl);

    res.json({
      success: true,
      stream: {
        id: streamData.id,
        sessionId: streamData.session_id,
        offer: streamData.offer,
        iceServers: streamData.ice_servers
      },
      message: 'D-ID stream created successfully'
    });

  } catch (error) {
    console.error('[D-ID Streaming API] Create stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create D-ID stream',
      error: error.message
    });
  }
});

// @route   POST /api/did-streaming/start-stream
// @desc    Start D-ID stream with SDP answer
// @access  Private
router.post('/start-stream', [
  auth,
  body('streamId').isString().withMessage('Stream ID is required'),
  body('sessionId').isString().withMessage('Session ID is required'),
  body('sdpAnswer').isObject().withMessage('SDP answer is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { streamId, sessionId, sdpAnswer } = req.body;

    console.log(`[D-ID Streaming API] Starting stream: ${streamId}`);

    const result = await didStreamingService.startStream(streamId, sdpAnswer, sessionId);

    res.json({
      success: true,
      result,
      message: 'D-ID stream started successfully'
    });

  } catch (error) {
    console.error('[D-ID Streaming API] Start stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start D-ID stream',
      error: error.message
    });
  }
});

// @route   POST /api/did-streaming/ice-candidate
// @desc    Submit ICE candidate for WebRTC connection
// @access  Private
router.post('/ice-candidate', [
  auth,
  body('streamId').isString().withMessage('Stream ID is required'),
  body('sessionId').isString().withMessage('Session ID is required'),
  body('candidate').isObject().withMessage('ICE candidate is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { streamId, sessionId, candidate } = req.body;

    // Submit ICE candidate (fire and forget)
    didStreamingService.submitIceCandidate(streamId, candidate, sessionId);

    res.json({
      success: true,
      message: 'ICE candidate submitted'
    });

  } catch (error) {
    console.error('[D-ID Streaming API] ICE candidate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit ICE candidate',
      error: error.message
    });
  }
});

// @route   POST /api/did-streaming/send-message
// @desc    Send message to AI and create D-ID talk
// @access  Private
router.post('/send-message', [
  auth,
  body('streamId').isString().withMessage('Stream ID is required'),
  body('sessionId').isString().withMessage('Session ID is required'),
  body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message is required (max 2000 chars)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { streamId, sessionId, message } = req.body;

    console.log(`[D-ID Streaming API] Processing message for stream: ${streamId}`);

    const result = await didStreamingService.processMessageAndCreateTalk(
      streamId, 
      sessionId, 
      message, 
      req.user.id
    );

    res.json({
      success: true,
      aiResponse: result.aiResponse,
      conversationSession: result.conversationSession,
      model: result.model,
      usage: result.usage,
      timestamp: new Date().toISOString(),
      message: 'Message processed and talk created successfully'
    });

  } catch (error) {
    console.error('[D-ID Streaming API] Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message',
      error: error.message
    });
  }
});

// @route   POST /api/did-streaming/create-talk
// @desc    Create D-ID talk with custom text
// @access  Private
router.post('/create-talk', [
  auth,
  body('streamId').isString().withMessage('Stream ID is required'),
  body('sessionId').isString().withMessage('Session ID is required'),
  body('text').trim().isLength({ min: 1, max: 3000 }).withMessage('Text is required (max 3000 chars)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { streamId, sessionId, text } = req.body;

    console.log(`[D-ID Streaming API] Creating talk for stream: ${streamId}`);

    const talkData = await didStreamingService.createTalk(streamId, sessionId, text);

    res.json({
      success: true,
      talkData,
      message: 'D-ID talk created successfully'
    });

  } catch (error) {
    console.error('[D-ID Streaming API] Create talk error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create D-ID talk',
      error: error.message
    });
  }
});

// @route   DELETE /api/did-streaming/close-stream
// @desc    Close D-ID stream
// @access  Private
router.delete('/close-stream', [
  auth,
  body('streamId').isString().withMessage('Stream ID is required'),
  body('sessionId').isString().withMessage('Session ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { streamId, sessionId } = req.body;

    console.log(`[D-ID Streaming API] Closing stream: ${streamId}`);

    await didStreamingService.closeStream(streamId, sessionId);

    res.json({
      success: true,
      message: 'D-ID stream closed successfully'
    });

  } catch (error) {
    console.error('[D-ID Streaming API] Close stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close D-ID stream',
      error: error.message
    });
  }
});

// @route   GET /api/did-streaming/stream-info/:streamId
// @desc    Get D-ID stream information
// @access  Private
router.get('/stream-info/:streamId', auth, async (req, res) => {
  try {
    const { streamId } = req.params;

    const streamInfo = didStreamingService.getStreamInfo(streamId);

    if (!streamInfo) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found'
      });
    }

    res.json({
      success: true,
      stream: {
        id: streamInfo.id,
        sessionId: streamInfo.sessionId,
        status: streamInfo.status,
        createdAt: streamInfo.createdAt,
        startedAt: streamInfo.startedAt
      }
    });

  } catch (error) {
    console.error('[D-ID Streaming API] Get stream info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stream info',
      error: error.message
    });
  }
});

// @route   GET /api/did-streaming/active-streams
// @desc    Get all active D-ID streams
// @access  Private
router.get('/active-streams', auth, async (req, res) => {
  try {
    const activeStreams = didStreamingService.getActiveStreams();

    res.json({
      success: true,
      streams: activeStreams.map(stream => ({
        id: stream.id,
        sessionId: stream.sessionId,
        status: stream.status,
        createdAt: stream.createdAt,
        startedAt: stream.startedAt
      })),
      count: activeStreams.length
    });

  } catch (error) {
    console.error('[D-ID Streaming API] Get active streams error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active streams',
      error: error.message
    });
  }
});

// @route   POST /api/did-streaming/cleanup
// @desc    Cleanup old D-ID streams
// @access  Private
router.post('/cleanup', auth, async (req, res) => {
  try {
    const { maxAgeMinutes = 30 } = req.body;

    console.log(`[D-ID Streaming API] Cleaning up streams older than ${maxAgeMinutes} minutes`);

    didStreamingService.cleanupOldStreams(maxAgeMinutes);

    res.json({
      success: true,
      message: 'Stream cleanup completed'
    });

  } catch (error) {
    console.error('[D-ID Streaming API] Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup streams',
      error: error.message
    });
  }
});

// @route   GET /api/did-streaming/status
// @desc    Get D-ID streaming service status
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    const activeStreams = didStreamingService.getActiveStreams();

    res.json({
      success: true,
      status: {
        service: 'D-ID Talks Streaming + Gemini 2.5 Flash',
        version: '1.0.0',
        activeStreams: activeStreams.length,
        features: [
          'Real-time avatar streaming',
          'Gemini 2.5 Flash integration',
          'Patron memory and preferences',
          'Real-time beverage inventory',
          'Professional bartending intelligence',
          'Voice synthesis with Microsoft Neural',
          'WebRTC streaming',
          'Session management'
        ],
        models: {
          efficient: 'gemini-2.5-flash-lite',
          standard: 'gemini-2.5-flash',
          advanced: 'gemini-2.5-pro'
        },
        voice: {
          provider: 'microsoft',
          voice_id: 'en-US-JennyMultilingualV2Neural',
          style: 'Cheerful'
        },
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[D-ID Streaming API] Status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service status',
      error: error.message
    });
  }
});

module.exports = router;
