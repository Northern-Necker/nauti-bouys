/**
 * Avatar Management Utilities
 * Centralized system for managing multiple avatars, their configurations, and assets
 */

// Default avatar configurations
const DEFAULT_AVATARS = {
  savannah: {
    id: 'savannah',
    name: 'Savannah',
    modelPath: '/assets/SavannahAvatar.glb',
    role: 'Expert Bartender',
    status: 'active', // active, coming_soon, maintenance
    personality: {
      traits: ['Friendly', 'Knowledgeable', 'Professional', 'Enthusiastic'],
      specialties: ['Cocktails', 'Spirits', 'Wine Pairings', 'Bar Techniques'],
      greeting: "Hi there! I'm Savannah, your expert bartender. How can I help you craft the perfect drink today?",
      voice: {
        pitch: 1.0,
        rate: 1.0,
        volume: 0.8,
        voiceURI: null // Can specify specific voice
      },
      conversationStyle: {
        formality: 'casual-professional',
        enthusiasm: 'high',
        expertise: 'bartending',
        responseLength: 'medium'
      }
    },
    appearance: {
      thumbnail: '/assets/thumbnails/savannah-thumb.jpg',
      description: 'Professional bartender with expertise in craft cocktails',
      tags: ['bartender', 'cocktails', 'friendly', 'professional']
    },
    capabilities: {
      lipSync: true,
      voiceRecognition: true,
      textToSpeech: true,
      emotionalExpressions: true,
      gestureSupport: true // Professional bartender gestures enabled
    },
    gestures: {
      enabled: true,
      categories: {
        greeting: ['handup', 'namaste'],
        pointing: ['index', 'side'],
        approval: ['thumbup', 'ok'],
        disapproval: ['thumbdown', 'shrug'],
        service: ['handup', 'side', 'ok'],
        explanation: ['index', 'side', 'handup']
      },
      bartenderMappings: {
        welcome: 'handup',
        recommend: 'index',
        approve: 'thumbup',
        explain: 'side',
        confused: 'shrug',
        perfect: 'ok',
        greeting: 'namaste',
        disapprove: 'thumbdown'
      },
      timing: {
        defaultDuration: 2.5,
        shortGesture: 1.5,
        longGesture: 4.0,
        transitionTime: 500
      }
    },
    metadata: {
      created: '2024-01-01',
      version: '1.0.0',
      author: 'Nauti-Bouys Team',
      morphTargets: 172
    }
  },
  
  marcus: {
    id: 'marcus',
    name: 'Marcus',
    modelPath: '/assets/MarcusAvatar.glb',
    role: 'Sommelier',
    status: 'coming_soon',
    personality: {
      traits: ['Sophisticated', 'Knowledgeable', 'Refined', 'Passionate'],
      specialties: ['Wine Selection', 'Food Pairings', 'Vintage Knowledge', 'Tasting Notes'],
      greeting: "Good evening! I'm Marcus, your sommelier. Let me help you discover the perfect wine for your occasion.",
      voice: {
        pitch: 0.8,
        rate: 0.9,
        volume: 0.7,
        voiceURI: null
      },
      conversationStyle: {
        formality: 'formal-professional',
        enthusiasm: 'moderate',
        expertise: 'wine',
        responseLength: 'detailed'
      }
    },
    appearance: {
      thumbnail: '/assets/thumbnails/marcus-thumb.jpg',
      description: 'Sophisticated sommelier specializing in wine selection',
      tags: ['sommelier', 'wine', 'sophisticated', 'knowledgeable']
    },
    capabilities: {
      lipSync: true,
      voiceRecognition: true,
      textToSpeech: true,
      emotionalExpressions: true,
      gestureSupport: false
    },
    metadata: {
      created: '2024-02-01',
      version: '1.0.0',
      author: 'Nauti-Bouys Team',
      morphTargets: 172
    }
  },
  
  luna: {
    id: 'luna',
    name: 'Luna',
    modelPath: '/assets/LunaAvatar.glb',
    role: 'Mixology Artist',
    status: 'coming_soon',
    personality: {
      traits: ['Creative', 'Innovative', 'Energetic', 'Artistic'],
      specialties: ['Molecular Mixology', 'Creative Cocktails', 'Presentation', 'Innovation'],
      greeting: "Hey! I'm Luna, and I love creating amazing cocktail experiences. Ready to try something extraordinary?",
      voice: {
        pitch: 1.2,
        rate: 1.1,
        volume: 0.9,
        voiceURI: null
      },
      conversationStyle: {
        formality: 'casual',
        enthusiasm: 'very-high',
        expertise: 'mixology',
        responseLength: 'short-medium'
      }
    },
    appearance: {
      thumbnail: '/assets/thumbnails/luna-thumb.jpg',
      description: 'Creative mixologist specializing in innovative cocktails',
      tags: ['mixologist', 'creative', 'innovative', 'energetic']
    },
    capabilities: {
      lipSync: true,
      voiceRecognition: true,
      textToSpeech: true,
      emotionalExpressions: true,
      gestureSupport: false
    },
    metadata: {
      created: '2024-03-01',
      version: '1.0.0',
      author: 'Nauti-Bouys Team',
      morphTargets: 172
    }
  }
};

