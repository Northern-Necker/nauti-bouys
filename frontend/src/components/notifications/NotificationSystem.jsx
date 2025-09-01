/**
 * Notification System Component - Toast notifications for ultra shelf requests and status updates
 * Handles real-time notifications for both patrons and owners
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, Clock, Crown } from 'lucide-react';
import spiritsService from '../../services/spiritsService';
import shelfLogic from '../../utils/shelfLogic';

const NotificationSystem = ({ userId, isOwner = false, onUltraRequestUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Auto-remove notifications after delay
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Add new notification
  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      ...notification,
      timestamp: new Date()
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Keep max 5 notifications

    // Auto-remove based on type
    const autoRemoveDelay = notification.persistent ? null : 
      notification.type === 'error' ? 8000 :
      notification.type === 'success' ? 5000 :
      notification.type === 'warning' ? 7000 : 4000;

    if (autoRemoveDelay) {
      setTimeout(() => removeNotification(id), autoRemoveDelay);
    }

    return id;
  }, [removeNotification]);

  // Handle real-time updates from spirits service
  useEffect(() => {
    if (!userId) return;

    const handleRequestUpdate = (update) => {
      try {
        setConnectionStatus('connected');
        
        if (isOwner && update.type === 'new_request') {
          // Owner notification for new ultra shelf request
          const notification = shelfLogic.getRequestNotificationContent(update.request, true);
          addNotification({
            ...notification,
            actions: [
              {
                label: 'Approve',
                action: () => handleRequestAction(update.request.id, 'approve'),
                style: 'success'
              },
              {
                label: 'Deny', 
                action: () => handleRequestAction(update.request.id, 'deny'),
                style: 'danger'
              },
              {
                label: 'View Details',
                action: () => onUltraRequestUpdate?.(update.request),
                style: 'secondary'
              }
            ],
            persistent: true,
            requestData: update.request
          });
        } else if (!isOwner && update.userId === userId) {
          // Patron notification for request status update
          const notification = shelfLogic.getRequestNotificationContent(update, false);
          addNotification(notification);
          
          // Trigger callback for parent component
          onUltraRequestUpdate?.(update);
        }
      } catch (error) {
        console.error('Error handling request update:', error);
      }
    };

    // Subscribe to real-time updates
    const unsubscribe = spiritsService.subscribeToRequestUpdates(handleRequestUpdate);

    // Connection status monitoring
    setConnectionStatus('connecting');
    const connectionTimer = setTimeout(() => {
      setConnectionStatus('connected');
    }, 1000);

    return () => {
      unsubscribe();
      clearTimeout(connectionTimer);
      setConnectionStatus('disconnected');
    };
  }, [userId, isOwner, addNotification, onUltraRequestUpdate]);

  // Handle quick actions from notifications
  const handleRequestAction = async (requestId, action) => {
    try {
      await spiritsService.processUltraRequest(requestId, action);
      
      // Remove the original notification
      setNotifications(prev => prev.filter(n => n.requestData?.id !== requestId));
      
      // Add confirmation notification
      addNotification({
        title: action === 'approve' ? 'Request Approved!' : 'Request Denied',
        message: `Ultra shelf request has been ${action}ed`,
        type: action === 'approve' ? 'success' : 'warning',
        icon: action === 'approve' ? CheckCircle : AlertCircle
      });
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      addNotification({
        title: 'Action Failed',
        message: `Failed to ${action} the request. Please try again.`,
        type: 'error',
        icon: AlertCircle
      });
    }
  };

  // Quick notification API for external use
  const showNotification = useCallback((type, title, message, options = {}) => {
    return addNotification({
      type,
      title,
      message,
      icon: options.icon || getDefaultIcon(type),
      ...options
    });
  }, [addNotification]);

  // Expose notification API
  React.useImperativeHandle(React.useRef(), () => ({
    success: (title, message, options) => showNotification('success', title, message, options),
    error: (title, message, options) => showNotification('error', title, message, options),
    warning: (title, message, options) => showNotification('warning', title, message, options),
    info: (title, message, options) => showNotification('info', title, message, options),
    ultraRequest: (requestData) => {
      const notification = shelfLogic.getRequestNotificationContent(requestData, isOwner);
      return addNotification(notification);
    }
  }));

  if (notifications.length === 0) {
    return (
      <div className="fixed top-4 right-4 z-50">
        {/* Connection status indicator */}
        {connectionStatus !== 'disconnected' && (
          <div className={`
            px-3 py-1 rounded-full text-xs font-medium transition-all duration-300
            ${connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
              connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'}
          `}>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                'bg-gray-500'
              }`}></div>
              <span>
                {connectionStatus === 'connected' ? 'Live Updates' :
                 connectionStatus === 'connecting' ? 'Connecting...' :
                 'Offline'}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {/* Connection status */}
      {connectionStatus !== 'disconnected' && (
        <div className={`
          px-3 py-1 rounded-full text-xs font-medium transition-all duration-300
          ${connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
            connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'}
        `}>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              'bg-gray-500'
            }`}></div>
            <span>
              {connectionStatus === 'connected' ? 'Live Updates' :
               connectionStatus === 'connecting' ? 'Connecting...' :
               'Offline'}
            </span>
          </div>
        </div>
      )}

      {/* Notifications */}
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
          onAction={(action) => action.action()}
        />
      ))}
    </div>
  );
};

// Individual notification card component
const NotificationCard = ({ notification, onRemove, onAction }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle remove with animation
  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(onRemove, 300);
  };

  const getTypeStyles = (type) => {
    const styles = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };
    return styles[type] || styles.info;
  };

  const getIcon = () => {
    if (notification.icon) {
      const IconComponent = notification.icon;
      return <IconComponent className="h-5 w-5" />;
    }
    return getDefaultIcon(notification.type);
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isRemoving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isRemoving ? 'scale-95' : 'scale-100'}
      `}
    >
      <div className={`
        rounded-lg border p-4 shadow-lg backdrop-blur-sm
        ${getTypeStyles(notification.type)}
        ${notification.priority === 'high' ? 'ring-2 ring-purple-300 ring-opacity-50' : ''}
      `}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-sm">
                  {notification.title}
                </h4>
                {notification.priority === 'high' && (
                  <Crown className="h-4 w-4 text-purple-600" />
                )}
              </div>
              
              <p className="text-sm mt-1 opacity-90">
                {notification.message}
              </p>
              
              {/* Timestamp */}
              <div className="flex items-center mt-2 text-xs opacity-75">
                <Clock className="h-3 w-3 mr-1" />
                {notification.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={handleRemove}
            className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-black/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Actions */}
        {notification.actions && notification.actions.length > 0 && (
          <div className="mt-3 flex space-x-2">
            {notification.actions.map((action, index) => (
              <button
                key={index}
                onClick={() => onAction(action)}
                className={`
                  px-3 py-1 rounded text-xs font-medium transition-colors
                  ${action.style === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                    action.style === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' :
                    action.style === 'secondary' ? 'bg-gray-600 hover:bg-gray-700 text-white' :
                    'bg-blue-600 hover:bg-blue-700 text-white'}
                `}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get default icons
const getDefaultIcon = (type) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <AlertCircle className="h-5 w-5 text-red-600" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />
  };
  return icons[type] || icons.info;
};

export default NotificationSystem;