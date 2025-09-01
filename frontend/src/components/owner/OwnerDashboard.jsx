/**
 * Owner Dashboard Component - Ultra Shelf Authorization Interface
 * Real-time management of ultra shelf access requests
 */

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import spiritsService from '../../services/spiritsService';
import shelfLogic from '../../utils/shelfLogic';

const OwnerDashboard = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeAuthorizations, setActiveAuthorizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [stats, setStats] = useState({
    totalRequests: 0,
    approvedToday: 0,
    deniedToday: 0,
    activeAuthorizations: 0
  });

  // Load initial data
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [requests, authorizations] = await Promise.all([
        spiritsService.getPendingRequests(),
        spiritsService.getActiveAuthorizations?.() || Promise.resolve([])
      ]);
      
      setPendingRequests(requests.pending || []);
      setActiveAuthorizations(authorizations || []);
      
      // Calculate stats
      const today = new Date().toDateString();
      const todayRequests = requests.all?.filter(r => 
        new Date(r.createdAt).toDateString() === today
      ) || [];
      
      setStats({
        totalRequests: requests.all?.length || 0,
        approvedToday: todayRequests.filter(r => r.status === 'approved').length,
        deniedToday: todayRequests.filter(r => r.status === 'denied').length,
        activeAuthorizations: authorizations?.length || 0
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle real-time updates
  useEffect(() => {
    loadDashboardData();
    
    // Subscribe to real-time updates
    const unsubscribe = spiritsService.subscribeToRequestUpdates((update) => {
      if (update.type === 'new_request') {
        setPendingRequests(prev => [update.request, ...prev]);
        toast.success(`New ultra shelf request from ${update.request.userName}`, {
          duration: 5000,
          icon: '🚨'
        });
      } else if (update.type === 'request_processed') {
        setPendingRequests(prev => prev.filter(r => r.id !== update.requestId));
        if (update.action === 'approved') {
          setActiveAuthorizations(prev => [update.authorization, ...prev]);
        }
      }
    });

    return unsubscribe;
  }, [loadDashboardData]);

  // Process ultra shelf request
  const processRequest = async (requestId, action, message = '') => {
    if (processingIds.has(requestId)) return;
    
    setProcessingIds(prev => new Set(prev).add(requestId));
    
    try {
      await spiritsService.processUltraRequest(requestId, action, message);
      
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      
      const request = pendingRequests.find(r => r.id === requestId);
      const actionText = action === 'approve' ? 'approved' : 'denied';
      const actionIcon = action === 'approve' ? '✅' : '❌';
      
      toast.success(
        `${actionIcon} ${request?.spiritName} request ${actionText} for ${request?.userName}`,
        { duration: 4000 }
      );
      
      // Refresh stats
      loadDashboardData();
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      toast.error(`Failed to ${action} request`);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  // Revoke authorization
  const revokeAuthorization = async (authId) => {
    try {
      await spiritsService.revokeAuthorization?.(authId);
      setActiveAuthorizations(prev => prev.filter(a => a.id !== authId));
      toast.success('Authorization revoked');
    } catch (error) {
      console.error('Error revoking authorization:', error);
      toast.error('Failed to revoke authorization');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading captain's dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Captain's Dashboard ⚓
          </h1>
          <p className="text-gray-600">
            Manage ultra shelf access and monitor your treasure vault
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Pending Requests"
            value={pendingRequests.length}
            icon="⏳"
            color="yellow"
            urgent={pendingRequests.length > 0}
          />
          <StatCard
            title="Active Authorizations"
            value={stats.activeAuthorizations}
            icon="🔑"
            color="green"
          />
          <StatCard
            title="Approved Today"
            value={stats.approvedToday}
            icon="✅"
            color="blue"
          />
          <StatCard
            title="Total Requests"
            value={stats.totalRequests}
            icon="📊"
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Requests */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="mr-2">🚨</span>
                Pending Ultra Shelf Requests
                {pendingRequests.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-600 text-sm px-2 py-1 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </h2>
            </div>
            
            <div className="p-6">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl mb-2 block">🌊</span>
                  <p>All quiet on the western front!</p>
                  <p className="text-sm">No pending ultra shelf requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onApprove={() => processRequest(request.id, 'approve')}
                      onDeny={() => processRequest(request.id, 'deny')}
                      isProcessing={processingIds.has(request.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Authorizations */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="mr-2">🔑</span>
                Active Authorizations
              </h2>
            </div>
            
            <div className="p-6">
              {activeAuthorizations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl mb-2 block">🏴‍☠️</span>
                  <p>No active ultra shelf access</p>
                  <p className="text-sm">All treasures secured</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeAuthorizations.map((auth) => (
                    <AuthorizationCard
                      key={auth.id}
                      authorization={auth}
                      onRevoke={() => revokeAuthorization(auth.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stats Card Component
const StatCard = ({ title, value, icon, color, urgent = false }) => {
  const colorClasses = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800'
  };

  return (
    <div className={`
      p-6 rounded-lg border-2 transition-all duration-200
      ${urgent ? 'ring-2 ring-red-300 animate-pulse' : ''}
      ${colorClasses[color]}
    `}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
};

// Request Card Component
const RequestCard = ({ request, onApprove, onDeny, isProcessing }) => {
  const timeSince = new Date(request.createdAt || Date.now());
  const timeString = timeSince.toLocaleTimeString();

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <span className="text-lg mr-2">👤</span>
            <h3 className="font-semibold text-gray-900">
              {request.userName || 'Anonymous Patron'}
            </h3>
            <span className="ml-2 text-sm text-gray-500">at {timeString}</span>
          </div>
          <div className="flex items-center mb-2">
            <span className="text-lg mr-2">💎</span>
            <span className="font-medium text-purple-700">{request.spiritName}</span>
          </div>
          {request.message && (
            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded italic">
              "{request.message}"
            </p>
          )}
        </div>
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={onApprove}
          disabled={isProcessing}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 
                   text-white px-4 py-2 rounded-md font-medium transition-colors
                   disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : '✅ Approve'}
        </button>
        <button
          onClick={onDeny}
          disabled={isProcessing}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 
                   text-white px-4 py-2 rounded-md font-medium transition-colors
                   disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : '❌ Deny'}
        </button>
      </div>
    </div>
  );
};

// Authorization Card Component
const AuthorizationCard = ({ authorization, onRevoke }) => {
  const grantedDate = new Date(authorization.grantedAt || Date.now());
  const daysSince = Math.floor((Date.now() - grantedDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <span className="text-lg mr-2">👤</span>
            <h3 className="font-semibold text-gray-900">{authorization.userName}</h3>
            <span className="ml-2 text-sm text-green-600 bg-green-200 px-2 py-1 rounded">
              Ultra Access ✓
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Granted {daysSince === 0 ? 'today' : `${daysSince} days ago`}
          </p>
        </div>
        <button
          onClick={onRevoke}
          className="text-red-600 hover:text-red-800 text-sm font-medium
                   border border-red-300 hover:border-red-400 px-3 py-1 rounded
                   transition-colors"
        >
          Revoke
        </button>
      </div>
    </div>
  );
};

export default OwnerDashboard;