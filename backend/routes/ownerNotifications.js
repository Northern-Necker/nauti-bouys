const express = require('express');
const router = express.Router();
const spiritsAuthService = require('../services/spiritsAuthService');
const { auth } = require('../middleware/auth');

// In-memory notification system for demonstration
// In production, use WebSockets, SSE, or external notification service
class NotificationManager {
  constructor() {
    this.notifications = [];
    this.subscribers = new Set();
  }

  addNotification(notification) {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
      ...notification
    };
    
    this.notifications.unshift(newNotification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // Notify subscribers
    this.notifySubscribers(newNotification);
    
    return newNotification;
  }

  notifySubscribers(notification) {
    this.subscribers.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  getNotifications(limit = 20, unreadOnly = false) {
    let filtered = this.notifications;
    
    if (unreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }
    
    return filtered.slice(0, limit);
  }

  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    return this.notifications.length;
  }

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }
}

const notificationManager = new NotificationManager();

/**
 * @route GET /api/owner-notifications
 * @desc Get owner notifications
 * @access Private (Owner only)
 */
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 20, unreadOnly = false } = req.query;

    // TODO: Add owner role check
    // if (req.user.role !== 'owner') {
    //   return res.status(403).json({ message: 'Owner access required' });
    // }

    const notifications = notificationManager.getNotifications(
      parseInt(limit), 
      unreadOnly === 'true'
    );

    const unreadCount = notificationManager.getUnreadCount();

    res.json({
      notifications,
      unreadCount,
      total: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/owner-notifications/mark-read/:id
 * @desc Mark notification as read
 * @access Private (Owner only)
 */
router.post('/mark-read/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Add owner role check
    // if (req.user.role !== 'owner') {
    //   return res.status(403).json({ message: 'Owner access required' });
    // }

    const marked = notificationManager.markAsRead(id);

    if (marked) {
      res.json({ message: 'Notification marked as read' });
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/owner-notifications/mark-all-read
 * @desc Mark all notifications as read
 * @access Private (Owner only)
 */
router.post('/mark-all-read', auth, async (req, res) => {
  try {
    // TODO: Add owner role check
    // if (req.user.role !== 'owner') {
    //   return res.status(403).json({ message: 'Owner access required' });
    // }

    const count = notificationManager.markAllAsRead();

    res.json({ 
      message: 'All notifications marked as read',
      count 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/owner-notifications/unread-count
 * @desc Get unread notification count
 * @access Private (Owner only)
 */
router.get('/unread-count', auth, async (req, res) => {
  try {
    // TODO: Add owner role check
    // if (req.user.role !== 'owner') {
    //   return res.status(403).json({ message: 'Owner access required' });
    // }

    const unreadCount = notificationManager.getUnreadCount();

    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/owner-notifications/pending-requests
 * @desc Get pending ultra shelf requests with notification context
 * @access Private (Owner only)
 */
router.get('/pending-requests', auth, async (req, res) => {
  try {
    // TODO: Add owner role check
    // if (req.user.role !== 'owner') {
    //   return res.status(403).json({ message: 'Owner access required' });
    // }

    const pendingRequests = await spiritsAuthService.getPendingRequests();

    // Format for owner notification display
    const formattedRequests = pendingRequests.map(request => ({
      id: request._id,
      type: 'ultra_shelf_request',
      title: `Ultra Shelf Request: ${request.spiritId.name}`,
      message: `${request.patronName} has requested access to ${request.spiritId.brand} ${request.spiritId.name}`,
      patronName: request.patronName,
      sessionId: request.sessionId,
      spirit: {
        id: request.spiritId._id,
        name: request.spiritId.name,
        brand: request.spiritId.brand,
        type: request.spiritId.type,
        image: request.spiritId.image
      },
      requestedAt: request.requestedAt,
      expiresAt: request.expiresAt,
      priority: 'high'
    }));

    res.json({
      requests: formattedRequests,
      count: formattedRequests.length
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/owner-notifications/respond-to-request
 * @desc Respond to ultra shelf request with notification
 * @access Private (Owner only)
 */
router.post('/respond-to-request', auth, async (req, res) => {
  try {
    const { requestId, approved, notes } = req.body;

    if (!requestId || typeof approved !== 'boolean') {
      return res.status(400).json({ 
        message: 'Request ID and approval status are required' 
      });
    }

    // TODO: Add owner role check
    // if (req.user.role !== 'owner') {
    //   return res.status(403).json({ message: 'Owner access required' });
    // }

    // Process the authorization
    const result = await spiritsAuthService.authorizeUltraShelfRequest(
      requestId, 
      approved, 
      notes
    );

    if (result.success) {
      // Create a notification about the response
      const notification = notificationManager.addNotification({
        type: 'ultra_shelf_response',
        title: `Ultra Shelf Request ${approved ? 'Approved' : 'Denied'}`,
        message: `Request for ${result.authorization.spiritId} has been ${approved ? 'approved' : 'denied'}`,
        priority: 'medium',
        data: {
          requestId,
          approved,
          notes,
          authorization: result.authorization
        }
      });

      res.json({
        message: result.message,
        authorization: result.authorization,
        notification
      });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error('Error responding to request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Helper function to create ultra shelf request notification
 * This should be called when a new ultra shelf request is made
 */
function createUltraShelfRequestNotification(request, spirit) {
  return notificationManager.addNotification({
    type: 'ultra_shelf_request',
    title: `New Ultra Shelf Request`,
    message: `${request.patronName} has requested access to ${spirit.brand} ${spirit.name}`,
    priority: 'high',
    data: {
      requestId: request._id,
      patronName: request.patronName,
      sessionId: request.sessionId,
      spirit: {
        id: spirit._id,
        name: spirit.name,
        brand: spirit.brand,
        type: spirit.type,
        image: spirit.image
      }
    }
  });
}

/**
 * @route GET /api/owner-notifications/sse
 * @desc Server-Sent Events endpoint for real-time notifications
 * @access Private (Owner only)
 */
router.get('/sse', auth, (req, res) => {
  // TODO: Add owner role check
  // if (req.user.role !== 'owner') {
  //   return res.status(403).json({ message: 'Owner access required' });
  // }

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to notifications' })}\n\n`);

  // Subscribe to notifications
  const unsubscribe = notificationManager.subscribe((notification) => {
    res.write(`data: ${JSON.stringify(notification)}\n\n`);
  });

  // Handle client disconnect
  req.on('close', () => {
    unsubscribe();
  });

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: new Date() })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

// Export notification manager for use in other routes
router.notificationManager = notificationManager;
router.createUltraShelfRequestNotification = createUltraShelfRequestNotification;

module.exports = router;
