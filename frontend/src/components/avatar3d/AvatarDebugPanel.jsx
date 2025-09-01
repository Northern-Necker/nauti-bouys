import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';

export default function AvatarDebugPanel({ avatarRef }) {
  const [debugInfo, setDebugInfo] = useState({
    modelLoaded: false,
    bounds: null,
    camera: null,
    lights: [],
    meshCount: 0,
    vertexCount: 0,
    fps: 0,
    renderSize: null,
    avatarHeight: null,
    visibleInViewport: false
  });
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  
  useEffect(() => {
    const updateDebugInfo = () => {
      const canvas = document.querySelector('.avatar-canvas');
      
      if (!canvas) {
        requestAnimationFrame(updateDebugInfo);
        return;
      }
      
      // Try to access Three.js internals
      const r3f = canvas.__r3f;
      
      if (!r3f) {
        requestAnimationFrame(updateDebugInfo);
        return;
      }
      
      const { scene, camera, gl } = r3f.store.getState();
      
      if (!scene || !camera) {
        requestAnimationFrame(updateDebugInfo);
        return;
      }
      
      // Calculate FPS
      frameCountRef.current++;
      const currentTime = performance.now();
      if (currentTime - lastTimeRef.current >= 1000) {
        const fps = frameCountRef.current;
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
        
        // Find avatar model
        let avatarModel = null;
        let meshCount = 0;
        let totalVertices = 0;
        const lights = [];
        
        scene.traverse((child) => {
          if (child.isMesh || child.isSkinnedMesh) {
            meshCount++;
            if (child.geometry) {
              totalVertices += child.geometry.attributes?.position?.count || 0;
              if (!avatarModel && child.geometry.attributes?.position?.count > 1000) {
                avatarModel = child;
              }
            }
          }
          if (child.isLight) {
            lights.push({
              type: child.type,
              intensity: child.intensity
            });
          }
        });
        
        // Calculate bounds if avatar found
        let bounds = null;
        let avatarHeight = null;
        let visibleInViewport = false;
        
        if (avatarModel) {
          const box = new THREE.Box3().setFromObject(avatarModel);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          
          bounds = {
            size: {
              x: size.x.toFixed(3),
              y: size.y.toFixed(3),
              z: size.z.toFixed(3)
            },
            center: {
              x: center.x.toFixed(3),
              y: center.y.toFixed(3),
              z: center.z.toFixed(3)
            }
          };
          
          avatarHeight = size.y;
          
          // Check if avatar is in camera frustum
          const frustum = new THREE.Frustum();
          const matrix = new THREE.Matrix4().multiplyMatrices(
            camera.projectionMatrix,
            camera.matrixWorldInverse
          );
          frustum.setFromProjectionMatrix(matrix);
          visibleInViewport = frustum.intersectsBox(box);
        }
        
        // Get camera info
        const cameraInfo = {
          position: {
            x: camera.position.x.toFixed(2),
            y: camera.position.y.toFixed(2),
            z: camera.position.z.toFixed(2)
          },
          fov: camera.fov,
          near: camera.near,
          far: camera.far
        };
        
        // Get render size
        const renderSize = {
          width: gl.domElement.width,
          height: gl.domElement.height,
          pixelRatio: window.devicePixelRatio
        };
        
        setDebugInfo({
          modelLoaded: avatarModel !== null,
          bounds,
          camera: cameraInfo,
          lights,
          meshCount,
          vertexCount: totalVertices,
          fps,
          renderSize,
          avatarHeight,
          visibleInViewport
        });
      }
      
      requestAnimationFrame(updateDebugInfo);
    };
    
    updateDebugInfo();
  }, []);
  
  const getStatusColor = (condition) => {
    return condition ? '#10b981' : '#ef4444';
  };
  
  const getHeightStatus = () => {
    if (!debugInfo.avatarHeight) return { status: 'Unknown', color: '#6b7280' };
    if (debugInfo.avatarHeight > 3) return { status: 'Too Large', color: '#ef4444' };
    if (debugInfo.avatarHeight < 0.3) return { status: 'Too Small', color: '#f59e0b' };
    return { status: 'Good', color: '#10b981' };
  };
  
  return (
    <div className="avatar-debug-panel">
      <h3 className="debug-title">🔍 Real-time Avatar Debug</h3>
      
      <div className="debug-grid">
        {/* Model Status */}
        <div className="debug-section">
          <h4>Model Status</h4>
          <div className="debug-item">
            <span className="label">Loaded:</span>
            <span className="value" style={{ color: getStatusColor(debugInfo.modelLoaded) }}>
              {debugInfo.modelLoaded ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="debug-item">
            <span className="label">Visible:</span>
            <span className="value" style={{ color: getStatusColor(debugInfo.visibleInViewport) }}>
              {debugInfo.visibleInViewport ? '✅ In View' : '❌ Out of View'}
            </span>
          </div>
          <div className="debug-item">
            <span className="label">Height:</span>
            <span className="value" style={{ color: getHeightStatus().color }}>
              {debugInfo.avatarHeight?.toFixed(2) || 'N/A'} ({getHeightStatus().status})
            </span>
          </div>
        </div>
        
        {/* Bounds */}
        <div className="debug-section">
          <h4>Bounds</h4>
          {debugInfo.bounds ? (
            <>
              <div className="debug-item">
                <span className="label">Size:</span>
                <span className="value mini">
                  X:{debugInfo.bounds.size.x} Y:{debugInfo.bounds.size.y} Z:{debugInfo.bounds.size.z}
                </span>
              </div>
              <div className="debug-item">
                <span className="label">Center:</span>
                <span className="value mini">
                  X:{debugInfo.bounds.center.x} Y:{debugInfo.bounds.center.y} Z:{debugInfo.bounds.center.z}
                </span>
              </div>
            </>
          ) : (
            <div className="debug-item">
              <span className="value">No bounds data</span>
            </div>
          )}
        </div>
        
        {/* Camera */}
        <div className="debug-section">
          <h4>Camera</h4>
          {debugInfo.camera ? (
            <>
              <div className="debug-item">
                <span className="label">Position:</span>
                <span className="value mini">
                  X:{debugInfo.camera.position.x} Y:{debugInfo.camera.position.y} Z:{debugInfo.camera.position.z}
                </span>
              </div>
              <div className="debug-item">
                <span className="label">FOV:</span>
                <span className="value">{debugInfo.camera.fov}°</span>
              </div>
              <div className="debug-item">
                <span className="label">Near/Far:</span>
                <span className="value">{debugInfo.camera.near} / {debugInfo.camera.far}</span>
              </div>
            </>
          ) : (
            <div className="debug-item">
              <span className="value">No camera data</span>
            </div>
          )}
        </div>
        
        {/* Performance */}
        <div className="debug-section">
          <h4>Performance</h4>
          <div className="debug-item">
            <span className="label">FPS:</span>
            <span className="value" style={{ 
              color: debugInfo.fps >= 30 ? '#10b981' : debugInfo.fps >= 20 ? '#f59e0b' : '#ef4444' 
            }}>
              {debugInfo.fps}
            </span>
          </div>
          <div className="debug-item">
            <span className="label">Meshes:</span>
            <span className="value">{debugInfo.meshCount}</span>
          </div>
          <div className="debug-item">
            <span className="label">Vertices:</span>
            <span className="value">{debugInfo.vertexCount.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Render Info */}
        <div className="debug-section">
          <h4>Render</h4>
          {debugInfo.renderSize ? (
            <>
              <div className="debug-item">
                <span className="label">Size:</span>
                <span className="value">
                  {debugInfo.renderSize.width}x{debugInfo.renderSize.height}
                </span>
              </div>
              <div className="debug-item">
                <span className="label">Pixel Ratio:</span>
                <span className="value">{debugInfo.renderSize.pixelRatio}</span>
              </div>
            </>
          ) : (
            <div className="debug-item">
              <span className="value">No render data</span>
            </div>
          )}
        </div>
        
        {/* Lighting */}
        <div className="debug-section">
          <h4>Lights</h4>
          {debugInfo.lights.length > 0 ? (
            debugInfo.lights.map((light, i) => (
              <div key={i} className="debug-item">
                <span className="label">{light.type}:</span>
                <span className="value">Intensity {light.intensity}</span>
              </div>
            ))
          ) : (
            <div className="debug-item">
              <span className="value">No lights found</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Diagnostics */}
      <div className="diagnostics">
        <h4>Quick Diagnostics</h4>
        <div className="diagnostic-item">
          {debugInfo.modelLoaded ? '✅' : '❌'} Model loaded
        </div>
        <div className="diagnostic-item">
          {debugInfo.visibleInViewport ? '✅' : '❌'} Avatar in viewport
        </div>
        <div className="diagnostic-item">
          {debugInfo.avatarHeight && debugInfo.avatarHeight > 0.3 && debugInfo.avatarHeight < 3 ? '✅' : '❌'} Proper scale
        </div>
        <div className="diagnostic-item">
          {debugInfo.fps >= 30 ? '✅' : '⚠️'} Good performance ({debugInfo.fps} FPS)
        </div>
        <div className="diagnostic-item">
          {debugInfo.lights.length > 0 ? '✅' : '❌'} Lighting configured
        </div>
      </div>
      
      <style jsx>{`
        .avatar-debug-panel {
          background: linear-gradient(135deg, #1e293b, #334155);
          color: white;
          padding: 20px;
          border-radius: 12px;
          margin: 20px 0;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .debug-title {
          margin: 0 0 20px 0;
          font-size: 20px;
          font-weight: 600;
          text-align: center;
          color: #f3f4f6;
        }
        
        .debug-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .debug-section {
          background: rgba(255, 255, 255, 0.05);
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .debug-section h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #93c5fd;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .debug-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
          font-size: 13px;
        }
        
        .label {
          color: #cbd5e1;
        }
        
        .value {
          font-weight: 500;
          color: #f3f4f6;
        }
        
        .value.mini {
          font-size: 11px;
          font-family: monospace;
        }
        
        .diagnostics {
          background: rgba(255, 255, 255, 0.05);
          padding: 15px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .diagnostics h4 {
          margin: 0 0 10px 0;
          color: #93c5fd;
          font-size: 14px;
        }
        
        .diagnostic-item {
          padding: 5px 0;
          font-size: 14px;
          color: #e2e8f0;
        }
      `}</style>
    </div>
  );
}