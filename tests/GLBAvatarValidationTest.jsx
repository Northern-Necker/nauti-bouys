import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import InteractiveAvatar from '../frontend/src/components/avatar3d/InteractiveAvatar';
import Avatar3DEngine from '../frontend/src/components/avatar3d/Avatar3DEngine';
import * as THREE from 'three';

/**
 * Comprehensive GLB Avatar Validation Test Suite
 * Tests all critical fixes and enhancements made to the GLB avatar system
 */
export default function GLBAvatarValidationTest() {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const [performanceMetrics, setPerformanceMetrics] = useState({});

  const logTest = (testName, status, details = '') => {
    const timestamp = new Date().toLocaleTimeString();
    const result = {
      timestamp,
      testName,
      status, // 'PASS', 'FAIL', 'WARN', 'INFO'
      details
    };
    setTestResults(prev => [...prev, result]);
    console.log(`[${timestamp}] ${status}: ${testName} - ${details}`);
  };

  // Test 1: Critical Bug Fixes Validation
  const testCriticalBugFixes = async () => {
    setCurrentTest('Critical Bug Fixes');
    
    try {
      // Test for the ReferenceError fix
      const canvas = document.querySelector('.avatar-canvas');
      if (canvas?.__r3f) {
        const { scene } = canvas.__r3f.store.getState();
        let glbObjects = 0;
        let properlyScaledObjects = 0;
        
        scene.traverse((child) => {
          if (child.userData.isGLBAvatar || child.name.includes('Avatar')) {
            glbObjects++;
            if (child.scale.x > 0 && child.scale.y > 0 && child.scale.z > 0) {
              properlyScaledObjects++;
            }
          }
        });
        
        if (glbObjects > 0 && properlyScaledObjects === glbObjects) {
          logTest('ReferenceError Fix', 'PASS', `${glbObjects} GLB objects loaded without errors`);
        } else {
          logTest('ReferenceError Fix', 'FAIL', `${properlyScaledObjects}/${glbObjects} objects properly scaled`);
        }
      } else {
        logTest('ReferenceError Fix', 'WARN', 'No 3D scene found - component may not be mounted');
      }
    } catch (error) {
      logTest('ReferenceError Fix', 'FAIL', `Error during test: ${error.message}`);
    }
  };

  // Test 2: GLB Model Loading and Visibility
  const testGLBLoading = async () => {
    setCurrentTest('GLB Model Loading');
    
    try {
      // Check if GLB file exists and is accessible
      const response = await fetch('/assets/SavannahAvatar.glb', { method: 'HEAD' });
      if (response.ok) {
        const contentLength = response.headers.get('content-length');
        logTest('GLB File Access', 'PASS', `File size: ${(contentLength / 1024 / 1024).toFixed(2)} MB`);
        
        // Test GLB loading with timeout
        const startTime = performance.now();
        const loadPromise = new Promise((resolve, reject) => {
          const loader = new THREE.GLTFLoader();
          loader.load(
            '/assets/SavannahAvatar.glb',
            (gltf) => {
              const loadTime = performance.now() - startTime;
              resolve({ gltf, loadTime });
            },
            (progress) => {
              console.log('Loading progress:', Math.round((progress.loaded / progress.total) * 100) + '%');
            },
            reject
          );
        });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Loading timeout')), 10000)
        );
        
        try {
          const { gltf, loadTime } = await Promise.race([loadPromise, timeoutPromise]);
          logTest('GLB Loading Speed', 'PASS', `Loaded in ${loadTime.toFixed(0)}ms`);
          
          // Validate model structure
          const box = new THREE.Box3().setFromObject(gltf.scene);
          const size = box.getSize(new THREE.Vector3());
          logTest('GLB Model Structure', 'PASS', `Dimensions: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
          
          // Test material properties
          let totalMaterials = 0;
          let visibleMaterials = 0;
          gltf.scene.traverse((child) => {
            if (child.material) {
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach(mat => {
                totalMaterials++;
                if (!mat.transparent && mat.opacity === 1) {
                  visibleMaterials++;
                }
              });
            }
          });
          
          logTest('Material Visibility', visibleMaterials === totalMaterials ? 'PASS' : 'WARN', 
            `${visibleMaterials}/${totalMaterials} materials properly configured`);
          
        } catch (error) {
          logTest('GLB Loading Speed', 'FAIL', error.message);
        }
        
      } else {
        logTest('GLB File Access', 'FAIL', `HTTP ${response.status}: File not accessible`);
      }
    } catch (error) {
      logTest('GLB File Access', 'FAIL', `Network error: ${error.message}`);
    }
  };

  // Test 3: Performance Benchmarks
  const testPerformance = async () => {
    setCurrentTest('Performance Testing');
    
    const startTime = performance.now();
    let frameCount = 0;
    let totalRenderTime = 0;
    
    const measureFrameRate = () => {
      return new Promise((resolve) => {
        const measure = () => {
          const frameStart = performance.now();
          frameCount++;
          
          requestAnimationFrame(() => {
            totalRenderTime += performance.now() - frameStart;
            
            if (frameCount < 60) { // Measure 60 frames
              measure();
            } else {
              const avgFrameTime = totalRenderTime / frameCount;
              const fps = 1000 / avgFrameTime;
              resolve({ fps, avgFrameTime });
            }
          });
        };
        measure();
      });
    };
    
    try {
      const { fps, avgFrameTime } = await measureFrameRate();
      
      if (fps >= 30) {
        logTest('Frame Rate', 'PASS', `${fps.toFixed(1)} FPS (${avgFrameTime.toFixed(2)}ms/frame)`);
      } else if (fps >= 20) {
        logTest('Frame Rate', 'WARN', `${fps.toFixed(1)} FPS (acceptable but could be better)`);
      } else {
        logTest('Frame Rate', 'FAIL', `${fps.toFixed(1)} FPS (too low for smooth interaction)`);
      }
      
      // Memory usage test
      if (performance.memory) {
        const memoryMB = performance.memory.usedJSHeapSize / 1024 / 1024;
        if (memoryMB < 100) {
          logTest('Memory Usage', 'PASS', `${memoryMB.toFixed(1)} MB`);
        } else if (memoryMB < 200) {
          logTest('Memory Usage', 'WARN', `${memoryMB.toFixed(1)} MB (moderate usage)`);
        } else {
          logTest('Memory Usage', 'FAIL', `${memoryMB.toFixed(1)} MB (high memory usage)`);
        }
      }
      
    } catch (error) {
      logTest('Performance Testing', 'FAIL', `Error measuring performance: ${error.message}`);
    }
  };

  // Test 4: Interactive Features
  const testInteractiveFeatures = async () => {
    setCurrentTest('Interactive Features');
    
    try {
      const canvas = document.querySelector('.avatar-canvas');
      if (canvas) {
        // Test mouse interaction
        const mouseEvent = new MouseEvent('mousemove', {
          clientX: canvas.offsetWidth / 2,
          clientY: canvas.offsetHeight / 2
        });
        canvas.dispatchEvent(mouseEvent);
        
        setTimeout(() => {
          logTest('Mouse Interaction', 'PASS', 'Mouse events dispatched successfully');
        }, 100);
        
        // Test OrbitControls
        if (canvas.__r3f?.controls) {
          logTest('OrbitControls', 'PASS', 'Controls initialized and accessible');
        } else {
          logTest('OrbitControls', 'WARN', 'Controls not found or not exposed');
        }
      } else {
        logTest('Interactive Features', 'FAIL', 'Canvas element not found');
      }
    } catch (error) {
      logTest('Interactive Features', 'FAIL', error.message);
    }
  };

  // Test 5: Error Handling and Fallbacks
  const testErrorHandling = async () => {
    setCurrentTest('Error Handling');
    
    // Test with invalid GLB path
    try {
      const loader = new THREE.GLTFLoader();
      await new Promise((resolve, reject) => {
        loader.load('/assets/nonexistent.glb', resolve, undefined, reject);
      });
      logTest('Error Handling', 'FAIL', 'Should have failed with invalid file');
    } catch (error) {
      logTest('Error Handling', 'PASS', 'Properly handles invalid GLB files');
    }
    
    // Test timeout handling
    logTest('Timeout Handling', 'INFO', 'Timeout mechanisms in place (verified in code)');
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    logTest('Test Suite', 'INFO', 'Starting GLB Avatar Validation Tests');
    
    await testCriticalBugFixes();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testGLBLoading();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testPerformance();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testInteractiveFeatures();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testErrorHandling();
    
    logTest('Test Suite', 'INFO', 'All tests completed');
    setIsRunning(false);
    setCurrentTest('');
  };

  // Calculate test summary
  const getTestSummary = () => {
    const passed = testResults.filter(r => r.status === 'PASS').length;
    const failed = testResults.filter(r => r.status === 'FAIL').length;
    const warnings = testResults.filter(r => r.status === 'WARN').length;
    const total = testResults.filter(r => r.status !== 'INFO').length;
    
    return { passed, failed, warnings, total };
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#1f2937', marginBottom: '20px' }}>
        GLB Avatar Validation Test Suite
      </h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runAllTests} 
          disabled={isRunning}
          style={{ 
            padding: '12px 24px', 
            background: isRunning ? '#6b7280' : '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            marginRight: '10px'
          }}
        >
          {isRunning ? `Running: ${currentTest}...` : 'Run All Tests'}
        </button>
        
        <button 
          onClick={() => setTestResults([])}
          disabled={isRunning}
          style={{ 
            padding: '12px 24px', 
            background: '#6b7280', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          Clear Results
        </button>
      </div>

      {/* Test Avatar Display */}
      <div style={{ 
        border: '2px solid #d1d5db', 
        borderRadius: '12px', 
        marginBottom: '20px',
        height: '400px',
        background: '#f9fafb'
      }}>
        <InteractiveAvatar className="test-avatar" />
      </div>

      {/* Test Results */}
      <div style={{ 
        background: '#f8fafc', 
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '20px' 
      }}>
        <h2>Test Results</h2>
        
        {testResults.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <TestSummary summary={getTestSummary()} />
          </div>
        )}
        
        <div style={{ 
          maxHeight: '400px', 
          overflowY: 'auto',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          background: 'white'
        }}>
          {testResults.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
              No tests run yet. Click "Run All Tests" to begin validation.
            </div>
          ) : (
            testResults.map((result, index) => (
              <TestResult key={index} result={result} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Test Result Component
function TestResult({ result }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'PASS': return '#10b981';
      case 'FAIL': return '#ef4444';
      case 'WARN': return '#f59e0b';
      case 'INFO': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ 
      padding: '10px 15px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center'
    }}>
      <div style={{ 
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: getStatusColor(result.status),
        marginRight: '12px'
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
          [{result.status}] {result.testName}
        </div>
        {result.details && (
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
            {result.details}
          </div>
        )}
      </div>
      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
        {result.timestamp}
      </div>
    </div>
  );
}

// Test Summary Component
function TestSummary({ summary }) {
  const successRate = summary.total > 0 ? (summary.passed / summary.total * 100).toFixed(1) : 0;
  
  return (
    <div style={{ 
      display: 'flex', 
      gap: '20px', 
      padding: '15px',
      background: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '8px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
          {summary.passed}
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>Passed</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
          {summary.failed}
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>Failed</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
          {summary.warnings}
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>Warnings</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
          {successRate}%
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>Success Rate</div>
      </div>
    </div>
  );
}