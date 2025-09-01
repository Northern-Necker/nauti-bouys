/**
 * Spirit Shelf Display Component - Visual indicators and display for spirit shelf tiers
 * Shows shelf-aware spirit cards with visual hierarchy and authorization status
 */

import React from 'react';
import { Lock, Crown, Star, Droplets } from 'lucide-react';
import spiritsService from '../../services/spiritsService';
import shelfLogic from '../../utils/shelfLogic';

const SpiritShelfDisplay = ({ 
  spirits = [], 
  userAuthorization = null, 
  showShelfBadges = true,
  showAccessStatus = true,
  onUltraRequest = null,
  layout = 'grid' // 'grid' | 'list' | 'compact'
}) => {
  if (!spirits.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Droplets className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No spirits found in the current selection</p>
      </div>
    );
  }

  return (
    <div className={`
      ${layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' :
        layout === 'list' ? 'space-y-4' :
        'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3'}
    `}>
      {spirits.map((spirit) => (
        <SpiritCard
          key={spirit.id || spirit._id}
          spirit={spirit}
          userAuthorization={userAuthorization}
          showShelfBadges={showShelfBadges}
          showAccessStatus={showAccessStatus}
          onUltraRequest={onUltraRequest}
          layout={layout}
        />
      ))}
    </div>
  );
};

