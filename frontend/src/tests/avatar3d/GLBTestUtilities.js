/**
 * GLB Avatar Testing Utilities
 * 
 * This module provides helper functions and utilities for testing
 * GLB avatar functionality, including mocks, validators, and performance monitors.
 */

import * as THREE from 'three';
import { vi } from 'vitest';

/**
 * Mock GLB Scene Generator
 * Creates realistic mock objects for testing GLB model functionality
 */
export class MockGLBGenerator {
  static createMockGLTF(options = {}) {
    const {
      hasAnimations = true,
      hasMeshes = true,
      hasHeadBone = true,
      modelSize = { x: 1, y: 2, z: 1 },
      meshCount = 5
    } = options;

    const mockScene = {
      name: 'SavannahAvatar',
      type: 'Group',
      children: [],
      scale: {
        x: 1, y: 1, z: 1,
        setScalar: vi.fn(function(value) {
          this.x = this.y = this.z = value;
        })
      },
      position: {
        x: 0, y: 0, z: 0,
        set: vi.fn(function(x, y, z) {
          this.x = x; this.y = y; this.z = z;
        })
      },
      traverse: vi.fn((callback) => {
        // Generate mock meshes
        if (hasMeshes) {
          for (let i = 0; i < meshCount; i++) {
            const mockMesh = MockGLBGenerator.createMockMesh(`Mesh_${i}`);
            callback(mockMesh);
          }
        }
        
        // Generate mock bones
        if (hasHeadBone) {
          const headBone = MockGLBGenerator.createMockBone('Head');
          callback(headBone);
          
          const neckBone = MockGLBGenerator.createMockBone('Neck');
          callback(neckBone);
        }
      })
    };

    const mockAnimations = hasAnimations ? [
      {
        name: 'idle',
        duration: 2.5,
        tracks: []
      },
      {
        name: 'speaking',
        duration: 1.0,
        tracks: []
      }
    ] : [];

    return {
      scene: mockScene,
      animations: mockAnimations,
      asset: {
        generator: 'Khronos glTF Blender I/O v3.4.50',
        version: '2.0'
      },
      cameras: [],
      materials: [],
      meshes: [],
      nodes: []
    };
  }

  static createMockMesh(name) {
    return {
      name,
      type: 'Mesh',
      isMesh: true,
      geometry: {
        attributes: {
          position: { count: 1000 },
          normal: { count: 1000 },
          uv: { count: 1000 }
        }
      },
      material: {
        name: `Material_${name}`,
        type: 'MeshStandardMaterial',
        transparent: Math.random() > 0.5, // Random initial state
        opacity: Math.random(),
        side: THREE.FrontSide,
        color: { r: Math.random(), g: Math.random(), b: Math.random() }
      },
      visible: true,
      frustumCulled: true
    };
  }

  static createMockBone(name) {
    return {
      name,
      type: 'Bone',
      isBone: true,
      rotation: {
        x: 0, y: 0, z: 0,
        _x: 0, _y: 0, _z: 0
      },
      position: {
        x: 0, y: 0, z: 0
      }
    };
  }

  static createMockBox3(size = { x: 1, y: 2, z: 1 }) {
    return {
      min: { x: -size.x/2, y: 0, z: -size.z/2 },
      max: { x: size.x/2, y: size.y, z: size.z/2 },
      setFromObject: vi.fn().mockReturnThis(),
      getSize: vi.fn().mockReturnValue(size),
      getCenter: vi.fn().mockReturnValue({ 
        x: 0, 
        y: size.y/2, 
        z: 0 
      })
    };
  }
}

/**
 * GLB Validation Utilities
 * Functions to validate GLB model properties and behavior
 */
export class GLBValidator {
  /**
   * Validates that a GLB model meets basic requirements
   */
  static validateGLBStructure(gltf) {
    const validationResults = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check required properties
    if (!gltf.scene) {
      validationResults.errors.push('Missing scene property');
      validationResults.isValid = false;
    }

    if (!gltf.animations) {
      validationResults.warnings.push('No animations found');
    }

    // Validate scene structure
    if (gltf.scene && !gltf.scene.traverse) {
      validationResults.errors.push('Scene missing traverse method');
      validationResults.isValid = false;
    }

    return validationResults;
  }

