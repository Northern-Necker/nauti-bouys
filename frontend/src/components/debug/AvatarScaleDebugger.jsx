import React, { useEffect, useState } from 'react';
import * as THREE from 'three';

export default function AvatarScaleDebugger() {
  const [debugInfo, setDebugInfo] = useState({
    canvasFound: false,
    sceneFound: false,
    avatarFound: false,
    avatarBounds: null,
    avatarScale: null,
    cameraInfo: null,
    renderInfo: null
  });

  useEffect(() => {
    const debugInterval = setInterval(() => {
      const canvas = document.querySelector('.avatar-canvas');
      let info = {
        canvasFound: !!canvas,
        sceneFound: false,
        avatarFound: false,
        avatarBounds: null,
        avatarScale: null,
        cameraInfo: null,
        renderInfo: null
      };

      if (canvas) {
        const webglCanvas = canvas.querySelector('canvas');
        if (webglCanvas) {
          info.renderInfo = {
            width: webglCanvas.width,
            height: webglCanvas.height,
            displayWidth: webglCanvas.offsetWidth,
            displayHeight: webglCanvas.offsetHeight
          };
        }

        const r3f = canvas.__r3f;
        if (r3f) {
          info.sceneFound = true;
          const { scene, camera } = r3f.store.getState();
          
          if (camera) {
            info.cameraInfo = {
              position: [camera.position.x.toFixed(2), camera.position.y.toFixed(2), camera.position.z.toFixed(2)],
              fov: camera.fov,
              near: camera.near,
              far: camera.far
            };
          }

          if (scene) {
            // Look for avatar in scene
            let foundAvatar = null;
            let avatarBounds = null;
            let avatarScale = null;

            scene.traverse((child) => {
              if (child.name && child.name.toLowerCase().includes('avatar')) {
                foundAvatar = child;
              } else if (child.isMesh || child.isSkinnedMesh || child.isGroup) {
                if (child.geometry || child.children.length > 0) {
                  // This might be our avatar
                  if (!foundAvatar) {
                    foundAvatar = child;
                  }
                }
              }
            });

            if (foundAvatar) {
              info.avatarFound = true;
              
              // Get bounds
              const box = new THREE.Box3().setFromObject(foundAvatar);
              const size = box.getSize(new THREE.Vector3());
              const center = box.getCenter(new THREE.Vector3());
              
              info.avatarBounds = {
                size: [size.x.toFixed(3), size.y.toFixed(3), size.z.toFixed(3)],
                center: [center.x.toFixed(3), center.y.toFixed(3), center.z.toFixed(3)],
                min: [box.min.x.toFixed(3), box.min.y.toFixed(3), box.min.z.toFixed(3)],
                max: [box.max.x.toFixed(3), box.max.y.toFixed(3), box.max.z.toFixed(3)]
              };

              // Get scale
              info.avatarScale = [
                foundAvatar.scale.x.toFixed(6),
                foundAvatar.scale.y.toFixed(6),
                foundAvatar.scale.z.toFixed(6)
              ];

              // Check if avatar is visible in camera frustum
              if (camera) {
                const frustum = new THREE.Frustum();
                const matrix = new THREE.Matrix4().multiplyMatrices(
                  camera.projectionMatrix,
                  camera.matrixWorldInverse
                );
                frustum.setFromProjectionMatrix(matrix);
                info.avatarInView = frustum.intersectsBox(box);
              }
            }
          }
        }
      }

      setDebugInfo(info);
    }, 1000);

    return () => clearInterval(debugInterval);
  }, []);

  const getVisibilityStatus = () => {
    if (!debugInfo.avatarFound) return { status: 'Not Found', color: '#ef4444' };
    if (!debugInfo.avatarBounds) return { status: 'No Bounds', color: '#f59e0b' };
    
    const height = parseFloat(debugInfo.avatarBounds.size[1]);
    if (height > 5) return { status: 'TOO LARGE', color: '#ef4444' };
    if (height > 2) return { status: 'Large', color: '#f59e0b' };
    if (height < 0.1) return { status: 'Too Small', color: '#f59e0b' };
    return { status: 'Good Size', color: '#10b981' };
  };

  const visibility = getVisibilityStatus();

  return (
    <div className="scale-debugger">
      <h2 style={{ color: '#1f2937', margin: '0 0 20px 0' }}>🔍 Real Avatar Scale Debug</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Canvas Status */}
        <div className="debug-card">
          <h3>Canvas Status</h3>
          <div className="debug-row">
            <span>Canvas Found:</span>
            <span style={{ color: debugInfo.canvasFound ? '#10b981' : '#ef4444' }}>
              {debugInfo.canvasFound ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="debug-row">
            <span>Scene Found:</span>
            <span style={{ color: debugInfo.sceneFound ? '#10b981' : '#ef4444' }}>
              {debugInfo.sceneFound ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          {debugInfo.renderInfo && (
            <>
              <div className="debug-row">
                <span>Render Size:</span>
                <span>{debugInfo.renderInfo.width}x{debugInfo.renderInfo.height}</span>
              </div>
              <div className="debug-row">
                <span>Display Size:</span>
                <span>{debugInfo.renderInfo.displayWidth}x{debugInfo.renderInfo.displayHeight}</span>
              </div>
            </>
          )}
        </div>

        {/* Avatar Status */}
        <div className="debug-card">
          <h3>Avatar Status</h3>
          <div className="debug-row">
            <span>Avatar Found:</span>
            <span style={{ color: debugInfo.avatarFound ? '#10b981' : '#ef4444' }}>
              {debugInfo.avatarFound ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="debug-row">
            <span>Size Status:</span>
            <span style={{ color: visibility.color, fontWeight: 'bold' }}>
              {visibility.status}
            </span>
          </div>
          {debugInfo.avatarInView !== undefined && (
            <div className="debug-row">
              <span>In Camera View:</span>
              <span style={{ color: debugInfo.avatarInView ? '#10b981' : '#ef4444' }}>
                {debugInfo.avatarInView ? '✅ Yes' : '❌ No'}
              </span>
            </div>
          )}
        </div>

        {/* Avatar Bounds */}
        {debugInfo.avatarBounds && (
          <div className="debug-card">
            <h3>Avatar Bounds</h3>
            <div className="debug-row">
              <span>Size (X,Y,Z):</span>
              <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {debugInfo.avatarBounds.size.join(', ')}
              </span>
            </div>
            <div className="debug-row">
              <span>Height:</span>
              <span style={{ 
                fontWeight: 'bold',
                color: parseFloat(debugInfo.avatarBounds.size[1]) > 2 ? '#ef4444' : '#10b981'
              }}>
                {debugInfo.avatarBounds.size[1]}
              </span>
            </div>
            <div className="debug-row">
              <span>Center (X,Y,Z):</span>
              <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {debugInfo.avatarBounds.center.join(', ')}
              </span>
            </div>
          </div>
        )}

        {/* Avatar Scale */}
        {debugInfo.avatarScale && (
          <div className="debug-card">
            <h3>Avatar Scale</h3>
            <div className="debug-row">
              <span>Scale (X,Y,Z):</span>
              <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {debugInfo.avatarScale.join(', ')}
              </span>
            </div>
            <div className="debug-row">
              <span>Scale X:</span>
              <span style={{ fontWeight: 'bold' }}>{debugInfo.avatarScale[0]}</span>
            </div>
            <div className="debug-row">
              <span>Scale Y:</span>
              <span style={{ fontWeight: 'bold' }}>{debugInfo.avatarScale[1]}</span>
            </div>
          </div>
        )}

        {/* Camera Info */}
        {debugInfo.cameraInfo && (
          <div className="debug-card">
            <h3>Camera Info</h3>
            <div className="debug-row">
              <span>Position:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {debugInfo.cameraInfo.position.join(', ')}
              </span>
            </div>
            <div className="debug-row">
              <span>FOV:</span>
              <span>{debugInfo.cameraInfo.fov}°</span>
            </div>
            <div className="debug-row">
              <span>Near/Far:</span>
              <span>{debugInfo.cameraInfo.near} / {debugInfo.cameraInfo.far}</span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .scale-debugger {
          background: linear-gradient(135deg, #fef3c7, #fcd34d);
          padding: 20px;
          border-radius: 12px;
          margin: 20px 0;
          border: 3px solid #f59e0b;
        }

        .debug-card {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .debug-card h3 {
          margin: 0 0 12px 0;
          color: #1f2937;
          font-size: 16px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 6px;
        }

        .debug-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .debug-row:last-child {
          border-bottom: none;
        }

        .debug-row span:first-child {
          font-weight: 500;
          color: #374151;
        }

        .debug-row span:last-child {
          color: #1f2937;
        }
      `}</style>
    </div>
  );
}