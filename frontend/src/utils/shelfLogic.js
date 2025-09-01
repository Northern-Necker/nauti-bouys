/**
 * Shelf Logic Utility - Frontend logic for spirits shelf system
 * Handles shelf tier logic, authorization flow, and conversation integration
 */

import spiritsService from '../services/spiritsService';

/**
 * Shelf tier hierarchy and permissions
 */
export const SHELF_TIERS = {
  WELL: 'well',
  CALL: 'call', 
  TOP: 'top',
  ULTRA: 'ultra'
};

export const SHELF_HIERARCHY = [
  SHELF_TIERS.WELL,
  SHELF_TIERS.CALL,
  SHELF_TIERS.TOP,
  SHELF_TIERS.ULTRA
];

/**
 * Get shelf tier level for comparison
 */
export const getShelfLevel = (tier) => {
  return SHELF_HIERARCHY.indexOf(tier);
};

/**
 * Check if one shelf tier is higher than another
 */
export const isHigherShelf = (tier1, tier2) => {
  return getShelfLevel(tier1) > getShelfLevel(tier2);
};

/**
 * Get the highest accessible shelf tier for a user
 */
export const getMaxAccessibleShelf = (userAuthorization) => {
  return userAuthorization?.ultraShelfAccess ? SHELF_TIERS.ULTRA : SHELF_TIERS.TOP;
};

/**
 * Filter spirits by user's maximum accessible shelf
 */
export const filterAccessibleSpirits = (spirits, userAuthorization) => {
  const maxShelf = getMaxAccessibleShelf(userAuthorization);
  const maxLevel = getShelfLevel(maxShelf);
  
  return spirits.filter(spirit => {
    const spiritLevel = getShelfLevel(spirit.shelf || SHELF_TIERS.WELL);
    return spiritLevel <= maxLevel;
  });
};

/**
 * Get conversation context for shelf restrictions
 */
export const getShelfConversationContext = (spirit, userAuthorization) => {
  const shelfInfo = spiritsService.getShelfTierInfo(spirit.shelf);
  const canAccess = spiritsService.canAccessSpirit(spirit, userAuthorization);
  
  return {
    spirit,
    shelfInfo,
    canAccess,
    requiresRequest: spirit.shelf === SHELF_TIERS.ULTRA && !canAccess,
    isRestricted: spirit.shelf === SHELF_TIERS.ULTRA,
    explanationNeeded: spirit.shelf === SHELF_TIERS.ULTRA && !canAccess
  };
};

/**
 * Generate Savannah's response for shelf-restricted spirits
 */
export const generateShelfExplanation = (spirit, alternatives = []) => {
  const responses = [
    `Ahoy there! That ${spirit.name} be locked away in me ultra shelf - the captain's special reserve. ` +
    `I'd need the owner's blessing to serve ye that treasure. But fear not! I've got some magnificent ` +
    `alternatives that'll warm yer heart just as well.`,
    
    `Arr, ye've got fine taste! That ${spirit.name} be one of our most prized possessions, ` +
    `stored in the ultra shelf for special occasions. Let me ask the captain for permission, ` +
    `or perhaps I can interest ye in something equally spectacular from our top shelf?`,
    
    `Well, blow me down! Ye've spotted one of our crown jewels. That ${spirit.name} requires ` +
    `the owner's special authorization - it's that rare and precious. While I send word to ` +
    `the captain, how about I recommend some other treasures that'll suit ye perfectly?`
  ];
  
  const baseResponse = responses[Math.floor(Math.random() * responses.length)];
  
  if (alternatives.length > 0) {
    const altNames = alternatives.slice(0, 2).map(alt => alt.name).join(' or ');
    return `${baseResponse} Might I suggest the ${altNames}? They're both excellent choices that'll give ye a taste of the seas!`;
  }
  
  return baseResponse;
};

/**
 * Generate request message for ultra shelf access
 */
export const generateUltraRequestMessage = (spirit, userContext = {}) => {
  const { userName = 'patron', occasion = '', preference = '' } = userContext;
  
  return `${userName} has requested access to ${spirit.name} from the ultra shelf. ` +
    `${occasion ? `Occasion: ${occasion}. ` : ''}` +
    `${preference ? `Preference: ${preference}. ` : ''}` +
    `Request submitted at ${new Date().toLocaleString()}.`;
};

/**
 * Get visual indicators for shelf tiers
 */
