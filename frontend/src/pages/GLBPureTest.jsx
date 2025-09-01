import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

function PureGLB() {
  console.log('PureGLB render');
  
  useEffect(() => {
    console.log('PureGLB mounted');
    return () => console.log('PureGLB unmounting');
  }, []);
  
  const gltf = useGLTF('/assets/SavannahAvatar.glb');
  
  if (gltf && gltf.scene) {
    console.log('GLB ready, rendering');
    gltf.scene.scale.set(0.01, 0.01, 0.01);
    return React.createElement('primitive', { object: gltf.scene });
  }
  
  console.log('GLB not ready');
  return React.createElement('mesh', null,
    React.createElement('boxGeometry', { args: [1, 1, 1] }),
    React.createElement('meshBasicMaterial', { color: 'blue' })
  );
}

// Preload
if (typeof window !== 'undefined') {
  useGLTF.preload('/assets/SavannahAvatar.glb');
}

export default function GLBPureTest() {
  console.log('Page render');
  
  return React.createElement('div', { 
    style: { width: '100vw', height: '100vh', backgroundColor: 'black' }
  },
    React.createElement('div', {
      style: {
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 100,
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: '10px'
      }
    },
      React.createElement('h3', null, 'Pure Test - No JSX'),
      React.createElement('p', null, 'Check console for lifecycle messages')
    ),
    React.createElement(Canvas, { camera: { position: [0, 0, 3], fov: 50 } },
      React.createElement('ambientLight', { intensity: 1 }),
      React.createElement('directionalLight', { position: [10, 10, 5], intensity: 1 }),
      React.createElement(React.Suspense, {
        fallback: React.createElement('mesh', null,
          React.createElement('sphereGeometry', { args: [0.5] }),
          React.createElement('meshBasicMaterial', { color: 'yellow' })
        )
      },
        React.createElement(PureGLB)
      )
    )
  );
}