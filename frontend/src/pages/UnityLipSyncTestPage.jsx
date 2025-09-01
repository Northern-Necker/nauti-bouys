import React, { useState, useEffect, useRef } from 'react';
import { Unity, useUnityContext } from 'react-unity-webgl';

/**
 * Unity WebGL ActorCore Lip-Sync Test Page
 * Tests all 91 morph targets including tongue morphs that Three.js can't access
 */
const UnityLipSyncTestPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [morphCount, setMorphCount] = useState('-');
  const [tongueStatus, setTongueStatus] = useState('-');
  const [deviceProfile, setDeviceProfile] = useState('Desktop');
  const [fps, setFps] = useState('-');
  const [globalIntensity, setGlobalIntensity] = useState(0.85);
  const [customText, setCustomText] = useState('The quick brown fox jumps over the lazy dog');

  // Note: Update these paths to match your actual Unity build location
  const { unityProvider, sendMessage, addEventListener, removeEventListener, isLoaded: unityLoaded } = useUnityContext({
    loaderUrl: "/unity-build/Build/unity-build.loader.js",
    dataUrl: "/unity-build/Build/unity-build.data",
    frameworkUrl: "/unity-build/Build/unity-build.framework.js",
    codeUrl: "/unity-build/Build/unity-build.wasm",
  });

  useEffect(() => {
    // Unity ready callback
    const handleUnityReady = () => {
      setIsLoaded(true);
      console.log('✅ Unity WebGL is ready!');
      sendMessage('LipSyncController', 'ValidateTongueMorphs');
    };

    // Morph debug info callback
    const handleMorphDebugInfo = (info) => {
      console.log('Morph Debug Info:', info);
      
      if (info.includes('Total morphs:')) {
        const match = info.match(/Total morphs: (\d+)/);
        if (match) setMorphCount(match[1]);
      }
      
      if (info.includes('Tongue morphs accessible:')) {
        setTongueStatus('✅ Accessible');
      }
    };

    // Performance metrics callback
    const handlePerformanceMetrics = (metrics) => {
      setFps(`${metrics.fps.toFixed(1)} FPS`);
      if (metrics.profile) setDeviceProfile(metrics.profile);
    };

    // Register callbacks
    window.unityReadyCallback = handleUnityReady;
    window.unityMorphDebugCallback = handleMorphDebugInfo;
    window.unityPerformanceCallback = handlePerformanceMetrics;

    addEventListener('UnityReady', handleUnityReady);
    addEventListener('MorphDebugInfo', handleMorphDebugInfo);

    return () => {
      removeEventListener('UnityReady', handleUnityReady);
      removeEventListener('MorphDebugInfo', handleMorphDebugInfo);
    };
  }, [addEventListener, removeEventListener, sendMessage]);

  // Device detection
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIPad = /ipad|macintosh/i.test(userAgent) && 'ontouchend' in document;
    const isSurface = /windows nt/i.test(userAgent) && navigator.maxTouchPoints > 0;
    
    if (isIPad) setDeviceProfile('iPad Pro');
    else if (isSurface) setDeviceProfile('Surface Pro');
    else setDeviceProfile('Desktop');
  }, []);

  // Test functions
  const testViseme = (viseme) => {
    if (!isLoaded) {
      alert('Unity is not ready yet. Please wait...');
      return;
    }

    console.log(`Testing viseme: ${viseme}`);
    
    const visemeData = {
      viseme: viseme,
      intensity: viseme === 'PP' ? 1.0 : 1.0, // PP will be multiplied by 0.5 internally
      time: Date.now()
    };
    
    sendMessage('LipSyncController', 'OnVisemeData', JSON.stringify(visemeData));
  };

  const testAllTongueMorphs = () => {
    if (!isLoaded) return;
    
    const sequence = ['DD', 'nn', 'RR', 'TH'];
    let index = 0;
    
    const interval = setInterval(() => {
      if (index >= sequence.length) {
        clearInterval(interval);
        setTimeout(() => testViseme('sil'), 1000);
        return;
      }
      
      testViseme(sequence[index]);
      index++;
    }, 2000);
  };

  const testSentence = () => {
    if (!isLoaded) return;
    
    const sequence = [
      { viseme: 'H', delay: 0 },
      { viseme: 'E', delay: 100 },
      { viseme: 'L', delay: 200 },
      { viseme: 'O', delay: 300 },
      { viseme: 'sil', delay: 500 },
      { viseme: 'H', delay: 700 },
      { viseme: 'aa', delay: 800 },
      { viseme: 'U', delay: 900 },
      { viseme: 'sil', delay: 1100 },
      { viseme: 'aa', delay: 1300 },
      { viseme: 'RR', delay: 1400 },
      { viseme: 'sil', delay: 1600 },
      { viseme: 'Y', delay: 1800 },
      { viseme: 'U', delay: 1900 },
      { viseme: 'sil', delay: 2100 },
      { viseme: 'T', delay: 2300 },
      { viseme: 'O', delay: 2400 },
      { viseme: 'DD', delay: 2500 },
      { viseme: 'E', delay: 2600 },
      { viseme: 'sil', delay: 2800 }
    ];
    
    sequence.forEach(item => {
      setTimeout(() => testViseme(item.viseme), item.delay);
    });
  };

  const testCustomText = () => {
    const charToViseme = {
      'a': 'aa', 'e': 'E', 'i': 'I', 'o': 'O', 'u': 'U',
      'b': 'PP', 'p': 'PP', 'm': 'PP',
      'f': 'FF', 'v': 'FF',
      't': 'DD', 'd': 'DD', 'n': 'nn', 'l': 'DD',
      'k': 'kk', 'g': 'kk', 'c': 'kk',
      's': 'SS', 'z': 'SS',
      'r': 'RR',
      'h': 'H',
      'w': 'U',
      'y': 'I',
      ' ': 'sil'
    };
    
    const chars = customText.toLowerCase().split('');
    chars.forEach((char, index) => {
      const viseme = charToViseme[char] || 'sil';
      setTimeout(() => testViseme(viseme), index * 150);
    });
  };

  const updateIntensity = (value) => {
    setGlobalIntensity(value);
    if (isLoaded) {
      sendMessage('LipSyncController', 'SetGlobalIntensity', value.toString());
    }
  };

  // If Unity build is not available, show demo mode
  const isDemoMode = !unityProvider;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-3">🎭 Unity WebGL ActorCore Lip-Sync</h1>
          <p className="text-xl opacity-90">Full access to all 91 morph targets including tongue morphs!</p>
        </div>

        {/* Main Container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Unity Canvas */}
          <div className="relative bg-gray-900 h-[600px]">
            {!isDemoMode ? (
              <>
                <Unity 
                  unityProvider={unityProvider}
                  style={{
                    width: '100%',
                    height: '100%',
                    visibility: unityLoaded ? 'visible' : 'hidden'
                  }}
                />
                {!unityLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-lg">Loading Unity WebGL...</p>
                      <p className="text-sm opacity-70 mt-2">Initializing 91 morph targets...</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <p className="text-2xl mb-4">⚠️ Unity Build Not Found</p>
                  <p className="text-lg opacity-80">Running in Demo Mode</p>
                  <p className="text-sm opacity-60 mt-4">
                    Follow the Unity Setup Guide to build and deploy the WebGL app
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-8 bg-gray-50">
            {/* Status Panel */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">📊 System Status</h3>
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Unity Status</p>
                    <p className={`text-lg font-mono ${isLoaded || isDemoMode ? 'text-green-600' : 'text-yellow-600'}`}>
                      {isDemoMode ? '⚠️ Demo' : (isLoaded ? '✅ Ready' : '⏳ Loading')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Total Morphs</p>
                    <p className="text-lg font-mono text-gray-800">{isDemoMode ? '91' : morphCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Tongue Morphs</p>
                    <p className="text-lg font-mono text-green-600">{isDemoMode ? '✅ Simulated' : tongueStatus}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Device Profile</p>
                    <p className="text-lg font-mono text-gray-800">{deviceProfile}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">FPS</p>
                    <p className="text-lg font-mono text-gray-800">{isDemoMode ? '60 FPS' : fps}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tongue Morph Tests */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                🔬 Tongue Morph Tests <span className="text-sm font-normal text-gray-600">(Three.js Can't Access These!)</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button 
                  onClick={() => testViseme('DD')}
                  className="px-4 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all"
                >
                  DD - Tongue Tip Up
                </button>
                <button 
                  onClick={() => testViseme('nn')}
                  className="px-4 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all"
                >
                  NN - Tongue Tip Up (Soft)
                </button>
                <button 
                  onClick={() => testViseme('RR')}
                  className="px-4 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all"
                >
                  RR - Tongue Curl
                </button>
                <button 
                  onClick={() => testViseme('TH')}
                  className="px-4 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all"
                >
                  TH - Tongue Out
                </button>
              </div>
            </div>

            {/* Standard Viseme Tests */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">🎭 Standard Viseme Tests</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {['PP', 'FF', 'aa', 'E', 'I', 'O', 'U', 'SS'].map(viseme => (
                  <button 
                    key={viseme}
                    onClick={() => testViseme(viseme)}
                    className="px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all"
                  >
                    {viseme}
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity Control */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">🎛️ Intensity Control</h3>
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                <label className="block mb-2">
                  <span className="text-gray-700 font-semibold">Global Intensity: </span>
                  <span className="text-lg font-mono text-blue-600">{globalIntensity.toFixed(2)}</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05" 
                  value={globalIntensity}
                  onChange={(e) => updateIntensity(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.0</span>
                  <span>0.5</span>
                  <span>1.0</span>
                </div>
              </div>
            </div>

            {/* Test Sequences */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">🧪 Test Sequences</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button 
                  onClick={testAllTongueMorphs}
                  className="px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all"
                >
                  Test All Tongue Morphs
                </button>
                <button 
                  onClick={testSentence}
                  className="px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all"
                >
                  Test Sentence
                </button>
                <button 
                  onClick={() => {
                    const visemes = ['aa', 'E', 'I', 'O', 'U', 'PP', 'FF', 'DD', 'RR'];
                    let count = 0;
                    const interval = setInterval(() => {
                      if (count >= 50) {
                        clearInterval(interval);
                        testViseme('sil');
                        return;
                      }
                      testViseme(visemes[count % visemes.length]);
                      count++;
                    }, 100);
                  }}
                  className="px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all"
                >
                  Performance Test
                </button>
                <button 
                  onClick={() => testViseme('sil')}
                  className="px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all"
                >
                  Reset to Neutral
                </button>
              </div>
            </div>

            {/* Custom Text Test */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">💬 Custom Text Test</h3>
              <div className="flex gap-3">
                <input 
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Enter text to test lip-sync..."
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <button 
                  onClick={testCustomText}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all"
                >
                  Test Text
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnityLipSyncTestPage;