// Dynamic avatar registry that merges defaults with localStorage customizations
let AVATAR_REGISTRY = {};

/**
 * Initialize avatar registry with defaults and localStorage data
 */
function initializeAvatarRegistry() {
  // Start with default avatars
  AVATAR_REGISTRY = { ...DEFAULT_AVATARS };
  
  try {
    // Load custom avatars from localStorage
    const customAvatars = JSON.parse(localStorage.getItem('customAvatars') || '{}');
    
    // Merge custom avatars with defaults (custom overrides defaults)
    Object.keys(customAvatars).forEach(avatarId => {
      AVATAR_REGISTRY[avatarId] = {
        ...AVATAR_REGISTRY[avatarId], // Keep default structure
        ...customAvatars[avatarId],   // Override with custom data
        metadata: {
          ...AVATAR_REGISTRY[avatarId]?.metadata,
          ...customAvatars[avatarId]?.metadata,
          lastModified: customAvatars[avatarId]?.metadata?.lastModified || new Date().toISOString()
        }
      };
    });
  } catch (error) {
    console.warn('Failed to load custom avatars from localStorage:', error);
  }
}

/**
 * Save avatar to localStorage
 * @param {Object} avatarConfig - Avatar configuration to save
 * @returns {boolean} Success status
 */
export function saveAvatarToStorage(avatarConfig) {
  try {
    const customAvatars = JSON.parse(localStorage.getItem('customAvatars') || '{}');
    
    // Add timestamp
    const avatarWithTimestamp = {
      ...avatarConfig,
      metadata: {
        ...avatarConfig.metadata,
        lastModified: new Date().toISOString()
      }
    };
    
    customAvatars[avatarConfig.id] = avatarWithTimestamp;
    localStorage.setItem('customAvatars', JSON.stringify(customAvatars));
    
    // Update the in-memory registry
    AVATAR_REGISTRY[avatarConfig.id] = avatarWithTimestamp;
    
    return true;
  } catch (error) {
    console.error('Failed to save avatar to localStorage:', error);
    return false;
  }
}

/**
 * Reset avatar to default configuration
 * @param {string} avatarId - Avatar identifier
 * @returns {boolean} Success status
 */
export function resetAvatarToDefault(avatarId) {
  try {
    const customAvatars = JSON.parse(localStorage.getItem('customAvatars') || '{}');
    
    // Remove custom configuration
    delete customAvatars[avatarId];
    localStorage.setItem('customAvatars', JSON.stringify(customAvatars));
    
    // Restore default configuration
    if (DEFAULT_AVATARS[avatarId]) {
      AVATAR_REGISTRY[avatarId] = { ...DEFAULT_AVATARS[avatarId] };
    }
    
    return true;
  } catch (error) {
    console.error('Failed to reset avatar to default:', error);
    return false;
  }
}

/**
 * Get all available avatars
 * @param {boolean} includeComingSoon - Include avatars with 'coming_soon' status
 * @returns {Array} Array of avatar configurations
 */
