/**
 * Avatar Personality Editor Component
 * Allows users to customize avatar personalities, traits, and conversation styles
 */

import React, { useState, useEffect } from 'react';
import { 
  User, 
  MessageCircle, 
  Heart, 
  Brain, 
  Volume2, 
  Save, 
  RotateCcw, 
  Plus, 
  X,
  Edit3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { 
  getAvatarById, 
  getAvailableAvatars, 
  validateAvatarConfig,
  saveAvatarToStorage,
  resetAvatarToDefault
} from '../../utils/avatarManager';

export default function AvatarPersonalityEditor() {
  const [selectedAvatarId, setSelectedAvatarId] = useState('savannah');
  const [editingAvatar, setEditingAvatar] = useState(null);
  const [originalAvatar, setOriginalAvatar] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  // Load avatar data when selection changes
  useEffect(() => {
    const avatar = getAvatarById(selectedAvatarId);
    if (avatar) {
      setEditingAvatar(JSON.parse(JSON.stringify(avatar))); // Deep copy
      setOriginalAvatar(JSON.parse(JSON.stringify(avatar)));
      setHasChanges(false);
      setValidationErrors([]);
    }
  }, [selectedAvatarId]);

  // Check for changes
  useEffect(() => {
    if (editingAvatar && originalAvatar) {
      const hasChanged = JSON.stringify(editingAvatar) !== JSON.stringify(originalAvatar);
      setHasChanges(hasChanged);
      
      // Validate changes
      if (hasChanged) {
        const validation = validateAvatarConfig(editingAvatar);
        setValidationErrors(validation.errors);
      } else {
        setValidationErrors([]);
      }
    }
  }, [editingAvatar, originalAvatar]);

  const handleBasicInfoChange = (field, value) => {
    setEditingAvatar(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePersonalityChange = (field, value) => {
    setEditingAvatar(prev => ({
      ...prev,
      personality: {
        ...prev.personality,
        [field]: value
      }
    }));
  };

  const handleConversationStyleChange = (field, value) => {
    setEditingAvatar(prev => ({
      ...prev,
      personality: {
        ...prev.personality,
        conversationStyle: {
          ...prev.personality.conversationStyle,
          [field]: value
        }
      }
    }));
  };

  const handleVoiceChange = (field, value) => {
    setEditingAvatar(prev => ({
      ...prev,
      personality: {
        ...prev.personality,
        voice: {
          ...prev.personality.voice,
          [field]: parseFloat(value)
        }
      }
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setEditingAvatar(prev => ({
      ...prev,
      personality: {
        ...prev.personality,
        [field]: prev.personality[field].map((item, i) => 
          i === index ? value : item
        )
      }
    }));
  };

  const addArrayItem = (field) => {
    setEditingAvatar(prev => ({
      ...prev,
      personality: {
        ...prev.personality,
        [field]: [...prev.personality[field], '']
      }
    }));
  };

  const removeArrayItem = (field, index) => {
    setEditingAvatar(prev => ({
      ...prev,
      personality: {
        ...prev.personality,
        [field]: prev.personality[field].filter((_, i) => i !== index)
      }
    }));
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    
    try {
      // Validate before saving
      const validation = validateAvatarConfig(editingAvatar);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(null), 3000);
        return;
      }

      // Use the new saveAvatarToStorage function
      const saveSuccess = saveAvatarToStorage(editingAvatar);
      
      if (saveSuccess) {
        setOriginalAvatar(JSON.parse(JSON.stringify(editingAvatar)));
        setHasChanges(false);
        setSaveStatus('success');
        
        // Trigger a custom event to notify other components of avatar updates
        window.dispatchEvent(new CustomEvent('avatarUpdated', { 
          detail: { avatarId: editingAvatar.id, avatar: editingAvatar } 
        }));
      } else {
        setSaveStatus('error');
      }
      
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Error saving avatar:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleReset = () => {
    setEditingAvatar(JSON.parse(JSON.stringify(originalAvatar)));
    setHasChanges(false);
    setValidationErrors([]);
  };

  const handleResetToDefault = async () => {
    setSaveStatus('saving');
    
    try {
      const resetSuccess = resetAvatarToDefault(selectedAvatarId);
      
      if (resetSuccess) {
        // Reload the avatar data after reset
        const resetAvatar = getAvatarById(selectedAvatarId);
        if (resetAvatar) {
          setEditingAvatar(JSON.parse(JSON.stringify(resetAvatar)));
          setOriginalAvatar(JSON.parse(JSON.stringify(resetAvatar)));
          setHasChanges(false);
          setValidationErrors([]);
          setSaveStatus('success');
          
          // Trigger a custom event to notify other components
          window.dispatchEvent(new CustomEvent('avatarUpdated', { 
            detail: { avatarId: selectedAvatarId, avatar: resetAvatar } 
          }));
        }
      } else {
        setSaveStatus('error');
      }
      
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Error resetting avatar to default:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const availableAvatars = getAvailableAvatars(true);

  if (!editingAvatar) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading avatar data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Edit3 className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Avatar Personality Editor</h2>
        </div>
        
        {/* Save Status */}
        {saveStatus && (
          <div className={`flex items-center px-3 py-2 rounded-md text-sm ${
            saveStatus === 'success' ? 'bg-green-100 text-green-800' :
            saveStatus === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {saveStatus === 'success' && <CheckCircle className="h-4 w-4 mr-2" />}
            {saveStatus === 'error' && <AlertCircle className="h-4 w-4 mr-2" />}
            {saveStatus === 'saving' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>}
            {saveStatus === 'success' && 'Saved successfully!'}
            {saveStatus === 'error' && 'Error saving changes'}
            {saveStatus === 'saving' && 'Saving...'}
          </div>
        )}
      </div>

      {/* Avatar Selection */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <User className="h-5 w-5 mr-2" />
          Select Avatar to Edit
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableAvatars.map(avatar => (
            <button
              key={avatar.id}
              onClick={() => setSelectedAvatarId(avatar.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedAvatarId === avatar.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-left">
                <h4 className="font-semibold">{avatar.name}</h4>
                <p className="text-sm text-gray-600">{avatar.role}</p>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    avatar.status === 'active' ? 'bg-green-100 text-green-800' :
                    avatar.status === 'coming_soon' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {avatar.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <h4 className="text-red-800 font-semibold">Validation Errors</h4>
          </div>
          <ul className="text-red-700 text-sm space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Basic Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={editingAvatar.name}
                onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <input
                type="text"
                value={editingAvatar.role}
                onChange={(e) => handleBasicInfoChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Greeting Message
              </label>
              <textarea
                value={editingAvatar.personality.greeting}
                onChange={(e) => handlePersonalityChange('greeting', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Voice Settings */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Volume2 className="h-5 w-5 mr-2" />
            Voice Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pitch: {editingAvatar.personality.voice.pitch}
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={editingAvatar.personality.voice.pitch}
                onChange={(e) => handleVoiceChange('pitch', e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate: {editingAvatar.personality.voice.rate}
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={editingAvatar.personality.voice.rate}
                onChange={(e) => handleVoiceChange('rate', e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume: {editingAvatar.personality.voice.volume}
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={editingAvatar.personality.voice.volume}
                onChange={(e) => handleVoiceChange('volume', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Personality Traits */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Heart className="h-5 w-5 mr-2" />
            Personality Traits
          </h3>
          
          <div className="space-y-3">
            {editingAvatar.personality.traits.map((trait, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={trait}
                  onChange={(e) => handleArrayChange('traits', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter personality trait"
                />
                <button
                  onClick={() => removeArrayItem('traits', index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => addArrayItem('traits')}
              className="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Trait
            </button>
          </div>
        </div>

        {/* Specialties */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            Specialties
          </h3>
          
          <div className="space-y-3">
            {editingAvatar.personality.specialties.map((specialty, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => handleArrayChange('specialties', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter specialty area"
                />
                <button
                  onClick={() => removeArrayItem('specialties', index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => addArrayItem('specialties')}
              className="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Specialty
            </button>
          </div>
        </div>

        {/* Conversation Style */}
        <div className="bg-white rounded-lg p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            Conversation Style
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formality
              </label>
              <select
                value={editingAvatar.personality.conversationStyle.formality}
                onChange={(e) => handleConversationStyleChange('formality', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="casual">Casual</option>
                <option value="casual-professional">Casual Professional</option>
                <option value="formal-professional">Formal Professional</option>
                <option value="formal">Formal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enthusiasm
              </label>
              <select
                value={editingAvatar.personality.conversationStyle.enthusiasm}
                onChange={(e) => handleConversationStyleChange('enthusiasm', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
                <option value="very-high">Very High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Length
              </label>
              <select
                value={editingAvatar.personality.conversationStyle.responseLength}
                onChange={(e) => handleConversationStyleChange('responseLength', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="short">Short</option>
                <option value="short-medium">Short-Medium</option>
                <option value="medium">Medium</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expertise Focus
              </label>
              <input
                type="text"
                value={editingAvatar.personality.conversationStyle.expertise}
                onChange={(e) => handleConversationStyleChange('expertise', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., bartending, wine, mixology"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <button
          onClick={handleResetToDefault}
          disabled={saveStatus === 'saving'}
          className="flex items-center px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Default
        </button>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Changes
          </button>
          
          <button
            onClick={handleSave}
            disabled={!hasChanges || validationErrors.length > 0 || saveStatus === 'saving'}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
