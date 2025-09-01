import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';

/**
 * Visual Avatar Test Suite
 * This component performs actual visual tests on the rendered avatar
 * by analyzing the WebGL canvas and Three.js scene
 */
export default function AvatarVisualValidation({ onTestComplete }) {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  
  // Helper function to add test results
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
  
  // Test 1: Check if avatar is visible in viewport
  const testAvatarVisibility = async () => {
    const canvas = document.querySelector('.avatar-canvas canvas');
    if (!canvas) {
      return addResult('Avatar Visibility', false, 'No WebGL canvas found');
    }
    
    // Get canvas context and check if it's rendering
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
    if (!gl) {
      return addResult('Avatar Visibility', false, 'No WebGL context available');
    }
    
    // Check canvas dimensions
    const width = canvas.width;
    const height = canvas.height;
    
    if (width === 0 || height === 0) {
      return addResult('Avatar Visibility', false, 'Canvas has zero dimensions');
    }
    
    // Read pixels from center of canvas to check if something is rendered
    const pixels = new Uint8Array(4);
    gl.readPixels(width/2, height/2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    
    // Check if center pixel is not just background
    const isNotBackground = pixels[0] !== 0 || pixels[1] !== 0 || pixels[2] !== 0;
    
    return addResult(
      'Avatar Visibility', 
      isNotBackground, 
      `Canvas: ${width}x${height}, Center pixel: RGB(${pixels[0]},${pixels[1]},${pixels[2]})`
    );
  };
  
  // Test 2: Check avatar bounds and positioning
  const testAvatarBounds = async () => {
    // Try to access Three.js scene through React Three Fiber
    const canvas = document.querySelector('.avatar-canvas');
    if (!canvas || !canvas.__r3f) {
      return addResult('Avatar Bounds', false, 'Three.js scene not accessible');
    }
    
    const { scene, camera } = canvas.__r3f.store.getState();
    
    if (!scene || !camera) {
      return addResult('Avatar Bounds', false, 'Scene or camera not found');
    }
    
    // Find the avatar model in the scene
    let avatarModel = null;
    let modelBounds = null;
    
    scene.traverse((child) => {
      if (child.type === 'Group' || child.type === 'Mesh' || child.type === 'SkinnedMesh') {
        if (!avatarModel && child.geometry) {
          avatarModel = child;
        }
      }
    });
    
    if (!avatarModel) {
      // Try to find any object with geometry
      scene.traverse((child) => {
        if (!avatarModel && child.isMesh) {
          avatarModel = child;
        }
      });
    }
    
    if (avatarModel) {
      const box = new THREE.Box3().setFromObject(avatarModel);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      modelBounds = {
        size: { x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2) },
        center: { x: center.x.toFixed(2), y: center.y.toFixed(2), z: center.z.toFixed(2) },
        min: { x: box.min.x.toFixed(2), y: box.min.y.toFixed(2), z: box.min.z.toFixed(2) },
        max: { x: box.max.x.toFixed(2), y: box.max.y.toFixed(2), z: box.max.z.toFixed(2) }
      };
      
      // Check if avatar is properly sized (not too big, not too small)
      const isProperSize = size.y > 0.5 && size.y < 3;
      const isCentered = Math.abs(center.x) < 1 && Math.abs(center.z) < 1;
      
      return addResult(
        'Avatar Bounds',
        isProperSize && isCentered,
        `Size: ${JSON.stringify(modelBounds.size)}, Center: ${JSON.stringify(modelBounds.center)}`
      );
    }
    
    return addResult('Avatar Bounds', false, 'No avatar model found in scene');
  };
  
  // Test 3: Check camera framing
  const testCameraFraming = async () => {
    const canvas = document.querySelector('.avatar-canvas');
    if (!canvas || !canvas.__r3f) {
      return addResult('Camera Framing', false, 'Three.js scene not accessible');
    }
    
    const { camera } = canvas.__r3f.store.getState();
    
    if (!camera) {
      return addResult('Camera Framing', false, 'Camera not found');
    }
    
    const cameraInfo = {
      position: {
        x: camera.position.x.toFixed(2),
        y: camera.position.y.toFixed(2),
        z: camera.position.z.toFixed(2)
      },
      fov: camera.fov,
      aspect: camera.aspect?.toFixed(2)
    };
    
    // Check if camera is at a reasonable distance
    const distance = camera.position.length();
    const isGoodDistance = distance > 1 && distance < 10;
    
    return addResult(
      'Camera Framing',
      isGoodDistance,
      `Position: ${JSON.stringify(cameraInfo.position)}, Distance: ${distance.toFixed(2)}, FOV: ${cameraInfo.fov}`
    );
  };
  
  // Test 4: Check lighting
  const testLighting = async () => {
    const canvas = document.querySelector('.avatar-canvas');
    if (!canvas || !canvas.__r3f) {
      return addResult('Lighting Setup', false, 'Three.js scene not accessible');
    }
    
    const { scene } = canvas.__r3f.store.getState();
    
    const lights = [];
    scene.traverse((child) => {
      if (child.isLight) {
        lights.push({
          type: child.type,
          intensity: child.intensity,
          color: child.color?.getHexString()
        });
      }
    });
    
    const hasLights = lights.length > 0;
    const hasAmbient = lights.some(l => l.type === 'AmbientLight');
    const hasDirectional = lights.some(l => l.type === 'DirectionalLight' || l.type === 'PointLight');
    
    return addResult(
      'Lighting Setup',
      hasLights && hasAmbient,
      `Found ${lights.length} lights: ${lights.map(l => l.type).join(', ')}`
    );
  };
  
  // Test 5: Take screenshot and analyze
  const testScreenshot = async () => {
    const canvas = document.querySelector('.avatar-canvas canvas');
    if (!canvas) {
      return addResult('Screenshot Analysis', false, 'No canvas found');
    }
    
    try {
      // Convert canvas to data URL
      const dataURL = canvas.toDataURL('image/png');
      
      // Create image to analyze
      const img = new Image();
      img.src = dataURL;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // Create canvas for pixel analysis
      const testCanvas = document.createElement('canvas');
      testCanvas.width = canvas.width;
      testCanvas.height = canvas.height;
      const ctx = testCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      // Sample pixels at different points
      const samples = [
        { x: canvas.width / 2, y: canvas.height / 4, name: 'top' },
        { x: canvas.width / 2, y: canvas.height / 2, name: 'center' },
        { x: canvas.width / 2, y: canvas.height * 3/4, name: 'bottom' }
      ];
      
      const pixelData = samples.map(sample => {
        const data = ctx.getImageData(sample.x, sample.y, 1, 1).data;
        return {
          name: sample.name,
          rgb: `${data[0]},${data[1]},${data[2]}`,
          isVisible: data[3] > 0 && (data[0] > 10 || data[1] > 10 || data[2] > 10)
        };
      });
      
      const hasVisibleContent = pixelData.some(p => p.isVisible);
      
      return addResult(
        'Screenshot Analysis',
        hasVisibleContent,
        `Pixel samples: ${pixelData.map(p => `${p.name}(${p.rgb})`).join(', ')}`
      );
    } catch (error) {
      return addResult('Screenshot Analysis', false, `Error: ${error.message}`);
    }
  };
  
  // Test 6: Check avatar animations
  const testAnimations = async () => {
    const canvas = document.querySelector('.avatar-canvas');
    if (!canvas || !canvas.__r3f) {
      return addResult('Animations', false, 'Three.js scene not accessible');
    }
    
    const { scene } = canvas.__r3f.store.getState();
    
    let mixer = null;
    let animations = [];
    
    scene.traverse((child) => {
      if (child.animations && child.animations.length > 0) {
        animations = child.animations;
      }
    });
    
    return addResult(
      'Animations',
      animations.length > 0,
      `Found ${animations.length} animations`
    );
  };
  
  // Test 7: Check interactivity
  const testInteractivity = async () => {
    const canvas = document.querySelector('.avatar-canvas');
    if (!canvas) {
      return addResult('Interactivity', false, 'Canvas not found');
    }
    
    // Simulate mouse move
    const event = new MouseEvent('mousemove', {
      clientX: 100,
      clientY: 100,
      bubbles: true
    });
    
    canvas.dispatchEvent(event);
    
    // Check if OrbitControls are working
    const hasOrbitControls = document.querySelector('[data-testid="orbit-controls"]') || 
                            canvas.__r3f?.store.getState().controls;
    
    return addResult(
      'Interactivity',
      hasOrbitControls !== null,
      hasOrbitControls ? 'OrbitControls detected' : 'No controls found'
    );
  };
  
  // Test 8: Performance check
  const testPerformance = async () => {
    return new Promise((resolve) => {
      let frameCount = 0;
      const startTime = performance.now();
      
      const countFrames = () => {
        frameCount++;
        if (performance.now() - startTime < 1000) {
          requestAnimationFrame(countFrames);
        } else {
          const fps = frameCount;
          const passed = fps >= 30;
          resolve(addResult(
            'Performance',
            passed,
            `${fps} FPS (${passed ? 'Good' : fps >= 20 ? 'Acceptable' : 'Poor'})`
          ));
        }
      };
      
      requestAnimationFrame(countFrames);
    });
  };
  
  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const tests = [
      testAvatarVisibility,
      testAvatarBounds,
      testCameraFraming,
      testLighting,
      testScreenshot,
      testAnimations,
      testInteractivity,
      testPerformance
    ];
    
    for (const test of tests) {
      await test();
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsRunning(false);
    
    if (onTestComplete) {
      onTestComplete(testResults);
    }
  };
  
  useEffect(() => {
    // Auto-run tests after component mounts
    const timer = setTimeout(() => {
      runAllTests();
    }, 2000); // Wait for avatar to load
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="visual-test-suite">
      <div className="test-header">
        <h3>Visual Validation Suite</h3>
        <button 
          onClick={runAllTests} 
          disabled={isRunning}
          className="run-button"
        >
          {isRunning ? '⏳ Running...' : '▶️ Run Tests'}
        </button>
      </div>
      
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
      
      <div className="test-summary">
        {testResults.length > 0 && (
          <>
            <div className="summary-stat">
              Total: {testResults.length}
            </div>
            <div className="summary-stat passed">
              Passed: {testResults.filter(r => r.passed).length}
            </div>
            <div className="summary-stat failed">
              Failed: {testResults.filter(r => !r.passed).length}
            </div>
            <div className="summary-stat">
              Success Rate: {Math.round((testResults.filter(r => r.passed).length / testResults.length) * 100)}%
            </div>
          </>
        )}
      </div>
      
      <style jsx>{`
        .visual-test-suite {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin: 20px 0;
        }
        
        .test-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .test-header h3 {
          margin: 0;
          color: #1f2937;
        }
        
        .run-button {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }
        
        .run-button:hover:not(:disabled) {
          background: #2563eb;
        }
        
        .run-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
          transition: all 0.2s;
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
          flex: 1;
        }
        
        .test-summary {
          display: flex;
          gap: 20px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
        }
        
        .summary-stat {
          padding: 8px 16px;
          background: #f3f4f6;
          border-radius: 6px;
          font-weight: 500;
        }
        
        .summary-stat.passed {
          background: #d1fae5;
          color: #065f46;
        }
        
        .summary-stat.failed {
          background: #fee2e2;
          color: #991b1b;
        }
      `}</style>
    </div>
  );
}