export function getAvailableAvatars(includeComingSoon = false) {
  // Ensure registry is initialized
  if (Object.keys(AVATAR_REGISTRY).length === 0) {
    initializeAvatarRegistry();
  }
  
  return Object.values(AVATAR_REGISTRY).filter(avatar => {
    if (avatar.status === 'maintenance') return false;
    if (avatar.status === 'coming_soon' && !includeComingSoon) return false;
    return true;
  });
}

/**
 * Get avatar configuration by ID
 * @param {string} avatarId - Avatar identifier
 * @returns {Object|null} Avatar configuration or null if not found
 */
export function getAvatarById(avatarId) {
  // Ensure registry is initialized
  if (Object.keys(AVATAR_REGISTRY).length === 0) {
    initializeAvatarRegistry();
  }
  
  return AVATAR_REGISTRY[avatarId] || null;
}

/**
 * Get avatars by role
 * @param {string} role - Avatar role (e.g., 'Expert Bartender', 'Sommelier')
 * @returns {Array} Array of matching avatar configurations
 */
export function getAvatarsByRole(role) {
  return Object.values(AVATAR_REGISTRY).filter(avatar => 
    avatar.role.toLowerCase().includes(role.toLowerCase())
  );
}

/**
 * Get avatars by specialty
 * @param {string} specialty - Specialty to search for
 * @returns {Array} Array of matching avatar configurations
 */
export function getAvatarsBySpecialty(specialty) {
  return Object.values(AVATAR_REGISTRY).filter(avatar =>
    avatar.personality.specialties.some(s => 
      s.toLowerCase().includes(specialty.toLowerCase())
    )
  );
}

/**
 * Get avatars by tag
 * @param {string} tag - Tag to search for
 * @returns {Array} Array of matching avatar configurations
 */
export function getAvatarsByTag(tag) {
  return Object.values(AVATAR_REGISTRY).filter(avatar =>
    avatar.appearance.tags.some(t => 
      t.toLowerCase().includes(tag.toLowerCase())
    )
  );
}

/**
 * Check if avatar model exists
 * @param {string} avatarId - Avatar identifier
 * @returns {Promise<boolean>} Promise resolving to true if model exists
 */
