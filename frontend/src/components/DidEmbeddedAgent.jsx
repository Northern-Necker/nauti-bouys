/**
 * D-ID Embedded Agent Component for Nauti-Bouys
 * Integrates D-ID embedded agent with real-time lip sync and voice interaction
 */

import React, { useEffect, useRef, useState } from 'react';

const DidEmbeddedAgent = ({ 
  width = "100%", 
  height = "600", 
  className = "",
  onLoad = () => {},
  onError = () => {},
  showInstructions = true 
}) => {
  const iframeRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Your D-ID Agent URL
  const agentUrl = "https://studio.d-id.com/agents/share?id=v2_agt_AYiJdoSm&utm_source=copy&key=WjI5dloyeGxNVzloZFhSb01ud3hNRGN5T0RjMk5qY3pPRGs1TkRjME9EVTBORFU2VlZJeGRVOUlTMU5QV1ZCVVZuQm1iVW81TlhSbw==";

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Listen for messages from the D-ID agent iframe
    const handleMessage = (event) => {
      if (event.origin === 'https://studio.d-id.com') {
        console.log('D-ID Agent message:', event.data);
        
        // Handle different message types
        switch (event.data?.type) {
          case 'agent_ready':
            console.log('D-ID Agent is ready');
            break;
          case 'conversation_start':
            console.log('Conversation started');
            break;
          case 'conversation_end':
            console.log('Conversation ended');
            break;
          default:
            console.log('Unknown message from agent:', event.data);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleIframeLoad = () => {
    console.log('D-ID Embedded Agent loaded successfully');
    setIsLoaded(true);
    setError(null);
    onLoad();
  };

  const handleIframeError = (err) => {
    console.error('D-ID Agent failed to load:', err);
    setError('Failed to load AI assistant. Please refresh the page.');
    setIsLoaded(false);
    onError(err);
  };

  return (
    <div className={`did-embedded-agent-container ${className}`}>
      {/* Agent Container */}
      <div className="relative bg-gray-50 rounded-lg overflow-hidden shadow-lg border-2 border-teal-200">
        
        {/* Loading State */}
        {!isLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading your AI assistant...</p>
              <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
            <div className="text-center p-8">
              <div className="text-red-600 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}

        {/* D-ID Agent Iframe */}
        <iframe
          ref={iframeRef}
          src={agentUrl}
          width={width}
          height={isMobile ? "500" : height}
          frameBorder="0"
          allow="camera; microphone; autoplay; encrypted-media; fullscreen"
          allowFullScreen
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          className="w-full"
          title="Nauti-Bouys AI Assistant"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
        />
      </div>

      {/* Instructions */}
      {showInstructions && (
        <div className="mt-6 space-y-4">
          {/* Usage Instructions */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-teal-800 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How to Use Your AI Assistant
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-teal-700 mb-2">🎤 Voice Chat</h4>
                <ul className="text-sm text-teal-600 space-y-1">
                  <li>• Click the microphone button to start</li>
                  <li>• Allow microphone permission</li>
                  <li>• Speak naturally to the avatar</li>
                  <li>• Watch the lip-sync animation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-teal-700 mb-2">💬 Text Chat</h4>
                <ul className="text-sm text-teal-600 space-y-1">
                  <li>• Use the text input box</li>
                  <li>• Type your questions</li>
                  <li>• Press Enter to send</li>
                  <li>• Watch the animated response</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sample Questions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Try These Questions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-blue-700 mb-2">🍹 Cocktails</h4>
                <div className="text-sm text-blue-600 space-y-1">
                  <p>"What's your signature cocktail?"</p>
                  <p>"Recommend a rum drink"</p>
                  <p>"What goes with seafood?"</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-blue-700 mb-2">🥃 Spirits</h4>
                <div className="text-sm text-blue-600 space-y-1">
                  <p>"Show me premium bourbon"</p>
                  <p>"What whiskey do you recommend?"</p>
                  <p>"Tell me about your gin selection"</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-blue-700 mb-2">📅 Reservations</h4>
                <div className="text-sm text-blue-600 space-y-1">
                  <p>"Make a reservation"</p>
                  <p>"Waterfront seating options?"</p>
                  <p>"Private dining available?"</p>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Info */}
          <div className="bg-gray-100 rounded-lg p-4">
            <details className="cursor-pointer">
              <summary className="text-sm font-semibold text-gray-700">🔧 Technical Information</summary>
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <p><strong>Agent ID:</strong> v2_agt_AYiJdoSm</p>
                <p><strong>Features:</strong> Real-time lip sync, voice recognition, maritime knowledge</p>
                <p><strong>Browser Requirements:</strong> Modern browser with microphone support</p>
                <p><strong>Permissions:</strong> Microphone access required for voice chat</p>
                <p><strong>Status:</strong> {isLoaded ? '✅ Loaded' : '⏳ Loading...'}</p>
              </div>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

export default DidEmbeddedAgent;