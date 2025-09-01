import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Unity, useUnityContext } from 'react-unity-webgl';

/**
 * Unity WebGL Avatar Component with ActorCore FBX Lip-Sync
 * Provides full access to all 91 morph targets including tongue morphs
 */
const UnityWebGLAvatar = ({ 
  buildUrl = '/unity-build',
  width = '100%',
  height = '600px',
  onReady,
  debugMode = false 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [lipSyncReady, setLipSyncReady] = useState(false);
  const [currentViseme, setCurrentViseme] = useState('sil');
  const unityRef = useRef(null);
  
  // Unity WebGL context configuration
  const { unityProvider, isLoaded: unityLoaded, loadingProgression, sendMessage } = useUnityContext({
    loaderUrl: `${buildUrl}/Build/unity-webgl-lipsync.loader.js`,
    dataUrl: `${buildUrl}/Build/unity-webgl-lipsync.data`,
    frameworkUrl: `${buildUrl}/Build/unity-webgl-lipsync.framework.js`,
    codeUrl: `${buildUrl}/Build/unity-webgl-lipsync.wasm`,
    streamingAssetsUrl: `${buildUrl}/StreamingAssets`,
    companyName: 'NautiBouys',
    productName: 'ActorCoreLipSync',
    productVersion: '1.0.0',
  });

  /**
   * Initialize Unity lip-sync system
   */
  useEffect(() => {
    if (!unityLoaded) return;

    // Set up Unity ready callback
    window.onUnityLipSyncReady = () => {
      console.log('[UnityWebGLAvatar] Lip-sync system ready');
      setLipSyncReady(true);
      
      // Apply device optimization
      sendMessage('LipSyncManager', 'ApplyDeviceOptimization');
      
      if (onReady) {
        onReady({
          setViseme: setVisemeFromReact,
          sendTTSData: sendTTSDataFromReact,
          setIntensity: setIntensityFromReact,
          supportsTongueMorphs: true,
          morphTargetCount: 91
        });
      }
    };

    // Listen for Unity events
    window.addEventListener('unityLipSyncReady', handleLipSyncReady);

    setIsLoaded(true);

    return () => {
      window.removeEventListener('unityLipSyncReady', handleLipSyncReady);
      delete window.onUnityLipSyncReady;
    };
  }, [unityLoaded, sendMessage, onReady]);

  /**
   * Handle lip-sync ready event from Unity
   */
  const handleLipSyncReady = useCallback((event) => {
    console.log('[UnityWebGLAvatar] Received lip-sync ready event:', event.detail);
    setLipSyncReady(true);
  }, []);

  /**
   * Set viseme from React
   */
  const setVisemeFromReact = useCallback((viseme) => {
    if (!lipSyncReady) {
      console.warn('[UnityWebGLAvatar] Lip-sync not ready yet');
      return;
    }

    if (window.setUnityViseme) {
      window.setUnityViseme(viseme);
      setCurrentViseme(viseme);
      
      if (debugMode) {
        console.log(`[UnityWebGLAvatar] Set viseme: ${viseme}`);
      }
    } else {
      console.error('[UnityWebGLAvatar] Unity bridge not available');
    }
  }, [lipSyncReady, debugMode]);

  /**
   * Send TTS data with viseme timestamps
   */
  const sendTTSDataFromReact = useCallback((ttsData) => {
    if (!lipSyncReady) {
      console.warn('[UnityWebGLAvatar] Lip-sync not ready yet');
      return;
    }

    if (window.sendTTSToUnity) {
      // Ensure proper format
      const formattedData = {
        visemes: ttsData.visemes || [],
        duration: ttsData.duration || 0
      };
      
      window.sendTTSToUnity(formattedData);
      
      if (debugMode) {
        console.log(`[UnityWebGLAvatar] Sent TTS data with ${formattedData.visemes.length} visemes`);
      }
    } else {
      console.error('[UnityWebGLAvatar] Unity bridge not available');
    }
  }, [lipSyncReady, debugMode]);

  /**
   * Set global intensity multiplier
   */
  const setIntensityFromReact = useCallback((intensity) => {
    if (!lipSyncReady) {
      console.warn('[UnityWebGLAvatar] Lip-sync not ready yet');
      return;
    }

    if (window.setUnityIntensity) {
      const clampedIntensity = Math.max(0, Math.min(1, intensity));
      window.setUnityIntensity(clampedIntensity);
      
      if (debugMode) {
        console.log(`[UnityWebGLAvatar] Set intensity: ${clampedIntensity}`);
      }
    } else {
      console.error('[UnityWebGLAvatar] Unity bridge not available');
    }
  }, [lipSyncReady, debugMode]);

  /**
   * Process TTS response and apply lip-sync
   */
  const processTTSResponse = useCallback(async (text, voice = 'en-US-JennyNeural') => {
    try {
      // Call TTS API
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, includeVisemes: true })
      });

      const data = await response.json();
      
      if (data.visemes) {
        // Send viseme data to Unity
        sendTTSDataFromReact(data);
        
        // Play audio
        if (data.audioUrl) {
          const audio = new Audio(data.audioUrl);
          audio.play();
        }
      }
    } catch (error) {
      console.error('[UnityWebGLAvatar] Error processing TTS:', error);
    }
  }, [sendTTSDataFromReact]);

  /**
   * Render loading state
   */
  if (!unityLoaded) {
    return (
      <div className="unity-loading" style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a' }}>
        <div className="loading-content" style={{ textAlign: 'center', color: 'white' }}>
          <div className="loading-spinner" style={{ marginBottom: '20px' }}>
            <div className="spinner" style={{
              border: '4px solid rgba(255,255,255,0.3)',
              borderTop: '4px solid white',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
          </div>
          <p>Loading Unity WebGL Avatar...</p>
          <p style={{ fontSize: '14px', opacity: 0.7 }}>
            {Math.round(loadingProgression * 100)}% complete
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="unity-webgl-avatar" style={{ width, height, position: 'relative' }}>
      <Unity 
        unityProvider={unityProvider}
        style={{ width: '100%', height: '100%' }}
        ref={unityRef}
      />
      
      {debugMode && (
        <div className="debug-panel" style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          maxWidth: '200px'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Unity Lip-Sync Debug</h4>
          <div>Status: {lipSyncReady ? '✅ Ready' : '⏳ Loading'}</div>
          <div>Current Viseme: {currentViseme}</div>
          <div>Morph Targets: 91</div>
          <div>Tongue Morphs: ✅ Supported</div>
          
          <div style={{ marginTop: '10px' }}>
            <h5 style={{ margin: '5px 0' }}>Test Visemes:</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
              {['sil', 'PP', 'FF', 'TH', 'DD', 'kk', 'CH', 'SS', 'nn', 'RR', 'aa', 'E', 'I', 'O', 'U'].map(viseme => (
                <button
                  key={viseme}
                  onClick={() => setVisemeFromReact(viseme)}
                  style={{
                    padding: '2px 5px',
                    fontSize: '10px',
                    backgroundColor: currentViseme === viseme ? '#4CAF50' : '#333',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  {viseme}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ marginTop: '10px' }}>
            <h5 style={{ margin: '5px 0' }}>Test Phrases:</h5>
            <button
              onClick={() => processTTSResponse('Hello, I am your AI bartender assistant!')}
              style={{
                width: '100%',
                padding: '5px',
                fontSize: '11px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                marginBottom: '5px'
              }}
            >
              Test Greeting
            </button>
            <button
              onClick={() => processTTSResponse('The tongue morphs are now working correctly.')}
              style={{
                width: '100%',
                padding: '5px',
                fontSize: '11px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Test Tongue Morphs
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnityWebGLAvatar;
