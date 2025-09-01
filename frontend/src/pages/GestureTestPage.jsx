import React, { useState, useEffect, useRef } from 'react';
import InteractiveAvatar from '../components/avatar3d/InteractiveAvatar';
import BartenderGestureService from '../services/BartenderGestureService';
import conversationService from '../services/api/conversationService';

export default function GestureTestPage() {
  const [gestureStatus, setGestureStatus] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [avatarReady, setAvatarReady] = useState(false);
  const [selectedGesture, setSelectedGesture] = useState('welcome');
  const avatarInstanceRef = useRef(null);

  const availableGestures = [
    'welcome', 'recommend', 'present', 'approve', 'perfect', 'disapprove',
    'explain', 'confused', 'greeting', 'pour', 'shake', 'stir', 'taste', 'cheers'
  ];

  const testScenarios = [
    {
      name: 'Welcome Customer',
      message: 'Hello! Welcome to Nauti Bouys!',
      expectedGesture: 'welcome'
    },
    {
      name: 'Recommend Cocktail',
      message: 'I recommend trying our signature Old Fashioned with bourbon.',
      expectedGesture: 'recommend'
    },
    {
      name: 'Approve Choice',
      message: 'Excellent choice! That\'s one of our most popular drinks.',
      expectedGesture: 'approve'
    },
    {
      name: 'Explain Ingredients',
      message: 'This cocktail is made with premium bourbon, sugar, and aromatic bitters.',
      expectedGesture: 'explain'
    }
  ];

  useEffect(() => {
    // Update gesture status periodically
    const interval = setInterval(() => {
      if (avatarReady) {
        setGestureStatus(BartenderGestureService.getGestureStatus());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [avatarReady]);

  const handleAvatarReady = (avatarInstance) => {
    console.log('Avatar ready for gesture testing:', avatarInstance);
    avatarInstanceRef.current = avatarInstance;
    setAvatarReady(true);
    
    // Initial gesture status
    setGestureStatus(BartenderGestureService.getGestureStatus());
  };

  const testGesture = async (gestureName) => {
    if (!avatarReady) {
      addTestResult(`❌ Avatar not ready`, 'error');
      return;
    }

    try {
      addTestResult(`🧪 Testing gesture: ${gestureName}`, 'info');
      const success = await BartenderGestureService.playBartenderGesture(gestureName);
      
      if (success) {
        addTestResult(`✅ Gesture "${gestureName}" played successfully`, 'success');
      } else {
        addTestResult(`❌ Failed to play gesture "${gestureName}"`, 'error');
      }
    } catch (error) {
      addTestResult(`❌ Error testing gesture: ${error.message}`, 'error');
    }
  };

  const testConversationGesture = async (scenario) => {
    if (!avatarReady) {
      addTestResult(`❌ Avatar not ready for conversation test`, 'error');
      return;
    }

    addTestResult(`🎭 Testing scenario: ${scenario.name}`, 'info');
    addTestResult(`💬 Message: "${scenario.message}"`, 'info');
    
    try {
      // Simulate conversation gesture trigger
      BartenderGestureService.handleConversationGesture(
        scenario.message,
        'assistant',
        { conversationContext: 'test_scenario', delay: 100 }
      );
      
      addTestResult(`✅ Conversation gesture triggered for: ${scenario.name}`, 'success');
    } catch (error) {
      addTestResult(`❌ Error in conversation test: ${error.message}`, 'error');
    }
  };

  const addTestResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { 
      id: Date.now(), 
      message, 
      type, 
      timestamp 
    }]);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const testAllGestures = async () => {
    addTestResult(`🚀 Starting comprehensive gesture test`, 'info');
    
    for (const gesture of availableGestures) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait between gestures
      await testGesture(gesture);
    }
    
    addTestResult(`🏁 Comprehensive gesture test completed`, 'info');
  };

  return (
    <div className="gesture-test-page">
      <div className="test-header">
        <h1>🎭 Gesture System Test</h1>
        <p>Test and validate the Nauti Bouys avatar gesture system</p>
        
        <div className="status-panel">
          <div className="status-item">
            <strong>Avatar:</strong> {avatarReady ? '✅ Ready' : '⏳ Loading'}
          </div>
          
          {gestureStatus && (
            <>
              <div className="status-item">
                <strong>Gesturing:</strong> {gestureStatus.isGesturing ? '🎯 Active' : '😴 Idle'}
              </div>
              <div className="status-item">
                <strong>Queue:</strong> {gestureStatus.queueLength} gestures
              </div>
              {gestureStatus.currentGesture && (
                <div className="status-item">
                  <strong>Current:</strong> {gestureStatus.currentGesture.action}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="test-content">
        <div className="avatar-section">
          <h2>🤖 Interactive Avatar</h2>
          <InteractiveAvatar
            className="test-avatar"
            onAvatarReady={handleAvatarReady}
            gestureEnabled={true}
            avatarId="savannah"
          />
        </div>

        <div className="controls-section">
          <h2>🎮 Gesture Controls</h2>
          
          <div className="control-group">
            <h3>Manual Gesture Test</h3>
            <div className="gesture-selector">
              <select 
                value={selectedGesture} 
                onChange={(e) => setSelectedGesture(e.target.value)}
              >
                {availableGestures.map(gesture => (
                  <option key={gesture} value={gesture}>
                    {gesture.charAt(0).toUpperCase() + gesture.slice(1)}
                  </option>
                ))}
              </select>
              <button onClick={() => testGesture(selectedGesture)}>
                Play Gesture
              </button>
            </div>
          </div>

          <div className="control-group">
            <h3>Comprehensive Tests</h3>
            <div className="test-buttons">
              <button onClick={testAllGestures} className="test-all-btn">
                Test All Gestures
              </button>
              <button onClick={() => BartenderGestureService.stopCurrentGesture()}>
                Stop Current
              </button>
              <button onClick={() => BartenderGestureService.clearGestureQueue()}>
                Clear Queue
              </button>
            </div>
          </div>

          <div className="control-group">
            <h3>Conversation Scenarios</h3>
            <div className="scenario-tests">
              {testScenarios.map((scenario, index) => (
                <button
                  key={index}
                  onClick={() => testConversationGesture(scenario)}
                  className="scenario-btn"
                >
                  {scenario.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="results-section">
          <div className="results-header">
            <h2>📊 Test Results</h2>
            <button onClick={clearTestResults} className="clear-btn">
              Clear Results
            </button>
          </div>
          
          <div className="test-results">
            {testResults.length === 0 ? (
              <p className="no-results">No test results yet. Start testing gestures!</p>
            ) : (
              testResults.map(result => (
                <div key={result.id} className={`result-item ${result.type}`}>
                  <span className="timestamp">[{result.timestamp}]</span>
                  <span className="message">{result.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .gesture-test-page {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .test-header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
        }

        .test-header h1 {
          margin: 0 0 10px 0;
          font-size: 2rem;
        }

        .status-panel {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 15px;
          flex-wrap: wrap;
        }

        .status-item {
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
        }

        .test-content {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 20px;
          align-items: start;
        }

        .avatar-section {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
        }

        .avatar-section h2 {
          margin-top: 0;
          color: #333;
        }

        .test-avatar {
          height: 500px !important;
        }

        .controls-section {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
        }

        .controls-section h2 {
          margin-top: 0;
          color: #333;
        }

        .control-group {
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e9ecef;
        }

        .control-group:last-child {
          border-bottom: none;
        }

        .control-group h3 {
          margin: 0 0 15px 0;
          color: #495057;
          font-size: 1.1rem;
        }

        .gesture-selector {
          display: flex;
          gap: 10px;
        }

        .gesture-selector select {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 6px;
          background: white;
        }

        .test-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .scenario-tests {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        button {
          padding: 10px 16px;
          border: 1px solid #007bff;
          background: #007bff;
          color: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        button:hover {
          background: #0056b3;
          border-color: #0056b3;
        }

        .test-all-btn {
          background: #28a745;
          border-color: #28a745;
        }

        .test-all-btn:hover {
          background: #1e7e34;
          border-color: #1e7e34;
        }

        .scenario-btn {
          background: #6f42c1;
          border-color: #6f42c1;
          font-size: 12px;
          padding: 8px 12px;
        }

        .scenario-btn:hover {
          background: #5a32a3;
          border-color: #5a32a3;
        }

        .results-section {
          grid-column: 1 / -1;
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          margin-top: 20px;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .results-header h2 {
          margin: 0;
          color: #333;
        }

        .clear-btn {
          background: #dc3545;
          border-color: #dc3545;
        }

        .clear-btn:hover {
          background: #c82333;
          border-color: #c82333;
        }

        .test-results {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          background: white;
        }

        .no-results {
          text-align: center;
          color: #6c757d;
          padding: 40px;
          margin: 0;
        }

        .result-item {
          padding: 8px 12px;
          border-bottom: 1px solid #e9ecef;
          font-family: 'Courier New', monospace;
          font-size: 13px;
        }

        .result-item:last-child {
          border-bottom: none;
        }

        .result-item.success {
          background: #d4edda;
          color: #155724;
        }

        .result-item.error {
          background: #f8d7da;
          color: #721c24;
        }

        .result-item.info {
          background: #d1ecf1;
          color: #0c5460;
        }

        .timestamp {
          color: #6c757d;
          margin-right: 10px;
        }

        @media (max-width: 1200px) {
          .test-content {
            grid-template-columns: 1fr;
          }
          
          .status-panel {
            justify-content: center;
          }
          
          .scenario-tests {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}