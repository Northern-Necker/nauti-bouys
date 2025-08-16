/**
 * AvatarStatus Component
 * Displays D-ID Avatar status, metrics, and diagnostics
 */

import React, { useState } from 'react';

const AvatarStatus = ({ 
  status = {},
  theme = 'teal',
  className = '',
  showDetailed = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    isReady = false,
    isConnected = false,
    isPlaying = false,
    error = null,
    metrics = {},
    syncMetrics = {}
  } = status;

  const themeClasses = {
    teal: {
      accent: 'text-teal-600',
      bg: 'bg-teal-50',
      border: 'border-teal-200'
    },
    navy: {
      accent: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    gray: {
      accent: 'text-gray-600',
      bg: 'bg-gray-50',
      border: 'border-gray-200'
    }
  };

  const currentTheme = themeClasses[theme] || themeClasses.teal;

  const getStatusColor = (condition) => {
    if (condition === true) return 'text-green-600';
    if (condition === false) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getStatusIcon = (condition) => {
    if (condition === true) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      );
    }
    if (condition === false) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    );
  };

  const formatLatency = (latency) => {
    if (typeof latency !== 'number') return 'N/A';
    return latency < 1000 ? `${Math.round(latency)}ms` : `${(latency / 1000).toFixed(1)}s`;
  };

  const formatPercentage = (value, total) => {
    if (typeof value !== 'number' || typeof total !== 'number' || total === 0) return 'N/A';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  return (
    <div className={`avatar-status ${currentTheme.bg} ${currentTheme.border} border rounded-lg p-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-semibold ${currentTheme.accent}`}>
          Avatar Status
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`text-xs ${currentTheme.accent} hover:underline focus:outline-none`}
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Basic Status Indicators */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center">
          <span className={getStatusColor(isReady)}>
            {getStatusIcon(isReady)}
          </span>
          <span className="ml-2 text-sm text-gray-700">Ready</span>
        </div>
        
        <div className="flex items-center">
          <span className={getStatusColor(isConnected)}>
            {getStatusIcon(isConnected)}
          </span>
          <span className="ml-2 text-sm text-gray-700">Connected</span>
        </div>
        
        <div className="flex items-center">
          <span className={getStatusColor(isPlaying)}>
            {getStatusIcon(isPlaying)}
          </span>
          <span className="ml-2 text-sm text-gray-700">Speaking</span>
        </div>
        
        <div className="flex items-center">
          <span className={getStatusColor(!error)}>
            {getStatusIcon(!error)}
          </span>
          <span className="ml-2 text-sm text-gray-700">Health</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Detailed Metrics */}
      {(isExpanded || showDetailed) && (
        <div className="border-t border-gray-200 pt-3">
          <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Performance Metrics
          </h4>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Avatar Metrics */}
            {metrics.avatar && (
              <>
                <div>
                  <span className="text-gray-500">Sessions:</span>
                  <span className="ml-1 font-mono">{metrics.avatar.sessionsCreated || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Messages:</span>
                  <span className="ml-1 font-mono">{metrics.avatar.messagesProcessed || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Avg Response:</span>
                  <span className="ml-1 font-mono">{formatLatency(metrics.avatar.averageResponseTime)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Last Activity:</span>
                  <span className="ml-1 font-mono">
                    {metrics.avatar.lastInteraction 
                      ? new Date(metrics.avatar.lastInteraction).toLocaleTimeString()
                      : 'None'
                    }
                  </span>
                </div>
              </>
            )}

            {/* API Metrics */}
            {metrics.api && (
              <>
                <div>
                  <span className="text-gray-500">API Requests:</span>
                  <span className="ml-1 font-mono">{metrics.api.requestCount || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Success Rate:</span>
                  <span className="ml-1 font-mono">{metrics.api.successRate || 'N/A'}</span>
                </div>
              </>
            )}

            {/* Sync Metrics */}
            {syncMetrics && (
              <>
                <div>
                  <span className="text-gray-500">Sync Latency:</span>
                  <span className="ml-1 font-mono">{formatLatency(syncMetrics.latency)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Dropped Frames:</span>
                  <span className="ml-1 font-mono">{syncMetrics.droppedFrames || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Messages:</span>
                  <span className="ml-1 font-mono">{syncMetrics.totalMessages || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Frame Accuracy:</span>
                  <span className="ml-1 font-mono">
                    {formatPercentage(
                      (syncMetrics.totalMessages || 0) - (syncMetrics.droppedFrames || 0),
                      syncMetrics.totalMessages || 0
                    )}
                  </span>
                </div>
              </>
            )}

            {/* Stream Metrics */}
            {metrics.streams && (
              <>
                <div>
                  <span className="text-gray-500">Active Streams:</span>
                  <span className="ml-1 font-mono">{metrics.streams.active || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Streams:</span>
                  <span className="ml-1 font-mono">{metrics.streams.total || 0}</span>
                </div>
              </>
            )}

            {/* Queue Metrics */}
            {metrics.queue && (
              <>
                <div>
                  <span className="text-gray-500">Queue Length:</span>
                  <span className="ml-1 font-mono">{metrics.queue.pending || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Processing:</span>
                  <span className={`ml-1 font-mono ${metrics.queue.processing ? 'text-yellow-600' : 'text-green-600'}`}>
                    {metrics.queue.processing ? 'Yes' : 'No'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Health Score */}
          {(metrics.api || syncMetrics) && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Overall Health:</span>
                <div className="flex items-center">
                  {(() => {
                    const successRate = metrics.api?.successRate ? parseFloat(metrics.api.successRate) : 0;
                    const frameAccuracy = syncMetrics.totalMessages ? 
                      ((syncMetrics.totalMessages - (syncMetrics.droppedFrames || 0)) / syncMetrics.totalMessages) * 100 : 0;
                    const healthScore = (successRate + frameAccuracy) / 2;
                    
                    const healthColor = healthScore >= 90 ? 'text-green-600' : 
                                      healthScore >= 70 ? 'text-yellow-600' : 'text-red-600';
                    
                    return (
                      <>
                        <span className={`text-xs font-mono ${healthColor}`}>
                          {healthScore.toFixed(1)}%
                        </span>
                        <div className={`ml-2 w-2 h-2 rounded-full ${
                          healthScore >= 90 ? 'bg-green-400' : 
                          healthScore >= 70 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}></div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AvatarStatus;