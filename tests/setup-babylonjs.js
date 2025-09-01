/**
 * Babylon.js Specific Test Setup
 */

import { jest } from '@jest/globals';

// Mock Babylon.js core modules
jest.mock('@babylonjs/core', () => ({
  Engine: jest.fn().mockImplementation(() => ({
    dispose: jest.fn(),
    runRenderLoop: jest.fn(),
    stopRenderLoop: jest.fn(),
    resize: jest.fn()
  })),
  
  Scene: jest.fn().mockImplementation(() => ({
    meshes: [],
    dispose: jest.fn(),
    render: jest.fn(),
    registerBeforeRender: jest.fn(),
    unregisterBeforeRender: jest.fn()
  })),
  
  ArcRotateCamera: jest.fn().mockImplementation((name, alpha, beta, radius, target, scene) => ({
    name,
    alpha,
    beta,
    radius,
    setTarget: jest.fn(),
    attachToCanvas: jest.fn(),
    dispose: jest.fn()
  })),
  
  Vector3: jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({ x, y, z })),
  
  HemisphericLight: jest.fn().mockImplementation((name, direction, scene) => ({
    name,
    direction,
    intensity: 1,
    dispose: jest.fn()
  })),
  
  Mesh: {
    CreateBox: jest.fn().mockImplementation((name, options, scene) => ({
      name,
      dispose: jest.fn(),
      morphTargetManager: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scaling: { x: 1, y: 1, z: 1 }
    }))
  },
  
  MeshBuilder: {
    CreateBox: jest.fn().mockImplementation((name, options, scene) => ({
      name,
      dispose: jest.fn(),
      morphTargetManager: null,
      geometry: {
        getVerticesData: jest.fn().mockReturnValue(new Float32Array([
          -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1
        ]))
      },
      material: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scaling: { x: 1, y: 1, z: 1 }
    }))
  },
  
  StandardMaterial: jest.fn().mockImplementation((name, scene) => ({
    name,
    dispose: jest.fn(),
    diffuseColor: { r: 1, g: 1, b: 1 }
  })),
  
  Effect: {
    ShadersStore: {},
    IncludesShadersStore: {}
  },
  
  ShaderMaterial: jest.fn().mockImplementation((name, scene, shaderPath, options) => ({
    name,
    dispose: jest.fn(),
    setFloat: jest.fn(),
    setFloats: jest.fn(),
    setVector3: jest.fn(),
    setMatrix: jest.fn()
  })),
  
  VertexData: jest.fn().mockImplementation(() => ({
    positions: [],
    normals: [],
    indices: [],
    uvs: []
  })),
  
  SceneLoader: {
    LoadAssetContainer: jest.fn(),
    Append: jest.fn(),
    ImportMesh: jest.fn()
  },
  
  Tools: {
    ToRadians: jest.fn().mockImplementation((degrees) => degrees * Math.PI / 180),
    ToDegrees: jest.fn().mockImplementation((radians) => radians * 180 / Math.PI)
  }
}));

// Mock Babylon.js loaders
jest.mock('@babylonjs/loaders/glTF', () => ({}));

// Babylon.js specific utilities
global.babylonUtils = {
  createMockMorphTargetManager: (targetCount = 4) => ({
    numTargets: targetCount,
    getTarget: jest.fn().mockImplementation((index) => ({
      name: `Target_${index}`,
      influence: 0,
      setInfluence: jest.fn().mockImplementation(function(value) {
        this.influence = value;
      })
    })),
    dispose: jest.fn()
  }),

  createMockAssetContainer: (meshCount = 1, morphTargetsPerMesh = 2) => ({
    meshes: Array.from({ length: meshCount }, (_, i) => ({
      name: `MockMesh_${i}`,
      morphTargetManager: global.babylonUtils.createMockMorphTargetManager(morphTargetsPerMesh),
      geometry: {
        getVerticesData: jest.fn().mockReturnValue(new Float32Array(Array.from({ length: 1000 * 3 }, () => Math.random() - 0.5)))
      },
      dispose: jest.fn()
    })),
    dispose: jest.fn()
  }),

  mockWebGLContext: {
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    ARRAY_BUFFER: 34962,
    ELEMENT_ARRAY_BUFFER: 34963,
    STATIC_DRAW: 35044,
    FLOAT: 5126,
    
    createShader: jest.fn().mockReturnValue({}),
    shaderSource: jest.fn(),
    compileShader: jest.fn(),
    getShaderParameter: jest.fn().mockReturnValue(true),
    getShaderInfoLog: jest.fn().mockReturnValue(''),
    
    createProgram: jest.fn().mockReturnValue({}),
    attachShader: jest.fn(),
    linkProgram: jest.fn(),
    getProgramParameter: jest.fn().mockReturnValue(true),
    getProgramInfoLog: jest.fn().mockReturnValue(''),
    
    useProgram: jest.fn(),
    getAttribLocation: jest.fn().mockReturnValue(0),
    getUniformLocation: jest.fn().mockReturnValue({}),
    
    createBuffer: jest.fn().mockReturnValue({}),
    bindBuffer: jest.fn(),
    bufferData: jest.fn(),
    
    enableVertexAttribArray: jest.fn(),
    vertexAttribPointer: jest.fn(),
    
    uniform1f: jest.fn(),
    uniform3fv: jest.fn(),
    uniformMatrix4fv: jest.fn(),
    
    drawElements: jest.fn(),
    drawArrays: jest.fn(),
    
    viewport: jest.fn(),
    clear: jest.fn(),
    clearColor: jest.fn(),
    
    getExtension: jest.fn().mockReturnValue(null)
  },

  mockEngine: null,
  mockScene: null
};

// Mock canvas getContext to return our mock WebGL context
global.HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation((contextType) => {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return global.babylonUtils.mockWebGLContext;
  }
  return null;
});

// Setup Babylon.js environment before each test
beforeEach(() => {
  const { Engine, Scene } = require('@babylonjs/core');
  
  const mockCanvas = global.testUtils.createMockCanvas();
  global.babylonUtils.mockEngine = new Engine(mockCanvas, true);
  global.babylonUtils.mockScene = new Scene(global.babylonUtils.mockEngine);
});

console.log('✓ Babylon.js test environment setup complete');