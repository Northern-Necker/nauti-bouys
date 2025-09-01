import React, { useEffect, useState } from 'react';
import InteractiveAvatar from '../components/avatar3d/InteractiveAvatar';

export default function SimpleAvatarDebug() {
  const [debugInfo, setDebugInfo] = useState('Loading...');

  useEffect(() => {
    const checkAvatar = () => {
      const canvas = document.querySelector('.avatar-canvas');
      if (!canvas) {
        setDebugInfo('❌ No canvas found');
        return;
      }

      const r3f = canvas.__r3f;
      if (!r3f) {
        setDebugInfo('❌ No R3F store found');
        return;
      }

      const { scene } = r3f.store.getState();
      if (!scene) {
        setDebugInfo('❌ No scene found');
        return;
      }

      let foundObjects = 0;
      let largeObjects = 0;
      scene.traverse((child) => {
        if (child.isMesh || child.isSkinnedMesh || child.isGroup) {
          foundObjects++;
          if (child.scale.x > 0.1) {
            largeObjects++;
          }
        }
      });

      setDebugInfo(`✅ Found ${foundObjects} objects, ${largeObjects} are large scale`);
    };

    const interval = setInterval(checkAvatar, 1000);
    return () => clearInterval(interval);
  }, []);

  const forceScale = () => {
    const canvas = document.querySelector('.avatar-canvas');
    if (canvas && canvas.__r3f) {
      const { scene } = canvas.__r3f.store.getState();
      let scaled = 0;
      scene.traverse((child) => {
        if (child.isMesh || child.isSkinnedMesh || child.isGroup) {
          child.scale.setScalar(0.001);
          child.position.set(0, 0, 0);
          scaled++;
        }
      });
      alert(`Scaled ${scaled} objects to 0.001`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: 'red', fontSize: '32px' }}>🔧 SIMPLE AVATAR DEBUG</h1>
      
      <div style={{ 
        background: 'yellow', 
        padding: '20px', 
        margin: '20px 0',
        border: '3px solid red',
        fontSize: '18px'
      }}>
        <h2>Debug Info:</h2>
        <p>{debugInfo}</p>
        <button 
          onClick={forceScale}
          style={{
            background: 'red',
            color: 'white',
            padding: '10px 20px',
            fontSize: '16px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          FORCE SCALE TO 0.001
        </button>
      </div>

      <div style={{ height: '600px', border: '2px solid blue' }}>
        <InteractiveAvatar />
      </div>
    </div>
  );
}