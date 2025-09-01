/**
 * Unity WebGL Specific Test Setup
 */

import { jest } from '@jest/globals';

// Mock Unity WebGL runtime
global.Unity = {
  Module: {
    _malloc: jest.fn().mockImplementation((size) => {
      // Mock memory allocation - return a fake pointer
      return Math.floor(Math.random() * 1000000) + 1000000;
    }),
    
    _free: jest.fn(),
    
    // Mock heap arrays
    HEAPF32: new Float32Array(100000), // 400KB of float data
    HEAP8: new Int8Array(400000),      // 400KB of byte data
    HEAPU8: new Uint8Array(400000),
    HEAP16: new Int16Array(200000),
    HEAPU16: new Uint16Array(200000),
    HEAP32: new Int32Array(100000),
    HEAPU32: new Uint32Array(100000),
    
    // Function wrapping utilities
    cwrap: jest.fn().mockImplementation((name, returnType, argTypes) => {
      // Return a mock function that simulates Unity native calls
      return jest.fn().mockReturnValue(returnType === 'number' ? 1 : null);
    }),
    
    ccall: jest.fn().mockImplementation((name, returnType, argTypes, args) => {
      // Simulate Unity function calls
      return returnType === 'number' ? 42 : 'success';
    }),
    
    // Memory management
    getValue: jest.fn(),
    setValue: jest.fn(),
    UTF8ToString: jest.fn().mockImplementation((ptr) => 'mock_string'),
    stringToUTF8: jest.fn(),
    lengthBytesUTF8: jest.fn().mockReturnValue(10)
  },
  
  // Unity instance communication
  SendMessage: jest.fn().mockImplementation((gameObject, method, value) => {
    console.log(`Unity.SendMessage: ${gameObject}.${method}(${value})`);
    return Promise.resolve('success');
  }),
  
  call: jest.fn().mockImplementation((method, ...args) => {
    return Promise.resolve(`${method}_result`);
  })
};

// Mock Unity instance (global unityInstance)
global.unityInstance = {
  Module: global.Unity.Module,
  
  SendMessage: jest.fn().mockImplementation((gameObject, method, value) => {
    // Simulate different response times and success rates
    const responseTime = Math.random() * 10; // 0-10ms
    const shouldSucceed = Math.random() > 0.05; // 95% success rate
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldSucceed) {
          resolve(`${method}_response`);
        } else {
          reject(new Error(`Unity method ${gameObject}.${method} failed`));
        }
      }, responseTime);
    });
  }),
  
  // Unity-specific game objects
  gameObjects: {
    'CC_Game_Body': {
      morphTargetCount: 8,
      influences: new Array(8).fill(0),
      isActive: true
    },
    'CC_Game_Tongue': {
      morphTargetCount: 4,
      influences: new Array(4).fill(0),
      isActive: true
    },
    'MorphTargetController': {
      globalInfluences: new Array(16).fill(0),
      isActive: true
    }
  }
};

// Unity-specific utilities
global.unityUtils = {
  // Simulate Unity object hierarchy
  createMockGameObject: (name, components = []) => ({
    name,
    components,
    isActive: true,
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 }
    }
  }),

  // Mock Unity's morph target data structure
  createMorphTargetData: (targetCount, vertexCount) => ({
    targets: Array.from({ length: targetCount }, (_, i) => ({
      name: `Target_${i}`,
      vertexCount,
      deltaVertices: new Float32Array(vertexCount * 3).map(() => (Math.random() - 0.5) * 0.1),
      influences: 0
    }))
  }),

  // Simulate Unity's component system
  mockComponents: {
    MeshRenderer: jest.fn().mockImplementation(() => ({
      enabled: true,
      material: null
    })),
    
    MeshFilter: jest.fn().mockImplementation(() => ({
      mesh: {
        vertexCount: 1000,
        vertices: new Float32Array(3000),
        normals: new Float32Array(3000),
        uv: new Float32Array(2000)
      }
    })),
    
    SkinnedMeshRenderer: jest.fn().mockImplementation(() => ({
      enabled: true,
      sharedMesh: {
        blendShapeCount: 8,
        vertexCount: 1000
      },
      GetBlendShapeWeight: jest.fn().mockReturnValue(0),
      SetBlendShapeWeight: jest.fn()
    }))
  },

  // Memory allocation helpers
  allocateFloatArray: (count) => {
    const ptr = global.Unity.Module._malloc(count * 4);
    return {
      pointer: ptr,
      size: count * 4,
      floatCount: count
    };
  },

  writeFloatArray: (data, heapOffset) => {
    const heap = global.Unity.Module.HEAPF32;
    const startIndex = heapOffset / 4;
    
    for (let i = 0; i < data.length; i++) {
      heap[startIndex + i] = data[i];
    }
    
    return heapOffset + (data.length * 4);
  },

  // Communication testing helpers
  testCommunicationLatency: async (messageCount = 10) => {
    const latencies = [];
    
    for (let i = 0; i < messageCount; i++) {
      const start = performance.now();
      
      try {
        await global.unityInstance.SendMessage(
          'TestObject',
          'TestMethod',
          `test_message_${i}`
        );
        
        const end = performance.now();
        latencies.push(end - start);
      } catch (error) {
        latencies.push(null); // Failed communication
      }
    }
    
    const validLatencies = latencies.filter(l => l !== null);
    
    return {
      total: messageCount,
      successful: validLatencies.length,
      failed: messageCount - validLatencies.length,
      avgLatency: validLatencies.reduce((sum, l) => sum + l, 0) / validLatencies.length,
      minLatency: Math.min(...validLatencies),
      maxLatency: Math.max(...validLatencies)
    };
  },

  // Frame synchronization helpers
  simulateUnityFrameLoop: (duration, targetFPS = 60) => {
    return new Promise((resolve) => {
      let frameCount = 0;
      const frameTime = 1000 / targetFPS;
      const startTime = Date.now();
      
      const frameLoop = () => {
        frameCount++;
        
        // Simulate Unity's internal frame processing
        const currentTime = Date.now() - startTime;
        
        if (currentTime >= duration) {
          resolve({
            totalFrames: frameCount,
            actualFPS: (frameCount / duration) * 1000,
            targetFPS,
            duration
          });
        } else {
          setTimeout(frameLoop, frameTime);
        }
      };
      
      frameLoop();
    });
  }
};

// Mock Unity's JavaScript bridge callbacks
global.UnityCallbacks = {
  OnMorphTargetStatus: jest.fn(),
  OnAnimationComplete: jest.fn(),
  OnError: jest.fn(),
  OnFrameUpdate: jest.fn()
};

// Setup Unity environment before each test
beforeEach(() => {
  // Reset Unity instance state
  Object.keys(global.unityInstance.gameObjects).forEach(objName => {
    const obj = global.unityInstance.gameObjects[objName];
    obj.influences.fill(0);
    obj.isActive = true;
  });
  
  // Clear callback mocks
  Object.keys(global.UnityCallbacks).forEach(callbackName => {
    global.UnityCallbacks[callbackName].mockClear();
  });
  
  // Reset memory heap
  global.Unity.Module.HEAPF32.fill(0);
  global.Unity.Module.HEAP8.fill(0);
});

// Unity-specific test cleanup
afterEach(() => {
  // Simulate Unity garbage collection
  // In real Unity, this would be automatic
  jest.clearAllTimers();
});

console.log('✓ Unity WebGL test environment setup complete');