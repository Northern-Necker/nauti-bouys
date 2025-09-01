import React from 'react';

export default function GLBDebugTest() {
  // Just test if the page loads at all without any 3D components
  return (
    <div style={{ padding: '20px', background: '#000', color: '#fff', minHeight: '100vh' }}>
      <h1>GLB Debug Test - Basic HTML Only</h1>
      <p>If you can see this, the routing works.</p>
      
      <div style={{ marginTop: '20px', padding: '20px', background: '#333', borderRadius: '8px' }}>
        <h2>Now let's test the GLB file access:</h2>
        <img 
          src="/assets/SavannahAvatar.glb" 
          alt="GLB test" 
          onError={(e) => {
            e.target.style.display = 'none';
            document.getElementById('glb-status').innerText = 'GLB file exists (cannot display as image, which is expected)';
          }}
          style={{ display: 'none' }}
        />
        <p id="glb-status">Checking GLB file...</p>
      </div>
      
      <div style={{ marginTop: '20px', padding: '20px', background: '#333', borderRadius: '8px' }}>
        <h2>Test Links:</h2>
        <ul>
          <li><a href="/glb-test" style={{ color: '#4fc3f7' }}>Original GLB Test (working)</a></li>
          <li><a href="/glb-simple" style={{ color: '#4fc3f7' }}>Simple GLB Test</a></li>
          <li><a href="/glb-avatar-validation" style={{ color: '#4fc3f7' }}>Full Validation Test</a></li>
          <li><a href="/interactive-avatar" style={{ color: '#4fc3f7' }}>Interactive Avatar Page</a></li>
        </ul>
      </div>
      
      <div style={{ marginTop: '20px', padding: '20px', background: '#444', borderRadius: '8px' }}>
        <h2>Browser Console Instructions:</h2>
        <ol>
          <li>Press F12 to open Developer Tools</li>
          <li>Click on the "Console" tab</li>
          <li>Look for any red error messages</li>
          <li>Especially look for:
            <ul>
              <li>WebGL context lost</li>
              <li>React hook errors</li>
              <li>Memory errors</li>
              <li>Module not found errors</li>
            </ul>
          </li>
        </ol>
      </div>
      
      <script dangerouslySetInnerHTML={{ __html: `
        // Test WebGL support
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          console.log('✅ WebGL is supported');
          document.getElementById('glb-status').innerText += ' | WebGL: Supported';
        } else {
          console.error('❌ WebGL is NOT supported');
          document.getElementById('glb-status').innerText += ' | WebGL: NOT SUPPORTED';
        }
        
        // Test GLB file with fetch
        fetch('/assets/SavannahAvatar.glb')
          .then(response => {
            if (response.ok) {
              console.log('✅ GLB file is accessible:', response.status);
              document.getElementById('glb-status').innerText += ' | GLB: Accessible';
            } else {
              console.error('❌ GLB file not accessible:', response.status);
              document.getElementById('glb-status').innerText += ' | GLB: Error ' + response.status;
            }
          })
          .catch(err => {
            console.error('❌ Failed to fetch GLB:', err);
            document.getElementById('glb-status').innerText += ' | GLB: Network Error';
          });
      `}} />
    </div>
  );
}