  /**
   * Validates material visibility settings
   */
  static validateMaterialVisibility(scene) {
    const materialIssues = [];
    let meshCount = 0;

    scene.traverse((child) => {
      if (child.isMesh) {
        meshCount++;
        
        if (!child.material) {
          materialIssues.push(`Mesh ${child.name} has no material`);
        } else {
          const material = child.material;
          
          // Check visibility settings
          if (material.transparent && material.opacity < 1) {
            materialIssues.push(`Mesh ${child.name} may be invisible (transparent: true, opacity: ${material.opacity})`);
          }
          
          if (material.side !== THREE.DoubleSide) {
            materialIssues.push(`Mesh ${child.name} using single-sided material (may cause culling issues)`);
          }
        }
        
        if (child.frustumCulled !== false) {
          materialIssues.push(`Mesh ${child.name} has frustum culling enabled (may cause visibility issues)`);
        }
      }
    });

    return {
      meshCount,
      issues: materialIssues,
      isValid: materialIssues.length === 0
    };
  }

  /**
   * Validates avatar scaling calculations
   */
  static validateScaling(gltf, targetHeight = 1.8) {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const scale = targetHeight / size.y;
    
    return {
      originalSize: size,
      targetHeight,
      calculatedScale: scale,
      finalScale: scale * 0.6, // The additional reduction factor
      isReasonableScale: scale > 0.1 && scale < 10, // Sanity check
      wouldBeVisible: (size.x * scale) > 0.1 && (size.y * scale) > 0.1
    };
  }

  /**
   * Finds and validates head bones for tracking
   */
  static findHeadBones(scene) {
    const bones = [];
    const headBones = [];

    scene.traverse((child) => {
      if (child.isBone) {
        bones.push(child);
        
        const name = child.name.toLowerCase();
        if (name.includes('head') || name.includes('neck') || name.includes('skull')) {
          headBones.push({
            bone: child,
            name: child.name,
            type: name.includes('head') ? 'head' : 
                  name.includes('neck') ? 'neck' : 'skull'
          });
        }
      }
    });

    return {
      totalBones: bones.length,
      headBones: headBones,
      hasTrackableBone: headBones.length > 0,
      recommendedBone: headBones.find(b => b.type === 'head') || headBones[0]
    };
  }
}

