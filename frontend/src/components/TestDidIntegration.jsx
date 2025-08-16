/**
 * D-ID Integration Test Component for Nauti-Bouys
 * Tests D-ID API connectivity and avatar generation
 */

import React, { useState, useEffect } from 'react';

const TestDidIntegration = () => {
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [talkId, setTalkId] = useState(null);

  // D-ID API configuration
  const API_KEY = import.meta.env.VITE_DID_API_KEY || 'bWV0b3JiZXJ0QGdtYWlsLmNvbQ:JAn6hh4wQ2TFoOAl-GD4F';
  const BASE_URL = 'https://api.d-id.com';

  useEffect(() => {
    // Run initial configuration test
    testConfiguration();
  }, []);

  /**
   * Test D-ID configuration
   */
  const testConfiguration = () => {
    const hasApiKey = !!API_KEY;
    const hasBaseUrl = !!BASE_URL;
    
    setTestResults({
      apiKey: hasApiKey ? 'Configured ✓' : 'Missing ✗',
      baseUrl: BASE_URL || 'Not configured',
      configValid: hasApiKey && hasBaseUrl,
      timestamp: new Date().toLocaleString()
    });
  };

  /**
   * Test API connectivity
   */
  const testConnectivity = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Testing D-ID API connectivity...');
      
      const response = await fetch(`${BASE_URL}/voices`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Basic ${API_KEY}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const voices = await response.json();
      console.log('Voices response:', voices);
      
      setTestResults(prev => ({
        ...prev,
        connectivity: 'Connected ✓',
        voiceCount: voices.length || 0,
        sampleVoices: voices.slice(0, 3),
        lastTested: new Date().toLocaleString()
      }));

    } catch (err) {
      console.error('Connectivity test failed:', err);
      setError(err.message);
      setTestResults(prev => ({
        ...prev,
        connectivity: 'Failed ✗',
        error: err.message
      }));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create test talk with Nauti-Bouys themed content
   */
  const createTestTalk = async () => {
    setIsLoading(true);
    setError(null);
    setVideoUrl(null);
    setTalkId(null);
    
    try {
      const talkData = {
        source_url: 'https://create-images-results.d-id.com/google-oauth2%7C113462408773423948924/upl_rRD1brbcRmHHnkTp_Y49oQ/image.jpeg',
        script: {
          type: 'text',
          subtitles: 'false',
          provider: {
            type: 'microsoft',
            voice_id: 'en-US-JennyNeural'
          },
          input: 'Ahoy there! Welcome to Nauti Bouys, your premier waterfront destination. I am your AI assistant, ready to help you discover our exceptional spirits, wines, and cocktails. Whether you are looking for a rare bourbon or a signature cocktail, I am here to guide you through our maritime-inspired menu. How can I assist you today?'
        },
        config: {
          fluent: true,
          pad_audio: 0,
          stitch: true,
          align_driver: true,
          sharpen: true,
          auto_match: true,
          normalization_factor: 1,
          result_format: 'mp4'
        }
      };
      
      console.log('Creating Nauti-Bouys themed talk...');
      
      const response = await fetch(`${BASE_URL}/talks`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${API_KEY}`
        },
        body: JSON.stringify(talkData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Talk creation failed: ${response.status} - ${errorText}`);
      }

      const response_data = await response.json();
      console.log('Talk created:', response_data);
      
      if (response_data.id) {
        setTalkId(response_data.id);
        setTestResults(prev => ({
          ...prev,
          talkCreated: 'Success ✓',
          talkId: response_data.id,
          status: 'Processing...'
        }));
        
        // Start polling for completion
        pollTalkStatus(response_data.id);
      }

    } catch (err) {
      console.error('Talk creation error:', err);
      setError(err.message);
      setTestResults(prev => ({
        ...prev,
        talkCreated: 'Failed ✗',
        error: err.message
      }));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Poll talk status until completion
   */
  const pollTalkStatus = async (id) => {
    let attempts = 0;
    const maxAttempts = 30;
    
    const poll = async () => {
      try {
        attempts++;
        console.log(`Checking talk status... attempt ${attempts}`);
        
        const response = await fetch(`${BASE_URL}/talks/${id}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${API_KEY}`
          }
        });

        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`);
        }

        const status_data = await response.json();
        console.log(`Talk status (attempt ${attempts}):`, status_data);
        
        setTestResults(prev => ({
          ...prev,
          status: status_data.status,
          attempts: attempts,
          lastChecked: new Date().toLocaleTimeString()
        }));
        
        if (status_data.status === 'done' && status_data.result_url) {
          setVideoUrl(status_data.result_url);
          setTestResults(prev => ({
            ...prev,
            videoGenerated: 'Success ✓',
            videoUrl: status_data.result_url,
            completedAt: new Date().toLocaleString()
          }));
          return;
        }
        
        if (status_data.status === 'error') {
          throw new Error(status_data.error || 'Talk generation failed');
        }
        
        if (attempts < maxAttempts && status_data.status !== 'done') {
          setTimeout(poll, 2000); // Poll every 2 seconds
        } else if (attempts >= maxAttempts) {
          throw new Error('Talk generation timeout after 60 seconds');
        }
        
      } catch (err) {
        console.error('Polling error:', err);
        setError(err.message);
        setTestResults(prev => ({
          ...prev,
          videoGenerated: 'Failed ✗',
          error: err.message
        }));
      }
    };
    
    poll();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-blue-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">Nauti-Bouys D-ID Integration Test</h1>
            <p className="text-teal-100 mt-2">Testing D-ID avatar integration for maritime AI assistant</p>
          </div>

          {/* Configuration Status */}
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Configuration Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <span className="font-medium text-gray-700">API Key:</span>
                <div className="text-lg font-semibold mt-1">{testResults.apiKey}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <span className="font-medium text-gray-700">Base URL:</span>
                <div className="text-sm mt-1 text-gray-600">{testResults.baseUrl}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <span className="font-medium text-gray-700">Config Valid:</span>
                <div className="text-lg font-semibold mt-1">{testResults.configValid ? '✓' : '✗'}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <span className="font-medium text-gray-700">Last Updated:</span>
                <div className="text-xs mt-1 text-gray-500">{testResults.timestamp}</div>
              </div>
            </div>
          </div>

          {/* Test Controls */}
          <div className="px-8 py-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Test Controls</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={testConnectivity}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Testing...' : 'Test API Connection'}
              </button>
              
              <button
                onClick={createTestTalk}
                disabled={isLoading || !testResults.connectivity?.includes('✓')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Creating...' : 'Create Nauti-Bouys Avatar'}
              </button>
              
              <button
                onClick={testConfiguration}
                disabled={isLoading}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:cursor-not-allowed font-medium"
              >
                Refresh Config
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mr-4"></div>
                <span className="text-lg">Processing D-ID request...</span>
                {testResults.attempts && (
                  <span className="ml-2 text-sm text-gray-600">
                    (Attempt {testResults.attempts}/30)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="text-red-800 font-semibold text-lg">Integration Error</h4>
                </div>
                <p className="text-red-700 mt-2">{error}</p>
                <div className="mt-4 text-sm text-red-600">
                  <p className="font-medium">Troubleshooting Tips:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Verify your D-ID API key is valid and active</li>
                    <li>Check your internet connection</li>
                    <li>Ensure CORS is properly configured for your domain</li>
                    <li>Try refreshing the page and testing again</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Test Results */}
          <div className="px-8 py-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Test Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Connection Results */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-800">API Connectivity</h4>
                <div className="space-y-2 text-sm">
                  {testResults.connectivity && (
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-medium">{testResults.connectivity}</span>
                    </div>
                  )}
                  {testResults.voiceCount !== undefined && (
                    <div className="flex justify-between">
                      <span>Available Voices:</span>
                      <span className="font-medium">{testResults.voiceCount}</span>
                    </div>
                  )}
                  {testResults.lastTested && (
                    <div className="flex justify-between">
                      <span>Last Tested:</span>
                      <span className="font-medium text-xs">{testResults.lastTested}</span>
                    </div>
                  )}
                </div>

                {/* Sample Voices */}
                {testResults.sampleVoices && testResults.sampleVoices.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium mb-2 text-gray-700">Sample Voices:</h5>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {testResults.sampleVoices.map((voice, index) => (
                        <div key={index} className="text-xs bg-white p-2 rounded border">
                          <strong>{voice.voice_id}</strong> - {voice.language_code} ({voice.gender})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Talk Generation Results */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-800">Avatar Generation</h4>
                <div className="space-y-2 text-sm">
                  {testResults.talkCreated && (
                    <div className="flex justify-between">
                      <span>Creation:</span>
                      <span className="font-medium">{testResults.talkCreated}</span>
                    </div>
                  )}
                  {testResults.talkId && (
                    <div className="flex justify-between">
                      <span>Talk ID:</span>
                      <span className="font-medium text-xs">{testResults.talkId}</span>
                    </div>
                  )}
                  {testResults.status && (
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-medium">{testResults.status}</span>
                    </div>
                  )}
                  {testResults.videoGenerated && (
                    <div className="flex justify-between">
                      <span>Video:</span>
                      <span className="font-medium">{testResults.videoGenerated}</span>
                    </div>
                  )}
                  {testResults.completedAt && (
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span className="font-medium text-xs">{testResults.completedAt}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Generated Video Preview */}
          {videoUrl && (
            <div className="px-8 py-8">
              <h3 className="text-2xl font-semibold mb-6 text-gray-800 text-center">🎉 Nauti-Bouys AI Avatar Generated!</h3>
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-8">
                <div className="max-w-2xl mx-auto">
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    className="w-full rounded-lg shadow-lg border-4 border-white"
                    onLoadStart={() => console.log('Video loading started')}
                    onCanPlay={() => console.log('Video ready to play')}
                    onError={(e) => console.error('Video error:', e)}
                  >
                    Your browser does not support video playback.
                  </video>
                  
                  <div className="mt-6 text-center space-y-4">
                    <p className="text-gray-600">
                      Your Nauti-Bouys AI assistant avatar is ready! This video demonstrates 
                      the D-ID integration working with your maritime-themed content.
                    </p>
                    
                    <div className="flex justify-center space-x-4">
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open Full Screen
                      </a>
                      
                      <button
                        onClick={() => navigator.clipboard.writeText(videoUrl)}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Video URL
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Integration Status Summary */}
          <div className="px-8 py-6 bg-gray-50">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Integration Status Summary</h4>
              <div className="flex justify-center space-x-8 text-sm">
                <div className="text-center">
                  <div className="font-semibold">Configuration</div>
                  <div className={testResults.configValid ? 'text-green-600' : 'text-red-600'}>
                    {testResults.configValid ? '✓ Ready' : '✗ Issues'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">API Connection</div>
                  <div className={testResults.connectivity?.includes('✓') ? 'text-green-600' : 'text-gray-400'}>
                    {testResults.connectivity?.includes('✓') ? '✓ Connected' : '○ Not Tested'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">Avatar Generation</div>
                  <div className={testResults.videoGenerated?.includes('✓') ? 'text-green-600' : 'text-gray-400'}>
                    {testResults.videoGenerated?.includes('✓') ? '✓ Working' : '○ Not Tested'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDidIntegration;