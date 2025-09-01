/**
 * Emotional Memory Persistence System
 * 
 * Handles saving and loading emotional state, relationship data, and conversation
 * history across sessions. Creates a persistent memory that allows Savannah to
 * remember patrons and maintain relationships over time.
 */

export class EmotionalMemoryPersistence {
  constructor() {
    this.storagePrefix = 'savannah_emotional_';
    this.maxMemoryAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    this.compressionThreshold = 100; // Compress after 100 entries
    this.backupFrequency = 24 * 60 * 60 * 1000; // 24 hours
    this.lastBackup = this.getLastBackupTime();
    
    // Memory categories with different retention policies
    this.memoryCategories = {
      emotional_state: {
        retention: 7 * 24 * 60 * 60 * 1000, // 7 days
        compress: true,
        backup: true
      },
      relationships: {
        retention: 90 * 24 * 60 * 60 * 1000, // 90 days
        compress: false,
        backup: true
      },
      conversations: {
        retention: 14 * 24 * 60 * 60 * 1000, // 14 days
        compress: true,
        backup: false
      },
      preferences: {
        retention: 365 * 24 * 60 * 60 * 1000, // 1 year
        compress: false,
        backup: true
      },
      engagement_history: {
        retention: 60 * 24 * 60 * 60 * 1000, // 60 days
        compress: true,
        backup: true
      }
    };

    this.initializeStorage();
  }

  /**
   * Initialize storage and perform cleanup
   */
  async initializeStorage() {
    try {
      // Check if we need to backup
      if (Date.now() - this.lastBackup > this.backupFrequency) {
        await this.createBackup();
      }

      // Cleanup old data
      await this.cleanupExpiredData();
      
      // Compress large datasets
      await this.compressOldData();

      console.log('Emotional memory persistence initialized');
    } catch (error) {
      console.error('Failed to initialize emotional memory persistence:', error);
    }
  }

  /**
   * Save emotional state to persistent storage
   */
  async saveEmotionalState(patronId, emotionalData) {
    try {
      const key = `${this.storagePrefix}emotional_state_${patronId}`;
      const dataToSave = {
        ...emotionalData,
        timestamp: Date.now(),
        version: '1.0'
      };

      // Use localStorage for web, could be extended to use IndexedDB
      localStorage.setItem(key, JSON.stringify(dataToSave));
      
      // Also save to session history
      await this.appendToSessionHistory(patronId, 'emotional_state', dataToSave);
      
      return true;
    } catch (error) {
      console.error('Failed to save emotional state:', error);
      return false;
    }
  }

  /**
   * Load emotional state from persistent storage
   */
  async loadEmotionalState(patronId) {
    try {
      const key = `${this.storagePrefix}emotional_state_${patronId}`;
      const savedData = localStorage.getItem(key);
      
      if (!savedData) {
        return null;
      }

      const parsedData = JSON.parse(savedData);
      
      // Check if data is expired
      if (this.isDataExpired(parsedData, 'emotional_state')) {
        localStorage.removeItem(key);
        return null;
      }

      return parsedData;
    } catch (error) {
      console.error('Failed to load emotional state:', error);
      return null;
    }
  }

  /**
   * Save relationship data
   */
  async saveRelationshipData(patronId, relationshipData) {
    try {
      const key = `${this.storagePrefix}relationship_${patronId}`;
      const dataToSave = {
        ...relationshipData,
        lastUpdated: Date.now(),
        version: '1.0'
      };

      localStorage.setItem(key, JSON.stringify(dataToSave));
      
      // Update relationship index
      await this.updateRelationshipIndex(patronId, dataToSave);
      
      return true;
    } catch (error) {
      console.error('Failed to save relationship data:', error);
      return false;
    }
  }

  /**
   * Load relationship data
   */
  async loadRelationshipData(patronId) {
    try {
      const key = `${this.storagePrefix}relationship_${patronId}`;
      const savedData = localStorage.getItem(key);
      
      if (!savedData) {
        return null;
      }

      const parsedData = JSON.parse(savedData);
      
      // Check if data is expired
      if (this.isDataExpired(parsedData, 'relationships')) {
        localStorage.removeItem(key);
        return null;
      }

      // Apply memory decay to relationship data
      return this.applyMemoryDecay(parsedData);
    } catch (error) {
      console.error('Failed to load relationship data:', error);
      return null;
    }
  }

