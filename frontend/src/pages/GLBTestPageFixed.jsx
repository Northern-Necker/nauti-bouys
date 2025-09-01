import React, { useState } from 'react';
import InteractiveAvatar from '../components/avatar3d/InteractiveAvatar';

export default function GLBTestPageFixed() {
  const [lightIntensity, setLightIntensity] = useState(1);
  const [showStats, setShowStats] = useState(true);
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#222' }}>
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        zIndex: 100, 
        background: 'rgba(0,0,0,0.8)', 
        padding: '20px',
        borderRadius: '8px',
        color: 'white'
      }}>
        <h2>GLB Avatar Test Page (FIXED)</h2>
        <p>File: /assets/SavannahAvatar.glb</p>
        <p>✅ Using working InteractiveAvatar component</p>
        <div style={{ marginTop: '10px' }}>
          <label>Light Intensity: {lightIntensity}</label>
          <input 
            type="range" 
            min="0" 
            max="5" 
            step="0.1" 
            value={lightIntensity}
            onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
            style={{ width: '200px', marginLeft: '10px' }}
          />
        </div>
        <div style={{ marginTop: '10px' }}>
          <button 
            onClick={() => setShowStats(!showStats)}
            style={{ padding: '5px 10px' }}
          >
            Toggle Stats: {showStats ? 'ON' : 'OFF'}
          </button>
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px' }}>
          <p>Controls:</p>
          <p>• Left Click + Drag: Rotate</p>
          <p>• Right Click + Drag: Pan</p>
          <p>• Scroll: Zoom</p>
          <p>• Mouse Move: Head tracking</p>
        </div>
      </div>
      
      {/* Use the working InteractiveAvatar component */}
      <div style={{ 
        width: '100%', 
        height: '100%',
        paddingTop: '0'
      }}>
        <InteractiveAvatar className="glb-test-avatar" />
      </div>
    </div>
  );
}