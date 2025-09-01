import React, { useState, useEffect } from 'react';
import InteractiveAvatar from '../components/avatar3d/InteractiveAvatar';

export default function WorkingAvatarTest() {
  const [testResults, setTestResults] = useState([]);
  const [currentScale, setCurrentScale] = useState(0.15);

  const addResult = (test, result) => {
    setTestResults(prev => [...prev, { test, result, time: new Date().toLocaleTimeString() }]);
  };

  // Improved scale function that actually works
  const setAvatarScale = (scaleValue) => {
    setCurrentScale(scaleValue);
    
    // Wait for canvas to be ready
    setTimeout(() => {
      const canvas = document.querySelector('.avatar-canvas');
      if (canvas && canvas.__r3f) {
        const { scene } = canvas.__r3f.store.getState();
        let scaled = 0;
        
        scene.traverse((child) => {
          // Find the actual avatar group/mesh
          if (child.isGroup || child.isMesh || child.isSkinnedMesh) {
            // Look for the GLB model specifically
            if (child.userData && child.userData.gltfExtensions) {
              child.scale.setScalar(scaleValue);
              child.position.set(0, -0.5, 0);
              scaled++;
            } else if (child.parent && child.parent.userData && child.parent.userData.gltfExtensions) {
              child.parent.scale.setScalar(scaleValue);
              child.parent.position.set(0, -0.5, 0);
              scaled++;
            } else if (child.name && child.name.includes('Scene')) {
              child.scale.setScalar(scaleValue);
              child.position.set(0, -0.5, 0);
              scaled++;
            }
          }
        });
        
        // Fallback: scale everything if specific objects not found
        if (scaled === 0) {
          scene.traverse((child) => {
            if (child.isMesh || child.isSkinnedMesh || child.isGroup) {
              child.scale.setScalar(scaleValue);
              child.position.set(0, -0.5, 0);
              scaled++;
            }
          });
        }
        
        addResult(`Scale Test`, `✅ Set ${scaled} objects to scale ${scaleValue}`);
      } else {
        addResult(`Scale Test`, `❌ No canvas or R3F found - waiting for avatar to load`);
      }
    }, 500); // Give time for avatar to load
  };

  // Global function for console testing
  useEffect(() => {
    window.setAvatarScale = setAvatarScale;
    window.getCurrentScale = () => currentScale;
    console.log('Avatar test functions available:');
    console.log('  setAvatarScale(0.1) - set scale');
    console.log('  getCurrentScale() - get current scale');
    
    return () => {
      delete window.setAvatarScale;
      delete window.getCurrentScale;
    };
  }, [currentScale]);

  const buttonStyle = (color, isActive = false) => ({
    background: isActive ? '#1f2937' : color,
    color: 'white',
    padding: '15px 20px',
    border: isActive ? '3px solid #fbbf24' : 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
    margin: '5px',
    minWidth: '120px',
    transform: isActive ? 'scale(1.05)' : 'scale(1)',
    transition: 'all 0.2s ease'
  });

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#f5f7fa' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          color: 'white',
          fontSize: '36px', 
          textAlign: 'center', 
          marginBottom: '30px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px',
          borderRadius: '12px'
        }}>
          🎯 Working Avatar Scale Test
        </h1>

        {/* CURRENT STATUS */}
        <div style={{
          background: '#dbeafe',
          padding: '20px',
          margin: '20px 0',
          border: '2px solid #3b82f6',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#1e40af', margin: '0 0 10px 0' }}>
            Current Avatar Scale: {currentScale}
          </h3>
          <p style={{ color: '#1e40af', margin: 0 }}>
            Watch the avatar change size as you click the buttons below!
          </p>
        </div>

        {/* SCALE TESTING PANEL */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7, #fcd34d)',
          padding: '30px',
          margin: '20px 0',
          border: '3px solid #f59e0b',
          borderRadius: '15px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
        }}>
          <h2 style={{ 
            color: '#92400e', 
            fontSize: '28px', 
            margin: '0 0 25px 0', 
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            🔧 Interactive Scale Controls
          </h2>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'center', 
            gap: '10px', 
            marginBottom: '25px' 
          }}>
            <button 
              onClick={() => setAvatarScale(0.05)} 
              style={buttonStyle('#ef4444', currentScale === 0.05)}
            >
              Tiny<br/>0.05
            </button>
            <button 
              onClick={() => setAvatarScale(0.1)} 
              style={buttonStyle('#f97316', currentScale === 0.1)}
            >
              Small<br/>0.1
            </button>
            <button 
              onClick={() => setAvatarScale(0.15)} 
              style={buttonStyle('#22c55e', currentScale === 0.15)}
            >
              Good Size<br/>0.15
            </button>
            <button 
              onClick={() => setAvatarScale(0.2)} 
              style={buttonStyle('#3b82f6', currentScale === 0.2)}
            >
              Medium<br/>0.2
            </button>
            <button 
              onClick={() => setAvatarScale(0.3)} 
              style={buttonStyle('#8b5cf6', currentScale === 0.3)}
            >
              Large<br/>0.3
            </button>
            <button 
              onClick={() => setAvatarScale(0.5)} 
              style={buttonStyle('#dc2626', currentScale === 0.5)}
            >
              Very Large<br/>0.5
            </button>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <p style={{ 
              fontSize: '18px', 
              color: '#92400e', 
              fontWeight: '600',
              marginBottom: '15px'
            }}>
              👆 Click buttons to test different avatar sizes instantly!
            </p>
            <p style={{ 
              fontSize: '16px', 
              color: '#78350f'
            }}>
              Start with "Good Size (0.15)" and adjust from there
            </p>
          </div>
        </div>

        {/* AVATAR DISPLAY */}
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h3 style={{ textAlign: 'center', color: '#374151', marginBottom: '20px' }}>
            Avatar Display - Watch It Change Size!
          </h3>
          <div style={{ height: '600px', border: '2px dashed #d1d5db', borderRadius: '8px' }}>
            <InteractiveAvatar />
          </div>
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              💡 You can also use browser console: setAvatarScale(0.15)
            </p>
          </div>
        </div>

        {/* TEST RESULTS */}
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
        }}>
          <h3 style={{ color: '#374151', marginBottom: '15px' }}>Test Results</h3>
          {testResults.length === 0 ? (
            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
              No tests run yet. Click the scale buttons above to test different sizes.
            </p>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {testResults.map((result, index) => (
                <div 
                  key={index}
                  style={{
                    padding: '10px',
                    margin: '5px 0',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>{result.time}</span>
                  {' | '}
                  <span style={{ fontWeight: 'bold' }}>{result.test}:</span>
                  {' '}
                  <span>{result.result}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}