  /**
   * Save conversation history
   */
  async saveConversationHistory(patronId, conversationData) {
    try {
      const key = `${this.storagePrefix}conversations_${patronId}`;
      let existingData = [];
      
      try {
        const existing = localStorage.getItem(key);
        if (existing) {
          existingData = JSON.parse(existing);
        }
      } catch (parseError) {
        console.warn('Could not parse existing conversation data, starting fresh');
      }

      // Add new conversation data
      const newEntry = {
        ...conversationData,
        timestamp: Date.now()
      };

      existingData.push(newEntry);

      // Keep only recent conversations
      const cutoff = Date.now() - this.memoryCategories.conversations.retention;
      existingData = existingData.filter(entry => entry.timestamp > cutoff);

      // Limit total entries to prevent storage bloat
      if (existingData.length > 50) {
        existingData = existingData.slice(-50);
      }

      localStorage.setItem(key, JSON.stringify(existingData));
      return true;
    } catch (error) {
      console.error('Failed to save conversation history:', error);
      return false;
    }
  }

  /**
   * Load conversation history
   */
  async loadConversationHistory(patronId, limit = 20) {
    try {
      const key = `${this.storagePrefix}conversations_${patronId}`;
      const savedData = localStorage.getItem(key);
      
      if (!savedData) {
        return [];
      }

      let parsedData = JSON.parse(savedData);
      
      // Filter expired data
      const cutoff = Date.now() - this.memoryCategories.conversations.retention;
      parsedData = parsedData.filter(entry => entry.timestamp > cutoff);

      // Return most recent entries
      return parsedData.slice(-limit);
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      return [];
    }
  }

  /**
   * Save patron preferences
   */
  async savePatronPreferences(patronId, preferences) {
    try {
      const key = `${this.storagePrefix}preferences_${patronId}`;
      const dataToSave = {
        ...preferences,
        lastUpdated: Date.now(),
        version: '1.0'
      };

      localStorage.setItem(key, JSON.stringify(dataToSave));
      return true;
    } catch (error) {
      console.error('Failed to save patron preferences:', error);
      return false;
    }
  }

  /**
   * Load patron preferences
   */
  async loadPatronPreferences(patronId) {
    try {
      const key = `${this.storagePrefix}preferences_${patronId}`;
      const savedData = localStorage.getItem(key);
      
      if (!savedData) {
        return {};
      }

      const parsedData = JSON.parse(savedData);
      
      if (this.isDataExpired(parsedData, 'preferences')) {
        localStorage.removeItem(key);
        return {};
      }

      return parsedData;
    } catch (error) {
      console.error('Failed to load patron preferences:', error);
      return {};
    }
  }

  /**
   * Save engagement history
   */
  async saveEngagementHistory(patronId, engagementData) {
    try {
      const key = `${this.storagePrefix}engagement_${patronId}`;
      let existingData = [];
      
      try {
        const existing = localStorage.getItem(key);
        if (existing) {
          existingData = JSON.parse(existing);
        }
      } catch (parseError) {
        console.warn('Could not parse existing engagement data, starting fresh');
      }

      // Add new engagement data
      const newEntry = {
        ...engagementData,
        timestamp: Date.now()
      };

      existingData.push(newEntry);

      // Keep only recent engagement data
      const cutoff = Date.now() - this.memoryCategories.engagement_history.retention;
      existingData = existingData.filter(entry => entry.timestamp > cutoff);

      localStorage.setItem(key, JSON.stringify(existingData));
      return true;
    } catch (error) {
      console.error('Failed to save engagement history:', error);
      return false;
    }
  }

  /**
   * Load engagement history
   */
  async loadEngagementHistory(patronId) {
    try {
      const key = `${this.storagePrefix}engagement_${patronId}`;
      const savedData = localStorage.getItem(key);
      
      if (!savedData) {
        return [];
      }

      let parsedData = JSON.parse(savedData);
      
      // Filter expired data
      const cutoff = Date.now() - this.memoryCategories.engagement_history.retention;
      parsedData = parsedData.filter(entry => entry.timestamp > cutoff);

      return parsedData;
    } catch (error) {
      console.error('Failed to load engagement history:', error);
      return [];
    }
  }

  /**
   * Update relationship index for quick lookups
   */
  async updateRelationshipIndex(patronId, relationshipData) {
    try {
      const indexKey = `${this.storagePrefix}relationship_index`;
      let index = {};
      
      try {
        const existing = localStorage.getItem(indexKey);
        if (existing) {
          index = JSON.parse(existing);
        }
      } catch (parseError) {
        console.warn('Could not parse relationship index, creating new one');
      }

      index[patronId] = {
        specialStatus: relationshipData.specialStatus,
        relationshipLevel: relationshipData.relationshipLevel,
        lastSeen: relationshipData.lastSeen,
        totalInteractions: relationshipData.totalInteractions,
        lastUpdated: Date.now()
      };

      localStorage.setItem(indexKey, JSON.stringify(index));
    } catch (error) {
      console.error('Failed to update relationship index:', error);
    }
  }

