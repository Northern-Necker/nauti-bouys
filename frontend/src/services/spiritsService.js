/**
 * Spirits Service - API integration for shelf system and spirit management
 * Handles shelf tiers, authorization requests, and spirit recommendations
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class SpiritsService {
  /**
   * Get all spirits with shelf tier information
   */
  async getSpirits(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE}/spirits${queryParams ? `?${queryParams}` : ''}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch spirits: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching spirits:', error);
      throw error;
    }
  }

  /**
   * Get spirits filtered by shelf tier
   */
  async getSpiritsByShelf(shelfTier) {
    return this.getSpirits({ shelf: shelfTier });
  }

  /**
   * Get available spirits for the user's current authorization level
   */
  async getAvailableSpirits(userId) {
    try {
      const response = await fetch(`${API_BASE}/spirits/available/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch available spirits: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching available spirits:', error);
      throw error;
    }
  }

  /**
   * Request access to ultra shelf spirits
   */
  async requestUltraShelfAccess(userId, spiritId, message = '') {
    try {
      const response = await fetch(`${API_BASE}/spirits/request-ultra-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          spiritId,
          message,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to request ultra shelf access: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error requesting ultra shelf access:', error);
      throw error;
    }
  }

  /**
   * Get user's current authorization status
   */
  async getUserAuthorization(userId) {
    try {
      const response = await fetch(`${API_BASE}/spirits/authorization/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user authorization: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user authorization:', error);
      throw error;
    }
  }

  /**
   * Get pending ultra shelf requests (owner only)
   */
  async getPendingRequests() {
    try {
      const response = await fetch(`${API_BASE}/spirits/pending-requests`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pending requests: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      throw error;
    }
  }

  /**
   * Approve or deny ultra shelf request (owner only)
   */
  async processUltraRequest(requestId, action, message = '') {
    try {
      const response = await fetch(`${API_BASE}/spirits/process-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action, // 'approve' or 'deny'
          message,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to process request: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing request:', error);
      throw error;
    }
  }

  /**
   * Get spirit recommendations based on shelf tier and preferences
   */
  async getRecommendations(userId, preferences = {}, maxShelfTier = 'top') {
    try {
      const response = await fetch(`${API_BASE}/spirits/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          preferences,
          maxShelfTier
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get recommendations: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }

  /**
   * Get alternative spirits when ultra shelf is not available
   */
  async getAlternatives(spiritId, userId) {
    try {
      const response = await fetch(`${API_BASE}/spirits/alternatives/${spiritId}/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get alternatives: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting alternatives:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates for ultra shelf requests
   */
  subscribeToRequestUpdates(callback) {
    const eventSource = new EventSource(`${API_BASE}/spirits/request-updates`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
    };

    return () => eventSource.close();
  }

  /**
   * Get shelf tier display information
   */
  getShelfTierInfo(tier) {
    const shelfInfo = {
      well: {
        name: 'Well Shelf',
        description: 'House spirits for everyday enjoyment',
        icon: '🥃',
        color: '#8B4513',
        accessibility: 'always'
      },
      call: {
        name: 'Call Shelf',
        description: 'Premium brands for discerning tastes',
        icon: '🥃',
        color: '#D2691E',
        accessibility: 'always'
      },
      top: {
        name: 'Top Shelf',
        description: 'Exceptional spirits for special occasions',
        icon: '🥃',
        color: '#FFD700',
        accessibility: 'always'
      },
      ultra: {
        name: 'Ultra Shelf',
        description: 'Rare and exclusive spirits requiring special authorization',
        icon: '💎',
        color: '#9400D3',
        accessibility: 'restricted'
      }
    };

    return shelfInfo[tier] || shelfInfo.well;
  }

  /**
   * Format spirit display with shelf tier information
   */
  formatSpiritWithShelf(spirit) {
    const shelfInfo = this.getShelfTierInfo(spirit.shelf);
    
    return {
      ...spirit,
      shelfInfo,
      displayName: `${spirit.name} ${shelfInfo.icon}`,
      isRestricted: spirit.shelf === 'ultra',
      requiresAuthorization: spirit.shelf === 'ultra'
    };
  }

  /**
   * Check if user can access spirit based on shelf tier
   */
  canAccessSpirit(spirit, userAuthorization) {
    if (!spirit.shelf || spirit.shelf !== 'ultra') {
      return true; // Well, call, and top shelf are always accessible
    }

    return userAuthorization?.ultraShelfAccess || false;
  }
}

export default new SpiritsService();