export async function checkAvatarModelExists(avatarId) {
  const avatar = getAvatarById(avatarId);
  if (!avatar) return false;
  
  try {
    const response = await fetch(avatar.modelPath, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn(`Avatar model check failed for ${avatarId}:`, error);
    return false;
  }
}

/**
 * Preload avatar model
 * @param {string} avatarId - Avatar identifier
 * @returns {Promise<boolean>} Promise resolving to true if preload successful
 */
export async function preloadAvatarModel(avatarId) {
  const avatar = getAvatarById(avatarId);
  if (!avatar) return false;
  
  try {
    // Create a link element to preload the GLB file
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = avatar.modelPath;
    link.as = 'fetch';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    
    return true;
  } catch (error) {
    console.warn(`Avatar preload failed for ${avatarId}:`, error);
    return false;
  }
}

/**
 * Get recommended avatar based on user preferences
 * @param {Object} preferences - User preferences
 * @param {string} preferences.expertise - Preferred expertise area
 * @param {string} preferences.personality - Preferred personality type
 * @param {string} preferences.formality - Preferred formality level
 * @returns {Object|null} Recommended avatar configuration
 */
export function getRecommendedAvatar(preferences = {}) {
  const availableAvatars = getAvailableAvatars();
  
  if (availableAvatars.length === 0) return null;
  if (availableAvatars.length === 1) return availableAvatars[0];
  
  // Score avatars based on preferences
  const scoredAvatars = availableAvatars.map(avatar => {
    let score = 0;
    
    // Expertise matching
    if (preferences.expertise) {
      const expertiseMatch = avatar.personality.specialties.some(specialty =>
        specialty.toLowerCase().includes(preferences.expertise.toLowerCase())
      );
      if (expertiseMatch) score += 3;
    }
    
    // Personality matching
    if (preferences.personality) {
      const personalityMatch = avatar.personality.traits.some(trait =>
        trait.toLowerCase().includes(preferences.personality.toLowerCase())
      );
      if (personalityMatch) score += 2;
    }
    
    // Formality matching
    if (preferences.formality) {
      const formalityMatch = avatar.personality.conversationStyle.formality
        .includes(preferences.formality.toLowerCase());
      if (formalityMatch) score += 1;
    }
    
    return { avatar, score };
  });
  
  // Sort by score and return the highest scoring avatar
  scoredAvatars.sort((a, b) => b.score - a.score);
  return scoredAvatars[0].avatar;
}

/**
 * Validate avatar configuration
 * @param {Object} avatarConfig - Avatar configuration to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export function validateAvatarConfig(avatarConfig) {
  const errors = [];
  
  // Required fields
  const requiredFields = ['id', 'name', 'modelPath', 'role'];
  requiredFields.forEach(field => {
    if (!avatarConfig[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Validate personality structure
  if (avatarConfig.personality) {
    if (!Array.isArray(avatarConfig.personality.traits)) {
      errors.push('personality.traits must be an array');
    }
    if (!Array.isArray(avatarConfig.personality.specialties)) {
      errors.push('personality.specialties must be an array');
    }
    if (!avatarConfig.personality.greeting) {
      errors.push('personality.greeting is required');
    }
  } else {
    errors.push('personality configuration is required');
  }
  
  // Validate appearance structure
  if (avatarConfig.appearance) {
    if (!avatarConfig.appearance.thumbnail) {
      errors.push('appearance.thumbnail is required');
    }
    if (!Array.isArray(avatarConfig.appearance.tags)) {
      errors.push('appearance.tags must be an array');
    }
  } else {
    errors.push('appearance configuration is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Register a new avatar
 * @param {Object} avatarConfig - Avatar configuration
 * @returns {Object} Registration result
 */
export function registerAvatar(avatarConfig) {
  const validation = validateAvatarConfig(avatarConfig);
  
  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors
    };
  }
  
  if (AVATAR_REGISTRY[avatarConfig.id]) {
    return {
      success: false,
      errors: [`Avatar with ID '${avatarConfig.id}' already exists`]
    };
  }
  
  AVATAR_REGISTRY[avatarConfig.id] = {
    ...avatarConfig,
    metadata: {
      ...avatarConfig.metadata,
      registered: new Date().toISOString()
    }
  };
  
  return {
    success: true,
    avatar: AVATAR_REGISTRY[avatarConfig.id]
  };
}

/**
 * Get avatar statistics
 * @returns {Object} Statistics about registered avatars
 */
export function getAvatarStats() {
  const avatars = Object.values(AVATAR_REGISTRY);
  
  return {
    total: avatars.length,
    active: avatars.filter(a => a.status === 'active').length,
    comingSoon: avatars.filter(a => a.status === 'coming_soon').length,
    maintenance: avatars.filter(a => a.status === 'maintenance').length,
    roles: [...new Set(avatars.map(a => a.role))],
    specialties: [...new Set(avatars.flatMap(a => a.personality.specialties))],
    tags: [...new Set(avatars.flatMap(a => a.appearance.tags))]
  };
}

/**
 * Create avatar thumbnail fallback
 * @param {string} avatarName - Avatar name for fallback
 * @returns {string} Data URL for generated thumbnail
 */
export function createAvatarThumbnailFallback(avatarName) {
  const canvas = document.createElement('canvas');
  canvas.width = 80;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  
  // Create a simple colored circle with initials
  const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1'];
  const color = colors[avatarName.length % colors.length];
  
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(40, 40, 35, 0, 2 * Math.PI);
  ctx.fill();
  
  ctx.fillStyle = 'white';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(avatarName.charAt(0).toUpperCase(), 40, 40);
  
  return canvas.toDataURL();
}

export default {
  AVATAR_REGISTRY,
  getAvailableAvatars,
  getAvatarById,
  getAvatarsByRole,
  getAvatarsBySpecialty,
  getAvatarsByTag,
  checkAvatarModelExists,
  preloadAvatarModel,
  getRecommendedAvatar,
  validateAvatarConfig,
  registerAvatar,
  getAvatarStats,
  createAvatarThumbnailFallback
};
