const express = require('express');
const router = express.Router();
const Spirit = require('../models/Spirit');
const spiritsAuthService = require('../services/spiritsAuthService');
const { createUltraShelfRequestNotification } = require('./ownerNotifications');
const { auth } = require('../middleware/auth');

/**
 * @route GET /api/spirits
 * @desc Get all spirits with optional filtering
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      subType, 
      shelf_tier, 
      mixing_appropriate,
      search, 
      sort = 'name',
      limit = 50,
      page = 1 
    } = req.query;

    // Build filter object
    const filter = { isAvailable: true };
    
    if (type) filter.type = type;
    if (subType) filter.subType = subType;
    if (shelf_tier) filter.shelf_tier = shelf_tier;
    if (mixing_appropriate !== undefined) {
      filter.mixing_appropriate = mixing_appropriate === 'true';
    }

    // Search functionality
    if (search) {
      filter.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'name':
        sortObj = { name: 1 };
        break;
      case 'rating':
        sortObj = { averageRating: -1 };
        break;
      case 'shelf_tier':
        sortObj = { shelf_tier: 1, name: 1 };
        break;
      default:
        sortObj = { name: 1 };
    }

    const spirits = await Spirit.find(filter)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(skip)
      .select('-ratings'); // Exclude detailed ratings for performance

    const total = await Spirit.countDocuments(filter);

    res.json({
      spirits,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: spirits.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Error fetching spirits:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/spirits/by-shelf/:tier
 * @desc Get spirits by shelf tier
 * @access Public
 */