/**
 * Performance Monitoring Utilities
 * Tools for measuring GLB loading and rendering performance
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      loadStart: null,
      loadEnd: null,
      renderStart: null,
      renderEnd: null,
      memoryStart: null,
      memoryEnd: null,
      frameTimings: []
    };
  }

  startLoading() {
    this.metrics.loadStart = performance.now();
    this.metrics.memoryStart = this.getMemoryUsage();
  }

  endLoading() {
    this.metrics.loadEnd = performance.now();
    this.metrics.memoryEnd = this.getMemoryUsage();
  }

  startRendering() {
    this.metrics.renderStart = performance.now();
  }

  endRendering() {
    this.metrics.renderEnd = performance.now();
  }

  recordFrame() {
    const now = performance.now();
    if (this.metrics.lastFrame) {
      const frameTime = now - this.metrics.lastFrame;
      this.metrics.frameTimings.push(frameTime);
      
      // Keep only last 60 frame timings (1 second at 60fps)
      if (this.metrics.frameTimings.length > 60) {
        this.metrics.frameTimings.shift();
      }
    }
    this.metrics.lastFrame = now;
  }

  getLoadTime() {
    if (this.metrics.loadStart && this.metrics.loadEnd) {
      return this.metrics.loadEnd - this.metrics.loadStart;
    }
    return null;
  }

  getRenderTime() {
    if (this.metrics.renderStart && this.metrics.renderEnd) {
      return this.metrics.renderEnd - this.metrics.renderStart;
    }
    return null;
  }

  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  getMemoryIncrease() {
    if (this.metrics.memoryStart && this.metrics.memoryEnd) {
      return this.metrics.memoryEnd.used - this.metrics.memoryStart.used;
    }
    return null;
  }

  getAverageFrameTime() {
    if (this.metrics.frameTimings.length === 0) return null;
    
    const sum = this.metrics.frameTimings.reduce((a, b) => a + b, 0);
    return sum / this.metrics.frameTimings.length;
  }

  getFPS() {
    const avgFrameTime = this.getAverageFrameTime();
    return avgFrameTime ? 1000 / avgFrameTime : null;
  }

  getReport() {
    return {
      loading: {
        time: this.getLoadTime(),
        memoryIncrease: this.getMemoryIncrease()
      },
      rendering: {
        time: this.getRenderTime()
      },
      performance: {
        averageFrameTime: this.getAverageFrameTime(),
        fps: this.getFPS(),
        frameCount: this.metrics.frameTimings.length
      },
      memory: {
        current: this.getMemoryUsage()
      }
    };
  }

  isPerformanceAcceptable(thresholds = {}) {
    const defaults = {
      maxLoadTime: 5000, // 5 seconds
      minFPS: 30,
      maxMemoryIncrease: 100 * 1024 * 1024, // 100MB
      maxRenderTime: 100 // 100ms
    };
    
    const limits = { ...defaults, ...thresholds };
    const report = this.getReport();
    
    return {
      loadTimeOK: !report.loading.time || report.loading.time <= limits.maxLoadTime,
      fpsOK: !report.performance.fps || report.performance.fps >= limits.minFPS,
      memoryOK: !report.loading.memoryIncrease || report.loading.memoryIncrease <= limits.maxMemoryIncrease,
      renderTimeOK: !report.rendering.time || report.rendering.time <= limits.maxRenderTime,
      overallOK: function() {
        return this.loadTimeOK && this.fpsOK && this.memoryOK && this.renderTimeOK;
      }
    };
  }
}

/**
 * Mouse Tracking Test Utilities
 */
export class MouseTrackingTester {
  /**
   * Simulates mouse movement and calculates expected head rotation
   */
  static simulateMouseMovement(mouseX, mouseY, containerWidth, containerHeight) {
    const normalizedX = mouseX / containerWidth;
    const normalizedY = mouseY / containerHeight;
    
    // These match the calculations in InteractiveAvatar
    const targetRotationY = (normalizedX - 0.5) * 0.5;
    const targetRotationX = (normalizedY - 0.5) * 0.3;
    
    return {
      normalizedPosition: { x: normalizedX, y: normalizedY },
      targetRotation: { x: -targetRotationX, y: targetRotationY },
      isInBounds: normalizedX >= 0 && normalizedX <= 1 && normalizedY >= 0 && normalizedY <= 1
    };
  }

  /**
   * Tests head tracking interpolation
   */
  static testHeadInterpolation(currentRotation, targetRotation, lerpFactor = 0.1) {
    const newRotationY = THREE.MathUtils.lerp(currentRotation.y, targetRotation.y, lerpFactor);
    const newRotationX = THREE.MathUtils.lerp(currentRotation.x, targetRotation.x, lerpFactor);
    
    return {
      x: newRotationX,
      y: newRotationY,
      changeAmount: {
        x: Math.abs(newRotationX - currentRotation.x),
        y: Math.abs(newRotationY - currentRotation.y)
      }
    };
  }

  /**
   * Validates head rotation bounds
   */
  static validateRotationBounds(rotation, maxRotation = { x: 0.3, y: 0.5 }) {
    return {
      xInBounds: Math.abs(rotation.x) <= maxRotation.x,
      yInBounds: Math.abs(rotation.y) <= maxRotation.y,
      bothInBounds: function() { return this.xInBounds && this.yInBounds; }
    };
  }
}

/**
 * Fallback Testing Utilities
 */
