const mongoose = require('mongoose');

// In-memory storage for authorization sessions
// In production, this should be stored in Redis or database
const authorizationSessions = new Map();

// Authorization schema for tracking ultra shelf approvals
const authorizationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  spiritId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Spirit',
    required: true
  },
  patronName: {
    type: String,
    required: true
  },
  authorizedBy: {
    type: String,
    default: 'owner'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  authorizedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default 2-hour expiration
      return new Date(Date.now() + 2 * 60 * 60 * 1000);
    }
  },
  notes: String
}, {
  timestamps: true
});

const SpiritAuthorization = mongoose.model('SpiritAuthorization', authorizationSchema);

class SpiritsAuthService {
  
  /**
   * Check if a patron is authorized for a specific ultra shelf spirit
   * @param {string} sessionId - Patron session ID
   * @param {string} spiritId - Spirit ID to check authorization for
   * @returns {Promise<boolean>} Authorization status
   */
  async isAuthorizedForSpirit(sessionId, spiritId) {
    try {
      const authorization = await SpiritAuthorization.findOne({
        sessionId,
        spiritId,
        status: 'approved',
        expiresAt: { $gt: new Date() }
      });
      
      return !!authorization;
    } catch (error) {
      console.error('Error checking spirit authorization:', error);
      return false;
    }
  }

  /**
   * Request authorization for an ultra shelf spirit
   * @param {string} sessionId - Patron session ID
   * @param {string} spiritId - Spirit ID requesting authorization for
   * @param {string} patronName - Name of the patron making the request
   * @returns {Promise<object>} Request result
   */
  async requestUltraShelfAuthorization(sessionId, spiritId, patronName) {
    try {
      // Check if there's already a pending or approved request
      const existingAuth = await SpiritAuthorization.findOne({
        sessionId,
        spiritId,
        status: { $in: ['pending', 'approved'] },
        expiresAt: { $gt: new Date() }
      });

      if (existingAuth) {
        return {
          success: false,
          message: existingAuth.status === 'approved' 
            ? 'Already authorized for this spirit'
            : 'Authorization request already pending',
          authorization: existingAuth
        };
      }

      // Create new authorization request
      const authorization = new SpiritAuthorization({
        sessionId,
        spiritId,
        patronName,
        status: 'pending'
      });

      await authorization.save();

      return {
        success: true,
        message: 'Authorization request submitted to owner',
        authorization,
        requestId: authorization._id
      };
    } catch (error) {
      console.error('Error requesting ultra shelf authorization:', error);
      return {
        success: false,
        message: 'Failed to submit authorization request'
      };
    }
  }

  /**
   * Authorize a specific ultra shelf spirit request
   * @param {string} requestId - Authorization request ID
   * @param {boolean} approved - Whether to approve or deny
   * @param {string} notes - Optional notes from owner
   * @returns {Promise<object>} Authorization result
   */
  async authorizeUltraShelfRequest(requestId, approved, notes = '') {
    try {
      const authorization = await SpiritAuthorization.findById(requestId);
      
      if (!authorization) {
        return {
          success: false,
          message: 'Authorization request not found'
        };
      }

      if (authorization.status !== 'pending') {
        return {
          success: false,
          message: 'Authorization request already processed'
        };
      }

      authorization.status = approved ? 'approved' : 'denied';
      authorization.authorizedAt = new Date();
      authorization.notes = notes;

      // If approved, extend expiration time
      if (approved) {
        authorization.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
      }

      await authorization.save();

      return {
        success: true,
        message: `Request ${approved ? 'approved' : 'denied'} successfully`,
        authorization
      };
    } catch (error) {
      console.error('Error authorizing ultra shelf request:', error);
      return {
        success: false,
        message: 'Failed to process authorization'
      };
    }
  }

  /**
   * Get all current authorizations for a session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Array>} List of active authorizations
   */
  async getSessionAuthorizations(sessionId) {
    try {
      const authorizations = await SpiritAuthorization.find({
        sessionId,
        status: 'approved',
        expiresAt: { $gt: new Date() }
      }).populate('spiritId', 'name brand shelf_tier');

      return authorizations;
    } catch (error) {
      console.error('Error fetching session authorizations:', error);
      return [];
    }
  }

  /**
   * Get pending authorization requests for owner review
   * @returns {Promise<Array>} List of pending requests
   */
  async getPendingRequests() {
    try {
      const pendingRequests = await SpiritAuthorization.find({
        status: 'pending',
        expiresAt: { $gt: new Date() }
      }).populate('spiritId', 'name brand type shelf_tier image')
        .sort({ requestedAt: -1 });

      return pendingRequests;
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      return [];
    }
  }

  /**
   * Clean up expired authorizations
   * @returns {Promise<number>} Number of cleaned up records
   */
  async cleanupExpiredAuthorizations() {
    try {
      const result = await SpiritAuthorization.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired authorizations:', error);
      return 0;
    }
  }

  /**
   * Get authorization statistics
   * @returns {Promise<object>} Authorization statistics
   */
  async getAuthorizationStats() {
    try {
      const stats = await SpiritAuthorization.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        pending: 0,
        approved: 0,
        denied: 0,
        total: 0
      };

      stats.forEach(stat => {
        result[stat._id] = stat.count;
        result.total += stat.count;
      });

      return result;
    } catch (error) {
      console.error('Error fetching authorization stats:', error);
      return { pending: 0, approved: 0, denied: 0, total: 0 };
    }
  }

  /**
   * Revoke authorization for a specific spirit
   * @param {string} sessionId - Session ID
   * @param {string} spiritId - Spirit ID to revoke
   * @returns {Promise<boolean>} Success status
   */
  async revokeAuthorization(sessionId, spiritId) {
    try {
      const result = await SpiritAuthorization.updateMany({
        sessionId,
        spiritId,
        status: 'approved'
      }, {
        status: 'denied',
        authorizedAt: new Date(),
        notes: 'Authorization revoked'
      });

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error revoking authorization:', error);
      return false;
    }
  }
}

module.exports = new SpiritsAuthService();