  /**
   * Get all patron relationships summary
   */
  async getAllPatronRelationships() {
    try {
      const indexKey = `${this.storagePrefix}relationship_index`;
      const indexData = localStorage.getItem(indexKey);
      
      if (!indexData) {
        return {};
      }

      return JSON.parse(indexData);
    } catch (error) {
      console.error('Failed to get patron relationships:', error);
      return {};
    }
  }

  /**
   * Apply memory decay to relationship data
   */
  applyMemoryDecay(relationshipData) {
    const timeSinceLastUpdate = Date.now() - (relationshipData.lastUpdated || Date.now());
    const daysSince = timeSinceLastUpdate / (24 * 60 * 60 * 1000);
    
    if (daysSince < 1) {
      return relationshipData; // No decay for recent data
    }

    // Apply decay to emotional aspects
    const decayFactor = Math.pow(0.99, daysSince); // 1% decay per day
    
    if (relationshipData.relationshipLevel) {
      // Positive relationships decay slower
      if (relationshipData.relationshipLevel > 0) {
        relationshipData.relationshipLevel *= Math.pow(0.995, daysSince);
      } else {
        // Negative relationships decay faster (forgiveness)
        relationshipData.relationshipLevel *= Math.pow(0.99, daysSince);
      }
    }

    // Decay recent memories but preserve significant ones
    if (relationshipData.memoryBank) {
      relationshipData.memoryBank = relationshipData.memoryBank.map(memory => {
        const memoryAge = (Date.now() - memory.timestamp) / (24 * 60 * 60 * 1000);
        if (memory.significance > 0.8) {
          // Significant memories decay very slowly
          memory.impact *= Math.pow(0.998, memoryAge);
        } else {
          // Regular memories decay normally
          memory.impact *= Math.pow(0.99, memoryAge);
        }
        return memory;
      }).filter(memory => memory.impact > 0.1); // Remove insignificant memories
    }

    return relationshipData;
  }

  /**
   * Check if data is expired
   */
  isDataExpired(data, category) {
    if (!data.timestamp && !data.lastUpdated) {
      return true; // No timestamp means old format, consider expired
    }

    const timestamp = data.timestamp || data.lastUpdated;
    const retention = this.memoryCategories[category]?.retention || this.maxMemoryAge;
    
    return Date.now() - timestamp > retention;
  }