export class FallbackTester {
  /**
   * Simulates GLB loading failure
   */
  static simulateGLBFailure() {
    return new Error('Failed to load GLB model: Network error');
  }

  /**
   * Simulates image fallback loading states
   */
  static simulateImageFallback(shouldJPGFail = false, shouldPNGFail = false) {
    const results = {
      jpgAttempted: true,
      jpgSuccess: !shouldJPGFail,
      pngAttempted: shouldJPGFail,
      pngSuccess: shouldJPGFail ? !shouldPNGFail : false,
      finalFallback: shouldJPGFail && shouldPNGFail,
      fallbackChain: []
    };

    results.fallbackChain.push('GLB (failed)');
    
    if (shouldJPGFail) {
      results.fallbackChain.push('JPG (failed)');
      if (shouldPNGFail) {
        results.fallbackChain.push('PNG (failed)');
        results.fallbackChain.push('Colored Plane (final)');
      } else {
        results.fallbackChain.push('PNG (success)');
      }
    } else {
      results.fallbackChain.push('JPG (success)');
    }

    return results;
  }

  /**
   * Tests parallax effect calculation for image fallback
   */
  static calculateParallaxOffset(mousePosition, parallaxFactor = 0.02) {
    const offsetX = (mousePosition.x - 0.5) * parallaxFactor;
    const offsetY = (mousePosition.y - 0.5) * parallaxFactor;
    
    return {
      x: offsetX,
      y: -offsetY, // Negative Y for natural movement
      magnitude: Math.sqrt(offsetX * offsetX + offsetY * offsetY),
      isSubtle: Math.abs(offsetX) < 0.05 && Math.abs(offsetY) < 0.05
    };
  }
}

/**
 * Test Data Generators
 */
export class TestDataGenerator {
  /**
   * Generates test cases for various screen resolutions
   */
  static getScreenResolutionTestCases() {
    return [
      { name: 'Mobile Portrait', width: 390, height: 844 },
      { name: 'Mobile Landscape', width: 844, height: 390 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Tablet Landscape', width: 1024, height: 768 },
      { name: 'Surface Pro', width: 1368, height: 912 },
      { name: 'Desktop HD', width: 1920, height: 1080 },
      { name: 'Desktop 4K', width: 3840, height: 2160 }
    ];
  }

  /**
   * Generates mouse movement test patterns
   */
  static getMouseMovementPatterns(containerWidth = 400, containerHeight = 300) {
    return {
      linear: [
        { x: 0, y: containerHeight / 2 },
        { x: containerWidth / 4, y: containerHeight / 2 },
        { x: containerWidth / 2, y: containerHeight / 2 },
        { x: (containerWidth * 3) / 4, y: containerHeight / 2 },
        { x: containerWidth, y: containerHeight / 2 }
      ],
      circular: Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * 2 * Math.PI;
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        const radius = Math.min(centerX, centerY) * 0.8;
        return {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        };
      }),
      corners: [
        { x: 0, y: 0 },
        { x: containerWidth, y: 0 },
        { x: containerWidth, y: containerHeight },
        { x: 0, y: containerHeight },
        { x: containerWidth / 2, y: containerHeight / 2 }
      ],
      random: Array.from({ length: 20 }, () => ({
        x: Math.random() * containerWidth,
        y: Math.random() * containerHeight
      }))
    };
  }

  /**
   * Generates performance test scenarios
   */
  static getPerformanceTestScenarios() {
    return [
      {
        name: 'Optimal Conditions',
        networkSpeed: 'fast',
        devicePower: 'high',
        expectedLoadTime: 2000,
        expectedFPS: 60
      },
      {
        name: 'Slow Network',
        networkSpeed: 'slow-3g',
        devicePower: 'high',
        expectedLoadTime: 8000,
        expectedFPS: 60
      },
      {
        name: 'Low-end Device',
        networkSpeed: 'fast',
        devicePower: 'low',
        expectedLoadTime: 3000,
        expectedFPS: 30
      },
      {
        name: 'Worst Case',
        networkSpeed: 'slow-3g',
        devicePower: 'low',
        expectedLoadTime: 10000,
        expectedFPS: 20
      }
    ];
  }
}

