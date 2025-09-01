/**
 * Multi-Avatar AI Assistant Page
 * Main page for the scalable AI Assistant system with avatar selection
 */

import React, { useState, useEffect } from 'react';
import MultiAvatarAIAssistant from '../components/ai-assistant/MultiAvatarAIAssistant';
import { getAvailableAvatars, getAvatarStats } from '../utils/avatarManager';

export default function MultiAvatarAIPage() {
  const [availableAvatars, setAvailableAvatars] = useState([]);
  const [avatarStats, setAvatarStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // Get available avatars (including coming soon for demo purposes)
      const avatars = getAvailableAvatars(true);
      const stats = getAvatarStats();
      
      setAvailableAvatars(avatars.map(avatar => avatar.id));
      setAvatarStats(stats);
      setLoading(false);
    } catch (err) {
      console.error('Error loading avatars:', err);
      setError('Failed to load avatar system');
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="multi-avatar-ai-page loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Loading AI Assistant...</h2>
          <p>Preparing your personalized avatar experience</p>
        </div>
        
        <style jsx>{`
          .multi-avatar-ai-page.loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }

          .loading-container {
            text-align: center;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
          }

          .loading-spinner {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .loading-container h2 {
            margin: 0 0 10px 0;
            font-size: 24px;
          }

          .loading-container p {
            margin: 0;
            opacity: 0.8;
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="multi-avatar-ai-page error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>System Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
        
        <style jsx>{`
          .multi-avatar-ai-page.error {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: #f8f9fa;
          }

          .error-container {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            max-width: 400px;
          }

          .error-icon {
            font-size: 48px;
            margin-bottom: 20px;
          }

          .error-container h2 {
            color: #dc3545;
            margin: 0 0 15px 0;
          }

          .error-container p {
            color: #6c757d;
            margin: 0 0 25px 0;
          }

          .error-container button {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.2s;
          }

          .error-container button:hover {
            background: #0056b3;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="multi-avatar-ai-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Nauti-Bouys AI Assistant</h1>
          <p>Choose your personalized AI bartender and sommelier</p>
          
          {avatarStats && (
            <div className="stats-bar">
              <div className="stat">
                <span className="stat-number">{avatarStats.active}</span>
                <span className="stat-label">Active Avatars</span>
              </div>
              <div className="stat">
                <span className="stat-number">{avatarStats.roles.length}</span>
                <span className="stat-label">Specialties</span>
              </div>
              <div className="stat">
                <span className="stat-number">{avatarStats.comingSoon}</span>
                <span className="stat-label">Coming Soon</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="assistant-container">
        <MultiAvatarAIAssistant
          availableAvatars={availableAvatars}
          allowAvatarSelection={true}
          defaultAvatar="savannah"
        />
      </div>

      <style jsx>{`
        .multi-avatar-ai-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        .page-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }

        .header-content h1 {
          margin: 0 0 10px 0;
          font-size: 2.5rem;
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .header-content p {
          margin: 0 0 30px 0;
          font-size: 1.2rem;
          opacity: 0.9;
        }

        .stats-bar {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin-top: 20px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 15px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          min-width: 100px;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .assistant-container {
          background: white;
          margin: -20px 20px 20px;
          border-radius: 20px 20px 0 0;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          min-height: calc(100vh - 200px);
        }

        @media (max-width: 768px) {
          .header-content h1 {
            font-size: 2rem;
          }

          .header-content p {
            font-size: 1rem;
          }

          .stats-bar {
            flex-direction: column;
            gap: 15px;
            align-items: center;
          }

          .stat {
            min-width: 80px;
          }

          .assistant-container {
            margin: -20px 10px 10px;
            border-radius: 15px 15px 0 0;
          }
        }

        @media (max-width: 480px) {
          .page-header {
            padding: 30px 15px;
          }

          .header-content h1 {
            font-size: 1.8rem;
          }

          .stats-bar {
            flex-direction: row;
            gap: 20px;
          }

          .stat {
            min-width: 70px;
            padding: 10px;
          }

          .stat-number {
            font-size: 1.5rem;
          }

          .stat-label {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}