  /**
   * Cleanup expired data
   */
  async cleanupExpiredData() {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.storagePrefix));
      let cleanedCount = 0;

      for (const key of keys) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          const category = this.extractCategoryFromKey(key);
          
          if (this.isDataExpired(data, category)) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        } catch (error) {
          // If we can't parse it, it's probably corrupted, remove it
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} expired emotional memory entries`);
      }
    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
    }
  }

  /**
   * Extract category from storage key
   */
  extractCategoryFromKey(key) {
    const keyPart = key.replace(this.storagePrefix, '');
    
    if (keyPart.startsWith('emotional_state')) return 'emotional_state';
    if (keyPart.startsWith('relationship')) return 'relationships';
    if (keyPart.startsWith('conversations')) return 'conversations';
    if (keyPart.startsWith('preferences')) return 'preferences';
    if (keyPart.startsWith('engagement')) return 'engagement_history';
    
    return 'unknown';
  }

  /**
   * Compress old data to save storage space
   */
  async compressOldData() {
    try {
      const conversationKeys = Object.keys(localStorage)
        .filter(key => key.includes('conversations_'));

      for (const key of conversationKeys) {
        const data = JSON.parse(localStorage.getItem(key));
        
        if (Array.isArray(data) && data.length > this.compressionThreshold) {
          // Keep only the most significant conversations
          const compressed = data
            .sort((a, b) => (b.significance || 0) - (a.significance || 0))
            .slice(0, 50); // Keep top 50

          localStorage.setItem(key, JSON.stringify(compressed));
        }
      }
    } catch (error) {
      console.error('Failed to compress old data:', error);
    }
  }

  /**
   * Create backup of important data
   */
  async createBackup() {
    try {
      const importantData = {};
      const backupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.storagePrefix));

      for (const key of backupKeys) {
        const category = this.extractCategoryFromKey(key);
        if (this.memoryCategories[category]?.backup) {
          importantData[key] = localStorage.getItem(key);
        }
      }

      const backupKey = `${this.storagePrefix}backup_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify({
        timestamp: Date.now(),
        data: importantData,
        version: '1.0'
      }));

      // Update last backup time
      localStorage.setItem(`${this.storagePrefix}last_backup`, Date.now().toString());
      this.lastBackup = Date.now();

      // Clean old backups (keep only last 3)
      this.cleanOldBackups();

      console.log('Emotional memory backup created');
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }

  /**
   * Clean old backups
   */
  cleanOldBackups() {
    try {
      const backupKeys = Object.keys(localStorage)
        .filter(key => key.includes(`${this.storagePrefix}backup_`))
        .sort((a, b) => {
          const timestampA = parseInt(a.split('_').pop());
          const timestampB = parseInt(b.split('_').pop());
          return timestampB - timestampA; // Sort newest first
        });

      // Remove all but the 3 most recent backups
      for (let i = 3; i < backupKeys.length; i++) {
        localStorage.removeItem(backupKeys[i]);
      }
    } catch (error) {
      console.error('Failed to clean old backups:', error);
    }
  }

  /**
   * Get last backup time
   */
  getLastBackupTime() {
    try {
      const lastBackup = localStorage.getItem(`${this.storagePrefix}last_backup`);
      return lastBackup ? parseInt(lastBackup) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupTimestamp = null) {
    try {
      let backupKey;
      
      if (backupTimestamp) {
        backupKey = `${this.storagePrefix}backup_${backupTimestamp}`;
      } else {
        // Find most recent backup
        const backupKeys = Object.keys(localStorage)
          .filter(key => key.includes(`${this.storagePrefix}backup_`))
          .sort((a, b) => {
            const timestampA = parseInt(a.split('_').pop());
            const timestampB = parseInt(b.split('_').pop());
            return timestampB - timestampA;
          });
        
        if (backupKeys.length === 0) {
          throw new Error('No backups found');
        }
        
        backupKey = backupKeys[0];
      }

      const backupData = JSON.parse(localStorage.getItem(backupKey));
      
      if (!backupData || !backupData.data) {
        throw new Error('Invalid backup data');
      }

      // Restore data
      Object.entries(backupData.data).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      console.log('Emotional memory restored from backup:', backupTimestamp || 'latest');
      return true;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }

  /**
   * Append to session history for analytics
   */
  async appendToSessionHistory(patronId, type, data) {
    try {
      const sessionKey = `${this.storagePrefix}session_${patronId}`;
      let sessionData = [];
      
      try {
        const existing = localStorage.getItem(sessionKey);
        if (existing) {
          sessionData = JSON.parse(existing);
        }
      } catch (parseError) {
        console.warn('Could not parse session data, starting fresh');
      }

      sessionData.push({
        type,
        data,
        timestamp: Date.now()
      });

      // Keep only last 24 hours of session data
      const cutoff = Date.now() - (24 * 60 * 60 * 1000);
      sessionData = sessionData.filter(entry => entry.timestamp > cutoff);

      localStorage.setItem(sessionKey, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to append to session history:', error);
    }
  }

  /**
   * Export all emotional memory data
   */
  async exportAllData() {
    try {
      const allData = {};
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.storagePrefix));

      for (const key of keys) {
        allData[key] = localStorage.getItem(key);
      }

      return {
        exportTimestamp: Date.now(),
        version: '1.0',
        data: allData
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }

  /**
   * Import emotional memory data
   */
  async importData(importData) {
    try {
      if (!importData.data) {
        throw new Error('Invalid import data format');
      }

      // Clear existing data first (optional, could be made configurable)
      const existingKeys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.storagePrefix));
      
      for (const key of existingKeys) {
        localStorage.removeItem(key);
      }

      // Import new data
      Object.entries(importData.data).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      console.log('Emotional memory data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  getStorageStats() {
    try {
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.storagePrefix));

      const stats = {
        totalEntries: keys.length,
        categories: {},
        storageUsed: 0,
        oldestEntry: Date.now(),
        newestEntry: 0
      };

      for (const key of keys) {
        const category = this.extractCategoryFromKey(key);
        
        if (!stats.categories[category]) {
          stats.categories[category] = 0;
        }
        stats.categories[category]++;

        const dataSize = localStorage.getItem(key).length;
        stats.storageUsed += dataSize;

        // Get timestamp for age analysis
        try {
          const data = JSON.parse(localStorage.getItem(key));
          const timestamp = data.timestamp || data.lastUpdated || Date.now();
          
          if (timestamp < stats.oldestEntry) {
            stats.oldestEntry = timestamp;
          }
          if (timestamp > stats.newestEntry) {
            stats.newestEntry = timestamp;
          }
        } catch (parseError) {
          // Skip if can't parse
        }
      }

      return stats;
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return null;
    }
  }
}

export default EmotionalMemoryPersistence;