/**
 * Error Simulation Utilities
 */
export class ErrorSimulator {
  /**
   * Creates WebGL context loss simulation
   */
  static simulateWebGLContextLoss() {
    const mockCanvas = {
      getContext: vi.fn(() => null),
      addEventListener: vi.fn()
    };
    
    return {
      canvas: mockCanvas,
      error: new Error('WebGL context lost'),
      recovery: () => {
        mockCanvas.getContext.mockReturnValue({
          isWebGL2: true,
          getParameter: vi.fn()
        });
      }
    };
  }

  /**
   * Simulates memory pressure scenarios
   */
  static simulateMemoryPressure() {
    const originalMemory = performance.memory;
    
    // Mock memory object showing high usage
    const mockMemory = {
      usedJSHeapSize: 180 * 1024 * 1024, // 180MB used
      totalJSHeapSize: 200 * 1024 * 1024, // 200MB total
      jsHeapSizeLimit: 200 * 1024 * 1024  // 200MB limit
    };
    
    return {
      mockMemory,
      isHighUsage: () => mockMemory.usedJSHeapSize / mockMemory.jsHeapSizeLimit > 0.8,
      restore: () => {
        if (originalMemory) {
          Object.defineProperty(performance, 'memory', { value: originalMemory });
        }
      }
    };
  }

  /**
   * Creates network error scenarios
   */
  static createNetworkErrors() {
    return [
      new Error('Failed to fetch: Network error'),
      new Error('Failed to fetch: 404 Not Found'),
      new Error('Failed to fetch: 500 Internal Server Error'),
      new Error('Failed to fetch: Request timeout'),
      new Error('Failed to fetch: Connection refused')
    ];
  }
}

/**
 * Test Assertion Helpers
 */
export class TestAssertions {
  /**
   * Custom assertion for GLB model validity
   */
  static expectValidGLB(gltf) {
    return {
      toHaveScene: () => {
        expect(gltf).toHaveProperty('scene');
        expect(gltf.scene).toBeTruthy();
      },
      toHaveAnimations: () => {
        expect(gltf).toHaveProperty('animations');
        expect(Array.isArray(gltf.animations)).toBe(true);
      },
      toBeTraversable: () => {
        expect(gltf.scene).toHaveProperty('traverse');
        expect(typeof gltf.scene.traverse).toBe('function');
      },
      toHaveValidScale: () => {
        expect(gltf.scene).toHaveProperty('scale');
        expect(gltf.scene.scale).toHaveProperty('setScalar');
      }
    };
  }

  /**
   * Performance assertion helpers
   */
  static expectPerformance(metrics) {
    return {
      toLoadWithinTime: (maxTime) => {
        expect(metrics.loadTime).toBeLessThan(maxTime);
      },
      toMaintainFrameRate: (minFPS) => {
        expect(metrics.fps).toBeGreaterThan(minFPS);
      },
      toUseMemoryWithinLimit: (maxMemory) => {
        expect(metrics.memoryIncrease).toBeLessThan(maxMemory);
      }
    };
  }

  /**
   * Visual assertion helpers
   */
  static expectVisualState(component) {
    return {
      toBeVisible: () => {
        expect(component).toBeInTheDocument();
        expect(component).toBeVisible();
      },
      toHaveNoErrors: () => {
        const errorElements = component.querySelectorAll('.error, [data-testid*="error"]');
        expect(errorElements).toHaveLength(0);
      },
      toShowLoading: () => {
        const loadingElements = component.querySelectorAll('.loading, [data-testid*="loading"]');
        expect(loadingElements.length).toBeGreaterThan(0);
      }
    };
  }
}

// Export all utilities as default collection
export default {
  MockGLBGenerator,
  GLBValidator,
  PerformanceMonitor,
  MouseTrackingTester,
  FallbackTester,
  TestDataGenerator,
  ErrorSimulator,
  TestAssertions
};