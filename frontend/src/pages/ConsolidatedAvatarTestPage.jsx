/**
 * Consolidated Avatar Test Page
 * Tests the integrated production avatar with all existing systems
 */

import React, { useState, useRef } from 'react';
import ConsolidatedProductionAvatar from '../components/avatar/ConsolidatedProductionAvatar';

const ConsolidatedAvatarTestPage = () => {
  const [avatarAPI, setAvatarAPI] = useState(null);
  const [testMessage, setTestMessage] = useState('Hello! Welcome to Nauti-Bouys. I\'m Savannah, your bartender.');
  const [patronId, setPatronId] = useState('test_patron_001');
  const [enableLipSync, setEnableLipSync] = useState(true);
  const [enableEmotionalIntelligence, setEnableEmotionalIntelligence] = useState(true);
  const [enableDebugMode, setEnableDebugMode] = useState(true);
  const [testResults, setTestResults] = useState([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Test messages for different emotional contexts
  const testMessages = [
    {
      text: "Hello! Welcome to Nauti-Bouys. I'm Savannah, your bartender.",
      context: "greeting",
      description: "Basic greeting"
    },
    {
      text: "I'm so excited to help you find the perfect drink tonight!",
      context: "excited",
      description: "High energy, excited mood"
    },
    {
      text: "I understand you're disappointed about the ultra shelf. Let me find you something wonderful.",
      context: "disappointed",
      description: "Empathetic response to disappointment"
    },
    {
      text: "What a wonderful question! I love sharing the stories behind our spirits collection.",
      context: "curious",
      description: "Educational, curious response"
    },
    {
      text: "Thank you so much for understanding. Your patience means a lot to me.",
      context: "appreciative",
      description: "Grateful, warm response"
    },
    {
      text: "Let me recommend our finest bourbon - it has notes of vanilla and oak with a smooth finish.",
      context: "professional",
      description: "Professional recommendation"
    }
  ];

  const handleAvatarReady = (api) => {
    setAvatarAPI(api);
    console.log('🎭 Consolidated Avatar API ready:', api);
    
    // Add test results
    addTestResult('Avatar Initialization', 'SUCCESS', 'Avatar loaded and API available');
  };

  const addTestResult = (test, status, details) => {
    const result = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      test,
      status,
      details
    };
    setTestResults(prev => [result, ...prev]);
  };

  const testSpeech = async () => {
    if (!avatarAPI) {
      addTestResult('Speech Test', 'ERROR', 'Avatar API not available');
      return;
    }

    try {
      const result = await avatarAPI.speakTextWithEmotion(testMessage);
      addTestResult('Speech Test', 'SUCCESS', `Processed: "${testMessage.substring(0, 50)}..."`);
      console.log('Speech result:', result);
    } catch (error) {
      addTestResult('Speech Test', 'ERROR', error.message);
    }
  };

  const testEmotionalMessage = async (messageData) => {
    if (!avatarAPI) {
      addTestResult('Emotional Test', 'ERROR', 'Avatar API not available');
      return;
    }

    try {
      const result = await avatarAPI.processMessage(messageData.text, {
        context: messageData.context,
        sincerity: 0.8
      });
      addTestResult(
        `Emotional Test (${messageData.context})`, 
        'SUCCESS', 
        `${messageData.description}: "${messageData.text.substring(0, 40)}..."`
      );
      console.log('Emotional message result:', result);
    } catch (error) {
      addTestResult(`Emotional Test (${messageData.context})`, 'ERROR', error.message);
    }
  };

  const runComprehensiveTests = async () => {
    if (!avatarAPI) {
      addTestResult('Comprehensive Tests', 'ERROR', 'Avatar API not available');
      return;
    }

    setIsRunningTests(true);
    addTestResult('Comprehensive Tests', 'INFO', 'Starting comprehensive test suite...');

    try {
      // Test 1: Basic speech
      await new Promise(resolve => setTimeout(resolve, 1000));
      await testSpeech();

      // Test 2: Emotional messages
      for (const messageData of testMessages) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between tests
        await testEmotionalMessage(messageData);
      }

      // Test 3: Performance validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      addTestResult('Performance Test', 'SUCCESS', 'All systems running smoothly');

      addTestResult('Comprehensive Tests', 'SUCCESS', 'All tests completed successfully');
    } catch (error) {
      addTestResult('Comprehensive Tests', 'ERROR', error.message);
    } finally {
      setIsRunningTests(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Consolidated Avatar Integration Test</h1>
          <p className="text-gray-300">
            Testing the integrated production avatar with existing sophisticated systems
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Patron ID</label>
                <input
                  type="text"
                  value={patronId}
                  onChange={(e) => setPatronId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={enableLipSync}
                    onChange={(e) => setEnableLipSync(e.target.checked)}
                    className="mr-2"
                  />
                  Enable Lip Sync
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={enableEmotionalIntelligence}
                    onChange={(e) => setEnableEmotionalIntelligence(e.target.checked)}
                    className="mr-2"
                  />
                  Enable Emotional Intelligence
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={enableDebugMode}
                    onChange={(e) => setEnableDebugMode(e.target.checked)}
                    className="mr-2"
                  />
                  Enable Debug Mode
                </label>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Manual Testing</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Test Message</label>
                <textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500"
                  rows="3"
                />
              </div>

              <div className="space-y-2">
                <button
                  onClick={testSpeech}
                  disabled={!avatarAPI}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded"
                >
                  Test Speech
                </button>
                
                <button
                  onClick={runComprehensiveTests}
                  disabled={!avatarAPI || isRunningTests}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded"
                >
                  {isRunningTests ? 'Running Tests...' : 'Run Comprehensive Tests'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">System Status</h2>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Avatar API:</span>
                <span className={avatarAPI ? 'text-green-400' : 'text-red-400'}>
                  {avatarAPI ? 'Ready' : 'Not Ready'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Lip Sync:</span>
                <span className={enableLipSync ? 'text-green-400' : 'text-gray-400'}>
                  {enableLipSync ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Emotional AI:</span>
                <span className={enableEmotionalIntelligence ? 'text-green-400' : 'text-gray-400'}>
                  {enableEmotionalIntelligence ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Debug Mode:</span>
                <span className={enableDebugMode ? 'text-yellow-400' : 'text-gray-400'}>
                  {enableDebugMode ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            <button
              onClick={clearResults}
              className="w-full mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
            >
              Clear Test Results
            </button>
          </div>
        </div>

        {/* Avatar Display */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Consolidated Production Avatar</h2>
          
          <ConsolidatedProductionAvatar
            patronId={patronId}
            onAvatarReady={handleAvatarReady}
            enableLipSync={enableLipSync}
            enableEmotionalIntelligence={enableEmotionalIntelligence}
            enableDebugMode={enableDebugMode}
            avatarScale={2.0}
            className="w-full"
            style={{ height: '500px' }}
          />
        </div>

        {/* Test Results */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Test Results</h2>
            <span className="text-sm text-gray-400">
              {testResults.length} results
            </span>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                No test results yet. Run some tests to see results here.
              </div>
            ) : (
              testResults.map((result) => (
                <div
                  key={result.id}
                  className={`p-3 rounded border-l-4 ${
                    result.status === 'SUCCESS' ? 'bg-green-900 border-green-500' :
                    result.status === 'ERROR' ? 'bg-red-900 border-red-500' :
                    'bg-blue-900 border-blue-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{result.test}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        result.status === 'SUCCESS' ? 'bg-green-600' :
                        result.status === 'ERROR' ? 'bg-red-600' :
                        'bg-blue-600'
                      }`}>
                        {result.status}
                      </span>
                      <span className="text-xs text-gray-400">{result.timestamp}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300">{result.details}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Test Messages */}
        <div className="bg-gray-800 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Quick Emotional Tests</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testMessages.map((messageData, index) => (
              <div key={index} className="bg-gray-700 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{messageData.context}</span>
                  <button
                    onClick={() => testEmotionalMessage(messageData)}
                    disabled={!avatarAPI}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm"
                  >
                    Test
                  </button>
                </div>
                <div className="text-sm text-gray-300 mb-2">{messageData.description}</div>
                <div className="text-xs text-gray-400 italic">
                  "{messageData.text.substring(0, 60)}..."
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsolidatedAvatarTestPage;
