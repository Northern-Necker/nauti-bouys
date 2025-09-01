import React, { useState } from 'react';
import InteractiveAvatar from '../components/avatar3d/InteractiveAvatar';

export default function AvatarScaleTest() {
  const [testResults, setTestResults] = useState([]);

  const addResult = (test, result) => {
    setTestResults(prev => [...prev, { test, result, time: new Date().toLocaleTimeString() }]);
  };

  const testScale = (scaleValue) => {
    const canvas = document.querySelector('.avatar-canvas');
    if (canvas && canvas.__r3f) {
      const { scene } = canvas.__r3f.store.getState();
      let scaled = 0;
      scene.traverse((child) => {
        if (child.isMesh || child.isSkinnedMesh || child.isGroup) {
          child.scale.setScalar(scaleValue);
          child.position.set(0, 0, 0);
          scaled++;
        }
      });
      addResult(`Scale Test`, `✅ Set ${scaled} objects to scale ${scaleValue}`);
    } else {
      addResult(`Scale Test`, `❌ No canvas or R3F found`);
    }
  };

  const buttonStyle = (color) => ({
    background: color,
    color: 'white',
    padding: '15px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
    margin: '5px',
    minWidth: '120px'
  });

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#f5f7fa' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          color: '#1f2937', 
          fontSize: '36px', 
          textAlign: 'center', 
          marginBottom: '30px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px'
        }}>
          🎯 Avatar Scale Tester
        </h1>

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
            <button onClick={() => testScale(0.01)} style={buttonStyle('#ef4444')}>
              Very Tiny<br/>0.01
            </button>
            <button onClick={() => testScale(0.05)} style={buttonStyle('#f97316')}>
              Tiny<br/>0.05
            </button>
            <button onClick={() => testScale(0.1)} style={buttonStyle('#eab308')}>
              Small<br/>0.1
            </button>
            <button onClick={() => testScale(0.15)} style={buttonStyle('#22c55e')}>
              Good Size<br/>0.15
            </button>
            <button onClick={() => testScale(0.2)} style={buttonStyle('#3b82f6')}>
              Medium<br/>0.2
            </button>
            <button onClick={() => testScale(0.3)} style={buttonStyle('#8b5cf6')}>
              Large<br/>0.3
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
            Avatar Display
          </h3>
          <div style={{ height: '600px', border: '2px dashed #d1d5db', borderRadius: '8px' }}>
            <InteractiveAvatar />
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