// Individual spirit card with shelf awareness
const SpiritCard = ({ 
  spirit, 
  userAuthorization, 
  showShelfBadges, 
  showAccessStatus, 
  onUltraRequest,
  layout 
}) => {
  const formattedSpirit = spiritsService.formatSpiritWithShelf(spirit);
  const canAccess = spiritsService.canAccessSpirit(spirit, userAuthorization);
  const shelfIndicators = shelfLogic.getShelfVisualIndicators(spirit.shelf || 'well');

  const handleUltraRequest = () => {
    if (onUltraRequest && !canAccess && spirit.shelf === 'ultra') {
      onUltraRequest(spirit);
    }
  };

  const isCompact = layout === 'compact';

  return (
    <div 
      className={`
        bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300
        ${spirit.shelf === 'ultra' ? 'ring-1 ring-purple-200' : ''}
        ${!canAccess ? 'opacity-75' : 'hover:scale-105'}
        ${isCompact ? 'p-3' : 'p-4'}
        relative overflow-hidden
      `}
    >
      {/* Shelf tier background accent */}
      <div 
        className="absolute top-0 left-0 w-full h-1"
        style={{ backgroundColor: shelfIndicators.color }}
      />

      {/* Spirit Image */}
      <div className={`relative ${isCompact ? 'mb-2' : 'mb-4'}`}>
        <div className={`
          bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center
          ${isCompact ? 'h-20' : 'h-32'}
        `}>
          {spirit.image ? (
            <img 
              src={spirit.image} 
              alt={spirit.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Droplets className={`${isCompact ? 'h-8 w-8' : 'h-12 w-12'} text-gray-400`} />
          )}
        </div>

        {/* Access Status Overlay */}
        {showAccessStatus && !canAccess && (
          <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <Lock className="h-6 w-6 mx-auto mb-1" />
              <span className="text-xs font-medium">
                {spirit.shelf === 'ultra' ? 'Authorization Required' : 'Restricted'}
              </span>
            </div>
          </div>
        )}

        {/* Shelf Badge */}
        {showShelfBadges && (
          <div className="absolute top-2 right-2">
            <ShelfBadge shelf={spirit.shelf} indicators={shelfIndicators} compact={isCompact} />
          </div>
        )}
      </div>

      {/* Spirit Info */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <h3 className={`font-semibold text-gray-900 ${isCompact ? 'text-sm' : 'text-base'}`}>
            {spirit.name}
            {spirit.shelf === 'ultra' && <Crown className="inline h-4 w-4 ml-1 text-purple-600" />}
          </h3>
        </div>

        {!isCompact && (
          <>
            <p className="text-sm text-gray-600 mb-2">
              {spirit.type} {spirit.subtype && `• ${spirit.subtype}`}
            </p>
            
            {spirit.description && (
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                {spirit.description}
              </p>
            )}
          </>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between">
          {!isCompact && (
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded-full ${shelfIndicators.border}`}
                style={{ 
                  backgroundColor: `${shelfIndicators.color}15`,
                  color: shelfIndicators.color 
                }}
              >
                {shelfIndicators.icon} {shelfIndicators.badge}
              </span>
              
              {spirit.age && (
                <span className="text-xs text-gray-500">
                  {spirit.age}yr
                </span>
              )}
            </div>
          )}

          {!canAccess && spirit.shelf === 'ultra' ? (
            <button
              onClick={handleUltraRequest}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-full transition-colors"
            >
              Request Access
            </button>
          ) : canAccess ? (
            <button className="text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded-full transition-colors">
              {isCompact ? 'View' : 'Available'}
            </button>
          ) : (
            <span className="text-xs text-gray-400">
              Restricted
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Shelf badge component
const ShelfBadge = ({ shelf, indicators, compact = false }) => {
  return (
    <div 
      className={`
        rounded-full flex items-center justify-center text-white font-bold shadow-lg
        ${compact ? 'h-6 w-6 text-xs' : 'h-8 w-8 text-sm'}
      `}
      style={{ backgroundColor: indicators.color }}
      title={indicators.name}
    >
      <span>{indicators.icon}</span>
    </div>
  );
};

// Shelf tier legend component
export const ShelfTierLegend = () => {
  const shelves = [
    shelfLogic.SHELF_TIERS.WELL,
    shelfLogic.SHELF_TIERS.CALL,
    shelfLogic.SHELF_TIERS.TOP,
    shelfLogic.SHELF_TIERS.ULTRA
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Shelf Tiers</h3>
      <div className="space-y-3">
        {shelves.map((tier) => {
          const shelfInfo = spiritsService.getShelfTierInfo(tier);
          const indicators = shelfLogic.getShelfVisualIndicators(tier);
          
          return (
            <div key={tier} className="flex items-center space-x-3">
              <div 
                className="h-4 w-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: indicators.color }}
              >
                {shelfInfo.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{shelfInfo.name}</span>
                  {tier === 'ultra' && <Lock className="h-4 w-4 text-purple-600" />}
                </div>
                <p className="text-sm text-gray-600">{shelfInfo.description}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Crown className="h-4 w-4 text-purple-600" />
          <span>Ultra shelf requires owner authorization</span>
        </div>
      </div>
    </div>
  );
};

// Shelf filter component
export const ShelfFilter = ({ 
  selectedShelf, 
  onShelfChange, 
  userAuthorization,
  counts = {} 
}) => {
  const shelves = [
    { tier: 'all', name: 'All Spirits', icon: '🍷' },
    { tier: shelfLogic.SHELF_TIERS.WELL, name: 'Well', icon: '🥃' },
    { tier: shelfLogic.SHELF_TIERS.CALL, name: 'Call', icon: '🥃' },
    { tier: shelfLogic.SHELF_TIERS.TOP, name: 'Top', icon: '⭐' },
    { tier: shelfLogic.SHELF_TIERS.ULTRA, name: 'Ultra', icon: '💎' }
  ];

  const canAccessUltra = userAuthorization?.ultraShelfAccess;

  return (
    <div className="flex flex-wrap gap-2">
      {shelves.map(({ tier, name, icon }) => {
        const isSelected = selectedShelf === tier;
        const isUltra = tier === shelfLogic.SHELF_TIERS.ULTRA;
        const count = counts[tier] || 0;
        
        return (
          <button
            key={tier}
            onClick={() => onShelfChange(tier)}
            disabled={isUltra && !canAccessUltra}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all
              ${isSelected 
                ? isUltra 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-teal-600 text-white'
                : isUltra
                  ? canAccessUltra
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
              ${isUltra && !canAccessUltra ? 'opacity-50' : ''}
            `}
          >
            <span>{icon}</span>
            <span>{name}</span>
            {count > 0 && (
              <span className={`
                text-xs px-2 py-0.5 rounded-full
                ${isSelected 
                  ? 'bg-white/20 text-white' 
                  : 'bg-white text-gray-600'
                }
              `}>
                {count}
              </span>
            )}
            {isUltra && !canAccessUltra && (
              <Lock className="h-3 w-3" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default SpiritShelfDisplay;