router.get('/by-shelf/:tier', async (req, res) => {
  try {
    const { tier } = req.params;
    const { mixing_appropriate, type, limit = 50 } = req.query;

    // Validate shelf tier
    if (!['lower', 'top', 'ultra'].includes(tier)) {
      return res.status(400).json({ message: 'Invalid shelf tier' });
    }

    const filter = { 
      shelf_tier: tier,
      isAvailable: true 
    };

    if (mixing_appropriate !== undefined) {
      filter.mixing_appropriate = mixing_appropriate === 'true';
    }

    if (type) {
      filter.type = type;
    }

    const spirits = await Spirit.find(filter)
      .sort({ name: 1 })
      .limit(parseInt(limit))
      .select('-ratings');

    res.json({
      shelf_tier: tier,
      count: spirits.length,
      spirits
    });
  } catch (error) {
    console.error('Error fetching spirits by shelf:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/spirits/request-ultra
 * @desc Request authorization for ultra shelf spirit
 * @access Public (but requires session tracking)
 */
router.post('/request-ultra', async (req, res) => {
  try {
    const { spiritId, patronName, sessionId } = req.body;

    // Validate required fields
    if (!spiritId || !patronName || !sessionId) {
      return res.status(400).json({ 
        message: 'Spirit ID, patron name, and session ID are required' 
      });
    }

    // Verify spirit exists and is ultra shelf
    const spirit = await Spirit.findById(spiritId);
    if (!spirit) {
      return res.status(404).json({ message: 'Spirit not found' });
    }

    if (spirit.shelf_tier !== 'ultra') {
      return res.status(400).json({ 
        message: 'Authorization only required for ultra shelf spirits' 
      });
    }

    // Request authorization
    const result = await spiritsAuthService.requestUltraShelfAuthorization(
      sessionId, 
      spiritId, 
      patronName
    );

    if (result.success) {
      // Create notification for owner
      createUltraShelfRequestNotification(result.authorization, spirit);
      
      res.status(201).json({
        message: result.message,
        requestId: result.requestId,
        spirit: {
          name: spirit.name,
          brand: spirit.brand,
          type: spirit.type
        }
      });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error('Error requesting ultra shelf authorization:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/spirits/authorize-ultra
 * @desc Owner authorizes ultra shelf spirit request
 * @access Private (Owner only)
 */
router.post('/authorize-ultra', auth, async (req, res) => {
  try {
    const { requestId, approved, notes } = req.body;

    // Validate required fields
    if (!requestId || typeof approved !== 'boolean') {
      return res.status(400).json({ 
        message: 'Request ID and approval status are required' 
      });
    }

    // TODO: Add owner role check
    // if (req.user.role !== 'owner') {
    //   return res.status(403).json({ message: 'Owner access required' });
    // }

    const result = await spiritsAuthService.authorizeUltraShelfRequest(
      requestId, 
      approved, 
      notes
    );

    if (result.success) {
      res.json({
        message: result.message,
        authorization: result.authorization
      });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error('Error authorizing ultra shelf request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/spirits/authorizations
 * @desc Get current authorizations for session
 * @access Public
 */
router.get('/authorizations', async (req, res) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    const authorizations = await spiritsAuthService.getSessionAuthorizations(sessionId);

    res.json({
      sessionId,
      count: authorizations.length,
      authorizations: authorizations.map(auth => ({
        id: auth._id,
        spirit: auth.spiritId,
        authorizedAt: auth.authorizedAt,
        expiresAt: auth.expiresAt,
        notes: auth.notes
      }))
    });
  } catch (error) {
    console.error('Error fetching authorizations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/spirits/pending-requests
 * @desc Get pending ultra shelf requests for owner review
 * @access Private (Owner only)
 */
router.get('/pending-requests', auth, async (req, res) => {
  try {
    // TODO: Add owner role check
    // if (req.user.role !== 'owner') {
    //   return res.status(403).json({ message: 'Owner access required' });
    // }

    const pendingRequests = await spiritsAuthService.getPendingRequests();

    res.json({
      count: pendingRequests.length,
      requests: pendingRequests.map(request => ({
        id: request._id,
        patronName: request.patronName,
        sessionId: request.sessionId,
        spirit: request.spiritId,
        requestedAt: request.requestedAt,
        expiresAt: request.expiresAt
      }))
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/spirits/:id
 * @desc Get single spirit by ID
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const spirit = await Spirit.findById(req.params.id);
    
    if (!spirit) {
      return res.status(404).json({ message: 'Spirit not found' });
    }

    res.json(spirit);
  } catch (error) {
    console.error('Error fetching spirit:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid spirit ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/spirits/check-authorization/:sessionId/:spiritId
 * @desc Check if session is authorized for specific spirit
 * @access Public
 */
router.get('/check-authorization/:sessionId/:spiritId', async (req, res) => {
  try {
    const { sessionId, spiritId } = req.params;

    const isAuthorized = await spiritsAuthService.isAuthorizedForSpirit(
      sessionId, 
      spiritId
    );

    res.json({
      sessionId,
      spiritId,
      authorized: isAuthorized
    });
  } catch (error) {
    console.error('Error checking authorization:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route DELETE /api/spirits/revoke-authorization
 * @desc Revoke authorization for a specific spirit
 * @access Private (Owner only)
 */
router.delete('/revoke-authorization', auth, async (req, res) => {
  try {
    const { sessionId, spiritId } = req.body;

    if (!sessionId || !spiritId) {
      return res.status(400).json({ 
        message: 'Session ID and spirit ID are required' 
      });
    }

    // TODO: Add owner role check
    // if (req.user.role !== 'owner') {
    //   return res.status(403).json({ message: 'Owner access required' });
    // }

    const revoked = await spiritsAuthService.revokeAuthorization(sessionId, spiritId);

    if (revoked) {
      res.json({ message: 'Authorization revoked successfully' });
    } else {
      res.status(404).json({ message: 'No active authorization found' });
    }
  } catch (error) {
    console.error('Error revoking authorization:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/spirits/stats/authorizations
 * @desc Get authorization statistics
 * @access Private (Owner only)
 */
router.get('/stats/authorizations', auth, async (req, res) => {
  try {
    // TODO: Add owner role check
    // if (req.user.role !== 'owner') {
    //   return res.status(403).json({ message: 'Owner access required' });
    // }

    const stats = await spiritsAuthService.getAuthorizationStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching authorization stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
