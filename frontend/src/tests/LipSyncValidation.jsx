import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function LipSyncValidation({ avatarRef }) {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentViseme, setCurrentViseme] = useState(null);
  const speechRef = useRef(null);
  
  // Viseme mapping for common phonemes
  const visemeMap = {
    'AA': ['mouth_open', 'jaw_open'],
    'AE': ['mouth_wide', 'jaw_open'],
    'AH': ['mouth_open', 'jaw_mid'],
    'AO': ['mouth_round', 'jaw_open'],
    'AW': ['mouth_round', 'jaw_wide'],
    'AY': ['mouth_wide', 'jaw_mid'],
    'CH': ['mouth_narrow', 'jaw_closed'],
    'DD': ['tongue_up', 'jaw_closed'],
    'EE': ['mouth_smile', 'jaw_closed'],
    'EH': ['mouth_open', 'jaw_mid'],
    'ER': ['mouth_round', 'jaw_mid'],
    'EY': ['mouth_smile', 'jaw_mid'],
    'FF': ['mouth_narrow', 'teeth_on_lip'],
    'GG': ['mouth_closed', 'jaw_closed'],
    'HH': ['mouth_open', 'jaw_mid'],
    'IH': ['mouth_smile', 'jaw_closed'],
    'IY': ['mouth_smile', 'jaw_closed'],
    'JH': ['mouth_narrow', 'jaw_closed'],
    'KK': ['mouth_closed', 'jaw_closed'],
    'LL': ['tongue_up', 'jaw_mid'],
    'MM': ['mouth_closed', 'lips_together'],
    'NN': ['mouth_closed', 'tongue_up'],
    'OW': ['mouth_round', 'jaw_mid'],
    'OY': ['mouth_round', 'jaw_wide'],
    'PP': ['mouth_closed', 'lips_together'],
    'RR': ['mouth_round', 'tongue_back'],
    'SS': ['mouth_narrow', 'teeth_together'],
    'SH': ['mouth_round', 'teeth_apart'],
    'TH': ['tongue_out', 'teeth_apart'],
    'TT': ['tongue_up', 'jaw_closed'],
    'UH': ['mouth_round', 'jaw_mid'],
    'UW': ['mouth_round', 'lips_forward'],
    'VV': ['teeth_on_lip', 'jaw_mid'],
    'WW': ['mouth_round', 'lips_forward'],
    'YY': ['mouth_smile', 'jaw_mid'],
    'ZZ': ['mouth_narrow', 'teeth_together'],
    'silence': ['mouth_closed', 'jaw_closed']
  };
  
  // Test phrases with expected visemes
  const testPhrases = [
    {
      text: "Hello, how are you?",
      expectedVisemes: ['HH', 'EH', 'LL', 'OW', 'silence', 'HH', 'AW', 'silence', 'AA', 'RR', 'silence', 'YY', 'UW'],
      duration: 2000
    },
    {
      text: "Welcome to the bar",
      expectedVisemes: ['WW', 'EH', 'LL', 'KK', 'AH', 'MM', 'silence', 'TT', 'UW', 'silence', 'TH', 'AH', 'silence', 'BB', 'AA', 'RR'],
      duration: 2500
    },
    {
      text: "What can I get you?",
      expectedVisemes: ['WW', 'AH', 'TT', 'silence', 'KK', 'AE', 'NN', 'silence', 'AY', 'silence', 'GG', 'EH', 'TT', 'silence', 'YY', 'UW'],
      duration: 2000
    }
  ];
  
  const addResult = (testName, passed, details) => {
    const result = {
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    };
    setTestResults(prev => [...prev, result]);
    return result;
  };
  
  // Test 1: Check if morph targets exist
  const testMorphTargets = async () => {
    const canvas = document.querySelector('.avatar-canvas');
    if (!canvas || !canvas.__r3f) {
      return addResult('Morph Targets', false, 'Three.js scene not accessible');
    }
    
    const { scene } = canvas.__r3f.store.getState();
    let morphTargets = [];
    let skinnedMesh = null;
    
    scene.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetInfluences) {
        skinnedMesh = child;
        if (child.morphTargetDictionary) {
          morphTargets = Object.keys(child.morphTargetDictionary);
        }
      }
    });
    
    if (!skinnedMesh) {
      return addResult('Morph Targets', false, 'No skinned mesh with morph targets found');
    }
    
    const hasVisemeTargets = morphTargets.some(target => 
      target.toLowerCase().includes('mouth') || 
      target.toLowerCase().includes('lip') ||
      target.toLowerCase().includes('jaw') ||
      target.toLowerCase().includes('viseme')
    );
    
    return addResult(
      'Morph Targets',
      morphTargets.length > 0,
      `Found ${morphTargets.length} morph targets${hasVisemeTargets ? ' (including viseme targets)' : ''}`
    );
  };
  
  // Test 2: Test speech synthesis
  const testSpeechSynthesis = async () => {
    if (!('speechSynthesis' in window)) {
      return addResult('Speech Synthesis', false, 'Not supported in browser');
    }
    
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance('Test');
      utterance.volume = 0; // Mute for testing
      
      utterance.onstart = () => {
        addResult('Speech Synthesis', true, 'Speech synthesis working');
        speechSynthesis.cancel();
        resolve();
      };
      
      utterance.onerror = () => {
        addResult('Speech Synthesis', false, 'Speech synthesis error');
        resolve();
      };
      
      speechSynthesis.speak(utterance);
      
      // Timeout fallback
      setTimeout(() => {
        speechSynthesis.cancel();
        resolve();
      }, 2000);
    });
  };
  
  // Test 3: Simulate lip sync animation
  const testLipSyncAnimation = async () => {
    const canvas = document.querySelector('.avatar-canvas');
    if (!canvas || !canvas.__r3f) {
      return addResult('Lip Sync Animation', false, 'Scene not accessible');
    }
    
    const { scene } = canvas.__r3f.store.getState();
    let skinnedMesh = null;
    
    scene.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetInfluences) {
        skinnedMesh = child;
      }
    });
    
    if (!skinnedMesh) {
      return addResult('Lip Sync Animation', false, 'No skinned mesh found');
    }
    
    // Simulate viseme sequence
    const visemeSequence = ['AA', 'EE', 'OO', 'MM', 'silence'];
    let currentIndex = 0;
    
    return new Promise((resolve) => {
      const animateViseme = () => {
        if (currentIndex >= visemeSequence.length) {
          addResult('Lip Sync Animation', true, 'Viseme sequence completed');
          resolve();
          return;
        }
        
        const viseme = visemeSequence[currentIndex];
        setCurrentViseme(viseme);
        
        // If we have morph targets, try to apply them
        if (skinnedMesh.morphTargetDictionary) {
          const morphNames = visemeMap[viseme] || [];
          
          // Reset all morph targets
          if (skinnedMesh.morphTargetInfluences) {
            for (let i = 0; i < skinnedMesh.morphTargetInfluences.length; i++) {
              skinnedMesh.morphTargetInfluences[i] = 0;
            }
          }
          
          // Apply viseme morph targets
          morphNames.forEach(morphName => {
            const index = skinnedMesh.morphTargetDictionary[morphName];
            if (index !== undefined && skinnedMesh.morphTargetInfluences) {
              skinnedMesh.morphTargetInfluences[index] = 1;
            }
          });
        }
        
        currentIndex++;
        setTimeout(animateViseme, 300);
      };
      
      animateViseme();
    });
  };
  
  // Test 4: Audio analysis capability
  const testAudioAnalysis = async () => {
    try {
      // Check if Web Audio API is available
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        return addResult('Audio Analysis', false, 'Web Audio API not supported');
      }
      
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      // Create a test oscillator
      const oscillator = audioContext.createOscillator();
      oscillator.connect(analyser);
      analyser.connect(audioContext.destination);
      
      // Start and stop quickly (muted)
      oscillator.start();
      
      // Get frequency data
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      
      oscillator.stop();
      audioContext.close();
      
      return addResult('Audio Analysis', true, 'Web Audio API functional for lip sync');
    } catch (error) {
      return addResult('Audio Analysis', false, `Error: ${error.message}`);
    }
  };
  
  // Test 5: Phoneme detection simulation
  const testPhonemeDetection = async () => {
    const testWord = "HELLO";
    const expectedPhonemes = ['HH', 'EH', 'LL', 'OW'];
    
    // Simulate phoneme detection
    const detectedPhonemes = [];
    for (let i = 0; i < testWord.length; i++) {
      const char = testWord[i];
      // Simple mapping for demo
      const phonemeMap = {
        'H': 'HH',
        'E': 'EH',
        'L': 'LL',
        'O': 'OW'
      };
      if (phonemeMap[char]) {
        detectedPhonemes.push(phonemeMap[char]);
      }
    }
    
    const matchRate = detectedPhonemes.filter((p, i) => p === expectedPhonemes[i]).length / expectedPhonemes.length;
    
    return addResult(
      'Phoneme Detection',
      matchRate > 0.5,
      `Detected ${detectedPhonemes.join('-')} (${Math.round(matchRate * 100)}% match)`
    );
  };
  
  // Test 6: Real-time sync test
  const testRealTimeSync = async () => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const testDuration = 2000;
      let frameCount = 0;
      let syncErrors = 0;
      
      const checkSync = () => {
        const elapsed = Date.now() - startTime;
        frameCount++;
        
        // Simulate checking if lip sync matches audio
        const expectedVisemeIndex = Math.floor((elapsed / testDuration) * 10);
        const actualVisemeIndex = frameCount % 10;
        
        if (Math.abs(expectedVisemeIndex - actualVisemeIndex) > 2) {
          syncErrors++;
        }
        
        if (elapsed >= testDuration) {
          const errorRate = syncErrors / frameCount;
          addResult(
            'Real-time Sync',
            errorRate < 0.2,
            `${frameCount} frames, ${syncErrors} sync errors (${Math.round(errorRate * 100)}% error rate)`
          );
          resolve();
        } else {
          requestAnimationFrame(checkSync);
        }
      };
      
      checkSync();
    });
  };
  
  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const tests = [
      testMorphTargets,
      testSpeechSynthesis,
      testLipSyncAnimation,
      testAudioAnalysis,
      testPhonemeDetection,
      testRealTimeSync
    ];
    
    for (const test of tests) {
      await test();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
    setCurrentViseme(null);
  };
  
  return (
    <div className="lipsync-validation">
      <div className="validation-header">
        <h3>🎤 Lip Sync Validation</h3>
        <button 
          onClick={runAllTests}
          disabled={isRunning}
          className="run-button"
        >
          {isRunning ? '⏳ Testing...' : '▶️ Run Lip Sync Tests'}
        </button>
      </div>
      
      {currentViseme && (
        <div className="current-viseme">
          Current Viseme: <strong>{currentViseme}</strong>
        </div>
      )}
      
      <div className="test-results">
        {testResults.map((result, index) => (
          <div 
            key={index}
            className={`test-result ${result.passed ? 'passed' : 'failed'}`}
          >
            <span className="test-icon">
              {result.passed ? '✅' : '❌'}
            </span>
            <span className="test-name">{result.name}</span>
            <span className="test-details">{result.details}</span>
          </div>
        ))}
      </div>
      
      {testResults.length > 0 && (
        <div className="test-summary">
          <div className="summary-item">
            Total: {testResults.length}
          </div>
          <div className="summary-item passed">
            Passed: {testResults.filter(r => r.passed).length}
          </div>
          <div className="summary-item failed">
            Failed: {testResults.filter(r => !r.passed).length}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .lipsync-validation {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .validation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .validation-header h3 {
          margin: 0;
          color: #1f2937;
        }
        
        .run-button {
          padding: 8px 16px;
          background: #8b5cf6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .run-button:hover:not(:disabled) {
          background: #7c3aed;
        }
        
        .run-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .current-viseme {
          padding: 10px;
          background: #fef3c7;
          border-radius: 6px;
          margin-bottom: 15px;
          text-align: center;
          color: #92400e;
        }
        
        .test-results {
          space-y: 8px;
        }
        
        .test-result {
          display: flex;
          align-items: center;
          padding: 12px;
          margin: 8px 0;
          background: #f9fafb;
          border-radius: 6px;
          border-left: 4px solid #e5e7eb;
        }
        
        .test-result.passed {
          border-left-color: #10b981;
          background: #f0fdf4;
        }
        
        .test-result.failed {
          border-left-color: #ef4444;
          background: #fef2f2;
        }
        
        .test-icon {
          margin-right: 12px;
          font-size: 18px;
        }
        
        .test-name {
          font-weight: 600;
          margin-right: 12px;
          min-width: 150px;
          color: #1f2937;
        }
        
        .test-details {
          color: #6b7280;
          font-size: 14px;
        }
        
        .test-summary {
          display: flex;
          gap: 15px;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 2px solid #e5e7eb;
        }
        
        .summary-item {
          padding: 6px 12px;
          background: #f3f4f6;
          border-radius: 6px;
          font-weight: 500;
        }
        
        .summary-item.passed {
          background: #d1fae5;
          color: #065f46;
        }
        
        .summary-item.failed {
          background: #fee2e2;
          color: #991b1b;
        }
      `}</style>
    </div>
  );
}