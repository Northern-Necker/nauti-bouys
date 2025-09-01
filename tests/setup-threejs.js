/**
 * Three.js Specific Test Setup
 */

import { jest } from '@jest/globals';

// Mock Three.js modules
jest.mock('three', () => ({
  Scene: jest.fn().mockImplementation(() => ({
    children: [],
    add: jest.fn(),
    remove: jest.fn(),
    traverse: jest.fn(),
    clear: jest.fn()
  })),
  
  PerspectiveCamera: jest.fn().mockImplementation(() => ({
    position: { x: 0, y: 0, z: 5 },
    lookAt: jest.fn(),
    updateProjectionMatrix: jest.fn()
  })),
  
  WebGLRenderer: jest.fn().mockImplementation(() => ({
    render: jest.fn(),
    setSize: jest.fn(),
    dispose: jest.fn(),
    domElement: global.testUtils.createMockCanvas()
  })),
  
  Mesh: jest.fn().mockImplementation((geometry, material) => ({
    geometry,
    material,
    morphTargetInfluences: null,
    morphTargetDictionary: null,
    isMesh: true,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  })),
  
  BoxGeometry: jest.fn().mockImplementation(() => ({
    attributes: {
      position: {
        array: new Float32Array([
          -1, -1, 1,  1, -1, 1,  1, 1, 1,  -1, 1, 1,
          -1, -1, -1, -1, 1, -1,  1, 1, -1,  1, -1, -1
        ]),
        count: 8,
        needsUpdate: false
      }
    },
    morphAttributes: {},
    dispose: jest.fn()
  })),
  
  MeshBasicMaterial: jest.fn().mockImplementation(() => ({
    color: { r: 1, g: 1, b: 1 },
    dispose: jest.fn()
  })),
  
  Float32BufferAttribute: jest.fn().mockImplementation((array, itemSize) => ({
    array: new Float32Array(array),
    itemSize,
    count: array.length / itemSize,
    needsUpdate: false
  })),
  
  Vector3: jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({ x, y, z })),
  
  LoadingManager: jest.fn().mockImplementation(() => ({
    onLoad: jest.fn(),
    onProgress: jest.fn(),
    onError: jest.fn()
  }))
}));

// Mock GLTFLoader
jest.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: jest.fn().mockImplementation(() => ({
    load: jest.fn(),
    setPath: jest.fn(),
    setResourcePath: jest.fn()
  }))
}));

// Three.js specific utilities
global.threeUtils = {
  createMockGLTF: (meshCount = 1, morphTargetsPerMesh = 2) => ({
    scene: {
      children: Array.from({ length: meshCount }, (_, i) => ({
        isMesh: true,
        name: `MockMesh_${i}`,
        geometry: {
          morphAttributes: {
            position: Array.from({ length: morphTargetsPerMesh }, (_, t) => 
              new Float32Array(Array.from({ length: 24 }, () => Math.random() - 0.5))
            )
          }
        },
        material: { name: `MockMaterial_${i}` },
        morphTargetInfluences: null
      })),
      traverse: jest.fn().mockImplementation((callback) => {
        Array.from({ length: meshCount }, (_, i) => ({
          isMesh: true,
          name: `MockMesh_${i}`,
          geometry: {
            morphAttributes: {
              position: Array.from({ length: morphTargetsPerMesh }, (_, t) => 
                new Float32Array(Array.from({ length: 24 }, () => Math.random() - 0.5))
              )
            }
          },
          material: { name: `MockMaterial_${i}` },
          morphTargetInfluences: null
        })).forEach(callback);
      })
    },
    animations: [],
    cameras: [],
    asset: { version: '2.0' }
  }),

  mockRenderer: null,
  mockScene: null,
  mockCamera: null
};

// Setup Three.js environment before each test
beforeEach(() => {
  const { Scene, PerspectiveCamera, WebGLRenderer } = require('three');
  
  global.threeUtils.mockScene = new Scene();
  global.threeUtils.mockCamera = new PerspectiveCamera(75, 1, 0.1, 1000);
  global.threeUtils.mockRenderer = new WebGLRenderer({
    canvas: global.testUtils.createMockCanvas()
  });
});

console.log('✓ Three.js test environment setup complete');