import React, { useState } from 'react';
import InteractiveAvatar from '../components/avatar3d/InteractiveAvatar';

export default function Avatar3DTestPage() {
  const [results, setResults] = useState([]);

  const addResult = (message) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testScale = (scale) => {
    const canvas = document.querySelector('.avatar-canvas');
    if (canvas?.__r3f) {
      const { scene } = canvas.__r3f.store.getState();
      let count = 0;
      scene.traverse((child) => {
        if (child.isMesh || child.isSkinnedMesh || child.isGroup) {
          child.scale.setScalar(scale);
          child.position.set(0, 0, 0);
          count++;
        }
      });
      addResult(`Scaled ${count} objects to ${scale}`);
    } else {
      addResult('No 3D scene found');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: '#1f2937', marginBottom: '20px' }}>
        Avatar Scale Test - WORKING VERSION
      </h1>
      
      {/* Scale Test Buttons */}
      <div style={{ 
        background: '#fef3c7', 
        padding: '20px', 
        margin: '20px 0',
        border: '2px solid #f59e0b',
        borderRadius: '8px'
      }}>
        <h2 style={{ margin: '0 0 15px 0' }}>Scale Test Controls</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => testScale(0.05)} style={{ padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}>
            Tiny (0.05)
          </button>
          <button onClick={() => testScale(0.1)} style={{ padding: '10px', background: '#f97316', color: 'white', border: 'none', borderRadius: '4px' }}>
            Small (0.1)
          </button>
          <button onClick={() => testScale(0.15)} style={{ padding: '10px', background: '#eab308', color: 'white', border: 'none', borderRadius: '4px' }}>
            Medium (0.15)
          </button>
          <button onClick={() => testScale(0.2)} style={{ padding: '10px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px' }}>
            Good (0.2)
          </button>
          <button onClick={() => testScale(0.3)} style={{ padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}>
            Large (0.3)
          </button>
        </div>
      </div>

      {/* Avatar Display */}
      <div style={{ 
        border: '2px solid #ddd', 
        borderRadius: '8px', 
        height: '600px',
        marginBottom: '20px',
        background: '#f9fafb'
      }}>
        <InteractiveAvatar />
      </div>

      {/* Results */}
      <div style={{ 
        background: '#f3f4f6', 
        padding: '15px', 
        borderRadius: '8px',
        maxHeight: '200px',
        overflowY: 'auto'
      }}>
        <h3>Test Results:</h3>
        {results.length === 0 ? (
          <p>No tests run yet. Click the scale buttons above.</p>
        ) : (
          results.map((result, i) => (
            <div key={i} style={{ margin: '5px 0', fontSize: '14px' }}>
              {result}
            </div>
          ))
        )}
      </div>
    </div>
  );
}