export const getShelfVisualIndicators = (tier) => {
  const indicators = {
    [SHELF_TIERS.WELL]: {
      badge: 'Well',
      color: '#8B4513',
      bgColor: '#F5E6D3',
      icon: '🥃',
      border: 'border-amber-200'
    },
    [SHELF_TIERS.CALL]: {
      badge: 'Call',
      color: '#D2691E',
      bgColor: '#FFF3E0',
      icon: '🥃',
      border: 'border-orange-200'
    },
    [SHELF_TIERS.TOP]: {
      badge: 'Top',
      color: '#FFD700',
      bgColor: '#FFFBF0',
      icon: '⭐',
      border: 'border-yellow-200'
    },
    [SHELF_TIERS.ULTRA]: {
      badge: 'Ultra',
      color: '#9400D3',
      bgColor: '#F3E8FF',
      icon: '💎',
      border: 'border-purple-200'
    }
  };
  
  return indicators[tier] || indicators[SHELF_TIERS.WELL];
};

/**
 * Get notification content for ultra shelf requests
 */
export const getRequestNotificationContent = (requestData, isOwner = false) => {
  if (isOwner) {
    return {
      title: 'Ultra Shelf Request',
      message: `${requestData.userName || 'A patron'} is requesting ${requestData.spiritName}`,
      type: 'info',
      actions: ['approve', 'deny'],
      priority: 'high'
    };
  } else {
    const statusMessages = {
      pending: {
        title: 'Request Submitted',
        message: `Your request for ${requestData.spiritName} has been sent to the captain`,
        type: 'info'
      },
      approved: {
        title: 'Request Approved! 🎉',
        message: `The captain has granted access to ${requestData.spiritName}`,
        type: 'success'
      },
      denied: {
        title: 'Request Not Approved',
        message: `The captain has respectfully declined your request for ${requestData.spiritName}`,
        type: 'warning'
      }
    };
    
    return statusMessages[requestData.status] || statusMessages.pending;
  }
};

/**
 * Handle ultra shelf request workflow
 */
export const initiateUltraShelfRequest = async (spirit, userId, userContext = {}) => {
  try {
    const message = generateUltraRequestMessage(spirit, userContext);
    const result = await spiritsService.requestUltraShelfAccess(userId, spirit.id, message);
    
    return {
      success: true,
      requestId: result.requestId,
      message: `Your request for ${spirit.name} has been sent to the captain. I'll let ye know as soon as I hear back!`,
      explanation: generateShelfExplanation(spirit)
    };
  } catch (error) {
    console.error('Error initiating ultra shelf request:', error);
    return {
      success: false,
      error: error.message,
      message: `Arr, seems there be rough seas ahead! I'm having trouble reaching the captain right now. Perhaps try again in a moment?`
    };
  }
};

/**
 * Get smart recommendations based on shelf availability
 */
export const getSmartRecommendations = async (preferences, userAuthorization, userId) => {
  try {
    const maxShelf = getMaxAccessibleShelf(userAuthorization);
    const recommendations = await spiritsService.getRecommendations(userId, preferences, maxShelf);
    
    // Filter and categorize by shelf
    const categorized = {
      available: [],
      restricted: []
    };
    
    recommendations.forEach(spirit => {
      const canAccess = spiritsService.canAccessSpirit(spirit, userAuthorization);
      if (canAccess) {
        categorized.available.push(spirit);
      } else {
        categorized.restricted.push(spirit);
      }
    });
    
    return categorized;
  } catch (error) {
    console.error('Error getting smart recommendations:', error);
    return { available: [], restricted: [] };
  }
};

/**
 * Format conversation context for IA integration
 */
export const formatShelfContextForIA = (spirits, userAuthorization) => {
  const accessible = filterAccessibleSpirits(spirits, userAuthorization);
  const restricted = spirits.filter(spirit => !spiritsService.canAccessSpirit(spirit, userAuthorization));
  
  return {
    totalSpirits: spirits.length,
    accessibleCount: accessible.length,
    restrictedCount: restricted.length,
    hasUltraAccess: userAuthorization?.ultraShelfAccess || false,
    maxAccessibleShelf: getMaxAccessibleShelf(userAuthorization),
    shelfBreakdown: {
      well: spirits.filter(s => s.shelf === SHELF_TIERS.WELL).length,
      call: spirits.filter(s => s.shelf === SHELF_TIERS.CALL).length,
      top: spirits.filter(s => s.shelf === SHELF_TIERS.TOP).length,
      ultra: spirits.filter(s => s.shelf === SHELF_TIERS.ULTRA).length
    }
  };
};

export default {
  SHELF_TIERS,
  SHELF_HIERARCHY,
  getShelfLevel,
  isHigherShelf,
  getMaxAccessibleShelf,
  filterAccessibleSpirits,
  getShelfConversationContext,
  generateShelfExplanation,
  generateUltraRequestMessage,
  getShelfVisualIndicators,
  getRequestNotificationContent,
  initiateUltraShelfRequest,
  getSmartRecommendations,
  formatShelfContextForIA
};